# Dashboard — Alertas de Negocio (`/dashboard/alerts`)

**Fecha**: 2026-09-16 · FASE 2C · Rol: admin consolidado (gated `dashboard:read` ✅) · Modo API, BE FASE 1.

**Archivo**: `src/pages/ConsolidatedAlerts.jsx` · **Store**: `useDashboardStore.alerts` → `GET /dashboard/alerts`

## 1. Screenshot

- `../screenshots/dashboard/alerts-admin.png` — 2 alertas reales con metadatos correctos.

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| KPIs (Total 2 / Stock Bajo 1 / Clientes-Ventas 0 / Críticas 1) | alerts API | ✅ reales |
| Alerta "Stock agotado" (Crítica) + "Pagos vencidos" (Advertencia) | alerts API (las 2 vivas del smoke T5) | ✅ reales |
| Expandido: "13 cuentas por cobrar vencidas", Count 13, Total **Gs. 1.917.772** | `Alert.Details` (T19) | ✅ cuadra con overview CxC |
| Botón **"Gestionar"** → **`/receivables/overdue`** | `action_url` del catálogo T5 | ✅ **navegación verificada en vivo** — P0-3 RESUELTO del lado BE+FE para esta alerta. ⚠️ Pero el destino es CxC-Vencidas que está ROTA (ver CxC-Vencidas): la cadena accionable sigue corta |

## 3. Comprensión de usuario

- ✅ Detalle de alerta claro (descripción, referencia interna, metadatos count/total).
- ❌ 4 botones sin ningún efecto (abajo): en una pantalla de "acción urgente", affordances muertas son el defecto más costoso.
- El chip de cliente a `/clientes` (P0-4, ConsolidatedAlerts.jsx:37,447) **no fue ejercitable en runtime**: dev tiene 0 alertas de categoría Clientes/Ventas. La evidencia de código queda; re-verificar cuando exista una alerta de ese tipo.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Expandir alerta (chevron) | ✅ |
| **"Gestionar"** | ✅ → `/receivables/overdue` (T5) |
| "Marcar todo como leído" | ❌ sin efecto (ni estado ni toast) |
| "Actualizar Datos" | ❌ sin efecto visible |
| "Silenciar" | ❌ sin efecto |
| "Ver Reporte Log de Sistema" | ❌ sin efecto |
| Filtro severidad / categoría / búsqueda | client-side (funcional sobre las 2 alertas) |

## 5. Hardcode scan

- "recién creada" relativo ✅ (derivado de timestamp). Sin mocks. Chip `/clientes` = código muerto-pendiente (P0-4).

## 6. Tabla

- Lista de 2 alertas — sin paginación necesaria.

## 7. Redirecciones

- "Gestionar" → `/receivables/overdue` ✅ existe (destino roto, ver 2B).
- P0-4: chips cliente → `/clientes` ❌ inexistente (code-level; no ejercitable hoy).

## 8. Estados de datos (DESIGN §6.7)

- Empty: sin observación (siempre hay alertas en dev); el filtro por severidad permite vacío con mensaje ✅.

## 9. DESIGN.md §10

- Cards de alerta con severidad visual correcta ✅. Botones muertos = anti-patrón.

## 10. AGENTS.md

- `.jsx` legacy; sin i18n; botones sin handlers (P1-8).

## Veredicto

**FAIL (P1)** — Datos y estructura correctos; el catálogo T5 funciona en runtime (hito de FASE 1 visible del lado FE). Debe: 4 botones sin handler + P0-4 pendiente + cadena accionable corta (destino roto).

**Fixes (FASE 3)**: cablear o quitar Marcar leído/Actualizar/Silenciar/Ver Reporte · P0-4: `/clientes` → `/parties` (con `?search=` preservado) · re-test cuando haya alerta de cliente · re-test end-to-end de "Gestionar" tras arreglar CxC-Vencidas.
