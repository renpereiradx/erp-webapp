# CxC — Perfil de Crédito de Cliente (`/receivables/client-profile/:clientId`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2). Ruta fuera del sidebar (destino de chips "cliente" en alertas).

**Archivo**: `src/pages/ClientCreditProfile.jsx` · **Hook**: `useClientCreditProfile.js` (getClientProfile + getClientRiskAnalysis — **ambos existen**)

## 1. Screenshot

- `../screenshots/receivables/client-profile-admin.png` — probado con cliente real `RCkIWNxvR` (Oscar Flores).

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Runtime |
|:--|:--|:--|
| Saldo Pendiente Total | `GET /receivables/client/{id}` | ✅ **Gs. 616.380** = API |
| Facturas Pendientes (tabla + paginación "2 de 12") | ídem | ✅ **real** (SALE-…-580 217.070 PARTIAL; SALE-…-964 399.310) con Anterior/Siguiente |
| Identificación Fiscal (11111111) | ídem | ✅ |
| Score 50 "Riesgo Medio" + "monitoreo continuo" | `GET /receivables/client/{id}/risk` | ❌ **fallback `?? 50`**: la API no trae `risk_score`, trae **`risk_level: "LOW"`** — el cliente real es riesgo BAJO y la UI muestra "Medio" (falso) |
| Límite de Crédito Gs. 150.000.000 + "80% Utilizado" | `profile.credit_limit \|\| 150000000` | ❌ **literal**: 80% de 150M = 120M ≠ saldo real 616.380 (incoherencia visible en la misma pantalla) |
| Análisis de Antigüedad (barras "Gs. 250M / Gs. 100M / Gs. 40M") | **literales** en el hook (`amount: 'Gs. 250M', width: '55%'`) | ❌ barras fabricadas junto a un "Saldo Total: Gs. 616.380" real |
| "ALERTA: > 90 DÍAS" | literal | ❌ **falsa alarma**: API `total_over_90_amount: 0` |
| Vencimiento "Nov 12, 2023" ×2 | mapeo de `inv.due_date` | ❌ contradice la API (`due_date` real 2026-09-30) — fecha imposible para facturas de 2026 |
| "Sin variacion mensual" (typo) / "Prom. 0 Días" / "Último Pago Gs. 0" | mixtos | 🟡 0s coinciden con la API (`avg_days_to_pay: 0`); typo en producción |

**Campos reales de la API que el FE ignora**: `risk_level`, `payment_behavior: "EXCELLENT"`, `max_days_overdue: 15`, `avg_days_outstanding: 15`, `total_payments: 7`, `collection_rate: 67,4%` — todo útil para el perfil y disponible ya.

## 3. Comprensión de usuario

- La mezcla real+fabricado es lo más peligroso del bloque: saldo y facturas verdaderos junto a score/límite/alerta falsos. Un analista de crédito **no puede confiar** en esta pantalla sin abrir la API.
- El "score 50" con recomendación automática sobre un cliente con comportamiento EXCELENTE = decisión de crédito potencialmente errónea.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Añadir Nota" / "Suspender Crédito" / "Exportar Reporte" | 🟢 **disabled honestos** (visibles pero deshabilitados — mejor estado que stubs silenciosos) |
| "Detalles" (Perfil de Riesgo) | sin efecto observado ⚠️ |
| "Filtrar" / "Ordenar" (facturas) | sin efecto visible ⚠️ |
| Paginación Anterior/Siguiente | ✅ funcional (2 de 12) |
| Breadcrumb "Inicio"/"Clientes" | ❌ `href="#"` (links muertos) |

## 5. Hardcode scan

- Score fallback 50 · límite 150M · barras 'Gs. 250M/100M/40M' literales · "ALERTA: > 90 DÍAS" literal · "Sin variacion mensual" (typo) · breadcrumb `#`.

## 6. Tabla

- Facturas: paginada (2 de 12) ✅ — el patrón correcto para el resto del módulo.

## 7. Redirecciones

- Ruta huérfana (sin entrada del sidebar) — destino natural: chips de cliente en alertas (P0-4, bloque Dashboard: hoy apuntan a `/clientes` inexistente).
- Breadcrumb con `href="#"`.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; con datos ✅; error ✅ ("Error al cargar el perfil" + Reintentar, observado en el spot-check vendedor con API 403).

## 9. DESIGN.md §10

- Layout profesional (perfil tipo ficha). ❌ mezcla real+fabricado.

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n; fabricaciones dentro del hook (deben vivir en domain/ o desaparecer).

## Rol vendedor (spot-check)

- Sin guard — VNDR01 accede; API 403 → error state honesto.

## Veredicto

**FAIL (P1 grueso sobre base funcional)** — La página carga datos reales (saldo, facturas, paginación) pero presenta un score, límite, barras y alerta FABRICADOS que contradicen la API en la misma pantalla. Corrección barata: la API ya da todo lo necesario.

**Fixes (FASE 3, ronda P1)**: score ← `risk_level` (mapear LOW/MEDIUM/HIGH) o ocultar · límite: quitar sección (sin fuente) · barras ← buckets reales del endpoint · alerta ← `total_over_90_amount > 0` · fecha vencimiento real · cablear/quitar Detalles/Filtrar/Ordenar · breadcrumb real (`/parties`) · typo.
