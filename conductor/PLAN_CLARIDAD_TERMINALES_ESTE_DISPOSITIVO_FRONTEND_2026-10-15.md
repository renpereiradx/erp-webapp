# PLAN_CLARIDAD_TERMINALES_ESTE_DISPOSITIVO_FRONTEND_2026-10-15

Claridad **"Este dispositivo" vs "Terminales"**: la página singular (antes
"Terminal") deja de colisionar con el registro plural; textos unificados con
vocabulario de vinculación, traducción EN completa y dos fixes de consistencia
(selector de sucursal bloqueado con registro + re-sincronización del binding
desde el servidor). Incluye alineación de 3 mensajes del backend (`devices`).

## Problema

- "Terminal" (singular) vs "Terminales" (plural) en Configuración no dicen qué
  es cada una: ambas suenan al mismo registro.
- Jerga técnica filtrada a la UI: `devices.form.branchHint` mostraba el permiso
  interno `branches:switch`.
- Referencias cruzadas confusas: el vacío de Terminales decía
  "Configuración → Terminal"; el hint de registro, "Configuración → Terminales".
- Vocabulario mezclado para el mismo objeto: emparejar / vincular / registrar /
  "código de emparejamiento" (UI + toasts del backend).
- Sin traducción EN: ambos módulos caían al fallback `...es` (se veía español
  en modo inglés).
- **Inconsistencia funcional**: con `device.id` registrado, tocar una tarjeta de
  sucursal cambiaba solo el fallback local, pero el middleware `X-Device-ID`
  sigue forzando la sucursal del registro → la UI mentía.
- **Binding fantasma**: si la terminal se eliminaba del registro, la página
  seguía mostrando "Registrada (#id)" para siempre (solo leía localStorage).

## Decisiones

| # | Decisión | Motivo |
| :--- | :--- | :--- |
| D1 | Página singular = **"Este dispositivo"**; plural sigue **"Terminales"** | La singular es la máquina donde estás parado; deja de confundirse con el registro |
| D2 | Rutas sin cambio (`/configuracion/terminal`, `/configuracion/terminales`) | La URL no es parte de la experiencia; evita redirects y churn de soporte |
| D3 | Vocabulario único: **vincular/desvincular** (nivel 1), **registrar** (alta en el sistema), **"código de vinculación"** (reemplaza "emparejamiento" en UI y mensajes BE) | Un solo verbo por acción; el término "emparejamiento" era el más técnico |
| D4 | Con registro activo, el selector de sucursal se **deshabilita** + hint que explica dónde se administra | La sucursal registrada manda server-side; la UI ahora es honesta |
| D5 | Re-sincronizar el binding al abrir (`GET /api/v1/devices/{id}`) y detectar 404 (registro eliminado) | Mata el estado fantasma; la audiencia `branches:switch` siempre tiene `branches:read` (seeds RBAC) |
| D6 | Traducción EN completa de `devices.*` + `terminal.*` | El repo ya tiene EN para los módulos migrados; estos quedaban 100% en español |
| D7 | Claves i18n y testids **no** se renombran | Diff mínimo; el renombre es de valores visibles |

## Implementación

```
src/lib/i18n/locales/es/devices.js      ← valores + devices.form.pairingHint
src/lib/i18n/locales/es/other.js        ← valores terminal.* + localHint/registeredLockHint/staleRegistration
src/lib/i18n/locales/en/devices.js      ← NUEVO (espejo EN)
src/lib/i18n/locales/en/other.js        ← terminal.* + filas Settings EN
src/lib/i18n/locales/en/index.js        ← import + spread devices
src/pages/Settings.tsx                  ← fallbacks de las 2 filas
src/pages/DevicesPage.tsx               ← fallbacks (subtitle, empty)
src/features/devices/components/DeviceDetailForm.tsx ← fallbacks + pairingHint (data-testid)
src/features/devices/services/deviceService.ts       ← getById(id)
src/features/devices/types.ts           ← comentarios
src/features/branches/components/TerminalPairing.tsx ← fallbacks, badge, Registrar, D4, D5
business_management/internal/devices/service.go      ← 3 strings ("vinculación")
docs/guides/GUIDE_TERMINALES_LOCAL.md                ← §3.4 software + checklist + historial
```

## Tests

- `TerminalPairing.test.tsx`: badge `/Registrado \(#5\)/`; nuevos: tarjetas
  deshabilitadas con registro; sync (getById → localStorage + nombre; 404 →
  aviso de registro eliminado); hint local sin registro.
- `DevicesPage.test.tsx`: regex "Generar un código nuevo al guardar"; nuevo:
  hint de vinculación visible en el detalle.
- BE: `go test ./...` (ningún test assertea los strings cambiados).

## Fuera de alcance

- Middleware `X-Device-ID`, lógica RN-BIPACK-10 y contexto `devices` del BE:
  intactos.
- `POST /devices/pair` sigue solo-auth (el código es el secreto).
- Renombrar el dominio backend (`devices`) o claves i18n: no.

## Estado

- [x] Textos ES + renombre visual + i18n EN
- [x] Fix D4 (selector bloqueado) + D5 (sync/404)
- [x] Mensajes BE alineados
- [x] Tests FE actualizados + nuevos
- [x] Guía de soporte actualizada
- [x] Gates: vitest / tsc / build / lint:design / go test / make build
