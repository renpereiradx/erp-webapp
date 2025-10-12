# 🌍 Estrategia de Configuración de Entornos - Frontend

## 📋 Descripción General

Esta estrategia permite que la aplicación frontend funcione en diferentes entornos (desarrollo, producción, Docker) sin cambios en el código, utilizando únicamente variables de entorno.

---

## 🎯 Objetivos

1. **Flexibilidad**: Cambiar entre entornos sin modificar código
2. **Seguridad**: Mantener configuraciones sensibles fuera del repositorio
3. **Alineación**: Sincronización con la estrategia de backend (Docker)
4. **Simplicidad**: Configuración clara y fácil de mantener

---

## 📁 Archivos de Configuración

### Jerarquía de Variables de Entorno

Vite carga los archivos `.env` en este orden de prioridad (mayor a menor):

1. `.env.[mode].local` (ej: `.env.production.local`) - **Mayor prioridad**
2. `.env.[mode]` (ej: `.env.production`)
3. `.env.local`
4. `.env` (si existe)

### Archivos Disponibles

| Archivo | Uso | Git | Descripción |
|---------|-----|-----|-------------|
| `.env.example` | 📖 Template | ✅ Sí | Plantilla con todas las variables disponibles |
| `.env.development` | 🔧 Desarrollo | ✅ Sí | Configuración para desarrollo local |
| `.env.production` | 🚀 Producción | ✅ Sí | Configuración para producción/Docker |
| `.env.local` | 👤 Personal | ❌ No | Overrides locales (ignorado por git) |

---

## 🔧 Configuración por Entorno

### Desarrollo Local (puerto 5050)

**Archivo**: `.env.development`

```bash
VITE_API_URL=http://localhost:5050
VITE_AUTO_LOGIN=true
VITE_API_TIMEOUT=10000
VITE_ENV=development
```

**Comando**: `npm run dev`

### Producción/Docker (puerto 8080)

**Archivo**: `.env.production`

```bash
VITE_API_URL=http://localhost:8080
VITE_AUTO_LOGIN=false
VITE_API_TIMEOUT=15000
VITE_ENV=production
```

**Comando**: `npm run build`

### Overrides Personales

**Archivo**: `.env.local` (crear si no existe)

```bash
# Ejemplo: usar backend en otro servidor
VITE_API_URL=http://192.168.1.100:5050
```

Este archivo tiene la **máxima prioridad** y no se sube a git.

---

## 🐳 Integración con Docker

### Estrategia Backend (del attachment)

Según `DEPLOY_STRATEGY.md` del backend:

- Backend corre en puerto `8080` dentro de Docker
- Frontend corre en puerto `80` dentro de Docker
- Base de datos PostgreSQL corre **fuera** de Docker en el host

### Configuración Frontend para Docker

Cuando construyas la imagen Docker del frontend:

```dockerfile
# En el Dockerfile (ya existe según DEPLOY_STRATEGY.md)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite automáticamente usará .env.production
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración Nginx para Proxy

Para que el frontend en Docker pueda comunicarse con el backend, necesitas configurar Nginx como proxy reverso.

**Archivo**: `nginx.conf` (crear en la raíz del proyecto frontend)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Servir archivos estáticos del frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para las peticiones a la API
    location /api/ {
        proxy_pass http://backend:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Luego actualiza el Dockerfile para usar esta configuración:

```dockerfile
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Y actualiza `.env.production`:

```bash
# Usar /api como prefijo, Nginx lo redirige al backend
VITE_API_URL=/api
```

---

## 📊 Matriz de Configuración

| Escenario | API URL | Auto-Login | Timeout | Comando |
|-----------|---------|------------|---------|---------|
| Dev Local | `http://localhost:5050` | ✅ Sí | 10s | `npm run dev` |
| Build Producción | `http://localhost:8080` | ❌ No | 15s | `npm run build` |
| Docker Compose | `/api` (proxy nginx) | ❌ No | 15s | Build en Dockerfile |
| Test Local | Override en `.env.local` | Configurable | Configurable | Cualquiera |

---

## 🚀 Comandos Útiles

### Desarrollo

```bash
# Iniciar con configuración de desarrollo
npm run dev

# Build con configuración de desarrollo (útil para debug)
vite build --mode development
```

### Producción

```bash
# Build optimizado para producción
npm run build

# Preview del build de producción
npm run preview
```

### Docker

```bash
# Build de imagen Docker (usa .env.production automáticamente)
docker build -t erp-frontend .

# Run container local
docker run -p 80:80 erp-frontend

# Con Docker Compose (desde directorio backend)
docker-compose up --build
```

---

## 🔍 Verificación

### Verificar qué variables están activas

Agrega temporalmente en tu código (ej: `main.jsx`):

```javascript
console.log('🌍 Entorno:', import.meta.env.VITE_ENV);
console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
console.log('🔐 Auto-login:', import.meta.env.VITE_AUTO_LOGIN);
console.log('⏱️ Timeout:', import.meta.env.VITE_API_TIMEOUT);
```

### Verificar en build de producción

```bash
npm run build
npm run preview
# Abre http://localhost:4173 y revisa la consola
```

---

## ⚠️ Importante

1. **Prefijo VITE_**: Solo variables con prefijo `VITE_` son accesibles en el frontend
2. **Reinicio**: Cambios en `.env` requieren reiniciar `npm run dev`
3. **Build**: Cada build "congela" las variables, no son dinámicas post-build
4. **Seguridad**: Nunca incluir tokens/secretos en variables `VITE_*` (son públicas)
5. **Git**: `.env.local` está en `.gitignore`, úsalo para configs personales

---

## 🔄 Flujo de Despliegue

```mermaid
graph TD
    A[Código Frontend] --> B{Entorno?}
    B -->|Desarrollo| C[npm run dev]
    B -->|Producción| D[npm run build]
    C --> E[.env.development]
    D --> F[.env.production]
    E --> G[http://localhost:5050]
    F --> H[Docker Build]
    H --> I[Nginx + Proxy]
    I --> J[/api -> backend:8080]
    J --> K[PostgreSQL en host]
```

---

## 📝 Checklist Pre-Deploy

Antes de desplegar a producción:

- [ ] `.env.production` tiene la URL correcta del backend
- [ ] `VITE_AUTO_LOGIN=false` en producción
- [ ] `nginx.conf` configurado correctamente
- [ ] Dockerfile actualizado con nginx.conf
- [ ] Variables sensibles NO están en archivos `.env` del repo
- [ ] Probado con `npm run build && npm run preview`
- [ ] Docker Compose actualizado en el backend
- [ ] PostgreSQL corriendo en el host
- [ ] Puertos 80 y 8080 disponibles

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- ✅ Verifica que el backend esté corriendo en el puerto correcto
- ✅ Revisa `VITE_API_URL` en las herramientas de desarrollador
- ✅ Si usas Docker, verifica que los servicios puedan comunicarse

### "Auto-login not working"
- ✅ Verifica `VITE_AUTO_LOGIN=true` en tu archivo `.env`
- ✅ Reinicia el servidor de desarrollo
- ✅ Limpia caché del navegador

### "Variables not updating"
- ✅ Reinicia el servidor de desarrollo
- ✅ Verifica el prefijo `VITE_`
- ✅ Revisa el orden de prioridad de archivos `.env`

---

## 📚 Referencias

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Backend Deploy Strategy](../../../go-projects/business_management/DEPLOY_STRATEGY.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
