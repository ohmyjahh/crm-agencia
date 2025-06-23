const NodeCache = require('node-cache');
const crypto = require('crypto');

class IntelligentCache {
  constructor() {
    // Cache principal com TTL padrão de 10 minutos
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutos
      checkperiod: 120, // verificar expiração a cada 2 minutos
      useClones: false,
      deleteOnExpire: true,
      enableLegacyCallbacks: false,
      maxKeys: 1000 // máximo de 1000 chaves
    });

    // Cache de longa duração para dados que mudam pouco
    this.longTermCache = new NodeCache({
      stdTTL: 3600, // 1 hora
      checkperiod: 300, // verificar a cada 5 minutos
      useClones: false,
      maxKeys: 500
    });

    // Cache de curta duração para dados que mudam frequentemente
    this.shortTermCache = new NodeCache({
      stdTTL: 120, // 2 minutos
      checkperiod: 60, // verificar a cada 1 minuto
      useClones: false,
      maxKeys: 2000
    });

    // Métricas de cache
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0
    };

    // Padrões de cache por tipo de dados
    this.cachePatterns = {
      // Dashboard metrics - cache curto pois muda frequentemente
      dashboard: {
        cache: this.shortTermCache,
        ttl: 120, // 2 minutos
        keys: ['dashboard_metrics', 'task_metrics', 'client_metrics']
      },
      
      // Listas de dados - cache médio
      lists: {
        cache: this.cache,
        ttl: 300, // 5 minutos
        keys: ['clients_list', 'tasks_list', 'services_list', 'projects_list']
      },
      
      // Dados de configuração - cache longo
      config: {
        cache: this.longTermCache,
        ttl: 3600, // 1 hora
        keys: ['payment_methods', 'finance_categories', 'services_catalog']
      },
      
      // Relatórios - cache médio
      reports: {
        cache: this.cache,
        ttl: 600, // 10 minutos
        keys: ['finance_report', 'dre_report', 'client_report']
      }
    };

    this.setupEventListeners();
  }

  /**
   * Configurar listeners para eventos de cache
   */
  setupEventListeners() {
    // Listener para expiração de cache
    this.cache.on('expired', (key, value) => {
      console.log(`🕐 Cache expirado: ${key}`);
    });

    this.shortTermCache.on('expired', (key, value) => {
      console.log(`🕐 Cache curto expirado: ${key}`);
    });

    this.longTermCache.on('expired', (key, value) => {
      console.log(`🕐 Cache longo expirado: ${key}`);
    });

    // Listener para limpeza de cache
    this.cache.on('del', (key, value) => {
      this.metrics.deletes++;
    });
  }

  /**
   * Obter dados do cache
   */
  get(key, options = {}) {
    const { pattern = 'lists' } = options;
    const cacheInstance = this.cachePatterns[pattern]?.cache || this.cache;
    
    const value = cacheInstance.get(key);
    
    if (value !== undefined) {
      this.metrics.hits++;
      console.log(`✅ Cache HIT: ${key}`);
      return value;
    } else {
      this.metrics.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }
  }

  /**
   * Armazenar dados no cache
   */
  set(key, value, options = {}) {
    const { pattern = 'lists', ttl } = options;
    const cacheConfig = this.cachePatterns[pattern] || this.cachePatterns.lists;
    const cacheInstance = cacheConfig.cache;
    const cacheTtl = ttl || cacheConfig.ttl;
    
    const success = cacheInstance.set(key, value, cacheTtl);
    
    if (success) {
      this.metrics.sets++;
      console.log(`💾 Cache SET: ${key} (TTL: ${cacheTtl}s, Pattern: ${pattern})`);
    }
    
    return success;
  }

  /**
   * Remover item do cache
   */
  del(key, options = {}) {
    const { pattern = 'lists' } = options;
    const cacheInstance = this.cachePatterns[pattern]?.cache || this.cache;
    
    const count = cacheInstance.del(key);
    console.log(`🗑️ Cache DEL: ${key} (removidos: ${count})`);
    return count;
  }

  /**
   * Cache com função de fallback
   */
  async getOrSet(key, fetchFunction, options = {}) {
    const { pattern = 'lists', ttl } = options;
    
    // Tentar obter do cache primeiro
    const cached = this.get(key, { pattern });
    if (cached !== null) {
      return cached;
    }
    
    try {
      // Executar função de fallback
      console.log(`🔄 Executando fallback para: ${key}`);
      const result = await fetchFunction();
      
      // Armazenar no cache
      this.set(key, result, { pattern, ttl });
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao executar fallback para ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidar cache por padrão
   */
  invalidatePattern(pattern) {
    const config = this.cachePatterns[pattern];
    if (!config) {
      console.warn(`⚠️ Padrão de cache não encontrado: ${pattern}`);
      return 0;
    }
    
    let totalDeleted = 0;
    
    // Deletar chaves específicas do padrão
    if (config.keys) {
      config.keys.forEach(key => {
        totalDeleted += config.cache.del(key);
      });
    }
    
    this.metrics.invalidations++;
    console.log(`🧹 Invalidação de padrão: ${pattern} (${totalDeleted} chaves removidas)`);
    
    return totalDeleted;
  }

  /**
   * Invalidar cache por prefixo
   */
  invalidateByPrefix(prefix) {
    let totalDeleted = 0;
    
    // Invalidar em todos os caches
    [this.cache, this.shortTermCache, this.longTermCache].forEach(cacheInstance => {
      const keys = cacheInstance.keys();
      const keysToDelete = keys.filter(key => key.startsWith(prefix));
      
      keysToDelete.forEach(key => {
        totalDeleted += cacheInstance.del(key);
      });
    });
    
    this.metrics.invalidations++;
    console.log(`🧹 Invalidação por prefixo: ${prefix} (${totalDeleted} chaves removidas)`);
    
    return totalDeleted;
  }

  /**
   * Gerar chave de cache baseada em parâmetros
   */
  generateKey(base, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    if (paramString) {
      const hash = crypto.createHash('md5').update(paramString).digest('hex').substring(0, 8);
      return `${base}:${hash}`;
    }
    
    return base;
  }

  /**
   * Cache warming - pré-aquecer cache com dados frequentemente acessados
   */
  async warmUp(warmupFunctions = {}) {
    console.log('🔥 Iniciando aquecimento do cache...');
    
    const promises = Object.entries(warmupFunctions).map(async ([key, func]) => {
      try {
        const data = await func();
        this.set(key, data);
        console.log(`✅ Cache aquecido: ${key}`);
      } catch (error) {
        console.error(`❌ Erro ao aquecer cache ${key}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('🔥 Aquecimento do cache concluído');
  }

  /**
   * Limpar todos os caches
   */
  flush() {
    const keys1 = this.cache.keys().length;
    const keys2 = this.shortTermCache.keys().length;
    const keys3 = this.longTermCache.keys().length;
    
    this.cache.flushAll();
    this.shortTermCache.flushAll();
    this.longTermCache.flushAll();
    
    console.log(`🧹 Todos os caches limpos (${keys1 + keys2 + keys3} chaves removidas)`);
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    const stats = {
      metrics: { ...this.metrics },
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      caches: {
        main: {
          keys: this.cache.keys().length,
          stats: this.cache.getStats()
        },
        short: {
          keys: this.shortTermCache.keys().length,
          stats: this.shortTermCache.getStats()
        },
        long: {
          keys: this.longTermCache.keys().length,
          stats: this.longTermCache.getStats()
        }
      }
    };
    
    return stats;
  }

  /**
   * Middleware Express para cache de rotas
   */
  middleware(options = {}) {
    const { 
      pattern = 'lists', 
      ttl,
      keyGenerator = (req) => `route:${req.method}:${req.originalUrl}`,
      shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200
    } = options;
    
    return async (req, res, next) => {
      // Só fazer cache de requisições GET
      if (req.method !== 'GET') {
        return next();
      }
      
      const cacheKey = keyGenerator(req);
      const cached = this.get(cacheKey, { pattern });
      
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
      
      // Interceptar a resposta
      const originalSend = res.send;
      res.send = (body) => {
        if (shouldCache(req, res)) {
          try {
            const data = JSON.parse(body);
            this.set(cacheKey, data, { pattern, ttl });
            res.set('X-Cache', 'MISS');
          } catch (error) {
            // Ignorar erro de parsing JSON
          }
        }
        
        return originalSend.call(res, body);
      };
      
      next();
    };
  }

  /**
   * Estratégias de invalidação automática
   */
  setupAutoInvalidation() {
    return {
      // Invalidar cache de clientes quando há mudanças
      onClientChange: () => {
        this.invalidatePattern('lists');
        this.invalidateByPrefix('clients_');
        this.invalidatePattern('dashboard');
      },
      
      // Invalidar cache de tasks quando há mudanças
      onTaskChange: () => {
        this.invalidatePattern('lists');
        this.invalidateByPrefix('tasks_');
        this.invalidatePattern('dashboard');
      },
      
      // Invalidar cache de finanças quando há mudanças
      onFinanceChange: () => {
        this.invalidatePattern('reports');
        this.invalidateByPrefix('finance_');
        this.invalidatePattern('dashboard');
      },
      
      // Invalidar cache de projetos quando há mudanças
      onProjectChange: () => {
        this.invalidatePattern('lists');
        this.invalidateByPrefix('projects_');
        this.invalidatePattern('dashboard');
      }
    };
  }
}

// Singleton instance
const cacheManager = new IntelligentCache();

module.exports = cacheManager;