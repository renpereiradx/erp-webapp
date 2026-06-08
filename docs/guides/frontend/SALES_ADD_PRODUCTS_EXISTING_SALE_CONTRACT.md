# Add Products to Existing Sale - Frontend Integration Contract

**Version:** 1.0  
**Date:** 22 Mar 2026  
**Audience:** Frontend engineers working on sale editing flows

---

## 1) Why this contract exists

When editing a pending sale, several incidents were detected:

- duplicated lines in UI for the same product
- inflated quantities after saving
- repeated POST calls with full table state instead of only newly added items
- React list key collisions (`saleId-productId` is not unique)

The root cause is usually a mismatch between frontend semantics and backend semantics.

---

## 2) Backend semantics you must respect

Endpoint in scope:

`POST /sale/{id}/products`

This endpoint is **append/increment**, not full replacement.

- It processes the provided `product_details` as products to add to an existing sale.
- It does **not** mean "replace all sale lines with this table".
- For matching lines, backend now merges quantity/totals (increment behavior).
- If no matching line exists, backend inserts a new line.

Important: there is currently no dedicated API in this module for "set exact quantity of an existing detail line" (replace semantics).

---

## 3) Frontend state model (required)

Use separate collections in UI state:

- `existingLines`: lines loaded from backend (already persisted)
- `newLines`: lines newly added by user in current session (not persisted)
- `uiDraft`: visual combination for table rendering only

Do **not** derive POST payload from `uiDraft`.

POST payload must be built from `newLines` only.

---

## 4) Save algorithm for existing sale

For sale already created (`saleId` exists):

1. Validate `newLines.length > 0`.
2. Build payload only from `newLines`.
3. `POST /sale/{id}/products`.
4. On success, clear `newLines`.
5. Immediately refetch sale detail (`GET /sale/{id}` or endpoint used by your screen).
6. Replace local `existingLines` with server response (source of truth).

Never run a second POST from automatic effects triggered by state replacement.

---

## 5) Payload rules (strict)

Only send what user just added in this operation.

Example payload:

```json
{
  "allow_price_modifications": false,
  "product_details": [
    {
      "product_id": "jjEIhMSDg",
      "quantity": 1,
      "tax_rate_id": 1
    }
  ]
}
```

Do not include:

- all rows currently shown in the table
- rows that came from backend before this save
- duplicated `product_id` entries in a single payload unless user explicitly added them as separate logical entries

---

## 6) React rendering keys (mandatory)

Never use `saleId-productId` as row key. It is not unique when a sale has multiple detail lines for the same product.

Use backend detail identifier:

- preferred: `detail.id`
- fallback: `detail.id ?? `${saleId}-${productId}-${unit}-${index}``

If keys collide, React can duplicate/omit rows and trigger incorrect user actions.

---

## 7) UX constraints for quantity editing

Because backend endpoint is add/increment:

- If user edits quantity of a persisted line, that is **not** equivalent to add-products.
- Until a dedicated update-line endpoint exists, recommended UX is:
  - allow quantity edit for `newLines` only
  - persisted lines are read-only quantity in this screen
  - show helper text: "Para cambiar cantidad de una linea existente se requiere flujo de edicion de detalle".

Alternative if product owner requires it now:

- implement a separate "rebuild sale" flow (not this endpoint)
- do not reuse `POST /sale/{id}/products` for replace semantics

---

## 8) Concurrency and double-submit protections

Required guards:

- disable Save button while request is pending (`isSaving`)
- prevent Enter key from retriggering submit during pending state
- ignore stale promise responses if a newer save started
- optional: client-side request id and dedupe map for in-flight operations

---

## 9) Suggested frontend types

```ts
type PersistedSaleLine = {
  id: number;
  product_id: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate_id?: number | null;
};

type NewSaleLine = {
  client_temp_id: string;
  product_id: string;
  quantity: number;
  tax_rate_id?: number | null;
};
```

---

## 10) Minimal implementation checklist

- [ ] POST payload source is `newLines` only
- [ ] Save disabled while request in progress
- [ ] No auto-resubmit from state effects
- [ ] React row key uses `detail.id`
- [ ] Refetch sale after successful POST and replace local persisted state
- [ ] Logging includes `saleId`, payload line count, and server response `products_added`

---

## 11) Observability recommendations

Log these fields in frontend telemetry for each save attempt:

- `sale_id`
- `new_lines_count`
- `payload_product_ids`
- `response.products_added`
- `response.new_total` or `response.final_total`
- `request_started_at`, `request_finished_at`

This allows fast diagnosis when users report "se cargaron de mas".

---

## 12) Known limitation

Current add-products API is not a full line editor. It supports add/increment behavior.
If product requirements include exact line replacement for persisted rows, backend must expose a dedicated detail update endpoint.
