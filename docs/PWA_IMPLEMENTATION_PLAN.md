# Plan de Conversión a Progressive Web App (PWA)

Este documento detalla el plan de acción para convertir la aplicación web actual en una PWA, aprovechando su stack tecnológico basado en **React y Vite**.

## Fase 1: Fundamentos y Metadatos (El Manifiesto)

El primer paso es describir la aplicación al navegador para permitir su "instalación" en el dispositivo del usuario.

### 1. Instalar Dependencia de Vite para PWA

Usaremos `vite-plugin-pwa`, una herramienta que automatiza la mayor parte del trabajo.

**Acción:** Ejecutar en la terminal:
```bash
pnpm add -D vite-plugin-pwa
```

### 2. Configurar el Plugin en `vite.config.js`

Definiremos el comportamiento de nuestra PWA.

**Acción:** Modificar `vite.config.js` para incluir el plugin y su configuración.

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'ERP WebApp',
        short_name: 'ERPApp',
        description: 'Una aplicación ERP para la gestión de recursos empresariales.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
```

### 3. Crear los Íconos

Se necesitan los íconos declarados en el manifiesto.

**Acción:** Crear dos imágenes (e.g., a partir de un logo de 1024x1024) y guardarlas en la carpeta `public`:
-   `public/pwa-192x192.png`
-   `public/pwa-512x512.png`

---

## Fase 2: Habilitar Capacidades Offline (El Service Worker)

El Service Worker (SW) es el núcleo de la PWA. Actúa como un proxy, cacheando recursos para que la app funcione sin conexión. `vite-plugin-pwa` utiliza **Workbox** internamente.

### 1. Ajustar la Estrategia de Caché

La configuración por defecto ya cachea los recursos estáticos (JS, CSS, HTML, imágenes), lo cual es suficiente para un "App Shell" básico.

**Acción:** La configuración del paso anterior es suficiente para generar el `sw.js` y registrarlo.

### 2. Manejo de Peticiones a la API (Estrategia `NetworkFirst`)

Para datos dinámicos, la estrategia `NetworkFirst` es ideal: intenta obtener los datos de la red y, si falla, sirve desde la caché.

**Acción:** Extender la configuración en `vite.config.js` para manejar las rutas de la API.

```javascript
// Dentro de la configuración de VitePWA en vite.config.js
VitePWA({
  // ... (configuración del manifiesto y registro)
  workbox: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 día
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})
```
*(Nota: Ajustar `/api` al prefijo real de la API)*.

---

## Fase 3: Mejorar la Experiencia de Usuario (UX)

Una PWA debe sentirse como una aplicación nativa.

### 1. Notificación de Actualización (Opcional)

Aunque `autoUpdate` es eficiente, se puede notificar al usuario sobre nuevas versiones para que recargue la página. `vite-plugin-pwa` proporciona hooks para implementar esta funcionalidad.

### 2. Indicador de Estado Offline

La aplicación debe comunicar cuando pierde la conexión.

**Acción:** Crear un hook de React (`useOnlineStatus`) que escuche los eventos `online` y `offline` y muestre un banner o toast en la UI.

```jsx
// src/hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## Fase 4: Verificación y Despliegue

### 1. Construir la Aplicación
**Acción:** Ejecutar `pnpm build`. Esto generará la carpeta `dist` con la aplicación, el manifiesto y el service worker.

### 2. Probar Localmente
**Acción:** Servir el contenido de la carpeta `dist` con un servidor local.
```bash
pnpm add -g serve
serve -s dist
```

### 3. Auditar con Lighthouse
**Acción:** En Chrome DevTools, ir a la pestaña **Lighthouse**. Marcar la casilla **"Progressive Web App"** y generar un reporte. El objetivo es obtener una puntuación alta y la insignia de PWA instalable.
