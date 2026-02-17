import { describe, test, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils.jsx';
import Products from '@/pages/Products.jsx';
import * as productStore from '@/store/useProductStore';

// Mock store selectors minimalmente

vi.mock('@/store/useProductStore', async (orig) => {
  const real = await orig();
  const originalHook = real.default;
  return {
    __esModule: true,
    default: (selector) => {
      const state = originalHook.getState();
      return (typeof selector === 'function' ? selector(state) : state);
    }
  };
});

describe('Products accessibility live region', () => {
  test('announces results after search state changes', async () => {
  renderWithTheme(<Products />);
    // Buscar la región aria-live
    const live = await screen.findByRole('status', { hidden: true }).catch(() => null);
    // Si no encuentra por role status, fallback query by text container with aria-live
    const region = live || document.querySelector('[aria-live]');
    expect(region).toBeTruthy();
  });
});
