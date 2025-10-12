# 🐳 Estrategia de Despliegue con Docker (BD Externa)

## 🎯 **Visión General**

Esta guía describe la estrategia para desplegar el sistema (backend y frontend) utilizando Docker, mientras se mantiene la **base de datos PostgreSQL ejecutándose de forma aislada** en tu máquina local (host).

Este enfoque te da control directo sobre tu base de datos y separa el ciclo de vida de las aplicaciones del de los datos.

---

## **Fase 1: Preparación de la Base de Datos**

Dado que la base de datos correrá fuera de Docker, debemos asegurarnos de que esté lista.

### **1. Backup del Esquema**

Crea un backup "limpio" (solo el esquema) de tu base de datos de desarrollo. Ejecuta este comando en tu terminal (puede pedirte la contraseña del usuario `postgres`).

```bash
pg_dump --schema-only -h localhost -p 5432 -U postgres -d business_management_dev -f backup_schema.sql
```

### **2. Restauración en la Base de Datos de Producción**

Ahora, crea una nueva base de datos para producción y restaura el esquema en ella.

```bash
# 1. Conéctate a psql
psql -U postgres

# 2. Crea la nueva base de datos (ej. business_management_prod)
CREATE DATABASE business_management_prod;

# 3. Sal de psql (\q) y restaura el esquema
psql -U postgres -d business_management_prod -f backup_schema.sql
```

### **3. Asegurar que PostgreSQL esté Corriendo**

**Importante:** Tu servidor local de PostgreSQL debe estar en ejecución y accesible desde la red para que los contenedores de Docker puedan conectarse a él.

---

## **Fase 2: Dockerización de los Servicios**

Los `Dockerfile` para el backend y el frontend no cambian. Son los mismos que en la estrategia anterior.

### **1. Backend (Aplicación Go)**

**`/home/darthrpm/dev/go-projects/business_management/Dockerfile`**
```dockerfile
# --- Stage 1: Build ---
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar dependencias y descargarlas
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main -ldflags="-s -w" ./main.go

# --- Stage 2: Final Image ---
FROM alpine:latest

WORKDIR /app

# Copiar el binario compilado desde el stage 'builder'
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
```

### **2. Frontend (Aplicación Web)**

**`/home/darthrpm/dev/web-project/erp-webapp/Dockerfile`**
```dockerfile
# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## **Fase 3: Orquestación con Docker Compose (Modificado)**

Este es el archivo `docker-compose.yml` actualizado. Se ha eliminado el servicio `db` y el backend ahora se conecta a la base de datos del host.

**`/home/darthrpm/dev/go-projects/business_management/docker-compose.yml`**
```yaml
version: '3.8'

services:
  # --- Servicio del Backend (Go) ---
  backend:
    container_name: business_management_backend
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=host.docker.internal # Host especial para conectar al host local
      - DB_PORT=5432
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-mysecretpassword} # Usa la contraseña de tu BD local
      - DB_NAME=${DB_NAME:-business_management_prod}
      - JWT_SECRET=${JWT_SECRET:-your-super-secret-key}
    # Para Linux, puede que necesites añadir 'extra_hosts' para que host.docker.internal funcione
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  # --- Servicio del Frontend (Nginx) ---
  frontend:
    container_name: business_management_frontend
    build:
      context: ../../web-project/erp-webapp # Ruta relativa al proyecto frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### **Archivo de Entorno (`.env`)**

El archivo `.env` ahora debe contener las credenciales de tu base de datos local.

**`/home/darthrpm/dev/go-projects/business_management/.env`**
```
# Credenciales de tu Base de Datos LOCAL
DB_USER=postgres
DB_PASSWORD=tu_contraseña_local_de_postgres
DB_NAME=business_management_prod

# Secreto para JWT
JWT_SECRET=un-secreto-muy-largo-y-seguro-para-produccion
```

> **Nota sobre `host.docker.internal`:** En Docker para Mac y Windows, `host.docker.internal` resuelve a la IP interna del host. En Linux, se añadió `extra_hosts` al servicio `backend` para habilitar esta funcionalidad.

---

## **Fase 4: Ejecución del Entorno**

1.  **Asegúrate de que tu servidor PostgreSQL local esté corriendo.**
2.  Abre una terminal en la raíz de tu proyecto Go (`/home/darthrpm/dev/go-projects/business_management/`).
3.  Ejecuta Docker Compose:

    ```bash
    docker-compose up --build
    ```

### **¿Qué Sucederá?**

1.  Docker Compose construirá las imágenes para el `backend` y el `frontend`.
2.  Iniciará los dos contenedores.
3.  El contenedor del `backend` se conectará a tu base de datos PostgreSQL que se ejecuta en `localhost`.

**Tu aplicación completa estará corriendo en `http://localhost`**, utilizando la base de datos de tu máquina anfitriona.