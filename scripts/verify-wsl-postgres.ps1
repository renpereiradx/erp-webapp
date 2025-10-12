# Script de Verificacion - PostgreSQL en WSL
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificacion PostgreSQL en WSL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar WSL
Write-Host "1. Verificando WSL..." -ForegroundColor Yellow
try {
    wsl --version | Out-Null
    Write-Host "[OK] WSL esta instalado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] WSL no esta funcionando" -ForegroundColor Red
    exit 1
}

# 2. Obtener IP de WSL
Write-Host "2. IP de WSL..." -ForegroundColor Yellow
$wslIP = (wsl hostname -I).Trim()
Write-Host "[OK] IP de WSL: $wslIP" -ForegroundColor Green

# 3. Verificar PostgreSQL
Write-Host "3. Estado de PostgreSQL..." -ForegroundColor Yellow
wsl sudo service postgresql status

Write-Host ""
Write-Host "IP configurada: $wslIP" -ForegroundColor Cyan
Write-Host "Siguiente: .\scripts\deploy-full-stack.ps1" -ForegroundColor Cyan
Write-Host ""
