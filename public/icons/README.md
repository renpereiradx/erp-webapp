# PWA Icons
# Wave 6: Optimización & Performance Enterprise

Este directorio contiene los iconos necesarios para el PWA del Sistema ERP.

## Iconos requeridos:

### Iconos principales (generados por IA o herramientas de diseño):
- icon-72x72.png - Para Android (mdpi)
- icon-96x96.png - Para Android (hdpi) 
- icon-128x128.png - Para Android (xhdpi)
- icon-144x144.png - Para Android (xxhdpi)
- icon-152x152.png - Para iOS
- icon-192x192.png - Para Android (xxxhdpi)
- icon-384x384.png - Para Android splash
- icon-512x512.png - Para PWA manifest

### Iconos especiales:
- badge-72x72.png - Badge para notificaciones
- maskable-192x192.png - Icono adaptable
- maskable-512x512.png - Icono adaptable grande

### Iconos de acciones:
- action-view.png - Acción "Ver" en notificaciones
- action-dismiss.png - Acción "Cerrar" en notificaciones

## Instrucciones para generar iconos:

1. **Diseño base**: Crear un icono cuadrado de 512x512px con el logo del ERP
2. **Colores**: Usar el esquema de colores del sistema (azul corporativo #667eea)
3. **Estilo**: Minimalista, profesional, con buen contraste
4. **Formato**: PNG con transparencia
5. **Herramientas recomendadas**:
   - Figma/Sketch para diseño
   - PWA Asset Generator para generar todos los tamaños
   - ImageMagick para conversión automática

## Comando para generar iconos automáticamente:

```bash
# Si tienes ImageMagick instalado:
convert icon-base-512.png -resize 72x72 icon-72x72.png
convert icon-base-512.png -resize 96x96 icon-96x96.png
convert icon-base-512.png -resize 128x128 icon-128x128.png
# ... continuar para todos los tamaños
```

## Nota de implementación:

Los iconos están referenciados en:
- `/public/manifest.json` - Manifest PWA
- `/public/sw.js` - Service Worker para notificaciones
- `/src/optimization/PerformanceMonitor.jsx` - Alertas de performance

**Estado actual**: Placeholders - Requiere diseño de iconos reales para producción.
