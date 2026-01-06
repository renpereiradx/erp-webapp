# ==========================================
# Script de Despliegue Completo a Producción
# Versión: 2.0 (Enero 2026)
# ==========================================
# Este script automatiza todo el proceso de despliegue

param(
    [switch]$SkipBuild,
    [switch]$NoCache,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot/.."

# Colores para output
function Write-Step {
    param($Message)
    Write-Host "`n===> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Banner
Clear-Host
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 ERP PRODUCTION DEPLOYMENT V2.0 🚀            ║
║                                                           ║
║              Frontend + Backend + Docker                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Start-Sleep -Seconds 1

# ==========================================
# PASO 0: Verificaciones Iniciales
# ==========================================
Write-Step "Verificando pre-requisitos..."

# Verificar Docker
Write-Host "  • Verificando Docker..." -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success " Docker encontrado"
        Write-Info "    Versión: $dockerVersion"
    }
} catch {
    Write-Error-Custom " Docker no está instalado o no está corriendo"
    Write-Host "`nPor favor, inicia Docker Desktop y vuelve a ejecutar el script." -ForegroundColor Yellow
    exit 1
}

# Verificar Docker Compose
Write-Host "  • Verificando Docker Compose..." -NoNewline
try {
    docker-compose --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success " Docker Compose disponible"
    }
} catch {
    Write-Error-Custom " Docker Compose no disponible"
    exit 1
}

# Verificar pnpm
Write-Host "  • Verificando pnpm..." -NoNewline
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success " pnpm encontrado"
        Write-Info "    Versión: $pnpmVersion"
    }
} catch {
    Write-Warning-Custom " pnpm no encontrado"
    Write-Host "    Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Verificar archivos críticos
Write-Host "  • Verificando archivos de configuración..." -NoNewline
$requiredFiles = @(
    ".env.production",
    "docker-compose.yml",
    "Dockerfile",
    "nginx.conf",
    "package.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Success " Todos los archivos presentes"
} else {
    Write-Error-Custom " Archivos faltantes:"
    foreach ($file in $missingFiles) {
        Write-Host "    ❌ $file" -ForegroundColor Red
    }
    exit 1
}

Write-Success "Pre-requisitos verificados correctamente"

# ==========================================
# PASO 1: Limpieza
# ==========================================
Write-Step "Deteniendo contenedores existentes..."

docker-compose down 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Contenedores detenidos"
} else {
    Write-Warning-Custom "No había contenedores corriendo"
}

# Limpiar builds anteriores
if (-not $SkipBuild) {
    Write-Step "Limpiando builds anteriores..."
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Success "Directorio dist limpiado"
    }
    
    if (Test-Path "node_modules\.vite") {
        Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
        Write-Success "Caché de Vite limpiado"
    }
}

# ==========================================
# PASO 2: Dependencias
# ==========================================
if (-not $SkipBuild) {
    Write-Step "Instalando/actualizando dependencias..."
    
    Write-Host "  Ejecutando: pnpm install --frozen-lockfile" -ForegroundColor Gray
    pnpm install --frozen-lockfile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencias instaladas correctamente"
    } else {
        Write-Error-Custom "Error al instalar dependencias"
        exit 1
    }
}

# ==========================================
# PASO 3: Build del Frontend
# ==========================================
if (-not $SkipBuild) {
    Write-Step "Construyendo frontend para producción..."
    
    Write-Host "  Ejecutando: pnpm build" -ForegroundColor Gray
    pnpm build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completado exitosamente"
        
        # Verificar que se generó dist/
        if (Test-Path "dist\index.html") {
            $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum
            $distSizeMB = [math]::Round($distSize / 1MB, 2)
            Write-Info "    Tamaño del build: $distSizeMB MB"
        } else {
            Write-Error-Custom "El build no generó dist/index.html"
            exit 1
        }
    } else {
        Write-Error-Custom "Error en el build del frontend"
        exit 1
    }
} else {
    Write-Warning-Custom "Omitiendo build del frontend (--SkipBuild)"
}

# ==========================================
# PASO 4: Build de imágenes Docker
# ==========================================
Write-Step "Construyendo imágenes Docker..."

# Frontend
Write-Host "`n  📦 Construyendo imagen del FRONTEND..." -ForegroundColor Cyan
if ($NoCache) {
    Write-Info "    Usando --no-cache"
    docker build --no-cache -t erp-frontend:latest -f Dockerfile .
} else {
    docker build -t erp-frontend:latest -f Dockerfile .
}

if ($LASTEXITCODE -eq 0) {
    Write-Success "Imagen erp-frontend:latest construida"
    
    # Mostrar info de la imagen
    $imageInfo = docker images erp-frontend:latest --format "{{.Size}}"
    Write-Info "    Tamaño: $imageInfo"
} else {
    Write-Error-Custom "Error al construir imagen del frontend"
    exit 1
}

# Backend (opcional)
if (-not $SkipBackend) {
    Write-Host "`n  📦 Construyendo imagen del BACKEND..." -ForegroundColor Cyan
    
    if (Test-Path "..\backend\Dockerfile") {
        Push-Location ..\backend
        
        if ($NoCache) {
            docker build --no-cache -t erp-backend:latest .
        } else {
            docker build -t erp-backend:latest .
        }
        
        $backendBuildSuccess = $LASTEXITCODE -eq 0
        Pop-Location
        
        if ($backendBuildSuccess) {
            Write-Success "Imagen erp-backend:latest construida"
        } else {
            Write-Warning-Custom "No se pudo construir la imagen del backend"
            Write-Info "    Continuando con el despliegue..."
        }
    } else {
        Write-Warning-Custom "No se encontró Dockerfile del backend en ..\backend"
        Write-Info "    Asegúrate de que la imagen erp-backend:latest exista"
    }
} else {
    Write-Warning-Custom "Omitiendo build del backend (--SkipBackend)"
}

# ==========================================
# PASO 5: Iniciar servicios con Docker Compose
# ==========================================
Write-Step "Iniciando servicios con Docker Compose..."

Write-Host "  Ejecutando: docker-compose up -d" -ForegroundColor Gray
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Success "Servicios iniciados correctamente"
} else {
    Write-Error-Custom "Error al iniciar servicios"
    exit 1
}

# Esperar un momento para que los contenedores inicien
Write-Host "`n  ⏳ Esperando a que los servicios se inicialicen..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# ==========================================
# PASO 6: Verificación
# ==========================================
Write-Step "Verificando despliegue..."

# Estado de contenedores
Write-Host "`n  📊 Estado de contenedores:" -ForegroundColor Cyan
docker-compose ps

# Health checks
Write-Host "`n  🏥 Health Checks:" -ForegroundColor Cyan

# Frontend
Write-Host "    • Frontend (http://localhost:8080)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Success " OK"
    } else {
        Write-Warning-Custom " Status: $($response.StatusCode)"
    }
} catch {
    Write-Warning-Custom " No responde (puede necesitar más tiempo)"
}

# Backend directo
Write-Host "    • Backend directo (http://localhost:5050)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5050/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Success " OK"
    } else {
        Write-Warning-Custom " Status: $($response.StatusCode)"
    }
} catch {
    Write-Warning-Custom " No responde"
}

# Backend via proxy
Write-Host "    • Backend via proxy (http://localhost:8080/api)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Success " OK"
    } else {
        Write-Warning-Custom " Status: $($response.StatusCode)"
    }
} catch {
    Write-Warning-Custom " No responde (verificar nginx proxy)"
}

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ✅ DESPLIEGUE COMPLETADO ✅                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host @"

📍 URLs Disponibles:
   • Frontend:        http://localhost:8080
   • Backend:         http://localhost:5050
   • API via Proxy:   http://localhost:8080/api

📋 Comandos útiles:
   • Ver logs:        docker-compose logs -f
   • Reiniciar:       docker-compose restart
   • Detener:         docker-compose down
   • Estado:          docker-compose ps

🔍 Verificación adicional:
   • Ver logs frontend:  docker-compose logs -f erp-system
   • Ver logs backend:   docker-compose logs -f backend
   • Entrar a frontend:  docker exec -it erp-system sh

"@ -ForegroundColor White

Write-Host "💡 Tip: Si algo no funciona, ejecuta:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""

# Preguntar si quiere ver los logs
$viewLogs = Read-Host "¿Deseas ver los logs en tiempo real? (s/N)"
if ($viewLogs -eq "s" -or $viewLogs -eq "S" -or $viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host "`n📜 Mostrando logs (Ctrl+C para salir)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    docker-compose logs -f
}

Write-Host "`n🎉 ¡Despliegue finalizado con éxito!" -ForegroundColor Green
