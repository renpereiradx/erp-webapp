# ✅ Checklist de Despliegue a Producción - V2 (Enero 2026)

## 📋 Pre-Despliegue

### Software y Herramientas
- [ ] Docker Desktop instalado y corriendo
- [ ] Node.js 20+ instalado
- [ ] pnpm 10.14.0+ instalado
- [ ] Git configurado y accesible
- [ ] Editor de código disponible (VS Code recomendado)

### Repositorio
- [ ] Git pull completado (`git pull origin main`)
- [ ] En branch `main`
- [ ] Sin cambios sin commit (o commitear cambios locales)
- [ ] Sin commits sin push (opcional)

### Configuración
- [ ] Archivo `.env.production` existe
- [ ] Variable `VITE_API_URL=/api` configurada
- [ ] Variable `VITE_AUTO_LOGIN=false` para producción
- [ ] Variable `VITE_ENV=production` configurada
- [ ] Variable `VITE_DEBUG=false` configurada
- [ ] Archivo `docker-compose.yml` presente
- [ ] Archivo `Dockerfile` presente
- [ ] Archivo `nginx.conf` presente

### Servicios Externos
- [ ] PostgreSQL corriendo en localhost:5432
- [ ] PostgreSQL acepta conexiones externas
- [ ] Usuario y contraseña de DB correctos en docker-compose.yml
- [ ] Backend actualizado con últimos cambios
- [ ] Backend compilado (si aplica)

### Espacio y Recursos
- [ ] Al menos 10 GB libres en disco
- [ ] Suficiente RAM disponible (mínimo 4 GB)
- [ ] Puertos 8080 y 5050 disponibles

---

## 🏗️ Durante el Despliegue

### Preparación
- [ ] Contenedores antiguos detenidos (`docker-compose down`)
- [ ] Caché limpiado (opcional: `docker system prune`)
- [ ] Directorio `dist/` eliminado

### Build Frontend
- [ ] Dependencias instaladas (`pnpm install --frozen-lockfile`)
- [ ] Build ejecutado sin errores (`pnpm build`)
- [ ] Directorio `dist/` generado
- [ ] Archivo `dist/index.html` existe
- [ ] Tamaño del build razonable (verificar)

### Docker Frontend
- [ ] Dockerfile sin errores de sintaxis
- [ ] Imagen `erp-frontend:latest` construida exitosamente
- [ ] Tamaño de imagen razonable (< 200 MB)
- [ ] Sin warnings críticos en build

### Docker Backend
- [ ] Navegado al directorio del backend
- [ ] Imagen `erp-backend:latest` construida (o ya existe)
- [ ] Sin errores en construcción
- [ ] Variables de entorno configuradas en docker-compose.yml

### Docker Compose
- [ ] Archivo `docker-compose.yml` sin errores
- [ ] Red `erp-network` configurada
- [ ] Servicios definidos correctamente
- [ ] Health checks configurados
- [ ] Puertos mapeados correctamente

### Inicio de Servicios
- [ ] Comando `docker-compose up -d` ejecutado
- [ ] Contenedores iniciados exitosamente
- [ ] Estado: `Up` para ambos contenedores
- [ ] Sin errores en logs iniciales

---

## ✅ Post-Despliegue

### Verificación de Contenedores
- [ ] `docker-compose ps` muestra ambos servicios `Up`
- [ ] Contenedor `erp-system` accesible
- [ ] Contenedor `erp-backend` accesible
- [ ] Health checks pasando

### Pruebas de Conectividad
- [ ] Frontend responde: `http://localhost:8080`
- [ ] Backend directo responde: `http://localhost:5050/health`
- [ ] Backend via proxy responde: `http://localhost:8080/api/health`
- [ ] Nginx proxy funcionando correctamente

### Pruebas Funcionales

#### Autenticación
- [ ] Página de login carga correctamente
- [ ] Login con credenciales correctas funciona
- [ ] Token se guarda correctamente
- [ ] Sesión persiste al recargar
- [ ] Logout funciona correctamente

#### Dashboard
- [ ] Dashboard carga sin errores
- [ ] Sidebar visible y funcional
- [ ] Navbar visible y funcional
- [ ] Widgets cargan correctamente
- [ ] Sin errores en consola del navegador

#### Módulos Core
- [ ] **Ventas**: Página carga, lista de ventas visible
- [ ] **Compras**: Página carga, lista de compras visible
- [ ] **Productos**: Página carga, lista de productos visible
- [ ] **Clientes**: Página carga, lista de clientes visible
- [ ] **Proveedores**: Página carga, lista de proveedores visible

#### Nuevos Módulos (V2)
- [ ] **Inventario**: Gestión de inventario accesible
- [ ] **Monedas**: Página de monedas carga
- [ ] **Tipos de Cambio**: Exchange rates accesible
- [ ] **Pagos de Ventas**: Módulo de pagos funciona
- [ ] **Pagos de Compras**: Purchase payments accesible
- [ ] **Ajustes de Precios**: Price adjustments funciona
- [ ] **Caja**: Cash register operations funciona

#### Funcionalidad CRUD
- [ ] Crear nuevo registro funciona
- [ ] Editar registro existente funciona
- [ ] Eliminar registro funciona (si aplica)
- [ ] Búsqueda/filtros funcionan
- [ ] Paginación funciona
- [ ] Ordenamiento funciona

#### Sistema i18n
- [ ] Textos en español correctos
- [ ] Sin keys sin traducir (`i18n.t.xxx`)
- [ ] Cambio de idioma funciona (si aplica)

#### Estilos y UI
- [ ] Fluent Design System aplicado
- [ ] SCSS compilado correctamente
- [ ] Colores y temas correctos
- [ ] Responsive design funciona
- [ ] Animaciones suaves
- [ ] Sin elementos rotos visualmente

### Pruebas de Integración
- [ ] API calls funcionan correctamente
- [ ] Datos se cargan desde backend
- [ ] Datos se guardan en backend
- [ ] Errores de API se manejan correctamente
- [ ] Loading states funcionan
- [ ] Mensajes de error/éxito aparecen

### Rendimiento
- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Navegación entre páginas fluida
- [ ] Sin memory leaks evidentes
- [ ] Imágenes optimizadas
- [ ] Bundles de tamaño razonable

### Logs y Monitoreo
- [ ] Sin errores críticos en logs de frontend
- [ ] Sin errores críticos en logs de backend
- [ ] Sin errores 500 en API calls
- [ ] Sin warnings bloqueantes
- [ ] Logs accesibles: `docker-compose logs -f`

### Seguridad
- [ ] HTTPS configurado (si aplica)
- [ ] Variables sensibles no expuestas en frontend
- [ ] JWT tokens se manejan correctamente
- [ ] Auto-login DESHABILITADO en producción
- [ ] CORS configurado correctamente

### Base de Datos
- [ ] Backend conecta a PostgreSQL
- [ ] Migraciones aplicadas (si aplica)
- [ ] Datos de prueba cargados (si necesario)
- [ ] Respaldos configurados (recomendado)

---

## 📊 Monitoreo Continuo

### Comandos de Monitoreo
```powershell
# Estado de servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f

# Uso de recursos
docker stats

# Health checks
curl http://localhost:8080
curl http://localhost:5050/health
```

### Indicadores a Monitorear
- [ ] CPU usage < 80%
- [ ] Memory usage estable
- [ ] Sin restart loops de contenedores
- [ ] Response times razonables (< 1s)
- [ ] Sin errores 500 repetitivos

---

## 🐛 Troubleshooting

### Si Frontend no carga
- [ ] Verificar logs: `docker-compose logs erp-system`
- [ ] Verificar Nginx: `docker exec erp-system cat /etc/nginx/conf.d/default.conf`
- [ ] Reintentar: `docker-compose restart erp-system`
- [ ] Rebuild: `docker build -t erp-frontend:latest .`

### Si Backend no responde
- [ ] Verificar logs: `docker-compose logs backend`
- [ ] Verificar PostgreSQL: `psql -h localhost -U dev_user -d erp_db`
- [ ] Verificar variables: revisar docker-compose.yml
- [ ] Reintentar: `docker-compose restart backend`

### Si Proxy no funciona
- [ ] Verificar nginx.conf tiene proxy_pass correcto
- [ ] Verificar conectividad: `docker exec erp-system ping backend`
- [ ] Verificar red: `docker network inspect erp_erp-network`

---

## 📝 Documentación

### Archivos de Referencia
- [ ] `PRODUCTION_DEPLOY_V2.md` - Guía completa
- [ ] `DEPLOY_README.md` - Quick reference
- [ ] `docker-compose.yml` - Configuración servicios
- [ ] `.env.production` - Variables de entorno

### Scripts Disponibles
- [ ] `.\verify-ready.ps1` - Pre-flight checks
- [ ] `.\deploy-production.ps1` - Despliegue completo
- [ ] `.\quick-deploy.ps1` - Despliegue rápido
- [ ] `.\docker-compose-up.ps1` - Iniciar servicios
- [ ] `.\docker-compose-down.ps1` - Detener servicios
- [ ] `.\docker-logs.ps1` - Ver logs

---

## 🎯 Criterios de Éxito

El despliegue es exitoso cuando:

✅ Todos los contenedores están `Up`
✅ Frontend accesible en http://localhost:8080
✅ Backend responde en http://localhost:5050
✅ Login funciona correctamente
✅ Módulos principales cargan sin errores
✅ Sin errores en logs de frontend
✅ Sin errores en logs de backend
✅ API calls funcionan correctamente
✅ Base de datos conectada
✅ Health checks pasando

---

## 📅 Mantenimiento

### Actualizaciones Futuras
- [ ] Documentar cambios importantes
- [ ] Actualizar este checklist si es necesario
- [ ] Crear respaldo antes de actualizar
- [ ] Probar en desarrollo antes de producción
- [ ] Seguir procedimiento de despliegue

### Respaldos
- [ ] Configurar backup automático de DB
- [ ] Guardar configuraciones importantes
- [ ] Documentar contraseñas (en lugar seguro)
- [ ] Mantener versiones de imágenes Docker

---

**Última actualización**: Enero 4, 2026
**Versión del Sistema**: V2.0
**Pull Request**: Latest (98,115 insertions, 44,502 deletions)

---

## ✍️ Firma de Despliegue

**Desplegado por**: _________________
**Fecha**: _________________
**Hora**: _________________
**Versión**: V2.0
**Notas**: _________________

---

¡Despliegue completado con éxito! 🎉
