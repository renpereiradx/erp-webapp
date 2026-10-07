/**
 * SystemVersionBadge — ÚNICA vía de render de la versión del sistema
 * (PLAN_VERSION_UI_FRONTEND_2026-10-07). El número proviene del build FE
 * (`__APP_VERSION__` ← package.json) y, como detalle, del backend (`GET
 * /version`, traído una sola vez por useVersionStore). Si las bases SemVer
 * difieren, la instalación está parcialmente actualizada y el badge lo
 * muestra (D4). Prohibido renderizar versiones desde otro componente:
 * guard `version-literal` en lint:design.
 */

import { useEffect } from 'react'
import useVersionStore from '@/store/useVersionStore'
import {
  compareWithBackend,
  displayBuildDate,
  displayVersion,
  normalizeVersion,
  versionBase,
} from '@/domain/version/version'
import { useI18n } from '@/lib/i18n'

interface SystemVersionBadgeProps {
  /** Tipografía/contexto del contenedor (el caller define tamaño y color base). */
  className?: string
}

export function SystemVersionBadge({ className = '' }: SystemVersionBadgeProps) {
  const { t } = useI18n()
  const feVersion = useVersionStore((s) => s.feVersion)
  const backend = useVersionStore((s) => s.backend)
  const status = useVersionStore((s) => s.status)
  const fetchVersion = useVersionStore((s) => s.fetchVersion)

  useEffect(() => {
    void fetchVersion()
  }, [fetchVersion])

  const label = displayVersion(feVersion)
  if (!label) return null

  const readyBackend = status === 'ready' ? backend : null
  const divergence = compareWithBackend(feVersion, readyBackend)
  // Title: versión completa del BE (con sufijo git describe, informativo para
  // soporte). La línea del badge usa la base, sin sufijos de build.
  const serverFull = backend ? `v${normalizeVersion(backend.version)}` : ''
  const serverBase = readyBackend ? displayVersion(versionBase(readyBackend.version)) : ''

  const titleLines: string[] = []
  titleLines.push(
    divergence === 'unknown'
      ? t('version.server_unavailable', 'Versión del servidor no disponible')
      : `${t('version.server', 'Servidor')}: ${serverFull}`,
  )
  if (readyBackend?.commit) {
    titleLines.push(`${t('version.commit', 'Commit')}: ${readyBackend.commit}`)
  }
  const buildDate = displayBuildDate(readyBackend?.build_date)
  if (buildDate) {
    titleLines.push(`${t('version.built', 'Compilado')}: ${buildDate}`)
  }
  if (divergence === 'diverged') {
    titleLines.push(
      t(
        'version.divergence_hint',
        'La versión del servidor difiere de la aplicación: instalación parcialmente actualizada.',
      ),
    )
  }

  return (
    <span
      className={`inline whitespace-nowrap ${divergence === 'diverged' ? 'text-warning' : ''} ${className}`}
      title={titleLines.join('\n')}
      data-testid="system-version-badge"
    >
      {label}
      {divergence === 'diverged' && (
        <>
          {' · '}
          {t('version.server', 'Servidor')} {serverBase}
        </>
      )}
    </span>
  )
}

export default SystemVersionBadge
