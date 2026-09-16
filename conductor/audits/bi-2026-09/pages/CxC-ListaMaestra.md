# CxC — Lista de Cuentas (`/receivables/list`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado + vendedor · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/ReceivablesMasterList.jsx` · **Hook**: `useReceivablesMasterList.js:97` · **Service**: `getMasterList` **no existe** (P0-2) — el destino real es `GET /receivables` (List paginado con sort server-side T3 y totales globales T9, verificado 200 con 17 registros).

## 1. Screenshot

- `../screenshots/receivables/master-list-admin.png` — tabla vacía "No se encontraron registros en el periodo seleccionado" con 17 facturas reales detrás.

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| Tabla completa (ID/Cliente/Fecha/Venc./Montos/Estado) | `getMasterList(filters, pagination, sort)` | `GET /receivables` | ❌ método inexistente → catch → vacío silencioso |

## 3. Comprensión de usuario

- "No se encontraron registros en el periodo seleccionado" = **vacío deshonesto**: sugiere que no hay deuda cuando la llamada ni siquiera se hizo. Peor que un ErrorState (mira CxC-Detalle/Vencidas que sí lo hacen).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Exportar" | 🟡 stub honesto: toast **"Función no implementada todavía"** |
| "Nuevo Cobro" | 🟡 stub honesto (ídem) |
| **"Aplicar" (filtros)** | 🟡 stub honesto (ídem) → **los filtros NO funcionan** (ni Estado ni rango de vencimiento ni búsqueda aplican) |
| "Limpiar" | presente |
| "Configurar Columnas" / "Actualizar" | presentes (Actualizar re-intenta) |
| Paginación (10/20/50, "Página 1 de 1") | UI presente, inútil sin data |

**Nota**: los stubs con toast son mejores que los botones silenciosos de CxP (feedback existe), pero la página núcleo sigue sin función.

## 5. Hardcode scan

- Sin mocks. El hook ya contempla la forma `{items, ...}` de la respuesta real.

## 6. Tabla

- Paginación client-side completa en UI (10/20/50). Cuando `getMasterList` exista, mandar `page`/`page_size` server-side (el BE ya pagina y totaliza globalmente post-T9) + `sort_by`/`sort_order` con la whitelist T3 (`date|amount|client|days_overdue`).

## 7. Redirecciones

- Sin links salientes visibles (filas muertas sin data). Click-en-fila → detalle existe en el inventario esperado.

## 8. Estados de datos (DESIGN §6.7)

- Empty ✅ presente pero mal clasificado (error mostrado como vacío).
- Loading ✅. Error ❌ ausente.

## 9. DESIGN.md §10

- Tabla con filtros y toolbar consistente. El vacío deshonesto contradice §8 del plan (nada falso en modo API).

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n.

## Rol vendedor (spot-check)

- **SIN guard** — VNDR01 accede a la página completa (API 403 silencioso). Mismo patrón NA-CXP-2.

## Veredicto

**FAIL (P0)** — Página 100% inoperativa por P0-2 con vacío deshonesto; filtros stub.

**Fixes (FASE 3)**: `getMasterList` contra `GET /receivables` con params reales (`status` enum inglés, `start_date/end_date`, `page/page_size`, `sort_by/sort_order` T3) · clasificar el fallo como ErrorState · decidir suerte de Exportar/Nuevo Cobro (o implementar cobro → flujo de cuenta corriente existente, o quitar).
