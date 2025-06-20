#!/bin/bash

echo "🚀 Criando repositório GitHub para CRM..."
echo ""
echo "📋 Informações do repositório:"
echo "  Nome: crm-agencia"
echo "  Descrição: Sistema CRM para gestão de agência - React + Node.js + SQLite"
echo "  Tipo: Público"
echo ""

# Abrir GitHub no navegador
echo "🌐 Abrindo GitHub no navegador..."
open "https://github.com/new?name=crm-agencia&description=Sistema+CRM+para+gestão+de+agência+-+React+%2B+Node.js+%2B+SQLite"

echo ""
echo "📝 Instruções:"
echo "1. No navegador que abriu:"
echo "   - Nome: crm-agencia (já preenchido)"
echo "   - Descrição: já preenchida"
echo "   - Marque como: Público"
echo "   - NÃO adicione README, .gitignore ou licença"
echo "   - Clique em 'Create repository'"
echo ""
echo "2. Depois, copie a URL do repositório (algo como: https://github.com/SEU-USUARIO/crm-agencia.git)"
echo ""
echo "3. Execute o próximo script com sua URL:"
echo "   ./connect-repo.sh https://github.com/SEU-USUARIO/crm-agencia.git"
echo ""
echo "Pressione ENTER para continuar..."
read

echo "✅ Repositório criado! Agora execute connect-repo.sh com sua URL"