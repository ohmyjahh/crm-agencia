#!/bin/bash

echo "🚀 Iniciando CRM em modo desenvolvimento..."

# Verificar se PostgreSQL está rodando
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Tentando iniciar com Docker..."
    
    if command -v docker-compose &> /dev/null; then
        echo "🐳 Iniciando PostgreSQL via Docker..."
        docker-compose up -d
        echo "⏳ Aguardando PostgreSQL inicializar..."
        sleep 10
    else
        echo "❌ Docker Compose não encontrado."
        echo "📖 Por favor, consulte SETUP.md para instalar PostgreSQL"
        exit 1
    fi
fi

# Configurar backend
echo "🔧 Configurando backend..."
cd backend

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
fi

# Instalar dependências se necessário
if [ ! -d node_modules ]; then
    echo "📦 Instalando dependências do backend..."
    npm install
fi

# Testar conexão com banco
echo "🗄️  Testando conexão com banco..."
npm run check

# Configurar banco se necessário
echo "🏗️  Configurando banco de dados..."
npm run setup:db 2>/dev/null || echo "ℹ️  Banco já configurado ou erro na configuração"

# Iniciar backend em background
echo "🔌 Iniciando backend..."
npm run dev &
BACKEND_PID=$!

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Configurar frontend
echo "🎨 Configurando frontend..."
cd ../frontend

# Instalar dependências se necessário
if [ ! -d node_modules ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

# Iniciar frontend
echo "🌐 Iniciando frontend..."
echo ""
echo "✅ CRM iniciado com sucesso!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:5000"
echo "📧 Login: admin@crm.com"
echo "🔑 Senha: admin123"
echo ""
echo "🛑 Para parar: Ctrl+C"

npm start

# Cleanup ao sair
echo "🧹 Finalizando processos..."
kill $BACKEND_PID 2>/dev/null || true