import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  AUDIT_LEVEL_TONE,
  AUDIT_RESULT_TONE,
  AUDIT_SEVERITY_TONE,
  auditAlertTypeFallback,
  auditAlertTypeLabelKey,
  auditLevelFallback,
  auditLevelKey,
  auditLevelLabelKey,
  auditResultKey,
  auditResultLabelKey,
  auditSeverityFallback,
  auditSeverityKey,
  auditSeverityLabelKey,
  type AuditBadgeTone,
} from '@/domain/audit/labels'

const TONE_CLASSES: Record<AuditBadgeTone, string> = {
  info: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

/** Badge semántico de auditoría (nivel, resultado, severidad). */
export const AuditBadge = ({
  tone,
  children,
  testId,
}: {
  tone: AuditBadgeTone
  children: ReactNode
  testId?: string
}) => (
  <span
    className={`inline-flex w-max items-center rounded-full px-sm py-xs text-body-sm-bold ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

const LEVEL_FALLBACK: Record<string, string> = {
  info: 'Informativo',
  warning: 'Advertencia',
  error: 'Error',
  critical: 'Crítico',
}

export const AuditLevelBadge = ({ level }: { level: string | null | undefined }) => {
  const { t } = useI18n()
  const key = auditLevelKey(level)
  return (
    <AuditBadge tone={AUDIT_LEVEL_TONE[key]} testId={`audit-level-${key}`}>
      {t(auditLevelLabelKey(level), LEVEL_FALLBACK[key] ?? auditLevelFallback(level))}
    </AuditBadge>
  )
}

const RESULT_FALLBACK: Record<string, string> = {
  success: 'Éxito',
  failure: 'Fallo',
}

export const AuditResultBadge = ({ success }: { success: boolean | null | undefined }) => {
  const { t } = useI18n()
  const key = auditResultKey(success)
  return (
    <AuditBadge tone={AUDIT_RESULT_TONE[key]} testId={`audit-result-${key}`}>
      {t(auditResultLabelKey(success), RESULT_FALLBACK[key])}
    </AuditBadge>
  )
}

const SEVERITY_FALLBACK: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const AuditSeverityBadge = ({
  severity,
}: {
  severity: string | null | undefined
}) => {
  const { t } = useI18n()
  const key = auditSeverityKey(severity)
  return (
    <AuditBadge tone={AUDIT_SEVERITY_TONE[key]} testId={`audit-severity-${key}`}>
      {t(auditSeverityLabelKey(severity), SEVERITY_FALLBACK[key] ?? auditSeverityFallback(severity))}
    </AuditBadge>
  )
}

/** Tipo de alerta de seguridad traducido (nunca el texto en español del SQL). */
export const auditAlertTypeLabel = (
  type: string | null | undefined,
  t: (key: string, fallback?: string) => string,
): string => t(auditAlertTypeLabelKey(type), auditAlertTypeFallback(type))

export default AuditBadge
