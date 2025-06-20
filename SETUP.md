# 🚀 Configuração do Banco de Dados

## Opção 1: PostgreSQL Local (Recomendado para produção)

### macOS
```bash
# Instalar PostgreSQL via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Criar banco e usuário
createdb crm_database
psql crm_database
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres createdb crm_database
sudo -u postgres createuser -s crm_user
sudo -u postgres psql -c "ALTER USER crm_user PASSWORD 'crm_password';"
```

## Opção 2: PostgreSQL via Docker (Recomendado para desenvolvimento)

```bash
# Instalar Docker Desktop primeiro
# Depois executar:
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

## Opção 3: PostgreSQL.app (macOS - Mais simples)

1. Baixe em: https://postgresapp.com/
2. Instale e inicie
3. Crie o banco:
   ```bash
   createdb crm_database
   ```

---

## 📋 Após instalar o PostgreSQL:

1. **Configurar .env** (já criado):
   ```bash
   cd backend
   cat .env  # Verificar configurações
   ```

2. **Executar setup do banco:**
   ```bash
   npm run setup:db
   ```

3. **Testar conexão:**
   ```bash
   npm run test:db
   ```

4. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

## 🔑 Credenciais padrão:
- **Admin:** admin@crm.com
- **Senha:** admin123
- **Banco:** crm_database
- **Usuário DB:** crm_user
- **Senha DB:** crm_password