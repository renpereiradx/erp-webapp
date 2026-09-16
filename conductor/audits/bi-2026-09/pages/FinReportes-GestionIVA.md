# FinReportes — Gestión de IVA / Fiscal (`/finance/tax-management`)

**Fecha**: 2026-09-16 · FASE 2H · Rol: admin consolidado · **Ruta SIN guard** (el BE sí gatea financial-reports por rol Admin/Buyer) · Modo API, BE FASE 1.

**Archivo**: `src/pages/TaxManagementDashboard.jsx` → `useFinancialReports.fetchVatReport/fetchTaxSummary` → **`financialReportsService.getVat` y `getTaxSummary` — NINGUNO EXISTE** (el service define `getVATReport`; `getTaxSummary` no está definido). Mismo patrón P0-1.

## 1. Screenshot

- `../screenshots/finance/tax-management-admin.png` — "No se pudo cargar el módulo fiscal desde la API" + todo en Gs. 0.

## 2. Trazabilidad → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| Página completa | `getVat(period)` + `getTaxSummary(period)` | `GET /financial-reports/vat` — **verificado 200 con datos reales post-T11** (vat_10 = 50.159,98 con la tasa legal 10/110) | ❌ dos métodos inexistentes → TypeError → error state + ceros |

**Ironía post-T11**: el BE corrigió el IVA sobredeclarado y la página ni siquiera llega a mostrarlo — el fix legal de FASE 1 es invisible para el usuario por un name-mismatch FE.

## 3-10

- Error state honesto con "Reintentar" ✅ (y toast destructivo del hook). Botón "Descargar Formulario 120" presente (probar post-fix). `.jsx`.

## Veredicto

**FAIL (P0-class, trivial)** — Página entera caída por 2 métodos faltantes con la API sana.

**Fixes (FASE 3, ronda P0)**: agregar `getVat` (alias de `getVATReport`) y `getTaxSummary` (mapear `vat` summary o el endpoint de liquidación) · re-auditar la página viva (tablas por tasa, Form 120/121).
