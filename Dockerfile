# =====================================
# Dockerfile Multi-Stage para Frontend ERP
# =====================================
# Optimizado para producción con Nginx + Proxy al Backend
# Etapa 1: Build de la aplicación React
# Etapa 2: Servir con Nginx

# =========================================
# ETAPA 1: Build
# =========================================
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para cache de Docker)
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.14.0

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente completo
COPY . .

# Copiar archivo de variables de entorno de producción
# Vite usará automáticamente .env.production durante el build
COPY .env.production .env.production

# Build de producción
# Las variables VITE_* se inyectan en tiempo de build
RUN npx vite build

# Verificar que el build fue exitoso
RUN ls -la /app/dist

# =========================================
# ETAPA 2: Producción con Nginx
# =========================================
FROM nginx:stable-alpine

# Metadatos de la imagen
LABEL maintainer="ERP Development Team"
LABEL description="Frontend ERP - React + Vite + Nginx (SPA + proxy /api de origen unico)"
LABEL version="2.0.0"

# Upstream del proxy /api: el hostname del servicio `backend` en compose.
# Se puede sobrescribir en runtime (-e ERP_API_UPSTREAM=...) porque el
# entrypoint oficial de nginx renderiza el template con envsubst.
ENV ERP_API_UPSTREAM=http://backend:8080

# Copiar archivos construidos desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Snippet compartido de la SPA (incluido por el template HTTP y por tls.conf)
COPY nginx/snippets /etc/nginx/snippets

# Config TLS del perfil server: queda INERT en /etc/nginx/tls.conf; el compose
# del perfil server la monta sobre /etc/nginx/conf.d/default.conf.
COPY nginx/tls.conf /etc/nginx/tls.conf

# Template HTTP (perfil laptop / docker run): el entrypoint oficial lo
# renderiza (envsubst de ERP_API_UPSTREAM) a /etc/nginx/conf.d/default.conf.
COPY nginx/templates /etc/nginx/templates

# Directorio inerte para el perfil server: el compose redirige ahí la salida
# del template (NGINX_ENVSUBST_OUTPUT_DIR) porque su default.conf es el mount
# read-only de tls.conf y no debe sobrescribirse.
RUN mkdir -p /etc/nginx/templates-rendered

# Crear directorio para logs (opcional)
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Exponer puerto HTTP (80) y HTTPS (443 si se configura)
EXPOSE 80
EXPOSE 443

# Health check para verificar que Nginx está respondiendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio: Nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]

