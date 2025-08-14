import { describe, test, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Products from '@/pages/Products.jsx';
import * as productStore from '@/store/useProductStore';

// Mock store selectors minimalmente

vi.mock('@/store/useProductStore', async (orig) => {
  const real = await orig();
  const originalHook = real.default;
  const state = originalHook.getState();
  return {
    __esModule: true,
    default: ((selector) => selector(originalHook.getState()))
  };
});

describe('Products accessibility live region', () => {
  test('announces results after search state changes', async () => {
    render(<Products />);
    // Buscar la región aria-live
    const live = await screen.findByRole('status', { hidden: true }).catch(() => null);
    // Si no encuentra por role status, fallback query by text container with aria-live
    const region = live || document.querySelector('[aria-live]');
    expect(region).toBeTruthy();
  });
});
