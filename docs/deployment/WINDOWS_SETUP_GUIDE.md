# 🚀 Guía de Configuración ERP - Entorno Windows

## 📋 Información General

Esta guía proporciona los pasos detallados para configurar y ejecutar la aplicación ERP completa (frontend + backend) en un entorno Windows, incluyendo la configuración de PostgreSQL y la construcción de contenedores Docker.

**Versión:** 1.0.0  
**Fecha:** Octubre 2025  
**Compatibilidad:** Windows 10/11, Docker Desktop, WSL2

---

## 📋 Checklist de Requisitos

### ✅ Requisitos Obligatorios

- [ ] **Windows 10/11** (versión 2004 o superior recomendada)
- [ ] **WSL2** habilitado (para mejor compatibilidad con Docker)
- [ ] **Docker Desktop** instalado y ejecutándose
- [ ] **Git** instalado
- [ ] **Node.js 20+** instalado
- [ ] **PostgreSQL** instalado y configurado

### ✅ Requisitos Opcionales (Recomendados)

- [ ] **Visual Studio Code** con extensiones de Docker y Dev Containers
- [ ] **Git Bash** o **PowerShell** actualizado
- [ ] **Windows Terminal** para mejor experiencia

---

## 🐳 Instalación y Configuración de Docker Desktop

### Paso 1: Descargar e Instalar Docker Desktop

1. Ve a [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Descarga la versión para Windows
3. Ejecuta el instalador como administrador
4. Reinicia tu computadora si es necesario

### Paso 2: Verificar Instalación

```powershell
# Abrir PowerShell como administrador y ejecutar:
docker --version
docker-compose --version
```

**Salida esperada:**

```bash
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
```

### Paso 3: Configurar WSL2 (Recomendado)

```powershell
# Verificar que WSL2 esté habilitado
wsl --list --verbose

# Si no está instalado, ejecutar:
wsl --install
wsl --set-default-version 2
```

### Paso 4: Configuración de Docker Desktop

1. Abre Docker Desktop
2. Ve a **Settings** → **Resources** → **WSL Integration**
3. Habilita la integración con tu distribución WSL2
4. Aumenta la memoria RAM asignada a al menos 4GB
5. Reinicia Docker Desktop

---

## 🐘 Instalación y Configuración de PostgreSQL

### Opción 1: PostgreSQL Nativo (Recomendado)

#### Paso 1: Descargar e Instalar

1. Ve a [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Descarga la versión más reciente (15.x o superior)
3. Ejecuta el instalador
4. **Importante:** Memoriza la contraseña del usuario `postgres`

#### Paso 2: Configurar Variables de Entorno

```powershell
# Abrir PowerShell como administrador y ejecutar:
# Agregar PostgreSQL al PATH (ajusta la versión según tu instalación)
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
setx PATH "$env:Path" /M

# Verificar instalación
psql --version
```

#### Paso 3: Crear Base de Datos y Usuario

```sql
-- Abrir pgAdmin o psql y ejecutar:

-- Crear usuario para la aplicación
CREATE USER dev_user WITH PASSWORD 'aDmin404942';

-- Crear base de datos
CREATE DATABASE erp_db OWNER dev_user;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE erp_db TO dev_user;

-- Crear usuario admin (opcional, para testing)
-- La aplicación usa email: "admin", password: "aDmin404942"
-- Asegúrate de que exista un usuario con email='admin' en tu tabla users
```

#### Paso 4: Verificar Conexión

```powershell
# Probar conexión desde PowerShell
psql -h localhost -U dev_user -d erp_db
# Ingresa la contraseña: aDmin404942
```

### Opción 2: PostgreSQL con Docker

```powershell
# Crear contenedor PostgreSQL
docker run --name postgres-erp `
  -e POSTGRES_USER=dev_user `
  -e POSTGRES_PASSWORD=aDmin404942 `
  -e POSTGRES_DB=erp_db `
  -p 5432:5432 `
  -d postgres:15-alpine

# Verificar que esté corriendo
docker ps
```

---

## 📥 Clonación de Repositorios

### Paso 1: Crear Directorio de Trabajo

```powershell
# Crear directorio para los proyectos
mkdir C:\dev\erp-project
cd C:\dev\erp-project
```

### Paso 2: Clonar Repositorios

```powershell
# Clonar frontend (este repositorio)
git clone https://github.com/renpereiradx/erp-webapp.git frontend

# Clonar backend (ajusta la URL según tu repositorio)
git clone https://github.com/tu-organizacion/erp-backend.git backend

# Verificar estructura
tree /F
```

---

## ⚙️ Configuración del Backend

### Paso 1: Instalar Dependencias del Backend

```powershell
cd backend

# Si usa Go:
go mod download

# Si usa Node.js:
npm install

# Si usa Maven/Gradle:
mvn install
# o
gradle build
```

### Paso 2: Configurar Variables de Entorno del Backend

Crea el archivo `.env` en la carpeta del backend:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev_user
DB_PASSWORD=aDmin404942
DB_NAME=erp_db

# Puerto del servidor
PORT=:5050

# JWT Secret
JWT_SECRET=pwdUltraSecreta

# Entorno
ENV=development
```

### Paso 3: Ejecutar Migraciones de Base de Datos

```powershell
# Dependiendo del framework usado:

# Si usa Go con migrate:
migrate -path ./migrations -database "postgres://dev_user:aDmin404942@localhost:5432/erp_db?sslmode=disable" up

# Si usa scripts SQL manuales:
psql -h localhost -U dev_user -d erp_db -f ./migrations/init.sql

# Si usa ORM (ej: GORM, Prisma):
# Ejecutar el comando correspondiente de tu framework
```

### Paso 4: Crear Usuario Admin

Asegúrate de que exista un usuario con email "admin" en la base de datos:

```sql
-- Ejecutar en PostgreSQL
INSERT INTO users (email, password, role_id, created_at, updated_at)
VALUES (
  'admin',
  '$2a$10$encrypted_password_hash', -- Hash de "aDmin404942"
  1, -- role_id para admin
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

### Paso 5: Construir Imagen Docker del Backend

```powershell
# Desde el directorio del backend
docker build -t erp-backend:latest .
```

---

## 🎨 Configuración del Frontend

### Paso 1: Instalar Dependencias del Frontend

```powershell
cd ../frontend

# Instalar dependencias con pnpm (recomendado)
npm install -g pnpm
pnpm install
```

### Paso 2: Configurar Variables de Entorno del Frontend

Copia y configura los archivos de entorno:

```powershell
# Copiar template
copy .env.example .env.development

# Editar .env.development
notepad .env.development
```

**Contenido de `.env.development`:**

```env
# API Backend
VITE_API_URL=http://localhost:5050

# Timeout de API
VITE_API_TIMEOUT=10000

# Auto-login para desarrollo
VITE_AUTO_LOGIN=true

# Entorno
VITE_ENV=development
VITE_DEBUG=true
```

**Contenido de `.env.production` (para Docker):**

```env
# API Backend (proxy inverso)
VITE_API_URL=/api

# Timeout de API
VITE_API_TIMEOUT=30000

# Auto-login DESHABILITADO en producción
VITE_AUTO_LOGIN=false

# Entorno
VITE_ENV=production
VITE_DEBUG=false
```

### Paso 3: Verificar Configuración del Frontend

```powershell
# Ejecutar validación
./validate-config.sh

# Si no existe el script, verificar manualmente:
type .env.development
type .env.production
```

---

## 🐳 Construcción de Contenedores

### Paso 1: Preparar Docker Compose

Ve al directorio del frontend y edita `docker-compose.yml`:

```yaml
version: "3.8"

services:
  # =========================================
  # FRONTEND - React + Nginx
  # =========================================
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: erp-frontend
    ports:
      - "8080:80"
      - "8443:443" # HTTPS si se configura
    environment:
      - NODE_ENV=production
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - erp-network
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # =========================================
  # BACKEND - API
  # =========================================
  backend:
    image: erp-backend:latest  # Imagen que construiste anteriormente
    container_name: erp-backend
    ports:
      - "5050:5050"
    environment:
      - PORT=:5050
      - JWT_SECRET=pwdUltraSecreta
      - DATABASE_URL=host=host.docker.internal port=5432 user=dev_user password=aDmin404942 dbname=erp_db sslmode=disable
      - DB_HOST=host.docker.internal
      - DB_PORT=5432
      - DB_USER=dev_user
      - DB_PASSWORD=aDmin404942
      - DB_NAME=erp_db
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - erp-network
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:5050/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  erp-network:
    driver: bridge
```

### Paso 2: Construir y Ejecutar Contenedores

```powershell
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Paso 3: Verificar Servicios

```powershell
# Ver estado de contenedores
docker-compose ps

# Verificar conectividad
curl http://localhost:8080/              # Frontend
curl http://localhost:8080/api/health    # Backend via proxy
```

---

## 🔧 Desarrollo Local (Sin Docker)

### Opción 1: Desarrollo Completo

```powershell
# Terminal 1: Backend
cd backend
# Ejecutar comando de tu framework (go run, npm start, etc.)

# Terminal 2: Frontend
cd frontend
pnpm run dev
```

### Opción 2: Solo Frontend (Backend Remoto)

```powershell
cd frontend

# Configurar .env.development para backend remoto
# VITE_API_URL=http://tu-servidor-remoto:5050

pnpm run dev
```

---

## 🐛 Solución de Problemas

### Problema: PostgreSQL no conecta desde Docker

**Síntoma:** Backend no puede conectar a la base de datos

**Solución:**

```powershell
# Verificar que PostgreSQL esté corriendo
netstat -ano | findstr :5432

# Permitir conexiones desde Docker
# En pg_hba.conf agregar:
# host    all             all             172.17.0.0/16           md5

# Reiniciar PostgreSQL
net stop postgresql-x64-15
net start postgresql-x64-15
```

### Problema: Error de permisos en WSL2

**Síntoma:** Docker no puede acceder a archivos

**Solución:**

```powershell
# Cambiar permisos de archivos
icacls "C:\dev\erp-project" /grant "Users:(OI)(CI)F" /T

# O usar WSL para desarrollo
wsl
cd /mnt/c/dev/erp-project
```

### Problema: Puerto 8080 ocupado

**Síntoma:** Error "port already in use"

**Solución:**

```powershell
# Cambiar puerto en docker-compose.yml
ports:
  - "8081:80"  # Cambiar 8080 por 8081

# O encontrar qué proceso usa el puerto
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Problema: Build falla en Windows

**Síntoma:** Errores de línea de comandos

**Solución:**

```powershell
# Usar PowerShell en lugar de CMD
# Asegurar que los scripts .sh sean ejecutables
# Convertir scripts a .ps1 si es necesario
```

---

## 🔒 Consideraciones de Seguridad

### Para Producción

1. **Cambiar contraseñas por defecto:**
   - Usuario PostgreSQL: `dev_user` → nombre personalizado
   - Contraseña: `aDmin404942` → contraseña segura
   - JWT Secret: `pwdUltraSecreta` → secreto aleatorio

2. **Configurar SSL/HTTPS:**
   - Obtener certificado SSL
   - Configurar Nginx con HTTPS
   - Actualizar `VITE_API_URL` si es necesario

3. **Variables de entorno sensibles:**
   - Nunca commitear `.env` con datos reales
   - Usar Docker secrets o servicios de configuración

### Para Desarrollo

1. **Auto-login habilitado solo localmente**
2. **Debug logs activados**
3. **CORS configurado para desarrollo**

---

## 📊 Monitoreo y Logs

### Ver Logs de Contenedores

```powershell
# Todos los servicios
docker-compose logs -f

# Solo frontend
docker-compose logs -f frontend

# Solo backend
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100
```

### Monitoreo de Recursos

```powershell
# Uso de recursos
docker stats

# Espacio en disco
docker system df

# Limpiar contenedores no usados
docker system prune -a
```

---

## 🚀 Despliegue en Producción

### Checklist Final

- [ ] PostgreSQL configurado y corriendo
- [ ] Backend construido y probado
- [ ] Frontend configurado con `VITE_API_URL=/api`
- [ ] Contenedores construidos exitosamente
- [ ] Servicios levantados y saludables
- [ ] Login funcionando con credenciales admin
- [ ] HTTPS configurado (opcional)

### Comandos de Producción

```powershell
# Desplegar
docker-compose up -d --build

# Actualizar
docker-compose pull
docker-compose up -d

# Backup de base de datos
pg_dump -h localhost -U dev_user erp_db > backup.sql
```

---

## 📞 Soporte y Contacto

### Recursos de Ayuda

- **Documentación Frontend:** `./docs/`
- **Documentación Backend:** Ver repo del backend
- **Issues:** Crear issue en el repositorio correspondiente
- **Docker Docs:** [https://docs.docker.com/](https://docs.docker.com/)

### Comandos Útiles de Debugging

```powershell
# Ver configuración de Docker Compose
docker-compose config

# Ejecutar comandos en contenedor
docker exec -it erp-frontend /bin/sh
docker exec -it erp-backend /bin/sh

# Ver variables de entorno
docker exec erp-frontend env
docker exec erp-backend env

# Reiniciar servicios
docker-compose restart
```

---

## 📝 Notas Importantes

1. **Rutas de archivos:** Usa `/` en lugar de `\` en archivos de configuración
2. **Permisos:** Ejecuta comandos como administrador cuando sea necesario
3. **Firewall:** Asegura que Docker pueda acceder a PostgreSQL
4. **WSL2:** Recomendado para mejor performance con Docker
5. **Backups:** Realiza backups regulares de la base de datos

---

## 🎉 Configuración completada

Tu aplicación ERP debería estar ejecutándose en `http://localhost:8080`

**Credenciales de prueba:**

- **Email:** `admin`
- **Password:** `aDmin404942`
