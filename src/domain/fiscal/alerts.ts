/**
 * Dominio fiscal (SIFEN): clasificación de las alertas de operación (S7.2).
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El backend devuelve la lista ordenada por severidad (remediación S7-H4),
 * pero el contrato HTTP no lo garantiza formalmente: el FE re-ordena aquí
 * (mismo criterio crit > warn > info) antes de renderizar, y calcula el
 * nivel máximo del lote para el banner del dashboard (FE5.2).
 */

import type { FiscalAlert, FiscalAlertNivel } from '@/features/fiscal/types';

const NIVEL_RANK: Record<FiscalAlertNivel, number> = { crit: 3, warn: 2, info: 1 };

/** Ordena crit → warn → info (estable: conserva el orden de detección dentro de cada nivel). */
export const sortAlertsBySeverity = (alertas: FiscalAlert[]): FiscalAlert[] =>
  [...alertas].sort((a, b) => NIVEL_RANK[b.nivel] - NIVEL_RANK[a.nivel]);

/** El nivel más severo del lote; 'info' para lote vacío (contrato del backend). */
export const maxAlertLevel = (alertas: FiscalAlert[]): FiscalAlertNivel =>
  alertas.reduce<FiscalAlertNivel>(
    (max, a) => (NIVEL_RANK[a.nivel] > NIVEL_RANK[max] ? a.nivel : max),
    'info',
  );
