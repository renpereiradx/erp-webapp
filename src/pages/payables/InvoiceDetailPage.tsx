import { ArrowLeft, FileQuestion } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  PayablesPageLayout,
  PayablesRefreshButton,
  PayablesSummaryPanel,
  PaymentHistoryTable,
  usePayableDetail,
} from '@/features/payables'
import { isNotFoundError } from '@/domain/payables/errors'

/**
 * F8 — Detalle de una cuenta por pagar. 404 del BE = estado propio ("cuenta
 * no encontrada"), no un error genérico. El vencimiento mostrado es el
 * sintético del BE (compra + 30 días) y la pantalla lo aclara.
 */
const InvoiceDetailPage = () => {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const query = usePayableDetail(id ?? '')

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')
  const backToList = () => navigate('/payables/invoices')

  const actions = (
    <>
      <Button
        variant='secondary'
        size='md'
        onClick={backToList}
        data-testid='payables-detail-back'
      >
        <ArrowLeft size={16} className='mr-sm' aria-hidden='true' />
        {t('payables.detail.backToList', 'Volver al listado')}
      </Button>
      <PayablesRefreshButton />
    </>
  )

  const renderContent = () => {
    if (!id) {
      return (
        <SectionCard title={t('payables.detail.title', 'Detalle de la cuenta')}>
          <TableEmptyState
            icon={FileQuestion}
            title={t('payables.detail.notFoundTitle', 'Cuenta no encontrada')}
            description={t(
              'payables.detail.notFoundMessage',
              'La cuenta no existe o no pertenece a la sucursal activa.',
            )}
          />
        </SectionCard>
      )
    }

    if (query.error && isNotFoundError(query.error)) {
      return (
        <SectionCard title={t('payables.detail.title', 'Detalle de la cuenta')}>
          <div className='flex flex-col items-center gap-md py-xl'>
            <TableEmptyState
              icon={FileQuestion}
              title={t('payables.detail.notFoundTitle', 'Cuenta no encontrada')}
              description={t(
                'payables.detail.notFoundMessageWithId',
                'La cuenta {id} no existe o no pertenece a la sucursal activa.',
                { id },
              )}
            />
          </div>
        </SectionCard>
      )
    }

    const payable = query.data
    const payments = payable?.payment_history ?? []

    return (
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        errorTitle={errorTitle}
        onRetry={() => void query.refetch()}
        skeleton={<PanelSkeleton rows={4} testId='payables-detail-skeleton' />}
      >
        <SectionCard
          title={t('payables.detail.summaryTitle', 'Resumen de la cuenta')}
          description={t(
            'payables.detail.summarySubtitle',
            'Saldos, estado y fechas que informa el backend para esta compra.',
          )}
          testId='payables-detail-card'
        >
          {payable ? <PayablesSummaryPanel payable={payable} locale={lang} /> : null}
          <p className='mt-md text-body-sm text-on-surface-deep'>
            {t(
              'payables.detail.dueDateNote',
              'El vencimiento no es una condición del proveedor: el sistema usa compra + 30 días para el estado, la prioridad y la antigüedad.',
            )}
          </p>
        </SectionCard>

        <TableCard
          title={t('payables.detail.paymentsTitle', 'Historial de pagos')}
          description={t(
            'payables.detail.paymentsSubtitle',
            'Pagos no cancelados asociados a la orden de compra.',
          )}
          testId='payables-detail-payments-card'
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<TableSkeleton rows={3} testId='payables-detail-payments-skeleton' />}
          >
            <PaymentHistoryTable payments={payments} locale={lang} />
          </QueryBoundary>
        </TableCard>
      </QueryBoundary>
    )
  }

  return (
    <PayablesPageLayout
      title={
        id
          ? t('payables.detail.titleWithId', 'Cuenta {id}', { id })
          : t('payables.detail.title', 'Detalle de la cuenta')
      }
      subtitle={t(
        'payables.detail.subtitle',
        'Saldos, estado y pagos registrados de la compra.',
      )}
      actions={actions}
    >
      {renderContent()}
    </PayablesPageLayout>
  )
}

export default InvoiceDetailPage
