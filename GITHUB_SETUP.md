# 🚀 Configuração do GitHub

## Opção 1: Via GitHub CLI (se disponível)
```bash
# Instalar GitHub CLI
brew install gh

# Login no GitHub
gh auth login

# Criar repositório
gh repo create crm-agencia --public --description "Sistema CRM para gestão de agência - React + Node.js + SQLite"

# Push inicial
git push -u origin main
```

## Opção 2: Via Interface Web (Manual)

### 1. Criar repositório no GitHub:
1. Acesse: https://github.com/new
2. Nome: `crm-agencia`
3. Descrição: `Sistema CRM para gestão de agência - React + Node.js + SQLite`
4. Público: ✅
5. **NÃO** adicione README, .gitignore ou licença (já temos)
6. Clique em **Create repository**

### 2. Conectar repositório local:
```bash
cd "/Users/rafa/CRM - CLAUDE 1"

# Adicionar origin (substitua 'seu-usuario' pelo seu username GitHub)
git remote add origin https://github.com/seu-usuario/crm-agencia.git

# Verificar remote
git remote -v

# Push inicial
git push -u origin main
```

## ✅ Resultado esperado:
- Repositório criado no GitHub
- Código completo enviado
- README.md bem formatado
- 48 arquivos commitados

## 📋 Estrutura no GitHub:
```
crm-agencia/
├── frontend/           # React + TypeScript
├── backend/           # Node.js + Express
├── README.md          # Documentação principal
├── SETUP.md           # Instruções de instalação
├── start-dev.sh       # Script de inicialização
└── docker-compose.yml # Configuração PostgreSQL
```

## 🔗 URLs importantes:
- **Demo Local:** http://localhost:3000
- **API Local:** http://localhost:3001
- **Login:** admin@crm.com / admin123