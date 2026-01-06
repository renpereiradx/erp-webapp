# ==========================================
# Script de Despliegue Completo a Producción
# Versión: 2.0 (Enero 2026) - Sin Emojis
# ==========================================

param(
    [switch]$SkipBuild,
    [switch]$NoCache,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot/.."

# Banner
Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "          ERP PRODUCTION DEPLOYMENT V2.0                 " -ForegroundColor Cyan
Write-Host "            Frontend + Backend + Docker                  " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 1

# ==========================================
# PASO 0: Verificaciones Iniciales
# ==========================================
Write-Host "`n===> Verificando pre-requisitos..." -ForegroundColor Cyan

# Verificar Docker
Write-Host "  [*] Verificando Docker..." -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "      Version: $dockerVersion" -ForegroundColor Gray
    }
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Host "`nPor favor, inicia Docker Desktop y vuelve a ejecutar el script." -ForegroundColor Yellow
    exit 1
}

# Verificar Docker Compose
Write-Host "  [*] Verificando Docker Compose..." -NoNewline
try {
    docker-compose --version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    }
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    exit 1
}

# Verificar pnpm
Write-Host "  [*] Verificando pnpm..." -NoNewline
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "      Version: $pnpmVersion" -ForegroundColor Gray
    }
} catch {
    Write-Host " ADVERTENCIA" -ForegroundColor Yellow
    Write-Host "      Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Verificar archivos críticos
Write-Host "  [*] Verificando archivos de configuracion..." -NoNewline
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
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERROR" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "      Falta: $file" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n[OK] Pre-requisitos verificados correctamente" -ForegroundColor Green

# ==========================================
# PASO 1: Limpieza
# ==========================================
Write-Host "`n===> Deteniendo contenedores existentes..." -ForegroundColor Cyan

docker-compose down 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Contenedores detenidos" -ForegroundColor Green
} else {
    Write-Host "[INFO] No habia contenedores corriendo" -ForegroundColor Yellow
}

# Limpiar builds anteriores
if (-not $SkipBuild) {
    Write-Host "`n===> Limpiando builds anteriores..." -ForegroundColor Cyan
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Host "[OK] Directorio dist limpiado" -ForegroundColor Green
    }
    
    if (Test-Path "node_modules\.vite") {
        Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
        Write-Host "[OK] Cache de Vite limpiado" -ForegroundColor Green
    }
}

# ==========================================
# PASO 2: Dependencias
# ==========================================
if (-not $SkipBuild) {
    Write-Host "`n===> Instalando/actualizando dependencias..." -ForegroundColor Cyan
    
    Write-Host "  Ejecutando: pnpm install --frozen-lockfile" -ForegroundColor Gray
    pnpm install --frozen-lockfile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencias instaladas correctamente" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

# ==========================================
# PASO 3: Build del Frontend
# ==========================================
if (-not $SkipBuild) {
    Write-Host "`n===> Construyendo frontend para produccion..." -ForegroundColor Cyan
    
    Write-Host "  Ejecutando: pnpm build" -ForegroundColor Gray
    pnpm build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build completado exitosamente" -ForegroundColor Green
        
        # Verificar que se generó dist/
        if (Test-Path "dist\index.html") {
            $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum
            $distSizeMB = [math]::Round($distSize / 1MB, 2)
            Write-Host "  Tamaño del build: $distSizeMB MB" -ForegroundColor Gray
        } else {
            Write-Host "[ERROR] El build no genero dist/index.html" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[ERROR] Error en el build del frontend" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[INFO] Omitiendo build del frontend (--SkipBuild)" -ForegroundColor Yellow
}

# ==========================================
# PASO 4: Build de imágenes Docker
# ==========================================
Write-Host "`n===> Construyendo imagenes Docker..." -ForegroundColor Cyan

# Frontend
Write-Host "`n  [*] Construyendo imagen del FRONTEND..." -ForegroundColor Cyan
if ($NoCache) {
    Write-Host "      Usando --no-cache" -ForegroundColor Gray
    docker build --no-cache -t erp-frontend:latest -f Dockerfile .
} else {
    docker build -t erp-frontend:latest -f Dockerfile .
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Imagen erp-frontend:latest construida" -ForegroundColor Green
    
    # Mostrar info de la imagen
    $imageInfo = docker images erp-frontend:latest --format "{{.Size}}"
    Write-Host "      Tamaño: $imageInfo" -ForegroundColor Gray
} else {
    Write-Host "  [ERROR] Error al construir imagen del frontend" -ForegroundColor Red
    exit 1
}

# Backend (opcional)
if (-not $SkipBackend) {
    Write-Host "`n  [*] Verificando imagen del BACKEND..." -ForegroundColor Cyan
    
    $backendExists = docker images erp-backend:latest --format "{{.Repository}}"
    if ($backendExists) {
        Write-Host "  [OK] Imagen erp-backend:latest encontrada" -ForegroundColor Green
    } else {
        Write-Host "  [ADVERTENCIA] Imagen erp-backend:latest no encontrada" -ForegroundColor Yellow
        
        if (Test-Path "..\backend\Dockerfile") {
            Write-Host "      Intentando construir desde ..\backend" -ForegroundColor Yellow
            Push-Location ..\backend
            
            if ($NoCache) {
                docker build --no-cache -t erp-backend:latest .
            } else {
                docker build -t erp-backend:latest .
            }
            
            $backendBuildSuccess = $LASTEXITCODE -eq 0
            Pop-Location
            
            if ($backendBuildSuccess) {
                Write-Host "  [OK] Imagen erp-backend:latest construida" -ForegroundColor Green
            } else {
                Write-Host "  [ADVERTENCIA] No se pudo construir backend" -ForegroundColor Yellow
                Write-Host "      Continuando con el despliegue..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "      No se encontro Dockerfile del backend" -ForegroundColor Yellow
            Write-Host "      Asegurate de que la imagen exista o el backend este corriendo" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`n  [INFO] Omitiendo verificacion del backend (--SkipBackend)" -ForegroundColor Yellow
}

# ==========================================
# PASO 5: Iniciar servicios con Docker Compose
# ==========================================
Write-Host "`n===> Iniciando servicios con Docker Compose..." -ForegroundColor Cyan

Write-Host "  Ejecutando: docker-compose up -d" -ForegroundColor Gray
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Servicios iniciados correctamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

# Esperar un momento para que los contenedores inicien
Write-Host "`n  Esperando a que los servicios se inicialicen..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# ==========================================
# PASO 6: Verificación
# ==========================================
Write-Host "`n===> Verificando despliegue..." -ForegroundColor Cyan

# Estado de contenedores
Write-Host "`n  Estado de contenedores:" -ForegroundColor Cyan
docker-compose ps

# Health checks
Write-Host "`n  Health Checks:" -ForegroundColor Cyan

# Frontend
Write-Host "    [*] Frontend (http://localhost:8080)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " NO RESPONDE (puede necesitar mas tiempo)" -ForegroundColor Yellow
}

# Backend directo
Write-Host "    [*] Backend directo (http://localhost:5050)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5050/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " NO RESPONDE" -ForegroundColor Yellow
}

# Backend via proxy
Write-Host "    [*] Backend via proxy (http://localhost:8080/api)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " NO RESPONDE (verificar nginx proxy)" -ForegroundColor Yellow
}

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "              DESPLIEGUE COMPLETADO                      " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

Write-Host "`nURLs Disponibles:" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:         http://localhost:5050" -ForegroundColor White
Write-Host "   API via Proxy:   http://localhost:8080/api" -ForegroundColor White

Write-Host "`nComandos utiles:" -ForegroundColor Cyan
Write-Host "   Ver logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "   Reiniciar:       docker-compose restart" -ForegroundColor White
Write-Host "   Detener:         docker-compose down" -ForegroundColor White
Write-Host "   Estado:          docker-compose ps" -ForegroundColor White

Write-Host "`nVerificacion adicional:" -ForegroundColor Cyan
Write-Host "   Ver logs frontend:  docker-compose logs -f erp-system" -ForegroundColor White
Write-Host "   Ver logs backend:   docker-compose logs -f backend" -ForegroundColor White
Write-Host "   Entrar a frontend:  docker exec -it erp-system sh" -ForegroundColor White

Write-Host "`nTip: Si algo no funciona, ejecuta:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""

# Preguntar si quiere ver los logs
$viewLogs = Read-Host "Deseas ver los logs en tiempo real? (s/N)"
if ($viewLogs -eq "s" -or $viewLogs -eq "S" -or $viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host "`nMostrando logs (Ctrl+C para salir)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    docker-compose logs -f
}

Write-Host "`nDespliegue finalizado con exito!" -ForegroundColor Green
