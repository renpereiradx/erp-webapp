# 🐳 Dockerización Completa - Sistema ERP

## ✅ Sistema Listo para Dockerizar

Este repositorio ahora incluye toda la configuración necesaria para dockerizar el sistema ERP completo (Backend + Frontend).

---

## 📦 Archivos Creados/Actualizados

### Configuración Docker

- ✅ **`docker-compose.yml`** - Orquestación de servicios (Backend + Frontend)
- ✅ **`Dockerfile`** - Build multi-stage del frontend
- ✅ **`nginx.conf`** - Proxy reverso al backend
- ✅ **`.env.production`** - Variables de entorno para producción

### Scripts de Automatización

- ✅ **`scripts/build-backend.ps1`** - Construye la imagen Docker del backend
- ✅ **`scripts/deploy-full-stack.ps1`** - Despliega todo el stack automáticamente
- ✅ **`scripts/check-status.ps1`** - Verifica el estado del sistema

### Documentación

- ✅ **`DOCKER_QUICK_START.md`** - Guía rápida de uso
- ✅ **`WINDOWS_SETUP_GUIDE.md`** - Guía completa de configuración

---

## 🚀 Despliegue Rápido (3 Pasos)

### Opción A: Script Automatizado (Recomendado)

```powershell
# 1. Asegúrate de que PostgreSQL esté corriendo
# 2. Navega al directorio del frontend
cd C:\dev\erp-project\frontend

# 3. Ejecuta el script de despliegue
.\scripts\deploy-full-stack.ps1
```

**¡Eso es todo!** El script:
- ✅ Verifica todos los requisitos
- ✅ Construye la imagen del backend
- ✅ Construye la imagen del frontend
- ✅ Levanta ambos servicios con Docker Compose
- ✅ Verifica que todo esté funcionando

---

### Opción B: Paso a Paso Manual

#### 1. Construir Backend

```powershell
cd C:\dev\erp-project\backend
docker build -t erp-backend:latest .
```

#### 2. Construir y Levantar todo con Docker Compose

```powershell
cd C:\dev\erp-project\frontend
docker-compose up -d --build
```

#### 3. Verificar Estado

```powershell
.\scripts\check-status.ps1
```

---

## 🎯 Acceso al Sistema

Una vez desplegado:

- **Frontend (Web):** http://localhost:8080
- **Backend (API):** http://localhost:5050
- **Backend vía Proxy:** http://localhost:8080/api

### Credenciales de Prueba

```
Email:    admin
Password: aDmin404942
```

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│         Navegador (Cliente)              │
│         http://localhost:8080            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Docker Container: erp-frontend       │
│     ┌─────────────────────────────┐    │
│     │   Nginx (Puerto 80)          │    │
│     │   ├── Archivos estáticos     │    │
│     │   └── Proxy /api/* →         │    │
│     └─────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ (Red Docker: erp-network)
                  ▼
┌─────────────────────────────────────────┐
│     Docker Container: erp-backend        │
│     ┌─────────────────────────────┐    │
│     │   API Backend (Puerto 5050)  │    │
│     │   ├── Autenticación          │    │
│     │   ├── Lógica de negocio      │    │
│     │   └── Conexión a DB          │    │
│     └─────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ (host.docker.internal)
                  ▼
┌─────────────────────────────────────────┐
│     PostgreSQL (Host - Puerto 5432)      │
│     ├── Database: erp_db                │
│     └── User: dev_user                   │
└─────────────────────────────────────────┘
```

---

## 🔍 Comandos Útiles

### Verificar Estado

```powershell
# Estado completo del sistema
.\scripts\check-status.ps1

# Estado de contenedores
docker-compose ps

# Uso de recursos
docker stats
```

### Ver Logs

```powershell
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Últimas 50 líneas
docker-compose logs --tail=50
```

### Gestión de Servicios

```powershell
# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Reconstruir sin cache
docker-compose build --no-cache
docker-compose up -d

# Actualizar solo frontend
docker-compose up -d --build frontend

# Actualizar solo backend
cd ..\backend
docker build -t erp-backend:latest .
cd ..\frontend
docker-compose restart backend
```

---

## 🐛 Solución de Problemas Comunes

### Backend no conecta a PostgreSQL

```powershell
# Verificar PostgreSQL
Get-Service postgresql*

# Verificar puerto 5432
Test-NetConnection localhost -Port 5432

# Ver logs del backend
docker-compose logs backend
```

### Puerto ya en uso

```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :8080
netstat -ano | findstr :5050

# Matar proceso
taskkill /PID <PID> /F
```

### Imagen del backend no encontrada

```powershell
# Construir imagen manualmente
cd C:\dev\erp-project\backend
docker build -t erp-backend:latest .

# O usar el script
cd C:\dev\erp-project\frontend
.\scripts\build-backend.ps1
```

### Frontend muestra error 502/503

```powershell
# Verificar que backend esté healthy
docker-compose ps

# Ver logs
docker-compose logs backend

# Reiniciar servicios
docker-compose restart
```

---

## 📋 Requisitos del Sistema

### Software Requerido

- ✅ Windows 10/11 (2004 o superior)
- ✅ Docker Desktop con WSL2
- ✅ PostgreSQL 15+ (corriendo en el host)
- ✅ Git
- ✅ PowerShell 5.1+

### Puertos Necesarios

- **5432** - PostgreSQL (host)
- **5050** - Backend API (contenedor)
- **8080** - Frontend Web (contenedor)
- **8443** - HTTPS (opcional)

### Base de Datos Configurada

```sql
-- Debe existir previamente
CREATE DATABASE erp_db;
CREATE USER dev_user WITH PASSWORD 'aDmin404942';
GRANT ALL PRIVILEGES ON DATABASE erp_db TO dev_user;
```

---

## 📝 Configuración de Variables de Entorno

### Backend (docker-compose.yml)

```yaml
environment:
  - PORT=:5050
  - JWT_SECRET=pwdUltraSecreta
  - DB_HOST=host.docker.internal
  - DB_PORT=5432
  - DB_USER=dev_user
  - DB_PASSWORD=aDmin404942
  - DB_NAME=erp_db
```

### Frontend (.env.production)

```env
VITE_API_URL=/api
VITE_API_TIMEOUT=30000
VITE_AUTO_LOGIN=false
VITE_ENV=production
```

**⚠️ Importante:** Para producción real, cambia las contraseñas y secretos por valores seguros.

---

## 🔐 Seguridad

### Para Desarrollo (Actual)

- ✅ Credenciales de prueba simples
- ✅ Auto-login deshabilitado en producción
- ✅ Debug habilitado
- ✅ CORS permisivo

### Para Producción Real

Antes de desplegar a producción:

1. **Cambiar credenciales:**
   - Usuario PostgreSQL
   - Contraseñas de base de datos
   - JWT Secret
   - Credenciales de admin

2. **Configurar HTTPS:**
   - Obtener certificado SSL
   - Actualizar nginx.conf
   - Exponer puerto 8443

3. **Hardening:**
   - Deshabilitar debug
   - Configurar CORS estricto
   - Implementar rate limiting
   - Revisar headers de seguridad

---

## 📚 Documentación Adicional

- **Guía Rápida:** `DOCKER_QUICK_START.md`
- **Configuración Windows:** `WINDOWS_SETUP_GUIDE.md`
- **API Docs:** `docs/API_INTEGRATION.md`
- **Características:** `docs/`

---

## 🆘 Obtener Ayuda

### Verificar Sistema

```powershell
.\scripts\check-status.ps1
```

### Ver Logs Completos

```powershell
docker-compose logs --tail=100 > logs.txt
notepad logs.txt
```

### Acceder a Contenedores

```powershell
# Backend
docker exec -it erp-backend /bin/sh

# Frontend
docker exec -it erp-frontend /bin/sh
```

---

## ✅ Checklist de Verificación

Antes de considerar el despliegue exitoso:

- [ ] Docker Desktop está corriendo
- [ ] PostgreSQL está corriendo en puerto 5432
- [ ] Base de datos `erp_db` existe
- [ ] Usuario `dev_user` tiene permisos
- [ ] Imagen `erp-backend:latest` está construida
- [ ] `docker-compose ps` muestra ambos servicios "healthy"
- [ ] http://localhost:8080 carga la interfaz
- [ ] http://localhost:5050/health responde OK
- [ ] http://localhost:8080/api/health responde OK
- [ ] Login con admin funciona
- [ ] No hay errores en logs

---

## 🎉 Estado Actual

**✅ Sistema completamente configurado y listo para dockerizar**

Ejecuta el script de despliegue para comenzar:

```powershell
.\scripts\deploy-full-stack.ps1
```

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0.0
