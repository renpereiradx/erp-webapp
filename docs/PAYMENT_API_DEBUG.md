# Payment API Debug Logger

El front-end ahora captura eventos de error de la Payment API y los agrupa en un reporte listo para compartir con el equipo backend.

## Cómo generar el reporte

1. Reproduce el problema desde el front-end (por ejemplo, abre alguna vista que realice llamadas a `/currencies` o `/payment-methods`).
2. Abre las DevTools del navegador (`Ctrl+Shift+I` o `Cmd+Option+I`).
3. En la pestaña **Console**, ejecuta:

   ```js
   window.paymentApiDebug.getReport().print()
   ```

4. Copia la salida completa (incluye metadata de entorno, endpoint, método y detalles del error). Esa es la información que debe revisarse en backend.

## Qué incluye el reporte

- Timestamp exacto del fallo
- Servicio y operación que originaron la llamada
- Endpoint relativo y método HTTP
- Sospecha automática de problemas CORS (cuando aplica)
- Payload enviado (solo para operaciones de escritura)
- Datos del cliente (URL actual, user-agent)
- Código de error, mensaje y stack recortado

Si necesitas compartir el JSON directamente, puedes usar:

```js
window.paymentApiDebug.getReport().toJSON()
```
