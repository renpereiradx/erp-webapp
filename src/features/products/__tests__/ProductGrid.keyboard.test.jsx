import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProductGrid from '@/features/products/components/ProductGrid';

// Mock react-virtuoso para evitar dependencias del DOM real
vi.mock('react-virtuoso', () => ({
  VirtuosoGrid: ({ totalCount, itemContent, components }) => {
    const List = components?.List || (({ children }) => <div>{children}</div>);
    const Item = components?.Item || (({ children }) => <div>{children}</div>);
    const items = Array.from({ length: totalCount }).map((_, i) => (
      <Item key={i}>{itemContent(i)}</Item>
    ));
    return <List>{items}</List>;
  },
}));

beforeEach(() => {
  // Polyfills
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
});

describe('ProductGrid navegación por teclado', () => {
  test('ArrowRight/ArrowDown mueven el foco y actualizan aria-current', () => {
    const products = [
      { id: 'p1', name: 'Prod 1' },
      { id: 'p2', name: 'Prod 2' },
      { id: 'p3', name: 'Prod 3' },
    ];

    render(
      <ProductGrid
        products={products}
        isNeoBrutalism={false}
        getCategoryName={() => ''}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('aria-current', 'true');

    fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    expect(items[1]).toHaveAttribute('aria-current', 'true');

    fireEvent.keyDown(items[1], { key: 'ArrowDown' });
    expect(items[2]).toHaveAttribute('aria-current', 'true');
  });

  test('Enter ejecuta onView con el producto enfocado', () => {
    const products = [
      { id: 'p1', name: 'Prod 1' },
      { id: 'p2', name: 'Prod 2' },
    ];
    const onView = vi.fn();

    render(
      <ProductGrid
        products={products}
        isNeoBrutalism={false}
        getCategoryName={() => ''}
        onView={onView}
      />
    );

    const items = screen.getAllByRole('listitem');
    // Mover el foco al segundo ítem
    fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    expect(items[1]).toHaveAttribute('aria-current', 'true');

    fireEvent.keyDown(items[1], { key: 'Enter' });
    expect(onView).toHaveBeenCalledWith(products[1]);
  });
});
