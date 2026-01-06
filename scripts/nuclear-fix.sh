#!/bin/bash

echo "🔥 SOLUCIÓN NUCLEAR PARA ERRORES DE HOOKS - React 19"
echo "=================================================="
cd "$(dirname "$0")/.."

# Función para mostrar estado
show_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
    fi
}

echo "🧹 Paso 1: Limpiando todos los caches..."
rm -rf node_modules/.vite
show_status "Cache de Vite eliminado"

rm -rf node_modules/.cache
show_status "Cache de node_modules eliminado"

rm -rf dist
show_status "Directorio dist eliminado"

echo -e "\n📦 Paso 2: Verificando dependencias críticas..."
REACT_VERSION=$(pnpm ls react --depth=0 2>/dev/null | grep "react@" | head -1)
REACT_DOM_VERSION=$(pnpm ls react-dom --depth=0 2>/dev/null | grep "react-dom@" | head -1)
REACT_DAY_PICKER_VERSION=$(pnpm ls react-day-picker --depth=0 2>/dev/null | grep "react-day-picker@" | head -1)

echo "React: $REACT_VERSION"
echo "React DOM: $REACT_DOM_VERSION"
echo "React Day Picker: $REACT_DAY_PICKER_VERSION"

# Verificar react-day-picker
if echo "$REACT_DAY_PICKER_VERSION" | grep -q "8.10.1"; then
    echo "✅ react-day-picker versión correcta"
else
    echo "❌ react-day-picker versión incorrecta"
    echo "🔧 Corrigiendo versión..."
    pnpm install react-day-picker@8.10.1 --force
    show_status "react-day-picker corregido"
fi

echo -e "\n🔧 Paso 3: Verificando configuración..."

# Verificar vite.config.js
if grep -q "hmr: false" vite.config.js; then
    echo "✅ HMR deshabilitado correctamente"
else
    echo "⚠️  HMR no está deshabilitado"
fi

if grep -q "fastRefresh: false" vite.config.js; then
    echo "✅ Fast Refresh deshabilitado correctamente"
else
    echo "⚠️  Fast Refresh no está deshabilitado"
fi

# Verificar scripts
if grep -q "dev:nuclear" package.json; then
    echo "✅ Script nuclear disponible"
else
    echo "❌ Script nuclear no encontrado"
fi

echo -e "\n🚀 Paso 4: Iniciando servidor con configuración nuclear..."
echo "💡 El servidor se iniciará sin HMR ni Fast Refresh para máxima estabilidad"
echo "💡 Cada cambio requerirá recarga manual, pero NO habrá errores de hooks"
echo -e "\n📋 Comandos útiles mientras desarrollas:"
echo "   - En consola del navegador: clearBrowserCache()"
echo "   - Recarga forzada: Ctrl+Shift+R"
echo "   - Si hay errores: pnpm run dev:nuclear"

echo -e "\n🎯 Iniciando en 3 segundos..."
sleep 3

pnpm run dev:nuclear
