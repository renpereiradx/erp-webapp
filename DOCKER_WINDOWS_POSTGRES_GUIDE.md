# 🪟 Guía Docker con PostgreSQL en Windows

## 📋 Arquitectura del Sistema

- **Frontend:** React + Vite + Nginx (puerto 8080)
- **Backend:** Go API (puerto 5050)
- **PostgreSQL:** Ejecutándose **nativamente en Windows** en `C:\Program Files\PostgreSQL\16\bin`
- **Conexión:** Contenedores Docker → `host.docker.internal` → Windows Host

---

## 🔧 Configuración de PostgreSQL en Windows

### 1. Verificar que PostgreSQL está corriendo

```powershell
# Verificar servicio de PostgreSQL
Get-Service postgresql*

# Si no está corriendo, iniciarlo
Start-Service postgresql-x64-16
```

### 2. Configurar PostgreSQL para aceptar conexiones desde Docker

Editar `C:\Program Files\PostgreSQL\16\data\postgresql.conf`:

```conf
# Permitir conexiones desde cualquier IP
listen_addresses = '*'
```

Editar `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`:

```conf
# Permitir conexiones desde red Docker (172.17.0.0/16)
host    all             all             172.17.0.0/16           md5

# Permitir conexiones desde localhost
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### 3. Reiniciar PostgreSQL

```powershell
Restart-Service postgresql-x64-16
```

---

## 🐳 Configuración de Docker

### docker-compose.yml

El backend está configurado para conectarse a PostgreSQL usando `host.docker.internal`:

```yaml
backend:
  environment:
    - DATABASE_URL=host=host.docker.internal port=5432 user=dev_user password=aDmin404942 dbname=erp_db sslmode=disable
    - DB_HOST=host.docker.internal
    - DB_PORT=5432
    - DB_USER=dev_user
    - DB_PASSWORD=aDmin404942
    - DB_NAME=erp_db
```

**Importante:** `host.docker.internal` es un hostname especial que Docker usa para referirse al host de Windows desde dentro del contenedor.

---

## 🚀 Despliegue

### 1. Verificar PostgreSQL

```powershell
# Verificar que PostgreSQL está corriendo
Get-Service postgresql-x64-16

# Probar conexión local
psql -U dev_user -d erp_db -h localhost
```

### 2. Levantar contenedores

```powershell
# Ir al directorio del proyecto
cd c:\dev\erp-project\frontend

# Levantar contenedores
docker-compose up -d

# Verificar estado
docker-compose ps
```

### 3. Verificar logs del backend

```powershell
docker logs erp-backend --tail 50
```

Deberías ver:
```
2025/10/12 19:26:22 Starting server on port:  :5050
```

### 4. Probar endpoints

```powershell
# Health check del backend
curl http://localhost:5050/health
# Respuesta: {"status":"healthy"}

# Frontend
curl http://localhost:8080/
# Respuesta: HTML del frontend

# API a través del proxy
curl http://localhost:8080/api/health
```

---

## 🔍 Diagnóstico

### Verificar conectividad desde el contenedor

```powershell
# Entrar al contenedor del backend
docker exec -it erp-backend sh

# Dentro del contenedor, probar conexión a PostgreSQL
wget --spider http://host.docker.internal:5432
# O instalar postgresql-client y probar:
# apk add postgresql-client
# psql -h host.docker.internal -U dev_user -d erp_db
```

### Ver logs detallados

```powershell
# Logs del backend
docker logs -f erp-backend

# Logs del frontend
docker logs -f erp-frontend

# Logs de todos los contenedores
docker-compose logs -f
```

### Problemas comunes

#### ❌ Backend no puede conectarse a PostgreSQL

**Error:** `connection refused` o `timeout`

**Solución:**
1. Verificar que PostgreSQL está corriendo: `Get-Service postgresql-x64-16`
2. Verificar que `postgresql.conf` tiene `listen_addresses = '*'`
3. Verificar que `pg_hba.conf` permite conexiones desde `172.17.0.0/16`
4. Reiniciar PostgreSQL: `Restart-Service postgresql-x64-16`
5. Verificar firewall de Windows permite conexiones al puerto 5432

#### ❌ Puerto 5050 ya está en uso

**Error:** `bind: Only one usage of each socket address`

**Solución:**
```powershell
# Encontrar proceso usando el puerto
netstat -ano | Select-String ":5050"

# Detener el proceso (reemplazar PID con el número encontrado)
Stop-Process -Id <PID> -Force
```

#### ❌ Docker Desktop no está corriendo

**Error:** `error during connect: open //./pipe/dockerDesktopLinuxEngine`

**Solución:**
```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 15
docker info
```

---

## 📊 Estado del Sistema

Después del despliegue, deberías ver:

```powershell
docker-compose ps
```

```
NAME           IMAGE                COMMAND                  SERVICE    STATUS
erp-backend    erp-backend:latest   "./erp-backend"          backend    Up (healthy)
erp-frontend   frontend-frontend    "/docker-entrypoint.…"   frontend   Up (healthy)
```

---

## 🔄 Comandos útiles

```powershell
# Detener contenedores
docker-compose down

# Reiniciar contenedores
docker-compose restart

# Reconstruir imágenes
docker-compose build --no-cache

# Ver logs
docker-compose logs -f

# Ejecutar comando en contenedor
docker exec -it erp-backend sh
docker exec -it erp-frontend sh

# Limpiar volúmenes y redes huérfanas
docker-compose down -v
docker system prune -a
```

---

## ✅ Verificación Final

1. **PostgreSQL:** `Get-Service postgresql-x64-16` → Running
2. **Docker:** `docker-compose ps` → 2 contenedores healthy
3. **Backend:** `curl http://localhost:5050/health` → 200 OK
4. **Frontend:** `curl http://localhost:8080/` → 200 OK
5. **Base de datos:** El backend responde con "Authorization header missing" en endpoints protegidos (significa que está conectado a la DB)

---

## 📝 Notas Importantes

- **No usar WSL:** PostgreSQL está en Windows nativo, no en WSL
- **host.docker.internal:** Es la forma correcta de conectarse desde Docker a servicios en Windows
- **Firewall:** Asegúrate de que Windows Firewall permite conexiones al puerto 5432
- **IP dinámica:** A diferencia de WSL, la IP de `host.docker.internal` es manejada automáticamente por Docker
- **Performance:** PostgreSQL nativo en Windows puede tener mejor performance que en WSL para algunos casos de uso

---

## 🎯 Próximos Pasos

1. Configurar variables de entorno en archivos `.env` para diferentes entornos
2. Implementar backups automáticos de la base de datos
3. Configurar HTTPS con certificados SSL
4. Implementar CI/CD con GitHub Actions
5. Configurar monitoreo y alertas con Prometheus/Grafana
