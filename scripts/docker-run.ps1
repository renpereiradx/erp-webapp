# Script para ejecutar el contenedor Docker del Frontend
# Uso: .\docker-run.ps1

Write-Host "Iniciando contenedor del Frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/.."
Write-Host "Imagen: erp-frontend:latest" -ForegroundColor Yellow
Write-Host "Contenedor: erp-system" -ForegroundColor Yellow
Write-Host ""

# Verificar si la imagen existe
$imageExists = docker images -q erp-frontend:latest
if (-not $imageExists) {
    Write-Host "Error: La imagen erp-frontend:latest no existe" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\docker-build.ps1" -ForegroundColor Yellow
    exit 1
}

# Detener y eliminar contenedor existente si existe
$containerExists = docker ps -aq -f name=erp-system
if ($containerExists) {
    Write-Host "Deteniendo contenedor existente..." -ForegroundColor Yellow
    docker stop erp-system | Out-Null
    Write-Host "Eliminando contenedor existente..." -ForegroundColor Yellow
    docker rm erp-system | Out-Null
}

# Crear directorio de logs si no existe
if (-not (Test-Path "logs\nginx")) {
    New-Item -ItemType Directory -Path "logs\nginx" -Force | Out-Null
}

Write-Host "Listo para iniciar" -ForegroundColor Green
Write-Host ""

# Ejecutar el contenedor
Write-Host "Iniciando contenedor..." -ForegroundColor Cyan
docker run -d `
    --name erp-system `
    -p 8080:80 `
    -p 8443:443 `
    --add-host host.docker.internal:host-gateway `
    -v "${PWD}\logs\nginx:/var/log/nginx" `
    --restart unless-stopped `
    erp-frontend:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Contenedor iniciado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacion del contenedor:" -ForegroundColor Cyan
    docker ps -f name=erp-system
    Write-Host ""
    Write-Host "URLs disponibles:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
    Write-Host "   HTTPS:    https://localhost:8443 (si esta configurado)" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "   Ver logs:     docker logs erp-system" -ForegroundColor White
    Write-Host "   Ver logs en tiempo real: docker logs -f erp-system" -ForegroundColor White
    Write-Host "   Detener:      docker stop erp-system" -ForegroundColor White
    Write-Host "   Reiniciar:    docker restart erp-system" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Error al iniciar el contenedor" -ForegroundColor Red
    Write-Host "Revisa los logs con: docker logs erp-system" -ForegroundColor Yellow
    exit 1
}
