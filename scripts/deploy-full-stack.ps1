# Despliegue Completo - ERP System
param(
    [string]$BackendPath = "C:\dev\erp-project\backend",
    [switch]$SkipBackendBuild
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Despliegue Completo - ERP System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow
docker version | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Docker esta corriendo" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Docker no esta corriendo" -ForegroundColor Red
    exit 1
}

# Obtener y actualizar IP de WSL
Write-Host "[2/6] Actualizando IP de WSL..." -ForegroundColor Yellow
$wslIP = (wsl hostname -I).Trim()
Write-Host "  IP de WSL: $wslIP" -ForegroundColor Cyan
.\scripts\update-wsl-ip.ps1

# Construir Backend
if (-not $SkipBackendBuild) {
    Write-Host "[3/6] Construyendo Backend..." -ForegroundColor Yellow
    if (Test-Path $BackendPath) {
        Push-Location $BackendPath
        docker build -t erp-backend:latest .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR al construir backend" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Host "  OK - Backend construido" -ForegroundColor Green
    } else {
        Write-Host "  ERROR - No se encuentra: $BackendPath" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[3/6] Omitiendo construccion del backend" -ForegroundColor Yellow
}

# Detener servicios anteriores
Write-Host "[4/6] Deteniendo servicios anteriores..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Levantar servicios
Write-Host "[5/6] Levantando servicios..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Servicios levantados" -ForegroundColor Green
} else {
    Write-Host "  ERROR al levantar servicios" -ForegroundColor Red
    exit 1
}

# Esperar y verificar
Write-Host "[6/6] Esperando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Despliegue Completado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estado:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""
Write-Host "Ver logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
