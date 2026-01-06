# ==========================================
# Script de Despliegue Rápido
# ==========================================
# Uso: .\quick-deploy.ps1

Write-Host @"
╔════════════════════════════════════╗
║   🚀 DESPLIEGUE RÁPIDO ERP 🚀      ║
╚════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 1. Detener servicios
Write-Host "`n[1/5] Deteniendo servicios..." -ForegroundColor Yellow
docker-compose down

# 2. Build Frontend
Write-Host "`n[2/5] Build del frontend..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build" -ForegroundColor Red
    exit 1
}

# 3. Build Docker Frontend
Write-Host "`n[3/5] Construyendo imagen Docker..." -ForegroundColor Yellow
docker build -t erp-frontend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en Docker build" -ForegroundColor Red
    exit 1
}

# 4. Iniciar servicios
Write-Host "`n[4/5] Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

# 5. Esperar y verificar
Write-Host "`n[5/5] Verificando..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose ps

Write-Host @"

✅ ¡Despliegue completado!

📍 Accede en:
   Frontend: http://localhost:8080
   Backend:  http://localhost:5050

📋 Ver logs: docker-compose logs -f

"@ -ForegroundColor Green
