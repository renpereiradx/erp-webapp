import { describe, it, expect } from 'vitest';
import {
  FISCAL_STATES,
  FISCAL_STATE_META,
  FISCAL_DOC_TYPES,
  isFiscalState,
  fiscalStateMeta,
  fiscalDocTypeFromCode,
  fiscalDocTypeToCode,
} from './states';
import { DICTIONARY } from '@/lib/i18n';

describe('FISCAL_STATES', () => {
  it('cubre los 7 estados del ciclo de vida del backend', () => {
    expect(FISCAL_STATES).toEqual([
      'EMITIDO',
      'APROBADO',
      'APROBADO_OBS',
      'RECHAZADO',
      'CANCELADO',
      'INUTILIZADO',
      'CANCELACION_PENDIENTE',
    ]);
  });

  it('isFiscalState discrimina valores conocidos y desconocidos', () => {
    expect(isFiscalState('APROBADO')).toBe(true);
    expect(isFiscalState('CANCELACION_PENDIENTE')).toBe(true);
    expect(isFiscalState('FACTURADO')).toBe(false);
    expect(isFiscalState('')).toBe(false);
  });
});

describe('fiscalStateMeta', () => {
  it('mapea severidad de Badge por estado', () => {
    expect(FISCAL_STATE_META.APROBADO.badgeVariant).toBe('success');
    expect(FISCAL_STATE_META.APROBADO_OBS.badgeVariant).toBe('warning');
    expect(FISCAL_STATE_META.RECHAZADO.badgeVariant).toBe('destructive');
    expect(FISCAL_STATE_META.EMITIDO.badgeVariant).toBe('info');
    expect(FISCAL_STATE_META.CANCELADO.badgeVariant).toBe('secondary');
    expect(FISCAL_STATE_META.INUTILIZADO.badgeVariant).toBe('secondary');
    expect(FISCAL_STATE_META.CANCELACION_PENDIENTE.badgeVariant).toBe('warning');
  });

  it('cae a fallback neutro para estados desconocidos', () => {
    const meta = fiscalStateMeta('ESTADO_FUTURO');
    expect(meta.badgeVariant).toBe('secondary');
    expect(meta.i18nKey).toBe('fiscal.states.UNKNOWN');
  });

  it('cada estado conocido resuelve en el diccionario ES', () => {
    FISCAL_STATES.forEach(state => {
      const key = fiscalStateMeta(state).i18nKey;
      expect(DICTIONARY.es[key], `clave i18n faltante: ${key}`).toBeTruthy();
    });
  });
});

describe('FISCAL_DOC_TYPES', () => {
  it('mapea los 3 tipos SIFEN (iTiDE 1/5/6)', () => {
    expect(FISCAL_DOC_TYPES).toEqual([
      { code: 1, docType: 'FACTURA', i18nKey: 'fiscal.docTypes.FACTURA' },
      { code: 5, docType: 'NCE', i18nKey: 'fiscal.docTypes.NCE' },
      { code: 6, docType: 'NDE', i18nKey: 'fiscal.docTypes.NDE' },
    ]);
  });

  it('fiscalDocTypeFromCode resuelve código → tipo', () => {
    expect(fiscalDocTypeFromCode(1)?.docType).toBe('FACTURA');
    expect(fiscalDocTypeFromCode(5)?.docType).toBe('NCE');
    expect(fiscalDocTypeFromCode(6)?.docType).toBe('NDE');
    expect(fiscalDocTypeFromCode(99)).toBeUndefined();
  });

  it('fiscalDocTypeToCode resuelve tipo → código', () => {
    expect(fiscalDocTypeToCode('FACTURA')).toBe(1);
    expect(fiscalDocTypeToCode('NCE')).toBe(5);
    expect(fiscalDocTypeToCode('NDE')).toBe(6);
    expect(fiscalDocTypeToCode('NOTA')).toBeUndefined();
  });

  it('cada tipo resuelve en el diccionario ES', () => {
    FISCAL_DOC_TYPES.forEach(docType => {
      expect(DICTIONARY.es[docType.i18nKey], `clave i18n faltante: ${docType.i18nKey}`).toBeTruthy();
    });
  });
});
