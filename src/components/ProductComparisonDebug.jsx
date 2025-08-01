/**
 * Componente de debugging para comparar productos obtenidos por ID vs nombre
 */

import React, { useState } from 'react';
import { productService } from '@/services/productService';
import BusinessManagementAPI from '@/services/BusinessManagementAPI';

const ProductComparisonDebug = () => {
  const [productById, setProductById] = useState(null);
  const [productByName, setProductByName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testProductId = 'PROD_BANANA_001';
  const testProductName = 'Banana';

  const fetchProductById = async () => {
    setLoading(true);
    setError('');
    try {
      const api = new BusinessManagementAPI();
      const product = await api.getProductById(testProductId);
      setProductById(product);
      console.log('Producto por ID:', product);
    } catch (err) {
      setError(`Error al obtener por ID: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductByName = async () => {
    setLoading(true);
    setError('');
    try {
      const api = new BusinessManagementAPI();
      const products = await api.searchProductsByName(testProductName);
      const product = Array.isArray(products) ? products[0] : products;
      setProductByName(product);
      console.log('Producto por nombre:', product);
    } catch (err) {
      setError(`Error al obtener por nombre: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoth = async () => {
    await fetchProductById();
    await fetchProductByName();
  };

  const renderProductData = (product, title) => {
    if (!product) return null;

    const enrichedData = {
      '_enriched': product._enriched,
      '_source': product._source,
      'has_unit_pricing': product.has_unit_pricing,
      'has_valid_price': product.has_valid_price,
      'has_valid_stock': product.has_valid_stock,
      'price_formatted': product.price_formatted,
      'stock_status': product.stock_status,
      'stock_quantity': product.stock_quantity,
      'unit_prices': product.unit_prices ? `${product.unit_prices.length} precios` : 'undefined',
      'category': product.category ? 'Objeto completo' : 'undefined'
    };

    return (
      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '16px 0',
        backgroundColor: product._enriched ? '#e8f5e8' : '#fff5f5'
      }}>
        <h3 style={{ 
          color: product._enriched ? '#059669' : '#dc2626',
          marginBottom: '12px'
        }}>
          {title} {product._enriched ? '✅ Enriquecido' : '❌ No Enriquecido'}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.875rem' }}>
          {Object.entries(enrichedData).map(([key, value]) => (
            <div key={key} style={{ 
              padding: '4px 8px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>

        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Ver estructura completa
          </summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(product, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 Debug: Comparación de Productos</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Producto de prueba:</strong> {testProductId} / {testProductName}</p>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={fetchProductById}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Obtener por ID
          </button>
          
          <button
            onClick={fetchProductByName}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Obtener por Nombre
          </button>
          
          <button
            onClick={fetchBoth}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Obtener Ambos
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          Cargando...
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {renderProductData(productById, 'Producto por ID')}
        </div>
        <div>
          {renderProductData(productByName, 'Producto por Nombre')}
        </div>
      </div>

      {productById && productByName && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>📊 Comparación de Campos Enriquecidos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.875rem' }}>
            <div><strong>Campo</strong></div>
            <div><strong>Por ID</strong></div>
            <div><strong>Por Nombre</strong></div>
            
            {['_enriched', 'has_unit_pricing', 'has_valid_price', 'price_formatted', 'stock_status', 'unit_prices'].map(field => (
              <React.Fragment key={field}>
                <div style={{ fontWeight: 'bold' }}>{field}</div>
                <div style={{ 
                  color: productById[field] !== undefined ? '#059669' : '#dc2626' 
                }}>
                  {String(productById[field] !== undefined ? productById[field] : 'undefined')}
                </div>
                <div style={{ 
                  color: productByName[field] !== undefined ? '#059669' : '#dc2626' 
                }}>
                  {String(productByName[field] !== undefined ? productByName[field] : 'undefined')}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductComparisonDebug;
