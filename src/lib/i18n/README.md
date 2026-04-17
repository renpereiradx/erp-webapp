# Sistema de Internacionalización (i18n)

Sistema modular de traducciones para la aplicación ERP, organizado por dominios y con validación automática.

## 📁 Estructura

```
src/lib/i18n/
├── index.js              # Exportaciones principales y hook useI18n()
├── validate.js           # Script de validación de traducciones
├── README.md             # Esta documentación
└── locales/              # Traducciones por idioma
    ├── es/               # Español
    │   ├── index.js      # Exporta todas las traducciones ES
    │   ├── common.js     # Traducciones comunes
    │   ├── products.js   # Módulo de productos
    │   └── purchases.js  # Módulo de compras
    └── en/               # Inglés
        ├── index.js      # Exporta todas las traducciones EN
        ├── common.js     # Common translations
        ├── products.js   # Products module
        └── purchases.js  # Purchases module
```

## 🚀 Uso Básico

### En componentes React

```javascript
import { useI18n } from '@/lib/i18n'

function MyComponent() {
  const { t, lang, setLang } = useI18n()

  return (
    <div>
      <h1>{t('products.title')}</h1>
      <p>Idioma actual: {lang}</p>
      <button onClick={() => setLang('en')}>English</button>
      <button onClick={() => setLang('es')}>Español</button>
    </div>
  )
}
```

### Interpolación de variables

```javascript
const { t } = useI18n()

// Con un objeto de variables
t('products.no_results_for', { term: 'Nike' })
// Resultado: "No hay productos que coincidan con Nike"

// Ejemplo con múltiples variables
t('cart.items_count', { count: 5, total: '$ 150.00' })
// Resultado: "5 artículos por un total de $ 150.00"
```

### Sin React hooks (utilidades)

```javascript
import { tRaw } from '@/lib/i18n'

// En funciones utilitarias o fuera de componentes
const message = tRaw('common.error')
const withVars = tRaw('products.no_results_for', { term: 'Nike' })
```

## 📝 Convenciones de Nomenclatura

### Estructura de claves

Las claves siguen el patrón: `módulo.sección.elemento`

```
módulo: común, productos, compras, clientes, etc.
sección: título, formulario, tabla, modal, etc.
elemento: nombre, descripción, botón, etc.
```

### Ejemplos

```javascript
// ✅ Bien estructurado
'products.title'                    // Título principal del módulo
'products.form.name'                // Campo nombre en formulario
'products.table.price'              // Columna precio en tabla
'products.modal.confirm'            // Botón confirmar en modal
'products.error.not_found'          // Mensaje de error

// ❌ Evitar
'ProductTitle'                      // No usar CamelCase
'products_title'                    // No usar snake_case
'productsTitle'                     // No usar camelCase
```

## ➕ Agregar Nuevas Traducciones

### 1. Editar el módulo correspondiente

```javascript
// src/lib/i18n/locales/es/products.js
export const products = {
  // ... traducciones existentes
  'products.new_feature.title': 'Nueva Característica',
  'products.new_feature.description': 'Descripción de la característica',
}
```

### 2. Agregar la traducción en inglés

```javascript
// src/lib/i18n/locales/en/products.js
export const products = {
  // ... existing translations
  'products.new_feature.title': 'New Feature',
  'products.new_feature.description': 'Feature description',
}
```

### 3. Validar las traducciones

```bash
node src/lib/i18n/validate.js
```

## 🆕 Crear un Nuevo Módulo

### 1. Crear el archivo para español

```javascript
// src/lib/i18n/locales/es/clients.js

/**
 * Traducciones de clientes en español
 * Módulo: Gestión de clientes, contactos
 */

export const clients = {
  'clients.title': 'Gestión de Clientes',
  'clients.form.name': 'Nombre del Cliente',
  'clients.form.email': 'Correo Electrónico',
  // ... más traducciones
}
```

### 2. Crear el archivo para inglés

```javascript
// src/lib/i18n/locales/en/clients.js

/**
 * Client translations in English
 * Module: Client management, contacts
 */

export const clients = {
  'clients.title': 'Client Management',
  'clients.form.name': 'Client Name',
  'clients.form.email': 'Email Address',
  // ... more translations
}
```

### 3. Importar en los índices

```javascript
// src/lib/i18n/locales/es/index.js
import { clients } from './clients'

export const es = {
  ...common,
  ...products,
  ...purchases,
  ...clients,  // ← Agregar aquí
}
```

```javascript
// src/lib/i18n/locales/en/index.js
import { clients } from './clients'

export const en = {
  ...common,
  ...products,
  ...purchases,
  ...clients,  // ← Add here
}
```

### 4. Validar

```bash
node src/lib/i18n/validate.js
```

## 🧪 Validación de Traducciones

El script de validación verifica:

- ✅ Todas las claves existen en ambos idiomas
- ✅ No hay claves duplicadas
- ✅ Estadísticas por módulo

### Ejecutar validación

```bash
node src/lib/i18n/validate.js
```

### Salida esperada

```
=== Validación de Traducciones i18n ===

📊 Estadísticas:
  Español (es): 245 claves
  Inglés  (en): 245 claves

📦 Módulos en Español:
  products             85 claves
  purchases            92 claves
  common               68 claves

🔍 Verificando consistencia entre idiomas...

✅ ¡Validación exitosa! Todas las traducciones están sincronizadas.
```

## 🛠️ API Completa

### useI18n()

Hook principal para usar traducciones en componentes React.

```typescript
interface UseI18nReturn {
  t: (key: string, vars?: Record<string, any>) => string
  lang: 'es' | 'en'
  setLang: (lang: 'es' | 'en') => void
}

function useI18n(): UseI18nReturn
```

### tRaw()

Función de traducción sin hooks, para usar fuera de componentes React.

```typescript
function tRaw(key: string, vars?: Record<string, any>): string
```

### setI18nLang()

Establece el idioma global (persiste en localStorage).

```typescript
function setI18nLang(lang: 'es' | 'en'): void
```

### Utilidades

```typescript
// Obtener idiomas soportados
function getSupportedLanguages(): string[]  // ['es', 'en']

// Verificar si un idioma está soportado
function isLanguageSupported(lang: string): boolean

// Obtener el idioma actual
function getCurrentLanguage(): string  // 'es' | 'en'
```

## 📋 Checklist para Nuevos Desarrolladores

Al agregar una nueva funcionalidad:

- [ ] Identificar el módulo correspondiente (common, products, purchases, etc.)
- [ ] Agregar traducciones en `src/lib/i18n/locales/es/[modulo].js`
- [ ] Agregar traducciones en `src/lib/i18n/locales/en/[modulo].js`
- [ ] Usar claves descriptivas: `modulo.seccion.elemento`
- [ ] Ejecutar validación: `node src/lib/i18n/validate.js`
- [ ] Verificar que no hay warnings en la consola

## 🔄 Migración desde el Sistema Anterior

El archivo `src/lib/i18n.js` ahora es un wrapper de compatibilidad que re-exporta el nuevo sistema. Todos los imports existentes siguen funcionando:

```javascript
// ✅ Esto sigue funcionando
import { useI18n } from '@/lib/i18n'

// ✅ También funciona
import { useI18n } from '@/lib/i18n/index'
```

El sistema antiguo está guardado en `src/lib/i18n.legacy.js` como referencia.

## 🐛 Debugging

### Clave no encontrada

Si ves warnings en la consola:

```
[i18n] Traducción no encontrada: "products.new_key" (idioma: es)
```

1. Verifica que la clave existe en el módulo correspondiente
2. Verifica que el módulo está importado en `locales/[lang]/index.js`
3. Ejecuta el script de validación

### Variables no interpoladas

Si ves `{variable}` en lugar del valor:

```javascript
// ❌ Mal: pasar string en lugar de objeto
t('products.no_results_for', 'Nike')

// ✅ Bien: pasar objeto con variables
t('products.no_results_for', { term: 'Nike' })
```

## 📚 Recursos Adicionales

- [Convenciones de i18n](https://www.i18next.com/principles/fallback)
- [React i18n best practices](https://react.i18next.com/latest/usetranslation-hook)
- Archivo legacy: `src/lib/i18n.legacy.js`

---

**Última actualización**: 2025-11-14
**Mantenedor**: Equipo de Desarrollo ERP
