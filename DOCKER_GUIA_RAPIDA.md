# 🐳 Guía Rápida de Docker - Frontend ERP

## 📦 Información de la Imagen

- **Nombre de la imagen**: `erp-frontend:latest`
- **Nombre del contenedor**: `erp-system`
- **Puerto HTTP**: `8080` (host) → `80` (contenedor)
- **Puerto HTTPS**: `8443` (host) → `443` (contenedor)

## 🚀 Inicio Rápido

### Opción 1: Scripts PowerShell (Recomendado para Windows)

```powershell
# 1. Construir la imagen
.\docker-build.ps1

# 2. Ejecutar el contenedor
.\docker-run.ps1

# 3. Ver logs
.\docker-logs.ps1
.\docker-logs.ps1 -Follow  # Seguir logs en tiempo real

# 4. Detener el contenedor
.\docker-stop.ps1

# 5. Limpiar recursos
.\docker-clean.ps1
```

### Opción 2: Docker Compose (Stack Completo)

```powershell
# Iniciar frontend + backend
.\docker-compose-up.ps1

# Ver logs de todos los servicios
docker-compose logs -f

# Detener todos los servicios
.\docker-compose-down.ps1

# Detener y eliminar volúmenes
.\docker-compose-down.ps1 -Remove
```

### Opción 3: Comandos Docker Manuales

```powershell
# Construir la imagen
docker build -t erp-frontend:latest .

# Ejecutar el contenedor
docker run -d `
  --name erp-system `
  -p 8080:80 `
  -p 8443:443 `
  --add-host host.docker.internal:host-gateway `
  erp-frontend:latest

# Ver logs
docker logs erp-system
docker logs -f erp-system  # Seguir logs

# Detener
docker stop erp-system

# Iniciar
docker start erp-system

# Reiniciar
docker restart erp-system

# Eliminar
docker rm erp-system

# Eliminar imagen
docker rmi erp-frontend:latest
```

## 🌐 URLs Disponibles

Después de iniciar el contenedor:

- **Frontend**: http://localhost:8080
- **API Backend** (a través del proxy): http://localhost:8080/api/*

## 📋 Comandos Útiles

### Estado y Monitoreo

```powershell
# Ver contenedores en ejecución
docker ps

# Ver todos los contenedores
docker ps -a

# Ver imágenes
docker images

# Estado del contenedor
docker ps -f name=erp-system

# Health check
docker inspect erp-system --format='{{.State.Health.Status}}'

# Uso de recursos
docker stats erp-system

# Información completa
docker inspect erp-system
```

### Logs y Debugging

```powershell
# Ver últimas 100 líneas de logs
docker logs --tail 100 erp-system

# Ver logs desde hace 1 hora
docker logs --since 1h erp-system

# Ver logs con timestamps
docker logs -t erp-system

# Ejecutar comando dentro del contenedor
docker exec -it erp-system sh

# Ver procesos dentro del contenedor
docker exec erp-system ps aux

# Ver configuración de Nginx
docker exec erp-system cat /etc/nginx/conf.d/default.conf
```

### Mantenimiento

```powershell
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes sin usar
docker image prune

# Limpiar todo (CUIDADO)
docker system prune -a

# Ver espacio usado por Docker
docker system df
```

## 🔧 Configuración

### Variables de Entorno

Las variables de entorno se configuran en tiempo de **build** desde `.env.production`:

- `VITE_API_URL=/api` - Proxy reverso de Nginx
- `VITE_AUTO_LOGIN=false` - Deshabilitar auto-login en producción
- `VITE_ENV=production`
- Ver `.env.production` para más detalles

### Proxy Nginx

El contenedor incluye un proxy reverso configurado en `nginx.conf`:

- Las peticiones a `/api/*` se redirigen al backend en `http://host.docker.internal:5050`
- El frontend se sirve desde `/usr/share/nginx/html`
- Ver `nginx.conf` para la configuración completa

## 🐛 Solución de Problemas

### El contenedor no inicia

```powershell
# Ver logs de error
docker logs erp-system

# Verificar que el puerto 8080 no está en uso
netstat -ano | findstr :8080

# Reconstruir la imagen
.\docker-clean.ps1
.\docker-build.ps1
.\docker-run.ps1
```

### Error de conexión al backend

1. Verificar que el backend está corriendo en el host
2. Verificar que `host.docker.internal` resuelve correctamente
3. Revisar la configuración de `nginx.conf`
4. Ver logs de Nginx:

```powershell
docker exec erp-system cat /var/log/nginx/error.log
docker exec erp-system cat /var/log/nginx/access.log
```

### La aplicación no carga

1. Verificar que el build fue exitoso:

```powershell
docker exec erp-system ls -la /usr/share/nginx/html
```

2. Verificar que Nginx está corriendo:

```powershell
docker exec erp-system ps aux | grep nginx
```

3. Probar acceso directo a Nginx:

```powershell
docker exec erp-system wget -O- http://localhost/
```

### Reconstruir completamente

```powershell
# Limpiar todo
.\docker-clean.ps1

# Limpiar cache de Docker
docker builder prune -f

# Reconstruir sin cache
docker build --no-cache -t erp-frontend:latest .

# Ejecutar
.\docker-run.ps1
```

## 📚 Docker Compose

### Servicios Incluidos

El `docker-compose.yml` incluye:

1. **erp-system** (Frontend)
   - Imagen: `erp-frontend:latest`
   - Puerto: 8080
   - Health check configurado

2. **backend** (API)
   - Imagen: `erp-backend:latest`
   - Puerto: 5050
   - Conexión a PostgreSQL en el host

### Comandos Docker Compose

```powershell
# Iniciar servicios
docker-compose up -d

# Iniciar y reconstruir
docker-compose up -d --build

# Forzar recreación
docker-compose up -d --build --force-recreate

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs
docker-compose logs -f
docker-compose logs erp-system
docker-compose logs backend

# Detener servicios
docker-compose stop

# Detener y eliminar
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reiniciar un servicio
docker-compose restart erp-system

# Ejecutar comando en un servicio
docker-compose exec erp-system sh
```

## 🔄 Workflow de Desarrollo

### Desarrollo Local

Para desarrollo, usa el modo normal de Vite (sin Docker):

```powershell
pnpm dev
```

### Pruebas de Producción Local

Para probar el build de producción localmente:

```powershell
# Opción 1: Build y preview
pnpm build
pnpm preview

# Opción 2: Docker
.\docker-build.ps1
.\docker-run.ps1
```

### Despliegue

1. **Verificar configuración**:
   - Revisar `.env.production`
   - Verificar `nginx.conf`
   - Verificar `docker-compose.yml`

2. **Construir imagen**:
   ```powershell
   .\docker-build.ps1
   ```

3. **Probar localmente**:
   ```powershell
   .\docker-run.ps1
   ```

4. **Desplegar con Docker Compose**:
   ```powershell
   .\docker-compose-up.ps1
   ```

## 📊 Health Checks

El contenedor incluye health checks automáticos:

```yaml
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
```

Verificar manualmente:

```powershell
# Estado de salud
docker inspect erp-system --format='{{.State.Health.Status}}'

# Historial de health checks
docker inspect erp-system --format='{{json .State.Health}}' | ConvertFrom-Json
```

Estados posibles:
- `starting` - Contenedor iniciando
- `healthy` - Contenedor funcionando correctamente
- `unhealthy` - Contenedor con problemas

## 🔒 Seguridad

### Mejores Prácticas

1. **No exponer credenciales**:
   - Las variables `VITE_*` se inyectan en tiempo de build
   - No incluir secretos en el código fuente
   - Usar variables de entorno para configuración sensible

2. **HTTPS en producción**:
   - Configurar certificados SSL/TLS
   - Actualizar `nginx.conf` para HTTPS
   - Usar puerto 8443 para HTTPS

3. **Actualizar dependencias**:
   ```powershell
   pnpm update
   ```

4. **Escanear vulnerabilidades**:
   ```powershell
   pnpm audit
   docker scan erp-frontend:latest
   ```

## 📖 Recursos Adicionales

- [Dockerfile](./Dockerfile) - Configuración multi-stage
- [docker-compose.yml](./docker-compose.yml) - Orquestación de servicios
- [nginx.conf](./nginx.conf) - Configuración del proxy
- [.env.production](./.env.production) - Variables de producción
- [DOCKER_WINDOWS_POSTGRES_GUIDE.md](./DOCKER_WINDOWS_POSTGRES_GUIDE.md) - Guía de PostgreSQL
- [DOCKER_WSL_GUIDE.md](./DOCKER_WSL_GUIDE.md) - Guía de WSL

## 🆘 Soporte

Si encuentras problemas:

1. Revisar los logs: `.\docker-logs.ps1 -Follow`
2. Verificar health check: `docker inspect erp-system`
3. Probar reconstrucción: `.\docker-clean.ps1` y `.\docker-build.ps1`
4. Consultar la documentación en `docs/`

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
