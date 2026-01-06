# 🐳 Docker - Inicio Rápido

## Información de la Imagen y Contenedor

- **Imagen**: `erp-frontend:latest`
- **Contenedor**: `erp-system`
- **Puerto**: `8080` (HTTP) y `8443` (HTTPS)

## 🚀 3 Comandos para Empezar

```powershell
# 1. Construir
.\docker-build.ps1

# 2. Ejecutar
.\docker-run.ps1

# 3. Abrir navegador
# http://localhost:8080
```

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `docker-build.ps1` | Construir imagen `erp-frontend:latest` |
| `docker-run.ps1` | Ejecutar contenedor `erp-system` |
| `docker-stop.ps1` | Detener contenedor |
| `docker-logs.ps1` | Ver logs |
| `docker-clean.ps1` | Limpiar recursos |
| `docker-compose-up.ps1` | Stack completo (frontend + backend) |
| `docker-compose-down.ps1` | Detener stack completo |

## 📚 Documentación Completa

- **[DOCKER_GUIA_RAPIDA.md](./DOCKER_GUIA_RAPIDA.md)** - Guía completa en español
- **[DOCKER_README.md](./DOCKER_README.md)** - Documentación del stack completo
