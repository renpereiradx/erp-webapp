# ==============================================================================
# Script de Verificación de Ruta del Backend
# ==============================================================================
# Este script verifica que la ruta del backend en docker-compose.yml existe
# antes de ejecutar docker-compose up
#
# Uso: .\verify-backend-path.ps1

Write-Host "=== Verificando configuración de Docker Compose ===" -ForegroundColor Cyan
Write-Host ""

# Leer el docker-compose.yml
$dockerComposePath = ".\docker-compose.yml"
if (-not (Test-Path $dockerComposePath)) {
    Write-Host "❌ ERROR: No se encontró docker-compose.yml en el directorio actual" -ForegroundColor Red
    exit 1
}

$dockerComposeContent = Get-Content $dockerComposePath -Raw

# Extraer la ruta del context del backend
$contextMatch = $dockerComposeContent | Select-String -Pattern "context:\s*(.+)" -AllMatches
$backendContext = $null

foreach ($match in $contextMatch.Matches) {
    $value = $match.Groups[1].Value.Trim()
    # Buscar el context que corresponde al backend (después de "backend:")
    if ($dockerComposeContent.IndexOf($match.Value) -gt $dockerComposeContent.IndexOf("backend:")) {
        if ($value -match "\.\./") {
            $backendContext = $value
            break
        }
    }
}

if (-not $backendContext) {
    Write-Host "❌ ERROR: No se pudo encontrar la ruta del context del backend en docker-compose.yml" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Ruta configurada en docker-compose.yml: $backendContext" -ForegroundColor Yellow

# Convertir la ruta relativa a absoluta
$backendAbsolutePath = Join-Path (Get-Location) $backendContext | Resolve-Path -ErrorAction SilentlyContinue

# Verificar si existe
if (Test-Path $backendAbsolutePath) {
    Write-Host "✅ La ruta del backend existe: $backendAbsolutePath" -ForegroundColor Green
    
    # Verificar que tenga un Dockerfile
    $dockerfilePath = Join-Path $backendAbsolutePath "Dockerfile"
    if (Test-Path $dockerfilePath) {
        Write-Host "✅ Dockerfile encontrado en el backend" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ADVERTENCIA: No se encontró Dockerfile en $backendAbsolutePath" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ ERROR: La ruta del backend NO existe" -ForegroundColor Red
    Write-Host ""
    Write-Host "La ruta configurada '$backendContext' no existe." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ubicaciones comunes del backend:" -ForegroundColor Cyan
    Write-Host "  • ../backend" -ForegroundColor White
    Write-Host "  • ../business_management" -ForegroundColor White
    Write-Host "  • ../../backend" -ForegroundColor White
    Write-Host ""
    Write-Host "Para corregir:" -ForegroundColor Cyan
    Write-Host "  1. Localiza el directorio del backend en tu sistema" -ForegroundColor White
    Write-Host "  2. Actualiza la línea 'context:' en docker-compose.yml (sección backend)" -ForegroundColor White
    Write-Host "  3. Vuelve a ejecutar este script para verificar" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host ""
Write-Host "✅ Verificación completada exitosamente" -ForegroundColor Green
Write-Host "Puedes ejecutar: docker-compose up --build -d" -ForegroundColor Cyan
Write-Host ""
