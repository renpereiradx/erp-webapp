import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders, checkAccessibility, fillForm, submitForm, openModal, closeModal, waitForLoadingToFinish, setupStoreTest } from '../../__utils__/testUtils';
import { screen, waitFor } from '@testing-library/react';
import PurchaseModal from '../../../src/components/purchases/PurchaseModal';

// Mock dependencies
vi.mock('../../../src/hooks/usePurchaseLogic', () => ({
  usePurchaseLogic: () => ({
    suppliers: [
      { id: 1, name: 'Supplier 1', status: 'active' },
      { id: 2, name: 'Supplier 2', status: 'active' }
    ],
    products: [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ],
    createPurchase: vi.fn(),
    updatePurchase: vi.fn(),
    loading: false,
    error: null
  })
}));

vi.mock('../../../src/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    trackEvent: vi.fn(),
    trackError: vi.fn()
  })
}));

describe('PurchaseModal', () => {
  let mockStore;
  
  beforeEach(() => {
    mockStore = setupStoreTest('purchase');
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create modal correctly', () => {
      renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Purchase Order')).toBeInTheDocument();
      expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery date/i)).toBeInTheDocument();
    });

    it('should render edit modal correctly', () => {
      const purchase = {
        id: 1,
        supplier: { id: 1, name: 'Supplier 1' },
        items: [{ product: { id: 1, name: 'Product 1' }, quantity: 2, price: 100 }],
        deliveryDate: '2025-08-30',
        notes: 'Test notes'
      };

      renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="edit"
          purchase={purchase}
        />
      );

      expect(screen.getByDisplayValue('Supplier 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(
        <PurchaseModal 
          isOpen={false}
          onClose={vi.fn()}
          mode="create"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', async () => {
      const { container } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      await checkAccessibility(container);
    });

    it('should trap focus within modal', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      const modal = screen.getByRole('dialog');
      const firstInput = screen.getByLabelText(/supplier/i);
      const lastButton = screen.getByRole('button', { name: /create/i });

      // Focus should start on first input
      expect(firstInput).toHaveFocus();

      // Tab to last element
      await user.tab();
      await user.tab();
      await user.tab();
      
      expect(lastButton).toHaveFocus();

      // Tab should cycle back to first element
      await user.tab();
      expect(firstInput).toHaveFocus();
    });

    it('should close on Escape key', async () => {
      const onClose = vi.fn();
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('should handle form submission successfully', async () => {
      const onClose = vi.fn();
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      );

      // Fill form
      await fillForm(user, {
        'supplier': 'Supplier 1',
        'delivery date': '2025-08-30',
        'notes': 'Test purchase order'
      });

      // Add product
      const addProductButton = screen.getByRole('button', { name: /add product/i });
      await user.click(addProductButton);

      // Fill product details
      const productSelect = screen.getByLabelText(/product/i);
      await user.selectOptions(productSelect, '1');

      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit form
      await submitForm(user);

      await waitFor(() => {
        expect(mockStore.createPurchase).toHaveBeenCalledWith({
          supplier: { id: 1, name: 'Supplier 1' },
          items: [{ productId: 1, quantity: 5, price: 100 }],
          deliveryDate: '2025-08-30',
          notes: 'Test purchase order'
        });
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      // Try to submit without required fields
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/supplier is required/i)).toBeInTheDocument();
        expect(screen.getByText(/delivery date is required/i)).toBeInTheDocument();
      });

      expect(mockStore.createPurchase).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockStore.createPurchase.mockRejectedValue(new Error('API Error'));

      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      await fillForm(user, {
        'supplier': 'Supplier 1',
        'delivery date': '2025-08-30'
      });

      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText(/failed to create purchase/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product Management', () => {
    it('should add multiple products', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      const addProductButton = screen.getByRole('button', { name: /add product/i });

      // Add first product
      await user.click(addProductButton);
      const firstProductSelect = screen.getAllByLabelText(/product/i)[0];
      await user.selectOptions(firstProductSelect, '1');

      // Add second product
      await user.click(addProductButton);
      const secondProductSelect = screen.getAllByLabelText(/product/i)[1];
      await user.selectOptions(secondProductSelect, '2');

      expect(screen.getAllByLabelText(/product/i)).toHaveLength(2);
    });

    it('should remove products', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      const addProductButton = screen.getByRole('button', { name: /add product/i });
      await user.click(addProductButton);
      await user.click(addProductButton);

      expect(screen.getAllByLabelText(/product/i)).toHaveLength(2);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(screen.getAllByLabelText(/product/i)).toHaveLength(1);
    });

    it('should calculate totals correctly', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      const addProductButton = screen.getByRole('button', { name: /add product/i });
      await user.click(addProductButton);

      const productSelect = screen.getByLabelText(/product/i);
      await user.selectOptions(productSelect, '1'); // Product 1, price: 100

      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      await waitFor(() => {
        expect(screen.getByText(/subtotal.*300/i)).toBeInTheDocument();
        expect(screen.getByText(/total.*300/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockStore.createPurchase.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      await fillForm(user, {
        'supplier': 'Supplier 1',
        'delivery date': '2025-08-30'
      });

      await submitForm(user);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('w-full', 'max-w-sm');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      // Navigate through form elements with Tab
      const supplierInput = screen.getByLabelText(/supplier/i);
      const deliveryInput = screen.getByLabelText(/delivery date/i);
      const notesInput = screen.getByLabelText(/notes/i);

      expect(supplierInput).toHaveFocus();

      await user.tab();
      expect(deliveryInput).toHaveFocus();

      await user.tab();
      expect(notesInput).toHaveFocus();
    });

    it('should support Enter key for form submission', async () => {
      const { user } = renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      );

      await fillForm(user, {
        'supplier': 'Supplier 1',
        'delivery date': '2025-08-30'
      });

      const supplierInput = screen.getByLabelText(/supplier/i);
      supplierInput.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockStore.createPurchase).toHaveBeenCalled();
      });
    });
  });

  describe('Theme Support', () => {
    it('should work with dark theme', () => {
      renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />,
        { theme: 'dark' }
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('dark:bg-gray-800');
    });

    it('should work with high contrast theme', () => {
      renderWithProviders(
        <PurchaseModal 
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />,
        { theme: 'high-contrast' }
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('high-contrast:border-4');
    });
  });
});
