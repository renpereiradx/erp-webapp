# CxP — Lista Maestra de Facturas (`/payables/invoices`)

**Fecha**: 2026-09-16 · FASE 2A · Roles: admin consolidado + vendedor (spot-check) · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/InvoicesMasterList.jsx` · **Hook**: `usePayables.fetchPayables` · **Service**: `payablesService` (método `getPayables` **no existe** — P0-1)

## 1. Screenshot

- `../screenshots/payables/invoices-admin.png` — estado "Fallo de Comunicación" con 18 facturas reales detrás de la API.

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | ¿Existe? | Runtime |
|:--|:--|:--|:--|:--|
| Tabla de facturas (todo el cuerpo) | `fetchPayables(filters, pagination)` → `getPayables` | `GET /payables` (List, paginado con totales globales T9/BC-6) | ❌ método inexistente en `payablesService.ts` | ❌ **página entera en error**: "Fallo de Comunicación — Hubo un problema al intentar conectar con los servicios financieros centrales" |
| Contador "Mostrando 0 Facturas" | ídem | ídem | — | ❌ 0 por el fallo (la API tiene 18 registros: smoke `page_size=2` devuelve items) |

El mapeo de respuesta del hook ya contempla `data.items` / array / `data.payables` ✅ (contrato del List real = `{items, ...}`), así que completar el método en FASE 3 es suficiente para que la tabla funcione.

## 3. Comprensión de usuario

- El mensaje de error es genérico ("servicios financieros centrales") — no distingue red caída de bug de integración. Aceptable como ErrorState, pero **la página nunca tuvo datos**: para el usuario esto es "el módulo no funciona". ⚠️
- Filtros con etiquetas correctas y valores enum correctos.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| **"Nueva Factura"** | ❌ **navega a `/payables/new` — ruta inexistente → 404** "Página no encontrada" (hallazgo nuevo NA-CXP-1) |
| "Exportar" | ❌ decorativo (sin efecto: sin toast/fetch/descarga) |
| "Sincronizar" | re-intenta la carga (mismo fallo); sin feedback adicional |
| "Reintentar Conexión" | re-intenta (ídem) — ✅ al menos está cableado |
| Búsqueda "Buscar por ID, proveedor o RUC..." | wireada a `filters.search` con debounce (viaja cuando el método exista) ✅ código |
| Filtro Estados (PENDIENTE/PARCIAL/VENCIDO/PAGADO) | ✅ **valores enum correctos** (`value="PENDING|PARTIAL|OVERDUE|PAID"`, labels en español) — coinciden con el enum del BE |
| Filtro Prioridad (URGENTE/ALTA/MEDIA/BAJA) | ✅ ídem (`URGENT|HIGH|MEDIUM|LOW`) |
| Fechas Desde/Hasta | mapean a `start_date`/`end_date` ✅ código |
| "Mostrar 10/20/50/100" | ✅ mapea a `page_size` ( código) |
| View-mode toggle (tabla/cards) | presente; sin data no verificable render de cards |

## 5. Hardcode scan

- Sin mocks en la página. `isMobile` con listener de resize (patrón legacy, ok).
- Traducciones de status/prioridad hardcoded en el hook (`translateStatus`/`translatePriority`) — mapeo de dominio en hook, no en `domain/`; deuda de migración.

## 6. Tabla

- Paginación server-side completa en el diseño (page/page_size + "Página 1 de 1") ✅ — inutilizada hoy por P0-1. Cumple la regla ≤10 filas cuando funcione (page_size default 20 ⚠️ — la regla del plan pide ≤10 visibles; 20 con paginación real es aceptable, anotar decisión).

## 7. Redirecciones

- "Nueva Factura" → `/payables/new` ❌ **404** (NA-CXP-1).
- Breadcrumb "Finanzas / Cuentas por Pagar" → `/dashboard/payables` ✅.
- Click en fila de factura → `/payables/detail/:id` (código; no verificable sin data — la ruta existe y cae en el error de la ficha CxP-InvoiceDetail).

## 8. Estados de datos (DESIGN §6.7)

- Loading: ✅ skeleton/lista
- Error: ✅ **ErrorState completo con botón Reintentar** (el mejor estado de error del bloque)
- Empty: no alcanzable (siempre error hasta arreglar P0-1)

## 9. DESIGN.md §10

- Layout de filtros + tabla consistente con el sistema. ✅
- ErrorState visual consistente. ✅
- Botón primario "Nueva Factura" roto = anti-patrón affordancia muerta. ❌

## 10. AGENTS.md

- Legacy `.jsx`, i18n hardcoded — FASE 4.
- `catch (err) { console.error }` en loadData — el error real no llega al usuario (el ErrorState viene del hook). OK en la práctica actual.

## Rol vendedor (spot-check)

- API `GET /payables` con VNDR01 → 403 esperado (payables:read).
- **FE: la ruta NO tiene guard** — el vendedor accede por URL y ve la página completa (filtros, botones, ErrorState). Los datos quedan en 403 silencioso (el toast 403 global solo aplica a escrituras). ⚠️ NA-CXP-2 (ver CxP-Dashboard §RBAC).

## Veredicto

**FAIL (P0)** — La página núcleo del bloque CxP está 100% rota por P0-1 (un solo método faltante), con un botón primario que lleva a 404. Los estados de error y el esqueleto de paginación/filtros son de buena calidad y quedará funcional apenas `payablesService.getPayables` se complete contra `GET /payables`.

**Fixes (FASE 3)**: agregar `getPayables` (GET /payables con params existentes) · cambiar "Nueva Factura" a una ruta real o quitar el botón (no hay formulario de factura manual en el alcance CxP — las facturas nacen de compras).
