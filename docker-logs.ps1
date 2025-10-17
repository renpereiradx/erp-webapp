# Script para ver logs del contenedor Docker del Frontend
# Uso: 
#   .\docker-logs.ps1           # Ver logs
#   .\docker-logs.ps1 -Follow   # Seguir logs en tiempo real

param(
    [switch]$Follow
)

Write-Host "Logs del contenedor erp-system" -ForegroundColor Cyan
Write-Host ""

# Verificar si el contenedor existe
$containerExists = docker ps -aq -f name=erp-system
if (-not $containerExists) {
    Write-Host "Error: El contenedor erp-system no existe" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\docker-run.ps1" -ForegroundColor Yellow
    exit 1
}

# Ver logs
if ($Follow) {
    Write-Host "Siguiendo logs en tiempo real (Ctrl+C para salir)..." -ForegroundColor Yellow
    Write-Host ""
    docker logs -f erp-system
} else {
    docker logs erp-system
}
