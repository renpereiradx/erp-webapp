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
LABEL description="Frontend ERP - React + Vite + Nginx con proxy al backend"
LABEL version="1.0.0"

# Copiar archivos construidos desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx con proxy al backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

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

