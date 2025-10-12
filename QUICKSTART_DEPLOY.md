# 🚀 Quick Start - Deployment Guide

## ⚡ TL;DR - Desplegar en 3 comandos

```bash
./validate-config.sh        # 1. Validar configuración
./build-and-deploy.sh       # 2. Build y deploy automático
docker-compose logs -f      # 3. Ver logs
```

---

## 📋 Checklist Visual

### Pre-requisitos

```text
✅ Node.js 20+ instalado
✅ pnpm instalado
✅ Docker y Docker Compose instalados
✅ Backend corriendo (puerto 5050)
✅ PostgreSQL corriendo y accesible
```

### Archivos necesarios

```text
✅ .env.production existe
✅ nginx.conf configurado
✅ Dockerfile presente
✅ docker-compose.yml presente
```

---

## 🎯 Deployment Workflow

### Opción 1: Automatizado (Recomendado) ⚡

```bash
# 1-liner para validar y deployar
./validate-config.sh && ./build-and-deploy.sh
```

### Opción 2: Manual 🔧

```bash
# Paso 1: Validar
./validate-config.sh

# Paso 2: Build
pnpm install
pnpm build

# Paso 3: Docker
docker-compose up --build -d

# Paso 4: Verificar
curl http://localhost/              # Frontend
curl http://localhost/api/health    # Backend via proxy
```

---

## 🔍 Verificación Rápida

### Verificar que todo funciona

```bash
# ✅ Contenedores corriendo
docker-compose ps

# ✅ Frontend accesible
curl -I http://localhost/

# ✅ API proxy funcional
curl http://localhost/api/health

# ✅ Sin errores en logs
docker-compose logs frontend | grep -i error
docker-compose logs backend | grep -i error

# ✅ Conectividad entre contenedores
docker exec business_management_frontend wget -O- http://backend:5050/health
```

---

## 🐛 Troubleshooting Express

### 502 Bad Gateway

```bash
# Diagnóstico rápido
docker-compose ps                    # ¿Backend corriendo?
curl http://localhost:5050/health    # ¿Backend responde directamente?
docker-compose restart backend       # Reiniciar backend
```

### Variables de entorno no se aplican

```bash
# Las variables VITE_* se inyectan en BUILD TIME
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### CORS Errors

```bash
# Verificar que VITE_API_URL=/api en .env.production
cat .env.production | grep VITE_API_URL

# Debe ser: VITE_API_URL=/api (NO localhost:5050)
```

---

## 📐 Arquitectura en 30 segundos

### Desarrollo Local

```text
Browser → Vite (5173) → Backend (localhost:5050)
```

### Producción Docker

```text
Browser → Nginx (80) → [Archivos estáticos | /api/* → Backend (5050)]
```

---

## 🔧 Configuración Clave

### .env.production

```bash
VITE_API_URL=/api              # ← CRUCIAL: Usar /api, no localhost
VITE_AUTO_LOGIN=false          # ← SEGURIDAD: Deshabilitar auto-login
VITE_API_TIMEOUT=30000         # ← Timeout para producción
```

### nginx.conf

```nginx
location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass http://backend:5050;  # ← Nombre debe coincidir con docker-compose
}
```

### docker-compose.yml

```yaml
services:
  backend:
    ports: ["5050:5050"]           # ← Puerto del backend
  frontend:
    ports: ["80:80"]               # ← Puerto del frontend
    depends_on: [backend]
    networks: [erp-network]        # ← Red compartida
```

---

## 🚦 Estado de Servicios

### Ver estado

```bash
docker-compose ps
```

### Iniciar/Detener

```bash
docker-compose up -d      # Iniciar
docker-compose down       # Detener
docker-compose restart    # Reiniciar
```

### Ver logs

```bash
docker-compose logs -f              # Todos los servicios
docker-compose logs -f frontend     # Solo frontend
docker-compose logs -f backend      # Solo backend
```

---

## 📚 Documentación Completa

- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Resumen completo de la estrategia
- **[docs/development/FRONTEND_DEPLOY_GUIDE.md](./docs/development/FRONTEND_DEPLOY_GUIDE.md)** - Guía detallada
- **[.env.example](./.env.example)** - Template de variables

---

## ☎️ Ayuda Rápida

```bash
# Comando útil para debugging
docker-compose logs --tail=50 -f

# Ver configuración compilada de docker-compose
docker-compose config

# Reconstruir todo desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0
