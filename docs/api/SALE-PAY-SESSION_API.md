# 🚀 Guía de Integración Frontend - API de Ventas, Pagos y Sesiones v2.0

## 📋 Índice
1. [Configuración General](#configuración-general)
2. [Autenticación y Sesiones](#autenticación-y-sesiones)
3. [API de Ventas](#api-de-ventas)
4. [API de Pagos con Vuelto](#api-de-pagos-con-vuelto)
5. [API de Gestión de Sesiones](#api-de-gestión-de-sesiones)
6. [Códigos de Error](#códigos-de-error)
7. [Ejemplos de Integración](#ejemplos-de-integración)

## 🔥 **Novedades en v2.0**
- ✅ **Sistema de reversión mejorado** con preview de impacto
- ✅ **API unificada** para ventas con y sin reserva
- ✅ **Cálculo automático de vuelto** con validaciones
- ✅ **Gestión avanzada de sesiones** con logout mejorado
- ✅ **Manejo de errores expandido** con sugerencias
- ✅ **Componentes React** de ejemplo actualizados
- ✅ **Integración backend actualizada** (Agosto 2025) con procedimientos mejorados

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
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
}
```

---

## 🔐 Autenticación y Sesiones

### 1. Login
```typescript
// POST /login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;           // JWT Token
  role_id: string;        // ID del rol del usuario
  session_id: number;     // ID de la sesión activa
  expires_at: string;     // Fecha de expiración del token
  user_id: string;        // ID del usuario
}

// Ejemplo de uso
const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

### 2. Logout (Nuevo)
```typescript
// POST /sessions/{id}/revoke
interface LogoutRequest {
  session_id: number;
  reason?: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
  revoked_at: string;
}

// Ejemplo de uso
const logoutUser = async (sessionId: number): Promise<LogoutResponse> => {
  const response = await fetch(`/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason: 'User logout' })
  });
  return response.json();
};
```

---

## 🛒 API de Ventas

### 1. Procesar Venta (Unificada)
```typescript
// POST /sale/ (endpoint principal - recomendado)
// POST /sale/with-units (endpoint alternativo con soporte extendido de unidades)
interface ProcessSaleRequest {
  sale_id?: string;                    // Opcional, se genera automáticamente
  client_id: string;                   // ID del cliente
  product_details: ProductDetail[];    // Detalles de productos
  payment_method_id?: number;          // Método de pago (opcional)
  currency_id?: number;                // Moneda (opcional)
  allow_price_modifications: boolean;  // Permitir modificaciones de precio
  reserve_id?: number;                 // ID de reserva (opcional para ventas con reserva)
}

interface ProductDetail {
  product_id: string;                  // ID del producto
  quantity: number;                    // Cantidad (acepta decimales)
  tax_rate_id?: number;                // ID de tasa de impuesto
  sale_price?: number;                 // Precio modificado (opcional)
  price_change_reason?: string;        // Razón del cambio de precio
}

interface ProcessSaleResponse {
  success: boolean;
  sale_id: string;
  total_amount: number;
  items_processed: number;
  price_modifications_enabled: boolean;
  has_price_changes: boolean;
  message: string;
  error?: string;
}

// Ejemplo de uso - Venta Normal
const processSale = async (saleData: ProcessSaleRequest): Promise<ProcessSaleResponse> => {
  const response = await fetch('/sale/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(saleData)
  });
  return response.json();
};

// Ejemplo de uso - Venta con Reserva
const processSaleWithReserve = async (saleData: ProcessSaleRequest): Promise<ProcessSaleResponse> => {
  const saleWithReserve = {
    ...saleData,
    reserve_id: 123  // ID de la reserva
  };
  
  return processSale(saleWithReserve);
};
```

### 2. Obtener Venta por ID
```typescript
// GET /sale/{id}
interface SaleDetails {
  id: string;
  client_id: string;
  client_name: string;
  sale_date: string;
  total_amount: number;
  status: string;
  user_id: string;
  user_name: string;
  payment_method_id?: number;
  payment_method?: string;
  currency_id?: number;
  currency?: string;
  details: SaleItemDetail[];
}

interface SaleItemDetail {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  base_price: number;      // Precio base del producto
  unit_price: number;      // Precio final de venta
  subtotal: number;        // Cantidad × precio unitario
  tax_amount: number;      // Monto del impuesto
  total_with_tax: number;  // Subtotal + impuesto
  price_modified: boolean; // Si el precio fue modificado
  reserve_id: number;
  tax_rate_id: number;
  tax_rate: number;
}
```

### 3. Obtener Ventas por Rango de Fechas
```typescript
// GET /sale/date_range/?start_date=2024-01-01&end_date=2024-01-31&page=1&page_size=20
interface SalesListResponse {
  sales: SaleDetails[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

### 4. Cancelar Venta (Reversión Mejorada)
```typescript
// PUT /sale/{id}
interface CancelSaleRequest {
  user_id: string;
  reason?: string;
}

interface CancelSaleResponse {
  success: boolean;
  message: string;
  sale_id: string;
  cancelled_at: string;
  reversal_details?: {
    payments_cancelled: number;
    total_refunded: number;
    stock_updates: number;
    reserves_handled: number;
    original_status: string;
  };
}

// Nuevo: Preview de Impacto de Cancelación
  // GET /sale/{id}/preview-cancellation
  interface CancellationPreview {
  success: boolean;
  sale_info: {
    sale_id: string;
    current_status: string;
    total_amount: number;
    can_be_reverted: boolean;
  };
  impact_analysis: {
    total_items: number;
    physical_products: number;
    service_products: number;
    active_reserves: number;
    payments_to_cancel: number;
    total_to_refund: number;
    requires_stock_adjustment: boolean;
    requires_reserve_cancellation: boolean;
    requires_payment_refund: boolean;
  };
  recommendations: {
    action: 'no_action_needed' | 'refund_required' | 'reserve_cancellation_required' | 'simple_cancellation';
    backup_recommended: boolean;
    notify_customer: boolean;
    estimated_complexity: 'low' | 'medium' | 'high';
  };
}

  // Ejemplo de uso con preview
  const previewCancellation = async (saleId: string): Promise<CancellationPreview> => {
    const response = await fetch(`/sale/${saleId}/preview-cancellation`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  };const cancelSaleWithPreview = async (saleId: string, reason?: string): Promise<CancelSaleResponse> => {
  // 1. Obtener preview del impacto
  const preview = await previewCancellation(saleId);
  
  if (!preview.sale_info.can_be_reverted) {
    throw new Error('Esta venta no puede ser cancelada');
  }

  // 2. Mostrar información al usuario si es necesario
  if (preview.recommendations.notify_customer && preview.impact_analysis.total_to_refund > 0) {
    const confirmed = confirm(
      `Esta cancelación requiere reembolso de $${preview.impact_analysis.total_to_refund}. ¿Continuar?`
    );
    if (!confirmed) return { success: false, message: 'Cancelación abortada por el usuario' } as any;
  }

  // 3. Proceder con la cancelación
  const response = await fetch(`/sale/${saleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return response.json();
};
```

### 5. Reporte de Cambios de Precio
```typescript
// GET /sale/price-changes/report?sale_id={id}&start_date=2024-01-01&end_date=2024-01-31
interface PriceChangeReport {
  product_id: string;
  product_name: string;
  original_price: number;
  modified_price: number;
  price_difference: number;
  percentage_change: number;
  user_id: string;
  reason: string;
  timestamp: string;
  change_id: string;
}
```

---

## 💰 API de Pagos con Vuelto

### 1. Procesar Pago
```typescript
// POST /payment/process
interface ProcessPaymentRequest {
  sales_order_id: string;              // ID de la venta
  amount_received: number;             // Monto recibido del cliente
  payment_reference?: string;          // Referencia del pago (opcional)
  payment_notes?: string;              // Notas del pago (opcional)
}

interface ProcessPaymentResponse {
  success: boolean;
  payment_id?: number;
  sale_id: string;
  client_name: string;
  payment_details: PaymentDetails;
  message: string;
  requires_change: boolean;            // Si requiere dar vuelto
  processed_at: string;
  processed_by: string;
  error?: string;
  error_code?: string;
}

interface PaymentDetails {
  total_due: number;                   // Total a pagar
  amount_received: number;             // Monto recibido
  change_amount: number;               // Vuelto a entregar
  currency_code: string;               // Código de moneda
  payment_method: string;              // Método de pago
  payment_reference?: string;          // Referencia del pago
}

// Ejemplo de uso
const processPayment = async (paymentData: ProcessPaymentRequest): Promise<ProcessPaymentResponse> => {
  const response = await fetch('/payment/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};
```

### 2. Obtener Detalles de Pago
```typescript
// GET /payment/details/{saleId}
interface PaymentDetailsQuery {
  payment_id: number;
  sales_order_id: string;
  client_name: string;
  amount_due: number;
  amount_received: number;
  change_amount: number;
  currency_code: string;
  payment_method_code: string;
  payment_reference?: string;
  payment_notes?: string;
  payment_date: string;
  processed_by_name: string;
  status: string;
}

// GET /payment/{paymentId} - Por ID específico de pago
```

### 3. Estadísticas de Vueltos
```typescript
// GET /payment/statistics/change?start_date=2024-01-01&end_date=2024-01-31
interface ChangeStatistics {
  period: {
    start_date: string;
    end_date: string;
  };
  statistics: {
    total_payments: number;
    payments_with_change: number;
    payments_exact_amount: number;
    change_percentage: number;
    total_change_given: number;
    average_change_amount: number;
    maximum_change_amount: number;
  };
  generated_at: string;
}
```

### 4. Códigos de Error de Pagos
```typescript
enum PaymentErrorCodes {
  SALE_NOT_FOUND = 'SALE_NOT_FOUND',
  SALE_CANCELLED = 'SALE_CANCELLED',
  SALE_ALREADY_PAID = 'SALE_ALREADY_PAID',
  INSUFFICIENT_AMOUNT = 'INSUFFICIENT_AMOUNT',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}
```

---

## 🔒 API de Gestión de Sesiones

### 1. Obtener Sesiones Activas
```typescript
// GET /sessions/active
interface UserSession {
  id: number;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
  location_info?: any;
}

interface ActiveSessionsResponse {
  sessions: UserSession[];
  total_count: number;
  current_session_id: number;
}
```

### 2. Historial de Sesiones
```typescript
// GET /sessions/history?page=1&page_size=20
interface SessionHistoryResponse {
  sessions: UserSession[];
  total_count: number;
  page: number;
  page_size: number;
}
```

### 3. Revocar Sesión Específica
```typescript
// POST /sessions/{id}/revoke
interface RevokeSessionRequest {
  reason?: string;
}

interface RevokeSessionResponse {
  success: boolean;
  message: string;
  session_id: number;
  revoked_at: string;
}
```

### 4. Revocar Todas las Sesiones
```typescript
// POST /sessions/revoke-all
interface RevokeAllSessionsRequest {
  reason?: string;
  exclude_current?: boolean;  // Excluir sesión actual
}

interface RevokeAllSessionsResponse {
  success: boolean;
  message: string;
  sessions_revoked: number;
  revoked_at: string;
}
```

### 5. Actividad del Usuario
```typescript
// GET /sessions/activity?page=1&page_size=50&activity_type=LOGIN
interface UserActivity {
  id: number;
  user_id: string;
  session_id?: number;
  activity_type: string;        // LOGIN, LOGOUT, API_CALL, etc.
  endpoint?: string;
  http_method?: string;
  ip_address?: string;
  created_at: string;
  duration_ms?: number;
}

interface UserActivityResponse {
  activities: UserActivity[];
  total_count: number;
  page: number;
  page_size: number;
}
```

### 6. Configuración de Sesión
```typescript
// GET /sessions/config
interface SessionConfig {
  id: number;
  role_id: string;
  max_concurrent_sessions: number;
  session_timeout_minutes: number;
  inactivity_timeout_minutes: number;
  require_device_verification: boolean;
  allow_multiple_locations: boolean;
  force_logout_on_password_change: boolean;
}
```

### 7. Endpoints de Administración (Solo Admin)
```typescript
// GET /admin/sessions/all - Todas las sesiones activas
interface AdminSessionsResponse {
  sessions: UserSessionWithUser[];
  total_count: number;
}

interface UserSessionWithUser extends UserSession {
  username: string;
  email: string;
  role_name: string;
}

// POST /admin/sessions/{id}/revoke - Revocar sesión de usuario
interface AdminRevokeRequest {
  reason: string;
  notify_user?: boolean;
}
```

---

## ⚠️ Códigos de Error

### Ventas
- `INVALID_PRODUCT_ID`: Producto no encontrado
- `INSUFFICIENT_STOCK`: Stock insuficiente
- `INVALID_CLIENT_ID`: Cliente no encontrado
- `PRICE_MODIFICATION_NOT_ALLOWED`: Modificación de precio no permitida
- `RESERVE_NOT_FOUND`: Reserva no encontrada
- `RESERVE_ALREADY_USED`: Reserva ya utilizada
- `SALE_NOT_FOUND`: Venta no encontrada para cancelación
- `ALREADY_CANCELLED`: La venta ya está cancelada
- `PRODUCT_NOT_FOUND`: Producto no encontrado durante reversión
- `STOCK_NOT_FOUND`: No se pudo restaurar stock del producto
- `RESERVE_NOT_UPDATED`: Reserva no pudo ser liberada

### Pagos
- `SALE_NOT_FOUND`: Venta no encontrada
- `SALE_CANCELLED`: No se puede pagar una venta cancelada
- `SALE_ALREADY_PAID`: Venta ya está totalmente pagada
- `INSUFFICIENT_AMOUNT`: Monto insuficiente para cubrir el total
- `SYSTEM_ERROR`: Error interno del sistema

### Sesiones
- `SESSION_NOT_FOUND`: Sesión no encontrada
- `SESSION_ALREADY_REVOKED`: Sesión ya revocada
- `CANNOT_REVOKE_CURRENT_SESSION`: No se puede revocar la sesión actual
- `MAX_SESSIONS_EXCEEDED`: Máximo de sesiones concurrentes excedido
- `UNAUTHORIZED_ACCESS`: Acceso no autorizado

---

## 📝 Ejemplos de Integración

### 1. Flujo Completo de Venta con Pago
```typescript
class SalesService {
  private baseUrl = 'http://localhost:5050';
  private token = localStorage.getItem('jwt_token');

  // Procesar venta (unificada - maneja ventas con y sin reserva)
  async createSale(saleData: ProcessSaleRequest): Promise<ProcessSaleResponse> {
    const response = await fetch(`${this.baseUrl}/sale/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(saleData)
    });

    if (!response.ok) {
      throw new Error(`Error en venta: ${response.statusText}`);
    }

    return response.json();
  }

  // Procesar pago con cálculo automático de vuelto
  async processPayment(paymentData: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payment/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`Error en pago: ${response.statusText}`);
    }

    return response.json();
  }

  // Preview de cancelación antes de ejecutar
  async previewCancellation(saleId: string): Promise<CancellationPreview> {
    const response = await fetch(`${this.baseUrl}/sale/${saleId}/preview-cancellation`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }

  // Cancelar venta con reversión completa (stock, pagos, reservas)
  async cancelSale(saleId: string, reason?: string): Promise<CancelSaleResponse> {
    const response = await fetch(`${this.baseUrl}/sale/${saleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  // Flujo completo: venta + pago con manejo de vuelto
  async completeSaleWithPayment(
    saleData: ProcessSaleRequest, 
    amountReceived: number
  ): Promise<{ sale: ProcessSaleResponse; payment: ProcessPaymentResponse }> {
    try {
      // 1. Crear venta (funciona para ventas normales y con reserva)
      const sale = await this.createSale(saleData);
      
      if (!sale.success) {
        throw new Error(sale.error || 'Error al crear venta');
      }

      // 2. Procesar pago con cálculo automático de vuelto
      const payment = await this.processPayment({
        sales_order_id: sale.sale_id,
        amount_received: amountReceived,
        payment_reference: `PAY-${Date.now()}`
      });

      if (!payment.success) {
        throw new Error(payment.error || 'Error al procesar pago');
      }

      // 3. Mostrar información del vuelto si aplica
      if (payment.requires_change) {
        console.log(`Vuelto a entregar: $${payment.payment_details.change_amount}`);
      }

      return { sale, payment };
    } catch (error) {
      console.error('Error en flujo de venta:', error);
      throw error;
    }
  }

  // Flujo completo con cancelación segura
  async cancelSaleWithConfirmation(saleId: string, reason?: string): Promise<CancelSaleResponse> {
    try {
      // 1. Obtener preview del impacto
      const preview = await this.previewCancellation(saleId);
      
      if (!preview.success) {
        throw new Error('No se pudo obtener información de la venta');
      }

      if (!preview.sale_info.can_be_reverted) {
        throw new Error('Esta venta no puede ser cancelada');
      }

      // 2. Mostrar información importante al usuario
      if (preview.impact_analysis.requires_payment_refund) {
        const confirmRefund = confirm(
          `Esta cancelación requiere reembolso de $${preview.impact_analysis.total_to_refund} en ${preview.impact_analysis.payments_to_cancel} pago(s). ¿Continuar?`
        );
        if (!confirmRefund) {
          return { success: false, message: 'Cancelación abortada por el usuario' } as any;
        }
      }

      if (preview.impact_analysis.requires_reserve_cancellation) {
        const confirmReserve = confirm(
          `Esta cancelación liberará ${preview.impact_analysis.active_reserves} reserva(s). ¿Continuar?`
        );
        if (!confirmReserve) {
          return { success: false, message: 'Cancelación abortada por el usuario' } as any;
        }
      }

      // 3. Ejecutar cancelación
      const result = await this.cancelSale(saleId, reason);

      if (result.success && result.reversal_details) {
        console.log('Cancelación completada:', {
          pagosRevocados: result.reversal_details.payments_cancelled,
          totalReembolsado: result.reversal_details.total_refunded,
          stockActualizado: result.reversal_details.stock_updates,
          reservasLiberadas: result.reversal_details.reserves_handled
        });
      }

      return result;
    } catch (error) {
      console.error('Error en cancelación:', error);
      throw error;
    }
  }
}
```

### 2. Gestión de Sesiones
```typescript
class SessionService {
  private baseUrl = 'http://localhost:5050';
  private token = localStorage.getItem('jwt_token');

  // Obtener sesiones activas
  async getActiveSessions(): Promise<ActiveSessionsResponse> {
    const response = await fetch(`${this.baseUrl}/sessions/active`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }

  // Logout con revocación de sesión
  async logout(sessionId: number): Promise<LogoutResponse> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ reason: 'User logout' })
    });

    const result = await response.json();
    
    if (result.success) {
      // Limpiar token local
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('session_id');
      
      // Redirigir a login
      window.location.href = '/login';
    }

    return result;
  }

  // Revocar sesión específica (desde dashboard)
  async revokeSession(sessionId: number, reason?: string): Promise<RevokeSessionResponse> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ reason: reason || 'Manual revocation' })
    });
    return response.json();
  }
}
```

### 3. Manejo de Errores
```typescript
class APIErrorHandler {
  static handle(error: any, context: string) {
    console.error(`Error en ${context}:`, error);

    switch (error.error_code) {
      // Errores de ventas
      case 'SALE_NOT_FOUND':
        return 'La venta especificada no existe';
      
      case 'ALREADY_CANCELLED':
        return 'La venta ya está cancelada';
      
      case 'INVALID_PRODUCT_ID':
        return 'Uno o más productos no existen';
      
      case 'INSUFFICIENT_STOCK':
        return 'Stock insuficiente para uno o más productos';
      
      // Errores de pagos
      case 'INSUFFICIENT_AMOUNT':
        return `Monto insuficiente. Se requiere: ${error.amount_due}, recibido: ${error.amount_received}`;
      
      case 'SALE_ALREADY_PAID':
        return 'Esta venta ya ha sido pagada completamente';
      
      case 'SALE_CANCELLED':
        return 'No se puede procesar pago para una venta cancelada';
      
      // Errores de sesiones
      case 'SESSION_EXPIRED':
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('session_id');
        window.location.href = '/login';
        return 'Su sesión ha expirado, por favor inicie sesión nuevamente';
      
      case 'SESSION_NOT_FOUND':
        return 'La sesión especificada no existe';
      
      case 'SESSION_ALREADY_REVOKED':
        return 'La sesión ya ha sido revocada';
      
      case 'MAX_SESSIONS_EXCEEDED':
        return 'Ha excedido el número máximo de sesiones concurrentes';
      
      case 'CANNOT_REVOKE_CURRENT_SESSION':
        return 'No se puede revocar la sesión actual. Use logout normal.';
      
      // Errores de reversión
      case 'PRODUCT_NOT_FOUND':
        return 'Producto no encontrado durante la reversión';
      
      case 'STOCK_NOT_FOUND':
        return 'No se pudo restaurar el stock del producto';
      
      case 'RESERVE_NOT_UPDATED':
        return 'No se pudo liberar la reserva asociada';
      
      // Errores generales
      case 'SYSTEM_ERROR':
        return 'Error interno del sistema. Por favor contacte al administrador.';
      
      case 'UNAUTHORIZED_ACCESS':
        return 'No tiene permisos para realizar esta acción';
      
      default:
        return error.message || 'Error desconocido';
    }
  }

  // Manejo específico para errores de cancelación
  static handleCancellationError(error: any): string {
    if (error.error_code?.startsWith('ERROR_REVERT_SALE')) {
      const context = error.message?.split('Contexto: ')[1];
      if (context) {
        return `Error en cancelación: ${error.message}. Detalles: ${context}`;
      }
    }
    return this.handle(error, 'cancelación de venta');
  }

  // Manejo específico para errores de pago
  static handlePaymentError(error: any): { message: string; suggestion?: string } {
    const message = this.handle(error, 'procesamiento de pago');
    
    let suggestion: string | undefined;
    switch (error.error_code) {
      case 'INSUFFICIENT_AMOUNT':
        suggestion = 'Verifique el monto ingresado y el total de la venta';
        break;
      case 'SALE_NOT_FOUND':
        suggestion = 'Verifique que la venta existe y no ha sido eliminada';
        break;
      case 'SALE_ALREADY_PAID':
        suggestion = 'Revise el estado de la venta en el sistema';
        break;
    }

    return { message, suggestion };
  }
}
```

### 4. Componente React de Ejemplo
```typescript
import React, { useState } from 'react';

interface PaymentFormProps {
  saleId: string;
  totalAmount: number;
  onPaymentComplete: (payment: ProcessPaymentResponse) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ saleId, totalAmount, onPaymentComplete }) => {
  const [amountReceived, setAmountReceived] = useState<number>(totalAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const salesService = new SalesService();
      const payment = await salesService.processPayment({
        sales_order_id: saleId,
        amount_received: amountReceived,
        payment_reference: `PAY-${Date.now()}`
      });

      if (payment.success) {
        onPaymentComplete(payment);
      } else {
        setError(payment.error || 'Error al procesar pago');
      }
    } catch (err: any) {
      const errorInfo = APIErrorHandler.handlePaymentError(err);
      setError(errorInfo.message);
      if (errorInfo.suggestion) {
        console.info('Sugerencia:', errorInfo.suggestion);
      }
    } finally {
      setLoading(false);
    }
  };

  const changeAmount = amountReceived - totalAmount;

  return (
    <form onSubmit={handlePayment} className="payment-form">
      <div className="form-group">
        <label>Total a Pagar:</label>
        <span className="total-amount">${totalAmount.toFixed(2)}</span>
      </div>
      
      <div className="form-group">
        <label>Monto Recibido:</label>
        <input
          type="number"
          step="0.01"
          min={totalAmount}
          value={amountReceived}
          onChange={(e) => setAmountReceived(parseFloat(e.target.value))}
          required
        />
      </div>
      
      {changeAmount > 0 && (
        <div className="form-group change-info">
          <label>Vuelto a Entregar:</label>
          <span className="change-amount highlight">${changeAmount.toFixed(2)}</span>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={loading || amountReceived < totalAmount}>
        {loading ? 'Procesando...' : 'Procesar Pago'}
      </button>
    </form>
  );
};

// Componente adicional: Modal de Cancelación con Preview
interface CancellationModalProps {
  saleId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ 
  saleId, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const salesService = new SalesService();
      const previewData = await salesService.previewCancellation(saleId);
      setPreview(previewData);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPreview();
  }, [isOpen, saleId]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Cancelar Venta {saleId}</h3>
        
        {loading ? (
          <div>Cargando información...</div>
        ) : preview ? (
          <div className="preview-info">
            <div className="impact-summary">
              <h4>Impacto de la Cancelación:</h4>
              <ul>
                <li>Productos físicos: {preview.impact_analysis.physical_products}</li>
                <li>Productos de servicio: {preview.impact_analysis.service_products}</li>
                {preview.impact_analysis.requires_payment_refund && (
                  <li className="warning">
                    Reembolso requerido: ${preview.impact_analysis.total_to_refund}
                  </li>
                )}
                {preview.impact_analysis.requires_reserve_cancellation && (
                  <li className="warning">
                    Reservas a cancelar: {preview.impact_analysis.active_reserves}
                  </li>
                )}
              </ul>
            </div>
            
            <div className="complexity-indicator">
              Complejidad: <span className={`complexity-${preview.recommendations.estimated_complexity}`}>
                {preview.recommendations.estimated_complexity.toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <div className="error">No se pudo cargar la información de la venta</div>
        )}
        
        <div className="form-group">
          <label>Razón de cancelación:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ingrese el motivo de la cancelación..."
            rows={3}
          />
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            className="btn-danger"
            disabled={!preview?.sale_info.can_be_reverted || !reason.trim()}
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔄 Consideraciones de Estado

### Manejo de Tokens JWT
- Almacenar el token en `localStorage` o `sessionStorage`
- Incluir `session_id` en requests críticos
- Renovar token antes de expiración
- Manejar revocación de sesión automáticamente

### Estados de Sesión
- **ACTIVE**: Sesión válida y activa
- **EXPIRED**: Sesión expirada por tiempo
- **REVOKED**: Sesión revocada manualmente
- **INACTIVE**: Sesión inactiva por tiempo

### Sincronización de Estado
- Verificar estado de sesión en navegación
- Actualizar lista de sesiones activas en tiempo real
- Notificar cambios de estado al usuario

---

Esta guía proporciona toda la información necesaria para integrar correctamente las funcionalidades de ventas, pagos con cálculo de vuelto y gestión de sesiones con logout en el frontend.

## 🔄 **Compatibilidad Backend**

### **Estado de Integración**: ✅ COMPLETADO (Agosto 21, 2025)
- **Cancelación de ventas**: Procedimiento `transactions.revert_sale` mejorado
- **Preview de cancelación**: Función `transactions.preview_sale_reversion`
- **Manejo de errores**: Códigos específicos implementados
- **Endpoints disponibles**: 
  - `GET /sale/{id}/preview-cancellation` ✅
  - `PUT /sale/{id}` (cancelación mejorada) ✅
  - `POST /sale/` (endpoint principal) ✅
  - `POST /sale/with-units` (endpoint extendido) ✅

### **Referencias de Implementación**
- [Resumen de Integración Backend](../LATEST_BACKEND_INTEGRATION_SUMMARY.md)
- [Script de Testing](../../test_latest_integration.sh)

## 🆕 Características Nuevas en esta Versión

### ✅ **Sistema de Reversión Mejorado**
- **Preview de cancelación**: Analiza el impacto antes de cancelar
- **Reversión automática**: Restaura stock, cancela reservas y reembolsa pagos
- **Auditoría completa**: Metadata detallado de todas las operaciones
- **Manejo inteligente**: Diferentes tipos de productos y situaciones

### ✅ **API Unificada de Ventas**
- **Una sola función**: `process_sale_with_reserve` maneja ventas con y sin reserva
- **Optimización**: Elimina redundancia en el código
- **Compatibilidad**: Mantiene la misma interfaz para el frontend

### ✅ **Sistema de Pagos Robusto**
- **Cálculo automático de vuelto**: No requiere cálculos manuales
- **Validaciones completas**: Previene errores de pago
- **Estadísticas avanzadas**: Reportes detallados de vueltos
- **Estados de pago**: Manejo completo del ciclo de vida

### ✅ **Gestión Avanzada de Sesiones**
- **Logout mejorado**: Revoca sesiones en servidor
- **Monitoreo de actividad**: Tracking completo de acciones
- **Sesiones concurrentes**: Control por usuario y rol
- **Seguridad mejorada**: Prevención de sesiones comprometidas

---

## 📚 Recursos Adicionales

- Documentación completa de la base de datos
- Ejemplos de implementación en diferentes frameworks
- Guías de migración para sistemas existentes
- Best practices de seguridad y rendimiento
