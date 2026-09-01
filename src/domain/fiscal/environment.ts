/**
 * Dominio fiscal (SIFEN): estado del ambiente de emisión (H9-audit S6 —
 * cierre de la promesa FE2.2: "lectura de estado del ambiente en FE5.2").
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El backend expone la vista pública de cada ambiente por separado
 * (GET /sifen/config/{ambiente} — TEST|PROD, S2.5, enmascarada: flags
 * csc_set/has_cert, jamás los secretos). No existe un endpoint "ambiente
 * activo": el FE consulta ambos y resuelve aquí cuál rige — si ambos
 * estuvieran activos gana PROD (la verdad más riesgosa es la que ops
 * debe ver primero).
 */

import type { SifenConfigPublic } from '@/features/fiscal/types';

export type SifenAmbiente = 'TEST' | 'PROD';

/** Salud de la configuración del ambiente que rige. */
export type EnvironmentHealth =
  | 'ok' // activo con CSC + certificado cargados
  | 'incomplete' // activo pero le falta el CSC o el certificado
  | 'inactive' // hay config persistida pero ninguna activa (emisión apagada)
  | 'unconfigured'; // ningún ambiente tiene config (emisión imposible)

export interface EnvironmentStatus {
  /** Config del ambiente que rige (activo, o la de mayor exposición configurada); null = sin config. */
  active: SifenConfigPublic | null;
  health: EnvironmentHealth;
}

const healthOf = (cfg: SifenConfigPublic): EnvironmentHealth =>
  cfg.csc_set && cfg.has_cert ? 'ok' : 'incomplete';

export const resolveEnvironmentStatus = (
  test: SifenConfigPublic | null,
  prod: SifenConfigPublic | null,
): EnvironmentStatus => {
  if (!test && !prod) return { active: null, health: 'unconfigured' };

  const active = (prod?.is_active && prod) || (test?.is_active && test) || null;
  if (active) return { active, health: healthOf(active) };

  // Ninguna activa: la emisión está apagada (D3). Mostramos la config de
  // mayor exposición que exista — PROD primero por el mismo criterio.
  return { active: prod ?? test, health: 'inactive' };
};
