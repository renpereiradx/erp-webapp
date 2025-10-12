# 📦 Resumen de Estrategia de Deployment

Este documento resume la estrategia completa de deployment del frontend ERP, alineada con la estrategia del backend.

---

## 🎯 Objetivo

Crear un sistema de deployment **flexible** que permita:

1. ✅ Desarrollo local con backend en `localhost:5050`
2. ✅ Producción con Docker usando proxy de Nginx a `/api`
3. ✅ Transición suave entre entornos mediante variables de entorno
4. ✅ Automatización del proceso de deployment

---

## 📐 Arquitectura de Deployment

### Desarrollo Local

```
┌─────────────────────────────────────────────────────────┐
│                    DESARROLLO                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Browser → Vite Dev Server (5173)                       │
│                     ↓                                     │
│              API Calls (fetch)                           │
│                     ↓                                     │
│            Backend (localhost:5050)                      │
│                                                           │
└─────────────────────────────────────────────────────────┘

Variables: VITE_API_URL=http://localhost:5050
```

### Producción Docker

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Cliente → Nginx:80 (Frontend)                          │
│              ↓                ↓                           │
│         Static Files     /api/* (proxy)                 │
│              ↓                ↓                           │
│         dist/           Backend:5050                     │
│                              ↓                            │
│                         API Response                     │
│                                                           │
└─────────────────────────────────────────────────────────┘

Variables: VITE_API_URL=/api
Proxy: Nginx rewrites /api/* → backend:5050/*
```

---

## 🔧 Configuración por Entorno

### 📋 Variables de Entorno

| Variable | Desarrollo | Producción | Propósito |
|----------|-----------|-----------|-----------|
| `VITE_API_URL` | `http://localhost:5050` | `/api` | URL base de la API |
| `VITE_AUTO_LOGIN` | `true` | `false` | Auto-login para debug |
| `VITE_API_TIMEOUT` | `10000` | `30000` | Timeout de requests (ms) |
| `VITE_ENV` | `development` | `production` | Entorno actual |

### 📁 Archivos de Configuración

```bash
.
├── .env.development      # ← Desarrollo local
├── .env.production       # ← Producción Docker
├── .env.example          # ← Template documentado
├── nginx.conf            # ← Configuración proxy Nginx
├── Dockerfile            # ← Build multi-stage
├── docker-compose.yml    # ← Orquestación servicios
├── validate-config.sh    # ← Validación pre-deploy
└── build-and-deploy.sh   # ← Deploy automatizado
```

---

## 🚀 Proceso de Deployment

### Opción 1: Deployment Automatizado (Recomendado)

```bash
# Paso 1: Validar configuración
./validate-config.sh

# Paso 2: Build y deploy automático
./build-and-deploy.sh

# Paso 3: Verificar
docker-compose ps
curl http://localhost/
curl http://localhost/api/health
```

### Opción 2: Deployment Manual

```bash
# Paso 1: Validar variables de entorno
cat .env.production
# Verificar: VITE_API_URL=/api

# Paso 2: Build del frontend
pnpm install
pnpm build

# Paso 3: Construir imagen Docker
docker build -t erp-frontend:latest .

# Paso 4: Levantar servicios
docker-compose up -d

# Paso 5: Verificar logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

---

## 🐳 Configuración Docker

### Dockerfile (Multi-stage Build)

**Stage 1: Builder**
- Imagen: `node:20-alpine`
- Instala: `pnpm` y dependencias
- Ejecuta: `pnpm build`
- Genera: `dist/` con assets optimizados

**Stage 2: Production**
- Imagen: `nginx:stable-alpine`
- Copia: `dist/` → `/usr/share/nginx/html`
- Copia: `nginx.conf` → `/etc/nginx/conf.d/default.conf`
- Expone: Puerto 80
- Health check: `curl http://localhost/`

### docker-compose.yml

```yaml
services:
  backend:
    ports: ["5050:5050"]
    networks: [erp-network]
    
  frontend:
    ports: ["80:80"]
    depends_on: [backend]
    networks: [erp-network]
```

**Características:**
- ✅ Red compartida `erp-network` para comunicación entre contenedores
- ✅ Frontend depende del backend (orden de inicio)
- ✅ Health checks para ambos servicios
- ✅ Restart policy: `unless-stopped`

### nginx.conf (Proxy Configuration)

```nginx
# Archivos estáticos
location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}

# Proxy API
location /api/ {
    rewrite ^/api/(.*)$ /$1 break;     # Remove /api prefix
    proxy_pass http://backend:5050;    # Forward to backend
    # ... headers y timeouts ...
}
```

**Funcionamiento:**
1. Request: `http://localhost/api/products`
2. Nginx reescribe: `/api/products` → `/products`
3. Forward: `http://backend:5050/products`
4. Backend responde
5. Nginx devuelve respuesta al cliente

---

## ✅ Checklist de Deployment

### Pre-deployment

- [ ] `.env.production` configurado con `VITE_API_URL=/api`
- [ ] `VITE_AUTO_LOGIN=false` en producción
- [ ] Backend corriendo y respondiendo en puerto 5050
- [ ] PostgreSQL accesible desde el backend
- [ ] Scripts ejecutables: `chmod +x *.sh`

### Durante el Deployment

- [ ] Ejecutar `./validate-config.sh` → Sin errores
- [ ] Build exitoso: `pnpm build` → carpeta `dist/` creada
- [ ] Imagen Docker construida
- [ ] Servicios levantados con docker-compose
- [ ] Health checks pasando

### Post-deployment

- [ ] Frontend accesible: `curl http://localhost/` → 200 OK
- [ ] API proxy funcional: `curl http://localhost/api/health` → 200 OK
- [ ] Login funciona correctamente
- [ ] Sin errores en logs: `docker-compose logs frontend | grep -i error`
- [ ] Conectividad entre contenedores: `docker exec frontend wget -O- http://backend:5050/health`

---

## 🔍 Troubleshooting

### Problema: 502 Bad Gateway en `/api/*`

**Diagnóstico:**
```bash
# 1. Verificar backend está corriendo
docker-compose ps backend

# 2. Probar backend directamente
curl http://localhost:5050/health

# 3. Probar desde el contenedor frontend
docker exec business_management_frontend wget -O- http://backend:5050/health

# 4. Verificar configuración de Nginx
docker exec business_management_frontend cat /etc/nginx/conf.d/default.conf | grep proxy_pass
```

**Solución:** Si el paso 3 falla, hay un problema de red Docker. Verificar que ambos servicios estén en la misma red.

### Problema: Variables de entorno no se aplican

**Causa:** Las variables `VITE_*` se inyectan en **build time**, no en runtime.

**Solución:**
```bash
# Rebuild sin caché
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Problema: CORS Errors

**Diagnóstico:**
```bash
# Verificar que requests vayan al proxy, no directo al backend
# En consola del navegador, verificar:
# Network tab → Request URL debe ser /api/*, no localhost:5050
```

**Solución:** Verificar que `VITE_API_URL=/api` en `.env.production` y que se haya rebuildeado.

---

## 📊 Diferencias clave: Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|-----------|-----------|
| **Servidor** | Vite Dev Server (HMR) | Nginx (static files) |
| **API URL** | `http://localhost:5050` | `/api` (proxy) |
| **Auto-login** | ✅ Habilitado | ❌ Deshabilitado |
| **Debug logs** | ✅ Activos | ❌ Desactivados |
| **Hot reload** | ✅ Sí | ❌ No |
| **Build** | No requerido | Requerido (`pnpm build`) |
| **Port** | 5173 | 80 |
| **Containerizado** | ❌ No | ✅ Sí (Docker) |

---

## 🛠️ Scripts de Automatización

### validate-config.sh

**Propósito:** Validar configuración antes del deployment

**Validaciones:**
- ✅ Existencia de archivos `.env`
- ✅ Valores correctos de `VITE_API_URL`
- ✅ `AUTO_LOGIN` deshabilitado en producción
- ✅ Archivos Docker presentes
- ✅ Estructura de carpetas

**Uso:**
```bash
./validate-config.sh
```

### build-and-deploy.sh

**Propósito:** Automatizar todo el proceso de deployment

**Pasos:**
1. Validación de configuración
2. Limpieza de builds anteriores
3. Instalación de dependencias
4. Build de producción
5. Verificación del build
6. Construcción de imagen Docker
7. Deploy con docker-compose

**Uso:**
```bash
./build-and-deploy.sh
```

---

## 📚 Documentación Relacionada

- **[FRONTEND_DEPLOY_GUIDE.md](./docs/development/FRONTEND_DEPLOY_GUIDE.md)** - Guía detallada de deployment
- **[.env.example](./.env.example)** - Template de variables de entorno
- **[nginx.conf](./nginx.conf)** - Configuración del proxy Nginx
- **[docker-compose.yml](./docker-compose.yml)** - Orquestación de servicios
- **[Dockerfile](./Dockerfile)** - Build multi-stage del frontend

---

## 🎓 Lecciones Aprendidas

### ✅ Buenas Prácticas Implementadas

1. **Variables de entorno separadas por ambiente** (`.env.development`, `.env.production`)
2. **Proxy inverso para desacoplar frontend y backend** (Nginx)
3. **Scripts de automatización para reducir errores** (validate, build-deploy)
4. **Multi-stage Docker build para optimizar tamaño** (builder + production)
5. **Health checks para monitoreo** (Docker Compose)
6. **Documentación exhaustiva** (este documento + FRONTEND_DEPLOY_GUIDE.md)

### 📌 Consideraciones Importantes

1. **Variables VITE_ se inyectan en build time**: Cambiar `.env` requiere rebuild
2. **Nginx debe estar en la misma red Docker**: Para comunicación con backend
3. **Puerto del backend debe coincidir**: nginx.conf y docker-compose.yml
4. **Auto-login debe estar deshabilitado en producción**: Seguridad
5. **try_files en Nginx es crucial para SPAs**: Para React Router

---

## 🚦 Estado Actual

✅ **COMPLETADO**: Estrategia de deployment flexible implementada

**Componentes listos:**
- ✅ Variables de entorno configuradas (`.env.development`, `.env.production`)
- ✅ Nginx configurado con proxy a backend:5050
- ✅ Docker Compose con frontend y backend
- ✅ Dockerfile multi-stage optimizado
- ✅ Scripts de validación y deployment
- ✅ Documentación completa

**Próximos pasos:**
1. Testear deployment en ambiente real
2. Configurar HTTPS con certificados SSL (futuro)
3. Implementar CI/CD pipeline (GitHub Actions)
4. Configurar monitoreo y logs centralizados

---

**Documento creado:** Diciembre 2024  
**Autor:** Equipo de Desarrollo ERP  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0
