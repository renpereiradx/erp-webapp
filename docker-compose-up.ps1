# Script para iniciar el stack completo con Docker Compose
# Uso: .\docker-compose-up.ps1

Write-Host "Iniciando stack completo con Docker Compose..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: No se encontro docker-compose.yml" -ForegroundColor Red
    exit 1
}

# Verificar que existe .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "Advertencia: No se encontro .env.production" -ForegroundColor Yellow
    Write-Host "Se usara la configuracion por defecto" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Servicios que se iniciaran:" -ForegroundColor Yellow
Write-Host "   - erp-system (Frontend React + Nginx) en http://localhost:8080" -ForegroundColor White
Write-Host "   - erp-backend (API Backend) en http://localhost:5050" -ForegroundColor White
Write-Host ""

# Construir e iniciar los servicios
Write-Host "Construyendo e iniciando servicios..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Stack iniciado exitosamente!" -ForegroundColor Green
    Write-Host ""
    
    # Esperar un momento para que los contenedores inicien
    Start-Sleep -Seconds 3
    
    Write-Host "Estado de los servicios:" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
    
    Write-Host "URLs disponibles:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:5050" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "   Ver logs:     docker-compose logs -f" -ForegroundColor White
    Write-Host "   Detener:      docker-compose down" -ForegroundColor White
    Write-Host "   Reiniciar:    docker-compose restart" -ForegroundColor White
    Write-Host "   Estado:       docker-compose ps" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Error al iniciar el stack" -ForegroundColor Red
    Write-Host "Revisa los logs con: docker-compose logs" -ForegroundColor Yellow
    exit 1
}
