# 🔧 Guía de Preparación del Backend

## 📍 Ubicación del Backend

Si el backend está en:
```
c:\dev\erp-project\backend\
```

## 🏗️ Preparación del Backend

### Paso 1: Navegar al directorio del backend
```powershell
cd ..\backend
```

### Paso 2: Verificar cambios recientes
```powershell
# Pull de cambios
git pull origin main

# Ver cambios
git log --oneline -10
```

### Paso 3: Compilar el backend (si aplica)

#### Para Backend en Go:
```powershell
# Build del binario
go build -o erp-backend.exe ./cmd/server

# O usar go run durante desarrollo
go run ./cmd/server
```

#### Para Backend en Node.js:
```powershell
# Instalar dependencias
npm install

# O con pnpm
pnpm install

# Build (si aplica)
npm run build
```

### Paso 4: Crear Dockerfile del backend (si no existe)

#### Ejemplo para Go:
```dockerfile
# Dockerfile para Backend Go
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar go.mod y go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fuente
COPY . .

# Build del binario
RUN CGO_ENABLED=0 GOOS=linux go build -o erp-backend ./cmd/server

# Imagen final
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copiar binario desde builder
COPY --from=builder /app/erp-backend .

# Puerto
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5050/health || exit 1

# Ejecutar
CMD ["./erp-backend"]
```

#### Ejemplo para Node.js:
```dockerfile
# Dockerfile para Backend Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Build (si aplica)
RUN npm run build

# Imagen final
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5050/health || exit 1

CMD ["node", "dist/index.js"]
```

### Paso 5: Build de la imagen Docker del backend
```powershell
# Desde el directorio del backend
docker build -t erp-backend:latest .

# Verificar la imagen
docker images erp-backend:latest
```

### Paso 6: Probar el backend localmente (opcional)
```powershell
# Ejecutar contenedor de prueba
docker run -d `
  --name erp-backend-test `
  -p 5050:5050 `
  -e DATABASE_URL="host=host.docker.internal port=5432 user=dev_user password=aDmin404942 dbname=erp_db sslmode=disable" `
  erp-backend:latest

# Verificar que funciona
curl http://localhost:5050/health

# Detener prueba
docker stop erp-backend-test
docker rm erp-backend-test
```

### Paso 7: Volver al frontend
```powershell
cd ..\frontend
```

---

## 🔍 Verificación del Backend

### Verificar que el backend está actualizado
```powershell
# En el directorio del backend
git status
git log -1
```

### Verificar variables de entorno necesarias
El backend típicamente necesita:
- `PORT` o `PORT=:5050`
- `DATABASE_URL` o variables separadas (`DB_HOST`, `DB_PORT`, etc.)
- `JWT_SECRET`
- Otras variables específicas de tu aplicación

### Verificar endpoint de health
```powershell
# Si el backend está corriendo localmente
curl http://localhost:5050/health

# Debe retornar algo como:
# {"status": "ok"} o {"healthy": true}
```

---

## 📝 Configuración en docker-compose.yml

El backend está configurado en `docker-compose.yml` del frontend:

```yaml
backend:
  image: erp-backend:latest
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
```

**Asegúrate de actualizar**:
- Credenciales de base de datos
- JWT_SECRET (usar un secret seguro)
- Cualquier otra variable de entorno necesaria

---

## 🐛 Troubleshooting Backend

### El backend no compila
```powershell
# Ver errores detallados
go build -v ./cmd/server

# O para Node.js
npm run build -- --verbose
```

### El backend no se conecta a PostgreSQL
```powershell
# Verificar que PostgreSQL acepta conexiones externas
# Ver postgresql.conf y pg_hba.conf

# Probar conexión manual
psql -h localhost -U dev_user -d erp_db

# Desde Docker, probar host.docker.internal
docker run --rm -it postgres:15 psql -h host.docker.internal -U dev_user -d erp_db
```

### La imagen Docker es muy grande
```bash
# Ver tamaño
docker images erp-backend:latest

# Optimizar usando multi-stage builds
# Ver ejemplos de Dockerfile arriba
```

### El backend no pasa health check
```powershell
# Verificar que el endpoint /health existe y funciona
curl http://localhost:5050/health

# Ver logs del contenedor
docker logs erp-backend

# Verificar dentro del contenedor
docker exec -it erp-backend sh
wget -O- http://localhost:5050/health
```

---

## ✅ Checklist del Backend

Antes de desplegar, verificar:

- [ ] Backend actualizado (git pull)
- [ ] Código compila sin errores
- [ ] Dockerfile existe
- [ ] Imagen `erp-backend:latest` construida
- [ ] Variables de entorno configuradas en docker-compose.yml
- [ ] Credenciales de DB correctas
- [ ] JWT_SECRET configurado
- [ ] Endpoint /health funciona
- [ ] Backend se conecta a PostgreSQL
- [ ] Sin errores en logs

---

## 🔄 Si el Backend ya está Dockerizado

Si ya tienes una imagen del backend disponible:

### Opción 1: Usar imagen existente
```powershell
# Simplemente verificar que existe
docker images | Select-String "erp-backend"

# Si existe, el docker-compose la usará
```

### Opción 2: Pull desde registry (si aplica)
```powershell
# Si está en un registry
docker pull your-registry/erp-backend:latest
docker tag your-registry/erp-backend:latest erp-backend:latest
```

### Opción 3: Skip backend build
```powershell
# Al ejecutar el script de despliegue
.\deploy-production.ps1 -SkipBackend
```

---

## 📚 Documentación del Backend

Asegúrate de que el backend tenga:
- README.md con instrucciones de setup
- Documentación de API endpoints
- Variables de entorno documentadas
- Guía de deployment

---

## 🆘 Si No Puedes Acceder al Backend

Si el directorio del backend está en otra ubicación o no tienes acceso:

### Opción 1: Usar imagen pre-existente
```powershell
# Verificar si la imagen ya existe
docker images erp-backend

# Continuar con el despliegue
.\deploy-production.ps1 -SkipBackend
```

### Opción 2: Correr backend sin Docker
```powershell
# Actualizar docker-compose.yml para que no inicie el backend
# Correr backend manualmente en localhost:5050

# Luego desplegar solo frontend
docker-compose up -d erp-system
```

### Opción 3: Pedir la imagen Docker
```powershell
# Solicitar al equipo la imagen:
# docker save erp-backend:latest > erp-backend.tar

# Cargar la imagen:
docker load < erp-backend.tar

# Verificar
docker images erp-backend:latest
```

---

## 🔐 Seguridad

### Variables Sensibles
⚠️ **IMPORTANTE**: No commitear al repositorio:
- Contraseñas de base de datos
- JWT secrets
- API keys
- Certificados

### Recomendaciones
- Usar variables de entorno
- Usar Docker secrets en producción
- Rotar JWT_SECRET periódicamente
- Usar HTTPS en producción

---

## 🎯 Siguientes Pasos

Una vez preparado el backend:

1. Volver al directorio frontend
```powershell
cd ..\frontend
```

2. Ejecutar el script de despliegue
```powershell
.\deploy-production.ps1
```

El script se encargará de:
- ✅ Construir el frontend
- ✅ Crear imagen Docker del frontend
- ✅ Verificar imagen del backend
- ✅ Iniciar ambos servicios
- ✅ Verificar que todo funciona

---

¡Backend listo! Continúa con el despliegue del frontend. 🚀
