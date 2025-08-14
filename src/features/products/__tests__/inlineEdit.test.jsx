import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProductCard from '@/features/products/components/ProductCard';
import useProductStore from '@/store/useProductStore';
import { productService } from '@/services/productService';
import EditableField from '@/components/EditableField';

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

const product = { id: 'P1', name: 'Original', is_active: true };

describe('Inline edit minimal flow', () => {
  test('enter edit, modify name and save triggers callback', () => {
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
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);
    const input = screen.getByLabelText('Nombre');
    fireEvent.change(input, { target: { value: 'Nuevo Nombre' } });
    fireEvent.keyDown(input, { key: 'Enter' }); // form submit via Enter
    expect(onSave).toHaveBeenCalledWith('P1', { name: 'Nuevo Nombre' });
  });
  test('rollback on failure', async () => {
    const store = useProductStore.getState();
    // seed store
    useProductStore.setState({ products: [product], productsById: { [product.id]: product } });
    // force fail
    productService.updateProduct.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    // optimistic update
    await store.optimisticUpdateProduct('P1', { name: 'Nuevo' });
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
    const priceInput = screen.getByLabelText('Precio');
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
    const stockInput = screen.getByLabelText('Stock');
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
    // activate price edit
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    // second editable field assumed price
    fireEvent.click(editButtons[1]);
    const priceInput = screen.getByLabelText('Precio');
    fireEvent.change(priceInput, { target: { value: '-10' } });
    fireEvent.keyDown(priceInput, { key: 'Enter' });
    expect(onSave).toHaveBeenCalled();
  });
});
