import { describe, test, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('ProductGrid A11y', () => {
  beforeAll(() => {
    // Polyfill mínimo para ResizeObserver
    if (!global.ResizeObserver) {
      global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    // RequestAnimationFrame inmediato
    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    }
  });

  test('renderiza roles list y listitem', () => {
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

    const list = screen.getByRole('list', { name: /Listado de productos/i });
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
});
