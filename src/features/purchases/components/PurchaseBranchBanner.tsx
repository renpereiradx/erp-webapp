// ===========================================================================
// PurchaseBranchBanner (F.5a — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Muestra desde el inicio del wizard la sucursal donde la compra va a cargar
// stock (= sucursal activa del operador; modelo depósito puro §4.6: sin
// selector libre, el destino final se resuelve con una transferencia).
// ===========================================================================

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useBranch } from '@/contexts/BranchContext'
import { branchService } from '@/features/branches/services/branchService'

const PurchaseBranchBanner = () => {
  const { t } = useI18n()
  const { currentBranchId } = useBranch()

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  })
  const branchName = useMemo(() => {
    const branches = (branchesResponse as { branches?: Array<{ id: number; name: string }> })?.branches || []
    if (currentBranchId === null) return null
    return branches.find((b) => b.id === currentBranchId)?.name ?? null
  }, [branchesResponse, currentBranchId])

  return (
    <div className='flex items-center gap-sm rounded-md border border-primary/20 bg-primary/5 p-md'>
      <Building2 size={18} className='shrink-0 text-primary' aria-hidden='true' />
      <p className='text-body-sm text-foreground'>
        <span className='text-body-sm-bold'>{t('purchases.branchBanner.title', 'Sucursal de carga: ')}</span>
        {branchName ||
          t('purchases.branchBanner.noBranch', 'sin sucursal activa — seleccioná una sucursal para operar')}
      </p>
    </div>
  )
}

export default PurchaseBranchBanner
