import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithTheme } from '@/utils/themeTestUtils'

const storeState = {
  createTaxRate: vi.fn(async () => ({})),
  updateTaxRate: vi.fn(async () => ({})),
  taxRates: [],
  fetchTaxRates: vi.fn(async () => []),
}

vi.mock('@/store/useTaxRateStore', () => ({
  default: () => storeState,
}))

const toastError = vi.fn()
const toastSuccess = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}))

import { TaxRateFormModal } from '../components/TaxRateFormModal'
import TaxRatesPanel from '../components/TaxRatesPanel'

// El panel se mockea por su hook para probar la guardia de la default.
const sifenState = {
  taxRates: [
    {
      id: 1,
      tax_name: 'IVA General',
      code: 'IVA10',
      rate: 10,
      is_default: true,
      is_active: true,
      effective_start: '2023-01-01',
    },
    {
      id: 2,
      tax_name: 'Canasta',
      code: 'IVA5',
      rate: 5,
      is_default: false,
      is_active: false,
      effective_start: '2023-01-01',
    },
  ],
  sifenCodes: [],
  selectedSifenCode: '',
  setSelectedSifenCode: vi.fn(),
  detectedSifenCode: '',
  defaultRate: null,
  loading: false,
  applying: false,
  checkingClassification: false,
  autoClassify: vi.fn(async () => true),
}

vi.mock('../hooks/useSifenClassification', () => ({
  useSifenClassification: () => sifenState,
}))

describe('TaxRateFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create: bloquea submit sin nombre ni código y no llama al store', () => {
    renderWithTheme(<TaxRateFormModal isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(storeState.createTaxRate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nombre del Impuesto')).toHaveAttribute('aria-invalid', 'true')
  })

  it('create: envía el payload canónico al store y cierra', async () => {
    const onClose = vi.fn()
    renderWithTheme(<TaxRateFormModal isOpen onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Nombre del Impuesto'), { target: { value: 'IVA Canasta' } })
    fireEvent.change(screen.getByLabelText('Tasa (%)'), { target: { value: '5' } })

    // Radix Select: abrir y elegir IVA10.
    fireEvent.click(screen.getByLabelText('Código'))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IVA10' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('option', { name: 'IVA10' }))

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(storeState.createTaxRate).toHaveBeenCalledTimes(1)
    })
    expect(storeState.createTaxRate).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_name: 'IVA Canasta',
        code: 'IVA10',
        rate: 5,
        country: 'PY',
        jurisdiction_type: 'NACIONAL',
        operation_type: 'NACIONAL',
        is_active: true,
        is_default: false,
      }),
    )
    expect(onClose).toHaveBeenCalled()
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('edit: precarga la tasa y actualiza por id', async () => {
    renderWithTheme(
      <TaxRateFormModal
        isOpen
        onClose={() => {}}
        rate={{
          id: 3,
          tax_name: 'Exento Medicinas',
          code: 'EXENTO',
          rate: 0,
          country: 'PY',
          jurisdiction_type: 'NACIONAL',
          operation_type: 'EXEMPT',
          description: 'Productos médicos',
          effective_start: '2023-01-01',
          effective_end: null,
          is_default: false,
          is_active: true,
        }}
      />,
    )

    expect(screen.getByLabelText('Nombre del Impuesto')).toHaveValue('Exento Medicinas')
    expect(screen.getByLabelText('Tasa (%)')).toHaveValue('0')

    fireEvent.change(screen.getByLabelText('Tasa (%)'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(storeState.updateTaxRate).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ code: 'EXENTO', operation_type: 'EXEMPT', rate: 0 }),
      )
    })
    expect(storeState.createTaxRate).not.toHaveBeenCalled()
  })
})

describe('TaxRatesPanel acciones de fila', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no permite desactivar la tasa predeterminada del sistema', async () => {
    renderWithTheme(<TaxRatesPanel selectedCategory={null} />)

    // La fila default (IVA General) tiene el power button "deactivate".
    fireEvent.click(screen.getByRole('button', { name: /desactivar tasa IVA General/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled()
    })
    expect(storeState.updateTaxRate).not.toHaveBeenCalled()
  })

  it('muestra el botón de nueva tasa y abre el modal en alta', () => {
    renderWithTheme(<TaxRatesPanel selectedCategory={null} />)

    fireEvent.click(screen.getByRole('button', { name: /nueva tasa/i }))

    expect(screen.getByLabelText('Nombre del Impuesto')).toBeInTheDocument()
  })

  it('reactiva una tasa inactiva por PUT completo', async () => {
    renderWithTheme(<TaxRatesPanel selectedCategory={null} />)

    fireEvent.click(screen.getByRole('button', { name: /activar tasa Canasta/i }))

    await waitFor(() => {
      expect(storeState.updateTaxRate).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ is_active: true, code: 'IVA5' }),
      )
    })
  })
})
