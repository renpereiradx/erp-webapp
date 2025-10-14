# Script para construir la imagen Docker del Frontend
# Uso: .\docker-build.ps1

Write-Host "Construyendo imagen Docker del Frontend..." -ForegroundColor Cyan
Write-Host "Nombre de imagen: erp-frontend:latest" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe el archivo .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "Error: No se encontro el archivo .env.production" -ForegroundColor Red
    Write-Host "Crea el archivo .env.production antes de construir" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe el Dockerfile
if (-not (Test-Path "Dockerfile")) {
    Write-Host "Error: No se encontro el Dockerfile" -ForegroundColor Red
    exit 1
}

# Verificar que existe nginx.conf
if (-not (Test-Path "nginx.conf")) {
    Write-Host "Error: No se encontro nginx.conf" -ForegroundColor Red
    exit 1
}

Write-Host "Archivos de configuracion encontrados" -ForegroundColor Green
Write-Host ""

# Construir la imagen
Write-Host "Iniciando construccion..." -ForegroundColor Cyan
docker build -t erp-frontend:latest -f Dockerfile .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Imagen construida exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacion de la imagen:" -ForegroundColor Cyan
    docker images erp-frontend:latest
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Para ejecutar el contenedor: .\docker-run.ps1" -ForegroundColor White
    Write-Host "   2. Para usar Docker Compose: docker-compose up -d" -ForegroundColor White
    Write-Host "   3. Para limpiar imagenes antiguas: docker image prune -f" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Error al construir la imagen" -ForegroundColor Red
    Write-Host "Revisa los logs anteriores para mas detalles" -ForegroundColor Yellow
    exit 1
}
