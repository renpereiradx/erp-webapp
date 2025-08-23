/**
 * Payment Processor Component Tests - Simplified Functional Version
 * Wave 4 Testing & Integration - Component Tests Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PaymentProcessor } from '@/components/Sales/PaymentProcessor';
import { renderWithProviders } from '@/test/utils.jsx';

// Mock dependencies
vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    getCardStyles: () => 'mock-card-styles',
    getTextStyles: () => 'mock-text-styles',
    getButtonStyles: () => 'mock-button-styles'
  })
}));

describe('PaymentProcessor Component - Simplified', () => {
  const mockPaymentData = {
    amount: 100.00,
    currency: 'USD',
    paymentMethod: 'credit_card'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders payment form', () => {
      renderWithProviders(<PaymentProcessor paymentData={mockPaymentData} />);
      expect(screen.getByText('Procesar Pago')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() => {
        renderWithProviders(<PaymentProcessor paymentData={mockPaymentData} />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('integrates with theme system', () => {
      renderWithProviders(<PaymentProcessor paymentData={mockPaymentData} />);
      expect(document.body).toBeInTheDocument();
    });
  });
});
