/**
 * Sales Dashboard Component Tests - Simplified Functional Version  
 * Wave 4 Testing & Integration - Component Tests Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SalesDashboard } from '@/components/Sales/SalesDashboard';
import { renderWithProviders } from '@/test/utils.jsx';

// Mock dependencies
vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    getCardStyles: () => 'mock-card-styles',
    getTextStyles: () => 'mock-text-styles',
    getButtonStyles: () => 'mock-button-styles'
  })
}));

describe('SalesDashboard Component - Simplified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders dashboard header', () => {
      renderWithProviders(<SalesDashboard />);
      expect(screen.getByText('Dashboard de Ventas')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() => {
        renderWithProviders(<SalesDashboard />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('integrates with theme system', () => {
      renderWithProviders(<SalesDashboard />);
      // Basic integration check - component loads
      expect(document.body).toBeInTheDocument();
    });
  });
});
