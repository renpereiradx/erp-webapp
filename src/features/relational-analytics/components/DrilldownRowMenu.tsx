import { MoreVertical } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DrilldownRowMenu as DrilldownRowMenuModel } from '../types'

interface DrilldownRowMenuProps {
  menu: DrilldownRowMenuModel
}

/**
 * Menú contextual por fila: encabezado con la entidad y su documento/SKU, e
 * ítems de dos líneas — acción + métrica de la fila para saber qué abre cada
 * entrada. Solo acciones reales (pivotes entre drill-downs o copiar un dato).
 */
export const DrilldownRowMenu = ({ menu }: DrilldownRowMenuProps) => {
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          data-testid="drilldown-row-actions"
          aria-label={t('relationalAnalytics.actions.rowAria', 'Acciones de {name}', {
            name: menu.title,
          })}
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="drilldown-row-menu">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block truncate text-body-md-bold normal-case tracking-normal text-foreground">
            {menu.title}
          </span>
          {menu.subtitle ? (
            <span className="block truncate font-data-mono text-body-sm font-normal normal-case tracking-normal text-on-surface-deep">
              {menu.subtitle}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menu.actions.map((action) => {
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.id}
              data-testid={`drilldown-row-action-${action.id}`}
              className="gap-sm normal-case tracking-normal focus:bg-surface-muted"
              onSelect={() => action.onSelect()}
            >
              {Icon ? (
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : null}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-md normal-case tracking-normal">
                  {action.label}
                </span>
                {action.description ? (
                  <span className="break-words font-data-mono text-body-sm font-normal normal-case tracking-normal text-on-surface-deep">
                    {action.description}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DrilldownRowMenu
