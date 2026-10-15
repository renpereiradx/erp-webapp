// ===========================================================================
// TerminalPairing (D.3 + FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Vinculación de este dispositivo (navegador) con una sucursal:
//  - FASE E: registro en backend con código de vinculación → guarda
//    `device.id` (header X-Device-ID en cada request; el middleware resuelve
//    la sucursal server-side) + `device.defaultBranch` como fallback.
//  - Nivel 1 (fallback sin registro): guarda solo `device.defaultBranch`.
// Los usuarios SIN `branches:switch` que operen desde aquí entran directo a
// esa sucursal (resolución en BranchContext, D.4). Ruta:
// /configuracion/terminal, gated con `branches:switch`.
//
// Con dispositivo registrado (PLAN_CLARIDAD_TERMINALES_ESTE_DISPOSITIVO):
//  - D4: el selector de sucursal queda bloqueado — la sucursal registrada
//    manda server-side (X-Device-ID) y el fallback local no puede contradecirla.
//  - D5: el binding se re-sincroniza desde el servidor (nombre/sucursal
//    frescos; un 404 marca el registro como eliminado).
// ===========================================================================

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, MonitorSmartphone, QrCode, Store, Unlink } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { branchService } from '@/features/branches/services/branchService'
import { deviceService } from '@/features/devices/services/deviceService'
import {
  clearPairedDevice, pairDeviceWithBranch, readDeviceDefaultBranch, readDeviceId, setPairedDevice,
} from '@/utils/deviceBranch'
import type { Branch } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const TerminalPairing = () => {
  const { t } = useI18n()
  const { addToast } = useToast()

  const registeredDeviceId = readDeviceId()
  const [pairingCode, setPairingCode] = useState('')
  const [pairing, setPairing] = useState(false)

  // D5: con dispositivo registrado, refrescar el binding desde el servidor
  // (best-effort). Si el registro fue eliminado, el query falla con 404 y la
  // UI avisa en vez de quedar "fantasma" para siempre.
  const deviceQuery = useQuery({
    queryKey: ['device', registeredDeviceId],
    queryFn: () => deviceService.getById(registeredDeviceId as number),
    enabled: registeredDeviceId !== null,
    retry: false,
    staleTime: 60_000,
  })
  const syncedDevice = deviceQuery.data

  useEffect(() => {
    if (syncedDevice && syncedDevice.branch_id !== null) {
      // Mantiene el fallback de nivel 1 alineado con la sucursal del registro.
      pairDeviceWithBranch(syncedDevice.branch_id)
    }
  }, [syncedDevice])

  const staleRegistration =
    registeredDeviceId !== null &&
    deviceQuery.isError &&
    (deviceQuery.error as { response?: { status?: number } } | null)?.response?.status === 404

  const pairedBranchId = syncedDevice?.branch_id ?? readDeviceDefaultBranch()

  const { data: branchesResponse, isLoading } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  })

  const branches: Branch[] = useMemo(
    () => (branchesResponse as { branches?: Branch[] })?.branches || [],
    [branchesResponse],
  )
  const pairedBranch = branches.find((b) => b.id === pairedBranchId) || null
  const isRegistered = registeredDeviceId !== null

  const registeredLabel = syncedDevice
    ? [syncedDevice.name, pairedBranch?.name].filter(Boolean).join(' · ')
    : pairedBranch?.name

  const handlePair = (branch: Branch) => {
    pairDeviceWithBranch(branch.id)
    addToast(
      t('terminal.pairSuccess', 'Dispositivo vinculado a {name}', { name: branch.name }),
      'success',
    )
  }

  const handleRegister = async () => {
    const code = pairingCode.trim()
    if (!code) return
    setPairing(true)
    try {
      const device = await deviceService.pair(code)
      setPairedDevice(device.id, device.branch_id)
      setPairingCode('')
      const branchName = branches.find((b) => b.id === device.branch_id)?.name || `#${device.branch_id}`
      addToast(
        t('terminal.registerSuccess', 'Dispositivo registrado: {name} → {branch}', {
          name: device.name,
          branch: branchName,
        }),
        'success',
      )
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      addToast(e?.response?.data?.message || e?.message || t('terminal.registerError', 'Código de vinculación inválido'), 'error')
    } finally {
      setPairing(false)
    }
  }

  const handleUnpair = () => {
    clearPairedDevice()
    addToast(t('terminal.unpairSuccess', 'Dispositivo desvinculado'), 'success')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <header className="mb-xl flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-md font-black uppercase leading-none tracking-tight text-foreground">
            {t('terminal.title', 'Este dispositivo')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t(
              'terminal.subtitle',
              'Vinculá esta computadora o tablet a una sucursal para que quienes la usen entren directo, sin elegirla en cada inicio de sesión.',
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          {/* Estado de la vinculación */}
          <section className="flex flex-col gap-md" aria-labelledby="terminal-status">
            <h2 id="terminal-status" className="text-label-caps uppercase text-on-surface-deep">
              {t('terminal.statusTitle', 'Estado de este dispositivo')}
            </h2>
            <Card className="border-0 bg-surface p-lg shadow-whisper">
              <CardContent className="flex flex-col gap-sm p-0">
                <div className="flex items-center gap-sm">
                  <span
                    className={`flex size-10 items-center justify-center rounded-md ${
                      pairedBranch ? 'bg-success/10 text-success' : 'bg-surface-muted text-on-surface-deep'
                    }`}
                  >
                    <MonitorSmartphone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    {isRegistered ? (
                      <>
                        <Badge variant="success" className="mb-1">
                          {t('terminal.registeredBadge', 'Registrado (#{id})', { id: String(registeredDeviceId) })}
                        </Badge>
                        <p className="truncate text-body-md-bold text-foreground">
                          {registeredLabel || t('terminal.unpairedHint', 'Este dispositivo no está vinculado a ninguna sucursal.')}
                        </p>
                      </>
                    ) : pairedBranch ? (
                      <>
                        <Badge variant="success" className="mb-1">
                          {t('terminal.pairedBadge', 'Vinculado')}
                        </Badge>
                        <p className="truncate text-body-md-bold text-foreground">{pairedBranch.name}</p>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="mb-1">
                          {t('terminal.unpairedBadge', 'Sin vincular')}
                        </Badge>
                        <p className="text-body-md text-on-surface-deep">
                          {t('terminal.unpairedHint', 'Este dispositivo no está vinculado a ninguna sucursal.')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {staleRegistration && (
                  <p
                    data-testid="terminal-stale-registration"
                    className="rounded-md border border-semantic-warning/40 bg-semantic-warning/10 px-sm py-xs text-body-sm text-semantic-warning"
                  >
                    {t(
                      'terminal.staleRegistration',
                      'El registro de este dispositivo ya no existe (fue eliminado en Configuración → Terminales). Desvinculalo y volvé a registrarlo.',
                    )}
                  </p>
                )}
                {pairedBranch && (
                  <Button variant="secondary" onClick={handleUnpair} className="self-start">
                    <Unlink className="size-4" />
                    {t('terminal.unpair', 'Desvincular este dispositivo')}
                  </Button>
                )}
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    'terminal.effectHint',
                    'Quienes operen desde este dispositivo sin permiso para cambiar de sucursal van a entrar directo a la sucursal vinculada.',
                  )}
                </p>
              </CardContent>
            </Card>

            {/* FASE E: registro de este dispositivo en backend vía código */}
            <Card className="border-0 bg-surface p-lg shadow-whisper">
              <CardContent className="flex flex-col gap-sm p-0">
                <h3 className="text-label-caps uppercase text-on-surface-deep">
                  {t('terminal.registerTitle', 'Registrar este dispositivo')}
                </h3>
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    'terminal.registerHint',
                    'Ingresá el código de vinculación de la terminal (se muestra en Configuración → Terminales).',
                  )}
                </p>
                <div className="flex gap-sm">
                  <Input
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleRegister()
                    }}
                    placeholder={t('terminal.registerPlaceholder', 'Código (ej. ABCD2345)')}
                    aria-label={t('terminal.registerPlaceholder', 'Código (ej. ABCD2345)')}
                    data-testid="terminal-pairing-code"
                    className="font-data-mono text-data-mono uppercase"
                    maxLength={12}
                  />
                  <Button onClick={() => void handleRegister()} disabled={pairing || !pairingCode.trim()} data-testid="terminal-register">
                    <QrCode className="size-4" />
                    {pairing
                      ? t('terminal.registering', 'Registrando…')
                      : t('terminal.register', 'Registrar')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Selector de sucursal */}
          <section className="flex flex-col gap-md lg:col-span-2" aria-labelledby="terminal-branches">
            <h2 id="terminal-branches" className="text-label-caps uppercase text-on-surface-deep">
              {t('terminal.pickTitle', 'Elegir sucursal de este dispositivo')}
            </h2>
            {isRegistered ? (
              /* D4: registrado → la sucursal se administra desde el registro */
              <p data-testid="terminal-registered-lock" className="text-body-sm text-on-surface-deep">
                {t(
                  'terminal.registeredLockHint',
                  'Este dispositivo ya está registrado: su sucursal se administra desde Configuración → Terminales. Para cambiarla desde acá, desvinculá y volvé a registrar el dispositivo.',
                )}
              </p>
            ) : (
              <p data-testid="terminal-local-hint" className="text-body-sm text-on-surface-deep">
                {t('terminal.localHint', 'La vinculación sin código se guarda solo en este navegador.')}
              </p>
            )}
            {isLoading ? (
              <Card className="border-0 bg-surface p-lg shadow-whisper">
                <p className="text-body-md text-on-surface-deep">
                  {t('terminal.loading', 'Cargando sucursales…')}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {branches.map((branch) => {
                  const isPaired = branch.id === pairedBranchId
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handlePair(branch)}
                      disabled={isRegistered}
                      aria-pressed={isPaired}
                      aria-disabled={isRegistered}
                      className={`group flex items-center justify-between gap-md rounded-md border p-md text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isPaired
                          ? 'border-success bg-success/5'
                          : 'border-border-subtle bg-surface shadow-whisper hover:border-primary/40 hover:bg-surface-muted'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-sm">
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                            isPaired ? 'bg-success/10 text-success' : 'bg-surface-muted text-on-surface-deep'
                          }`}
                        >
                          <Store className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-body-md-bold text-foreground">{branch.name}</span>
                          <span className="block truncate text-body-sm text-on-surface-deep">
                            {branch.code} • {branch.city || t('terminal.noCity', 'Sin ciudad')}
                          </span>
                        </span>
                      </span>
                      {isPaired && <CheckCircle2 className="size-5 shrink-0 text-success" />}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default TerminalPairing
