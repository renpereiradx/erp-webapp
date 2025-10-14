# 🐳 Dockerización Completa - Sistema ERP

## ✅ Sistema Completamente Dockerizado

Este repositorio incluye toda la configuración necesaria para dockerizar el sistema ERP completo (Backend + Frontend).

### Nombres de Imágenes y Contenedores

- **Imagen del Frontend**: `erp-frontend:latest`
- **Contenedor del Frontend**: `erp-system`
- **Imagen del Backend**: `erp-backend:latest`
- **Contenedor del Backend**: `erp-backend`

---

## 📦 Archivos Creados/Actualizados

### Configuración Docker

- ✅ **`docker-compose.yml`** - Orquestación de servicios (Backend + Frontend)
- ✅ **`Dockerfile`** - Build multi-stage del frontend
- ✅ **`nginx.conf`** - Proxy reverso al backend
- ✅ **`.env.production`** - Variables de entorno para producción

### Scripts de Automatización PowerShell

#### Scripts Individuales
- ✅ **`docker-build.ps1`** - Construye la imagen del frontend (erp-frontend:latest)
- ✅ **`docker-run.ps1`** - Ejecuta el contenedor (erp-system)
- ✅ **`docker-stop.ps1`** - Detiene el contenedor
- ✅ **`docker-logs.ps1`** - Ver logs del contenedor
- ✅ **`docker-clean.ps1`** - Limpiar recursos Docker

#### Scripts Docker Compose
- ✅ **`docker-compose-up.ps1`** - Inicia el stack completo
- ✅ **`docker-compose-down.ps1`** - Detiene el stack completo

### Documentación

- ✅ **`DOCKER_QUICK_START.md`** - Guía rápida de uso
- ✅ **`WINDOWS_SETUP_GUIDE.md`** - Guía completa de configuración

---

## 🚀 Despliegue Rápido

### Opción A: Solo Frontend (Scripts PowerShell)

```powershell
# 1. Construir la imagen
.\docker-build.ps1

# 2. Ejecutar el contenedor
.\docker-run.ps1

# 3. Verificar logs
.\docker-logs.ps1
```

### Opción B: Stack Completo con Docker Compose

```powershell
# 1. Asegúrate de que PostgreSQL esté corriendo y que la imagen del backend exista
# 2. Inicia el stack completo
.\docker-compose-up.ps1

# 3. Verifica el estado
docker-compose ps
```

### Opción C: Comandos Docker Manuales

```powershell
# 1. Construir la imagen del frontend
docker build -t erp-frontend:latest .

# 2. Ejecutar el contenedor
docker run -d --name erp-system -p 8080:80 -p 8443:443 --add-host host.docker.internal:host-gateway erp-frontend:latest

# 3. Ver logs
docker logs erp-system
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
│   Docker Container: erp-system           │
│   Imagen: erp-frontend:latest            │
│     ┌─────────────────────────────┐    │
│     │   Nginx (Puerto 80)          │    │
│     │   ├── Archivos estáticos     │    │
│     │   └── Proxy /api/* →         │    │
│     └─────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ (Red Docker: erp-network)
                  ▼
┌─────────────────────────────────────────┐
│   Docker Container: erp-backend          │
│   Imagen: erp-backend:latest             │
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
# Estado del contenedor frontend
docker ps -f name=erp-system

# Estado del stack completo
docker-compose ps

# Health check del frontend
docker inspect erp-system --format='{{.State.Health.Status}}'

# Uso de recursos
docker stats erp-system
```

### Ver Logs

```powershell
# Solo frontend (Script)
.\docker-logs.ps1
.\docker-logs.ps1 -Follow  # Seguir en tiempo real

# Solo frontend (Docker)
docker logs erp-system
docker logs -f erp-system  # Seguir en tiempo real

# Todos los servicios (Docker Compose)
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f erp-system

# Últimas 50 líneas
docker logs --tail=50 erp-system
```

### Gestión de Servicios

```powershell
# Gestión del Frontend (Scripts)
.\docker-stop.ps1           # Detener
.\docker-run.ps1            # Iniciar
.\docker-clean.ps1          # Limpiar recursos

# Gestión del Frontend (Docker)
docker stop erp-system      # Detener
docker start erp-system     # Iniciar
docker restart erp-system   # Reiniciar
docker rm erp-system        # Eliminar contenedor
docker rmi erp-frontend:latest  # Eliminar imagen

# Gestión del Stack Completo (Docker Compose)
docker-compose restart      # Reiniciar servicios
docker-compose down         # Detener servicios
.\docker-compose-down.ps1   # Script para detener

# Reconstruir sin cache
docker build --no-cache -t erp-frontend:latest .
.\docker-run.ps1

# Reconstruir con Docker Compose
docker-compose build --no-cache
docker-compose up -d

# Actualizar solo frontend
docker-compose up -d --build erp-system

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
cd C:\dev\erp-project\frontend
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
# Frontend
docker exec -it erp-system sh

# Ver archivos del build
docker exec -it erp-system ls -la /usr/share/nginx/html

# Ver configuración de Nginx
docker exec -it erp-system cat /etc/nginx/conf.d/default.conf

# Backend
docker exec -it erp-backend /bin/sh
```

---

## ✅ Checklist de Verificación

Antes de considerar el despliegue exitoso:

- [ ] Docker Desktop está corriendo
- [ ] PostgreSQL está corriendo en puerto 5432 (para Docker Compose)
- [ ] Base de datos `erp_db` existe (para Docker Compose)
- [ ] Usuario `dev_user` tiene permisos (para Docker Compose)
- [ ] Imagen `erp-frontend:latest` está construida
- [ ] Imagen `erp-backend:latest` está construida (para Docker Compose)
- [ ] Contenedor `erp-system` está corriendo
- [ ] `docker ps -f name=erp-system` muestra el contenedor "healthy"
- [ ] http://localhost:8080 carga la interfaz
- [ ] http://localhost:5050/health responde OK (si usas Docker Compose)
- [ ] http://localhost:8080/api/health responde OK (si usas Docker Compose)
- [ ] Login con admin funciona
- [ ] No hay errores en `.\docker-logs.ps1`

---

## 🎉 Estado Actual

**✅ Sistema completamente dockerizado y listo para usar**

### Inicio Rápido

```powershell
# Solo Frontend
.\docker-build.ps1
.\docker-run.ps1

# Stack Completo
.\docker-compose-up.ps1
```

### Documentación Completa

Ver **[DOCKER_GUIA_RAPIDA.md](./DOCKER_GUIA_RAPIDA.md)** para documentación detallada en español.

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0.0
