# =====================================
# Script para Actualizar IP de WSL en docker-compose.yml
# =====================================
# La IP de WSL puede cambiar después de reiniciar Windows
# Este script actualiza automáticamente la configuración

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Actualizar IP de WSL en Docker Config" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener IP actual de WSL
Write-Host "Obteniendo IP de WSL..." -ForegroundColor Yellow
try {
    $wslIP = wsl hostname -I
    $wslIP = $wslIP.Trim()
    
    if ([string]::IsNullOrWhiteSpace($wslIP)) {
        throw "No se pudo obtener la IP de WSL"
    }
    
    Write-Host "✓ IP de WSL: $wslIP" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al obtener IP de WSL: $_" -ForegroundColor Red
    Write-Host "Asegúrate de que WSL esté instalado y corriendo" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Leer docker-compose.yml
$dockerComposePath = Join-Path (Get-Location) "docker-compose.yml"
if (-not (Test-Path $dockerComposePath)) {
    Write-Host "✗ Error: No se encuentra docker-compose.yml en el directorio actual" -ForegroundColor Red
    exit 1
}

Write-Host "Actualizando docker-compose.yml..." -ForegroundColor Yellow

# Leer contenido
$content = Get-Content $dockerComposePath -Raw

# Verificar si ya tiene una IP configurada
if ($content -match "DB_HOST=(\d+\.\d+\.\d+\.\d+)") {
    $oldIP = $matches[1]
    Write-Host "IP anterior: $oldIP" -ForegroundColor Gray
    
    if ($oldIP -eq $wslIP) {
        Write-Host "✓ La IP ya está actualizada" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
    
    # Reemplazar todas las ocurrencias de la IP antigua
    $content = $content -replace [regex]::Escape($oldIP), $wslIP
} else {
    # Si no encuentra IP, reemplazar host.docker.internal
    Write-Host "Reemplazando host.docker.internal con IP de WSL..." -ForegroundColor Gray
    $content = $content -replace "host\.docker\.internal", $wslIP
}

# Guardar cambios
try {
    $content | Set-Content -Path $dockerComposePath -NoNewline
    Write-Host "✓ docker-compose.yml actualizado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al guardar cambios: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuración Actualizada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL en WSL: $wslIP:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puedes verificar la conexión con:" -ForegroundColor Yellow
Write-Host "  wsl psql -h 172.25.57.141 -U dev_user -d erp_db" -ForegroundColor White
Write-Host ""
Write-Host "Siguiente paso: Ejecutar docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
