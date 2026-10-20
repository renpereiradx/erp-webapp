import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type { DiscountGroupBy } from '@/types/bi'
import { isDiscountGroup } from '@/domain/sales-analytics/discounts'

interface DiscountsControlsProps {
  draft: { start_date: string; end_date: string }
  onDraftChange: (draft: { start_date: string; end_date: string }) => void
  onApply: () => void
  groupBy: DiscountGroupBy
  onGroupByChange: (groupBy: DiscountGroupBy) => void
  invalid: boolean
  isFetching?: boolean
}

/**
 * Filtros del reporte: rango de fechas aplicado con "Aplicar" (nunca fetch por
 * tecla) y agrupación del resumen. El rango inicial son los últimos 30 días.
 */
export const DiscountsControls = ({
  draft,
  onDraftChange,
  onApply,
  groupBy,
  onGroupByChange,
  invalid,
  isFetching = false,
}: DiscountsControlsProps) => {
  const { t } = useI18n()

  return (
    <form
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
      className="space-y-md"
    >
      <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-sm sm:flex-row sm:items-end">
          <div className="space-y-xs">
            <Label htmlFor="discounts-start">
              {t('salesAnalytics.discounts.startDate', 'Desde')}
            </Label>
            <Input
              id="discounts-start"
              type="date"
              value={draft.start_date}
              max={draft.end_date || undefined}
              aria-invalid={invalid}
              onChange={(event) =>
                onDraftChange({ ...draft, start_date: event.target.value })
              }
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="discounts-end">
              {t('salesAnalytics.discounts.endDate', 'Hasta')}
            </Label>
            <Input
              id="discounts-end"
              type="date"
              value={draft.end_date}
              min={draft.start_date || undefined}
              aria-invalid={invalid}
              onChange={(event) => onDraftChange({ ...draft, end_date: event.target.value })}
            />
          </div>
          <Button type="submit" variant="primary" size="md" loading={isFetching}>
            {t('salesAnalytics.actions.apply', 'Aplicar')}
          </Button>
        </div>

        <SegmentedControl
          options={[
            {
              value: 'seller',
              label: t('salesAnalytics.discounts.groupBySeller', 'Por vendedor'),
            },
            {
              value: 'applier',
              label: t('salesAnalytics.discounts.groupByApplier', 'Por aplicador'),
            },
            {
              value: 'branch',
              label: t('salesAnalytics.discounts.groupByBranch', 'Por sucursal'),
            },
          ]}
          value={groupBy}
          onChange={(next: string) => {
            if (isDiscountGroup(next)) onGroupByChange(next)
          }}
          aria-label={t('salesAnalytics.discounts.groupByLabel', 'Agrupar descuentos')}
          size="small"
        />
      </div>

      {invalid ? (
        <p role="alert" className="text-body-md text-error">
          {t(
            'salesAnalytics.discounts.invalidRange',
            'La fecha "Desde" debe ser válida y no posterior a "Hasta".',
          )}
        </p>
      ) : null}
    </form>
  )
}

export default DiscountsControls
