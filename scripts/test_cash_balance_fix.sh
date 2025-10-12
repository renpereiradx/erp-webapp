#!/bin/bash

# 🧪 Script de Prueba: Cash Register Balance Fix
# Valida que el backend devuelva current_balance correctamente
# Fecha: 2025-10-11

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${AUTH_TOKEN:-}"

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
}

# Función para hacer petición GET
api_get() {
    local endpoint=$1
    local url="${API_URL}${endpoint}"
    
    if [ -n "$TOKEN" ]; then
        curl -s -X GET "$url" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json"
    else
        curl -s -X GET "$url" \
            -H "Content-Type: application/json"
    fi
}

# Verificar que jq esté instalado
if ! command -v jq &> /dev/null; then
    print_error "jq no está instalado. Por favor instálalo:"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    exit 1
fi

# Banner
print_header "TEST: Cash Register Balance Fix"

print_info "API URL: $API_URL"
if [ -n "$TOKEN" ]; then
    print_info "Token: ${TOKEN:0:20}..."
else
    print_warning "No se proporcionó token de autenticación"
    print_info "Usa: export AUTH_TOKEN='tu_token'"
fi

# Test 1: Obtener caja activa
print_header "Test 1: GET /cash-registers/active"

RESPONSE=$(api_get "/cash-registers/active" 2>&1)
HTTP_STATUS=$?

if [ $HTTP_STATUS -eq 0 ]; then
    print_success "Request exitoso"
    
    # Validar que la respuesta sea JSON válido
    if echo "$RESPONSE" | jq empty 2>/dev/null; then
        print_success "Respuesta es JSON válido"
        
        # Extraer campos
        ID=$(echo "$RESPONSE" | jq -r '.id // empty')
        NAME=$(echo "$RESPONSE" | jq -r '.name // empty')
        STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')
        INITIAL_BALANCE=$(echo "$RESPONSE" | jq -r '.initial_balance // empty')
        CURRENT_BALANCE=$(echo "$RESPONSE" | jq -r '.current_balance // empty')
        
        # Mostrar información
        echo ""
        echo "📊 Datos de Caja:"
        echo "  ID: $ID"
        echo "  Nombre: $NAME"
        echo "  Estado: $STATUS"
        echo "  Balance Inicial: $INITIAL_BALANCE"
        echo "  Balance Actual: $CURRENT_BALANCE"
        echo ""
        
        # Validar que current_balance exista
        if [ -n "$CURRENT_BALANCE" ] && [ "$CURRENT_BALANCE" != "null" ]; then
            print_success "✅ current_balance está presente"
            
            # Validar que sea un número
            if [[ "$CURRENT_BALANCE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
                print_success "✅ current_balance es un número válido"
                
                # Validar que sea >= initial_balance (asumiendo solo ingresos)
                if [ -n "$INITIAL_BALANCE" ] && [ "$INITIAL_BALANCE" != "null" ]; then
                    if (( $(echo "$CURRENT_BALANCE >= $INITIAL_BALANCE" | bc -l) )); then
                        print_success "✅ current_balance >= initial_balance (coherente)"
                    else
                        print_warning "current_balance < initial_balance (puede haber gastos)"
                    fi
                fi
            else
                print_error "current_balance no es un número válido: $CURRENT_BALANCE"
            fi
        else
            print_error "❌ current_balance NO está presente o es null"
            print_warning "El backend necesita implementar el fix"
            echo ""
            echo "Respuesta recibida:"
            echo "$RESPONSE" | jq '.'
        fi
        
    else
        print_error "La respuesta no es JSON válido"
        echo "Respuesta:"
        echo "$RESPONSE"
    fi
else
    print_error "Request falló con código: $HTTP_STATUS"
    echo "Respuesta:"
    echo "$RESPONSE"
fi

# Test 2: Obtener movimientos y calcular balance manualmente
print_header "Test 2: Validación con Movimientos"

if [ -n "$ID" ] && [ "$ID" != "null" ]; then
    print_info "Obteniendo movimientos de caja $ID..."
    
    MOVEMENTS_RESPONSE=$(api_get "/cash-registers/$ID/movements" 2>&1)
    
    if echo "$MOVEMENTS_RESPONSE" | jq empty 2>/dev/null; then
        print_success "Movimientos obtenidos"
        
        # Calcular balance manualmente
        INCOME_SUM=$(echo "$MOVEMENTS_RESPONSE" | jq '[.[] | select(.movement_type == "INCOME") | .amount] | add // 0')
        EXPENSE_SUM=$(echo "$MOVEMENTS_RESPONSE" | jq '[.[] | select(.movement_type == "EXPENSE") | .amount] | add // 0')
        ADJUSTMENT_SUM=$(echo "$MOVEMENTS_RESPONSE" | jq '[.[] | select(.movement_type == "ADJUSTMENT") | .amount] | add // 0')
        
        CALCULATED_BALANCE=$(echo "$INITIAL_BALANCE + $INCOME_SUM - $EXPENSE_SUM + $ADJUSTMENT_SUM" | bc)
        
        echo ""
        echo "💰 Cálculo Manual:"
        echo "  Balance Inicial:  $INITIAL_BALANCE"
        echo "  + Ingresos:       $INCOME_SUM"
        echo "  - Egresos:        $EXPENSE_SUM"
        echo "  + Ajustes:        $ADJUSTMENT_SUM"
        echo "  ─────────────────────────"
        echo "  = Balance Calculado: $CALCULATED_BALANCE"
        echo "  = Balance Backend:   $CURRENT_BALANCE"
        echo ""
        
        # Comparar
        DIFF=$(echo "$CURRENT_BALANCE - $CALCULATED_BALANCE" | bc)
        DIFF_ABS=$(echo "$DIFF" | tr -d '-')
        
        if (( $(echo "$DIFF_ABS < 0.01" | bc -l) )); then
            print_success "✅ Balance backend coincide con cálculo manual"
        else
            print_error "❌ Balance backend NO coincide (diferencia: $DIFF)"
        fi
    else
        print_warning "No se pudieron obtener movimientos"
    fi
else
    print_warning "No hay caja activa para validar movimientos"
fi

# Test 3: Verificar endpoint de listado
print_header "Test 3: GET /cash-registers (listado)"

LIST_RESPONSE=$(api_get "/cash-registers" 2>&1)

if echo "$LIST_RESPONSE" | jq empty 2>/dev/null; then
    print_success "Listado obtenido"
    
    COUNT=$(echo "$LIST_RESPONSE" | jq 'length')
    print_info "Cajas encontradas: $COUNT"
    
    # Verificar que todas tengan current_balance
    CAJAS_SIN_BALANCE=$(echo "$LIST_RESPONSE" | jq '[.[] | select(.current_balance == null or .current_balance == "")] | length')
    
    if [ "$CAJAS_SIN_BALANCE" -eq 0 ]; then
        print_success "✅ Todas las cajas tienen current_balance"
    else
        print_warning "$CAJAS_SIN_BALANCE cajas no tienen current_balance"
    fi
else
    print_warning "No se pudo obtener el listado de cajas"
fi

# Resumen final
print_header "📋 Resumen de Validación"

echo ""
echo "Estado del Fix:"
echo ""

if [ -n "$CURRENT_BALANCE" ] && [ "$CURRENT_BALANCE" != "null" ]; then
    print_success "✅ BACKEND TIENE EL FIX IMPLEMENTADO"
    print_info "El campo current_balance está presente y calculado"
    
    if [ -n "$DIFF_ABS" ] && (( $(echo "$DIFF_ABS < 0.01" | bc -l) )); then
        print_success "✅ CÁLCULO ES CORRECTO"
        print_info "Balance coincide con la suma de movimientos"
    fi
else
    print_error "❌ BACKEND NO TIENE EL FIX"
    print_warning "El campo current_balance no está presente"
    print_info "Acción requerida: Implementar cálculo de balance en backend"
    print_info "Ver: docs/fixes/CASH_REGISTER_BALANCE_FIX.md"
fi

echo ""
print_info "Test completado: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
