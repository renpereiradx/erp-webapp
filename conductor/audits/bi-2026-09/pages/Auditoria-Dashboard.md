# Auditoría — Dashboard (`/auditoria`)

**Fecha**: 2026-09-16 · FASE 2I · Rol: admin consolidado · **Guard: RoleGuard `F2VLso`** — la migración a `PermissionGuard audit:read` decidida en T18 está PENDIENTE (hallazgo de FASE 2) · Modo API, BE FASE 1 (write-path T17 activo).

**Archivo**: `src/pages/AuditDashboard.jsx` → `GET /auditoria/summary` + trends

## 1. Screenshot

- `../screenshots/auditoria/dashboard-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Total Acciones 0 / Usuarios Únicos 0 / Alertas 0 | ✅ honesto (dev audit_logs vacía de filas de hoy; el pipeline T17 está activo pero el dev apenas escribe) |
| **"+12.5% vs prev."** | ❌ **P1-7 confirmado verbatim** — literal hardcodeado |
| "Tasa de Éxito 0% — ✓ Óptimo" | ❌ semántica absurda (0% de éxito no es óptimo) |
| **Tendencias de Actividad (curva suave con datos)** | ❌ **curva fabricada** con tabla vacía |
| **Donut "100% TOTAL LOG"** | ❌ contradice el Total 0 de arriba |
| Top Usuarios (tabla vacía) | ✅ honesto |
| "Alertas Recientes 0" + "Explorar historial completo" → `/auditoria/logs` | ✅ |

## 3-10

- El módulo de SEGURIDAD mostrando una curva de actividad inventada es especialmente grave: sugiere actividad donde no la hay (o peor, oculta la real). `.jsx`; sin i18n.

## Veredicto

**FAIL (P1, grave por dominio)** — Ceros honestos + 3 fabricaciones visuales (curva, donut 100%, +12.5%).

**Fixes (FASE 3)**: curva ← `/auditoria/hourly` o trends reales (si no hay datos: empty-state) · donut ← totals reales · eliminar "+12.5%" · "0% éxito" → mostrar n/d · migrar guard a PermissionGuard audit:read.
