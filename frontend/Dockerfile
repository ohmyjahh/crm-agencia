# Multi-stage build para React
FROM node:18-alpine AS builder

# Instalar dependências necessárias
RUN apk add --no-cache git

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --no-audit --no-fund

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine AS production

# Instalar dependências de segurança
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Copiar build do React
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx-custom
RUN adduser -S nginx-custom -u 1001

# Criar diretórios necessários
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-custom:nginx-custom /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Definir usuário
USER nginx-custom

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]