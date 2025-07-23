    # Resumen de API Backend

    ## Autenticación y Usuario
    - **GET** `/`: Página de inicio.
    - **POST** `/signup`: Registro de usuario.
    - **POST** `/login`: Inicio de sesión.

    ## Categorías
    - **GET** `/categories`: Obtener todas las categorías.

    ## Productos
    - **POST** `/products/`: Insertar producto.
    - **GET** `/products/{id}`: Obtener producto por ID.
    - **GET** `/products/products/name/{name}`: Buscar productos por nombre.
    - **GET** `/products/products/{page}/{pageSize}`: Listar productos paginados.
    - **PUT** `/products/products/{id}`: Actualizar producto por ID.
    - **PUT** `/products/products/delete/{id}`: Eliminar producto por ID.

    ## Descripción de Producto
    - **POST** `/product_description/{product_id}`: Insertar descripción.
    - **GET** `/product_description/{id}`: Obtener descripción por ID.
    - **PUT** `/product_description/{id}`: Actualizar descripción por ID.

    ## Precio de Producto
    - **POST** `/product_price/product_id/{product_id}`: Insertar precio.
    - **GET** `/product_price/{id}`: Obtener precio por ID.
    - **GET** `/product_price/product_id/{product_id}`: Obtener precio por ID de producto.
    - **PUT** `/product_price/product_id/{product_id}`: Actualizar precio por ID de producto.
    - **PUT** `/product_price/id/{id}`: Actualizar precio por ID.

    ## Stock
    - **POST** `/stock/{product_id}`: Insertar stock.
    - **GET** `/stock/{id}`: Obtener stock por ID.
    - **GET** `/stock/product_id/{product_id}`: Obtener stock por ID de producto.
    - **PUT** `/stock/{id}`: Actualizar stock por ID.
    - **PUT** `/stock/product_id/{product_id}`: Actualizar stock por ID de producto.

    ## Inventario
    - **POST** `/inventory/`: Insertar inventario.
    - **GET** `/inventory/{id}`: Obtener inventario con items por ID.
    - **GET** `/inventory/{page}/{pageSize}`: Listar inventarios paginados.
    - **PUT** `/inventory/{id}`: Invalidar inventario.

    ## Ajuste Manual
    - **POST** `/manual_adjustment/`: Insertar ajuste manual.
    - **GET** `/manual_adjustment/{page}/{pageSize}`: Listar ajustes manuales paginados.

    ## Proveedores
    - **POST** `/supplier/`: Insertar proveedor.
    - **GET** `/supplier/{id}`: Obtener proveedor por ID.
    - **GET** `/supplier/name/{name}`: Buscar proveedor por nombre.
    - **GET** `/supplier/{page}/{pageSize}`: Listar proveedores paginados.
    - **PUT** `/supplier/{id}`: Actualizar proveedor por ID.
    - **PUT** `/supplier/delete/{id}`: Eliminar proveedor por ID.

    ## Clientes
    - **POST** `/client/`: Insertar cliente.
    - **GET** `/client/{id}`: Obtener cliente por ID.
    - **GET** `/client/name/{name}`: Buscar cliente por nombre.
    - **GET** `/client/{page}/{pageSize}`: Listar clientes paginados.
    - **PUT** `/client/{id}`: Actualizar cliente por ID.
    - **PUT** `/client/delete/{id}`: Eliminar cliente por ID.

    ## Tasas de Impuesto
    - **POST** `/tax_rate/`: Insertar tasa de impuesto.
    - **GET** `/tax_rate/{id}`: Obtener tasa por ID.
    - **GET** `/tax_rate/name/{name}`: Buscar tasa por nombre.
    - **GET** `/tax_rate/{page}/{pageSize}`: Listar tasas paginadas.
    - **PUT** `/tax_rate/{id}`: Actualizar tasa por ID.

    ## Compras
    - **POST** `/purchase/`: Insertar compra.
    - **PUT** `/purchase/cancel/{id}`: Cancelar compra.
    - **GET** `/purchase/{id}`: Obtener compra por ID.
    - **GET** `/purchase/supplier_id/{supplier_id}`: Compras por ID de proveedor.
    - **GET** `/purchase/supplier_name/{name}`: Compras por nombre de proveedor.
    - **GET** `/purchase/date_range/`: Compras por rango de fechas.

    ## Ventas
    - **POST** `/sale/`: Insertar venta.
    - **PUT** `/sale/{id}`: Cancelar venta.
    - **GET** `/sale/{id}`: Obtener venta por ID.
    - **GET** `/sale/client_id/{client_id}`: Ventas por ID de cliente.
    - **GET** `/sale/client_name/{name}`: Ventas por nombre de cliente.
    - **GET** `/sale/date_range/`: Ventas por rango de fechas.