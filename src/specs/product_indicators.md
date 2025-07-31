Mejoras a realizar para mostrar los indicadores de producto:
Observaciones:
Veo que se obtiene exitosamente desde la api los datos, por ejemplo cuando vamos al modal que se activa con el boton Ver, tenemos un div que muestra el debug con la estructura del producto, ejemplo de lo que se ve en el modal:
Debug - Estructura del producto:
{
  "id": "bcYdWdKNR",
  "name": "Puma MB.01",
  "state": true,
  "is_active": true,
  "category_id": 5,
  "category_name": "Shoes",
  "product_type": "PHYSICAL",
  "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
  "price": 1250000,
  "purchase_price": 1250000,
  "price_id": 52,
  "price_updated_at": "2025-06-03T14:33:52.613475Z",
  "price_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
  "price_formatted": "$1250000.00",
  "has_valid_price": true,
  "has_unit_pricing": false,
  "stock_quantity": 12,
  "stock_id": 108,
  "stock_updated_at": "2025-06-03T14:33:52.613475Z",
  "stock_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
  "stock_status": "medium_stock",
  "has_valid_stock": true,
  "description": "Lorem ipsun new generated.",
  "description_id": 8,
  "category": {
    "id": 5,
    "name": "Shoes",
    "description": ""
  },
  "_enriched": true,
  "_source": "backend_enriched"
}  

En el item que se muestra en el listado de productos obtenido, no se muestra el stock.
En el modal se puede observar tabs es basicamente un div con botones, que son Información, Stock, Precios, Descripción. Los cuales me parecen que estan bien, ya que cada tab muestra la información que corresponde a cada uno de esos items y tambien una opcion para editar la información de cada uno de esos items.
En el tab de informacion los indicadores estan presentes.
Sin embargo, al abrir el modal de un producto, obtenemos el siguiente error en la consola:
BusinessManagementAPI.js:89  GET http://localhost:5050/products/bcYdWdKNR/details 404 (Not Found)
makeRequest @ BusinessManagementAPI.js:89
await in makeRequest
getProductWithDetails @ BusinessManagementAPI.js:470
getProductWithDetails @ productService.js:67
loadProductDetails @ ProductDetailModal.jsx:78
(anonymous) @ ProductDetailModal.jsx:63
react-stack-bottom-frame @ react-dom_client.js?v=f81c4e04:17478
runWithFiberInDEV @ react-dom_client.js?v=f81c4e04:1485
commitHookEffectListMount @ react-dom_client.js?v=f81c4e04:8460
commitHookPassiveMountEffects @ react-dom_client.js?v=f81c4e04:8518
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9887
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9881
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9984
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f81c4e04:9868
commitPassiveMountOnFiber @ react-dom_client.js?v=f81c4e04:9899
flushPassiveEffects @ react-dom_client.js?v=f81c4e04:11302
flushPendingEffects @ react-dom_client.js?v=f81c4e04:11276
flushSpawnedWork @ react-dom_client.js?v=f81c4e04:11250
commitRoot @ react-dom_client.js?v=f81c4e04:11081
commitRootWhenReady @ react-dom_client.js?v=f81c4e04:10512
performWorkOnRoot @ react-dom_client.js?v=f81c4e04:10457
performSyncWorkOnRoot @ react-dom_client.js?v=f81c4e04:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=f81c4e04:11536
processRootScheduleInMicrotask @ react-dom_client.js?v=f81c4e04:11558
(anonymous) @ react-dom_client.js?v=f81c4e04:11649

Esto ya es innecesario, ya que los datos del producto ya se obtienen en el listado de productos y se muestran en el modal. Por lo tanto, no es necesario hacer una segunda llamada a la API para obtener los detalles del producto.
Por lo tanto, se debe eliminar la llamada a la API que intenta obtener los detalles del producto al abrir el modal. En su lugar, se deben utilizar los datos ya disponibles en el estado del componente.
Mejoras en los labels de los indicadores:
- Mejorar la apariencia visual de los labels.

Tab de Descripción:
- Todo se ve correcto, ya que se muestra la descripción del producto y se puede editar.
- El endpoint para editar es: localhost:5050/product_description/8 donde 8 es el id de la descripción del producto. Headers:
  - Authorization: <token>

Tab de Precios:
- No se muestra los indicadores de precios que se obtuvieron en el listado de productos.
- Mejora la ubicacion del boton Configurar

Tab de Stock:
- No se muestra los indicadores de stock que se obtuvieron en el listado de productos.
- Mejora la ubicacion del boton Configurar