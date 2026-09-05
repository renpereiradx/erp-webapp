// ===========================================================================
// TerminalPairing (D.3 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Emparejamiento one-time de esta terminal (navegador) con una sucursal:
// guarda `device.defaultBranch` en localStorage. Los usuarios SIN
// `branches:switch` que operen desde aquí entran directo a esa sucursal
// (resolución en BranchContext, D.4). Ruta: /configuracion/terminal,
// gated con `branches:switch`.
// ===========================================================================

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, MonitorSmartphone, Store, Unlink } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { branchService } from '@/features/branches/services/branchService'
import { pairDeviceWithBranch, readDeviceDefaultBranch, unpairDevice } from '@/utils/deviceBranch'
import type { Branch } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const TerminalPairing = () => {
  const { t } = useI18n()
  const { addToast } = useToast()

  const pairedBranchId = readDeviceDefaultBranch()

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

  const handleUnpair = () => {
    unpairDevice()
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
                    {pairedBranch ? (
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
