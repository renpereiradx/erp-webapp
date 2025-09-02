#!/bin/bash

# Script para probar el manejo de errores en búsqueda por ID
# Incluye casos de IDs que pueden generar errores 500 y 404

echo "🚀 Iniciando servidor para probar manejo de errores en búsqueda por ID..."

# Limpiar cache antes de iniciar
echo "🧹 Limpiando cache de desarrollo..."
pnpm run clean

# Iniciar servidor de desarrollo
echo "📦 Iniciando servidor con pnpm dev..."
pnpm dev &

# Guardar PID del proceso
SERVER_PID=$!

# Esperar unos segundos para que el servidor inicie
echo "⏳ Esperando a que el servidor inicie..."
sleep 5

# Abrir navegador en la página de productos
echo "🌐 Abriendo navegador en http://localhost:5173/products"
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:5173/products"
elif command -v open > /dev/null; then
    open "http://localhost:5173/products"
else
    echo "Por favor abre manualmente: http://localhost:5173/products"
fi

echo ""
echo "🔧 INSTRUCCIONES PARA PROBAR EL MANEJO DE ERRORES:"
echo ""
echo "1. Ve a la página de Productos"
echo "2. Prueba los siguientes casos de error:"
echo ""
echo "🆔 CASOS DE PRUEBA PARA ERRORES 500:"
echo "   - '2rr9sbbqEtNE7L2ZAti0TNr8Yn9' (el ID que causó el error 500)"
echo "   - 'invalid_id_12345' (ID que puede no existir en el servidor)"
echo "   - 'test_server_error' (ID para probar errores del servidor)"
echo ""
echo "🆔 CASOS DE PRUEBA PARA ERRORES 404:"
echo "   - 'notfound123456789' (ID que definitivamente no existe)"
echo "   - 'missing_prod_001' (ID formateado pero inexistente)"
echo ""
echo "✅ COMPORTAMIENTOS ESPERADOS:"
echo "   🔹 Error 500: Mensaje claro + sugerencia de probar por nombre"
echo "   🔹 Error 404: Mensaje 'Producto no encontrado'"
echo "   🔹 Fallback automático: Si es error 500, intenta buscar por nombre"
echo "   🔹 Logs en consola: Ver detalles del error y fallback"
echo "   🔹 UI responsiva: Loading state durante búsqueda"
echo "   🔹 Errores se limpian: Al cambiar el término de búsqueda"
echo ""
echo "🔍 FUNCIONALIDADES A VERIFICAR:"
echo "   ✅ Búsqueda por ID muestra loading state"
echo "   ✅ Error 500 muestra mensaje específico y sugerencia"
echo "   ✅ Error 404 muestra 'producto no encontrado'"
echo "   ✅ Fallback automático en errores 500 (busca por nombre)"
echo "   ✅ Logs detallados en la consola del navegador"
echo "   ✅ Error se limpia al escribir nuevo término"
echo "   ✅ Botón deshabilitado durante búsqueda"
echo "   ✅ Indicadores visuales (ID=azul, error=rojo)"
echo ""
echo "🐛 PARA DEPURAR:"
echo "   1. Abre DevTools (F12)"
echo "   2. Ve a la pestaña Console"
echo "   3. Busca por IDs problemáticos"
echo "   4. Observa los logs detallados:"
echo "      - '🔍 Buscando producto por ID: ...' (inicio)"
echo "      - '⚠️ Error al buscar por ID ...' (error detectado)"
echo "      - '🔄 Error 500 detectado, intentando fallback...' (fallback)"
echo "      - '✅ Fallback por nombre exitoso' (recuperación)"
echo ""
echo "🛑 Para detener el servidor presiona Ctrl+C"

# Mantener el script corriendo hasta que se presione Ctrl+C
trap "echo '🛑 Deteniendo servidor...'; kill $SERVER_PID; exit 0" INT

# Esperar indefinidamente
while true; do
    sleep 1
done
