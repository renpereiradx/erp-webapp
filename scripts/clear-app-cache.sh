#!/bin/bash

echo "🧹 LIMPIEZA RÁPIDA DE CACHE - Solo para esta aplicación"
echo "======================================================"

# Verificar que el servidor esté ejecutándose
if ! pgrep -f "vite" > /dev/null; then
    echo "❌ Servidor no está ejecutándose"
    echo "🚀 Iniciando servidor..."
    cd "$(dirname "$0")/.."
    pnpm dev &
    sleep 3
fi

echo "✅ Servidor ejecutándose"
echo "🌐 URL: http://localhost:5173"

echo -e "\n📋 OPCIONES DE LIMPIEZA:"
echo "1. En la consola del navegador (F12):"
echo "   clearModuleCache()    # Para errores de React"
echo "   clearBrowserCache()   # Limpieza general"

echo -e "\n2. Atajo de teclado:"
echo "   Ctrl+Shift+R         # Hard reload"

echo -e "\n3. DevTools (F12):"
echo "   Application → Storage → Clear storage"

echo -e "\n4. Bookmarklet (crea un marcador con este código):"
echo "javascript:(function(){localStorage.clear();sessionStorage.clear();if('caches'in window){caches.keys().then(n=>n.forEach(name=>caches.delete(name)));}window.location.href=window.location.href+'?cb='+Date.now();})();"

echo -e "\n🎯 RECOMENDACIÓN:"
echo "Usa el bookmarklet - es lo más rápido y específico"

echo -e "\n🔄 Si aún tienes problemas:"
echo "1. F12 → Console → clearModuleCache()"
echo "2. Si persiste: Ctrl+Shift+R"
echo "3. Último recurso: DevTools → Application → Clear storage"

# Abrir navegador automáticamente
if command -v xdg-open > /dev/null; then
    echo -e "\n🚀 Abriendo navegador..."
    xdg-open "http://localhost:5173" 2>/dev/null &
elif command -v open > /dev/null; then
    echo -e "\n🚀 Abriendo navegador..."
    open "http://localhost:5173" 2>/dev/null &
fi

echo -e "\n💡 Este script solo limpia cache de localhost:5173"
echo "   NO afecta otros sitios web en tu navegador"
