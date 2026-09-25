import { MoreVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Acción de una fila del drill-down: pivote a otro análisis o utilidad. */
export interface DrilldownRowAction {
  id: string;
  label: string;
  /** línea informativa con datos concretos de la fila (unidades, importes, SKU) */
  description?: string;
  icon?: LucideIcon;
  onSelect: () => void;
}

/** Menú de acciones de una fila: encabezado informativo + acciones. */
export interface DrilldownRowMenu {
  /** nombre de la entidad (encabezado del menú y aria-label del trigger) */
  title: string;
  /** identificador secundario de la entidad (documento, RUC o SKU) */
  subtitle?: string;
  actions: DrilldownRowAction[];
}

interface RowActionsMenuProps {
  menu: DrilldownRowMenu;
}

/**
 * Menú contextual por fila (dropmenu global de ui/): encabezado con la
 * entidad y su documento/SKU, e ítems de dos líneas — acción + métrica
 * informativa de la fila para saber qué abre cada entrada.
 */
function RowActionsMenu({ menu }: RowActionsMenuProps) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="drilldown-row-actions"
          aria-label={t('bi.relational.action.aria', 'Acciones de {name}', { name: menu.title })}
          className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface p-2 text-on-surface-deep shadow-sm transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <MoreVertical size={14} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" data-testid="drilldown-row-menu">
        <DropdownMenuLabel>
          <span className="block truncate text-foreground">{menu.title}</span>
          {menu.subtitle ? (
            <span className="block truncate font-mono text-[10px] font-medium tracking-normal normal-case text-on-surface-deep">
              {menu.subtitle}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menu.actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              data-testid={`drilldown-row-action-${action.id}`}
              onSelect={() => action.onSelect()}
            >
              {Icon ? <Icon size={14} className="shrink-0 text-primary" aria-hidden="true" /> : null}
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{action.label}</span>
                {action.description ? (
                  <span className="truncate font-mono text-[10px] font-medium tracking-normal normal-case text-on-surface-deep">
                    {action.description}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RowActionsMenu;
