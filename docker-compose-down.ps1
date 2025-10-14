# Script para detener el stack completo con Docker Compose
# Uso: 
#   .\docker-compose-down.ps1           # Detener servicios
#   .\docker-compose-down.ps1 -Remove   # Detener y eliminar volumenes

param(
    [switch]$Remove
)

Write-Host "Deteniendo stack completo..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: No se encontro docker-compose.yml" -ForegroundColor Red
    exit 1
}

if ($Remove) {
    Write-Host "Se eliminaran tambien los volumenes" -ForegroundColor Yellow
    Write-Host ""
    docker-compose down -v
} else {
    docker-compose down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Stack detenido exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Yellow
    Write-Host "   Para iniciar nuevamente: .\docker-compose-up.ps1" -ForegroundColor White
    Write-Host "   Para limpiar todo: docker system prune -a" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Error al detener el stack" -ForegroundColor Red
    exit 1
}
