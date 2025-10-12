#!/bin/bash

# =========================================
# Script de Validación de Configuración
# =========================================
# Valida que la configuración de variables de entorno sea correcta

echo "🔍 Validando configuración de entorno..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0
WARNINGS=0

# =========================================
# Verificar archivos de configuración
# =========================================
echo "📁 Verificando archivos de configuración..."

if [ ! -f ".env.example" ]; then
    echo -e "${RED}❌ .env.example no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} .env.example encontrado"
fi

if [ ! -f ".env.development" ]; then
    echo -e "${RED}❌ .env.development no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} .env.development encontrado"
fi

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} .env.production encontrado"
fi

if [ ! -f "nginx.conf" ]; then
    echo -e "${RED}❌ nginx.conf no encontrado${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} nginx.conf encontrado"
fi

echo ""

# =========================================
# Validar variables críticas
# =========================================
echo "🔑 Validando variables críticas..."

# Verificar VITE_API_URL en development
if grep -q "VITE_API_URL=http://localhost:5050" .env.development 2>/dev/null; then
    echo -e "${GREEN}✓${NC} VITE_API_URL en development apunta a localhost:5050"
else
    echo -e "${YELLOW}⚠${NC} VITE_API_URL en development puede no estar configurado correctamente"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar VITE_API_URL en production
if grep -q "VITE_API_URL=/api" .env.production 2>/dev/null; then
    echo -e "${GREEN}✓${NC} VITE_API_URL en production usa proxy (/api)"
else
    echo -e "${RED}❌ VITE_API_URL en production debe ser /api para usar proxy de Nginx${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar AUTO_LOGIN en production
if grep -q "VITE_AUTO_LOGIN=false" .env.production 2>/dev/null; then
    echo -e "${GREEN}✓${NC} AUTO_LOGIN deshabilitado en production"
else
    echo -e "${RED}❌ VITE_AUTO_LOGIN debe estar en false en production${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# =========================================
# Verificar configuración de Nginx
# =========================================
echo "🌐 Validando configuración de Nginx..."

if grep -q "proxy_pass http://backend:5050" nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Nginx configurado para proxy a backend:5050"
elif grep -q "proxy_pass http://backend:8080" nginx.conf 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Nginx configurado para backend:8080 (verifica que sea el puerto correcto)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ proxy_pass no encontrado o mal configurado en nginx.conf${NC}"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "rewrite ^/api/(.*)$ /\$1 break" nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Rewrite de /api configurado correctamente"
else
    echo -e "${RED}❌ Rewrite de /api no encontrado en nginx.conf${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# =========================================
# Verificar estructura de carpetas
# =========================================
echo "📂 Verificando estructura de carpetas..."

if [ -d "src/services" ]; then
    echo -e "${GREEN}✓${NC} Carpeta src/services existe"
else
    echo -e "${RED}❌ Carpeta src/services no encontrada${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "docs/development" ]; then
    echo -e "${GREEN}✓${NC} Carpeta docs/development existe"
else
    echo -e "${YELLOW}⚠${NC} Carpeta docs/development no encontrada"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# =========================================
# Resumen
# =========================================
echo "============================================"
echo "📊 Resumen de la validación"
echo "============================================"
echo -e "Errores críticos: ${RED}${ERRORS}${NC}"
echo -e "Advertencias: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Configuración validada correctamente${NC}"
    echo "La aplicación está lista para despliegue"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Configuración validada con advertencias${NC}"
    echo "Revisa las advertencias antes de desplegar"
    exit 0
else
    echo -e "${RED}❌ Errores encontrados en la configuración${NC}"
    echo "Corrige los errores antes de desplegar"
    exit 1
fi
