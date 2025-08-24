/**
 * Products Components Testing - Wave 8 Component Tests
 * Tests para componentes de gestión de productos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

// Mock de hooks y servicios
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

// Componente de tarjeta de producto
const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onAddToCart, 
  showActions = true 
}) => {
  const { id, name, price, stock, category, description } = product;
  
  return (
    <div 
      data-testid={`product-card-${id}`} 
      className="product-card"
    >
      <div className="product-info">
        <h3 data-testid="product-name">{name}</h3>
        <p data-testid="product-price">€{price}</p>
        <p data-testid="product-stock">Stock: {stock}</p>
        <p data-testid="product-category">{category}</p>
        {description && (
          <p data-testid="product-description">{description}</p>
        )}
      </div>
      
      {showActions && (
        <div className="product-actions" data-testid="product-actions">
          {onEdit && (
            <button 
              data-testid="edit-product-btn"
              onClick={() => onEdit(product)}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button 
              data-testid="delete-product-btn"
              onClick={() => onDelete(product.id)}
            >
              Eliminar
            </button>
          )}
          {onAddToCart && (
            <button 
              data-testid="add-to-cart-btn"
              onClick={() => onAddToCart(product)}
              disabled={stock === 0}
            >
              {stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de búsqueda de productos
const ProductSearch = ({ onSearch, onFilterChange, placeholder = "Buscar productos..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    onFilterChange({ category: value });
  };

  return (
    <div data-testid="product-search" className="product-search">
      <div className="search-input">
        <input
          data-testid="search-input"
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
        />
      </div>
      
      <div className="filter-select">
        <select
          data-testid="category-filter"
          value={category}
          onChange={handleCategoryChange}
        >
          <option value="">Todas las categorías</option>
          <option value="electronics">Electrónicos</option>
          <option value="clothing">Ropa</option>
          <option value="books">Libros</option>
          <option value="home">Hogar</option>
        </select>
      </div>
    </div>
  );
};

// Componente de formulario de producto
const ProductForm = ({ 
  product = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    stock: product?.stock || '',
    category: product?.category || '',
    description: product?.description || ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }
    
    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }
    
    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10)
      });
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <form 
      data-testid="product-form" 
      onSubmit={handleSubmit}
      className="product-form"
    >
      <div className="form-group">
        <label htmlFor="product-name">Nombre del Producto</label>
        <input
          id="product-name"
          data-testid="name-input"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          disabled={loading}
        />
        {errors.name && (
          <span data-testid="name-error" className="error">{errors.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="product-price">Precio</label>
        <input
          id="product-price"
          data-testid="price-input"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange('price')}
          disabled={loading}
        />
        {errors.price && (
          <span data-testid="price-error" className="error">{errors.price}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="product-stock">Stock</label>
        <input
          id="product-stock"
          data-testid="stock-input"
          type="number"
          min="0"
          value={formData.stock}
          onChange={handleChange('stock')}
          disabled={loading}
        />
        {errors.stock && (
          <span data-testid="stock-error" className="error">{errors.stock}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="product-category">Categoría</label>
        <select
          id="product-category"
          data-testid="category-input"
          value={formData.category}
          onChange={handleChange('category')}
          disabled={loading}
        >
          <option value="">Seleccionar categoría</option>
          <option value="electronics">Electrónicos</option>
          <option value="clothing">Ropa</option>
          <option value="books">Libros</option>
          <option value="home">Hogar</option>
        </select>
        {errors.category && (
          <span data-testid="category-error" className="error">{errors.category}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="product-description">Descripción</label>
        <textarea
          id="product-description"
          data-testid="description-input"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="form-actions" data-testid="form-actions">
        <button
          type="submit"
          data-testid="submit-btn"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
        </button>
        
        {onCancel && (
          <button
            type="button"
            data-testid="cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

// Lista de productos
const ProductList = ({ 
  products = [], 
  loading = false, 
  error = null,
  onEdit,
  onDelete,
  onAddToCart
}) => {
  if (loading) {
    return <div data-testid="products-loading">Cargando productos...</div>;
  }

  if (error) {
    return (
      <div data-testid="products-error" className="error" role="alert">
        Error: {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div data-testid="products-empty" className="empty-state">
        No se encontraron productos
      </div>
    );
  }

  return (
    <div data-testid="products-list" className="products-list">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

describe('Wave 8 - Products Component Testing Suite', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Laptop HP',
      price: 899.99,
      stock: 5,
      category: 'electronics',
      description: 'Laptop para oficina'
    },
    {
      id: 2,
      name: 'Camiseta Nike',
      price: 29.99,
      stock: 0,
      category: 'clothing',
      description: 'Camiseta deportiva'
    },
    {
      id: 3,
      name: 'Libro JavaScript',
      price: 45.50,
      stock: 12,
      category: 'books'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProductCard Component', () => {
    it('should render product information correctly', () => {
      const product = mockProducts[0];
      
      render(
        <ProductCard 
          product={product}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onAddToCart={vi.fn()}
        />
      );

      expect(screen.getByTestId('product-name')).toHaveTextContent('Laptop HP');
      expect(screen.getByTestId('product-price')).toHaveTextContent('€899.99');
      expect(screen.getByTestId('product-stock')).toHaveTextContent('Stock: 5');
      expect(screen.getByTestId('product-category')).toHaveTextContent('electronics');
      expect(screen.getByTestId('product-description')).toHaveTextContent('Laptop para oficina');
    });

    it('should handle product without description', () => {
      const product = mockProducts[2]; // No tiene description
      
      render(<ProductCard product={product} />);
      
      expect(screen.getByTestId('product-name')).toHaveTextContent('Libro JavaScript');
      expect(screen.queryByTestId('product-description')).not.toBeInTheDocument();
    });

    it('should call action handlers correctly', () => {
      const mockEdit = vi.fn();
      const mockDelete = vi.fn();
      const mockAddToCart = vi.fn();
      const product = mockProducts[0];
      
      render(
        <ProductCard 
          product={product}
          onEdit={mockEdit}
          onDelete={mockDelete}
          onAddToCart={mockAddToCart}
        />
      );

      fireEvent.click(screen.getByTestId('edit-product-btn'));
      expect(mockEdit).toHaveBeenCalledWith(product);

      fireEvent.click(screen.getByTestId('delete-product-btn'));
      expect(mockDelete).toHaveBeenCalledWith(product.id);

      fireEvent.click(screen.getByTestId('add-to-cart-btn'));
      expect(mockAddToCart).toHaveBeenCalledWith(product);
    });

    it('should disable add to cart when out of stock', () => {
      const product = mockProducts[1]; // stock: 0
      
      render(
        <ProductCard 
          product={product}
          onAddToCart={vi.fn()}
        />
      );

      const addToCartBtn = screen.getByTestId('add-to-cart-btn');
      expect(addToCartBtn).toBeDisabled();
      expect(addToCartBtn).toHaveTextContent('Sin Stock');
    });

    it('should hide actions when showActions is false', () => {
      render(
        <ProductCard 
          product={mockProducts[0]}
          showActions={false}
        />
      );

      expect(screen.queryByTestId('product-actions')).not.toBeInTheDocument();
    });
  });

  describe('ProductSearch Component', () => {
    it('should render search elements correctly', () => {
      render(
        <ProductSearch 
          onSearch={vi.fn()} 
          onFilterChange={vi.fn()} 
        />
      );

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
    });

    it('should call onSearch when typing', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();
      
      render(
        <ProductSearch 
          onSearch={mockOnSearch} 
          onFilterChange={vi.fn()} 
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'laptop');

      expect(mockOnSearch).toHaveBeenCalledWith('laptop');
    });

    it('should call onFilterChange when selecting category', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      
      render(
        <ProductSearch 
          onSearch={vi.fn()} 
          onFilterChange={mockOnFilterChange} 
        />
      );

      const categorySelect = screen.getByTestId('category-filter');
      await user.selectOptions(categorySelect, 'electronics');

      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: 'electronics' });
    });

    it('should use custom placeholder', () => {
      render(
        <ProductSearch 
          onSearch={vi.fn()} 
          onFilterChange={vi.fn()}
          placeholder="Buscar por nombre..."
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nombre...')).toBeInTheDocument();
    });
  });

  describe('ProductForm Component', () => {
    it('should render form fields correctly', () => {
      render(
        <ProductForm 
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('price-input')).toBeInTheDocument();
      expect(screen.getByTestId('stock-input')).toBeInTheDocument();
      expect(screen.getByTestId('category-input')).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Crear');
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    it('should populate form with existing product data', () => {
      const product = mockProducts[0];
      
      render(
        <ProductForm 
          product={product}
          onSubmit={vi.fn()} 
        />
      );

      expect(screen.getByTestId('name-input')).toHaveValue('Laptop HP');
      expect(screen.getByTestId('price-input')).toHaveValue(899.99);
      expect(screen.getByTestId('stock-input')).toHaveValue(5);
      expect(screen.getByTestId('category-input')).toHaveValue('electronics');
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Actualizar');
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      
      render(
        <ProductForm onSubmit={mockOnSubmit} />
      );

      await user.click(screen.getByTestId('submit-btn'));

      expect(screen.getByTestId('name-error')).toHaveTextContent('El nombre es requerido');
      expect(screen.getByTestId('price-error')).toHaveTextContent('El precio debe ser mayor a 0');
      expect(screen.getByTestId('category-error')).toHaveTextContent('La categoría es requerida');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      
      render(
        <ProductForm onSubmit={mockOnSubmit} />
      );

      await user.type(screen.getByTestId('name-input'), 'Test Product');
      await user.type(screen.getByTestId('price-input'), '19.99');
      await user.type(screen.getByTestId('stock-input'), '10');
      await user.selectOptions(screen.getByTestId('category-input'), 'electronics');
      await user.type(screen.getByTestId('description-input'), 'Test description');

      await user.click(screen.getByTestId('submit-btn'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        price: 19.99,
        stock: 10,
        category: 'electronics',
        description: 'Test description'
      });
    });

    it('should handle loading state', () => {
      render(
        <ProductForm 
          onSubmit={vi.fn()}
          loading={true}
        />
      );

      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Guardando...');
      expect(screen.getByTestId('name-input')).toBeDisabled();
    });
  });

  describe('ProductList Component', () => {
    it('should render list of products', () => {
      render(
        <ProductList 
          products={mockProducts}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onAddToCart={vi.fn()}
        />
      );

      expect(screen.getByTestId('products-list')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<ProductList loading={true} />);
      
      expect(screen.getByTestId('products-loading')).toHaveTextContent('Cargando productos...');
    });

    it('should show error state', () => {
      render(<ProductList error="Failed to load products" />);
      
      const errorElement = screen.getByTestId('products-error');
      expect(errorElement).toHaveTextContent('Error: Failed to load products');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('should show empty state', () => {
      render(<ProductList products={[]} />);
      
      expect(screen.getByTestId('products-empty')).toHaveTextContent('No se encontraron productos');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate search with product list', async () => {
      const user = userEvent.setup();
      const [searchTerm, setSearchTerm] = ['', vi.fn()];
      const [filteredProducts, setFilteredProducts] = [mockProducts, vi.fn()];
      
      const IntegratedComponent = () => {
        const [products, setProducts] = useState(mockProducts);
        
        const handleSearch = (term) => {
          const filtered = mockProducts.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase())
          );
          setProducts(filtered);
        };
        
        return (
          <div>
            <ProductSearch 
              onSearch={handleSearch}
              onFilterChange={vi.fn()}
            />
            <ProductList products={products} />
          </div>
        );
      };
      
      render(<IntegratedComponent />);
      
      // Initially all products should be visible
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      
      // Search for 'laptop'
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'laptop');
      
      // Only laptop should be visible
      await waitFor(() => {
        expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
        expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument();
      });
    });
  });
});
