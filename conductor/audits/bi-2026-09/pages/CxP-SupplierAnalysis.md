# CxP — Análisis de Proveedor (`/payables/suppliers/:id/analysis`)

**Fecha**: 2026-09-16 · FASE 2A · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2). **Ruta huérfana**: no está en el sidebar; se llega desde fichas de proveedor.

**Archivo**: `src/pages/SupplierAnalysis.jsx` + `src/features/accounts-payable/hooks/useSupplierAnalysis.js` + componentes `features/accounts-payable/components/SupplierAnalysis/*` · **Service**: `payablesService.getSupplierAnalysis` ✅ existe → `GET /payables/supplier/{id}/analysis`

## 1. Screenshot

- `../screenshots/payables/supplier-analysis-admin.png` — **página 100% en blanco** (sidebar + main vacío), probada con proveedor real `SP___________________________2` (Protek PRO).

## 2. Trazabilidad card → endpoint

La API responde **200 con datos reales**: `supplier_name: "Protek PRO"`, `total_pending: 500.000`, `total_overdue: 500.000`, `payment_history: "EXCELLENT"`, `avg_days_to_pay: 14.75`, `share_percentage: 8.31`, `importance: "MEDIUM"`, `credit_terms: 30`, `oldest_debt`.

| Causa | Detalle |
|:--|:--|
| **Drift de contrato** | `useSupplierAnalysis.js:20` destructura `const { stats, report, invoices } = response.data` — el payload real es **plano** (sin `stats`/`report`/`invoices`). `invoices[0]` lanza TypeError inmediato. |
| **Error invisible** | El catch setea `error`, pero `SupplierAnalysis.jsx` **nunca lo lee**: `if (loading) …; if (!supplier) return null` → **página en blanco permanente**, sin loading ni error. |
| Ironía | La API devuelve exactamente los campos que la UI necesita (share_percentage ≈ "shareOfPayables", credit_terms ≈ "terms", payment_history ≈ "rating") y el FE los ignora para fabricarlos (abajo). |

## 3. Comprensión de usuario

- ❌ Blank page = el peor estado posible: el usuario no sabe si cargó, rompió o no existe.
- (No evaluable el resto: nada renderiza.)

## 4. Afordancias probadas (runtime)

- N/A — no hay DOM de la página (return null). Los botones de los componentes (`SupplierHeader`, `DebtKpis`, `AnalysisCards`, `ActiveObligationsTable`, `DebtTrendChart`) quedan para re-auditar post-fix.

## 5. Hardcode scan (en el hook — se ejecutaría si el shape coincidiera)

| Fabricación | Evidencia |
|:--|:--|
| `shareOfPayables: 15` | literal "Placeholder until API provides relative weight" — **la API sí lo da** (`share_percentage`) |
| `rating.score` fallback **85** + descripción generada | `(stats.payment_rate || 85)` — score inventado con texto de presentación "basado en su historial de cumplimiento…" |
| `creditLimit = total_pending × 1.5` (fallback **50.000.000**) | fórmula inventada; la API da `credit_terms` pero no límite — sección sin fuente real |
| `trend` Ene/Feb/Mar = `total_pending × {0.8, 0.9, 1.0}` | "trend placeholder" — gráfico de tendencia **fabricado** a partir de un solo dato |
| `terms.base: 'Net 30 días'` | literal fijo (la API da `credit_terms: 30` — coincide hoy, pero es hardcode) |

## 6. Tabla

- `ActiveObligationsTable` diseñada sin paginación (recibe `invoices[]` completo). Cuando el endpoint exponga facturas del proveedor (hoy no las trae), aplicar regla ≤10 + server-side.

## 7. Redirecciones

- Ruta huérfana: **ningún link del sidebar ni de las páginas CxP lleva aquí** (hallazgo del plan §1.1 rutas huérfanas — confirmado; de dónde debería salir: ficha de proveedor en Directorio, o filas de "Proveedores con Mayor Deuda" del dashboard — hoy muertas).
- La página en blanco tampoco ofrece volver.

## 8. Estados de datos (DESIGN §6.7)

- ❌ **Los tres estados ausentes**: ni loading (pasado el spin inicial), ni empty, ni error. Violación directa de §6.7.

## 9. DESIGN.md §10

- No evaluable visualmente (blank). El componente raíz viola el contrato de estados.

## 10. AGENTS.md

- Página usa FSD parcial (features/accounts-payable) ✅ estructura, pero hook con fabricaciones ❌.
- `.jsx` legacy; sin i18n.

## Rol vendedor (spot-check)

- **FE: sin guard** — VNDR01 accede (mismo blank); API → 403. NA-CXP-2.

## Veredicto

**FAIL (P0)** — Página en blanco con API sana: destructuring contra contrato inexistente + error nunca renderizado. Paralelo exacto al caso `parties.ruc`→`tax_id` de T4: drift enmascarado porque nadie llegó a esta ruta.

**Fixes (FASE 3, ronda P0)**: remapear el hook al contrato plano real (share_percentage/importance/credit_terms/payment_history son gratis) · renderizar estados error/empty · eliminar fabricaciones (rating 85, credit limit ×1.5, trend Ene/Feb/Mar) · decidir anclaje de navegación (desde dashboard top-proveedores cuando P0-1 se arregle, y/o desde Directorio de proveedores).
