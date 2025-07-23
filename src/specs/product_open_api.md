# 🧩 Interfaz Generadora para Business Management API

Este documento combina la especificación OpenAPI con la estructura SQL de base de datos. Usá este contenido como prompt para generar una interfaz que permita gestionar los elementos definidos por la API y almacenados en las siguientes tablas.

---

## ⚙️ Requisitos de la Interfaz

La interfaz debe:

- Permitir **crear, editar, listar y eliminar** productos, descripciones, precios y stock.
- Incluir autenticación con JWT (`Authorization: Bearer <token>`).
- Utilizar los ejemplos definidos en la especificación OpenAPI (Swagger).
- Respetar las estructuras reales de base de datos (ver más abajo).

---

## 📘 Especificación OpenAPI
`--- START SWAGGER SPEC ---`
openapi: 3.0.0
info:
  title: Business Management API
  description: Endpoints para gestionar productos, descripciones, precios y stock.
  version: 1.0.0

servers:
  - url: http://localhost:5050
    description: API Local

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Product:
      type: object
      required: [name, id_category]
      properties:
        name:
          type: string
          example: Puma MB.01
        id_category:
          type: integer
          example: 5
        state:
          type: boolean
          example: true

    ProductDescription:
      type: object
      required: [description]
      properties:
        description:
          type: string
          example: Zapatillas deportivas de alto rendimiento con estilo moderno.

    ProductPrice:
      type: object
      required: [cost_price]
      properties:
        cost_price:
          type: number
          format: float
          example: 1250000.00
        sale_price:
          type: number
          format: float
          example: 1500000.00
        tax:
          type: number
          format: float
          example: 21.00

    Stock:
      type: object
      required: [quantity]
      properties:
        quantity:
          type: integer
          example: 25
        exp:
          type: string
          format: date
          example: 2055-02-26
        entity:
          type: object
          properties:
            name:
              type: string
              example: POSTMAN

security:
  - bearerAuth: []

paths:
  /products:
    post:
      summary: Crear producto
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Product'
      responses:
        '201':
          description: Producto creado
    get:
      summary: Obtener productos paginados
      parameters:
        - in: path
          name: page
          required: true
          schema: { type: integer }
          example: 1
        - in: path
          name: pageSize
          required: true
          schema: { type: integer }
          example: 10
      responses:
        '200':
          description: Lista de productos

  /products/{productId}:
    get:
      summary: Obtener producto por ID
      parameters:
        - name: productId
          in: path
          required: true
          schema: { type: string }
          example: bcYdWdKNR
      responses:
        '200':
          description: Detalles del producto
    put:
      summary: Actualizar producto
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Product'
      responses:
        '200':
          description: Producto actualizado

  /products/delete/{productId}:
    put:
      summary: Eliminar producto (soft delete)
      parameters:
        - name: productId
          in: path
          required: true
          schema: { type: string }
          example: 2rr9sbbqEtNE7L2ZAti0TNr8Yn9
      responses:
        '200':
          description: Producto eliminado

  /product_description/{productId}:
    post:
      summary: Crear descripción de producto
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductDescription'
      responses:
        '201':
          description: Descripción creada

  /product_description/{descId}:
    get:
      summary: Obtener descripción por ID
      parameters:
        - name: descId
          in: path
          required: true
          schema: { type: string }
          example: 8
      responses:
        '200':
          description: Detalles de la descripción
    put:
      summary: Actualizar descripción
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductDescription'
      responses:
        '200':
          description: Descripción actualizada

  /product_price/product_id/{productId}:
    post:
      summary: Insertar precio por Product ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductPrice'
      responses:
        '201':
          description: Precio creado
    put:
      summary: Actualizar precio por Product ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductPrice'
      responses:
        '200':
          description: Precio actualizado

  /product_price/id/{priceId}:
    put:
      summary: Actualizar precio por Price ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductPrice'
      responses:
        '200':
          description: Precio actualizado

  /stock/{productId}:
    post:
      summary: Insertar stock
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Stock'
      responses:
        '201':
          description: Stock creado

  /stock/product_id/{productId}:
    get:
      summary: Obtener stock por Product ID
      parameters:
        - name: productId
          in: path
          required: true
          schema: { type: string }
          example: bcYdWdKNR
      responses:
        '200':
          description: Lista de stock
    put:
      summary: Actualizar stock por Product ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Stock'
      responses:
        '200':
          description: Stock actualizado

  /stock/{stockId}:
    get:
      summary: Obtener stock por ID
      parameters:
        - name: stockId
          in: path
          required: true
          schema: { type: string }
          example: 2
      responses:
        '200':
          description: Detalles del stock
    put:
      summary: Actualizar stock por ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Stock'
      responses:
        '200':
          description: Stock actualizado
`--- END SWAGGER SPECT ---`
---

## 🗃️ Estructura SQL

Estas son las definiciones reales de base de datos para los recursos gestionables:

### 🧾 products.products

```sql
CREATE TABLE IF NOT EXISTS products.products (
  id VARCHAR(27) NOT NULL,
  name VARCHAR(100) NOT NULL,
  state BOOLEAN DEFAULT true,
  id_category INTEGER,
  id_user VARCHAR(27),
  product_type VARCHAR(10),
  CONSTRAINT pk_products PRIMARY KEY (id),
  CONSTRAINT unq_products UNIQUE (name),
  CONSTRAINT fk_products_categories FOREIGN KEY (id_category)
    REFERENCES public.categories (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_products_users FOREIGN KEY (id_user)
    REFERENCES users.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT products_product_type_check CHECK (
    product_type IN ('PHYSICAL', 'SERVICE')
  )
);
CREATE TABLE IF NOT EXISTS products.products_descriptions (
  id SERIAL PRIMARY KEY,
  id_product VARCHAR(27),
  description TEXT,
  effective_date TIMESTAMP,
  id_user VARCHAR(27),
  CONSTRAINT fk_products_descriptions_products FOREIGN KEY (id_product)
    REFERENCES products.products (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_products_descriptions_users FOREIGN KEY (id_user)
    REFERENCES users.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS products.stock (
  id SERIAL PRIMARY KEY,
  id_product VARCHAR(27),
  quantity INTEGER,
  id_user VARCHAR(27),
  effective_date TIMESTAMP DEFAULT now(),
  metadata JSONB,
  CONSTRAINT uq_stock_product UNIQUE (id_product),
  CONSTRAINT fk_stock_products FOREIGN KEY (id_product)
    REFERENCES products.products (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_stock_users FOREIGN KEY (id_user)
    REFERENCES users.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS products.prices (
  id INTEGER PRIMARY KEY,
  id_product VARCHAR(27) NOT NULL,
  purchase_price NUMERIC(10,2),
  effective_date TIMESTAMP NOT NULL DEFAULT now(),
  last_updated_by VARCHAR(27),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  metadata JSONB,
  CONSTRAINT uq_prices_product UNIQUE (id_product),
  CONSTRAINT fk_prices_last_updated_by FOREIGN KEY (last_updated_by)
    REFERENCES users.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_prices_products FOREIGN KEY (id_product)
    REFERENCES products.products (id) ON UPDATE RESTRICT ON DELETE RESTRICT
);```