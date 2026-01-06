# 🚀 Guía Rápida de Despliegue Docker

## ✅ Pre-requisitos

Antes de comenzar, asegúrate de tener:

- ✅ Docker Desktop instalado y corriendo
- ✅ PostgreSQL instalado y corriendo en `localhost:5432`
- ✅ Base de datos `erp_db` creada con usuario `dev_user`
- ✅ Backend clonado en `C:\dev\erp-project\backend`
- ✅ Frontend clonado en `C:\dev\erp-project\frontend`

---

## 🎯 Opción 1: Despliegue Automático (Recomendado)

### Script Todo-en-Uno

Este script construye y despliega automáticamente todo el stack:

```powershell
cd C:\dev\erp-project\frontend
.\scripts\deploy-full-stack.ps1
```

**Parámetros opcionales:**

```powershell
# Usar imagen del backend ya construida (omitir construcción)
.\scripts\deploy-full-stack.ps1 -SkipBackendBuild

# Forzar reconstrucción completa sin cache
.\scripts\deploy-full-stack.ps1 -Rebuild

# Especificar rutas personalizadas
.\scripts\deploy-full-stack.ps1 -BackendPath "D:\mi-backend" -FrontendPath "D:\mi-frontend"
```

---

## 🔨 Opción 2: Despliegue Manual Paso a Paso

### Paso 1: Construir imagen del Backend

```powershell
cd C:\dev\erp-project\backend
docker build -t erp-backend:latest .
```

**O usa el script:**

```powershell
cd C:\dev\erp-project\frontend
.\scripts\build-backend.ps1
```

### Paso 2: Verificar imagen del Backend

```powershell
docker images erp-backend
```

Deberías ver:

```
REPOSITORY     TAG       IMAGE ID       CREATED          SIZE
erp-backend    latest    xxxxxxxxxxxx   X seconds ago    XXX MB
```

### Paso 3: Desplegar con Docker Compose

```powershell
cd C:\dev\erp-project\frontend
docker-compose up -d --build
```

### Paso 4: Verificar servicios

```powershell
docker-compose ps
```

Deberías ver ambos contenedores corriendo:

```
NAME            STATUS                   PORTS
erp-backend     Up (healthy)             0.0.0.0:5050->5050/tcp
erp-frontend    Up (healthy)             0.0.0.0:8080->80/tcp
```

---

## 🔍 Verificar el Despliegue

### 1. Verificar Backend

```powershell
# Verificar endpoint de salud
curl http://localhost:5050/health

# O en PowerShell
Invoke-WebRequest -Uri "http://localhost:5050/health"
```

### 2. Verificar Frontend

```powershell
# Abrir en navegador
start http://localhost:8080

# O verificar con curl
curl http://localhost:8080
```

### 3. Verificar Proxy API

```powershell
# El frontend debe poder acceder al backend vía /api
curl http://localhost:8080/api/health
```

---

## 📊 Monitoreo y Logs

### Ver logs de todos los servicios

```powershell
docker-compose logs -f
```

### Ver logs de un servicio específico

```powershell
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend
```

### Ver últimas líneas de logs

```powershell
docker-compose logs --tail=50
```

### Ver estado de contenedores

```powershell
docker-compose ps
```

### Ver uso de recursos

```powershell
docker stats
```

---

## 🔧 Comandos de Mantenimiento

### Reiniciar servicios

```powershell
# Reiniciar todos
docker-compose restart

# Reiniciar uno específico
docker-compose restart backend
docker-compose restart frontend
```

### Detener servicios

```powershell
docker-compose down
```

### Detener y eliminar volúmenes

```powershell
docker-compose down -v
```

### Reconstruir sin cache

```powershell
docker-compose build --no-cache
docker-compose up -d
```

### Actualizar código y redesplegar

```powershell
# 1. Detener servicios
docker-compose down

# 2. Pull cambios
git pull

# 3. Reconstruir y levantar
docker-compose up -d --build
```

---

## 🐛 Solución de Problemas

### Problema: Backend no puede conectar a PostgreSQL

**Síntoma:** Logs muestran "connection refused" o "cannot connect to database"

**Solución:**

```powershell
# 1. Verificar que PostgreSQL esté corriendo
Get-Service postgresql*

# 2. Verificar que el puerto esté abierto
Test-NetConnection localhost -Port 5432

# 3. Verificar configuración en docker-compose.yml
# Debe usar: host.docker.internal en lugar de localhost
```

### Problema: Puerto ya en uso

**Síntoma:** Error "port is already allocated"

**Solución:**

```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :8080
netstat -ano | findstr :5050

# Matar proceso si es necesario
taskkill /PID <PID> /F

# O cambiar puerto en docker-compose.yml
```

### Problema: Imagen del backend no encontrada

**Síntoma:** Error "image not found: erp-backend:latest"

**Solución:**

```powershell
# Construir la imagen primero
cd C:\dev\erp-project\backend
docker build -t erp-backend:latest .
```

### Problema: Frontend muestra error 502/503

**Síntoma:** Frontend carga pero API no responde

**Solución:**

```powershell
# 1. Verificar que backend esté healthy
docker-compose ps

# 2. Ver logs del backend
docker-compose logs backend

# 3. Verificar configuración de Nginx
docker exec -it erp-frontend cat /etc/nginx/conf.d/default.conf
```

### Problema: Cambios en código no se reflejan

**Síntoma:** Modificaste código pero sigue viendo versión antigua

**Solución:**

```powershell
# Reconstruir sin cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔐 Credenciales de Acceso

### Aplicación Web

- **URL:** http://localhost:8080
- **Email:** `admin`
- **Password:** `aDmin404942`

### PostgreSQL

- **Host:** `localhost`
- **Puerto:** `5432`
- **Database:** `erp_db`
- **Usuario:** `dev_user`
- **Password:** `aDmin404942`

### Acceso a Contenedores

```powershell
# Backend
docker exec -it erp-backend /bin/sh

# Frontend
docker exec -it erp-frontend /bin/sh

# PostgreSQL (si está en Docker)
docker exec -it postgres-erp psql -U dev_user -d erp_db
```

---

## 📦 Estructura de Archivos Importante

```
C:\dev\erp-project\
├── backend/
│   ├── Dockerfile              # ← Debe existir
│   ├── .env (opcional)
│   └── ... (código del backend)
│
└── frontend/
    ├── docker-compose.yml      # ← Configuración de servicios
    ├── Dockerfile              # ← Build del frontend
    ├── nginx.conf              # ← Proxy al backend
    ├── .env.production         # ← Variables de producción
    └── scripts/
        ├── build-backend.ps1   # ← Script de construcción
        └── deploy-full-stack.ps1  # ← Script de despliegue
```

---

## 🚀 Flujo de Trabajo Recomendado

### Para Desarrollo Diario

```powershell
# 1. Arrancar servicios
docker-compose up -d

# 2. Ver logs si necesitas debug
docker-compose logs -f

# 3. Trabajar en tu código...

# 4. Si cambias backend, reconstruir
cd ..\backend
docker build -t erp-backend:latest .
cd ..\frontend
docker-compose restart backend

# 5. Si cambias frontend, reconstruir
docker-compose up -d --build frontend

# 6. Al terminar (opcional)
docker-compose down
```

### Para Despliegue a Producción

```powershell
# 1. Pull últimos cambios
git pull

# 2. Usar script automatizado
.\scripts\deploy-full-stack.ps1 -Rebuild

# 3. Verificar estado
docker-compose ps
docker-compose logs --tail=100

# 4. Probar en navegador
start http://localhost:8080
```

---

## 📞 Ayuda Adicional

- **Documentación completa:** Ver `WINDOWS_SETUP_GUIDE.md`
- **Documentación Docker:** https://docs.docker.com/
- **Documentación Docker Compose:** https://docs.docker.com/compose/

---

## ✅ Checklist de Verificación Final

Antes de dar por finalizado el despliegue:

- [ ] `docker-compose ps` muestra ambos servicios como "healthy"
- [ ] http://localhost:8080 carga la interfaz
- [ ] http://localhost:5050/health responde OK
- [ ] http://localhost:8080/api/health responde OK (proxy funciona)
- [ ] Login con credenciales admin funciona
- [ ] No hay errores en `docker-compose logs`
- [ ] PostgreSQL está accesible desde el backend
- [ ] Frontend puede hacer peticiones al backend

---

**¡Listo! Tu sistema ERP debería estar corriendo completamente dockerizado. 🎉**
