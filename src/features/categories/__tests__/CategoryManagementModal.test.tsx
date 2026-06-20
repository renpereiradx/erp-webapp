import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils';
import type { Category } from '../types';

const SEED: Category[] = [
  { id: 1, name: 'Electrónicos', description: 'Productos electrónicos', is_active: true },
  { id: 2, name: 'Lácteos', description: 'Productos lácteos', is_active: true },
  { id: 3, name: 'Bebidas', description: null, is_active: false },
];

const hookState: {
  filteredCategories: Category[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: ReturnType<typeof vi.fn>;
  selectedCategory: Category | null;
  isDrawerOpen: boolean;
  isDeleteDialogOpen: boolean;
  isMutating: boolean;
  isDeleting: boolean;
  openCreate: ReturnType<typeof vi.fn>;
  openEdit: ReturnType<typeof vi.fn>;
  openDelete: ReturnType<typeof vi.fn>;
  closeDrawer: ReturnType<typeof vi.fn>;
  closeDeleteDialog: ReturnType<typeof vi.fn>;
  handleSave: ReturnType<typeof vi.fn>;
  confirmDelete: ReturnType<typeof vi.fn>;
} = {
  filteredCategories: [],
  loading: false,
  searchTerm: '',
  setSearchTerm: vi.fn(),
  selectedCategory: null,
  isDrawerOpen: false,
  isDeleteDialogOpen: false,
  isMutating: false,
  isDeleting: false,
  openCreate: vi.fn(),
  openEdit: vi.fn(),
  openDelete: vi.fn(),
  closeDrawer: vi.fn(),
  closeDeleteDialog: vi.fn(),
  handleSave: vi.fn(async () => null),
  confirmDelete: vi.fn(async () => true),
};

vi.mock('../hooks/useCategoryManagement', () => ({
  useCategoryManagement: () => hookState,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/store/useTaxRateStore', () => ({
  default: () => ({
    taxRates: [],
    fetchTaxRates: vi.fn().mockResolvedValue([]),
  }),
}));

import CategoryManagementModal from '../components/CategoryManagementModal';

describe('CategoryManagementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(hookState, {
      filteredCategories: SEED,
      loading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      selectedCategory: null,
      isDrawerOpen: false,
      isDeleteDialogOpen: false,
      isMutating: false,
      isDeleting: false,
      openCreate: vi.fn(),
      openEdit: vi.fn(),
      openDelete: vi.fn(),
      closeDrawer: vi.fn(),
      closeDeleteDialog: vi.fn(),
      handleSave: vi.fn(async () => null),
      confirmDelete: vi.fn(async () => true),
    });
  });

  it('no renderiza nada cuando isOpen=false', () => {
    const { container } = renderWithTheme(
      <CategoryManagementModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la lista de categorías cuando isOpen=true', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('category-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('category-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('category-row-3')).toBeInTheDocument();
    expect(screen.getByText('Electrónicos')).toBeInTheDocument();
    expect(screen.getByText('Lácteos')).toBeInTheDocument();
  });

  it('muestra el botón "Nueva categoría" en el header', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('category-management-new')).toBeInTheDocument();
  });

  it('click en "+ Nueva categoría" llama a openCreate', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('category-management-new'));
    expect(hookState.openCreate).toHaveBeenCalledTimes(1);
  });

  it('muestra estado de carga cuando loading=true', () => {
    hookState.loading = true;
    hookState.filteredCategories = [];
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay categorías y no loading', () => {
    hookState.filteredCategories = [];
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument();
  });

  it('el input de búsqueda llama a setSearchTerm', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    const search = screen.getByTestId('category-management-search');
    fireEvent.change(search, { target: { value: 'elec' } });
    expect(hookState.setSearchTerm).toHaveBeenCalledWith('elec');
  });

  it('click en X llama a onClose', () => {
    const onClose = vi.fn();
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('click en editar llama a openEdit con la categoría', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('category-edit-1'));
    expect(hookState.openEdit).toHaveBeenCalledWith(SEED[0]);
  });

  it('click en eliminar abre el AlertDialog con el nombre de la categoría', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('category-delete-2'));
    expect(hookState.openDelete).toHaveBeenCalledWith(SEED[1]);
  });

  it('click en overlay NO cierra el modal (cierre explícito vía X)', () => {
    const onClose = vi.fn();
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={onClose} />);
    const overlay = screen.getByTestId('category-management-modal');
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('muestra Activo/Inactivo según is_active', () => {
    renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
    const row1 = screen.getByTestId('category-row-1');
    const row3 = screen.getByTestId('category-row-3');
    expect(within(row1).getByText(/activo/i)).toBeInTheDocument();
    expect(within(row3).getByText(/inactivo/i)).toBeInTheDocument();
  });

  describe('Drawer', () => {
    beforeEach(() => {
      hookState.isDrawerOpen = true;
    });

    it('renderiza el drawer con título "Nueva Categoría" cuando no hay selected', () => {
      hookState.selectedCategory = null;
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const drawer = screen.getByTestId('category-drawer');
      expect(within(drawer).getByText(/nueva categor/i)).toBeInTheDocument();
      expect(within(drawer).getByTestId('category-name')).toBeInTheDocument();
    });

    it('renderiza el drawer con título "Editar Categoría" cuando hay selected', () => {
      hookState.selectedCategory = SEED[0];
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const drawer = screen.getByTestId('category-drawer');
      expect(within(drawer).getByText(/editar categor/i)).toBeInTheDocument();
    });

    it('submit del form llama a handleSave con los valores', async () => {
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const nameInput = screen.getByTestId('category-name');
      fireEvent.change(nameInput, { target: { value: 'Nueva' } });
      const form = nameInput.closest('form');
      if (form) fireEvent.submit(form);
      await waitFor(() => {
        expect(hookState.handleSave).toHaveBeenCalled();
      });
    });

    it('botón Cancelar llama a closeDrawer', () => {
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const drawer = screen.getByTestId('category-drawer');
      const cancelBtn = within(drawer).getByRole('button', { name: /^cancelar$/i });
      fireEvent.click(cancelBtn);
      expect(hookState.closeDrawer).toHaveBeenCalled();
    });
  });

  describe('Delete dialog', () => {
    beforeEach(() => {
      hookState.isDeleteDialogOpen = true;
      hookState.selectedCategory = SEED[1];
    });

    it('renderiza el AlertDialog con el nombre de la categoría', () => {
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const alert = screen.getByRole('alertdialog');
      expect(within(alert).getByText(/Lácteos/)).toBeInTheDocument();
      expect(within(alert).getByText(/no se puede deshacer/i)).toBeInTheDocument();
    });

    it('botón Eliminar llama a confirmDelete', async () => {
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const confirmBtn = screen.getByTestId('category-confirm-delete');
      fireEvent.click(confirmBtn);
      await waitFor(() => {
        expect(hookState.confirmDelete).toHaveBeenCalled();
      });
    });

    it('botón Cancelar llama a closeDeleteDialog', () => {
      renderWithTheme(<CategoryManagementModal isOpen={true} onClose={() => {}} />);
      const alert = screen.getByRole('alertdialog');
      const cancelBtn = within(alert).getByRole('button', { name: /^cancelar$/i });
      fireEvent.click(cancelBtn);
      expect(hookState.closeDeleteDialog).toHaveBeenCalled();
    });
  });
});
