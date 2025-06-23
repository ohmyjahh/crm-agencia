#!/bin/bash

echo "🚀 Deploy CRM Backend no Railway"
echo "================================"

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

echo "📁 Navegando para o diretório backend..."
cd backend

echo "🔧 Preparando arquivos de produção..."

# Backup do .env atual se existir
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backup do .env criado"
fi

# Usar .env de produção
cp .env.production .env
echo "✅ Configuração de produção ativada"

echo "📦 Testando build local..."
npm install --production

echo "🌐 Fazendo deploy no Railway..."
echo "⚠️  IMPORTANTE: Faça login quando solicitado!"
echo ""

# Deploy no Railway
railway login
railway init
railway up

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Copie a URL da API que apareceu acima"
echo "2. Configure no Vercel: REACT_APP_API_URL"
echo "3. Teste o sistema completo"
echo ""
echo "🔗 Manage: railway.app/dashboard"