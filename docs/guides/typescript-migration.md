# Plan de Migración a TypeScript

## Objetivo
Realizar una migración incremental del proyecto de JavaScript a TypeScript, configurando el entorno para que ambos lenguajes coexistan. Validaremos el proceso migrando un primer módulo piloto (`useDashboardStore.js`). Posteriormente, copiaremos este plan al directorio `docs/` para el resto del equipo.

## Archivos Clave y Contexto
- `package.json`: Necesita la instalación de `typescript` y definiciones de tipos (`@types/node`, `@types/react`, etc.).
- `tsconfig.json` (Nuevo): Se configurará con `"allowJs": true` para que los archivos `.js` actuales sigan funcionando sin errores.
- `jsconfig.json`: Será eliminado para evitar conflictos de resolución en el editor (VS Code/Cursor).
- `vite.config.js`: No requiere cambios mayores, Vite soporta TS/TSX nativamente a través del plugin de React y esbuild.
- **Módulo Piloto:** `src/store/useDashboardStore.js` (se renombrará a `.ts` y se añadirán las interfaces base de Zustand).

## Estructura de Módulos (Nueva Arquitectura Basada en Features)
Al migrar código existente o al crear nuevas funcionalidades en TypeScript, es **obligatorio** adoptar una estructura modular alineada con el diseño basado en features (Feature-Sliced Design) alojada en `src/features/`. Esto asegura escalabilidad, testeabilidad y separación de responsabilidades.

Asimismo, el proyecto respeta una arquitectura donde la lógica de negocio pura reside en `src/domain/`.

### 1. Capa de Features (`src/features/`)
Específica de React y de la interfaz de usuario. Aquí reside la orquestación del estado, la vista y la conexión con el servidor.

```text
src/features/<nombre-del-modulo>/
├── components/   # Componentes de React de presentación y contenedores (.tsx)
├── hooks/        # Lógica de estado local e integraciones con React (e.g. useState, useEffect) (.ts)
├── types/        # Interfaces estrictas para las props y estados de la UI (.ts)
├── services/     # Llamadas a la API (fetch/axios) específicas del módulo (.ts)
├── utils/        # Funciones auxiliares de UI (formateo de fechas para la vista, etc.) (.ts)
└── index.ts      # Archivo barril (barrel file) para exportar la API pública del módulo
```

### 2. Capa de Dominio (`src/domain/`)
**Framework-Agnostic (Independiente de React).** Contiene reglas de negocio matemáticas, validaciones y políticas que podrían ejecutarse en Node.js, una app móvil o la web sin depender de librerías visuales.

```text
src/domain/<nombre-del-modulo>/
├── calculations/ # Funciones puras matemáticas (ej: cálculo de IVA, subtotales)
├── pricing/      # Políticas de redondeo y negocio (ej: redondeo a múltiplos de 50 Gs)
├── validators/   # Reglas de validación pura (ej: si una orden tiene items válidos)
└── models.ts     # Tipos e interfaces que describen las entidades de negocio puras
```

**Reglas de convivencia:**
1. **NO mezclar responsabilidades:** Los archivos en `src/domain/` **NUNCA** deben importar cosas de React (ni `useState`, ni `useEffect`). Son funciones puras (`(input) => output`).
2. Los `hooks` en `src/features/` importan y utilizan las funciones puras de `src/domain/` para calcular estados antes de renderizar.
3. Las `pages/` (`src/pages/`) actúan únicamente como orquestadores "delegados", ensamblando los `components/` exportados desde `src/features/`.

## Pasos de Implementación
1. **Dependencias:** Ejecutar `pnpm add -D typescript @types/react @types/react-dom @types/node`.
2. **Configuración Base:** Crear `tsconfig.json` (aplicación) y `tsconfig.node.json` (configuración de Vite) en la raíz del proyecto.
3. **Limpieza:** Eliminar `jsconfig.json`.
4. **Migración del Piloto:** Renombrar `src/store/useDashboardStore.js` a `src/store/useDashboardStore.ts` y aplicar interfaces al estado (`DashboardState`).
5. **Documentación:** Copiar las directrices de este plan a `docs/guides/typescript-migration.md`.

## Verificación y Pruebas
- **Build:** Ejecutar `pnpm run build` para asegurar que no haya problemas de empaquetado.
- **Chequeo Estático:** Validar los tipos en el CI simulado ejecutando `pnpm tsc --noEmit`.
- **Ejecución Local:** Iniciar el servidor con `pnpm dev` y comprobar que la UI del Dashboard sigue funcionando correctamente.