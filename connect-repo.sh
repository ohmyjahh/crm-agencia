#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Erro: URL do repositório não fornecida"
    echo ""
    echo "📝 Uso: ./connect-repo.sh https://github.com/SEU-USUARIO/crm-agencia.git"
    echo ""
    echo "💡 Para obter a URL:"
    echo "1. Vá para seu repositório no GitHub"
    echo "2. Clique no botão verde 'Code'"
    echo "3. Copie a URL HTTPS"
    exit 1
fi

REPO_URL="$1"

echo "🔗 Conectando repositório local ao GitHub..."
echo "📍 URL: $REPO_URL"
echo ""

# Adicionar remote origin
echo "📌 Adicionando remote origin..."
git remote add origin "$REPO_URL"

# Verificar remote
echo "✅ Remote configurado:"
git remote -v

echo ""
echo "📤 Enviando código para GitHub..."

# Push para GitHub
if git push -u origin main; then
    echo ""
    echo "🎉 Sucesso! Repositório criado e código enviado!"
    echo ""
    echo "🔗 Seu repositório está disponível em:"
    echo "   $REPO_URL"
    echo ""
    echo "📊 Resumo do que foi enviado:"
    echo "   - 48 arquivos"
    echo "   - Sistema CRM completo"
    echo "   - Frontend React + Backend Node.js"
    echo "   - Documentação completa"
    echo ""
    echo "🎯 Para clonar em outro lugar:"
    echo "   git clone $REPO_URL"
    echo ""
    echo "🌐 Para acessar o demo:"
    echo "   cd crm-agencia"
    echo "   ./start-dev.sh"
    echo "   http://localhost:3000 (admin@crm.com / admin123)"
else
    echo ""
    echo "❌ Erro no push. Verifique:"
    echo "1. Se a URL está correta"
    echo "2. Se você tem permissão de escrita no repositório"
    echo "3. Se seu GitHub está configurado corretamente"
    echo ""
    echo "💡 Para debug:"
    echo "   git remote -v"
    echo "   git status"
fi