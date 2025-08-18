import React from 'react';

const ProductForm = ({ product = {}, onSubmit = () => {}, onCancel = () => {}, loading = false }) => {
  const [form, setForm] = React.useState({
    name: product.name || '',
    description: product.description || '',
    category: product.id_category || '',
    is_active: product.is_active ?? true,
  });

  React.useEffect(() => {
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.id_category || '',
      is_active: product.is_active ?? true,
    });
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} data-testid="product-form" aria-label="Product form">
      <div style={{ padding: 8 }}>
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} data-testid="product-form-name-input" />
      </div>

      <div style={{ padding: 8 }}>
        <label htmlFor="description">Descripción</label>
        <textarea id="description" name="description" value={form.description} onChange={handleChange} data-testid="product-form-description-input" />
      </div>

      <div style={{ padding: 8 }}>
        <label htmlFor="category">Categoría</label>
        <input id="category" name="category" value={form.category} onChange={handleChange} data-testid="product-form-category-input" />
      </div>

      <div style={{ padding: 8 }}>
        <label htmlFor="is_active">Activo</label>
        <input id="is_active" name="is_active" type="checkbox" checked={!!form.is_active} onChange={handleChange} data-testid="product-form-active-checkbox" />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 8 }} data-testid="product-form-actions">
        <button type="button" onClick={onCancel} disabled={loading} data-testid="product-form-cancel">Cancelar</button>
        <button type="submit" disabled={loading} data-testid="product-form-submit">{loading ? '...' : 'Guardar'}</button>
      </div>
    </form>
  );
};

export default ProductForm;
