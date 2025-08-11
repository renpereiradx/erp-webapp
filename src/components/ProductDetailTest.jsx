/**
 * Componente de prueba para verificar el funcionamiento del hook useProductDetail
 * y los mensajes de éxito/error mejorados
 */

import React, { useState, Suspense } from 'react';
const ProductDetailModal = React.lazy(() => import('@/components/ProductDetailModal'));
import { useProduct } from '@/hooks/useProductDetail';

const ProductDetailTest = () => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { product, loading, error } = useProduct(selectedProductId, true);

  const testProducts = [
    'PROD_BANANA_001',
    'bcYdWdKNR', // Puma MB.01
    'PROD_TEST_001'
  ];

  const handleTestProduct = (productId) => {
    setSelectedProductId(productId);
    if (productId) {
      setTimeout(() => setShowModal(true), 500); // Dar tiempo para cargar
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Prueba de Hook useProductDetail</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Productos de Prueba:</h3>
        {testProducts.map(productId => (
          <button
            key={productId}
            onClick={() => handleTestProduct(productId)}
            style={{
              margin: '5px',
              padding: '10px 15px',
              backgroundColor: selectedProductId === productId ? '#007bff' : '#f8f9fa',
              color: selectedProductId === productId ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {productId}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          Cargando producto {selectedProductId}...
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          Error: {error}
        </div>
      )}

      {product && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          <h4>Producto Cargado:</h4>
          <p><strong>ID:</strong> {product.id}</p>
          <p><strong>Nombre:</strong> {product.name}</p>
          <p><strong>Precio:</strong> {product.price_formatted || `$${product.price || 0}`}</p>
          <p><strong>Stock:</strong> {product.stock_quantity} ({product.stock_status || 'N/A'})</p>
          <p><strong>Categoría:</strong> {product.category_name || 'N/A'}</p>
          <p><strong>Enriquecido:</strong> {product._enriched ? 'Sí' : 'No'}</p>
          
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Abrir Modal de Detalles
          </button>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && product && (
          <Suspense fallback={null}>
            <ProductDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          product={product}
          onRefresh={() => {
            // Refresh logic if needed
            console.log('Refrescando producto...');
          }}
            />
          </Suspense>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px' 
      }}>
        <h4>Instrucciones de Prueba:</h4>
        <ol>
          <li>Selecciona un producto de la lista para cargarlo</li>
          <li>Verifica que se muestren los datos enriquecidos</li>
          <li>Abre el modal para probar la edición de descripción</li>
          <li>Verifica que aparezcan los mensajes de éxito/error mejorados</li>
          <li>Prueba las diferentes pestañas del modal</li>
        </ol>
      </div>
    </div>
  );
};

export default ProductDetailTest;
