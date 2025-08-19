import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SupplierModal from '@/components/SupplierModal';
import useSupplierStore from '@/store/useSupplierStore';

vi.mock('@/store/useSupplierStore', () => {
  const actual = vi.importActual('@/store/useSupplierStore');
  return {
    __esModule: true,
    default: () => ({ createSupplier: vi.fn().mockResolvedValue({}), updateSupplier: vi.fn().mockResolvedValue({}), loading: false })
  };
});

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

// theme mock
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light' }) }));

// i18n mock minimal
vi.mock('@/lib/i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));

describe('SupplierModal', () => {
  it('muestra titulo nuevo proveedor cuando no hay supplier', () => {
    render(<SupplierModal isOpen={true} onClose={() => {}} supplier={null} onSuccess={() => {}} />);
    expect(screen.getByTestId('supplier-modal-title').textContent).toMatch(/suppliers.new_title|Nuevo/);
  });

  it('llama onClose al hacer click outside', () => {
    const onClose = vi.fn();
    render(<SupplierModal isOpen={true} onClose={onClose} supplier={null} onSuccess={() => {}} />);
    fireEvent.click(screen.getByTestId('supplier-modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
});
