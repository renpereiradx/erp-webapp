# Hallazgos de integración — Módulo Presupuestos (budget) para el dev de backend

**Fecha:** 2026-08-17
**Origen:** Verificación del contrato FE ↔ backend tras `feat/iva-consistency` (commit `1d9efd5`, backend).
**Autor:** Frontend (`feat/iva-consistency-frontend`, `erp-webapp`)
**Alcance:** Solo hallazgos que bloquean o desalinean el módulo de presupuestos. Verificados contra el código
en `business_management` (rama `feat/iva-consistency`) — no contra runtime.

---

## Resumen

| # | Hallazgo | Severidad | Archivos |
|:--|:---------|:----------|:---------|
| H1 | `create_budget_order` llamado con 11 args contra firma de 9 (orden transpuesto) | 🔴 Bloqueante | `internal/platform/postgres/budget_repo.go` |
| H2 | URL del FE `/budget` (singular) vs backend `/budgets` (plural) + sufijo `convert-to-sale` vs `convert` | 🔴 Bloqueante | `src/types.ts` (FE) vs `internal/sale/http/routes.go` |
| H3 | Shape del request: FE plano `{client_id, valid_until, notes, items}` vs handler anidado `{budget, details}` | 🔴 Bloqueante | `src/pages/BudgetCreate.tsx` / `budgetService.ts` (FE) vs `internal/sale/http_budget.go` |
| N1 | `GET /sale/{id}` no devuelve `tax_amount` a nivel venta (solo por línea) | 🟡 Informativo | `database/postgres/sale.go` |

H1 ya estaba anotado como "Riesgo 2" en `conductor/PLAN_IVA_DISENO_ANALISIS_STATUS.md`; este documento
confirma y detalla la transposición exacta.

---

## H1 — `create_budget_order` con 11 args contra firma de 9 → `POST /budgets` falla

### Problema

El repo hexagonal llama la función SQL con 11 argumentos y **en orden distinto al de la firma**.

### Evidencia

Caller Go — `internal/platform/postgres/budget_repo.go:46-52`:

```go
_, err := r.exec(ctx,
    `SELECT transactions.create_budget_order($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    budget.ID, budget.ClientID, budget.UserID, details, budget.PaymentMethodID,
    budget.CurrencyID, budget.ValidUntil, budget.Notes, budget.Metadata, false, branchID)
```

Firma SQL — migración `20260817134301_fix_sale_tax_liquidation_consistency.up.sql` (línea ~1304, 9 params):

```sql
CREATE OR REPLACE PROCEDURE transactions.create_budget_order(
    IN p_budget_id character varying,
    IN p_client_id character varying,
    IN p_valid_until timestamp without time zone,
    IN p_id_user character varying,
    IN p_budget_details jsonb,
    IN p_payment_method_id integer DEFAULT NULL,
    IN p_currency_id integer DEFAULT NULL,
    IN p_notes text DEFAULT NULL,
    IN p_branch_id integer DEFAULT NULL)
```

### Impacto

1. **Aridad**: 11 args para 9 parámetros → Postgres rechaza la llamada.
2. **Orden transpuesto** (aun corrigiendo la aridad): el caller manda `budget.UserID` (varchar) en la
   posición de `p_valid_until` (timestamp) y `details` (jsonb) en la posición de `p_id_user` → error de
   tipos. `Metadata` y `false` no existen en la firma.
3. Consecuencia: el flujo completo de creación de presupuesto desde el FE falla en el backend.

### Fix sugerido

Llamada con 9 args en el orden de la firma:

```go
_, err := r.exec(ctx,
    `SELECT transactions.create_budget_order($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    budget.ID, budget.ClientID, budget.ValidUntil, budget.UserID, details,
    budget.PaymentMethodID, budget.CurrencyID, budget.Notes, branchID)
```

Notas:
- `budget.ValidUntil` es `*time.Time` (nil → NULL, aceptable para `timestamp`).
- `budget.UserID` lo puebla `BudgetService.Create` (`internal/sale/budget_service.go:26`) desde el claim JWT.
- `budget.Metadata` no tiene parámetro en la firma; si hace falta persistirlo, iría dentro del JSONB de `details` o en una columna/metadata nueva (requiere migración).

---

## H2 — URL del FE no coincide con el backend (404 en todo el módulo)

### Problema

El FE apunta a `/budget` (singular) y a `/budget/{id}/convert-to-sale`; el backend registra `/budgets`
(plural) y `/budgets/{id}/convert`.

### Evidencia

Backend — `internal/sale/http/routes.go:121-131`:

```go
budget := r.PathPrefix("/budgets").Subrouter()
budget.HandleFunc("", sale.MakeCreateBudgetHandler(...)).Methods(http.MethodPost)
budget.HandleFunc("", sale.MakeListBudgetsHandler(...)).Methods(http.MethodGet)
budget.HandleFunc("/client/{client_id}", ...)
budget.HandleFunc("/status/{status}", ...)
budget.HandleFunc("/mark-expired", ...)
budget.HandleFunc("/{id}", ...).Methods(http.MethodGet)
budget.HandleFunc("/{id}/status", ...).Methods(http.MethodPut)
budget.HandleFunc("/{id}/convert", ...).Methods(http.MethodPost)
```

FE — `src/types.ts:2074-2078`:

```ts
BUDGETS: '/budget',
BUDGET_BY_ID: (id) => `/budget/${id}`,
BUDGET_STATUS: (id) => `/budget/${id}/status`,
BUDGET_BY_CLIENT: (clientId) => `/budget/client/${clientId}`,
BUDGET_CONVERT_TO_SALE: (id) => `/budget/${id}/convert-to-sale`,
```

Verificado: no existe ninguna ruta legacy `/budget` en el backend (`grep '"/budget'` en Go: vacío).

### Impacto

- `GET /budget` → 404 (listar presupuestos).
- `GET /budget/{id}` → 404 (detalle).
- `PUT /budget/{id}/status` → 404.
- `POST /budget/{id}/convert-to-sale` → 404, **además** el sufijo difiere (`convert-to-sale` vs `convert`).

### Decisión necesaria

Alinear el FE a `/budgets` (recomendado: es el contrato canónico) o registrar alias `/budget` en el backend.
Si se elige FE: `BUDGETS: '/budgets'`, `BUDGET_BY_ID: '/budgets/${id}'`, `BUDGET_STATUS: '/budgets/${id}/status'`,
`BUDGET_BY_CLIENT: '/budgets/client/${clientId}'`, `BUDGET_CONVERT_TO_SALE: '/budgets/${id}/convert'`.
(Puede hacerse en el mismo diff que H3, dado que ambos tocan `budgetService.ts`.)

---

## H3 — Shape del request de creación: FE plano vs handler anidado

### Problema

El FE envía el presupuesto en forma plana; el handler del backend espera `{budget: {...}, details: [...]}`.

### Evidencia

FE — `src/pages/BudgetCreate.tsx:126-135` construye:

```ts
const request: CreateBudgetRequest = {
  client_id: selectedClient.id,
  valid_until: validUntil,
  notes,
  items: items.map(i => ({ product_id, quantity, unit_price }))
};
```

`CreateBudgetRequest` — `src/types.ts:1762-1771`.

Backend — `internal/sale/http_budget.go:16-24`:

```go
var req struct {
    Budget  BudgetOrder     `json:"budget"`
    Details json.RawMessage `json:"details"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil { ... }
budget, err := svc.Create(r.Context(), &req.Budget, req.Details, claims.UserID, branchID)
```

El dominio `BudgetOrder` (`internal/sale/domain.go:739`) no tiene `items`; las líneas van en `details`
(jsonb que consume `create_budget_order` con `product_id`, `quantity`, `unit_price`, etc.).

### Impacto

- `req.Budget` queda en zero-values (`client_id` vacío) y `req.Details` en `null` → el backend rechaza
  ("Cliente ... no existe") o crea un presupuesto vacío/basura. Incluso con H1 y H2 corregidos, el shape
  no matchea.

### Decisión necesaria

Opción A (FE se alinea al contrato del handler): `budgetService.createBudget` manda
`{ budget: { client_id, valid_until, notes, currency_id }, details: items }`.
Opción B (backend acepta el shape plano y arma `BudgetOrder` + `details` en el handler).

---

## N1 — `GET /sale/{id}` no devuelve `tax_amount` a nivel venta (informativo)

### Evidencia

`database/postgres/sale.go:77-82` (header de `GetSaleById`) selecciona `total_amount` pero no
`tax_amount`; el desglose de IVA solo viene por línea (líneas 93-99: `tax_amount`, `applied_tax_rate`,
`unit_price_with/without_tax`, `total_with_tax`).

### Estado

El FE ya lo absorbe: `SalesOrderDetail` suma los snapshots por línea para el resumen
(commit `e663293` de `feat/iva-consistency-frontend`). No requiere cambio de backend; queda como nota
por si algún día el header quisiera exponer `SUM(details.tax_amount)` para consumidores de reportes.

---

## Pendientes menores observados (sin bloqueo)

- El FE no usa `POST /budgets/mark-expired` (existe en backend, sin consumidor FE).
- `BudgetItem.tax_rate_id` en el tipo FE (`src/types.ts:1756`) es `number` obligatorio; el backend puede
  devolverlo resuelto por jerarquía — si se va a mostrar en el detalle, verificar que venga poblado.
