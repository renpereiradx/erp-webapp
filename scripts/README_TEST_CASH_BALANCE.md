# 🧪 Script de Testing para Balance de Caja

Este script valida que el backend calcule correctamente el campo `current_balance` en las cajas registradoras.

## 📋 Prerequisitos

- `jq` instalado (para parsear JSON)
- `bc` instalado (para cálculos matemáticos)
- Token de autenticación válido (opcional pero recomendado)

### Instalar dependencias

**Ubuntu/Debian:**
```bash
sudo apt-get install jq bc
```

**macOS:**
```bash
brew install jq bc
```

## 🚀 Uso

### Opción 1: Sin autenticación (endpoints públicos)

```bash
./scripts/test_cash_balance_fix.sh
```

### Opción 2: Con autenticación (recomendado)

```bash
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
./scripts/test_cash_balance_fix.sh
```

### Opción 3: API URL custom

```bash
export API_URL="https://api.example.com"
export AUTH_TOKEN="tu_token_aqui"
./scripts/test_cash_balance_fix.sh
```

## 📊 Output Esperado

### ✅ Si el backend tiene el fix:

```
═══════════════════════════════════════
  TEST: Cash Register Balance Fix
═══════════════════════════════════════

ℹ️  API URL: http://localhost:8080
ℹ️  Token: eyJhbGciOiJIUzI1NiI...

═══════════════════════════════════════
  Test 1: GET /cash-registers/active
═══════════════════════════════════════

✅ Request exitoso
✅ Respuesta es JSON válido

📊 Datos de Caja:
  ID: 1
  Nombre: Caja #1 - principal
  Estado: OPEN
  Balance Inicial: 350000
  Balance Actual: 417500

✅ ✅ current_balance está presente
✅ ✅ current_balance es un número válido
✅ ✅ current_balance >= initial_balance (coherente)

═══════════════════════════════════════
  Test 2: Validación con Movimientos
═══════════════════════════════════════

ℹ️  Obteniendo movimientos de caja 1...
✅ Movimientos obtenidos

💰 Cálculo Manual:
  Balance Inicial:  350000
  + Ingresos:       67500
  - Egresos:        0
  + Ajustes:        0
  ─────────────────────────
  = Balance Calculado: 417500
  = Balance Backend:   417500

✅ ✅ Balance backend coincide con cálculo manual

═══════════════════════════════════════
  📋 Resumen de Validación
═══════════════════════════════════════

Estado del Fix:

✅ ✅ BACKEND TIENE EL FIX IMPLEMENTADO
ℹ️  El campo current_balance está presente y calculado
✅ ✅ CÁLCULO ES CORRECTO
ℹ️  Balance coincide con la suma de movimientos
```

### ❌ Si el backend NO tiene el fix:

```
═══════════════════════════════════════
  Test 1: GET /cash-registers/active
═══════════════════════════════════════

✅ Request exitoso
✅ Respuesta es JSON válido

📊 Datos de Caja:
  ID: 1
  Nombre: Caja #1 - principal
  Estado: OPEN
  Balance Inicial: 350000
  Balance Actual: 

❌ ❌ current_balance NO está presente o es null
⚠️  El backend necesita implementar el fix

Respuesta recibida:
{
  "id": 1,
  "name": "Caja #1 - principal",
  "status": "OPEN",
  "initial_balance": 350000,
  "final_balance": null
}

═══════════════════════════════════════
  📋 Resumen de Validación
═══════════════════════════════════════

Estado del Fix:

❌ ❌ BACKEND NO TIENE EL FIX
⚠️  El campo current_balance no está presente
ℹ️  Acción requerida: Implementar cálculo de balance en backend
ℹ️  Ver: docs/fixes/CASH_REGISTER_BALANCE_FIX.md
```

## 🔍 Tests Ejecutados

El script ejecuta 3 tests:

1. **Test 1**: Validar que `/cash-registers/active` devuelva `current_balance`
2. **Test 2**: Calcular balance manualmente y comparar con backend
3. **Test 3**: Validar que el listado completo tenga `current_balance`

## 📚 Referencias

- **Fix Completo**: `/docs/fixes/CASH_REGISTER_BALANCE_FIX.md`
- **Issue Original**: `/docs/issues/CASH_REGISTER_BALANCE_ZERO.md`
- **API Docs**: `/docs/api/CASH_REGISTER_API.md`

## 🐛 Troubleshooting

### Error: "jq: command not found"

Instalar jq:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Error: "bc: command not found"

Instalar bc:
```bash
# Ubuntu/Debian
sudo apt-get install bc

# macOS
brew install bc
```

### Error 401: Unauthorized

Proporcionar token válido:
```bash
export AUTH_TOKEN="tu_token_aqui"
./scripts/test_cash_balance_fix.sh
```

### Error: Connection refused

Verificar que el backend esté corriendo:
```bash
curl http://localhost:8080/health
```

Si usa otro puerto o URL:
```bash
export API_URL="http://localhost:5050"
./scripts/test_cash_balance_fix.sh
```

## 📝 Notas

- El script usa `bc` para cálculos de punto flotante precisos
- Tolera diferencias menores a 0.01 por redondeos
- Los colores requieren terminal compatible con ANSI colors
- El script sale con error (`exit 1`) si jq no está instalado
