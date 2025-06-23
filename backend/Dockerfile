# Multi-stage build para otimizar tamanho da imagem
FROM node:18-alpine AS builder

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    openssl-dev

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Mudar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema para produção
RUN apk add --no-cache \
    sqlite \
    openssl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar node_modules do estágio de build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código fonte
COPY --chown=nodejs:nodejs . .

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/uploads /app/database && \
    chown -R nodejs:nodejs /app/logs /app/uploads /app/database

# Criar diretório para backups
RUN mkdir -p /app/backups && \
    chown -R nodejs:nodejs /app/backups

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Variáveis de ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Definir usuário
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Comando de inicialização
CMD ["npm", "start"]