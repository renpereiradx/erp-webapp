import React from 'react';

const ProductList = ({ products = [], children = null }) => {
  if (children) return <div data-testid="product-list-wrapper">{children}</div>;

  return (
    <div data-testid="product-list-wrapper">
      {Array.isArray(products) ? (
        <div data-testid="product-list" role="list">
          {products.map((p) => (
            <div key={p.id} data-testid={`product-card-${p.id}`} role="listitem">{p.name || p.description || `Producto ${p.id}`}</div>
          ))}
        </div>
      ) : (
        <div data-testid="product-list-empty">No hay productos</div>
      )}
    </div>
  );
};

export default ProductList;
