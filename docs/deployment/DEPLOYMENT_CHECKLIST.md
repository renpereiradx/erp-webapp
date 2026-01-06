# ✅ Deployment Verification Checklist

Use este checklist para verificar que el deployment esté completo y correcto.

---

## 📋 Pre-Deployment Verification

### Archivos de Configuración

```bash
# Verificar que existan todos los archivos necesarios
ls -la .env.development .env.production nginx.conf Dockerfile docker-compose.yml
```

- [ ] `.env.development` existe
- [ ] `.env.production` existe
- [ ] `.env.example` existe (documentación)
- [ ] `nginx.conf` existe
- [ ] `Dockerfile` existe
- [ ] `docker-compose.yml` existe
- [ ] `validate-config.sh` existe y es ejecutable
- [ ] `build-and-deploy.sh` existe y es ejecutable

### Configuración de Variables

```bash
# Verificar valores críticos
cat .env.production
```

- [ ] `VITE_API_URL=/api` (NO localhost)
- [ ] `VITE_AUTO_LOGIN=false` (seguridad)
- [ ] `VITE_ENV=production`
- [ ] `VITE_API_TIMEOUT` configurado (≥ 30000)

### Backend Prerequisites

```bash
# Verificar backend disponible
curl http://localhost:5050/health
```

- [ ] Backend corriendo en puerto 5050
- [ ] Endpoint `/health` responde 200 OK
- [ ] PostgreSQL corriendo y accesible
- [ ] Migraciones de BD ejecutadas
- [ ] Variables de entorno del backend configuradas

---

## 🛠️ Build Verification

### Build Local

```bash
# Ejecutar build
pnpm install
pnpm build
```

- [ ] Dependencias instaladas sin errores
- [ ] Build completado exitosamente
- [ ] Carpeta `dist/` creada
- [ ] `dist/index.html` existe
- [ ] `dist/assets/` contiene archivos JS y CSS

### Verificación del Build

```bash
# Verificar que las variables estén inyectadas
grep -r "VITE_API_URL" dist/
# NO debe aparecer "VITE_API_URL", debe estar reemplazado por "/api"

# Verificar contenido del build
ls -lh dist/
du -sh dist/
```

- [ ] No hay referencias a `import.meta.env` en archivos dist
- [ ] Variables están hardcoded en el código
- [ ] Tamaño del build es razonable (< 10 MB típicamente)

---

## 🐳 Docker Verification

### Docker Build

```bash
# Construir imagen
docker build -t erp-frontend:latest .
```

- [ ] Imagen construida sin errores
- [ ] Stage 1 (builder) completado
- [ ] Stage 2 (production) completado
- [ ] Imagen final es pequeña (~50-60 MB)

### Docker Compose

```bash
# Verificar configuración
docker-compose config
```

- [ ] `docker-compose config` sin errores
- [ ] Servicios `frontend` y `backend` definidos
- [ ] Red `erp-network` configurada
- [ ] Puertos mapeados correctamente
- [ ] `depends_on` configurado (frontend → backend)

### Iniciar Servicios

```bash
# Levantar servicios
docker-compose up -d
```

- [ ] Servicios iniciados sin errores
- [ ] `docker-compose ps` muestra ambos contenedores "Up"
- [ ] No hay errores en logs iniciales

---

## 🔍 Runtime Verification

### Conectividad Básica

```bash
# Test 1: Frontend accesible
curl -I http://localhost/

# Test 2: HTML response
curl http://localhost/ | grep "<title>"

# Test 3: API proxy funcional
curl http://localhost/api/health
```

- [ ] Frontend responde 200 OK
- [ ] HTML con título correcto se sirve
- [ ] Proxy `/api/` funciona
- [ ] Backend responde via proxy

### Verificación de Nginx

```bash
# Verificar configuración de Nginx dentro del contenedor
docker exec business_management_frontend cat /etc/nginx/conf.d/default.conf
```

- [ ] `proxy_pass http://backend:5050` presente
- [ ] `rewrite ^/api/(.*)$ /$1 break;` presente
- [ ] `try_files $uri $uri/ /index.html;` presente
- [ ] Timeouts configurados (60s)

### Conectividad entre Contenedores

```bash
# Test desde frontend hacia backend
docker exec business_management_frontend wget -O- http://backend:5050/health
```

- [ ] Comando ejecuta sin errores
- [ ] Backend responde desde el contenedor frontend
- [ ] Red Docker funcional

### Verificación de Logs

```bash
# Verificar que no haya errores críticos
docker-compose logs frontend | grep -i error
docker-compose logs backend | grep -i error
```

- [ ] Sin errores críticos en logs de frontend
- [ ] Sin errores críticos en logs de backend
- [ ] Requests llegan correctamente al backend

---

## 🌐 Application Verification

### Manual Browser Testing

Abrir http://localhost en el navegador:

- [ ] Página carga correctamente
- [ ] Sin errores en consola del navegador
- [ ] Assets (CSS, JS, imágenes) cargan
- [ ] Login page se muestra

### Login Flow

Intentar login con credenciales válidas:

- [ ] Formulario de login funciona
- [ ] Request va a `/api/auth/login` (no localhost:5050)
- [ ] Response exitosa con token
- [ ] Redirección al dashboard
- [ ] Token almacenado en localStorage

### API Calls

En la aplicación, realizar acciones que requieran API:

- [ ] Listar productos funciona
- [ ] Crear producto funciona
- [ ] Editar producto funciona
- [ ] Eliminar producto funciona
- [ ] Otros endpoints CRUD funcionan

### Navigation

Probar rutas del frontend:

- [ ] `/` redirige correctamente
- [ ] `/products` carga
- [ ] `/clients` carga
- [ ] `/orders` carga
- [ ] `/settings` carga
- [ ] Refresh en cualquier ruta no da 404

---

## 🔐 Security Verification

### Auto-Login

```bash
# Verificar en el código buildeado
grep -r "AUTO_LOGIN" dist/
# Debe mostrar: false o estar hardcoded como false
```

- [ ] Auto-login está deshabilitado
- [ ] No hay credenciales hardcoded en el código
- [ ] Login manual funciona correctamente

### Headers de Seguridad

```bash
# Verificar headers de respuesta
curl -I http://localhost/
```

- [ ] Headers de seguridad presentes (opcional pero recomendado)
- [ ] No se expone información sensible en headers
- [ ] CORS configurado correctamente en backend

### Token Management

En consola del navegador:

```javascript
// Verificar que el token esté en localStorage
localStorage.getItem('token')
```

- [ ] Token se almacena correctamente
- [ ] Token se incluye en requests (Authorization header)
- [ ] Token inválido/expirado maneja logout

---

## 📊 Performance Verification

### Response Times

```bash
# Medir tiempos de respuesta
time curl -o /dev/null -s -w "Time: %{time_total}s\n" http://localhost/
time curl -o /dev/null -s -w "Time: %{time_total}s\n" http://localhost/api/health
```

- [ ] Frontend responde en < 1s
- [ ] API responde en < 2s
- [ ] Sin timeouts

### Resource Usage

```bash
# Verificar uso de recursos
docker stats --no-stream
```

- [ ] Contenedor frontend usa < 100 MB RAM
- [ ] Contenedor backend uso razonable
- [ ] CPU no al 100% constantemente

---

## 🔄 Restart & Recovery

### Restart Test

```bash
# Reiniciar servicios
docker-compose restart

# Esperar unos segundos
sleep 10

# Verificar
docker-compose ps
curl http://localhost/
```

- [ ] Servicios reinician sin problemas
- [ ] Frontend vuelve a estar disponible
- [ ] Backend vuelve a estar disponible
- [ ] Funcionalidad completa restaurada

### Stop & Start Test

```bash
# Detener
docker-compose down

# Iniciar nuevamente
docker-compose up -d

# Verificar
docker-compose ps
```

- [ ] Servicios se detienen limpiamente
- [ ] Servicios inician correctamente
- [ ] Sin errores en proceso

### Health Checks

```bash
# Verificar health checks
docker inspect business_management_frontend | grep -A 10 "Health"
```

- [ ] Health checks configurados
- [ ] Health checks pasando
- [ ] Contenedores "healthy"

---

## 📝 Documentation Verification

### Scripts

```bash
# Ejecutar validación
./validate-config.sh
```

- [ ] Script ejecuta sin errores
- [ ] Todas las validaciones pasan
- [ ] Output claro y útil

### Documentation

- [ ] README.md actualizado
- [ ] DEPLOYMENT_SUMMARY.md presente
- [ ] FRONTEND_DEPLOY_GUIDE.md presente
- [ ] QUICKSTART_DEPLOY.md presente
- [ ] ARCHITECTURE_DIAGRAMS.md presente
- [ ] Todos los enlaces funcionan

---

## ✨ Final Verification

### Production Readiness Checklist

- [ ] ✅ Todos los puntos anteriores verificados
- [ ] ✅ No hay errores en ningún log
- [ ] ✅ Aplicación funciona end-to-end
- [ ] ✅ Performance es aceptable
- [ ] ✅ Seguridad configurada correctamente
- [ ] ✅ Documentación completa y actualizada
- [ ] ✅ Scripts de deployment funcionan
- [ ] ✅ Proceso de recovery verificado

---

## 🎯 Result

Si todos los checks están ✅:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│            🎉 DEPLOYMENT VERIFICATION COMPLETE 🎉              │
│                                                                 │
│        La aplicación está lista para producción                │
│                                                                 │
│  Próximos pasos:                                               │
│  • Configurar monitoreo (logs, métricas)                       │
│  • Configurar HTTPS (certificados SSL)                         │
│  • Configurar backups automáticos                              │
│  • Configurar CI/CD pipeline                                   │
│  • Configurar alertas                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

Si hay checks que fallan ❌:

1. Revisar la sección correspondiente en este documento
2. Consultar [FRONTEND_DEPLOY_GUIDE.md](./docs/development/FRONTEND_DEPLOY_GUIDE.md)
3. Verificar logs: `docker-compose logs -f`
4. Ejecutar troubleshooting específico

---

**Documento creado:** Diciembre 2024  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0
