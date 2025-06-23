#!/bin/bash

echo "🚀 Iniciando CRM - Sistema Completo"
echo "===================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Verificar portas
if check_port 3001; then
    echo "⚠️  Porta 3001 já está em uso. Parando processo..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if check_port 3000; then
    echo "⚠️  Porta 3000 já está em uso. Parando processo..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo ""
echo "📦 Verificando dependências..."

# Instalar dependências do backend se necessário
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

# Instalar dependências do frontend se necessário
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Instalando dependências do frontend..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🗄️  Configurando banco de dados..."

# Configurar banco de dados
cd backend && npm run setup:sqlite && cd ..

echo ""
echo "🚀 Iniciando serviços..."

# Iniciar backend em background
echo "🔧 Iniciando servidor backend (porta 3001)..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
sleep 5

# Verificar se backend iniciou corretamente
if check_port 3001; then
    echo "✅ Backend iniciado com sucesso!"
else
    echo "❌ Falha ao iniciar backend"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando interface frontend (porta 3000)..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

# Aguardar frontend inicializar
echo "⏳ Aguardando frontend inicializar..."
sleep 10

# Verificar se frontend iniciou corretamente
if check_port 3000; then
    echo "✅ Frontend iniciado com sucesso!"
else
    echo "❌ Falha ao iniciar frontend"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 CRM Sistema iniciado com sucesso!"
echo "======================================"
echo ""
echo "🌐 Acesse o sistema em: http://localhost:3000"
echo "🔧 API Backend: http://localhost:3001"
echo ""
echo "👤 Credenciais de acesso:"
echo "   Email: admin@crm.com"
echo "   Senha: admin123"
echo ""
echo "📋 Funcionalidades implementadas:"
echo "   ✅ Dashboard"
echo "   ✅ Gestão de Clientes"  
echo "   ✅ Gestão de Tarefas"
echo "   ✅ Gestão de Produtos"
echo "   ✅ Sistema de Follow-up"
echo "   ✅ Controle Financeiro"
echo ""
echo "ℹ️  Para parar os serviços, pressione Ctrl+C"
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Serviços parados com sucesso!"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

# Manter script rodando
wait