# 💰 Guía de Integración Frontend - API de Cajas Registradoras v1.0

## 📋 Índice
1. [Configuración General](#configuración-general)
2. [Gestión de Cajas Registradoras](#gestión-de-cajas-registradoras)
3. [Pagos Integrados con Cajas](#pagos-integrados-con-cajas)
4. [Movimientos de Efectivo](#movimientos-de-efectivo)
5. [Reportes y Estadísticas](#reportes-y-estadísticas)
6. [Códigos de Error](#códigos-de-error)
7. [Ejemplos de Integración](#ejemplos-de-integración)

## 🔥 **Características del Sistema**
- ✅ **Control de cajas**: Apertura, cierre y gestión completa
- ✅ **Pagos integrados**: Procesamiento automático con movimientos de efectivo
- ✅ **Validaciones automáticas**: Triggers de seguridad y validaciones de negocio
- ✅ **Reportes en tiempo real**: Estado financiero y movimientos por período
- ✅ **Multi-usuario**: Cada usuario puede operar su propia caja
- ✅ **Auditoría completa**: Trazabilidad de todos los movimientos

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```typescript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

### Formato de Respuesta Estándar
```typescript
interface APIResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
}
```

---

## 💰 Gestión de Cajas Registradoras

### 1. Abrir Caja Registradora
**Endpoint:** `POST /cash-registers/open`

Abre una nueva caja registradora para el usuario autenticado.

```typescript
// Request
interface OpenCashRegisterRequest {
  name: string;           // Nombre descriptivo de la caja
  initial_balance: number; // Balance inicial en efectivo
  location?: string;      // Ubicación física (opcional)
  description?: string;   // Descripción adicional (opcional)
}

// Response
interface CashRegister {
  id: number;
  name: string;
  status: "OPEN" | "CLOSED";
  initial_balance: number;
  current_balance: number;
  opened_at: string;
  opened_by: number;
  location?: string;
  description?: string;
}
```

#### Ejemplo de Uso
```javascript
const openCashRegister = async () => {
  try {
    const response = await fetch('/cash-registers/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Caja Principal - Turno Mañana',
        initial_balance: 100000,
        location: 'Punto de Venta 1',
        description: 'Caja para turno matutino'
      })
    });
    
    const cashRegister = await response.json();
    console.log('Caja abierta:', cashRegister);
    
    // Guardar ID de caja para operaciones posteriores
    localStorage.setItem('activeCashRegisterId', cashRegister.id);
    
  } catch (error) {
    console.error('Error abriendo caja:', error);
  }
};
```

### 2. Cerrar Caja Registradora
**Endpoint:** `PUT /cash-registers/{id}/close`

Cierra una caja registradora y calcula el balance final.

```typescript
// Request (opcional)
interface CloseCashRegisterRequest {
  final_balance?: number; // Balance final reportado (para conciliación)
  notes?: string;         // Notas del cierre
}

// Response
interface ClosedCashRegister extends CashRegister {
  status: "CLOSED";
  closed_at: string;
  closed_by: number;
  final_balance: number;
  calculated_balance: number;
  variance?: number;      // Diferencia entre final y calculado
}
```

#### Ejemplo de Uso
```javascript
const closeCashRegister = async (cashRegisterId, reportedBalance) => {
  try {
    const response = await fetch(`/cash-registers/${cashRegisterId}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        final_balance: reportedBalance,
        notes: 'Cierre de turno - conteo físico realizado'
      })
    });
    
    const result = await response.json();
    
    if (result.variance && result.variance !== 0) {
      console.warn(`Diferencia detectada: $${result.variance}`);
      // Mostrar alerta al usuario sobre la diferencia
    }
    
    console.log('Caja cerrada exitosamente');
    localStorage.removeItem('activeCashRegisterId');
    
  } catch (error) {
    console.error('Error cerrando caja:', error);
  }
};
```

### 3. Obtener Caja Activa
**Endpoint:** `GET /cash-registers/active`

Obtiene la caja registradora activa del usuario autenticado.

```javascript
const getActiveCashRegister = async () => {
  try {
    const response = await fetch('/cash-registers/active', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      // No hay caja activa
      return null;
    }
    
    const activeCashRegister = await response.json();
    return activeCashRegister;
    
  } catch (error) {
    console.error('Error obteniendo caja activa:', error);
    return null;
  }
};
```

### 4. Listar Cajas Registradoras
**Endpoint:** `GET /cash-registers`

```typescript
// Query Parameters
interface CashRegisterFilters {
  status?: "OPEN" | "CLOSED";
  user_id?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
}
```

```javascript
const getCashRegisters = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  
  const response = await fetch(`/cash-registers?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Obtener cajas del día actual
const todaysCashRegisters = await getCashRegisters({
  start_date: '2025-09-05',
  end_date: '2025-09-05'
});
```

---

## 💳 Pagos Integrados con Cajas

### 1. Procesar Pago de Venta con Caja
**Endpoint:** `POST /cash-registers/payments/sale`

Procesa un pago de venta con integración automática de caja registradora.

```typescript
interface ProcessSalePaymentCashRegisterRequest {
  sales_order_id: string;    // ID de la orden de venta
  amount_received: number;   // Monto recibido del cliente
  payment_reference?: string; // Referencia del pago
  payment_notes?: string;    // Notas adicionales
}

interface SalePaymentWithCashRegisterResponse {
  success: boolean;
  message: string;
  payment_id: number;
  sale_id: string;
  client_name: string;
  payment_details: {
    total_due: number;
    amount_received: number;
    change_amount: number;
    currency_code: string;
    payment_method: string;
    payment_reference?: string;
  };
  requires_change: boolean;
  processed_at: string;
  processed_by: number;
  
  // Información de integración con caja
  cash_register_integration: {
    cash_register_id: number;
    income_movement_registered: boolean;
    change_movement_registered: boolean;
    net_cash_impact: number; // Impacto neto en efectivo
  };
}
```

#### Ejemplo de Uso
```javascript
const processSalePayment = async (saleData) => {
  try {
    const response = await fetch('/cash-registers/payments/sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sales_order_id: saleData.saleId,
        amount_received: saleData.amountReceived,
        payment_reference: saleData.reference,
        payment_notes: saleData.notes
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Mostrar detalles del pago
      console.log(`Pago procesado: $${result.payment_details.total_due}`);
      console.log(`Recibido: $${result.payment_details.amount_received}`);
      
      if (result.requires_change) {
        console.log(`Vuelto: $${result.payment_details.change_amount}`);
        // Mostrar alerta de vuelto al cajero
      }
      
      // Actualizar balance de caja en UI
      updateCashRegisterBalance(result.cash_register_integration.net_cash_impact);
      
    } else {
      console.error('Error en pago:', result.message);
    }
    
  } catch (error) {
    console.error('Error procesando pago:', error);
  }
};
```

### 2. Procesar Pago de Compra con Caja
**Endpoint:** `POST /cash-registers/payments/purchase`

```typescript
interface ProcessPurchasePaymentCashRegisterRequest {
  purchase_order_id: number;
  amount_paid: number;
  payment_reference?: string;
  payment_notes?: string;
}
```

```javascript
const processPurchasePayment = async (purchaseData) => {
  const response = await fetch('/cash-registers/payments/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      purchase_order_id: purchaseData.purchaseOrderId,
      amount_paid: purchaseData.amountPaid,
      payment_reference: purchaseData.reference,
      payment_notes: purchaseData.notes
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Pago de compra procesado exitosamente');
    // Actualizar balance (reducción por egreso)
    updateCashRegisterBalance(-purchaseData.amountPaid);
  }
  
  return result;
};
```

---

## 💸 Movimientos de Efectivo

### 1. Registrar Movimiento Manual
**Endpoint:** `POST /cash-registers/{id}/movements`

Para registrar movimientos de efectivo manuales (ajustes, retiros, depósitos).

```typescript
interface RegisterMovementRequest {
  movement_type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
  amount: number;
  concept: string;
  notes?: string;
}
```

```javascript
const registerManualMovement = async (cashRegisterId, movementData) => {
  const response = await fetch(`/cash-registers/${cashRegisterId}/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      movement_type: 'EXPENSE',
      amount: 50000,
      concept: 'Retiro para gastos menores',
      notes: 'Autorizado por gerencia'
    })
  });
  
  return await response.json();
};
```

### 2. Obtener Movimientos
**Endpoint:** `GET /cash-registers/{id}/movements`

```typescript
interface MovementFilters {
  movement_type?: "INCOME" | "EXPENSE" | "ADJUSTMENT";
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
```

```javascript
const getMovements = async (cashRegisterId, filters = {}) => {
  const params = new URLSearchParams(filters);
  
  const response = await fetch(`/cash-registers/${cashRegisterId}/movements?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const movements = await response.json();
  
  // Mostrar movimientos en tabla
  movements.forEach(movement => {
    console.log(`${movement.movement_type}: $${movement.amount} - ${movement.concept}`);
  });
  
  return movements;
};
```

---

## 📊 Reportes y Estadísticas

### 1. Resumen de Caja
**Endpoint:** `GET /cash-registers/{id}/summary`

```typescript
interface CashRegisterSummary {
  cash_register: CashRegister;
  financial_summary: {
    initial_balance: number;
    total_income: number;
    total_expenses: number;
    current_balance: number;
    calculated_balance: number;
  };
  movement_counts: {
    total_movements: number;
    income_movements: number;
    expense_movements: number;
    adjustment_movements: number;
  };
  period_summary: {
    start_time: string;
    end_time?: string;
    duration_hours?: number;
  };
}
```

```javascript
const getCashRegisterSummary = async (cashRegisterId) => {
  const response = await fetch(`/cash-registers/${cashRegisterId}/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const summary = await response.json();
  
  // Mostrar resumen en dashboard
  displayCashRegisterDashboard(summary);
  
  return summary;
};

const displayCashRegisterDashboard = (summary) => {
  const { financial_summary, movement_counts } = summary;
  
  console.log('=== RESUMEN DE CAJA ===');
  console.log(`Balance Inicial: $${financial_summary.initial_balance}`);
  console.log(`Total Ingresos: $${financial_summary.total_income}`);
  console.log(`Total Egresos: $${financial_summary.total_expenses}`);
  console.log(`Balance Actual: $${financial_summary.current_balance}`);
  console.log(`Total Movimientos: ${movement_counts.total_movements}`);
};
```

### 2. Verificar Integridad
**Endpoint:** `GET /cash-registers/verify-integration`

Verifica la integridad de la integración entre pagos y movimientos de caja.

```javascript
const verifyIntegration = async () => {
  const response = await fetch('/cash-registers/verify-integration', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const verification = await response.json();
  
  if (verification.integration_status === 'FULLY_INTEGRATED') {
    console.log('✅ Sistema completamente integrado');
  } else {
    console.warn('⚠️ Problemas de integración detectados');
    console.log(verification.verification_results);
  }
  
  return verification;
};
```

---

## ❌ Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| `CASH_REGISTER_CLOSED` | Caja registradora cerrada | Abrir una nueva caja |
| `USER_HAS_ACTIVE_CASH_REGISTER` | Usuario ya tiene caja abierta | Cerrar caja actual primero |
| `CASH_REGISTER_NOT_FOUND` | Caja no encontrada | Verificar ID de caja |
| `INVALID_INITIAL_BALANCE` | Balance inicial inválido | Usar valor positivo |
| `INSUFFICIENT_PERMISSIONS` | Permisos insuficientes | Verificar rol de usuario |
| `PAYMENT_INTEGRATION_ERROR` | Error en integración de pago | Revisar logs del sistema |

---

## 🔗 Ejemplos de Integración

### Componente React - CashRegisterManager

```jsx
import React, { useState, useEffect } from 'react';

const CashRegisterManager = () => {
  const [activeCashRegister, setActiveCashRegister] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadActiveCashRegister();
  }, []);

  const loadActiveCashRegister = async () => {
    try {
      const response = await fetch('/cash-registers/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const cashRegister = await response.json();
        setActiveCashRegister(cashRegister);
      }
    } catch (error) {
      console.error('Error loading active cash register:', error);
    }
  };

  const openCashRegister = async (initialBalance) => {
    setIsLoading(true);
    try {
      const response = await fetch('/cash-registers/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: `Caja - ${new Date().toLocaleDateString()}`,
          initial_balance: initialBalance,
          location: 'Punto de Venta Principal'
        })
      });

      if (response.ok) {
        const newCashRegister = await response.json();
        setActiveCashRegister(newCashRegister);
        alert('Caja abierta exitosamente');
      }
    } catch (error) {
      console.error('Error opening cash register:', error);
      alert('Error abriendo caja registradora');
    } finally {
      setIsLoading(false);
    }
  };

  const closeCashRegister = async () => {
    if (!activeCashRegister) return;
    
    const finalBalance = prompt('Ingrese el balance final contado:');
    if (finalBalance === null) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/cash-registers/${activeCashRegister.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          final_balance: parseFloat(finalBalance),
          notes: 'Cierre de turno'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.variance && result.variance !== 0) {
          alert(`Caja cerrada. Diferencia detectada: $${result.variance}`);
        } else {
          alert('Caja cerrada exitosamente');
        }
        setActiveCashRegister(null);
      }
    } catch (error) {
      console.error('Error closing cash register:', error);
      alert('Error cerrando caja registradora');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cash-register-manager">
      <h2>Gestión de Caja Registradora</h2>
      
      {activeCashRegister ? (
        <div className="active-cash-register">
          <h3>{activeCashRegister.name}</h3>
          <p>Estado: <span className="status-open">ABIERTA</span></p>
          <p>Balance Actual: ${activeCashRegister.current_balance}</p>
          <p>Abierta: {new Date(activeCashRegister.opened_at).toLocaleString()}</p>
          
          <button 
            onClick={closeCashRegister}
            disabled={isLoading}
            className="btn-close"
          >
            {isLoading ? 'Cerrando...' : 'Cerrar Caja'}
          </button>
        </div>
      ) : (
        <div className="no-cash-register">
          <p>No hay caja registradora activa</p>
          <button 
            onClick={() => {
              const balance = prompt('Ingrese el balance inicial:');
              if (balance) openCashRegister(parseFloat(balance));
            }}
            disabled={isLoading}
            className="btn-open"
          >
            {isLoading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CashRegisterManager;
```

### Hook personalizado - useCashRegister

```jsx
import { useState, useEffect } from 'react';

export const useCashRegister = () => {
  const [activeCashRegister, setActiveCashRegister] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const loadActiveCashRegister = async () => {
    try {
      const response = await fetch('/cash-registers/active', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const cashRegister = await response.json();
        setActiveCashRegister(cashRegister);
        return cashRegister;
      }
      return null;
    } catch (error) {
      console.error('Error loading active cash register:', error);
      return null;
    }
  };

  const processSalePayment = async (saleData) => {
    if (!activeCashRegister) {
      throw new Error('No hay caja registradora activa');
    }

    setIsLoading(true);
    try {
      const response = await fetch('/cash-registers/payments/sale', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar balance local
        if (result.cash_register_integration) {
          setActiveCashRegister(prev => ({
            ...prev,
            current_balance: prev.current_balance + result.cash_register_integration.net_cash_impact
          }));
        }
        
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error procesando pago');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveCashRegister();
  }, []);

  return {
    activeCashRegister,
    isLoading,
    loadActiveCashRegister,
    processSalePayment,
    hasActiveCashRegister: !!activeCashRegister
  };
};
```

### Uso del Hook en Componente de Ventas

```jsx
import React from 'react';
import { useCashRegister } from './hooks/useCashRegister';

const SalesComponent = () => {
  const { activeCashRegister, processSalePayment, hasActiveCashRegister } = useCashRegister();

  const handleSalePayment = async (saleId, amountReceived) => {
    if (!hasActiveCashRegister) {
      alert('Debe abrir una caja registradora primero');
      return;
    }

    try {
      const result = await processSalePayment({
        sales_order_id: saleId,
        amount_received: amountReceived,
        payment_reference: `VENTA_${Date.now()}`,
        payment_notes: 'Pago en efectivo'
      });

      if (result.success) {
        console.log('Pago procesado exitosamente');
        
        if (result.requires_change) {
          alert(`Entregue vuelto: $${result.payment_details.change_amount}`);
        }
      }
    } catch (error) {
      console.error('Error en pago:', error);
      alert('Error procesando el pago');
    }
  };

  return (
    <div className="sales-component">
      {hasActiveCashRegister ? (
        <div className="cash-register-status">
          <p>Caja Activa: {activeCashRegister.name}</p>
          <p>Balance: ${activeCashRegister.current_balance}</p>
        </div>
      ) : (
        <div className="no-cash-register-warning">
          <p>⚠️ No hay caja registradora activa</p>
        </div>
      )}
      
      {/* Resto del componente de ventas */}
    </div>
  );
};
```

---

## 📝 Notas Importantes

1. **Validación de Caja Activa**: Siempre verificar que hay una caja abierta antes de procesar pagos.

2. **Manejo de Errores**: Implementar manejo robusto de errores para operaciones críticas.

3. **Estado Sincronizado**: Mantener el estado de la caja actualizado en el frontend.

4. **Conciliación**: Implementar funcionalidad para conciliar diferencias en el cierre.

5. **Backup de Datos**: Los movimientos de caja son críticos, asegurar backup automático.

---

**Documentación actualizada:** 5 de Septiembre, 2025  
**API completamente funcional y probada** 🚀
