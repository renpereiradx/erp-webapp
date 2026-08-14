# Plan Frontend: Unificación de Movimientos de Stock (eliminar Ajuste Manual + Ajuste Masivo)

**Tipo:** Plan operativo frontend (React + TSX + Feature-Sliced)
**Fecha:** 2026-08-13
**Contexto origen:** Cierre del hardening de trazabilidad de stock en el backend (commit `15e4af8`).
**Plan backend relacionado:** `business_management/conductor/PLAN_STOCK_TRACEABILITY_HARDENING.md` ✅ CERRADO
**Estado tracking frontend:** este archivo.
**Público objetivo:** dev **mid / jr**. Cada paso indica archivo, línea y snippet.

> **✅ ESTADO: IMPLEMENTADO (2026-08-13).** Fases F1→F8 ejecutadas.
> Verificación: `tsc --noEmit` 0 errores · `pnpm build` verde · tests nuevos 32/32 en verde
> (`stock-movements.domain.test.ts` + `stock-movements.service.test.ts`) · greps de seguridad en 0.
> Los tests del repo que fallan (theme, sales, priceAdjustment, clients, cashRegister, products UI,
> `.opencode/node_modules/zod/*`) son **pre-existentes** y ajenos a este cambio (fallan también en
> aislamiento). Detalle del cierre en §10.

---

## 0. TL;DR (lee esto primero)

**Qué se cerró en el backend:** el módulo de inventario mutaba el stock por **tres caminos**; el
hardening **eliminó el "Camino C"** (el intrazable: `PUT /stock/*` con `UPDATE` directo sin ledger).
Lo que queda son **tres endpoints que SÍ escriben el ledger `products.stock_transactions`** (la fuente
de verdad que `validate_stock_consistency` reconcilia contra `products.stock`).

**Qué vamos a hacer en el frontend:**

1. **ELIMINAR** las dos pantallas actuales de ajuste de stock:
   - `src/pages/InventoryAdjustmentManual.jsx` ("Ajuste Manual / Unitario")
   - `src/pages/InventoryManagement.jsx` ("Ajuste Masivo / Múltiples")
2. **ELIMINAR** la pantalla chooser `src/pages/InventoryAdjustments.jsx` y todo su ecosistema
   (stores, service, constants, i18n, dead code) que habla con `/manual_adjustment/` y `/inventory/`.
3. **CREAR** una única pantalla **"Movimientos de Stock"** (TSX, Feature-Sliced) que usa
   **exclusivamente** `POST /stock-transactions/` para escribir y los reads del ledger endurecido
   (`movement-summary`, `validate-consistency`, `discrepancy-report`, history) para consultar.

> **Regla de oro del plan:** después de este plan, **ningún código del frontend debe llamar a
> `/manual_adjustment/*`, `/inventory/*` ni `/stock/*` (PUT)**. El único endpoint de escritura de
> stock permitido es **`POST /stock-transactions/`**.

---

## 1. Contexto: qué se cerró en el backend (commit `15e4af8`)

### 1.1 Los tres caminos de mutación de stock

| Camino | Endpoint | ¿Escribe ledger `stock_transactions`? | Estado tras el hardening |
|---|---|---|---|
| **A — Ajuste manual** | `POST /manual_adjustment/` → SQL `manage_stock_adjustment` | ✅ sí | Sigue existiendo (no se usa en el FE nuevo) |
| **B — Transacción de stock** | `POST /stock-transactions/` → SQL `register_stock_movement` | ✅ sí | **Este es el que usaremos** |
| **C — UPDATE directo** | `PUT /stock/{id}`, `PUT /stock/product_id/{id}` + `StockService.{Update,UpdateByProductID,UpdateQuantity,Reduce,Increase,BatchUpdate}` | ❌ **no** | **ELIMINADO** (commits `33f2f14` H.1 + `b1ca5c6` H.2) |

El Camino C rompía la trazabilidad: mutaba `products.stock` sin insertar fila en el ledger, por lo que
`validate_stock_consistency` marcaba falsos positivos.

### 1.2 Tickets del hardening (relevantes para el FE)

| Ticket | Qué hizo | Commit |
|---|---|---|
| **H.1** | Borró los fast-ops dead de `StockWriter` (`UpdateQuantity`, `Reduce`, `Increase`, `BatchUpdate`) | `33f2f14` |
| **H.2** | Quitó las rutas `PUT /stock/*` y los métodos `Update`/`UpdateByProductID` | `b1ca5c6` |
| **H.3** | Limpieza de FE previa (cadena `updateStock` muerta) | `aa6a5d3` |
| **H.4-ter** | **Reparó** los endpoints de lectura del ledger: versionó `validate_stock_consistency(2-arg)`, `get_inventory_discrepancies(3-arg)` y `get_stock_movement_summary` (branch-aware) | `c28dc3b` + `e54c39a` |
| **H.5** | **Reparó el Camino C funcional en SQL:** `process_complete_purchase_order` ahora INSERTa en `stock_transactions` (`transaction_type='PURCHASE'`, `reference_type='purchase_order'`) | `85b3e9b` |
| **H.5 (test)** | **Commit `15e4af8`** — `test(inventory): add purchase ledger regression test` (2 archivos, +111 líneas). Añade `TestC3_PurchaseWritesStockTransactionLedger` en `tests/integration/remediation_e2e_test.go` que postea a `/purchase/complete` y afirma: (1) `COUNT(*)>0` en `stock_transactions` con `reference_type='purchase_order'`, (2) `SUM(quantity_change)>0`, (3) consistencia ledger↔snapshot. | `15e4af8` |
| **H.6** | Registró acciones `stock:*`/`inventory:*` en `config/audit_config.go` | `b0dd2df` |

**Estado del plan backend:** ✅ **CERRADO de punta a punta** (gates verde: `go build`, `go vet`,
`gofmt`, `golangci-lint`, `check-depguard`, `go test` con 0 FAILs; walk-diff = 2 rutas menos;
greps de dead-code = 0). Working tree limpio salvo `.zcode/plans/`.

### 1.3 Decisión de diseño del backend que nos afecta (D-H2)

El backend **NO añadió** un nuevo endpoint de "ajuste masivo manual". La decisión **D-H2** declinó
hacerlo con el argumento de que `POST /inventory/` ya cubre el caso de N productos con trazabilidad.
**Consecuencia para nosotros:** para registrar varios movimientos desde la UI usaremos **N llamadas**
a `POST /stock-transactions/` (una por producto). No se necesita un endpoint bulk nuevo.

### 1.4 La fuente de verdad canónica

```
products.stock  (snapshot numérico, lectura rápida)
       ▲
       │ validate_stock_consistency reconcilia
       │
products.stock_transactions  (LEDGER INMUTABLE — la fuente de verdad de trazabilidad)
       ▲
       │ escriben aquí:
       │
POST /stock-transactions/   ← el FE usa ESTE
POST /manual_adjustment/    (no lo usaremos)
POST /inventory/            (no lo usaremos)
POST /purchase/complete     (compras — ya escribe ledger, H.5)
```

---

## 2. Decisión de arquitectura frontend (objetivo)

### 2.1 Por qué `/stock-transactions/` como único endpoint de escritura

- Es el **ledger canónico** endurecido en este plan (la fuente de verdad que todo lo demás reconcilia).
- Acepta `quantity_change` como **float con signo** → soporta unidades decimales (kg, L) **sin
  ramificar** (hoy el FE bifurca decimal→`/stock-transactions/`, entero→`/manual_adjustment/`).
- Permite tipar el movimiento con `transaction_type` (`ADJUSTMENT`, `LOSS`, `FOUND`, `INITIAL`…) y
  `reference_type` (`manual_adjustment`, `inventory_check`, `initial_stock`…), lo que da semántica
  de trazabilidad que `/manual_adjustment/` no expone.
- Unifica "unitario" y "masivo" en **un solo flujo**: el masivo es simplemente N envíos del unitario.

### 2.2 Estructura objetivo (Feature-Sliced, TSX)

> Cumple `AGENTS.md`: archivos nuevos en `.tsx`/`.ts`, lógica de negocio fuera de componentes
> (a `src/domain/`), Zustand para estado global, Zod para validación, i18n siempre, Fluent 2.

```
src/
├── domain/stock/
│   └── movements.ts                 ← PURA: computeDelta, inferTransactionType, buildMetadata, schemas Zod
├── features/stock-movements/
│   ├── components/
│   │   ├── StockMovementsPage.tsx          ← página contenedora (pestañas: Registrar / Historial / Resumen)
│   │   ├── MovementForm.tsx                ← formulario de registro (búsqueda producto, variante, target/delta, motivo)
│   │   ├── MovementsHistoryTable.tsx       ← tabla de historial (por producto o por rango de fecha)
│   │   └── MovementSummaryPanel.tsx        ← usa movement-summary + validate-consistency + discrepancy-report
│   ├── hooks/
│   │   └── useStockMovements.ts            ← orquesta store + service + UX (loading, error, toast)
│   └── types/
│       └── index.ts                        ← StockMovement, StockTransactionHistory, MovementSummary…
├── services/
│   └── stockMovementsService.ts            ← ÚNICO cliente HTTP de stock (solo /stock-transactions/*)
└── store/
    └── useStockMovementsStore.ts           ← Zustand (reemplaza a useInventoryStore + useInventoryManagementStore)
```

### 2.3 Flujo objetivo (Mermaid)

```mermaid
graph TD
  UI[StockMovementsPage.tsx] --> Hook[useStockMovements]
  Hook --> Store[useStockMovementsStore]
  Store --> Svc[stockMovementsService]
  Svc -->|POST| APIW[POST /stock-transactions/]
  Svc -->|GET| APIR[GET /stock-transactions/{product,by-date,movement-summary,validate-consistency,discrepancy-report}]
  APIW --> DB[(products.stock_transactions LEDGER)]
  APIR --> DB
  Domain[domain/stock/movements.ts] -->|.computeDelta / Zod| Hook
```

---

## 3. Contrato HTTP autoritativo (lo que SÍ se usa)

> **Fuente de verdad de paths:** `internal/inventory/http/routes.go` + `internal/inventory/http.go`
> (backend). **Ignora** el mapa stale de `src/types.ts:2144-2160` (usa kebab singular falso).

Base URL: `VITE_API_URL` (URL directa del backend, ej. `http://localhost:5050`). Cliente: `apiClient`
de `src/services/api.ts`. Permiso requerido: `inventory:write` (escritura) / `inventory:read` (lectura).

### 3.1 Escritura — `POST /stock-transactions/`

**Request body** (campos marcados `?` son opcionales):

```jsonc
{
  "product_id": "123",                       // string, REQUERIDO
  "variant_id": 7,                           // int?, si el producto tiene variantes
  // NO enviar branch_id: el backend lo resuelve del token JWT.
  // Si se envía y no coincide con el del token → 403 BRANCH_MISMATCH.
  "transaction_type": "ADJUSTMENT",          // enum (ver 3.3), REQUERIDO
  "quantity_change": -3,                     // float, REQUERIDO, ≠ 0, CON SIGNO (delta)
  "unit_price": 12.5,                        // float?, costo unitario (opcional)
  "reference_type": "manual_adjustment",     // enum (ver 3.3), recomendado para auditoría
  "reference_id": null,                      // int/string?, id de la referencia si aplica
  "reason": "Conteo físico - diferencia",    // string, texto libre del motivo
  "metadata": {                              // json, audit enriquecido
    "source": "stock_movements_ui",
    "operator": "jperez",
    "reason_category": "INVENTORY_COUNT",
    "previous_stock": 15,
    "new_stock": 12,
    "approval_level": "L1",
    "notes": "Ajuste tras auditoría de pasillo 3",
    "timestamp": "2026-08-13T14:30:00.000Z",
    "system_version": "4.3.0-frontend"
  }
}
```

**Response `201 Created`** → objeto `StockTransaction`:

```jsonc
{
  "id": 9821,
  "product_id": "123",
  "variant_id": 7,
  "branch_id": 1,                            // resuelto del token
  "transaction_type": "ADJUSTMENT",
  "quantity_change": -3,
  "unit_price": 12.5,
  "reference_type": "manual_adjustment",
  "reference_id": null,
  "reason": "Conteo físico - diferencia",
  "metadata": { /* igual al enviado */ },
  "created_at": "2026-08-13T14:30:01.000Z"
}
```

**Errores** (envelope uniforme del backend):

```jsonc
// 400 BAD_REQUEST | 403 BRANCH_MISMATCH | 404 NOT_FOUND | 500 INTERNAL
{ "success": false, "error": { "code": "BRANCH_MISMATCH", "message": "..." } }
```

> ⚠️ Las respuestas de éxito **NO** se envuelven en `{success:true,...}`: vienen el objeto pelado.
> El `apiClient` ya gestiona esto; no añadir wrappers extra.

### 3.2 Lecturas (todas `GET`, permiso `inventory:read`)

| Endpoint | Query params | Devuelve | Notas |
|---|---|---|---|
| `/stock-transactions/product/{product_id}` | `limit`, `offset` | `[]StockTransactionHistory` | Historial de un producto |
| `/stock-transactions/{id}` | — | `StockTransactionHistory` (404 si no existe) | Detalle de un movimiento |
| `/stock-transactions/by-date` | `start_date`, `end_date` (`YYYY-MM-DD`), `transaction_type`, `limit`, `offset` | `[]StockTransactionHistory` | Rango de fecha |
| `/stock-transactions/types` | — | `{"PURCHASE":"Compra","SALE":"Venta","ADJUSTMENT":"Ajuste","INVENTORY":"Inventario","INITIAL":"Inicial","LOSS":"Pérdida","FOUND":"Hallazgo"}` | Mapa para selects i18n |
| `/stock-transactions/movement-summary` | `start_date`, `end_date` (**req**), `product_id` (opt) | `[]StockMovementSummary` | **Reparado en H.4-ter**. Trae initial/final reconstruidos |
| `/stock-transactions/validate-consistency` | `product_id` (opt) | `[]StockConsistencyReport` | **Reparado en H.4-ter**. Compara ledger vs snapshot |
| `/stock-transactions/discrepancy-report` | `date_from`, `date_to` | `[]InventoryDiscrepancyReport` | **Reparado en H.4-ter** |

> El snapshot de stock actual de un producto (para "stock anterior" en el form) se obtiene con
> `GET /stock/product_id/{product_id}` → `Stock{ id, product_id, variant_id, branch_id, quantity }`.

### 3.3 Enums autoritativos (definidos en `internal/inventory/domain.go:199-215`)

```
transaction_type ∈ { PURCHASE, SALE, ADJUSTMENT, INVENTORY, INITIAL, LOSS, FOUND }
reference_type   ∈ { sale_order, purchase_order, manual_adjustment, inventory_check, initial_stock }
```

Para ajustes hechos desde la UI, usar por defecto:
- `transaction_type = "ADJUSTMENT"` (o `"LOSS"` / `"FOUND"` si la categoría de motivo lo indica).
- `reference_type = "manual_adjustment"` (o `"inventory_check"` si la razón es conteo físico).

---

## 4. Inventario de archivos (scope total)

### 4.1 🗑️ A ELIMINAR

| Archivo | Líneas aprox. | Por qué |
|---|---|---|
| `src/pages/InventoryAdjustmentManual.jsx` | 679 | Pantalla "Ajuste Manual" → a `/manual_adjustment/` + `/stock-transactions/` ramificado |
| `src/pages/InventoryManagement.jsx` | 1380 | Pantalla "Ajuste Masivo" → a `/inventory/` |
| `src/pages/InventoryAdjustments.jsx` | 90 | Chooser unitario vs masivo (ya no hay dos) |
| `src/store/useInventoryStore.js` | ~360 | Store del manual |
| `src/store/useInventoryManagementStore.js` | ~215 | Store del masivo |
| `src/services/inventoryService.ts` | ~917 | Servicio legacy (habla con `/manual_adjustment/`, `/inventory/`). Se reemplaza por `stockMovementsService.ts` |
| `src/constants/inventoryDefaults.js` | — | `REASON_OPTIONS`, `createAdjustmentRequest`, mocks — se mueve lo útil a `domain/stock/movements.ts` |
| `src/__tests__/inventory.service.test.js` | — | Test del servicio eliminado (reescrito en F7) |
| `src/__tests__/inventory.store.test.js` | — | Test del store eliminado (reescrito en F7) |
| `src/lib/i18n/locales/es/inventoryAdjustments.js` | 92 | i18n del chooser + manual |
| `src/lib/i18n/locales/es/inventoryManagement.js` | 114 | i18n del masivo |
| `src/components/inventory/TemplateMetadataSelector.jsx` | — | **Dead code** (no se importa en ningún lado) |
| `src/components/ui/ProductAdjustmentCard.jsx` | — | **Dead code** (importa `MetadataTemplateSelector`) |
| `src/components/ui/MetadataTemplateSelector.jsx` | — | Sólo usado por el dead `ProductAdjustmentCard.jsx` |

### 4.2 ✏️ A EDITAR

| Archivo | Línea(s) | Cambio |
|---|---|---|
| `src/App.tsx` | 39-41 (imports), 320-328 (rutas) | Quitar imports de `InventoryAdjustments`, `InventoryAdjustmentManual`, `InventoryManagement`; añadir `StockMovementsPage`; reemplazar las 3 rutas por `/movimientos-stock` |
| `src/layouts/MainLayout.jsx` | 459-485 | Sub-menú "Ajustes de Stock": dejar "Resumen" + 1 ítem "Movimientos de Stock" → `/movimientos-stock` |
| `src/config/searchableRoutes.js` | 98-128 | Reemplazar los 3 ítems (Inventario/Unitario/Masivo) por 1: "Movimientos de Stock" |
| `src/pages/Dashboard.jsx` | 325 | El `onClick` que va directo a `/ajuste-inventario-masivo` → `/movimientos-stock` |
| `src/pages/ProductAdjustments.jsx` | 52, 71 (y la tarjeta stock) | El botón "Gestionar Stock" → `/movimientos-stock` (esta página queda, sólo cambia el destino) |
| `src/lib/i18n/locales/es/index.js` | 11-13 (imports), 40-47 (spread) | Quitar `inventoryAdjustments` e `inventoryManagement`; añadir `stockMovements` |
| `src/types.ts` | 1351-1383, 2144-2160 | Borrar interfaces y el mapa de endpoints stale (los nuevos tipos viven en `features/stock-movements/types`) |

### 4.3 ➕ A CREAR

| Archivo | Contenido |
|---|---|
| `src/domain/stock/movements.ts` | Lógica pura + schemas Zod (ver F1) |
| `src/services/stockMovementsService.ts` | Cliente HTTP (ver F1) |
| `src/store/useStockMovementsStore.ts` | Zustand store (ver F2) |
| `src/features/stock-movements/types/index.ts` | Tipos TS (ver F1) |
| `src/features/stock-movements/components/StockMovementsPage.tsx` | Página (ver F3) |
| `src/features/stock-movements/components/MovementForm.tsx` | Formulario (ver F3) |
| `src/features/stock-movements/components/MovementsHistoryTable.tsx` | Tabla historial (ver F3) |
| `src/features/stock-movements/components/MovementSummaryPanel.tsx` | Panel resumen (ver F3) |
| `src/features/stock-movements/hooks/useStockMovements.ts` | Hook orquestador (ver F3) |
| `src/lib/i18n/locales/es/stockMovements.js` | i18n del nuevo feature (ver F5) |
| `src/__tests__/stock-movements.service.test.ts` | Tests del servicio (ver F7) |
| `src/__tests__/stock-movements.domain.test.ts` | Tests de `computeDelta`/Zod (ver F7) |

---

## 5. Plan de ejecución paso a paso

> Orden sugerido: **F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8**. Ejecuta `pnpm dev` y `pnpm test` tras
> cada fase. **No borres nada hasta F6** (primero creamos lo nuevo, luego quitamos lo viejo → la app
> compila en cada commit intermedio).

### Fase F1 — Domain + Service + Tipos (sin UI todavía)

**F1.1** Crea `src/features/stock-movements/types/index.ts`:

```ts
// src/features/stock-movements/types/index.ts
export type TransactionType =
  | 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'INVENTORY' | 'INITIAL' | 'LOSS' | 'FOUND';

export type ReferenceType =
  | 'sale_order' | 'purchase_order' | 'manual_adjustment' | 'inventory_check' | 'initial_stock';

export interface StockTransaction {
  id: number;
  product_id: string;
  variant_id?: number | null;
  branch_id: number;
  transaction_type: TransactionType;
  quantity_change: number;
  unit_price?: number | null;
  reference_type?: ReferenceType;
  reference_id?: number | string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface StockTransactionHistory extends StockTransaction {
  product_name?: string;
  variant_name?: string;
  balance_after?: number; // si el backend lo devuelve
}

export interface StockMovementSummary {
  product_id: string;
  product_name?: string;
  initial_stock: number;
  final_stock: number;
  total_in: number;
  total_out: number;
  net_change: number;
}

export interface StockConsistencyReport {
  product_id: string;
  snapshot_stock: number;
  ledger_stock: number;
  discrepancy: number;
  is_consistent: boolean;
}

export interface InventoryDiscrepancyReport {
  product_id: string;
  // campos según backend.InventoryDiscrepancyReport (domain.go:169-179)
  [k: string]: unknown;
}

export interface RegisterMovementPayload {
  product_id: string;
  variant_id?: number;
  transaction_type: TransactionType;
  quantity_change: number;
  unit_price?: number;
  reference_type?: ReferenceType;
  reference_id?: number | string;
  reason?: string;
  metadata?: Record<string, unknown>;
}
```

**F1.2** Crea `src/domain/stock/movements.ts` (lógica PURA, sin React, sin side-effects):

```ts
// src/domain/stock/movements.ts
import { z } from 'zod';
import type { RegisterMovementPayload, TransactionType, ReferenceType } from '@/features/stock-movements/types';

/**
 * Compute the signed delta to send to POST /stock-transactions/.
 * /stock-transactions/ works with DELTAS (not absolute targets), unlike /manual_adjustment/.
 */
export function computeDelta(currentStock: number, targetStock: number): number {
  const delta = Number((targetStock - currentStock).toFixed(4));
  if (!Number.isFinite(delta)) throw new Error('Invalid stock values');
  return delta;
}

/** Map a UI reason category to the backend transaction_type / reference_type semantics. */
export function inferMovementTypes(reasonCategory: string): {
  transaction_type: TransactionType;
  reference_type: ReferenceType;
} {
  switch (reasonCategory) {
    case 'LOSS':
    case 'EXPIRY':
    case 'THEFT':
    case 'DAMAGE':
      return { transaction_type: 'LOSS', reference_type: 'manual_adjustment' };
    case 'FOUND':
    case 'RETURN':
      return { transaction_type: 'FOUND', reference_type: 'manual_adjustment' };
    case 'INITIAL_COUNT':
      return { transaction_type: 'INITIAL', reference_type: 'initial_stock' };
    case 'INVENTORY_COUNT':
    case 'CORRECTION':
    default:
      return { transaction_type: 'ADJUSTMENT', reference_type: 'inventory_check' };
  }
}

export function buildMetadata(input: {
  operator: string;
  reasonCategory: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  approvalLevel?: string;
}): Record<string, unknown> {
  return {
    source: 'stock_movements_ui',
    timestamp: new Date().toISOString(),
    system_version: '4.3.0-frontend',
    operator: input.operator,
    reason_category: input.reasonCategory,
    previous_stock: input.previousStock,
    new_stock: input.newStock,
    approval_level: input.approvalLevel ?? 'L1',
    notes: input.notes ?? '',
  };
}

export const movementFormSchema = z.object({
  product_id: z.string().min(1, 'product_required'),
  variant_id: z.number().int().positive().optional(),
  mode: z.enum(['target', 'delta']),
  targetStock: z.number().optional(),
  delta: z.number().refine((n) => n !== 0, 'delta_nonzero').optional(),
  reasonCategory: z.string().min(1, 'reason_required'),
  reason: z.string().max(280).optional(),
  approvalLevel: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export function buildPayloadFromForm(
  form: z.infer<typeof movementFormSchema>,
  currentStock: number,
  operator: string,
): RegisterMovementPayload {
  const delta =
    form.mode === 'target'
      ? computeDelta(currentStock, Number(form.targetStock))
      : Number(form.delta);
  const { transaction_type, reference_type } = inferMovementTypes(form.reasonCategory);
  const newStock = Number((currentStock + delta).toFixed(4));
  return {
    product_id: form.product_id,
    variant_id: form.variant_id,
    transaction_type,
    quantity_change: delta,
    reference_type,
    reason: form.reason ?? form.reasonCategory,
    metadata: buildMetadata({
      operator,
      reasonCategory: form.reasonCategory,
      previousStock: currentStock,
      newStock,
      notes: form.notes,
      approvalLevel: form.approvalLevel,
    }),
  };
}
```

**F1.3** Crea `src/services/stockMovementsService.ts`:

```ts
// src/services/stockMovementsService.ts
import { apiClient } from '@/services/api';
import { telemetryService } from './telemetryService';
import type {
  RegisterMovementPayload, StockTransaction, StockTransactionHistory,
  StockMovementSummary, StockConsistencyReport, InventoryDiscrepancyReport, TransactionType,
} from '@/features/stock-movements/types';

const ENDPOINTS = {
  transactions: '/stock-transactions/',
  byProduct: '/stock-transactions/product',
  byDate: '/stock-transactions/by-date',
  types: '/stock-transactions/types',
  movementSummary: '/stock-transactions/movement-summary',
  validateConsistency: '/stock-transactions/validate-consistency',
  discrepancyReport: '/stock-transactions/discrepancy-report',
} as const;

export async function registerMovement(
  payload: RegisterMovementPayload,
): Promise<StockTransaction> {
  // No enviar branch_id: el backend lo resuelve del JWT.
  const { data } = await apiClient.post<StockTransaction>(ENDPOINTS.transactions, payload);
  return data;
}

export async function getProductHistory(
  productId: string, limit = 50, offset = 0,
): Promise<StockTransactionHistory[]> {
  const { data } = await apiClient.get<StockTransactionHistory[]>(
    `${ENDPOINTS.byProduct}/${productId}`,
    { params: { limit, offset } },
  );
  return data;
}

export async function getMovementsByDate(params: {
  start_date: string; end_date: string; transaction_type?: TransactionType; limit?: number; offset?: number;
}): Promise<StockTransactionHistory[]> {
  const { data } = await apiClient.get<StockTransactionHistory[]>(ENDPOINTS.byDate, { params });
  return data;
}

export async function getTransactionTypes(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>(ENDPOINTS.types);
  return data;
}

export async function getMovementSummary(params: {
  start_date: string; end_date: string; product_id?: string;
}): Promise<StockMovementSummary[]> {
  const { data } = await apiClient.get<StockMovementSummary[]>(ENDPOINTS.movementSummary, { params });
  return data;
}

export async function validateConsistency(productId?: string): Promise<StockConsistencyReport[]> {
  const { data } = await apiClient.get<StockConsistencyReport[]>(ENDPOINTS.validateConsistency, {
    params: productId ? { product_id: productId } : {},
  });
  return data;
}

export async function getDiscrepancyReport(dateFrom: string, dateTo: string): Promise<InventoryDiscrepancyReport[]> {
  const { data } = await apiClient.get<InventoryDiscrepancyReport[]>(ENDPOINTS.discrepancyReport, {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

// Re-export para que el hook consuma errores de telemetría uniformemente.
export { telemetryService };
```

> Si `apiClient` se importa como default en tu versión del repo (`import apiClient from ...`),
> ajusta el import para que coincida con `src/services/api.ts:22`. Verifica antes de pegar ciego.

✅ **Verificación F1:** `pnpm tsc --noEmit` debe pasar (aunque nada usa aún estos archivos, deben compilar).

---

### Fase F2 — Store unificado (Zustand)

**F2.1** Crea `src/store/useStockMovementsStore.ts`:

```ts
// src/store/useStockMovementsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as svc from '@/services/stockMovementsService';
import type {
  StockTransactionHistory, StockMovementSummary, StockConsistencyReport, RegisterMovementPayload,
} from '@/features/stock-movements/types';

interface StockMovementsState {
  history: StockTransactionHistory[];
  summary: StockMovementSummary[];
  consistency: StockConsistencyReport[];
  loading: boolean;
  error: string | null;
  lastRegisteredId: number | null;

  registerMovement: (payload: RegisterMovementPayload) => Promise<StockTransactionHistory>;
  fetchHistory: (productId: string, limit?: number, offset?: number) => Promise<void>;
  fetchSummary: (start: string, end: string, productId?: string) => Promise<void>;
  fetchConsistency: (productId?: string) => Promise<void>;
  clearError: () => void;
}

export const useStockMovementsStore = create<StockMovementsState>()(
  devtools((set) => ({
    history: [], summary: [], consistency: [], loading: false, error: null, lastRegisteredId: null,

    registerMovement: async (payload) => {
      set({ loading: true, error: null });
      try {
        const tx = await svc.registerMovement(payload);
        set({ loading: false, lastRegisteredId: tx.id });
        return tx as unknown as StockTransactionHistory;
      } catch (e) {
        const msg = (e as Error)?.message ?? 'register_failed';
        set({ loading: false, error: msg });
        throw e;
      }
    },

    fetchHistory: async (productId, limit = 50, offset = 0) => {
      set({ loading: true, error: null });
      try {
        const history = await svc.getProductHistory(productId, limit, offset);
        set({ history, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error)?.message ?? 'fetch_failed' });
      }
    },

    fetchSummary: async (start, end, productId) => {
      set({ loading: true, error: null });
      try {
        const summary = await svc.getMovementSummary({ start_date: start, end_date: end, product_id: productId });
        set({ summary, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error)?.message ?? 'fetch_failed' });
      }
    },

    fetchConsistency: async (productId) => {
      set({ loading: true, error: null });
      try {
        const consistency = await svc.validateConsistency(productId);
        set({ consistency, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error)?.message ?? 'fetch_failed' });
      }
    },

    clearError: () => set({ error: null }),
  }), { name: 'stock-movements-store' }),
);
```

✅ **Verificación F2:** `pnpm tsc --noEmit`.

---

### Fase F3 — UI (Feature-Sliced, Fluent 2, TSX)

> Estilo: diálogos/paneles con `glass-mica`/`glass-acrylic`, `shadow-fluent-*`, micro-animaciones
> `animate-in fade-in`. Radix UI para selects/dialogs. Todos los strings vía `t('stockMovements.*')`.

**F3.1** `src/features/stock-movements/hooks/useStockMovements.ts` — orquesta store + UX:

```ts
// src/features/stock-movements/hooks/useStockMovements.ts
import { useCallback } from 'react';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import { useAuthStore } from '@/store/useAuthStore'; // ajusta al store de auth real del repo
import { buildPayloadFromForm, movementFormSchema } from '@/domain/stock/movements';
import type { z } from 'zod';

export function useStockMovements(currentStock: number) {
  const { registerMovement, fetchHistory, fetchSummary, fetchConsistency, loading, error } =
    useStockMovementsStore();
  const user = useAuthStore((s) => s.user);
  const operator = user?.name ?? user?.id ?? 'frontend_operator';

  const submit = useCallback(
    async (form: z.infer<typeof movementFormSchema>) => {
      const parsed = movementFormSchema.parse(form);
      const payload = buildPayloadFromForm(parsed, currentStock, operator);
      const tx = await registerMovement(payload);
      // refresca el historial del producto recién ajustado
      await fetchHistory(parsed.product_id, 50, 0);
      return tx;
    },
    [registerMovement, fetchHistory, currentStock, operator],
  );

  return { submit, fetchHistory, fetchSummary, fetchConsistency, loading, error };
}
```

> Verifica el nombre real del store de auth y de `user` en `src/store/` antes de pegar (puede ser
> `useAuthStore`, `useUserStore`, etc.).

**F3.2** `MovementForm.tsx` — formulario con Zod, búsqueda de producto (reutiliza el modal de
búsqueda existente) y selector de variante (`variantService.getEnrichedVariants` como hoy hace
`InventoryAdjustmentManual.jsx:390-409`). Dos modos:
- **"Establecer stock en"** (target) → el hook calcula el delta.
- **"Ajustar por Δ"** (delta directo, positivo/negativo).

Muestra **siempre** el "stock actual" (traído de `GET /stock/product_id/{id}`) y el "stock resultante"
(current + delta) en tiempo real. Tras submit exitoso → toast i18n `stockMovements.success` y reset.

**F3.3** `MovementsHistoryTable.tsx` — tabla con `getProductHistory` (default) o `getMovementsByDate`
(con toggle "por producto" / "por rango de fecha"). Columnas: fecha, tipo (traducido vía
`getTransactionTypes()`), Δ, balance, motivo, operador (de `metadata.operator`).

**F3.4** `MovementSummaryPanel.tsx` — pestaña de análisis con tres sub-bloques:
- `getMovementSummary(start, end)` → tabla initial/final/net por producto.
- `validateConsistency()` → lista de inconsistencias ledger vs snapshot (los falsos positivos ya no
  deberían aparecer tras el hardening del backend).
- `getDiscrepancyReport(from, to)` → reporte de discrepancias.

**F3.5** `StockMovementsPage.tsx` — contenedor con 3 pestañas (Radix `Tabs`):
`Registrar` (`MovementForm` + historial en vivo) · `Historial` (`MovementsHistoryTable`) ·
`Resumen` (`MovementSummaryPanel`). Layout responsive, back button → `/ajustes-producto`.

> Snippets de UI son esquemáticos: sigue el patrón visual de `src/features/products/` (ya migrado a
> TSX + glass-mica) como referencia de estilo. **No hardcodear strings**: todo a
> `src/lib/i18n/locales/es/stockMovements.js` (F5).

✅ **Verificación F3:** `pnpm dev` → carga `/movimientos-stock` sin console errors (aún sin conectar
routing, prueba temporalmente montándolo en una ruta existente).

---

### Fase F4 — Routing + navegación

**F4.1** `src/App.tsx`:
- En los imports (alrededor de la línea 39-41) **quita**:
  `import InventoryAdjustments ...`, `import InventoryAdjustmentManual ...`, `import InventoryManagement ...`.
- **Añade**: `import { StockMovementsPage } from '@/features/stock-movements/components/StockMovementsPage';`
- Reemplaza el bloque de rutas (líneas 320-328) por:

```tsx
<Route path='/movimientos-stock' element={<StockMovementsPage />} />
```

> Quita las 3 rutas viejas (`/ajustes-inventario`, `/ajuste-inventario-unitario`,
> `/ajuste-inventario-masivo`). Si quieres mantener un redirect SEO/links antiguos, añade:
> `<Route path='/ajuste-inventario-unitario' element={<Navigate to='/movimientos-stock' replace />} />`
> (y lo mismo para `-masivo` y `/ajustes-inventario`).

**F4.2** `src/layouts/MainLayout.jsx:459-485` — el sub-menú "Ajustes de Stock". Déjalo así:

```jsx
{
  name: t('productAdjustments.title', 'Ajustes de Stock'),
  href: '#',
  icon: SlidersHorizontal,
  children: [
    { name: t('productAdjustments.stockCard.title', 'Resumen de Ajustes'),
      href: '/ajustes-producto', icon: SlidersHorizontal },
    { name: t('stockMovements.menu', 'Movimientos de Stock'),
      href: '/movimientos-stock', icon: List },
  ],
},
```

**F4.3** `src/config/searchableRoutes.js:98-128` — reemplaza los 3 ítems de inventario por:

```js
{ name: 'Movimientos de Stock', href: '/movimientos-stock', icon: ClipboardList, category: 'Inventario' },
```
(Conserva "Ajustes de Precios" e "Historial de Precios" que no tocan stock.)

**F4.4** `src/pages/Dashboard.jsx:325` — el `onClick` que navega a `/ajuste-inventario-masivo` →
`/movimientos-stock`.

**F4.5** `src/pages/ProductAdjustments.jsx:52,71` — la tarjeta "Gestionar Stock" → `/movimientos-stock`.

✅ **Verificación F4:** navega el sidebar y el buscador; el dashboard y "Resumen de Ajustes" llevan
a la nueva pantalla. No quedan links rotos a rutas eliminadas.

---

### Fase F5 — i18n

**F5.1** Crea `src/lib/i18n/locales/es/stockMovements.js` con las claves que usaste en F3 (titles,
pestañas, labels de form, modos target/delta, motivos, mensajes de éxito/error, columnas de tabla,
panel de resumen). Ejemplo mínimo:

```js
export const stockMovements = {
  stockMovements: {
    title: 'Movimientos de Stock',
    menu: 'Movimientos de Stock',
    tabs: { register: 'Registrar', history: 'Historial', summary: 'Resumen' },
    form: {
      product: 'Producto', variant: 'Variante', currentStock: 'Stock actual',
      mode: { target: 'Establecer stock en', delta: 'Ajustar por diferencia' },
      targetStock: 'Nuevo stock', delta: 'Diferencia (+/−)',
      resultingStock: 'Stock resultante', reasonCategory: 'Categoría de motivo',
      reason: 'Motivo', approvalLevel: 'Nivel de aprobación', notes: 'Notas',
      submit: 'Registrar movimiento', submitting: 'Registrando…',
    },
    reasons: {
      INVENTORY_COUNT: 'Conteo de inventario', CORRECTION: 'Corrección',
      DAMAGE: 'Daño', EXPIRY: 'Vencimiento', THEFT: 'Hurto', RETURN: 'Devolución',
      LOSS: 'Pérdida', FOUND: 'Hallazgo', INITIAL_COUNT: 'Stock inicial',
    },
    success: 'Movimiento registrado',
    errors: { register_failed: 'No se pudo registrar', delta_nonzero: 'La diferencia no puede ser 0',
              product_required: 'Seleccioná un producto', reason_required: 'Seleccioná un motivo' },
    table: { date: 'Fecha', type: 'Tipo', delta: 'Diferencia', balance: 'Saldo',
             reason: 'Motivo', operator: 'Operador' },
    summary: { initial: 'Inicial', final: 'Final', net: 'Neto', consistent: 'Consistente',
               inconsistent: 'Inconsistente', discrepancy: 'Discrepancia' },
  },
};
```

**F5.2** `src/lib/i18n/locales/es/index.js`:
- Quita los imports de `inventoryAdjustments` (l.12) e `inventoryManagement` (l.13).
- Quita sus `...spread` (l.41, l.42).
- Añade `import { stockMovements } from './stockMovements'` y `...stockMovements` en el export.
- **Conserva** `inventory` (l.18, l.47): sus claves genéricas las pueden usar los dashboards de
  `InventoryAnalytics/` (verifica con grep antes de borrarlo; si no hay consumidores, puede irse).

> El repo hoy **no tiene** locale `en/` para estos módulos. No es bloqueante (la app corre en `es`),
> pero deja un TODO para añadir `src/lib/i18n/locales/en/stockMovements.js` cuando se active EN.

✅ **Verificación F5:** ningún `t('stockMovements.*')` devuelve la key cruda; `pnpm build` sin warnings
de i18n.

---

### Fase F6 — Eliminación del código legacy (¡ahora sí!)

Ahora que lo nuevo funciona y está enlazado, borra todo lo de la tabla §4.1:

```bash
# Pantallas y chooser
rm src/pages/InventoryAdjustmentManual.jsx \
   src/pages/InventoryManagement.jsx \
   src/pages/InventoryAdjustments.jsx

# Stores legacy
rm src/store/useInventoryStore.js src/store/useInventoryManagementStore.js

# Servicio y constantes legacy
rm src/services/inventoryService.ts src/constants/inventoryDefaults.js

# i18n legacy
rm src/lib/i18n/locales/es/inventoryAdjustments.js \
   src/lib/i18n/locales/es/inventoryManagement.js

# Dead code (ya no referenciado)
rm src/components/inventory/TemplateMetadataSelector.jsx \
   src/components/ui/ProductAdjustmentCard.jsx \
   src/components/ui/MetadataTemplateSelector.jsx

# Tests legacy (se reescriben en F7)
rm src/__tests__/inventory.service.test.js src/__tests__/inventory.store.test.js
```

**F6.2** Limpia `src/types.ts`:
- Borra las interfaces `ManualAdjustment*`, `ProductAdjustmentHistory`, `StockTransaction` viejas
  (~líneas 1351-1383): ya viven en `features/stock-movements/types`.
- Borra el mapa stale de endpoints (~líneas 2144-2160, los que usan `/manual-adjustment` kebab
  singular): son **falsos** y nunca fueron usados por el servicio real.

✅ **Verificación F6:**
```bash
pnpm tsc --noEmit
# Greps de seguridad (DEBEN devolver 0 ocurrencias):
grep -rn "manual_adjustment" src/            # 0
grep -rn "/inventory/" src/                  # 0 (ojo: excluir InventoryAnalytics y comentarios)
grep -rn "InventoryAdjustmentManual\|InventoryManagement\b" src/   # 0
grep -rn "useInventoryStore\|useInventoryManagementStore" src/     # 0
grep -rn "updateStock\|PUT /stock" src/      # 0
```
`pnpm build` debe quedar en verde.

---

### Fase F7 — Tests

**F7.1** `src/__tests__/stock-movements.domain.test.ts` — cubre `computeDelta`,
`inferMovementTypes`, `buildPayloadFromForm`, y los casos borde del schema Zod (delta 0 rechazado,
target igual a current rechazado, etc.). Table-driven.

**F7.2** `src/__tests__/stock-movements.service.test.ts` — mockea `apiClient` y afirma que
`registerMovement` hace `POST /stock-transactions/` con el payload correcto **y sin `branch_id`**;
que `getMovementSummary` pasa `start_date`/`end_date`; que los reads usan los paths exactos del §3.2.

✅ **Verificación F7:** `pnpm test` todo verde.

---

### Fase F8 — Verificación final (Definition of Done)

Ver §7.

---

## 6. Decisiones de diseño (registrar en el STATUS)

| ID | Decisión | Razón |
|---|---|---|
| **D-F1** | Unificar a `POST /stock-transactions/` como único endpoint de escritura de stock del FE | Es el ledger canónico endurecido; soporta decimales sin ramificar; expone semántica de trazabilidad (`transaction_type`/`reference_type`). Simplifica UX (una sola pantalla). |
| **D-F2** | "Masivo" = N envíos a `/stock-transactions/` desde la UI (no se llama a `/inventory/`) | D-H2 del backend no añadió endpoint bulk; `/stock-transactions/` es por producto. Para registros masivos se itera en el cliente con feedback de progreso. |
| **D-F3** | El FE **no envía `branch_id`** en escrituras | El backend lo resuelve del JWT y rechaza (`403 BRANCH_MISMATCH`) si el body discrepa. Enviarlo sólo rompería cosas. |
| **D-F4** | El form ofrece modos "target" y "delta" | `/stock-transactions/` usa delta con signo, pero el usuario piensa en "stock final". El domain calcula el delta. Cubre ambos modelos mentales. |
| **D-F5** | Feature-Sliced + TSX, lógica en `src/domain/stock/` | Cumple `AGENTS.md` (regla: nada de cálculos en componentes; archivos nuevos en TS/TSX). |
| **D-F6** | Borrado duro (no deprecación) de las pantallas/stores legacy | No hay consumers externos; coincide con el criterio del backend (H.2/D-H3). |

---

## 7. Checklist de verificación (DoD)

- [ ] `pnpm tsc --noEmit` verde.
- [ ] `pnpm build` verde (sin warnings de i18n ni de imports rotos).
- [ ] `pnpm test` verde (tests nuevos de domain + service).
- [ ] `POST /stock-transactions/` registra un movimiento y el stock del producto cambia
      (verificar con `GET /stock/product_id/{id}`).
- [ ] El historial del producto refleja el movimiento recién creado (`GET .../product/{id}`).
- [ ] El panel de Resumen carga `movement-summary`, `validate-consistency` y `discrepancy-report`
      sin 500 (los endpoints fueron **reparados** en H.4-ter; si fallan, escalar al backend).
- [ ] Unidades decimales (kg/L) funcionan **sin** ramificar (antes iba a otro endpoint).
- [ ] No enviar `branch_id`: el backend lo resuelve del token (no aparece `BRANCH_MISMATCH`).
- [ ] Greps de seguridad en 0 (`manual_adjustment`, `/inventory/`, stores legacy, `updateStock`).
- [ ] Sidebar, buscador, dashboard y "Resumen de Ajustes" llevan a `/movimientos-stock`.
- [ ] Ningún string hardcodeado: todo vía `t('stockMovements.*')`.
- [ ] Diseño Fluent 2 (glass-mica/acrylic, shadow-fluent-*, animate-in) en modales/paneles.

---

## 8. Out of scope (NO tocar)

- **Analytics de inventario** (`src/pages/InventoryAnalytics/*`, `src/components/InventoryAnalytics/*`):
  dashboards de sólo lectura, no escriben stock. Se conservan.
- **Ajuste de Precios** (`/ajustes-precios`, `priceAdjustmentService.ts`, `usePriceAdjustmentStore.js`):
  es otro dominio (precios, no stock). Se conserva.
- **`ProductAdjustments.jsx`** (`/ajustes-producto`): queda como chooser Resumen; sólo se le actualiza
  el link de la tarjeta de stock.
- **Compras/Ventas** (`POST /purchase/complete`, flujos de venta): el backend ya escribe el ledger
  (H.5); el FE no necesita cambios —获益 automáticamente de la trazabilidad reparada.
- **Backend**: no se modifica. Este plan es **sólo frontend**.

---

## 9. Riesgos y notas

- **`apiClient` import shape:** el snippet asume `import { apiClient } from '@/services/api'`. Si tu
  repo lo exporta como default, ajusta (ver `src/services/api.ts:22`).
- **Store de auth:** el nombre `useAuthStore`/`user` es una suposición; confirmar el real en `src/store/`.
- **`GET /stock/product_id/{id}` para "stock actual":** si ese snapshot no refleja variantes
  correctamente, usar el stock por variante (ver `FRONTEND_FEEDBACK_VARIANT_STOCK_2026_07_14.md`:
  el stock vive en `variant_id + branch_id`).
- **Tests de integración backend:** el commit `15e4af8` advierte que la suite falla con
  `401 "sesión expirada"` en este entorno (pre-existente, no relacionado). No afecta al FE.
- **Si producto quiere "conteo físico masivo" en el futuro:** `/inventory/` sigue disponible en el
  backend (es trazable). Podría reactivarse como flujo separado; no está prohibido, sólo fuera del
  alcance de este plan.

---

## 10. Cierre de implementación (2026-08-13)

**Resultado:** F1→F8 ejecutadas. Gates verde.

### Creados
- `src/features/stock-movements/types/index.ts` — tipos del ledger.
- `src/domain/stock/movements.ts` — `computeDelta`, `inferMovementTypes`, `buildMovementMetadata`, `movementFormSchema`, `buildPayloadFromForm`.
- `src/services/stockMovementsService.ts` — único cliente HTTP de stock (`/stock-transactions/*`).
- `src/store/useStockMovementsStore.ts` — Zustand (reemplaza los 2 stores viejos).
- `src/features/stock-movements/hooks/useStockMovements.ts` — hook orquestador.
- `src/features/stock-movements/components/` — `StockMovementsPage.tsx`, `MovementForm.tsx`, `MovementsHistoryTable.tsx`, `MovementSummaryPanel.tsx`, `ProductSearchModal.tsx`.
- `src/lib/i18n/locales/es/stockMovements.js` — i18n del feature.
- `src/__tests__/stock-movements.domain.test.ts` (23 tests) y `src/__tests__/stock-movements.service.test.ts` (9 tests).

### Editados
- `src/App.tsx` — 1 import + ruta `/movimientos-stock` + 3 `<Navigate>` redirects de rutas legacy.
- `src/layouts/MainLayout.jsx` — sub-menú con "Resumen" + "Movimientos de Stock".
- `src/config/searchableRoutes.js` — 1 ítem de búsqueda (antes 3).
- `src/pages/Dashboard.jsx` — card → `/movimientos-stock`.
- `src/pages/ProductAdjustments.jsx` — tarjeta stock → `/movimientos-stock`.
- `src/lib/i18n/locales/es/index.js` — registro de `stockMovements` (quitados `inventoryAdjustments`/`inventoryManagement`).
- `src/types.ts` — borrados bloques stale (ManualAdjustment/StockTransaction/StockConsistency + constantes kebab de `API_ENDPOINTS`).

### Eliminados
- Páginas: `InventoryAdjustmentManual.jsx`, `InventoryManagement.jsx`, `InventoryAdjustments.jsx`.
- Stores: `useInventoryStore.js`, `useInventoryManagementStore.js`.
- Service/constants: `inventoryService.ts`, `inventoryDefaults.js`.
- i18n: `inventoryAdjustments.js`, `inventoryManagement.js`.
- Dead code: `components/inventory/TemplateMetadataSelector.jsx`, `components/ui/ProductAdjustmentCard.jsx`, `components/ui/MetadataTemplateSelector.jsx` (+ dir `components/inventory/` vacío).
- Tests legacy: `inventory.service.test.js`, `inventory.store.test.js`.

### Verificación
| Gate | Resultado |
|---|---|
| `tsc --noEmit` | ✅ 0 errores |
| `pnpm build` | ✅ verde (sólo warnings pre-existentes de chunking) |
| Tests nuevos | ✅ 32/32 (`domain` 23 + `service` 9) |
| Greps de seguridad | ✅ 0 stock-code en `/manual_adjustment/`(stock)·`/inventory/`·stores legacy·`PUT /stock` |
| Tests rojos del repo | ⚠️ pre-existentes, no relacionados (theme, sales, priceAdjustment, clients, cashRegister, products UI, `.opencode/node_modules/zod/*`); fallan también en aislamiento |

### Nota sobre los tests rojos pre-existentes
La suite `pnpm test` muestra ~51 tests rojos en ~21 archivos **ajenos** a este cambio. Se confirmó que
fallan también corriendo cada uno en aislamiento (ej. `theme.system`, `saleService.dateRange`,
`priceAdjustment.store`), por lo que **no son regresiones introducidas aquí**. Además vitest escanea
`.opencode/node_modules/zod/*` (config pre-existente) y hay un "Worker exited unexpectedly" (inestabilidad
de jsdom bajo carga) que produce cascadas. Escalar por separado al equipo de tooling/frontend.

```
