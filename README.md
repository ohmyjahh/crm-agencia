# CRM - Sistema de Gestão para Agência

Sistema completo de CRM para gestão de clientes, tarefas da equipe comercial/marketing e controle financeiro.

## 🚀 Tecnologias

### Frontend
- React 18 com TypeScript
- Material-UI (MUI)
- React Router
- Axios

### Backend
- Node.js com Express
- PostgreSQL
- JWT Authentication
- Bcryptjs para hash de senhas

## 📁 Estrutura do Projeto

```
CRM - CLAUDE 1/
├── frontend/           # Aplicação React
├── backend/           # API Node.js
│   ├── src/
│   │   ├── config/    # Configurações (DB, etc)
│   │   ├── controllers/ # Lógica dos endpoints
│   │   ├── middleware/  # Middlewares personalizados
│   │   ├── models/     # Modelos do banco de dados
│   │   ├── routes/     # Definição das rotas
│   │   └── utils/      # Funções utilitárias
└── README.md
```

## 🛠️ Como Executar

### 🚀 Execução Rápida (Recomendado)
```bash
# Na raiz do projeto
./start-dev.sh
```

### 🔧 Execução Manual

#### 1. Configurar PostgreSQL
```bash
# Opção 1: Docker (mais fácil)
docker-compose up -d

# Opção 2: PostgreSQL local (veja SETUP.md)
```

#### 2. Backend
```bash
cd backend
cp .env.example .env  # Configure suas variáveis
npm run setup:db      # Configurar banco
npm run dev          # Iniciar servidor
```

#### 3. Frontend
```bash
cd frontend
npm start            # Iniciar interface
```

## 📋 Funcionalidades Implementadas

- ✅ Estrutura base do projeto
- ✅ Gestão de Usuários e Autenticação
- ✅ Dashboard básico
- ⏳ Gestão de Clientes
- ⏳ Gestão de Tarefas
- ⏳ Controle Financeiro

## 🎯 Acesso ao Sistema

Após iniciar, acesse: **http://localhost:3000**

**Credenciais padrão:**
- Email: `admin@crm.com`
- Senha: `admin123`

## 🔧 Configuração do Banco

1. Instale PostgreSQL
2. Crie um banco de dados chamado `crm_database`
3. Configure as variáveis no arquivo `.env`