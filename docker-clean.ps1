# Script para limpiar recursos Docker del Frontend
# Uso: .\docker-clean.ps1

Write-Host "Limpiando recursos Docker del Frontend..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script realizara las siguientes acciones:" -ForegroundColor Yellow
Write-Host "   1. Detener contenedor erp-system (si esta corriendo)" -ForegroundColor White
Write-Host "   2. Eliminar contenedor erp-system" -ForegroundColor White
Write-Host "   3. Eliminar imagen erp-frontend:latest" -ForegroundColor White
Write-Host "   4. Limpiar imagenes huerfanas" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Deseas continuar? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "Operacion cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Detener contenedor si esta corriendo
$containerRunning = docker ps -q -f name=erp-system
if ($containerRunning) {
    Write-Host "Deteniendo contenedor erp-system..." -ForegroundColor Yellow
    docker stop erp-system | Out-Null
    Write-Host "   Contenedor detenido" -ForegroundColor Green
}

# Eliminar contenedor
$containerExists = docker ps -aq -f name=erp-system
if ($containerExists) {
    Write-Host "Eliminando contenedor erp-system..." -ForegroundColor Yellow
    docker rm erp-system | Out-Null
    Write-Host "   Contenedor eliminado" -ForegroundColor Green
}

# Eliminar imagen
$imageExists = docker images -q erp-frontend:latest
if ($imageExists) {
    Write-Host "Eliminando imagen erp-frontend:latest..." -ForegroundColor Yellow
    docker rmi erp-frontend:latest | Out-Null
    Write-Host "   Imagen eliminada" -ForegroundColor Green
}

# Limpiar imagenes huerfanas
Write-Host "Limpiando imagenes huerfanas..." -ForegroundColor Yellow
docker image prune -f | Out-Null
Write-Host "   Limpieza completada" -ForegroundColor Green

Write-Host ""
Write-Host "Recursos Docker limpiados exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Para reconstruir:" -ForegroundColor Yellow
Write-Host "   1. Construir imagen: .\docker-build.ps1" -ForegroundColor White
Write-Host "   2. Ejecutar contenedor: .\docker-run.ps1" -ForegroundColor White
