# 🚀 Guía Rápida de Despliegue - Frontend

## 📋 Pre-requisitos

- Node.js 20+
- Docker y Docker Compose
- Backend ejecutándose (ver backend/DEPLOY_STRATEGY.md)

---

## 🔧 Configuración

### 1. Variables de Entorno

El frontend usa diferentes configuraciones según el entorno:

```bash
# Desarrollo (puerto 5050)
cp .env.development .env.local

# Producción local (puerto 8080)  
cp .env.production .env.local
```

### 2. Verificar Configuración

```bash
# Revisar variables activas
npm run dev
# Abre consola del navegador y busca "API Configuration"
```

---

## 🏗️ Build Local

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## 🐳 Despliegue con Docker

### Opción 1: Docker Standalone

```bash
# Build de imagen
docker build -t erp-frontend .

# Run container
docker run -p 80:80 erp-frontend
```

Accede en: http://localhost

### Opción 2: Docker Compose (Recomendado)

El `docker-compose.yml` debe estar en el proyecto backend:

```yaml
# /go-projects/business_management/docker-compose.yml
version: '3.8'

services:
  backend:
    container_name: business_management_backend
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=host.docker.internal
      - DB_PORT=5432
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-business_management_prod}
      - JWT_SECRET=${JWT_SECRET}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  frontend:
    container_name: business_management_frontend
    build:
      context: ../../web-project/erp-webapp
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Ejecutar:**

```bash
# Desde el directorio del backend
cd /home/darthrpm/dev/go-projects/business_management/

# Iniciar todo el sistema
docker-compose up --build

# En modo detached
docker-compose up -d --build
```

**Verificar:**

```bash
# Ver logs
docker-compose logs -f frontend

# Ver estado
docker-compose ps
```

---

## 🔍 Verificación Post-Deploy

### Healthchecks

```bash
# Frontend
curl http://localhost/

# Backend (a través del proxy)
curl http://localhost/api/health

# Backend directo
curl http://localhost:8080/health
```

### Logs

```bash
# Frontend
docker logs business_management_frontend

# Backend
docker logs business_management_backend

# Ambos en tiempo real
docker-compose logs -f
```

---

## 🛠️ Troubleshooting

### Cannot connect to backend

```bash
# 1. Verificar que backend esté corriendo
docker ps | grep backend

# 2. Verificar red de Docker
docker network inspect business_management_default

# 3. Verificar logs del frontend
docker logs business_management_frontend
```

### Error 502 Bad Gateway

```bash
# Verificar que el backend esté respondiendo
curl http://backend:8080/health

# Si falla, reiniciar el backend
docker-compose restart backend
```

### Frontend no actualiza

```bash
# Rebuild sin cache
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## 🧹 Limpieza

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Eliminar imágenes
docker rmi business_management_frontend
docker rmi business_management_backend
```

---

## 📊 Estructura de Red

```
┌─────────────────────────────────────────────────┐
│ Docker Host (tu máquina)                        │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ PostgreSQL                                  │ │
│  │ localhost:5432                              │ │
│  └────────────────────────────────────────────┘ │
│                        ▲                         │
│                        │                         │
│  ┌─────────────────────┼──────────────────────┐ │
│  │ Docker Network      │                      │ │
│  │                     │                      │ │
│  │  ┌──────────────────┴─────────┐           │ │
│  │  │ Backend Container          │           │ │
│  │  │ backend:8080               │◄──────────┼─│─ Nginx Proxy
│  │  └────────────────────────────┘           │ │
│  │                     ▲                      │ │
│  │                     │                      │ │
│  │  ┌──────────────────┴─────────┐           │ │
│  │  │ Frontend Container (Nginx) │           │ │
│  │  │ localhost:80               │◄──────────┼─│─ Navegador
│  │  │ - Static files             │           │ │
│  │  │ - Proxy /api -> backend    │           │ │
│  │  └────────────────────────────┘           │ │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 📝 Checklist Pre-Producción

- [ ] PostgreSQL corriendo en host
- [ ] Variables de entorno configuradas en `.env` del backend
- [ ] `.env.production` verificado en frontend
- [ ] Puertos 80 y 8080 disponibles
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Healthchecks funcionando
- [ ] VITE_AUTO_LOGIN=false en producción
- [ ] Logs sin errores críticos

---

## 🔗 Enlaces Útiles

- Frontend: http://localhost
- Backend (proxy): http://localhost/api
- Backend (directo): http://localhost:8080
- Documentación Backend: [DEPLOY_STRATEGY.md](../../../go-projects/business_management/DEPLOY_STRATEGY.md)
- Configuración Frontend: [FRONTEND_ENV_STRATEGY.md](./FRONTEND_ENV_STRATEGY.md)
