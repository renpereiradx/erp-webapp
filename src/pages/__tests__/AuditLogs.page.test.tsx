/**
 * F10 — Registro de auditoría: rango inicial real, filtros/orden/paginación
 * server-side, links a detalle/actividad, export con los filtros activos y
 * estados honestos (rango inválido/incompleto, empty, error). Sin KPIs
 * inventados junto a la tabla.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      if (!fallback) return key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/auditService', () => ({
  auditService: {
    getDashboard: vi.fn(),
    getLogs: vi.fn(),
    getLogById: vi.fn(),
    getUserActivity: vi.fn(),
    getCategories: vi.fn(),
    getEntityTypes: vi.fn(),
    exportLogs: vi.fn(),
  },
}))

vi.mock('@/lib/downloadBlob', () => ({ downloadBlob: vi.fn() }))

import { auditService } from '@/services/bi/auditService'
import { downloadBlob } from '@/lib/downloadBlob'
import { defaultAuditLogFilters, toAuditExportFilters } from '@/domain/audit/filters'
import { auditEnvelope, auditLogs, renderAuditPage } from './auditTestUtils'
import AuditLogsPage from '../audit/AuditLogsPage'

const defaults = defaultAuditLogFilters()

describe('AuditLogsPage (F10)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auditService.getLogs).mockResolvedValue(
      auditEnvelope(auditLogs()) as never,
    )
    vi.mocked(auditService.exportLogs).mockResolvedValue({
      blob: new Blob(['id\n']),
      filename: 'audit_logs.csv',
    })
    vi.mocked(auditService.getCategories).mockResolvedValue(
      auditEnvelope([
        { code: 'SALE', name: 'Ventas' },
        { code: 'LEGACY', name: 'LEGACY' },
      ]) as never,
    )
    vi.mocked(auditService.getEntityTypes).mockResolvedValue(
      auditEnvelope([
        { code: 'SALE', name: 'Venta' },
        { code: 'PAYMENT', name: 'Pago' },
        { code: 'SALE_PAYMENTS', name: 'SALE_PAYMENTS' },
      ]) as never,
    )
  })

  it('consulta con la ventana de 30 días y muestra los eventos reales', async () => {
    renderAuditPage(<AuditLogsPage />)
    const table = await screen.findByTestId('audit-logs-table')

    expect(auditService.getLogs).toHaveBeenCalledWith({
      start_date: defaults.startDate,
      end_date: defaults.endDate,
      page: 1,
      page_size: 10,
    })

    const detail = within(table).getByRole('link', { name: 'Ver evento 27088' })
    expect(detail).toHaveAttribute('href', '/auditoria/logs/27088')
    const user = within(table).getByRole('link', { name: 'admin' })
    expect(user).toHaveAttribute('href', '/auditoria/usuarios/jJkV4F6HR')
    expect(within(table).getByText('Creación')).toBeInTheDocument()
    expect(within(table).getByText('Ventas')).toBeInTheDocument()
    expect(within(table).getAllByText('Informativo').length).toBeGreaterThan(0)
    expect(within(table).getByText('SALE-1789393146-771')).toBeInTheDocument()
    expect(within(table).getByText('36 ms')).toBeInTheDocument()
    // Fila legacy: código fuera del vocabulario traducido como Histórico.
    expect(within(table).getByText('Histórico')).toBeInTheDocument()
    expect(within(table).getByText('Alta (histórico)')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 7 (70 items)')).toBeInTheDocument()
  })

  it('filtra por categoría, nivel y resultado con los valores del BE', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'SALE' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'SALE', page: 1 }),
      ),
    )

    fireEvent.change(screen.getByLabelText('Nivel'), { target: { value: 'ERROR' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'SALE', level: 'ERROR' }),
      ),
    )

    fireEvent.click(screen.getByText('Fallos'))
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ success: false }),
      ),
    )
  })

  it('filtra por acción y tipo de entidad con el catálogo del BE (BI-D10)', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    await screen.findByRole('option', { name: 'Venta' })
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.change(screen.getByLabelText('Acción'), { target: { value: 'CREATE' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: 'CREATE', page: 1 }),
      ),
    )

    fireEvent.change(screen.getByLabelText('Tipo de entidad'), {
      target: { value: 'SALE' },
    })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: 'CREATE', entity_type: 'SALE' }),
      ),
    )
  })

  it('ofrece categorías y entity types históricos del catálogo distinct (BI-D10)', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')

    const categorySelect = screen.getByLabelText('Categoría') as HTMLSelectElement
    const entitySelect = screen.getByLabelText('Tipo de entidad', {
      exact: true,
    }) as HTMLSelectElement
    await waitFor(() =>
      expect(
        Array.from(categorySelect.options).some((option) => option.value === 'LEGACY'),
      ).toBe(true),
    )
    await waitFor(() =>
      expect(
        Array.from(entitySelect.options).some(
          (option) => option.value === 'SALE_PAYMENTS',
        ),
      ).toBe(true),
    )
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.change(categorySelect, { target: { value: 'LEGACY' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'LEGACY', page: 1 }),
      ),
    )

    fireEvent.change(entitySelect, { target: { value: 'SALE_PAYMENTS' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: 'LEGACY',
          entity_type: 'SALE_PAYMENTS',
        }),
      ),
    )
  })

  it('aplica el texto con Enter y lo recorta; Limpiar vuelve al rango inicial', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    vi.mocked(auditService.getLogs).mockClear()

    const search = screen.getByPlaceholderText('Descripción o ID de entidad')
    fireEvent.change(search, { target: { value: '  pos-checkout  ' } })
    fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' })

    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'pos-checkout', page: 1 }),
      ),
    )

    // Volver al rango inicial reusa la query cacheada de la ventana default
    // (staleTime 60 s): se verifica el estado de la UI, no un request extra.
    fireEvent.click(screen.getByText('Limpiar'))
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Descripción o ID de entidad')).toHaveValue(''),
    )
    expect(screen.getByText('Limpiar').closest('button')).toBeDisabled()
    expect(screen.getByLabelText('Desde')).toHaveValue(defaults.startDate)
    expect(screen.getByLabelText('Hasta')).toHaveValue(defaults.endDate)
  })

  it('un rango inválido bloquea la consulta y muestra el aviso', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2099-01-01' },
    })

    await screen.findByText('Rango de fechas inválido')
    expect(auditService.getLogs).not.toHaveBeenCalled()
  })

  it('refresca la ventana al volver a foco si el rango no se tocó (BI-D05)', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    const to = screen.getByLabelText('Hasta') as HTMLInputElement
    const initialTo = to.value

    vi.useFakeTimers({ toFake: ['Date'] })
    const future = new Date()
    future.setDate(future.getDate() + 2)
    vi.setSystemTime(future)
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => expect(to.value).not.toBe(initialTo))
    expect(to.value).toBe(
      defaultAuditLogFilters(future).endDate,
    )
  })

  it('no pisa un rango elegido por el usuario al volver a foco (BI-D05)', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')

    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2026-01-31' },
    })

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2027, 0, 15, 12, 0, 0))
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(screen.getByLabelText('Desde')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-01-31')
  })

  it('ordena server-side por acción con ciclo ASC → DESC → default', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Acción' }))
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'action', sort_order: 'asc', page: 1 }),
      ),
    )
    // La tabla se remonta con el nuevo query key: esperar el re-render.
    await screen.findByTestId('audit-logs-table')

    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Acción (ascendente)' }))
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'action', sort_order: 'desc' }),
      ),
    )
    await screen.findByTestId('audit-logs-table')

    // Tercer click: vuelve al orden default (timestamp DESC) y a la etiqueta
    // sin dirección. La query default está cacheada (staleTime 60 s).
    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Acción (descendente)' }))
    expect(
      await screen.findByRole('button', { name: 'Ordenar por Acción' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Acción \(/ })).toBeNull()
  })

  it('pagina server-side con el total real', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')
    vi.mocked(auditService.getLogs).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('exporta los filtros activos por CSV y confirma la descarga', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')

    fireEvent.change(screen.getByLabelText('Nivel'), { target: { value: 'ERROR' } })
    await waitFor(() =>
      expect(auditService.getLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ level: 'ERROR' }),
      ),
    )

    fireEvent.click(screen.getByTestId('audit-export'))
    await waitFor(() => expect(auditService.exportLogs).toHaveBeenCalledTimes(1))

    expect(auditService.exportLogs).toHaveBeenCalledWith(
      toAuditExportFilters({ ...defaults, level: 'ERROR' }),
      { format: 'csv', max_records: 10000 },
    )
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'audit_logs.csv')
    expect(await screen.findByTestId('audit-export-done')).toBeInTheDocument()
  })

  it('si el export falla muestra el aviso localizado', async () => {
    vi.mocked(auditService.exportLogs).mockRejectedValue(new Error('boom'))
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')

    fireEvent.click(screen.getByTestId('audit-export'))
    expect(await screen.findByTestId('audit-export-error')).toBeInTheDocument()
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('empty honesto: con filtros y sin filtros', async () => {
    vi.mocked(auditService.getLogs).mockResolvedValue(
      auditEnvelope(auditLogs({ logs: [], total: 0, total_pages: 0 })) as never,
    )
    renderAuditPage(<AuditLogsPage />)
    expect(await screen.findByText('Sin eventos en el rango')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Descripción o ID de entidad'), {
      target: { value: 'zzz' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText('Descripción o ID de entidad'), {
      key: 'Enter',
      code: 'Enter',
    })
    expect(await screen.findByText('Sin eventos para esos filtros')).toBeInTheDocument()
  })

  it('error del endpoint: estado con retry y sin tabla vacía silenciosa', async () => {
    vi.mocked(auditService.getLogs)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(auditEnvelope(auditLogs()) as never)

    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('error-state')
    expect(screen.queryByTestId('audit-logs-table')).toBeNull()

    fireEvent.click(screen.getByTestId('error-retry'))
    expect(await screen.findByTestId('audit-logs-table')).toBeInTheDocument()
  })

  it('no inventa KPIs junto a la tabla (sin Éxitos Totales 12.450)', async () => {
    renderAuditPage(<AuditLogsPage />)
    await screen.findByTestId('audit-logs-table')

    expect(screen.queryByText(/Éxitos Totales/i)).toBeNull()
    expect(screen.queryByText(/12[.,]450/)).toBeNull()
    expect(screen.queryByText(/Página 1 de 30/)).toBeNull()
    expect(screen.queryByText(/en tiempo real/i)).toBeNull()
  })
})
