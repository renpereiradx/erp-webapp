# Auditoría — Registro de Logs (`/auditoria/logs`) + Detalle + Actividad de Usuario

**Fecha**: 2026-09-16 · FASE 2I · Rol: admin consolidado · RoleGuard F2VLso (pendiente migrar a audit:read) · Modo API, BE FASE 1.

**Archivos**: `src/pages/AuditLogs.jsx`, `src/pages/AuditLogDetail.jsx`, `src/pages/AuditUserActivity.tsx` → `GET /auditoria/logs` (paginado en BE, T16 refactor)

## 1. Screenshots

- `../screenshots/auditoria/logs-admin.png` — **la fabricación más grave del sistema**
- `../screenshots/auditoria/log-detail-999-admin.png` — "Log no encontrado." ✅
- `../screenshots/auditoria/user-activity-1-admin.png` — "No se encontraron datos…" ✅

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Tabla: "No se encontraron resultados" | ✅ honesta (dev audit_logs sin filas del rango) |
| **KPIs "Éxitos Totales 12,450 / Errores Críticos 42 / Advertencias 188 / Eventos 24h 3,120"** | ❌ **MOCKS PUROS presentados junto a una tabla vacía** — no existe fuente; fabricación de métricas de SEGURIDAD |
| **"Página 1 de 30"** con 0 filas | ❌ paginación simulada (el BE pagina de verdad: page/page_size no consumidos — P2 del plan confirmado) |
| Filtros (fechas 01/01-07/01/2026 truncado, categoría, nivel, resultado) | 🟡 UI presente; enviar `page/page_size` al endpoint al cablear |
| Detalle `/auditoria/logs/999` | ✅ "Log no encontrado." honesto |
| Actividad `/auditoria/usuarios/1` | ✅ honesto (`.tsx` ✅) |

## 3. Comprensión de usuario

- Un auditor ve "12.450 éxitos" y una tabla vacía: imposible de reconciliar. En un módulo cuyo producto ES la confianza, fabricar métricas es el defecto más serio de toda la auditoría (empata con Cash Flow CxP).
- `window.location.href` en AuditLogs (:135) = full reload en vez de `navigate()` (P3 del plan — verificar al cablear).

## 4-10

- "Exportar CSV/JSON" 🟡 sin verificar. Detalle/Actividad: estados honestos perfectos ✅.

## Veredicto

**FAIL (P0-domain)** — Logs: KPIs 100% mock + paginación simulada. Detalle y Actividad: PASS (estados honestos).

**Fixes (FASE 3, ronda P0)**: eliminar los 4 KPIs mock (o calcular del endpoint summary real) · paginar server-side con page/page_size + total real · rango de fechas completo · navigate() en vez de location.href · migrar guards a audit:read.
