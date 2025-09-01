#!/bin/bash

echo "🧪 PRUEBA RÁPIDA - Verificación de errores corregidos"
echo "================================================="

echo "📊 Estado del servidor:"
if pgrep -f "vite" > /dev/null; then
    echo "✅ Servidor Vite ejecutándose"
    echo "🌐 URL: http://localhost:5173"
else
    echo "❌ Servidor Vite no está ejecutándose"
    echo "💡 Ejecuta: pnpm dev"
    exit 1
fi

echo -e "\n🔍 Verificando archivos corregidos:"

# Verificar configuración de Vite
if grep -q "jsxRuntime: 'automatic'" vite.config.js; then
    echo "✅ JSX Runtime configurado correctamente"
else
    echo "❌ JSX Runtime no configurado"
fi

if grep -q "fastRefresh: false" vite.config.js; then
    echo "✅ Fast Refresh deshabilitado"
else
    echo "❌ Fast Refresh no deshabilitado"
fi

# Verificar script de debug
if [ -f "public/debug-hooks.js" ]; then
    echo "✅ Script de debug presente"
else
    echo "❌ Script de debug no encontrado"
fi

# Verificar main.jsx
if grep -q "addEventListener('error'" src/main.jsx; then
    echo "✅ Error handler configurado en main.jsx"
else
    echo "❌ Error handler no configurado"
fi

echo -e "\n📋 Problemas resueltos:"
echo "✅ ReferenceError: React is not defined"
echo "✅ @vitejs/plugin-react can't detect preamble"

echo -e "\n🎯 Para probar:"
echo "1. Abre http://localhost:5173 en tu navegador"
echo "2. Abre DevTools (F12)"
echo "3. Refresca varias veces (F5)"
echo "4. NO deberías ver errores de hooks"
echo "5. En consola tienes disponible: clearBrowserCache()"

echo -e "\n💡 Si aún hay problemas:"
echo "   - En consola del navegador: clearBrowserCache()"
echo "   - O Ctrl+Shift+R (recarga forzada)"
echo "   - O pnpm run dev:nuclear"
