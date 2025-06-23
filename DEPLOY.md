# 🚀 Deploy do CRM no Vercel

Este guia explica como fazer o deploy do sistema CRM no Vercel.

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Node.js**: versão 16 ou superior
3. **Git**: para versionamento do código

## 🛠️ Configuração Inicial

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login no Vercel

```bash
vercel login
```

## 🚀 Deploy Automático

### Opção 1: Script Automatizado

Execute o script de deploy:

```bash
./deploy-vercel.sh
```

### Opção 2: Deploy Manual

1. **Navegar para o frontend**:
```bash
cd frontend
```

2. **Build de produção**:
```bash
npm run build
```

3. **Deploy no Vercel**:
```bash
vercel --prod
```

## ⚙️ Configuração de Variáveis de Ambiente

No painel do Vercel, configure as seguintes variáveis:

### Variáveis Obrigatórias

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `REACT_APP_API_URL` | `https://sua-api.com/api` | URL da sua API backend |
| `REACT_APP_ENV` | `production` | Ambiente de produção |

### Variáveis Opcionais

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `GENERATE_SOURCEMAP` | `false` | Desabilita sourcemaps |
| `REACT_APP_CACHE_VERSION` | `1.0.0` | Versão do cache |

## 🌐 Configuração de Domínio

### Domínio Vercel (Gratuito)
- Seu app será acessível em: `https://seu-projeto.vercel.app`

### Domínio Personalizado
1. No painel do Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções

## 🔧 Backend/API

⚠️ **Importante**: O Vercel hospeda apenas o frontend (React).

Para o backend, você tem algumas opções:

### Opção 1: Vercel Functions (Recomendado)
- Crie functions serverless para sua API
- Mantenha a mesma estrutura de rotas

### Opção 2: Serviços Externos
- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **Heroku**: [heroku.com](https://heroku.com)

### Opção 3: VPS/Cloud
- DigitalOcean, AWS, Google Cloud, etc.

## 📊 Monitoramento

O Vercel fornece:
- ✅ Analytics de performance
- ✅ Logs de build e runtime  
- ✅ Métricas de uso
- ✅ Uptime monitoring

## 🔄 Deploy Contínuo

### GitHub Integration
1. Conecte seu repositório GitHub ao Vercel
2. Cada push na branch `main` fará deploy automático
3. Pull requests criam preview deployments

### Configuração Automática
```bash
# No repositório
vercel --confirm
```

## 🛡️ Segurança

### Headers de Segurança
O arquivo `vercel.json` já inclui:
- Cache headers otimizados
- Security headers básicos

### SSL/HTTPS
- ✅ SSL automático habilitado
- ✅ Redirecionamento HTTP → HTTPS
- ✅ Certificados renovados automaticamente

## 📁 Estrutura de Arquivos

```
CRM/
├── frontend/
│   ├── build/          # Build de produção
│   ├── src/            # Código fonte
│   ├── package.json
│   └── vercel.json     # Config do Vercel
├── backend/            # API (deploy separado)
├── vercel.json         # Config raiz
└── deploy-vercel.sh    # Script de deploy
```

## 🐛 Troubleshooting

### Build Falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 em Rotas
- Verifique o arquivo `vercel.json`
- Confirme as configurações de rewrites

### API não Conecta
- Verifique `REACT_APP_API_URL`
- Confirme CORS no backend
- Teste endpoints independentemente

### Performance
- Use `npm run analyze` para analisar bundle
- Otimize imagens e assets
- Configure cache headers

## 📞 Suporte

- **Documentação Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Status**: [vercel-status.com](https://vercel-status.com)

---

🎉 **Parabéns!** Seu CRM está agora online e acessível globalmente via Vercel!