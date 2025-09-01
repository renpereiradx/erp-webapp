import { screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/features/products/components/ProductCard';
import useProductStore from '@/store/useProductStore';
import { productService } from '@/services/productService';
import { renderWithTheme } from '@/utils/themeTestUtils.jsx';

import { describe, test, expect, vi } from 'vitest';

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
    renderWithTheme(
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
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('P1', { name: 'Nuevo Nombre' });
  });

  test('rollback on failure', async () => {
    const store = useProductStore.getState();
    useProductStore.setState({ products: [product], productsById: { [product.id]: product } });
    productService.updateProduct.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    await store.optimisticUpdateProduct('P1', { name: 'Nuevo' });
    const st = useProductStore.getState();
    expect(st.productsById.P1.name).toBe('Original');
    expect(st.error).toBeTruthy();
  });

  test('validation blocks invalid price', () => {
    const onSave = vi.fn();
    renderWithTheme(
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

  test('validation blocks invalid stock', () => {
    const onSave = vi.fn();
    renderWithTheme(
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

  test('partial failure (price negative) returns false and shows error', () => {
    const onSave = vi.fn(async (_id, patch) => patch.price < 0 ? false : true);
    renderWithTheme(
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
    fireEvent.click(editButtons[1]);
    const priceInput = screen.getByLabelText('Precio');
    fireEvent.change(priceInput, { target: { value: '-10' } });
    fireEvent.keyDown(priceInput, { key: 'Enter' });
    expect(onSave).toHaveBeenCalled();
  });
});
