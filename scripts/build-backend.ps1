# =====================================
# Script para construir imagen Docker del Backend
# =====================================
# Este script construye la imagen Docker del backend desde su directorio

param(
    [string]$BackendPath = "C:\dev\erp-project\backend",
    [string]$ImageName = "erp-backend:latest"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Construyendo imagen Docker del Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Docker no está corriendo o no está instalado" -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a intentarlo" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe el directorio del backend
Write-Host ""
Write-Host "Verificando directorio del backend..." -ForegroundColor Yellow
if (-not (Test-Path $BackendPath)) {
    Write-Host "✗ Error: No se encuentra el directorio del backend en: $BackendPath" -ForegroundColor Red
    Write-Host "Por favor, ajusta la ruta usando el parámetro -BackendPath" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Directorio encontrado: $BackendPath" -ForegroundColor Green

# Verificar que existe un Dockerfile en el directorio del backend
$dockerfilePath = Join-Path $BackendPath "Dockerfile"
if (-not (Test-Path $dockerfilePath)) {
    Write-Host "✗ Error: No se encuentra Dockerfile en: $dockerfilePath" -ForegroundColor Red
    Write-Host "Por favor, crea un Dockerfile en el directorio del backend" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Dockerfile encontrado" -ForegroundColor Green

# Construir la imagen
Write-Host ""
Write-Host "Construyendo imagen: $ImageName" -ForegroundColor Yellow
Write-Host "Directorio: $BackendPath" -ForegroundColor Gray
Write-Host ""

try {
    Push-Location $BackendPath
    
    docker build -t $ImageName .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✓ Imagen construida exitosamente" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Imagen: $ImageName" -ForegroundColor Cyan
        
        # Mostrar información de la imagen
        Write-Host ""
        Write-Host "Información de la imagen:" -ForegroundColor Yellow
        docker images $ImageName
        
        Write-Host ""
        Write-Host "La imagen está lista para ser usada en docker-compose" -ForegroundColor Green
    } else {
        throw "Error al construir la imagen"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ Error al construir la imagen" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Siguiente paso: Ejecutar docker-compose up -d" -ForegroundColor Cyan
