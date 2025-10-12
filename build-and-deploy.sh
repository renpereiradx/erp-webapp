#!/bin/bash

# =========================================
# Script de Build y Deploy - Frontend ERP
# =========================================

set -e  # Salir si hay algún error

echo "🚀 Iniciando proceso de build y deploy..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# =========================================
# 1. Validar configuración
# =========================================
echo "📋 Paso 1: Validando configuración..."
if [ -f "./validate-config.sh" ]; then
    bash ./validate-config.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Validación fallida. Corrige los errores antes de continuar.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ Script de validación no encontrado. Continuando...${NC}"
fi
echo -e "${GREEN}✓${NC} Configuración validada"
echo ""

# =========================================
# 2. Limpiar builds anteriores
# =========================================
echo "🧹 Paso 2: Limpiando builds anteriores..."
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓${NC} Directorio dist eliminado"
fi
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo -e "${GREEN}✓${NC} Cache de Vite eliminado"
fi
echo ""

# =========================================
# 3. Instalar dependencias
# =========================================
echo "📦 Paso 3: Instalando dependencias..."
if command -v pnpm &> /dev/null; then
    pnpm install --frozen-lockfile
    echo -e "${GREEN}✓${NC} Dependencias instaladas con pnpm"
else
    npm ci
    echo -e "${GREEN}✓${NC} Dependencias instaladas con npm"
fi
echo ""

# =========================================
# 4. Build de la aplicación
# =========================================
echo "🔨 Paso 4: Building aplicación..."
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi
echo -e "${GREEN}✓${NC} Build completado"
echo ""

# =========================================
# 5. Verificar build
# =========================================
echo "✅ Paso 5: Verificando build..."
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Directorio dist no creado${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Error: index.html no encontrado en dist${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✓${NC} Build verificado (tamaño: $BUILD_SIZE)"
echo ""

# =========================================
# 6. Build de imagen Docker
# =========================================
echo "🐳 Paso 6: Building imagen Docker..."
echo "Ejecuta uno de los siguientes comandos según tu caso de uso:"
echo ""
echo -e "${YELLOW}Opción A - Build local:${NC}"
echo "  docker build -t erp-frontend:latest ."
echo ""
echo -e "${YELLOW}Opción B - Build con docker-compose:${NC}"
echo "  docker-compose build frontend"
echo ""
echo -e "${YELLOW}Opción C - Build y push a registry:${NC}"
echo "  docker build -t tu-registry/erp-frontend:latest ."
echo "  docker push tu-registry/erp-frontend:latest"
echo ""

# =========================================
# 7. Resumen
# =========================================
echo "============================================"
echo -e "${GREEN}✅ Build completado exitosamente${NC}"
echo "============================================"
echo ""
echo "📊 Próximos pasos:"
echo "1. Revisar el contenido de la carpeta dist/"
echo "2. Construir la imagen Docker (ver comandos arriba)"
echo "3. Desplegar con docker-compose up -d"
echo "4. Verificar que la aplicación esté corriendo en http://localhost"
echo ""
echo "📚 Documentación: docs/development/FRONTEND_DEPLOY_GUIDE.md"
echo ""
