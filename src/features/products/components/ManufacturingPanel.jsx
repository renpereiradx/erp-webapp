import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Factory,
  RefreshCw,
  FlaskConical,
  LineChart,
  PackageSearch,
  PlusCircle,
  AlertCircle,
} from 'lucide-react'
import { manufacturingService } from '@/services/manufacturingService'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import useProductStore from '@/store/useProductStore'

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return '—'
  return Number(value).toLocaleString('es-PY', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const toCurrency = value => {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return '—'
  return `PYG ${Number(value).toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

const initialFormState = {
  quantityProduced: '',
  productionCost: '',
  batchCode: '',
  notes: '',
}

const createInitialSupplyForm = () => ({
  name: '',
  unit: 'unit',
  description: '',
  supplierName: '',
})

const SUPPLY_UNIT_LABELS = {
  unit: 'Unidad',
  kg: 'Kilogramo (kg)',
  g: 'Gramo (g)',
  l: 'Litro (l)',
  ml: 'Mililitro (ml)',
  m: 'Metro (m)',
  cm: 'Centímetro (cm)',
}

const SUPPLY_UNITS = Object.keys(SUPPLY_UNIT_LABELS)

const ManufacturingPanel = ({ productId, productName }) => {
  const { styles } = useThemeStyles()
  const { success, error: toastError } = useToast()
  const refreshProductData = useProductStore(state => state.refreshProductData)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [recipe, setRecipe] = useState([])
  const [batches, setBatches] = useState([])
  const [summary, setSummary] = useState(null)
  const [profitability, setProfitability] = useState(null)
  const [formState, setFormState] = useState(initialFormState)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSupplyDialog, setShowSupplyDialog] = useState(false)
  const [supplyForm, setSupplyForm] = useState(() => createInitialSupplyForm())
  const [isCreatingSupply, setIsCreatingSupply] = useState(false)
  const [supplyError, setSupplyError] = useState(null)

  const loadData = useCallback(
    async (options = {}) => {
      if (!productId) {
        setLoading(false)
        setRecipe([])
        setBatches([])
        setSummary(null)
        setProfitability(null)
        return
      }
      const { silent = false } = options
      if (!silent) {
        setLoading(true)
      }
      if (!silent) {
        setFetchError(null)
      }
      try {
        const [recipeData, batchesData, summaryData, profitabilityData] =
          await Promise.all([
            manufacturingService.getProductRecipe(productId),
            manufacturingService.getProductionBatches({ productId, limit: 5 }),
            manufacturingService.getProductionSummary(productId),
            manufacturingService.getProfitability(productId),
          ])
        setRecipe(Array.isArray(recipeData) ? recipeData : [])
        setBatches(Array.isArray(batchesData) ? batchesData : [])
        setSummary(summaryData || null)
        setProfitability(profitabilityData || null)
      } catch (err) {
        const message =
          err?.message || 'Ocurrió un error al cargar datos de manufactura.'
        if (!silent) {
          setFetchError(message)
        }
        toastError(message)
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [productId, toastError]
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadData({ silent: true })
      success('Datos de manufactura actualizados')
    } finally {
      setRefreshing(false)
    }
  }, [loadData, success])

  const handleInputChange = event => {
    const { name, value } = event.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSupplyDialogChange = useCallback(open => {
    setShowSupplyDialog(open)
    if (!open) {
      setSupplyForm(createInitialSupplyForm())
      setSupplyError(null)
      setIsCreatingSupply(false)
    }
  }, [])

  const handleSupplyInputChange = event => {
    const { name, value } = event.target
    setSupplyForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSupplyUnitChange = value => {
    setSupplyForm(prev => ({ ...prev, unit: value }))
  }

  const handleSupplySubmit = async event => {
    event.preventDefault()
    if (isCreatingSupply) return

    const trimmedName = supplyForm.name.trim()
    if (!trimmedName) {
      setSupplyError('El nombre del insumo es obligatorio')
      return
    }

    setSupplyError(null)
    setIsCreatingSupply(true)
    try {
      const payload = {
        name: trimmedName,
        unit: supplyForm.unit,
      }

      const description = supplyForm.description.trim()
      if (description) {
        payload.description = description
      }

      const supplierName = supplyForm.supplierName.trim()
      if (supplierName) {
        payload.supplier_name = supplierName
      }

      await manufacturingService.createSupply(payload)
      success('Insumo creado correctamente')
      handleSupplyDialogChange(false)
    } catch (err) {
      const message = err?.message || 'No se pudo crear el insumo'
      setSupplyError(message)
      toastError(message)
    } finally {
      setIsCreatingSupply(false)
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (isSubmitting) return
    setFormError(null)

    const quantity = Number(formState.quantityProduced)
    if (!quantity || Number.isNaN(quantity) || quantity <= 0) {
      setFormError('La cantidad producida debe ser mayor a 0')
      return
    }

    const payload = {
      product_id: productId,
      quantity_produced: quantity,
    }

    if (formState.productionCost) {
      const cost = Number(formState.productionCost)
      if (Number.isNaN(cost) || cost < 0) {
        setFormError('El costo de producción no es válido')
        return
      }
      payload.production_cost = cost
    }

    if (formState.batchCode) payload.batch_code = formState.batchCode.trim()
    if (formState.notes) payload.notes = formState.notes.trim()

    setIsSubmitting(true)
    try {
      await manufacturingService.registerProduction(payload)
      success('Producción registrada correctamente')
      setFormState(initialFormState)
      await loadData({ silent: true })
      if (refreshProductData && productId) {
        try {
          await refreshProductData(productId)
        } catch (refreshError) {
        }
      }
    } catch (err) {
      const message = err?.message || 'No se pudo registrar la producción'
      setFormError(message)
      toastError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasRecipe = useMemo(() => recipe && recipe.length > 0, [recipe])
  const hasBatches = useMemo(() => batches && batches.length > 0, [batches])

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-52 w-full' />
      </div>
    )
  }

  if (fetchError) {
    return (
      <Card className='border-destructive/40 bg-destructive/10'>
        <CardHeader>
          <CardTitle className='text-destructive flex items-center gap-2'>
            <Factory className='h-5 w-5' />
            Error al cargar manufactura
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-destructive'>{fetchError}</p>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className='space-y-6'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h3
              className={`${styles.header(
                'h3'
              )} text-lg flex items-center gap-2`}
            >
              <Factory className='h-5 w-5 text-primary' />
              Manufactura para "{productName || productId}"
            </h3>
            <p className='text-sm text-muted-foreground'>
              Gestiona la receta, lotes recientes, producción manual y crea
              insumos base.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={refreshing}
              className='flex items-center gap-2'
              type='button'
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
            <Button
              onClick={() => handleSupplyDialogChange(true)}
              className='flex items-center gap-2'
              type='button'
            >
              <PlusCircle className='h-4 w-4' />
              Crear insumo
            </Button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-base'>
                  Resumen de producción
                </CardTitle>
                <CardDescription className='text-xs'>
                  Actividad consolidada del producto
                </CardDescription>
              </div>
              <Badge variant='outline' className='text-xs'>
                {summary?.product_type || 'PRODUCTION'}
              </Badge>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span>Lotes totales</span>
                <span className='font-semibold'>
                  {summary?.total_batches ?? 0}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Producido</span>
                <span className='font-semibold'>
                  {formatNumber(summary?.total_produced)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Costo total</span>
                <span className='font-semibold'>
                  {toCurrency(summary?.total_production_cost)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Costo promedio</span>
                <span className='font-semibold'>
                  {toCurrency(summary?.avg_cost_per_unit)}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs text-muted-foreground pt-2 border-t'>
                <span>Última producción</span>
                <span>
                  {summary?.last_production_date
                    ? new Date(summary.last_production_date).toLocaleString(
                        'es-PY'
                      )
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-base'>Rentabilidad</CardTitle>
                <CardDescription className='text-xs'>
                  Datos de margen por unidad
                </CardDescription>
              </div>
              <LineChart className='h-5 w-5 text-primary' />
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span>Costo promedio</span>
                <span className='font-semibold'>
                  {toCurrency(profitability?.avg_production_cost_per_unit)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Precio de venta</span>
                <span className='font-semibold'>
                  {toCurrency(profitability?.sale_price_per_unit)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Margen por unidad</span>
                <span className='font-semibold'>
                  {toCurrency(profitability?.profit_margin_per_unit)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span>Margen (%)</span>
                <span className='font-semibold'>
                  {profitability?.profit_margin_percentage != null
                    ? `${formatNumber(
                        profitability.profit_margin_percentage,
                        2
                      )} %`
                    : '—'}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs text-muted-foreground pt-2 border-t'>
                <span>Stock actual</span>
                <span>{formatNumber(profitability?.current_stock, 2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-base'>Receta registrada</CardTitle>
                <CardDescription className='text-xs'>
                  Lista de insumos por unidad
                </CardDescription>
              </div>
              <FlaskConical className='h-5 w-5 text-primary' />
            </CardHeader>
            <CardContent className='text-sm'>
              {hasRecipe ? (
                <ul className='space-y-2'>
                  {recipe.map(ingredient => (
                    <li
                      key={`${ingredient.supply_id}-${ingredient.id}`}
                      className='flex items-start justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0'
                    >
                      <div>
                        <p className='font-semibold'>
                          {ingredient.supply_name}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {ingredient.notes || 'Sin notas'}
                        </p>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {formatNumber(ingredient.quantity_per_unit)}{' '}
                        {ingredient.unit || ''}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='flex flex-col items-center justify-center gap-2 text-center py-4 text-muted-foreground'>
                  <PackageSearch className='h-8 w-8 opacity-60' />
                  <p className='text-sm'>
                    No hay receta registrada para este producto.
                  </p>
                  <p className='text-xs'>
                    Puedes agregar ingredientes desde el backend mientras
                    finalizamos el editor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div>
              <CardTitle className='text-base'>
                Registrar producción manual
              </CardTitle>
              <CardDescription>
                Incrementa el stock registrando un nuevo lote producido.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className='mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Cantidad producida *
                </label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  name='quantityProduced'
                  value={formState.quantityProduced}
                  onChange={handleInputChange}
                  placeholder='Ej: 100'
                  required
                />
              </div>
              <div className='space-y-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Costo total de producción
                </label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  name='productionCost'
                  value={formState.productionCost}
                  onChange={handleInputChange}
                  placeholder='Ej: 150000'
                />
              </div>
              <div className='space-y-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Código de lote
                </label>
                <Input
                  name='batchCode'
                  value={formState.batchCode}
                  onChange={handleInputChange}
                  placeholder='Se genera automático si lo dejas vacío'
                />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Notas
                </label>
                <Textarea
                  name='notes'
                  value={formState.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder='Información adicional del lote'
                />
              </div>
              <div className='md:col-span-2 flex justify-end'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex items-center gap-2'
                >
                  {isSubmitting && (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  )}
                  Registrar lote
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Últimos lotes producidos
            </CardTitle>
            <CardDescription>
              Historial reciente generado de la API de manufactura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasBatches ? (
              <div className='space-y-3'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Código Lote</TableHead>
                      <TableHead className='text-right'>Cantidad</TableHead>
                      <TableHead className='text-right'>Costo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map(batch => (
                      <TableRow
                        key={
                          batch.id ||
                          `${batch.batch_code}-${batch.production_date}`
                        }
                      >
                        <TableCell>
                          {batch.production_date
                            ? new Date(batch.production_date).toLocaleString(
                                'es-PY'
                              )
                            : '—'}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {batch.batch_code || '—'}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatNumber(batch.quantity_produced)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {toCurrency(batch.production_cost)}
                        </TableCell>
                        <TableCell
                          className='max-w-xs truncate'
                          title={batch.notes || ''}
                        >
                          {batch.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className='text-xs text-muted-foreground'>
                  Mostrando los últimos {batches.length} lotes registrados.
                </p>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-2 py-6 text-muted-foreground'>
                <Factory className='h-8 w-8 opacity-60' />
                <p className='text-sm'>
                  Aún no hay producción registrada para este producto.
                </p>
                <p className='text-xs'>
                  Registra el primer lote usando el formulario superior.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSupplyDialog} onOpenChange={handleSupplyDialogChange}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <PlusCircle className='h-5 w-5 text-primary' />
              Crear insumo de manufactura
            </DialogTitle>
            <DialogDescription>
              Crea insumos base para reutilizarlos en recetas y compras.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSupplySubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label className={`${styles.label()} text-sm font-medium`}>
                Nombre del insumo *
              </label>
              <Input
                name='name'
                value={supplyForm.name}
                onChange={handleSupplyInputChange}
                placeholder='Ej: Harina 000 o Botella PET'
                autoFocus
                required
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Unidad
                </label>
                <Select
                  value={supplyForm.unit}
                  onValueChange={handleSupplyUnitChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Selecciona unidad' />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLY_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {SUPPLY_UNIT_LABELS[unit]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <label className={`${styles.label()} text-sm font-medium`}>
                  Proveedor
                </label>
                <Input
                  name='supplierName'
                  value={supplyForm.supplierName}
                  onChange={handleSupplyInputChange}
                  placeholder='Opcional: proveedor habitual'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className={`${styles.label()} text-sm font-medium`}>
                Descripción / notas
              </label>
              <Textarea
                name='description'
                value={supplyForm.description}
                onChange={handleSupplyInputChange}
                rows={3}
                placeholder='Detalle cómo se utiliza o cualquier información relevante'
              />
              <p className='text-xs text-muted-foreground'>
                Puedes editar estos datos luego desde el panel de insumos en el
                backend.
              </p>
            </div>
            {supplyError && (
              <div className='flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
                <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                <span>{supplyError}</span>
              </div>
            )}
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleSupplyDialogChange(false)}
                disabled={isCreatingSupply}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isCreatingSupply}
                className='flex items-center gap-2'
              >
                {isCreatingSupply && (
                  <RefreshCw className='h-4 w-4 animate-spin' />
                )}
                Guardar insumo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ManufacturingPanel
