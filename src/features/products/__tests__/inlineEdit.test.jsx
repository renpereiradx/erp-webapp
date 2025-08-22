import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProductCard from '@/features/products/components/ProductCard';
import useProductStore from '@/store/useProductStore';
import { productService } from '@/services/productService';

// Rationale: se usan data-testid para los campos editable-* en lugar de queries por label/role
// porque los labels dependen de i18n (traducciones / fallback keys) y cambios de copy
// provocaron inestabilidad previa. data-testid fija una ancla estable para tests de validación.
// También evita coupling con resolvedLabel interno de EditableField.

vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({ card: () => 'card', button: () => 'btn', header: () => () => 'hdr', label: () => 'lbl' })
}));
vi.mock('@/services/productService', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    productService: {
      ...mod.productService,
      updateProduct: vi.fn(async (id, data) => ({ id, ...data }))
    }
  };
});
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (k) => ({
      'action.edit': 'Editar',
      'products.inline.save': 'OK',
      'products.inline.cancel': 'X',
      'field.name': 'Nombre',
      'field.price': 'Precio',
      'field.stock': 'Stock',
      'validation.price.invalid': 'Precio inválido',
      'validation.stock.invalid': 'Stock inválido',
      'products.error.save': 'Error al guardar'
    })[k] || k
  })
}));

const product = { id: 'P1', name: 'Original', is_active: true };

describe('Inline edit minimal flow', () => {
  test('edit name and save triggers callback', async () => {
    const onSave = vi.fn(async (_id, patch) => { return true; });
    render(
      <ProductCard
        product={product}
        isNeoBrutalism={false}
        getCategoryName={() => 'Cat'}
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleSelect={() => {}}
        selected={false}
        enableInlineEdit
        inlineEditing
        onInlineSave={onSave}
        onCancelInlineEdit={() => {}}
      />
    );
    const nameInput = screen.getByTestId('editable-name-input');
    fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });
    fireEvent.keyDown(nameInput, { key: 'Enter' });
    await act(async () => { await Promise.resolve(); });
    expect(onSave).toHaveBeenCalledWith('P1', { name: 'Nuevo Nombre' });
  });

  test('rollback on failure', async () => {
    const store = useProductStore.getState();
    useProductStore.setState({ products: [product], productsById: { [product.id]: product } });
    productService.updateProduct.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    await act(async () => {
      await store.optimisticUpdateProduct('P1', { name: 'Nuevo' });
    });
    const st = useProductStore.getState();
    expect(st.productsById.P1.name).toBe('Original');
    expect(st.error).toBeTruthy();
  });

  test('validation blocks invalid price', async () => {
    const onSave = vi.fn();
    render(
      <ProductCard
        product={product}
        isNeoBrutalism={false}
        getCategoryName={() => 'Cat'}
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleSelect={() => {}}
        selected={false}
        enableInlineEdit
        inlineEditing
        onInlineSave={onSave}
        onCancelInlineEdit={() => {}}
      />
    );
    const priceInput = screen.getByTestId('editable-price-input');
    fireEvent.change(priceInput, { target: { value: '-5' } });
    fireEvent.submit(priceInput.closest('form'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/Precio inválido/);
  });

  test('validation blocks invalid stock', async () => {
    const onSave = vi.fn();
    render(
      <ProductCard
        product={product}
        isNeoBrutalism={false}
        getCategoryName={() => 'Cat'}
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleSelect={() => {}}
        selected={false}
        enableInlineEdit
        inlineEditing
        onInlineSave={onSave}
        onCancelInlineEdit={() => {}}
      />
    );
    const stockInput = screen.getByTestId('editable-stock-input');
    fireEvent.change(stockInput, { target: { value: '-1' } });
    fireEvent.submit(stockInput.closest('form'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/Stock inválido/);
  });

  test('partial failure (price negative) returns false and shows error', async () => {
    const onSave = vi.fn(async (_id, patch) => patch.price < 0 ? false : true);
    render(
      <ProductCard
        product={product}
        isNeoBrutalism={false}
        getCategoryName={() => 'Cat'}
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleSelect={() => {}}
        selected={false}
        enableInlineEdit
        inlineEditing
        onInlineSave={onSave}
        onCancelInlineEdit={() => {}}
      />
    );
    const priceInput = screen.getByTestId('editable-price-input');
    fireEvent.change(priceInput, { target: { value: '-10' } });
    fireEvent.keyDown(priceInput, { key: 'Enter' });
    await act(async () => { await Promise.resolve(); });
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/Error al guardar/);
  });
});
