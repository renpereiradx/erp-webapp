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
  PaymentHistoryTable,
  ReceivableSummaryPanel,
  ReceivablesPageLayout,
  ReceivablesRefreshButton,
  useReceivableDetail,
} from '@/features/receivables'
import { isNotFoundError } from '@/domain/receivables/errors'

/**
 * F7 — Detalle de una cuenta por cobrar. 404 del BE = estado propio ("cuenta
 * no encontrada"), no un error genérico. No se muestra `due_date`: el payload
 * lo sintetiza como venta + 30 días.
 */
const ReceivableDetailPage = () => {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const query = useReceivableDetail(id ?? '')

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const backToList = () => navigate('/receivables/list')

  const actions = (
    <>
      <Button variant='secondary' size='md' onClick={backToList} data-testid='receivables-detail-back'>
        <ArrowLeft size={16} className='mr-sm' aria-hidden='true' />
        {t('receivables.detail.backToList', 'Volver al listado')}
      </Button>
      <ReceivablesRefreshButton />
    </>
  )

  const renderContent = () => {
    if (!id) {
      return (
        <SectionCard title={t('receivables.detail.title', 'Detalle de la cuenta')}>
          <TableEmptyState
            icon={FileQuestion}
            title={t('receivables.detail.notFoundTitle', 'Cuenta no encontrada')}
            description={t(
              'receivables.detail.notFoundMessage',
              'La cuenta no existe o no pertenece a la sucursal activa.',
            )}
          />
        </SectionCard>
      )
    }

    if (query.error && isNotFoundError(query.error)) {
      return (
        <SectionCard title={t('receivables.detail.title', 'Detalle de la cuenta')}>
          <div className='flex flex-col items-center gap-md py-xl'>
            <TableEmptyState
              icon={FileQuestion}
              title={t('receivables.detail.notFoundTitle', 'Cuenta no encontrada')}
              description={t(
                'receivables.detail.notFoundMessageWithId',
                'La cuenta {id} no existe o no pertenece a la sucursal activa.',
                { id },
              )}
            />
          </div>
        </SectionCard>
      )
    }

    const receivable = query.data?.receivable
    const payments = query.data?.payments ?? []

    return (
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        errorTitle={errorTitle}
        onRetry={() => void query.refetch()}
        skeleton={<PanelSkeleton rows={4} testId='receivables-detail-skeleton' />}
      >
        <SectionCard
          title={t('receivables.detail.summaryTitle', 'Resumen de la cuenta')}
          description={t(
            'receivables.detail.summarySubtitle',
            'Saldos y estado que informa el backend para esta venta.',
          )}
          testId='receivables-detail-card'
        >
          {receivable ? <ReceivableSummaryPanel receivable={receivable} locale={lang} /> : null}
          <p className='mt-md text-body-sm text-on-surface-deep'>
            {t(
              'receivables.detail.dueDateNote',
              'Los días vencidos usan el vencimiento de la orden (30 días desde la venta si no tiene uno configurado).',
            )}
          </p>
        </SectionCard>

        <TableCard
          title={t('receivables.detail.paymentsTitle', 'Historial de pagos')}
          description={t(
            'receivables.detail.paymentsSubtitle',
            'Pagos no cancelados asociados a la venta.',
          )}
          testId='receivables-detail-payments-card'
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<TableSkeleton rows={3} testId='receivables-detail-payments-skeleton' />}
          >
            <PaymentHistoryTable payments={payments} locale={lang} />
          </QueryBoundary>
        </TableCard>
      </QueryBoundary>
    )
  }

  return (
    <ReceivablesPageLayout
      title={
        id
          ? t('receivables.detail.titleWithId', 'Cuenta {id}', { id })
          : t('receivables.detail.title', 'Detalle de la cuenta')
      }
      subtitle={t(
        'receivables.detail.subtitle',
        'Saldos, estado y pagos registrados.',
      )}
      actions={actions}
    >
      {renderContent()}
    </ReceivablesPageLayout>
  )
}

export default ReceivableDetailPage
