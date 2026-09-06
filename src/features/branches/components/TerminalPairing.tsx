// ===========================================================================
// TerminalPairing (D.3 + FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Emparejamiento de esta terminal (navegador) con una sucursal:
//  - FASE E: registro en backend con código de emparejamiento → guarda
//    `device.id` (header X-Device-ID en cada request; el middleware resuelve
//    la sucursal server-side) + `device.defaultBranch` como fallback.
//  - Nivel 1 (fallback sin registro): guarda solo `device.defaultBranch`.
// Los usuarios SIN `branches:switch` que operen desde aquí entran directo a
// esa sucursal (resolución en BranchContext, D.4). Ruta:
// /configuracion/terminal, gated con `branches:switch`.
// ===========================================================================

import { useMemo, useState } from 'react'
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

  const pairedBranchId = readDeviceDefaultBranch()
  const registeredDeviceId = readDeviceId()
  const [pairingCode, setPairingCode] = useState('')
  const [pairing, setPairing] = useState(false)

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

  const handlePair = (branch: Branch) => {
    pairDeviceWithBranch(branch.id)
    addToast(
      t('terminal.pairSuccess', 'Terminal vinculada a {name}', { name: branch.name }),
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
        t('terminal.registerSuccess', 'Terminal registrada: {name} → {branch}', {
          name: device.name,
          branch: branchName,
        }),
        'success',
      )
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      addToast(e?.response?.data?.message || e?.message || t('terminal.registerError', 'Código de emparejamiento inválido'), 'error')
    } finally {
      setPairing(false)
    }
  }

  const handleUnpair = () => {
    clearPairedDevice()
    addToast(t('terminal.unpairSuccess', 'Terminal desvinculada'), 'success')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <header className="mb-xl flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-md font-black uppercase leading-none tracking-tight text-foreground">
            {t('terminal.title', 'Terminal')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t(
              'terminal.subtitle',
              'Vincula este dispositivo a una sucursal para operar sin elegir sucursal en cada inicio.',
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          {/* Estado del emparejamiento */}
          <section className="flex flex-col gap-md" aria-labelledby="terminal-status">
            <h2 id="terminal-status" className="text-label-caps uppercase text-on-surface-deep">
              {t('terminal.statusTitle', 'Estado de esta terminal')}
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
                    {registeredDeviceId ? (
                      <>
                        <Badge variant="success" className="mb-1">
                          {t('terminal.registeredBadge', 'Registrada (#{id})', { id: String(registeredDeviceId) })}
                        </Badge>
                        <p className="truncate text-body-md-bold text-foreground">
                          {pairedBranch?.name || t('terminal.unpairedHint', 'Esta terminal no tiene sucursal asignada.')}
                        </p>
                      </>
                    ) : pairedBranch ? (
                      <>
                        <Badge variant="success" className="mb-1">
                          {t('terminal.pairedBadge', 'Vinculada')}
                        </Badge>
                        <p className="truncate text-body-md-bold text-foreground">{pairedBranch.name}</p>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="mb-1">
                          {t('terminal.unpairedBadge', 'Sin vincular')}
                        </Badge>
                        <p className="text-body-md text-on-surface-deep">
                          {t('terminal.unpairedHint', 'Esta terminal no tiene sucursal asignada.')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {pairedBranch && (
                  <Button variant="secondary" onClick={handleUnpair} className="self-start">
                    <Unlink className="size-4" />
                    {t('terminal.unpair', 'Desvincular terminal')}
                  </Button>
                )}
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    'terminal.effectHint',
                    'Quienes operen desde aquí sin permiso de cambio de sucursal entrarán directo a la sucursal vinculada.',
                  )}
                </p>
              </CardContent>
            </Card>

            {/* FASE E: registro de la terminal en backend vía código */}
            <Card className="border-0 bg-surface p-lg shadow-whisper">
              <CardContent className="flex flex-col gap-sm p-0">
                <h3 className="text-label-caps uppercase text-on-surface-deep">
                  {t('terminal.registerTitle', 'Registrar terminal')}
                </h3>
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    'terminal.registerHint',
                    'Ingresá el código de emparejamiento de una terminal registrada (Configuración → Terminales).',
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
                      ? t('terminal.registering', 'Emparejando…')
                      : t('terminal.register', 'Emparejar')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Selector de sucursal */}
          <section className="flex flex-col gap-md lg:col-span-2" aria-labelledby="terminal-branches">
            <h2 id="terminal-branches" className="text-label-caps uppercase text-on-surface-deep">
              {t('terminal.pickTitle', 'Elegir sucursal de la terminal')}
            </h2>
            {isLoading ? (
              <Card className="border-0 bg-surface p-lg shadow-whisper">
                <p className="text-body-md text-on-surface-deep">
                  {t('terminal.loading', 'Cargando sucursales...')}
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
                      aria-pressed={isPaired}
                      className={`group flex items-center justify-between gap-md rounded-md border p-md text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
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
