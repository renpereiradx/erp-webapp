#!/bin/bash

# Script para mapear endpoints reales de la API
echo "🔍 Mapeando endpoints de productos de la API real..."

# Obtener token (si existe)
TOKEN_FILE="/tmp/api_token"
if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    echo "✅ Token encontrado"
else
    echo "⚠️  No se encontró token guardado"
    TOKEN=""
fi

BASE_URL="http://localhost:5050"
AUTH_HEADER=""
if [ ! -z "$TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $TOKEN"
fi

echo ""
echo "🧪 Probando endpoints de productos..."
echo "=================================="

# 1. Productos paginados básicos
echo "1️⃣  GET /products/products/1/5 (paginación básica)"
curl -s -w "Status: %{http_code}\n" \
     -H "$AUTH_HEADER" \
     "$BASE_URL/products/products/1/5" | head -3
echo ""

# 2. Producto por ID simple
echo "2️⃣  GET /products/{id} (producto simple)"
curl -s -w "Status: %{http_code}\n" \
     -H "$AUTH_HEADER" \
     "$BASE_URL/products/eYiJ3xZ9wuw6fFSD83w1a8jctnI" | head -3
echo ""

# 3. Producto con detalles completos
echo "3️⃣  GET /products/{id}/details (detalles completos)"
curl -s -w "Status: %{http_code}\n" \
     -H "$AUTH_HEADER" \
     "$BASE_URL/products/eYiJ3xZ9wuw6fFSD83w1a8jctnI/details" | head -3
echo ""

# 4. Búsqueda por nombre simple
echo "4️⃣  GET /products/products/name/{name} (búsqueda simple)"
curl -s -w "Status: %{http_code}\n" \
     -H "$AUTH_HEADER" \
     "$BASE_URL/products/products/name/Beef" | head -3
echo ""

# 5. Búsqueda con detalles
echo "5️⃣  GET /products/search/details/{name} (búsqueda con detalles)"
curl -s -w "Status: %{http_code}\n" \
     -H "$AUTH_HEADER" \
     "$BASE_URL/products/search/details/Beef" | head -3
echo ""

echo "✅ Mapeo de endpoints completado"
