#!/bin/bash

# Script para probar la nueva funcionalidad de filtros locales
# Este script inicia el servidor y proporciona ejemplos para probar los filtros

echo "🚀 Iniciando servidor para probar filtros locales..."

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
echo "🔍 INSTRUCCIONES PARA PROBAR LOS FILTROS LOCALES:"
echo ""
echo "1. REALIZAR BÚSQUEDA INICIAL:"
echo "   - Busca 'nike' o cualquier término que devuelva múltiples productos"
echo "   - Deberías ver aparecer los filtros automáticamente"
echo ""
echo "📋 FUNCIONALIDADES DE FILTROS A PROBAR:"
echo ""
echo "2. FILTRO POR TEXTO EN RESULTADOS:"
echo "   - Busca 'nike' → obtienes varios productos Nike"
echo "   - En 'Buscar en resultados' escribe 'dunk'"
echo "   - ✅ Solo deberían mostrarse productos que contengan 'nike' Y 'dunk'"
echo "   - Prueba también: 'air', 'pro', 'max', etc."
echo ""
echo "3. FILTRO POR ESTADO:"
echo "   - Predeterminado: 'Solo activos' (state = true)"
echo "   - Cambia a 'Solo inactivos' → Solo productos con state = false"
echo "   - Cambia a 'Todos' → Muestra productos activos e inactivos"
echo ""
echo "4. COMBINACIÓN DE FILTROS:"
echo "   - Aplica filtro de texto + filtro de estado"
echo "   - Ejemplo: 'nike' + 'dunk' + 'Solo activos'"
echo "   - ✅ Debería mostrar solo productos Nike Dunk que estén activos"
echo ""
echo "5. INDICADORES VISUALES:"
echo "   - ✅ Contador: 'Filtrar resultados (X de Y)'"
echo "   - ✅ Badges de filtros activos con botón X para quitar"
echo "   - ✅ Botón 'Limpiar filtros' cuando hay filtros aplicados"
echo ""
echo "🔧 CASOS ESPECIALES A VERIFICAR:"
echo ""
echo "6. COMPORTAMIENTO AUTOMÁTICO:"
echo "   - ✅ Filtros solo aparecen con múltiples resultados"
echo "   - ✅ Filtros se limpian automáticamente en nueva búsqueda"
echo "   - ✅ Filtros se ocultan cuando no hay búsqueda activa"
echo "   - ✅ Estado predeterminado siempre es 'Solo activos'"
echo ""
echo "7. INTERACCIONES:"
echo "   - ✅ Filtro de texto en tiempo real (sin delay)"
echo "   - ✅ Cambio de estado actualiza inmediatamente"
echo "   - ✅ Botones X quitan filtros individuales"
echo "   - ✅ 'Limpiar filtros' resetea todo a predeterminado"
echo ""
echo "📊 ESCENARIOS DE PRUEBA RECOMENDADOS:"
echo ""
echo "🔍 ESCENARIO 1 - Búsqueda por nombre con filtros:"
echo "   1. Busca: 'coca'"
echo "   2. Aplica filtro: 'cola'"
echo "   3. Cambia estado a 'Todos'"
echo "   4. Resultado: Solo Coca Cola (activos + inactivos)"
echo ""
echo "🔍 ESCENARIO 2 - ID único (sin filtros):"
echo "   1. Busca por ID: 'qG6FfY_Ng'"
echo "   2. ✅ No deberían aparecer filtros (solo 1 resultado)"
echo ""
echo "🔍 ESCENARIO 3 - Limpiar y nueva búsqueda:"
echo "   1. Aplica varios filtros"
echo "   2. Haz nueva búsqueda con término diferente"
echo "   3. ✅ Filtros se resetean automáticamente"
echo ""
echo "🛑 Para detener el servidor presiona Ctrl+C"

# Mantener el script corriendo hasta que se presione Ctrl+C
trap "echo '🛑 Deteniendo servidor...'; kill $SERVER_PID; exit 0" INT

# Esperar indefinidamente
while true; do
    sleep 1
done
