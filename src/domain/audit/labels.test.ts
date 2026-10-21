import { describe, expect, it } from 'vitest'
import {
  AUDIT_FILTER_CATEGORIES,
  AUDIT_FILTER_LEVELS,
  AUDIT_LEVEL_TONE,
  AUDIT_RESULT_TONE,
  AUDIT_SEVERITY_TONE,
  auditActionFallback,
  auditActionKey,
  auditActionLabelKey,
  auditAlertTypeFallback,
  auditAlertTypeKey,
  auditCategoryFallback,
  auditCategoryKey,
  auditCategoryLabelKey,
  auditLevelFallback,
  auditLevelKey,
  auditLevelLabelKey,
  auditResultKey,
  auditResultLabelKey,
  auditSeverityFallback,
  auditSeverityKey,
} from './labels'

describe('audit/labels', () => {
  it('traduce las categorías del modelo y LEGACY', () => {
    expect(auditCategoryKey('auth')).toBe('auth')
    expect(auditCategoryKey('CASH_REGISTER')).toBe('cashRegister')
    expect(auditCategoryKey('LEGACY')).toBe('legacy')
    expect(auditCategoryFallback('CASH_REGISTER')).toBe('Caja')
    expect(auditCategoryFallback('LEGACY')).toBe('Histórico')
    expect(auditCategoryLabelKey('PAYMENT')).toBe('audit.category.payment')
  })

  it('muestra crudo un código de categoría desconocido (no lo inventa)', () => {
    expect(auditCategoryKey('SYSTEM_V2')).toBe('unknown')
    expect(auditCategoryFallback('SYSTEM_V2')).toBe('SYSTEM_V2')
    expect(auditCategoryFallback(null)).toBe('—')
  })

  it('traduce las acciones y la acción heredada INSERT', () => {
    expect(auditActionKey('CREATE')).toBe('create')
    expect(auditActionKey('INSERT')).toBe('insert')
    expect(auditActionFallback('INSERT')).toBe('Alta (histórico)')
    expect(auditActionFallback('LOGIN')).toBe('Inicio de sesión')
    expect(auditActionLabelKey('UPDATE')).toBe('audit.action.update')
    expect(auditActionFallback('BULK_LOAD')).toBe('BULK_LOAD')
  })

  it('niveles: traducción, tono y fallback crudo', () => {
    expect(auditLevelKey('critical')).toBe('critical')
    expect(auditLevelFallback('CRITICAL')).toBe('Crítico')
    expect(auditLevelFallback('TRACE')).toBe('TRACE')
    expect(auditLevelLabelKey('INFO')).toBe('audit.level.info')
    expect(AUDIT_LEVEL_TONE.critical).toBe('error')
    expect(AUDIT_LEVEL_TONE.info).toBe('info')
  })

  it('resultado: success/failure con tono propio', () => {
    expect(auditResultKey(true)).toBe('success')
    expect(auditResultKey(false)).toBe('failure')
    expect(auditResultLabelKey(false)).toBe('audit.result.failure')
    expect(AUDIT_RESULT_TONE.failure).toBe('error')
    expect(AUDIT_RESULT_TONE.success).toBe('success')
  })

  it('alertas de seguridad: severidad y tipo', () => {
    expect(auditSeverityKey('HIGH')).toBe('high')
    expect(auditSeverityFallback('MEDIUM')).toBe('Media')
    expect(AUDIT_SEVERITY_TONE.high).toBe('error')
    expect(auditAlertTypeKey('FAILED_LOGINS')).toBe('failedLogins')
    expect(auditAlertTypeKey('UNUSUAL_ACTIVITY')).toBe('unusualActivity')
    expect(auditAlertTypeFallback('UNUSUAL_ACTIVITY')).toBe('Actividad inusual')
    expect(auditAlertTypeFallback('OTHER')).toBe('OTHER')
  })

  it('el filtro de categorías incluye el enum vigente y LEGACY', () => {
    expect(AUDIT_FILTER_CATEGORIES).toContain('AUTH')
    expect(AUDIT_FILTER_CATEGORIES).toContain('LEGACY')
    expect(AUDIT_FILTER_CATEGORIES).toHaveLength(17)
    expect(AUDIT_FILTER_LEVELS).toEqual(['INFO', 'WARNING', 'ERROR', 'CRITICAL'])
  })
})
