import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MovementFilters } from '../hooks/useCashMovements';

interface MovementsFilterPanelProps {
  filters: MovementFilters;
  onFilterChange: (field: keyof MovementFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

/** Collapsible filter bar for the movements list. */
export function MovementsFilterPanel({
  filters,
  onFilterChange,
  onApply,
  onClear,
}: MovementsFilterPanelProps) {
  const { t } = useI18n();

  return (
    <div className="p-lg bg-surface rounded-md shadow-whisper border-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="space-y-sm">
          <Label htmlFor="movements-filter-type" className="text-body-md-bold text-foreground">
            {t('cashMovement.filter.type', 'Tipo')}
          </Label>
          <Select value={filters.type} onValueChange={value => onFilterChange('type', value)}>
            <SelectTrigger id="movements-filter-type">
              <SelectValue
                placeholder={t('cashMovement.page.allTypesPlaceholder', 'Todos los tipos')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME" className="text-body-md">
                {t('cashMovement.type.income', 'Ingresos')}
              </SelectItem>
              <SelectItem value="EXPENSE" className="text-body-md">
                {t('cashMovement.type.expense', 'Egresos')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-sm">
          <Label htmlFor="movements-filter-from" className="text-body-md-bold text-foreground">
            {t('cashMovement.filter.dateFrom', 'Desde')}
          </Label>
          <Input
            id="movements-filter-from"
            type="date"
            value={filters.date_from}
            onChange={e => onFilterChange('date_from', e.target.value)}
          />
        </div>

        <div className="space-y-sm">
          <Label htmlFor="movements-filter-to" className="text-body-md-bold text-foreground">
            {t('cashMovement.filter.dateTo', 'Hasta')}
          </Label>
          <Input
            id="movements-filter-to"
            type="date"
            value={filters.date_to}
            onChange={e => onFilterChange('date_to', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-sm pt-md mt-md border-t border-divider">
        <Button variant="ghost" onClick={onClear}>
          {t('action.clear', 'Limpiar')}
        </Button>
        <Button variant="secondary" onClick={onApply}>
          {t('cashMovement.page.applyFilters', 'Aplicar filtros')}
        </Button>
      </div>
    </div>
  );
}
