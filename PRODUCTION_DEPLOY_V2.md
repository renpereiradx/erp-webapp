# 🚀 Guía de Despliegue a Producción - V2 (Enero 2026)

## 📌 Cambios en esta versión

Esta guía refleja las actualizaciones importantes del pull reciente que incluye:
- ✨ Nuevo sistema SCSS con Fluent Design
- 🌐 Sistema i18n completo
- 💰 Nuevos módulos de pagos (compras y ventas)
- 📦 Gestión mejorada de inventario
- 💱 Sistema de monedas y tipos de cambio
- 📊 Nuevos dashboards y reportes

---

## 🎯 Pre-requisitos

### 1. Software requerido
```powershell
# Verificar versiones
node --version        # v20+
pnpm --version        # 10.14.0+
docker --version      # 20.10+
docker-compose --version
```

### 2. Servicios corriendo
- ✅ Docker Desktop iniciado
- ✅ PostgreSQL corriendo (puerto 5432)
- ✅ Backend actualizado y disponible

### 3. Variables de entorno
Asegúrate que `.env.production` está actualizado:
```bash
VITE_API_URL=/api
VITE_AUTO_LOGIN=false
VITE_ENV=production
VITE_DEBUG=false
```

---

## 📦 Paso 1: Preparación

### 1.1 Verificar cambios recientes
```powershell
# Ver resumen de cambios
git log --oneline -10

# Verificar que estás en main actualizado
git status
git pull origin main  # Ya hecho ✅
```

### 1.2 Limpiar builds anteriores
```powershell
# Limpiar caché y builds previos
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
```

### 1.3 Instalar dependencias actualizadas
```powershell
# Reinstalar con las nuevas dependencias
pnpm install --frozen-lockfile
```

---

## 🏗️ Paso 2: Build del Frontend

### 2.1 Build de producción
```powershell
# Build con variables de producción
pnpm build
```

### 2.2 Verificar el build
```powershell
# Comprobar que se generó correctamente
Test-Path "dist\index.html"  # Debe retornar True
Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum
```

---

## 🐳 Paso 3: Docker - Frontend

### 3.1 Detener contenedores existentes
```powershell
# Detener y remover contenedores anteriores
docker-compose down

# Opcional: Limpiar imágenes antiguas
docker image prune -f
```

### 3.2 Construir nueva imagen del frontend
```powershell
# Construir imagen actualizada
.\docker-build.ps1

# O manualmente:
docker build -t erp-frontend:latest -f Dockerfile .
```

### 3.3 Verificar la imagen
```powershell
# Listar imágenes
docker images erp-frontend

# Inspeccionar la imagen
docker inspect erp-frontend:latest
```

---

## 🔧 Paso 4: Docker - Backend

### 4.1 Ubicación del backend
```powershell
# Navegar al directorio del backend
cd ..\backend  # o donde esté tu backend
```

### 4.2 Construir imagen del backend
```powershell
# Si el backend tiene Dockerfile
docker build -t erp-backend:latest .

# Verificar
docker images erp-backend
```

### 4.3 Volver al frontend
```powershell
cd ..\frontend
```

---

## 🚀 Paso 5: Despliegue con Docker Compose

### 5.1 Verificar docker-compose.yml
```yaml
# Verificar que apunta a las imágenes correctas:
services:
  erp-system:
    image: erp-frontend:latest
    ports:
      - "8080:80"
  
  backend:
    image: erp-backend:latest
    ports:
      - "5050:5050"
```

### 5.2 Iniciar el stack completo
```powershell
# Iniciar servicios
.\docker-compose-up.ps1

# O manualmente:
docker-compose up -d --build
```

### 5.3 Verificar servicios corriendo
```powershell
# Ver estado de contenedores
docker-compose ps

# Debe mostrar:
# NAME           STATUS    PORTS
# erp-system     Up        0.0.0.0:8080->80/tcp
# erp-backend    Up        0.0.0.0:5050->5050/tcp
```

---

## ✅ Paso 6: Verificación

### 6.1 Health checks
```powershell
# Frontend
Invoke-WebRequest -Uri "http://localhost:8080" -Method Head

# Backend directo
Invoke-WebRequest -Uri "http://localhost:5050/health"

# Backend via proxy
Invoke-WebRequest -Uri "http://localhost:8080/api/health"
```

### 6.2 Verificar logs
```powershell
# Logs del frontend
docker-compose logs erp-system --tail=50

# Logs del backend
docker-compose logs backend --tail=50

# Logs en tiempo real
docker-compose logs -f
```

### 6.3 Probar funcionalidades clave
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Módulos de ventas accesibles
- [ ] Módulos de compras accesibles
- [ ] Gestión de inventario funciona
- [ ] Sistema de monedas/tipos de cambio
- [ ] Reportes generan correctamente

---

## 🔍 Paso 7: Testing en Producción

### 7.1 Pruebas de conectividad
```powershell
# Dentro del contenedor frontend
docker exec -it erp-system sh
# Probar conectividad con backend
wget -O- http://backend:5050/health
exit
```

### 7.2 Verificar proxy de Nginx
```powershell
# Ver configuración activa
docker exec erp-system cat /etc/nginx/conf.d/default.conf
```

### 7.3 Monitorear recursos
```powershell
# Ver uso de recursos
docker stats --no-stream

# Ver procesos
docker-compose top
```

---

## 🐛 Troubleshooting

### Problema: Frontend no carga
```powershell
# Verificar que el contenedor está corriendo
docker ps | Select-String "erp-system"

# Ver logs de errores
docker logs erp-system --tail=100

# Reiniciar contenedor
docker-compose restart erp-system
```

### Problema: 502 Bad Gateway (API)
```powershell
# 1. Verificar backend está corriendo
docker ps | Select-String "backend"

# 2. Probar backend directamente
curl http://localhost:5050/health

# 3. Verificar configuración de nginx
docker exec erp-system cat /etc/nginx/conf.d/default.conf | Select-String "proxy_pass"

# 4. Verificar conectividad entre contenedores
docker exec erp-system ping backend -c 3
```

### Problema: Variables de entorno no aplicadas
```powershell
# Las variables VITE_* se inyectan en BUILD time, no en runtime
# Si cambiaste variables, debes RECONSTRUIR:
docker-compose down
docker build --no-cache -t erp-frontend:latest .
docker-compose up -d
```

### Problema: PostgreSQL no accesible desde backend
```powershell
# Verificar que PostgreSQL acepta conexiones externas
# En postgresql.conf:
# listen_addresses = '*'

# En pg_hba.conf:
# host all all 0.0.0.0/0 md5

# Reiniciar PostgreSQL después de cambios
```

### Problema: Rebuild sin caché
```powershell
# Build completo sin caché
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

---

## 📊 Monitoreo Continuo

### Logs
```powershell
# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Filtrar errores
docker-compose logs | Select-String "error|ERROR|Error"

# Logs de un servicio específico
docker-compose logs -f erp-system
```

### Métricas
```powershell
# Uso de recursos
docker stats

# Información de contenedores
docker inspect erp-system
docker inspect erp-backend
```

---

## 🔄 Actualización Futura

Cuando necesites actualizar a una nueva versión:

```powershell
# 1. Pull de cambios
git pull origin main

# 2. Detener servicios
docker-compose down

# 3. Limpiar
docker image prune -f

# 4. Reinstalar dependencias si es necesario
pnpm install --frozen-lockfile

# 5. Rebuild
docker build -t erp-frontend:latest .

# 6. Reiniciar
docker-compose up -d --build

# 7. Verificar
docker-compose ps
docker-compose logs -f
```

---

## 📝 Checklist Final

### Pre-deployment
- [ ] Git pull completado
- [ ] Dependencias actualizadas (pnpm install)
- [ ] Build de producción exitoso (pnpm build)
- [ ] Variables de entorno configuradas (.env.production)
- [ ] Docker Desktop corriendo

### Deployment
- [ ] Contenedores antiguos detenidos
- [ ] Imagen frontend construida
- [ ] Imagen backend construida
- [ ] Docker Compose iniciado
- [ ] Contenedores en estado "Up"

### Post-deployment
- [ ] Frontend accesible en http://localhost:8080
- [ ] Backend accesible en http://localhost:5050
- [ ] Proxy /api funcionando
- [ ] Login exitoso
- [ ] Módulos principales accesibles
- [ ] Sin errores en logs
- [ ] Base de datos conectada

---

## 🆘 Comandos de Emergencia

```powershell
# Detener todo
docker-compose down

# Limpiar todo
docker-compose down -v
docker system prune -a --volumes -f

# Reiniciar desde cero
docker-compose down
docker build --no-cache -t erp-frontend:latest .
docker-compose up -d --force-recreate

# Ver todo
docker ps -a
docker images
docker volume ls
docker network ls
```

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica conectividad: `docker exec erp-system ping backend`
3. Prueba el backend directo: `curl http://localhost:5050/health`
4. Revisa las variables de entorno en .env.production
5. Consulta los archivos de documentación en /docs

---

## 🎉 ¡Listo!

Tu aplicación ERP debería estar corriendo en:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5050
- **API via Proxy**: http://localhost:8080/api/*

¡Feliz despliegue! 🚀
