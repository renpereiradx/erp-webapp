# ==========================================
# Script de Verificación Pre-Despliegue
# ==========================================
# Verifica que todo esté listo antes de desplegar

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔍 VERIFICACIÓN PRE-DESPLIEGUE                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$allChecksPassed = $true

# ==========================================
# 1. SOFTWARE REQUERIDO
# ==========================================
Write-Host "`n📦 Verificando software requerido..." -ForegroundColor Yellow

# Docker
Write-Host "  • Docker: " -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ No instalado" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "❌ No instalado o no corriendo" -ForegroundColor Red
    $allChecksPassed = $false
}

# Docker Compose
Write-Host "  • Docker Compose: " -NoNewline
try {
    $composeVersion = docker-compose --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Instalado" -ForegroundColor Green
    } else {
        Write-Host "❌ No instalado" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "❌ No instalado" -ForegroundColor Red
    $allChecksPassed = $false
}

# Node.js
Write-Host "  • Node.js: " -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ No instalado" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "❌ No instalado" -ForegroundColor Red
    $allChecksPassed = $false
}

# pnpm
Write-Host "  • pnpm: " -NoNewline
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ v$pnpmVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No instalado (se puede instalar con: npm install -g pnpm)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No instalado" -ForegroundColor Yellow
}

# ==========================================
# 2. ARCHIVOS DE CONFIGURACIÓN
# ==========================================
Write-Host "`n📄 Verificando archivos de configuración..." -ForegroundColor Yellow

$configFiles = @{
    ".env.production" = $true
    "docker-compose.yml" = $true
    "Dockerfile" = $true
    "nginx.conf" = $true
    "package.json" = $true
    "pnpm-lock.yaml" = $false
}

foreach ($file in $configFiles.Keys) {
    $required = $configFiles[$file]
    Write-Host "  • $file`: " -NoNewline
    
    if (Test-Path $file) {
        Write-Host "✅ Existe" -ForegroundColor Green
    } else {
        if ($required) {
            Write-Host "❌ No encontrado (REQUERIDO)" -ForegroundColor Red
            $allChecksPassed = $false
        } else {
            Write-Host "⚠️  No encontrado (opcional)" -ForegroundColor Yellow
        }
    }
}

# ==========================================
# 3. VARIABLES DE ENTORNO
# ==========================================
Write-Host "`n🔐 Verificando variables de entorno (.env.production)..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    
    $requiredVars = @(
        "VITE_API_URL",
        "VITE_ENV",
        "VITE_AUTO_LOGIN"
    )
    
    foreach ($var in $requiredVars) {
        Write-Host "  • $var`: " -NoNewline
        if ($envContent -match "$var=") {
            Write-Host "✅ Configurado" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No encontrado" -ForegroundColor Yellow
        }
    }
    
    # Verificar que AUTO_LOGIN está en false para producción
    if ($envContent -match "VITE_AUTO_LOGIN=false") {
        Write-Host "  • Auto-login deshabilitado: ✅" -ForegroundColor Green
    } else {
        Write-Host "  • Auto-login: ⚠️  Debería estar en 'false' para producción" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ .env.production no encontrado" -ForegroundColor Red
    $allChecksPassed = $false
}

# ==========================================
# 4. SERVICIOS EXTERNOS
# ==========================================
Write-Host "`n🌐 Verificando servicios externos..." -ForegroundColor Yellow

# PostgreSQL
Write-Host "  • PostgreSQL (localhost:5432): " -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5432)
    $tcpClient.Close()
    Write-Host "✅ Accesible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No accesible" -ForegroundColor Yellow
    Write-Host "    (Asegúrate de que PostgreSQL esté corriendo)" -ForegroundColor Gray
}

# Backend (si está corriendo)
Write-Host "  • Backend (localhost:5050): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5050/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Accesible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No accesible (se iniciará con Docker)" -ForegroundColor Yellow
}

# ==========================================
# 5. ESPACIO EN DISCO
# ==========================================
Write-Host "`n💾 Verificando espacio en disco..." -ForegroundColor Yellow

$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)

Write-Host "  • Espacio libre en C: " -NoNewline
if ($freeSpaceGB -gt 10) {
    Write-Host "✅ $freeSpaceGB GB" -ForegroundColor Green
} elseif ($freeSpaceGB -gt 5) {
    Write-Host "⚠️  $freeSpaceGB GB (quedando poco espacio)" -ForegroundColor Yellow
} else {
    Write-Host "❌ $freeSpaceGB GB (espacio insuficiente)" -ForegroundColor Red
    $allChecksPassed = $false
}

# ==========================================
# 6. GIT STATUS
# ==========================================
Write-Host "`n📝 Verificando estado de Git..." -ForegroundColor Yellow

try {
    # Branch actual
    $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
    Write-Host "  • Branch actual: " -NoNewline
    if ($currentBranch -eq "main") {
        Write-Host "✅ main" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $currentBranch (debería ser 'main')" -ForegroundColor Yellow
    }
    
    # Cambios sin commit
    $gitStatus = git status --porcelain 2>$null
    Write-Host "  • Cambios sin commit: " -NoNewline
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "✅ Ninguno" -ForegroundColor Green
    } else {
        $changedFiles = ($gitStatus -split "`n").Count
        Write-Host "⚠️  $changedFiles archivo(s)" -ForegroundColor Yellow
    }
    
    # Commits sin push
    $unpushedCommits = git log origin/main..HEAD --oneline 2>$null
    Write-Host "  • Commits sin push: " -NoNewline
    if ([string]::IsNullOrWhiteSpace($unpushedCommits)) {
        Write-Host "✅ Ninguno" -ForegroundColor Green
    } else {
        $commitCount = ($unpushedCommits -split "`n").Count
        Write-Host "⚠️  $commitCount commit(s)" -ForegroundColor Yellow
    }
    
    # Pull reciente
    $lastPull = git log -1 --format="%cr" origin/main 2>$null
    Write-Host "  • Último pull: " -NoNewline
    if ($lastPull -match "second|minute") {
        Write-Host "✅ $lastPull" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  $lastPull" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "  ⚠️  No es un repositorio Git o Git no está instalado" -ForegroundColor Yellow
}

# ==========================================
# 7. CONTENEDORES DOCKER EXISTENTES
# ==========================================
Write-Host "`n🐳 Verificando contenedores Docker existentes..." -ForegroundColor Yellow

try {
    $runningContainers = docker ps --filter "name=erp" --format "{{.Names}}" 2>$null
    if ([string]::IsNullOrWhiteSpace($runningContainers)) {
        Write-Host "  • Contenedores ERP corriendo: ✅ Ninguno (listo para desplegar)" -ForegroundColor Green
    } else {
        Write-Host "  • Contenedores ERP corriendo:" -ForegroundColor Yellow
        $runningContainers -split "`n" | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor Yellow
        }
        Write-Host "    ℹ️  Se detendrán durante el despliegue" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ⚠️  No se pudo verificar contenedores" -ForegroundColor Yellow
}

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($allChecksPassed) {
    Write-Host "✅ TODAS LAS VERIFICACIONES PASARON" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Sistema listo para despliegue" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejecuta el despliegue con:" -ForegroundColor Cyan
    Write-Host "  .\deploy-production.ps1" -ForegroundColor White
    Write-Host "  o" -ForegroundColor Gray
    Write-Host "  .\quick-deploy.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  ALGUNAS VERIFICACIONES FALLARON" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, corrige los problemas marcados con ❌ antes de desplegar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Luego, ejecuta este script nuevamente para verificar" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
