# 🚀 Despliegue Rápido a Producción

## ⚡ Inicio Rápido (3 comandos)

```powershell
# 1. Ejecutar el script de despliegue completo
.\deploy-production.ps1

# O usar el despliegue rápido
.\quick-deploy.ps1
```

## 📋 Pre-requisitos

Asegúrate de tener:
- ✅ Docker Desktop corriendo
- ✅ PostgreSQL disponible en localhost:5432
- ✅ Backend actualizado
- ✅ Git pull completado

## 🎯 Opciones de Despliegue

### Opción 1: Despliegue Completo (Recomendado)
```powershell
.\deploy-production.ps1
```
- ✅ Verifica pre-requisitos
- ✅ Construye frontend
- ✅ Construye imágenes Docker
- ✅ Inicia servicios
- ✅ Verifica health checks
- ✅ Muestra resumen completo

### Opción 2: Despliegue Rápido
```powershell
.\quick-deploy.ps1
```
- ⚡ Proceso simplificado
- ⚡ Build y deploy en 5 pasos
- ⚡ Ideal para actualizaciones rápidas

### Opción 3: Scripts Individuales
```powershell
# Build
.\docker-build.ps1

# Iniciar
.\docker-compose-up.ps1

# Ver logs
.\docker-logs.ps1

# Detener
.\docker-compose-down.ps1
```

## 🔍 Verificación Post-Despliegue

```powershell
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Probar endpoints
curl http://localhost:8080        # Frontend
curl http://localhost:5050/health  # Backend
curl http://localhost:8080/api/health  # Backend via proxy
```

## 🆘 Solución de Problemas

### Frontend no carga
```powershell
docker-compose logs erp-system
docker-compose restart erp-system
```

### Backend no responde
```powershell
docker-compose logs backend
docker-compose restart backend
```

### Rebuild completo sin caché
```powershell
.\deploy-production.ps1 -NoCache
```

### Limpiar todo y empezar de nuevo
```powershell
docker-compose down -v
docker system prune -a --volumes -f
.\deploy-production.ps1 -NoCache
```

## 📊 Comandos Útiles

```powershell
# Estado de servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f

# Logs de un servicio
docker-compose logs -f erp-system
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Ver recursos
docker stats

# Entrar a un contenedor
docker exec -it erp-system sh
docker exec -it erp-backend sh
```

## 📍 URLs de Producción

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5050
- **API (vía proxy)**: http://localhost:8080/api

## 📚 Documentación Completa

Para más detalles, ver:
- `PRODUCTION_DEPLOY_V2.md` - Guía completa paso a paso
- `QUICKSTART_DEPLOY.md` - Guía rápida original
- `docker-compose.yml` - Configuración de servicios

## 🔄 Actualización Futura

Cuando hay cambios en el repositorio:

```powershell
# 1. Pull de cambios
git pull origin main

# 2. Redesplegar
.\deploy-production.ps1
```

## ✅ Checklist de Despliegue

- [ ] Docker Desktop corriendo
- [ ] PostgreSQL accesible
- [ ] Git pull completado
- [ ] Variables en .env.production configuradas
- [ ] Backend actualizado
- [ ] Script de despliegue ejecutado
- [ ] Health checks pasando
- [ ] Login funciona
- [ ] Módulos principales accesibles

---

**¿Problemas?** Revisa los logs con `docker-compose logs -f`
