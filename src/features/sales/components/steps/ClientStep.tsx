/**
 * ClientStep — paso 1 del SaleCheckoutWizard.
 *
 * Búsqueda y selección del cliente. Reutiliza el SearchableDropdown + el
 * store de clientes, igual que el CheckoutModal legacy. Al seleccionar un
 * cliente notifica al orquestador, que cargará ventas pendientes / reservas
 * y recalculará los pasos condicionales.
 */
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { User, UserPlus, X, AlertTriangle } from 'lucide-react'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import WithPermission from '@/components/auth/WithPermission'
import useClientStore from '@/store/useClientStore'
import QuickClientModal from '@/features/party/components/QuickClientModal'
import { useI18n } from '@/lib/i18n'

export interface ClientStepRef {
  focus: () => void
  focusClientSearch: () => void
}

interface ClientStepProps {
  client: any | null
  onClientSelect: (client: any) => void
  onClearClient: () => void
  pendingSalesCount: number
  reservationsCount: number
}

export const ClientStep = forwardRef<ClientStepRef, ClientStepProps>(
  ({ client, onClientSelect, onClearClient, pendingSalesCount, reservationsCount }, ref) => {
    const { t } = useI18n()
    const { searchClients } = useClientStore()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)

    useImperativeHandle(ref, () => ({
      focus: () => searchInputRef.current?.focus(),
      focusClientSearch: () => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select?.()
      },
    }))

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <User size={18} className="text-primary" />
          <h3 className="text-label-caps text-on-surface-variant">
            {t('sales.checkoutWizard.step.client', 'Cliente')}
          </h3>
        </div>

        {!client ? (
          <div className="space-y-3">
            <SearchableDropdown
              inputRef={searchInputRef}
              onSelect={onClientSelect}
              onSearch={async (term: string) => {
                if (term.trim().length < 3) return []
                await searchClients(term)
                return useClientStore.getState().searchResults as any[]
              }}
              placeholder={t('sales.checkoutWizard.client.placeholder', 'Buscar cliente por nombre o CI... (F3)')}
              renderItem={(item) => (
                <div className="flex items-center gap-3 py-1">
                  <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.displayName || item.name}</p>
                    {item.document_id && (
                      <p className="text-xs text-on-surface-variant">{item.document_id}</p>
                    )}
                  </div>
                </div>
              )}
              emptyMessage={t('sales.checkoutWizard.client.empty', 'No se encontraron clientes')}
              renderEmpty={() => (
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant">
                    {t('party.quick_client.empty_cta', '¿No lo encontrás? Registralo como nuevo cliente')}
                  </p>
                  <WithPermission anyOf={['clients:write', 'parties:write']}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickModalOpen(true)}
                      className="w-full"
                    >
                      <UserPlus size={14} className="mr-2" />
                      {t('party.quick_client.action', 'Nuevo cliente')}
                    </Button>
                  </WithPermission>
                </div>
              )}
              className="w-full bg-surface-container-lowest shadow-sm"
            />
            <WithPermission anyOf={['clients:write', 'parties:write']}>
              <Button
                variant="outline"
                onClick={() => setIsQuickModalOpen(true)}
                className="w-full h-11 text-on-surface-variant"
              >
                <UserPlus size={16} className="mr-2" />
                {t('party.quick_client.action', 'Nuevo cliente')}
              </Button>
            </WithPermission>
          </div>
        ) : (
          <div className="p-4 bg-surface-container-lowest rounded-md border-2 border-primary/20 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-primary text-lg leading-tight mb-1">
                  {client.displayName || client.name}
                </p>
                {client.document_id && (
                  <div className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">CI/RUC</Badge>
                    {client.document_id}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearClient}
                className="text-outline hover:text-error hover:bg-error-container"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Previews de los próximos pasos condicionales */}
            {pendingSalesCount > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-700">
                  {t('sales.checkoutWizard.client.hasPending', {
                    count: pendingSalesCount,
                    defaultValue: `Este cliente tiene ${pendingSalesCount} venta(s) pendiente(s).`,
                  })}
                </p>
              </div>
            )}
            {reservationsCount > 0 && (
              <div className="mt-2 p-3 bg-sky-50 rounded-md border border-sky-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-sky-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-sky-700">
                  {t('sales.checkoutWizard.client.hasReservations', {
                    count: reservationsCount,
                    defaultValue: `Este cliente tiene ${reservationsCount} reserva(s) confirmada(s).`,
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Registro rápido: autoselecciona al cliente y continúa el checkout */}
        <QuickClientModal
          isOpen={isQuickModalOpen}
          onClose={() => setIsQuickModalOpen(false)}
          onCreated={(created) => {
            setIsQuickModalOpen(false)
            onClientSelect(created)
          }}
        />
      </div>
    )
  },
)

ClientStep.displayName = 'ClientStep'
