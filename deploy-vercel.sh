#!/bin/bash

echo "🚀 Iniciando deploy do CRM no Vercel"
echo "=================================="

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Navegar para o diretório do frontend
cd frontend

echo "📦 Preparando build de produção..."

# Limpar build anterior
rm -rf build

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

# Executar build de produção
echo "🔨 Executando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build executado com sucesso!"
else
    echo "❌ Erro no build. Abortando deploy."
    exit 1
fi

echo ""
echo "🌐 Fazendo deploy no Vercel..."
echo "Siga as instruções na tela para configurar o projeto."
echo ""

# Executar deploy
vercel --prod

echo ""
echo "🎉 Deploy concluído!"
echo "📱 Acesse seu CRM em: https://[seu-projeto].vercel.app"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente no painel do Vercel"
echo "2. Aponte REACT_APP_API_URL para sua API de produção"
echo "3. Configure domínio personalizado (opcional)"