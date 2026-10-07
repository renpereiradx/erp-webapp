/// <reference types="vite/client" />

// PLAN_VERSION_UI_FRONTEND: inyectado por el `define` de vite.config.js desde
// package.json. La UI lo consume SOLO vía useVersionStore → SystemVersionBadge.
declare const __APP_VERSION__: string
