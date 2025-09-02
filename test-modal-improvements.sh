#!/bin/bash

# Script para probar el ProductDetailModal con mejoras de UI/UX
# Este script inicia el servidor en modo desarrollo y abre el navegador

echo "🚀 Iniciando servidor de desarrollo para probar ProductDetailModal..."

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
echo "🎯 INSTRUCCIONES PARA PROBAR EL MODAL Y BÚSQUEDA:"
echo "1. Ve a la página de Productos"
echo "2. Prueba la nueva búsqueda inteligente:"
echo "   - Por ID: 'qG6FfY_Ng' (debería mostrar badge azul 'ID')"
echo "   - Por nombre: 'coca' (debería mostrar badge verde 'Nombre')"
echo "3. Haz clic en el botón 'Ver' de cualquier producto"
echo "4. El modal debería mostrar:"
echo "   - Aparece solo sobre el contenido de productos (no sobre el header)"
echo "   - Tamaño más compacto (no ocupa toda la pantalla)"
echo "   - Animaciones suaves de entrada"
echo "   - Datos del servidor mapeados correctamente"
echo "   - Badges con efectos hover mejorados"
echo "   - Scrollbar personalizado"
echo "   - Transiciones suaves entre tabs"
echo "   - Estados de validación coloridos"
echo ""
echo "🔧 FUNCIONALIDADES A VERIFICAR:"
echo "   ✅ BÚSQUEDA INTELIGENTE:"
echo "     - Detección automática ID vs Nombre"
echo "     - Placeholder dinámico según tipo"
echo "     - Indicadores visuales (ID=azul, Nombre=verde)"
echo "     - Validación específica (ID: 8+, Nombre: 3+)"
echo "     - Contador de caracteres en tiempo real"
echo "   ✅ MODAL MEJORADO:"
echo "     - Modal aparece solo sobre la sección de productos"
echo "     - Header permanece visible y accesible"
echo "     - Modal más compacto (max-width: 56rem en desktop)"
echo "     - Modal se abre con animación slideUp"
echo "     - Datos del producto se muestran correctamente"
echo "     - Campo 'state' se mapea a 'isActive'"
echo "     - Campo 'category.name' se muestra como string"
echo "     - Stock status tiene colores y iconos apropiados"
echo "     - Badges tienen efecto hover"
echo "     - Tabs tienen animación al cambiar"
echo "     - Modal responsive en móviles"
echo "     - Espaciado más compacto y elegante"
echo "     - Posicionamiento inteligente (absoluto en contenedor)"
echo ""
echo "🛑 Para detener el servidor presiona Ctrl+C"

# Mantener el script corriendo hasta que se presione Ctrl+C
trap "echo '🛑 Deteniendo servidor...'; kill $SERVER_PID; exit 0" INT

# Esperar indefinidamente
while true; do
    sleep 1
done
