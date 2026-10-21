import { useId } from 'react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface LedgerFilterValues {
  startDate: string
  endDate: string
  estado: string
  cdc: string
  timbrado: string
}

interface LedgerFiltersProps {
  values: LedgerFilterValues
  onChange: (next: Partial<LedgerFilterValues>) => void
  onApply: () => void
  onClear: () => void
  invalidRange: boolean
  /** Solo el libro de ventas ofrece filtros SIFEN. */
  showSifen: boolean
  testId?: string
}

/**
 * Filtros del libro: rango de fechas (date-range) y, en ventas, estado SIFEN /
 * CDC / timbrado. Los filtros SIFEN solo viajan con un rango completo: el
 * endpoint por período no los acepta y se avisa en pantalla.
 */
export const LedgerFilters = ({
  values,
  onChange,
  onApply,
  onClear,
  invalidRange,
  showSifen,
  testId,
}: LedgerFiltersProps) => {
  const { t } = useI18n()
  const ids = useId()
  const fromId = `${ids}-from`
  const toId = `${ids}-to`
  const estadoId = `${ids}-estado`
  const cdcId = `${ids}-cdc`
  const timbradoId = `${ids}-timbrado`

  return (
    <section
      className="rounded-md bg-surface p-md shadow-whisper"
      aria-label={t('finance.ledger.filtersAria', 'Filtros del libro')}
      data-testid={testId}
    >
      <div className="flex flex-col gap-md">
        <div className="flex flex-wrap items-end gap-md">
          <div className="space-y-xs">
            <Label htmlFor={fromId} className="text-body-sm-bold text-foreground">
              {t('finance.ledger.from', 'Desde')}
            </Label>
            <Input
              id={fromId}
              type="date"
              value={values.startDate}
              state={invalidRange ? 'error' : ''}
              onChange={(event) => onChange({ startDate: event.target.value })}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor={toId} className="text-body-sm-bold text-foreground">
              {t('finance.ledger.to', 'Hasta')}
            </Label>
            <Input
              id={toId}
              type="date"
              value={values.endDate}
              state={invalidRange ? 'error' : ''}
              onChange={(event) => onChange({ endDate: event.target.value })}
            />
          </div>
          {showSifen ? (
            <>
              <div className="space-y-xs">
                <Label htmlFor={estadoId} className="text-body-sm-bold text-foreground">
                  {t('finance.ledger.estado', 'Estado SIFEN')}
                </Label>
                <Input
                  id={estadoId}
                  type="text"
                  value={values.estado}
                  placeholder={t('finance.ledger.estadoPlaceholder', 'Ej. APROBADO')}
                  onChange={(event) => onChange({ estado: event.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor={cdcId} className="text-body-sm-bold text-foreground">
                  {t('finance.ledger.cdc', 'CDC')}
                </Label>
                <Input
                  id={cdcId}
                  type="text"
                  value={values.cdc}
                  placeholder={t('finance.ledger.cdcPlaceholder', 'Coincidencia parcial')}
                  onChange={(event) => onChange({ cdc: event.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor={timbradoId} className="text-body-sm-bold text-foreground">
                  {t('finance.ledger.timbrado', 'Timbrado')}
                </Label>
                <Input
                  id={timbradoId}
                  type="text"
                  value={values.timbrado}
                  placeholder={t('finance.ledger.timbradoPlaceholder', 'Número exacto')}
                  onChange={(event) => onChange({ timbrado: event.target.value })}
                />
              </div>
            </>
          ) : null}
          <Button variant="primary" type="button" onClick={onApply}>
            {t('finance.ledger.apply', 'Aplicar')}
          </Button>
          <Button variant="secondary" type="button" onClick={onClear}>
            {t('finance.ledger.clear', 'Limpiar')}
          </Button>
        </div>
        {invalidRange ? (
          <p role="alert" className="text-body-sm text-error">
            {t('finance.ledger.invalidRange', 'La fecha "Desde" no puede ser posterior a "Hasta".')}
          </p>
        ) : null}
        {showSifen ? (
          <p className="text-body-sm text-on-surface-deep">
            {t(
              'finance.ledger.sifenHint',
              'Los filtros SIFEN solo se aplican con un rango de fechas completo; sin rango, el libro usa el período seleccionado.',
            )}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default LedgerFilters
