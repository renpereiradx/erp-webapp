# Script para detener el contenedor Docker del Frontend
# Uso: .\docker-stop.ps1

Write-Host "Deteniendo contenedor del Frontend..." -ForegroundColor Cyan
Write-Host ""

# Verificar si el contenedor existe
$containerExists = docker ps -aq -f name=erp-system
if (-not $containerExists) {
    Write-Host "El contenedor erp-system no existe" -ForegroundColor Yellow
    exit 0
}

# Verificar si el contenedor esta corriendo
$containerRunning = docker ps -q -f name=erp-system
if (-not $containerRunning) {
    Write-Host "El contenedor erp-system ya esta detenido" -ForegroundColor Yellow
    Write-Host "Para eliminarlo: docker rm erp-system" -ForegroundColor White
    exit 0
}

# Detener el contenedor
docker stop erp-system

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Contenedor detenido exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Yellow
    Write-Host "   Para iniciar nuevamente: .\docker-run.ps1" -ForegroundColor White
    Write-Host "   Para eliminar: docker rm erp-system" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Error al detener el contenedor" -ForegroundColor Red
    exit 1
}
