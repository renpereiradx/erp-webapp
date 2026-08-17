# PLAN_PARTY_EXTENDED_FIELDS_FRONTEND — Companion frontend de b648384

Fecha: 2026-08-16
Estado: ✅ Implementado
Repo: erp-webapp
Relacionado: backend `conductor/FIX_PARTY_AUDIT_B648384.md` (commit b648384 + fixes)

## Problema

El backend extendió los parties con `document_type`, dirección estructurada
(`address_street/city/state/zip_code/country`) y `nationality`, pero el
frontend no enviaba ni mostraba esos campos. La auditoría lo marcó como
violación de la regla 2 de AGENTS.md ("cualquier cambio de endpoint en el
backend requiere actualizar el frontend"). Además, la dirección del
proveedor vivía como texto libre dentro de `contact_info.address`.

## Solución

### 1. Dominio puro — `src/domain/party/identity.ts` (nuevo)

Espejo de las reglas del backend (`internal/party`):

- `PARTY_DOCUMENT_TYPES`: whitelist de 12 valores, en mayúsculas.
- `normalizeDocumentType()`: canonicaliza caso (`'ci'` → `'CI'`), rechaza
  fuera de whitelist.
- `isISOAlpha2()` / `ISO_ALPHA2_PATTERN`: regex ISO 3166-1 alpha-2.
- `PARTY_COUNTRIES`: lista curada (~60, América primero, raíz PY/SIFEN).
  Cualquier alpha-2 válido sigue siendo aceptado por el backend; la lista
  solo acota las opciones del select.
- `countryDisplayName()`: nombre localizado vía `Intl.DisplayNames` con
  fallback al código (sin hardcodear nombres en los diccionarios).

Tests: `src/__tests__/party-identity.domain.test.ts` (17 casos).

### 2. Feature components — `src/features/party/components/` (nuevos, .tsx)

Seed del futuro feature-sliced de parties. Design system (tokens semánticos,
Radix Select, `ui/Input`, `ui/Label`):

- `DocumentTypeSelect.tsx` — select con la whitelist, opción "Sin especificar"
  (sentinel `__unset__`: Radix no acepta items con value vacío).
- `CountrySelect.tsx` — select de países reutilizable (nacionalidad o país de
  dirección); agrega opción extra si el valor persistido no está en la lista
  curada pero es alpha-2 válido.
- `AddressFieldsGrid.tsx` — grilla calle / ciudad+estado / cp+país, mapea 1:1
  a las columnas `address_*`.

### 3. i18n — módulo `party` (es + en)

`locales/{es,en}/party.js`: labels de campos compartidos y los 12 nombres de
document type (`party.document_type.CI` = "Cédula de Identidad", etc.).
Registrados en ambos `index.js`. Nota: `en/index.js` ya arrastra `...es` como
fallback, el override en inglés es incremental.

### 4. Formularios

**`SupplierDirectoryFormModal.jsx`** (proveedores):
- El textarea de dirección se reemplaza por `AddressFieldsGrid`.
- Payload: claves `address_*` solo cuando tienen valor (en update, nil =
  dejar sin cambiar). `contact_info` queda solo con email/phone: la
  dirección migra a las columnas.
- Compatibilidad legacy: si el proveedor solo tiene texto en
  `contact_info.address`, se prefiere `address_street` del backend y como
  fallback el texto va a la calle; el primer guardado lo migra.

**`ClientFormModal.jsx`** (clientes):
- Nueva fila documento: `DocumentTypeSelect` + número existente.
- `CountrySelect` para `nationality` junto al contacto.
- `AddressFieldsGrid` para la dirección.
- Edición: prefill desde el party (`document_type` pasa por
  `normalizeDocumentType`, dirección/nacionalidad sobreviven al spread del
  store).

Ambos payloads fluyen por los services existentes (`supplierService` /
`clientService` hacen spread → POST/PUT `/api/v1/parties`), sin cambios de
contrato adicionales.

### 5. Details modals

- `ClientDetailsModal.jsx`: filas de tipo de documento, nacionalidad y
  dirección (join de `address_*`).
- `SupplierDirectoryDetailsModal.jsx`: dirección estructurada primero,
  fallback al texto legacy. Fix colateral: destructuraba `locale` de
  `useI18n()` (inexistente, siempre undefined → default 'es-MX'); ahora usa
  `lang` real en `formatDateTime`.

## Verificación

- `pnpm build` ✅ (warning de chunk >500kB preexistente).
- `pnpm test`: **idéntico al baseline** — 17 archivos / 49 tests fallidos +
  1 OOM de worker son preexistentes (verificados con stash contra HEAD);
  los 17 tests nuevos del dominio pasan. `Clients.page.test.jsx` (4 fails
  por `useNavigate` fuera de Router) y `Suppliers.toasts.test.jsx` (OOM en
  collect) fallan igual sin mis cambios.
- ESLint sobre los archivos js/jsx tocados: 0 errores (1 warning
  preexistente en `ClientDetailsModal`).

## Fuera de alcance (registrado)

- Migrar los modales completos a `.tsx`/EnhancedModal (los campos nuevos ya
  son .tsx con tokens; el resto del modal mantiene el estilo legacy).
- Los otros formularios legacy de clientes/proveedores no activos
  (`components/clients/`, `components/suppliers/`) no se tocaron.
- Fallos de test preexistentes (17 archivos) y el OOM de
  `Suppliers.toasts.test.jsx`: deuda separada, no introducida por este
  cambio.
