import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import {
  AuditDetailGrid,
  AuditJsonPanel,
  AuditLevelBadge,
  AuditPageLayout,
  AuditRefreshButton,
  AuditResultBadge,
  useAuditLog,
  type AuditDetailItem,
} from '@/features/audit'
import {
  auditActionFallback,
  auditActionLabelKey,
  auditCategoryFallback,
  auditCategoryLabelKey,
} from '@/domain/audit/labels'
import {
  formatCount,
  formatDateTime,
  formatDuration,
} from '@/domain/audit/format'
import { formatJsonValue, hasJsonContent } from '@/domain/audit/json'
import { isNotFoundError } from '@/domain/audit/errors'

/**
 * F10 — Detalle de un evento. Muestra únicamente los campos del contrato
 * (`username`, `timestamp`, `request_method/path`, `response_status`,
 * `duration_ms`, `old_values/new_values/metadata`). El 404 del BE (evento
 * inexistente o de otra sucursal) es un estado propio, no un fallo genérico.
 */
const AuditLogDetailPage = () => {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const query = useAuditLog(id ?? '')
  const errorTitle = t('audit.errors.title', 'No se pudieron cargar los datos')

  const backToLogs = () => navigate('/auditoria/logs')
  const actions = (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
      <Button
        variant="secondary"
        size="md"
        onClick={backToLogs}
        data-testid="audit-detail-back"
      >
        <ArrowLeft size={16} className="mr-sm" aria-hidden="true" />
        {t('audit.detail.backToLogs', 'Volver al registro')}
      </Button>
      <AuditRefreshButton />
    </div>
  )

  const title = id
    ? t('audit.detail.title', 'Evento #{id}', { id })
    : t('audit.detail.titleFallback', 'Detalle del evento')

  const renderNotFound = () => (
    <SectionCard title={t('audit.detail.notFoundCard', 'Detalle del evento')} testId="audit-detail-not-found">
      <div className="flex flex-col items-center gap-md py-xl">
        <TableEmptyState
          icon={FileQuestion}
          title={t('audit.detail.notFoundTitle', 'Evento no encontrado')}
          description={
            id
              ? t(
                  'audit.detail.notFoundMessageWithId',
                  'El evento {id} no existe o pertenece a otra sucursal.',
                  { id },
                )
              : t(
                  'audit.detail.notFoundMessage',
                  'El identificador del evento no está presente en la ruta.',
                )
          }
        />
        <Button variant="primary" size="md" onClick={backToLogs}>
          {t('audit.detail.backToLogs', 'Volver al registro')}
        </Button>
      </div>
    </SectionCard>
  )

  const renderContent = () => {
    if (!id) return renderNotFound()
    if (query.error && isNotFoundError(query.error)) return renderNotFound()

    const log = query.data
    const oldValues = formatJsonValue(log?.old_values)
    const newValues = formatJsonValue(log?.new_values)
    const metadata = formatJsonValue(log?.metadata)
    const hasChanges =
      Boolean(log) &&
      (hasJsonContent(log?.old_values) ||
        hasJsonContent(log?.new_values) ||
        hasJsonContent(log?.metadata))
    const hasHttp = Boolean(
      log &&
        (log.request_method ||
          log.request_path ||
          log.response_status !== undefined ||
          log.duration_ms !== undefined),
    )
    const hasEntity = Boolean(log && (log.entity_type || log.entity_id))

    const eventItems: AuditDetailItem[] = [
      {
        id: 'timestamp',
        label: t('audit.detail.fields.timestamp', 'Fecha y hora'),
        value: formatDateTime(log?.timestamp, lang),
        mono: true,
      },
      {
        id: 'category',
        label: t('audit.detail.fields.category', 'Categoría'),
        value: log
          ? t(auditCategoryLabelKey(log.category), auditCategoryFallback(log.category))
          : '—',
      },
      {
        id: 'action',
        label: t('audit.detail.fields.action', 'Acción'),
        value: log ? t(auditActionLabelKey(log.action), auditActionFallback(log.action)) : '—',
      },
      {
        id: 'level',
        label: t('audit.detail.fields.level', 'Nivel'),
        value: log ? <AuditLevelBadge level={log.level} /> : '—',
      },
      {
        id: 'result',
        label: t('audit.detail.fields.result', 'Resultado'),
        value: log ? <AuditResultBadge success={log.success} /> : '—',
      },
      {
        id: 'description',
        label: t('audit.detail.fields.description', 'Descripción'),
        value: log?.description || '—',
        wide: true,
      },
    ]
    if (log?.error_message) {
      eventItems.push({
        id: 'error',
        label: t('audit.detail.fields.error', 'Mensaje de error'),
        value: log.error_message,
        wide: true,
      })
    }

    const contextItems: AuditDetailItem[] = [
      {
        id: 'user',
        label: t('audit.detail.fields.user', 'Usuario'),
        value: log?.user_id ? (
          <Link
            to={`/auditoria/usuarios/${encodeURIComponent(log.user_id)}`}
            className="break-all text-primary hover:underline"
          >
            {log.username || log.user_id}
          </Link>
        ) : (
          '—'
        ),
      },
      {
        id: 'session',
        label: t('audit.detail.fields.session', 'Sesión'),
        value: log?.session_id || '—',
        mono: true,
      },
      {
        id: 'branch',
        label: t('audit.detail.fields.branch', 'Sucursal'),
        value: log?.branch_id !== undefined ? formatCount(log.branch_id) : '—',
        mono: true,
      },
      {
        id: 'ip',
        label: t('audit.detail.fields.ip', 'Dirección IP'),
        value: log?.ip_address || '—',
        mono: true,
      },
      {
        id: 'userAgent',
        label: t('audit.detail.fields.userAgent', 'User agent'),
        value: log?.user_agent || '—',
        wide: true,
      },
    ]

    return (
      <>
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={6} testId="audit-detail-skeleton" />}
        >
          <div className="grid gap-lg xl:grid-cols-2">
            <SectionCard
              title={t('audit.detail.eventTitle', 'Evento')}
              description={t(
                'audit.detail.eventDescription',
                'Datos del evento tal como los registró el middleware de auditoría.',
              )}
              testId="audit-detail-event"
            >
              <AuditDetailGrid items={eventItems} testId="audit-detail-event-grid" />
            </SectionCard>

            <SectionCard
              title={t('audit.detail.contextTitle', 'Contexto')}
              description={t(
                'audit.detail.contextDescription',
                'Usuario, sesión e identificación de red del evento.',
              )}
              testId="audit-detail-context"
            >
              <AuditDetailGrid items={contextItems} testId="audit-detail-context-grid" />
            </SectionCard>

            {hasHttp ? (
              <SectionCard
                title={t('audit.detail.requestTitle', 'Solicitud HTTP')}
                description={t(
                  'audit.detail.requestDescription',
                  'Método, ruta y resultado HTTP que produjo el evento.',
                )}
                testId="audit-detail-request"
              >
                <AuditDetailGrid
                  testId="audit-detail-request-grid"
                  items={[
                    {
                      id: 'method',
                      label: t('audit.detail.fields.method', 'Método'),
                      value: log?.request_method || '—',
                      mono: true,
                    },
                    {
                      id: 'path',
                      label: t('audit.detail.fields.path', 'Ruta'),
                      value: log?.request_path || '—',
                      mono: true,
                      wide: true,
                    },
                    {
                      id: 'status',
                      label: t('audit.detail.fields.responseStatus', 'Estado HTTP'),
                      value:
                        log?.response_status !== undefined
                          ? formatCount(log.response_status)
                          : '—',
                      mono: true,
                    },
                    {
                      id: 'duration',
                      label: t('audit.detail.fields.duration', 'Duración'),
                      value: formatDuration(log?.duration_ms),
                      mono: true,
                    },
                  ]}
                />
              </SectionCard>
            ) : null}

            {hasEntity ? (
              <SectionCard
                title={t('audit.detail.entityTitle', 'Entidad afectada')}
                description={t(
                  'audit.detail.entityDescription',
                  'Identificadores técnicos del recurso (códigos del contrato, sin traducir).',
                )}
                testId="audit-detail-entity"
              >
                <AuditDetailGrid
                  testId="audit-detail-entity-grid"
                  items={[
                    {
                      id: 'entityType',
                      label: t('audit.detail.fields.entityType', 'Tipo de entidad'),
                      value: log?.entity_type || '—',
                      mono: true,
                    },
                    {
                      id: 'entityId',
                      label: t('audit.detail.fields.entityId', 'ID de entidad'),
                      value: log?.entity_id || '—',
                      mono: true,
                    },
                  ]}
                />
              </SectionCard>
            ) : null}
          </div>
        </QueryBoundary>

        {hasChanges ? (
          <SectionCard
            title={t('audit.detail.changesTitle', 'Datos registrados')}
            description={t(
              'audit.detail.changesDescription',
              'Valores previos, nuevos y metadata tal como los guardó el backend.',
            )}
            testId="audit-detail-changes"
          >
            <div className="grid gap-lg xl:grid-cols-2">
              {oldValues ? (
                <AuditJsonPanel
                  title={t('audit.detail.fields.oldValues', 'Valores anteriores')}
                  content={oldValues}
                  testId="audit-detail-old-values"
                />
              ) : null}
              {newValues ? (
                <AuditJsonPanel
                  title={t('audit.detail.fields.newValues', 'Valores nuevos')}
                  content={newValues}
                  testId="audit-detail-new-values"
                />
              ) : null}
              {metadata ? (
                <AuditJsonPanel
                  title={t('audit.detail.fields.metadata', 'Metadata')}
                  content={metadata}
                  testId="audit-detail-metadata"
                />
              ) : null}
            </div>
          </SectionCard>
        ) : null}
      </>
    )
  }

  return (
    <AuditPageLayout
      title={title}
      subtitle={t(
        'audit.detail.subtitle',
        'Evento individual del registro de auditoría del sistema.',
      )}
      actions={actions}
    >
      {renderContent()}
    </AuditPageLayout>
  )
}

export default AuditLogDetailPage
