#!/bin/bash

# Script para probar la nueva funcionalidad de búsqueda por ID
# Este script inicia el servidor y proporciona ejemplos de IDs para probar

echo "🚀 Iniciando servidor para probar búsqueda por ID..."

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
echo "🔍 INSTRUCCIONES PARA PROBAR LA BÚSQUEDA POR ID:"
echo ""
echo "1. Ve a la página de Productos"
echo "2. En el buscador, prueba los siguientes casos:"
echo ""
echo "📋 EJEMPLOS DE BÚSQUEDA POR NOMBRE:"
echo "   - 'coca' (debería mostrar indicador 'Nombre')"
echo "   - 'producto' (debería mostrar indicador 'Nombre')"
echo "   - 'agua mineral' (debería mostrar indicador 'Nombre')"
echo ""
echo "📋 EJEMPLOS DE BÚSQUEDA POR ID:"
echo "   - 'qG6FfY_Ng' (ID de ejemplo, debería mostrar indicador 'ID')"
echo "   - 'abc12345def' (ID simulado, debería mostrar indicador 'ID')"
echo "   - 'PROD-2024-001' (ID con formato, debería mostrar indicador 'ID')"
echo ""
echo "🔧 FUNCIONALIDADES A VERIFICAR:"
echo "   ✅ Detección automática del tipo de búsqueda"
echo "   ✅ Placeholder dinámico según el tipo detectado"
echo "   ✅ Indicador visual (ID en azul, Nombre en verde)"
echo "   ✅ Validación de longitud diferente (ID: 8+, Nombre: 3+)"
echo "   ✅ Contador de caracteres en tiempo real"
echo "   ✅ Botón de búsqueda habilitado/deshabilitado según criterios"
echo "   ✅ Búsqueda por ID usa endpoint GET /products/{id}"
echo "   ✅ Búsqueda por nombre usa endpoint actual"
echo ""
echo "📱 CASOS ESPECIALES A PROBAR:"
echo "   - IDs cortos (<8 chars): debería requerir mínimo 8"
echo "   - Nombres cortos (<3 chars): debería requerir mínimo 3"
echo "   - IDs con espacios: debería tratarse como nombre"
echo "   - Cambio dinámico: escribir nombre y luego ID"
echo ""
echo "🛑 Para detener el servidor presiona Ctrl+C"

# Mantener el script corriendo hasta que se presione Ctrl+C
trap "echo '🛑 Deteniendo servidor...'; kill $SERVER_PID; exit 0" INT

# Esperar indefinidamente
while true; do
    sleep 1
done
