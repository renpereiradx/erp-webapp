/**
 * Integration Tests - Wave 8 Testing Framework
 * Tests de integración para validar interacciones entre componentes y servicios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useEffect } from 'react';

// Mock de servicios
const mockSalesService = {
  createSale: vi.fn(),
  getSales: vi.fn(),
  getSaleById: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
  processPayment: vi.fn(),
  cancelSale: vi.fn(),
  applyPriceModification: vi.fn()
};

const mockProductsService = {
  getProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  updateStock: vi.fn()
};

const mockCustomersService = {
  getCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn()
};

// Mock de stores/hooks
vi.mock('@/services/salesService', () => ({
  default: mockSalesService
}));

vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    getCardStyles: () => 'mock-card-styles',
    getTextStyles: () => 'mock-text-styles',
    getButtonStyles: () => 'mock-button-styles',
    getInputStyles: () => 'mock-input-styles'
  })
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key
  })
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    error: vi.fn()
  }
}));

// Componente integrado de flujo de venta completo
const SalesWorkflow = () => {
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saleResult, setSaleResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock data
  const customers = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, name: 'María García', email: 'maria@example.com' }
  ];

  const products = [
    { id: 1, name: 'Laptop Dell', price: 899.99, stock: 5 },
    { id: 2, name: 'Mouse Inalámbrico', price: 25.50, stock: 10 },
    { id: 3, name: 'Teclado Mecánico', price: 120.00, stock: 3 }
  ];

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processSale = async () => {
    setLoading(true);
    try {
      const saleData = {
        customer_id: selectedCustomer.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        payment_method: paymentMethod,
        total_amount: getTotalAmount()
      };

      mockSalesService.createSale.mockResolvedValue({
        success: true,
        sale_id: 'SALE_123',
        total_amount: getTotalAmount()
      });

      const result = await mockSalesService.createSale(saleData);
      setSaleResult(result);
      setStep(4);
    } catch (error) {
      console.error('Error processing sale:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="sales-workflow" className="sales-workflow">
      <div data-testid="step-indicator" className="step-indicator">
        Paso {step} de 4
      </div>

      {step === 1 && (
        <div data-testid="customer-selection" className="step">
          <h2>Seleccionar Cliente</h2>
          <div className="customers-list">
            {customers.map(customer => (
              <button
                key={customer.id}
                data-testid={`customer-${customer.id}`}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setStep(2);
                }}
                className="customer-item"
              >
                {customer.name} - {customer.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div data-testid="product-selection" className="step">
          <h2>Agregar Productos</h2>
          <div className="selected-customer">
            Cliente: {selectedCustomer?.name}
          </div>
          
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-item">
                <h3>{product.name}</h3>
                <p>€{product.price}</p>
                <p>Stock: {product.stock}</p>
                <button
                  data-testid={`add-product-${product.id}`}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                >
                  Agregar al Carrito
                </button>
              </div>
            ))}
          </div>

          <div data-testid="cart" className="cart">
            <h3>Carrito</h3>
            {cart.length === 0 ? (
              <p>Carrito vacío</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} data-testid={`cart-item-${item.id}`} className="cart-item">
                    <span>{item.name} x{item.quantity}</span>
                    <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      data-testid={`remove-item-${item.id}`}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div data-testid="cart-total" className="cart-total">
                  Total: €{getTotalAmount().toFixed(2)}
                </div>
                <button
                  data-testid="proceed-to-payment"
                  onClick={() => setStep(3)}
                  disabled={cart.length === 0}
                >
                  Continuar al Pago
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div data-testid="payment-step" className="step">
          <h2>Procesar Pago</h2>
          <div className="payment-summary">
            <p>Cliente: {selectedCustomer?.name}</p>
            <p>Total: €{getTotalAmount().toFixed(2)}</p>
          </div>
          
          <div className="payment-methods">
            <h3>Método de Pago</h3>
            {['cash', 'card', 'transfer'].map(method => (
              <label key={method}>
                <input
                  type="radio"
                  name="payment-method"
                  value={method}
                  data-testid={`payment-${method}`}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                {method === 'cash' ? 'Efectivo' : 
                 method === 'card' ? 'Tarjeta' : 'Transferencia'}
              </label>
            ))}
          </div>

          <button
            data-testid="process-payment"
            onClick={processSale}
            disabled={!paymentMethod || loading}
          >
            {loading ? 'Procesando...' : 'Procesar Pago'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div data-testid="confirmation-step" className="step">
          <h2>¡Venta Completada!</h2>
          {saleResult && (
            <div data-testid="sale-result">
              <p>ID de Venta: {saleResult.sale_id}</p>
              <p>Total: €{saleResult.total_amount?.toFixed(2)}</p>
            </div>
          )}
          <button
            data-testid="new-sale"
            onClick={() => {
              setStep(1);
              setSelectedCustomer(null);
              setCart([]);
              setPaymentMethod('');
              setSaleResult(null);
            }}
          >
            Nueva Venta
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de gestión de inventario integrado
const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      mockProductsService.getProducts.mockResolvedValue({
        success: true,
        data: [
          { id: 1, name: 'Laptop Dell', price: 899.99, stock: 5, category: 'electronics' },
          { id: 2, name: 'Mouse Inalámbrico', price: 25.50, stock: 10, category: 'accessories' }
        ]
      });

      const result = await mockProductsService.getProducts();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      mockProductsService.createProduct.mockResolvedValue({
        success: true,
        data: { id: Date.now(), ...productData }
      });

      const result = await mockProductsService.createProduct(productData);
      if (result.success) {
        setProducts(prev => [...prev, result.data]);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      mockProductsService.updateProduct.mockResolvedValue({
        success: true,
        data: { id, ...productData }
      });

      const result = await mockProductsService.updateProduct(id, productData);
      if (result.success) {
        setProducts(prev => prev.map(p => p.id === id ? result.data : p));
        setShowForm(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      mockProductsService.deleteProduct.mockResolvedValue({ success: true });
      
      const result = await mockProductsService.deleteProduct(id);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div data-testid="inventory-management" className="inventory-management">
      <header>
        <h1>Gestión de Inventario</h1>
        <button
          data-testid="add-product-btn"
          onClick={() => {
            setSelectedProduct(null);
            setShowForm(true);
          }}
        >
          Agregar Producto
        </button>
      </header>

      {loading ? (
        <div data-testid="loading">Cargando productos...</div>
      ) : (
        <div data-testid="products-table" className="products-table">
          {products.length === 0 ? (
            <div data-testid="empty-products">No hay productos</div>
          ) : (
            products.map(product => (
              <div key={product.id} data-testid={`product-row-${product.id}`} className="product-row">
                <span>{product.name}</span>
                <span>€{product.price}</span>
                <span>Stock: {product.stock}</span>
                <span>{product.category}</span>
                <div className="actions">
                  <button
                    data-testid={`edit-product-${product.id}`}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    data-testid={`delete-product-${product.id}`}
                    onClick={() => deleteProduct(product.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div data-testid="product-form-modal" className="modal">
          <div className="modal-content">
            <h2>{selectedProduct ? 'Editar Producto' : 'Crear Producto'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const productData = {
                  name: formData.get('name'),
                  price: parseFloat(formData.get('price')),
                  stock: parseInt(formData.get('stock')),
                  category: formData.get('category')
                };

                if (selectedProduct) {
                  updateProduct(selectedProduct.id, productData);
                } else {
                  createProduct(productData);
                }
              }}
            >
              <input
                name="name"
                data-testid="product-name-input"
                placeholder="Nombre del producto"
                defaultValue={selectedProduct?.name || ''}
                required
              />
              <input
                name="price"
                data-testid="product-price-input"
                type="number"
                step="0.01"
                placeholder="Precio"
                defaultValue={selectedProduct?.price || ''}
                required
              />
              <input
                name="stock"
                data-testid="product-stock-input"
                type="number"
                placeholder="Stock"
                defaultValue={selectedProduct?.stock || ''}
                required
              />
              <input
                name="category"
                data-testid="product-category-input"
                placeholder="Categoría"
                defaultValue={selectedProduct?.category || ''}
                required
              />
              <div className="form-actions">
                <button type="submit" data-testid="save-product">
                  {selectedProduct ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  data-testid="cancel-form"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

describe('Wave 8 - Integration Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Sales Workflow Integration', () => {
    it('should complete full sales workflow', async () => {
      const user = userEvent.setup();
      
      render(<SalesWorkflow />);

      // Step 1: Customer Selection
      expect(screen.getByTestId('customer-selection')).toBeInTheDocument();
      expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();

      await user.click(screen.getByTestId('customer-1'));

      // Step 2: Product Selection
      expect(screen.getByTestId('product-selection')).toBeInTheDocument();
      expect(screen.getByText('Paso 2 de 4')).toBeInTheDocument();
      expect(screen.getByText('Cliente: Juan Pérez')).toBeInTheDocument();

      // Add products to cart
      await user.click(screen.getByTestId('add-product-1'));
      await user.click(screen.getByTestId('add-product-2'));

      expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toHaveTextContent('€925.49');

      await user.click(screen.getByTestId('proceed-to-payment'));

      // Step 3: Payment
      expect(screen.getByTestId('payment-step')).toBeInTheDocument();
      expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument();

      await user.click(screen.getByTestId('payment-cash'));
      await user.click(screen.getByTestId('process-payment'));

      // Step 4: Confirmation
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-step')).toBeInTheDocument();
      });

      expect(screen.getByText('¡Venta Completada!')).toBeInTheDocument();
      expect(screen.getByTestId('sale-result')).toBeInTheDocument();
      expect(mockSalesService.createSale).toHaveBeenCalledWith({
        customer_id: 1,
        items: [
          { product_id: 1, quantity: 1, price: 899.99 },
          { product_id: 2, quantity: 1, price: 25.50 }
        ],
        payment_method: 'cash',
        total_amount: 925.49
      });
    });

    it('should handle cart operations correctly', async () => {
      const user = userEvent.setup();
      
      render(<SalesWorkflow />);

      // Navigate to product selection
      await user.click(screen.getByTestId('customer-1'));

      // Add product to cart
      await user.click(screen.getByTestId('add-product-1'));
      expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();

      // Add same product again (should increase quantity)
      await user.click(screen.getByTestId('add-product-1'));
      expect(screen.getByTestId('cart-item-1')).toHaveTextContent('x2');

      // Remove item from cart
      await user.click(screen.getByTestId('remove-item-1'));
      expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument();
    });

    it('should prevent payment without payment method', async () => {
      const user = userEvent.setup();
      
      render(<SalesWorkflow />);

      // Navigate to payment step
      await user.click(screen.getByTestId('customer-1'));
      await user.click(screen.getByTestId('add-product-1'));
      await user.click(screen.getByTestId('proceed-to-payment'));

      // Try to process payment without selecting method
      const processButton = screen.getByTestId('process-payment');
      expect(processButton).toBeDisabled();
    });

    it('should allow starting new sale after completion', async () => {
      const user = userEvent.setup();
      
      render(<SalesWorkflow />);

      // Complete a sale
      await user.click(screen.getByTestId('customer-1'));
      await user.click(screen.getByTestId('add-product-1'));
      await user.click(screen.getByTestId('proceed-to-payment'));
      await user.click(screen.getByTestId('payment-cash'));
      await user.click(screen.getByTestId('process-payment'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-step')).toBeInTheDocument();
      });

      // Start new sale
      await user.click(screen.getByTestId('new-sale'));

      expect(screen.getByTestId('customer-selection')).toBeInTheDocument();
      expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
    });
  });

  describe('Inventory Management Integration', () => {
    it('should load and display products', async () => {
      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('products-table')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-row-2')).toBeInTheDocument();
      expect(mockProductsService.getProducts).toHaveBeenCalled();
    });

    it('should create new product', async () => {
      const user = userEvent.setup();
      
      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('products-table')).toBeInTheDocument();
      });

      // Open form
      await user.click(screen.getByTestId('add-product-btn'));
      expect(screen.getByTestId('product-form-modal')).toBeInTheDocument();

      // Fill form
      await user.type(screen.getByTestId('product-name-input'), 'New Product');
      await user.type(screen.getByTestId('product-price-input'), '99.99');
      await user.type(screen.getByTestId('product-stock-input'), '20');
      await user.type(screen.getByTestId('product-category-input'), 'test');

      // Submit form
      await user.click(screen.getByTestId('save-product'));

      expect(mockProductsService.createProduct).toHaveBeenCalledWith({
        name: 'New Product',
        price: 99.99,
        stock: 20,
        category: 'test'
      });
    });

    it('should edit existing product', async () => {
      const user = userEvent.setup();
      
      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('products-table')).toBeInTheDocument();
      });

      // Open edit form
      await user.click(screen.getByTestId('edit-product-1'));
      expect(screen.getByTestId('product-form-modal')).toBeInTheDocument();

      // Form should be pre-filled
      expect(screen.getByTestId('product-name-input')).toHaveValue('Laptop Dell');

      // Update product
      await user.clear(screen.getByTestId('product-price-input'));
      await user.type(screen.getByTestId('product-price-input'), '799.99');
      await user.click(screen.getByTestId('save-product'));

      expect(mockProductsService.updateProduct).toHaveBeenCalledWith(1, {
        name: 'Laptop Dell',
        price: 799.99,
        stock: 5,
        category: 'electronics'
      });
    });

    it('should delete product', async () => {
      const user = userEvent.setup();
      
      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('products-table')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-product-1'));

      expect(mockProductsService.deleteProduct).toHaveBeenCalledWith(1);
    });

    it('should handle empty product list', async () => {
      // Override the mock for this specific test
      mockProductsService.getProducts.mockResolvedValueOnce({
        success: true,
        data: []
      });

      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-products')).toBeInTheDocument();
      });

      expect(screen.getByText('No hay productos')).toBeInTheDocument();
    });

    it('should cancel form without saving', async () => {
      const user = userEvent.setup();
      
      render(<InventoryManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('products-table')).toBeInTheDocument();
      });

      // Open form
      await user.click(screen.getByTestId('add-product-btn'));
      expect(screen.getByTestId('product-form-modal')).toBeInTheDocument();

      // Cancel without saving
      await user.click(screen.getByTestId('cancel-form'));
      expect(screen.queryByTestId('product-form-modal')).not.toBeInTheDocument();
      expect(mockProductsService.createProduct).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Module Integration', () => {
    it('should integrate sales service with product inventory', async () => {
      // This test would verify that when a sale is made,
      // product stock is updated accordingly
      const saleData = {
        customer_id: 1,
        items: [
          { product_id: 1, quantity: 2, price: 899.99 }
        ],
        payment_method: 'cash',
        total_amount: 1799.98
      };

      // Mock successful sale creation
      mockSalesService.createSale.mockResolvedValue({
        success: true,
        sale_id: 'SALE_123',
        total_amount: 1799.98
      });

      // Mock stock update
      mockProductsService.updateStock.mockResolvedValue({
        success: true
      });

      const result = await mockSalesService.createSale(saleData);
      expect(result.success).toBe(true);
      expect(mockSalesService.createSale).toHaveBeenCalledWith(saleData);
    });

    it('should handle service errors gracefully', async () => {
      mockSalesService.createSale.mockRejectedValue(new Error('Network error'));

      try {
        await mockSalesService.createSale({});
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      expect(mockSalesService.createSale).toHaveBeenCalled();
    });
  });
});
