# 🔄 API: Endpoints de Reversión de Ventas

## 📋 Descripción

Endpoints REST para gestionar la reversión (cancelación) de ventas en el sistema.

---

## 🔗 Endpoints Disponibles

### **1. Vista Previa de Reversión**

Obtiene información detallada de lo que ocurrirá al revertir una venta **sin ejecutar cambios**.

#### **Request:**
```http
GET /sales/orders/{id}/preview-cancellation
Authorization: Bearer {jwt_token}
```

#### **Path Parameters:**
- `id` (string, required): ID de la venta a previsualizar

#### **Response 200 OK:**
```json
{
  "success": true,
  "sale": {
    "id": "SALE-1759248577-656",
    "status": "PAID",
    "total_amount": 1625000.00,
    "client_id": "CLI001",
    "sale_date": "2025-09-30T12:00:00"
  },
  "products": [
    {
      "product_id": "bcYdWdKNR",
      "product_name": "Puma MB.01",
      "product_type": "PHYSICAL",
      "quantity": 2.00,
      "unit_price": 812500.00,
      "will_restore_stock": true,
      "will_revert_reserve": false,
      "reserve_id": null
    }
  ],
  "reserves": [],
  "payments": [
    {
      "payment_id": 1,
      "amount_received": 1625000.00,
      "payment_date": "2025-09-30T12:05:00",
      "status": "COMPLETED"
    }
  ],
  "summary": {
    "total_products": 1,
    "stock_movements": 1,
    "reserves_to_handle": 0,
    "payments_to_refund": 1,
    "total_refund": 1625000.00
  }
}
```

#### **Response 404 Not Found:**
```json
{
  "success": false,
  "error_code": "SALE_NOT_FOUND",
  "message": "Sale not found",
  "details": "Sale ID SALE-123 does not exist"
}
```

#### **Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error_code": "PREVIEW_ERROR",
  "message": "Error previewing sale cancellation",
  "details": "database connection error"
}
```

---

### **2. Ejecutar Reversión**

Revierte (cancela) una venta completa, incluyendo restauración de stock, reversión de reservas y reembolso de pagos.

#### **Request:**
```http
PUT /sales/orders/{id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "reason": "Cliente solicitó cancelación por error en cantidad"
}
```

#### **Path Parameters:**
- `id` (string, required): ID de la venta a revertir

#### **Body Parameters:**
- `reason` (string, optional): Razón de la cancelación. Si no se proporciona, se usa "Manual cancellation from API"

#### **Response 200 OK:**
```json
{
  "success": true,
  "message": "Sale cancelled successfully",
  "sale_id": "SALE-1759248577-656"
}
```

#### **Response 404 Not Found:**
```json
{
  "success": false,
  "error_code": "SALE_NOT_FOUND",
  "message": "Sale not found",
  "details": "Sale ID SALE-123 does not exist"
}
```

#### **Response 409 Conflict:**
```json
{
  "success": false,
  "error_code": "ALREADY_CANCELLED",
  "message": "Sale is already cancelled",
  "details": "Sale ID SALE-123 is already in cancelled status"
}
```

#### **Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error_code": "CANCELLATION_ERROR",
  "message": "Error cancelling sale",
  "details": "ERROR_REVERT_SALE: [detalles del error]"
}
```

---

## 💻 Ejemplos de Uso

### **Ejemplo 1: JavaScript/TypeScript (Fetch API)**

```javascript
// Vista previa de reversión
async function previewSaleCancellation(saleId, token) {
  const response = await fetch(
    `http://localhost:5050/sales/orders/${saleId}/preview-cancellation`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Ejecutar reversión
async function cancelSale(saleId, reason, token) {
  const response = await fetch(
    `http://localhost:5050/sales/orders/${saleId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Uso completo con confirmación
async function handleCancelSaleWithConfirmation(saleId, token) {
  try {
    // 1. Obtener vista previa
    const preview = await previewSaleCancellation(saleId, token);

    // 2. Mostrar información al usuario
    console.log('📋 Vista Previa de Reversión:');
    console.log(`Total a reembolsar: $${preview.summary.total_refund}`);
    console.log(`Productos a revertir: ${preview.summary.total_products}`);
    console.log(`Stock a restaurar: ${preview.summary.stock_movements}`);
    console.log(`Reservas a liberar: ${preview.summary.reserves_to_handle}`);

    // 3. Pedir confirmación al usuario
    const userConfirmed = confirm('¿Desea cancelar esta venta?');

    if (!userConfirmed) {
      console.log('Cancelación abortada por el usuario');
      return;
    }

    // 4. Pedir razón de cancelación
    const reason = prompt('Ingrese la razón de cancelación:');
    if (!reason) {
      throw new Error('Se requiere una razón para cancelar');
    }

    // 5. Ejecutar cancelación
    const result = await cancelSale(saleId, reason, token);

    console.log('✅ Venta cancelada exitosamente:', result);
    alert('Venta cancelada exitosamente');

  } catch (error) {
    console.error('❌ Error al cancelar venta:', error);
    alert(`Error: ${error.message}`);
  }
}
```

---

### **Ejemplo 2: React Hook**

```typescript
import { useState } from 'react';

interface SaleReversionPreview {
  success: boolean;
  sale: {
    id: string;
    status: string;
    total_amount: number;
  };
  products: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    will_restore_stock: boolean;
  }>;
  summary: {
    total_refund: number;
    total_products: number;
    stock_movements: number;
    reserves_to_handle: number;
  };
}

export function useSaleReversion(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SaleReversionPreview | null>(null);

  const getPreview = async (saleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5050/sales/orders/${saleId}/preview-cancellation`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      const data = await response.json();
      setPreview(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSale = async (saleId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5050/sales/orders/${saleId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    preview,
    getPreview,
    cancelSale
  };
}

// Componente de ejemplo
export function CancelSaleButton({ saleId, token }: { saleId: string; token: string }) {
  const { loading, preview, getPreview, cancelSale } = useSaleReversion(token);
  const [showPreview, setShowPreview] = useState(false);

  const handleCancel = async () => {
    // Obtener vista previa
    await getPreview(saleId);
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    const reason = prompt('Ingrese la razón de cancelación:');
    if (!reason) return;

    try {
      await cancelSale(saleId, reason);
      alert('Venta cancelada exitosamente');
      window.location.reload(); // Recargar página
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleCancel} disabled={loading}>
        {loading ? 'Cargando...' : 'Cancelar Venta'}
      </button>

      {showPreview && preview && (
        <div className="preview-modal">
          <h3>Vista Previa de Reversión</h3>
          <p>Total a reembolsar: ${preview.summary.total_refund}</p>
          <p>Productos a revertir: {preview.summary.total_products}</p>
          <p>Stock a restaurar: {preview.summary.stock_movements}</p>

          <button onClick={handleConfirm}>Confirmar Cancelación</button>
          <button onClick={() => setShowPreview(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
```

---

### **Ejemplo 3: cURL**

```bash
# Vista previa
curl -X GET \
  'http://localhost:5050/sales/orders/SALE-123/preview-cancellation' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'

# Ejecutar reversión sin razón (usa default)
curl -X PUT \
  'http://localhost:5050/sales/orders/SALE-123' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Ejecutar reversión con razón específica
curl -X PUT \
  'http://localhost:5050/sales/orders/SALE-123' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "reason": "Cliente solicitó cancelación por error en cantidad"
  }'
```

---

### **Ejemplo 4: Python (requests)**

```python
import requests

class SaleRevertAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def preview_cancellation(self, sale_id: str) -> dict:
        """Obtiene vista previa de reversión"""
        url = f'{self.base_url}/sales/orders/{sale_id}/preview-cancellation'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def cancel_sale(self, sale_id: str, reason: str = None) -> dict:
        """Cancela una venta con razón opcional"""
        url = f'{self.base_url}/sales/orders/{sale_id}'
        body = {'reason': reason} if reason else {}
        response = requests.put(url, headers=self.headers, json=body)
        response.raise_for_status()
        return response.json()

    def cancel_with_confirmation(self, sale_id: str, reason: str):
        """Cancela con vista previa y confirmación"""
        # 1. Obtener preview
        preview = self.preview_cancellation(sale_id)

        # 2. Mostrar información
        print(f"Total a reembolsar: ${preview['summary']['total_refund']}")
        print(f"Productos a revertir: {preview['summary']['total_products']}")
        print(f"Stock a restaurar: {preview['summary']['stock_movements']}")

        # 3. Pedir confirmación
        confirm = input('¿Desea cancelar esta venta? (si/no): ')
        if confirm.lower() != 'si':
            print('Cancelación abortada')
            return None

        # 4. Ejecutar cancelación
        result = self.cancel_sale(sale_id, reason)
        print(f"✅ Venta cancelada: {result['sale_id']}")
        return result

# Uso
api = SaleRevertAPI('http://localhost:5050', 'YOUR_JWT_TOKEN')

try:
    api.cancel_with_confirmation(
        'SALE-123',
        'Cliente solicitó cancelación'
    )
except requests.HTTPError as e:
    print(f'❌ Error: {e.response.json()["message"]}')
```

---

## 🔒 Autenticación

Todos los endpoints requieren autenticación mediante JWT Token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token debe incluir:
- `user_id`: ID del usuario que ejecuta la acción
- Permisos adecuados para cancelar ventas

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 400 | Request inválido |
| 401 | No autenticado |
| 404 | Venta no encontrada |
| 409 | Venta ya cancelada |
| 500 | Error interno del servidor |

---

## ⚠️ Notas Importantes

1. **Transaccionalidad:** La reversión es atómica - si algo falla, TODO se revierte.

2. **Idempotencia:** Intentar cancelar una venta ya cancelada retorna 409 pero NO es un error fatal.

3. **Auditoría:** Toda reversión queda registrada en el campo `metadata` de la venta con:
   - Usuario que canceló
   - Fecha y hora
   - Razón de cancelación
   - Detalles de lo revertido

4. **Stock:** Para productos físicos, el stock se restaura automáticamente.

5. **Reservas:** Para servicios con reservas:
   - `COMPLETED` → `CONFIRMED` (reserva disponible para nueva venta)
   - `RESERVED/CONFIRMED` → `CANCELLED`

6. **Pagos:** Los pagos cambian de `COMPLETED` → `REFUNDED`.

---

## 🔗 Archivos Relacionados

- [REVERT_SALES_GUIDE.md](REVERT_SALES_GUIDE.md) - Guía completa del sistema
- [revert_sale_enhanced.sql](revert_sale_enhanced.sql) - Implementación en base de datos
- `/handlers/sale.go` - Implementación de handlers
- `/services/sale.go` - Lógica de negocio
- `/database/postgres/sale.go` - Acceso a datos

---

**Última actualización:** 2025-09-30
**Versión de API:** v1.0.0