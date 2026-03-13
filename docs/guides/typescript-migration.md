# Plan de Migración a TypeScript

## Objetivo
Realizar una migración incremental del proyecto de JavaScript a TypeScript, configurando el entorno para que ambos lenguajes coexistan. Validaremos el proceso migrando un primer módulo piloto (`useDashboardStore.js`). Posteriormente, copiaremos este plan al directorio `docs/` para el resto del equipo.

## Archivos Clave y Contexto
- `package.json`: Necesita la instalación de `typescript` y definiciones de tipos (`@types/node`, `@types/react`, etc.).
- `tsconfig.json` (Nuevo): Se configurará con `"allowJs": true` para que los archivos `.js` actuales sigan funcionando sin errores.
- `jsconfig.json`: Será eliminado para evitar conflictos de resolución en el editor (VS Code/Cursor).
- `vite.config.js`: No requiere cambios mayores, Vite soporta TS/TSX nativamente a través del plugin de React y esbuild.
- **Módulo Piloto:** `src/store/useDashboardStore.js` (se renombrará a `.ts` y se añadirán las interfaces base de Zustand).

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