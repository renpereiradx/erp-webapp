# =====================================
# Script de Verificación de Estado - ERP System
# =====================================
# Este script verifica el estado completo del sistema

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificación de Estado - ERP System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# =====================================
# 1. VERIFICAR DOCKER
# =====================================

Write-Host "1. Estado de Docker" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    docker version | Out-Null
    Write-Host "✓ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no está corriendo" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =====================================
# 2. VERIFICAR POSTGRESQL
# =====================================

Write-Host "2. Estado de PostgreSQL" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $pgProcess = Get-Process postgres -ErrorAction SilentlyContinue
    if ($pgProcess) {
        Write-Host "✓ PostgreSQL está corriendo" -ForegroundColor Green
        Write-Host "  PID: $($pgProcess.Id)" -ForegroundColor Gray
    } else {
        Write-Host "✗ PostgreSQL no está corriendo" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠ No se pudo verificar PostgreSQL" -ForegroundColor Yellow
}

# Verificar puerto 5432
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5432)
    $tcpClient.Close()
    Write-Host "✓ Puerto 5432 está accesible" -ForegroundColor Green
} catch {
    Write-Host "✗ Puerto 5432 no está accesible" -ForegroundColor Red
}

Write-Host ""

# =====================================
# 3. VERIFICAR CONTENEDORES
# =====================================

Write-Host "3. Estado de Contenedores" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$containers = docker ps --filter "name=erp-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if ($containers) {
    Write-Host $containers
} else {
    Write-Host "⚠ No hay contenedores ERP corriendo" -ForegroundColor Yellow
}

Write-Host ""

# =====================================
# 4. VERIFICAR IMÁGENES
# =====================================

Write-Host "4. Imágenes Docker Disponibles" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$backendImage = docker images erp-backend:latest --format "{{.Repository}}:{{.Tag}}"
if ($backendImage) {
    Write-Host "✓ Imagen del backend encontrada: $backendImage" -ForegroundColor Green
} else {
    Write-Host "✗ Imagen del backend no encontrada" -ForegroundColor Red
    Write-Host "  Ejecuta: .\scripts\build-backend.ps1" -ForegroundColor Yellow
}

$frontendImages = docker images --filter "reference=erp-webapp*" --format "{{.Repository}}:{{.Tag}}"
if ($frontendImages) {
    Write-Host "✓ Imágenes del frontend encontradas" -ForegroundColor Green
} else {
    Write-Host "⚠ No se encontraron imágenes del frontend" -ForegroundColor Yellow
}

Write-Host ""

# =====================================
# 5. VERIFICAR ENDPOINTS
# =====================================

Write-Host "5. Verificación de Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Backend directo
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5050/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✓ Backend (directo): http://localhost:5050/health" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend (directo): http://localhost:5050/health - No responde" -ForegroundColor Red
}

# Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✓ Frontend: http://localhost:8080/" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend: http://localhost:8080/ - No responde" -ForegroundColor Red
}

# Backend vía proxy
try {
    $proxyResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($proxyResponse.StatusCode -eq 200) {
        Write-Host "✓ Backend (vía proxy): http://localhost:8080/api/health" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend (vía proxy): http://localhost:8080/api/health - No responde" -ForegroundColor Red
}

Write-Host ""

# =====================================
# 6. VERIFICAR REDES
# =====================================

Write-Host "6. Redes Docker" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$erpNetwork = docker network ls --filter "name=erp-network" --format "{{.Name}}"
if ($erpNetwork) {
    Write-Host "✓ Red erp-network encontrada" -ForegroundColor Green
} else {
    Write-Host "⚠ Red erp-network no encontrada" -ForegroundColor Yellow
}

Write-Host ""

# =====================================
# 7. LOGS RECIENTES
# =====================================

Write-Host "7. Logs Recientes (últimas 5 líneas)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$backendContainer = docker ps --filter "name=erp-backend" --format "{{.Names}}" -q
if ($backendContainer) {
    Write-Host ""
    Write-Host "Backend:" -ForegroundColor Cyan
    docker logs erp-backend --tail=5 2>&1
}

$frontendContainer = docker ps --filter "name=erp-frontend" --format "{{.Names}}" -q
if ($frontendContainer) {
    Write-Host ""
    Write-Host "Frontend:" -ForegroundColor Cyan
    docker logs erp-frontend --tail=5 2>&1
}

Write-Host ""

# =====================================
# 8. USO DE RECURSOS
# =====================================

Write-Host "8. Uso de Recursos" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

docker stats --no-stream --filter "name=erp-"

Write-Host ""

# =====================================
# RESUMEN
# =====================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumen" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$isHealthy = $true

# Verificar si todo está OK
if (-not (docker ps --filter "name=erp-backend" -q)) {
    $isHealthy = $false
    Write-Host "⚠ Backend no está corriendo" -ForegroundColor Yellow
}

if (-not (docker ps --filter "name=erp-frontend" -q)) {
    $isHealthy = $false
    Write-Host "⚠ Frontend no está corriendo" -ForegroundColor Yellow
}

if ($isHealthy) {
    Write-Host "✓ Sistema operativo correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Accede a la aplicación: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "📧 Email: admin" -ForegroundColor Gray
    Write-Host "🔑 Password: aDmin404942" -ForegroundColor Gray
} else {
    Write-Host "⚠ Sistema no completamente operativo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para iniciar el sistema, ejecuta:" -ForegroundColor Cyan
    Write-Host "  .\scripts\deploy-full-stack.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Comandos Útiles" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver logs en tiempo real:  docker-compose logs -f" -ForegroundColor White
Write-Host "Reiniciar servicios:      docker-compose restart" -ForegroundColor White
Write-Host "Detener servicios:        docker-compose down" -ForegroundColor White
Write-Host "Estado de servicios:      docker-compose ps" -ForegroundColor White
Write-Host ""
