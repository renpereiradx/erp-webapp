#!/bin/bash

echo "🔍 Verificando configuración de React 19..."

# Verificar versiones de React
echo "📦 Verificando versiones de dependencias:"
echo "React: $(pnpm ls react --depth=0 | grep react@)"
echo "React DOM: $(pnpm ls react-dom --depth=0 | grep react-dom@)"
echo "React Day Picker: $(pnpm ls react-day-picker --depth=0 | grep react-day-picker@)"

# Verificar que react-day-picker sea 8.10.1
REACT_DAY_PICKER_VERSION=$(pnpm ls react-day-picker --depth=0 | grep -o "8\.10\.1" || echo "INCORRECT")

if [ "$REACT_DAY_PICKER_VERSION" = "8.10.1" ]; then
    echo "✅ React Day Picker versión correcta (8.10.1)"
else
    echo "❌ React Day Picker versión incorrecta. Debería ser 8.10.1"
    echo "   Ejecuta: pnpm install react-day-picker@8.10.1"
fi

# Verificar archivos de configuración
echo -e "\n🔧 Verificando archivos de configuración:"

if [ -f "vite.config.js" ]; then
    if grep -q "optimizeDeps" vite.config.js && grep -q "force: true" vite.config.js; then
        echo "✅ vite.config.js configurado correctamente"
    else
        echo "❌ vite.config.js necesita configuración de optimizeDeps"
    fi
else
    echo "❌ vite.config.js no encontrado"
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local existe"
else
    echo "⚠️  .env.local no encontrado (opcional)"
fi

# Verificar scripts en package.json
if grep -q "dev:clean" package.json; then
    echo "✅ Script dev:clean disponible"
else
    echo "❌ Script dev:clean no encontrado en package.json"
fi

echo -e "\n🚀 Para iniciar sin problemas de cache:"
echo "   pnpm run dev:clean"

echo -e "\n🧹 Si aparecen errores de hooks:"
echo "   pnpm run clean && pnpm run dev:clean"
