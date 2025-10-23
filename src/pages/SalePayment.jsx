import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useI18n } from '@/lib/i18n'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useSalePaymentStore } from '@/store/useSalePaymentStore'
import useClientStore from '@/store/useClientStore'
import saleService from '@/services/saleService'
import salePaymentService from '@/services/salePaymentService'
import { cashRegisterService } from '@/services/cashRegisterService'
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import {
  Receipt,
  CreditCard,
  Eye,
  X,
  Users,
  User,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Package,
  RefreshCw,
  Clock,
  TrendingUp,
} from 'lucide-react'

const SalePayment = () => {
  const { t } = useI18n()
  const { styles, styleConfig } = useThemeStyles()

  // Función para formatear moneda en Guaraníes
  const formatGuaranies = amount => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₲0'
    return `₲${Number(amount).toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  // Obtener fechas por defecto (últimos 30 días)
  const getDefaultDates = () => {
    const now = new Date()

    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const endDate = `${year}-${month}-${day}`

    // Restar 30 días
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startYear = thirtyDaysAgo.getFullYear()
    const startMonth = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')
    const startDay = String(thirtyDaysAgo.getDate()).padStart(2, '0')
    const startDate = `${startYear}-${startMonth}-${startDay}`

    return {
      start_date: startDate,
      end_date: endDate,
    }
  }

  const {
    currentSale,
    paymentHistory,
    isProcessingPayment,
    isCancellingSale,
    getSaleById,
    processPayment,
    processSalePaymentWithCashRegister,
    getPaymentDetails,
    getCancellationPreview,
    cancelSale,
  } = useSalePaymentStore()

  const { fetchClients } = useClientStore()

  // Estado local para las ventas (similar a SalesHistorySection)
  const [sales, setSales] = useState([])
  const [isSalesLoading, setIsSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState(null)

  const [saleDetailDialog, setSaleDetailDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [cancellationDialog, setCancellationDialog] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [selectedSaleData, setSelectedSaleData] = useState(null) // Datos completos de la venta
  const [paymentMode, setPaymentMode] = useState('cash_register') // Default: con caja registradora

  // Estado para cajas registradoras
  const [cashRegisters, setCashRegisters] = useState([])
  const [selectedCashRegister, setSelectedCashRegister] = useState(null)
  const [isCashRegistersLoading, setIsCashRegistersLoading] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    amount_received: '',
    payment_reference: '',
    payment_notes: '',
  })

  const [cancellationForm, setCancellationForm] = useState({
    reason: '',
    user_id: '1', // TODO: obtener del contexto de usuario
  })

  const defaultDates = getDefaultDates()
  const [dateFilters, setDateFilters] = useState({
    start_date: defaultDates.start_date,
    end_date: defaultDates.end_date,
    page: 1,
    page_size: 20,
  })

  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
  })

  // Estado para búsqueda de cliente por nombre (filtro local)
  const [clientNameSearch, setClientNameSearch] = useState('')

  // Estado para todas las ventas sin filtrar (para filtro local)
  const [allSales, setAllSales] = useState([])

  // Cargar ventas, cajas y clientes automáticamente al montar el componente
  useEffect(() => {
    handleLoadSales()
    handleLoadCashRegisters()
    handleLoadClients()
  }, []) // Solo al montar

  const handleLoadCashRegisters = async () => {
    setIsCashRegistersLoading(true)
    try {
      // Cargar todas las cajas disponibles (sin filtro de status para ver todas)
      const allCashRegisters = await cashRegisterService.getCashRegisters()

      // Filtrar solo las que están abiertas (status === 'OPEN')
      const openCashRegisters =
        allCashRegisters?.filter(
          cr => cr.status === 'OPEN' || cr.state === 'OPEN'
        ) || []

      // 🔧 WORKAROUND: Calcular balance para cada caja si el backend no lo envía
      const cashRegistersWithBalance = await Promise.all(
        openCashRegisters.map(async cashRegister => {
          // Si el backend ya envía current_balance > 0, usarlo
          if (
            cashRegister.current_balance &&
            cashRegister.current_balance > 0
          ) {
            return cashRegister
          }

          // Si no, calcular desde movimientos
          try {
            const movements = await cashRegisterService.getMovements(
              cashRegister.id
            )
            return calculateCashRegisterBalance(cashRegister, movements)
          } catch (error) {
            return cashRegister // Retornar sin modificar si falla
          }
        })
      )

      setCashRegisters(cashRegistersWithBalance)

      if (openCashRegisters.length > 0) {
        // Intentar obtener la caja activa del usuario
        try {
          const activeCashRegister =
            await cashRegisterService.getActiveCashRegister()

          if (activeCashRegister) {
            setSelectedCashRegister(activeCashRegister.id)
          } else {
            // Si no hay caja activa específica, seleccionar la primera abierta
            setSelectedCashRegister(openCashRegisters[0].id)
          }
        } catch (error) {
          // Si falla al obtener la activa, usar la primera abierta
          setSelectedCashRegister(openCashRegisters[0].id)
        }
      }
    } catch (error) {
      // Si hay un error real (no solo cajas vacías), limpiar estado
      setCashRegisters([])
    } finally {
      setIsCashRegistersLoading(false)
    }
  }

  const handleLoadSales = async () => {
    setIsSalesLoading(true)
    setSalesError(null)

    try {
      // Construir filtros sin valores undefined
      const requestFilters = {
        start_date: dateFilters.start_date,
        end_date: dateFilters.end_date,
        page: dateFilters.page,
        page_size: dateFilters.page_size,
      }

      // Solo agregar status si tiene valor
      if (filters.status) {
        requestFilters.status = filters.status
      }

      // Solo agregar client_id si tiene valor
      if (filters.client_id) {
        requestFilters.client_id = filters.client_id
      }

      // Usar el nuevo endpoint con payment status
      const response =
        await salePaymentService.getSalesByDateRangeWithPaymentStatus(requestFilters)

      // El servicio retorna { data, pagination }
      if (response && response.data) {
        // Los datos ya vienen en formato plano con payment status
        const salesData = response.data.map(item => {
          return {
            ...item,
            id: item.id || item.sale_id,
          }
        })
        // Guardar todas las ventas sin filtrar para el filtro local
        setAllSales(salesData)
        setSales(salesData)
      } else {
        setAllSales([])
        setSales([])
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      setSalesError(error.message || 'Error al cargar las ventas')
      setSales([])
    } finally {
      setIsSalesLoading(false)
    }
  }

  const handleLoadClients = async () => {
    try {
      await fetchClients(1000) // Cargar hasta 1000 clientes para búsqueda local
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleOpenPaymentModal = saleId => {
    setSelectedSaleId(saleId)

    // Buscar los datos completos de la venta
    const saleData = sales.find(s => s.id === saleId)
    setSelectedSaleData(saleData)

    // Validación: Si el modo es caja y no hay cajas disponibles, cambiar a modo estándar
    if (paymentMode === 'cash_register' && cashRegisters.length === 0) {
      setPaymentMode('payment')
    }

    setPaymentDialog(true)
  }

  const handleProcessPayment = async e => {
    e.preventDefault()
    if (!selectedSaleId) return

    // Validación final: si modo caja, debe haber caja seleccionada
    if (paymentMode === 'cash_register' && !selectedCashRegister) {
      alert(
        '⚠️ Debe seleccionar una caja registradora o cambiar a modo "Pago Estándar"'
      )
      return
    }

    try {
      // Obtener el monto recibido
      let amountReceived = parseFloat(paymentForm.amount_received)

      // Si hay balance_due y el monto recibido lo excede, ajustarlo al balance exacto
      if (selectedSaleData?.balance_due !== undefined) {
        const balanceDue = selectedSaleData.balance_due
        if (amountReceived > balanceDue) {
          console.warn(
            `⚠️ Amount received (${amountReceived}) exceeds balance due (${balanceDue}). Adjusting to exact balance.`
          )
          amountReceived = balanceDue
        }
      }

      const paymentData = {
        sales_order_id: selectedSaleId,
        amount_received: amountReceived,
        payment_reference: paymentForm.payment_reference,
        payment_notes: paymentForm.payment_notes,
      }

      let result

      if (paymentMode === 'cash_register') {
        const paymentDataWithCashRegister = {
          ...paymentData,
          cash_register_id: selectedCashRegister,
        }
        result = await processSalePaymentWithCashRegister(
          paymentDataWithCashRegister
        )
      } else {
        result = await processPayment(paymentData)
      }

      // Mostrar información detallada del pago procesado

      // Si hay cash_summary, mostrar detalles
      if (result?.cash_summary) {
        // ⚠️ IMPORTANTE: Alertar si hay vuelto a entregar
        if (result.requires_change && result.cash_summary.change_given > 0) {
          alert(
            `✅ PAGO PROCESADO EXITOSAMENTE\n\n` +
              `⚠️ ENTREGAR VUELTO AL CLIENTE:\n` +
              `${formatGuaranies(result.cash_summary.change_given)}\n\n` +
              `Detalles:\n` +
              `• Recibido: ${formatGuaranies(
                result.cash_summary.cash_received
              )}\n` +
              `• Aplicado a la venta: ${formatGuaranies(
                result.cash_summary.amount_applied
              )}\n` +
              `• Vuelto: ${formatGuaranies(result.cash_summary.change_given)}`
          )
        } else {
          alert(`✅ Pago procesado exitosamente`)
        }
      } else {
        alert(`✅ Pago procesado exitosamente`)
      }

      // Cerrar modal de pago
      setPaymentDialog(false)
      setPaymentForm({
        amount_received: '',
        payment_reference: '',
        payment_notes: '',
      })
      setSelectedSaleData(null)

      // Pequeño delay para asegurar que el backend actualizó los datos
      await new Promise(resolve => setTimeout(resolve, 500))

      // Recargar ventas para reflejar el cambio
      await handleLoadSales()

      // Si se usó caja registradora, recargar su balance actualizado
      if (paymentMode === 'cash_register' && selectedCashRegister) {
        await handleLoadCashRegisters()
      }
    } catch (error) {
    }
  }

  const handleCancelSale = async e => {
    e.preventDefault()
    if (!selectedSaleId) return

    try {
      await cancelSale(selectedSaleId, {
        user_id: cancellationForm.user_id,
        reason: cancellationForm.reason,
      })

      setCancellationDialog(false)
      setCancellationForm({
        reason: '',
        user_id: '1',
      })
    } catch (error) {
    }
  }

  const handleViewSaleDetail = async saleId => {
    setSelectedSaleId(saleId)

    // Buscar la venta en los datos que ya tenemos
    const saleData = sales.find(s => s.id === saleId || s.sale_id === saleId)

    if (saleData) {
      // Si ya tenemos los datos, usarlos directamente
      setSelectedSaleData(saleData)
      setSaleDetailDialog(true)
    } else {
      // Solo si no encontramos los datos, hacer la llamada al backend
      try {
        await getSaleById(saleId)
        await getPaymentDetails(saleId)
        setSaleDetailDialog(true)
      } catch (error) {
      }
    }
  }

  const handleFilterByStatus = async status => {
    setFilters(prev => ({ ...prev, status }))
    // Recargar ventas inmediatamente con el nuevo filtro
    setIsSalesLoading(true)
    setSalesError(null)

    try {
      // Construir filtros sin valores undefined
      const requestFilters = {
        start_date: dateFilters.start_date,
        end_date: dateFilters.end_date,
        page: dateFilters.page,
        page_size: dateFilters.page_size,
      }

      // Solo agregar status si tiene valor
      if (status) {
        requestFilters.status = status
      }

      // Solo agregar client_id si tiene valor
      if (filters.client_id) {
        requestFilters.client_id = filters.client_id
      }

      const response =
        await salePaymentService.getSalesByDateRangeWithPaymentStatus(requestFilters)

      if (response && response.data) {
        const salesData = response.data.map(item => {
          return {
            ...item,
            id: item.id || item.sale_id,
          }
        })
        // Actualizar todas las ventas sin filtrar
        setAllSales(salesData)
        setSales(salesData)
        // Limpiar el filtro de búsqueda por nombre
        setClientNameSearch('')
      } else {
        setAllSales([])
        setSales([])
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      setSalesError(error.message || 'Error al cargar las ventas')
      setSales([])
    } finally {
      setIsSalesLoading(false)
    }
  }

  const handleFilterByClient = async clientId => {
    const actualClientId = clientId === 'all' ? '' : clientId
    setFilters(prev => ({ ...prev, client_id: actualClientId }))

    // Recargar ventas inmediatamente con el nuevo filtro
    setIsSalesLoading(true)
    setSalesError(null)

    try {
      // Construir filtros sin valores undefined
      const requestFilters = {
        start_date: dateFilters.start_date,
        end_date: dateFilters.end_date,
        page: dateFilters.page,
        page_size: dateFilters.page_size,
      }

      // Solo agregar status si tiene valor
      if (filters.status) {
        requestFilters.status = filters.status
      }

      // Solo agregar client_id si tiene valor
      if (actualClientId) {
        requestFilters.client_id = actualClientId
      }

      const response =
        await salePaymentService.getSalesByDateRangeWithPaymentStatus(requestFilters)

      if (response && response.data) {
        const salesData = response.data.map(item => {
          return {
            ...item,
            id: item.id || item.sale_id,
          }
        })
        // Actualizar todas las ventas sin filtrar
        setAllSales(salesData)
        setSales(salesData)
        // Limpiar el filtro de búsqueda por nombre
        setClientNameSearch('')
      } else {
        setAllSales([])
        setSales([])
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      setSalesError(error.message || 'Error al cargar las ventas')
      setSales([])
    } finally {
      setIsSalesLoading(false)
    }
  }

  // Función para filtrar ventas localmente por nombre de cliente
  const handleSearchClientByName = () => {
    if (!clientNameSearch.trim()) {
      // Si el campo está vacío, mostrar todas las ventas
      setSales(allSales)
      return
    }

    // Filtrar ventas localmente por nombre de cliente
    const searchTerm = clientNameSearch.toLowerCase().trim()

    const filteredSales = allSales.filter(sale => {
      const clientName = (sale.client_name || '').toLowerCase()
      return clientName.includes(searchTerm)
    })

    setSales(filteredSales)

    if (filteredSales.length === 0) {
    }

  }

  // Función para manejar Enter en el input de búsqueda
  const handleClientSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClientByName()
    }
  }

  const getStatusBadge = status => {
    const statusConfig = {
      PENDING: {
        label: 'Pendiente',
        className:
          'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
        icon: AlertTriangle,
      },
      PARTIAL_PAYMENT: {
        label: 'Pago Parcial',
        className:
          'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
        icon: DollarSign,
      },
      COMPLETED: {
        label: 'Completada',
        className:
          'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
        icon: CheckCircle,
      },
      PAID: {
        label: 'Pagada',
        className:
          'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
        icon: CheckCircle,
      },
      CANCELLED: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
        icon: X,
      },
    }

    const config = statusConfig[status] || statusConfig['PENDING']
    const Icon = config.icon

    return (
      <Badge className={`flex items-center gap-1 border ${config.className}`}>
        <Icon className='w-3 h-3' />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header - Adaptado al tema */}
      <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div
            className={`p-3 ${
              styleConfig?.colors?.accent || 'bg-primary'
            } rounded-lg shadow-sm`}
          >
            <Receipt className='w-8 h-8' />
          </div>
          <div>
            <h1 className={`text-3xl font-bold`}>Gestión de Pagos de Ventas</h1>
            <p className='text-muted-foreground'>
              Procesar pagos y cancelar ventas existentes
            </p>
          </div>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleLoadSales}
            disabled={isSalesLoading}
            className={styles.button('primary')}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSalesLoading ? 'animate-spin' : ''}`}
            />
            {isSalesLoading ? 'Actualizando...' : 'Actualizar Ventas'}
          </Button>
          <Button
            onClick={handleLoadClients}
            variant='outline'
            className={styles.button('secondary')}
          >
            <Users className='w-4 h-4 mr-2' />
            Cargar Clientes
          </Button>
        </div>
      </div>

      {/* Filters Section - Rediseñado con sistema multi-tema */}
      <Card className={`${styles.card()} shadow-lg`}>
        <CardHeader className={`border-b`}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Calendar className='w-5 h-5' />
              <CardTitle>Filtros de Fecha</CardTitle>
            </div>
            <Badge variant='outline' className='text-sm'>
              {sales.length || 0} ventas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          {/* Grid 10 columnas: Fecha Inicio (40%) | Fecha Fin (30%) | Registros (30%) */}
          <div className='grid grid-cols-10 gap-4'>
            {/* Fecha Inicio - 4 de 10 = 40% */}
            <div className='col-span-4 space-y-2'>
              <Label htmlFor='start_date' className='text-sm font-medium'>
                Fecha Inicio
              </Label>
              <Input
                id='start_date'
                type='date'
                value={dateFilters.start_date}
                onChange={e =>
                  setDateFilters(prev => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className={styles.input()}
              />
            </div>

            {/* Fecha Fin - 3 de 10 = 30% */}
            <div className='col-span-3 space-y-2'>
              <Label htmlFor='end_date' className='text-sm font-medium'>
                Fecha Fin
              </Label>
              <Input
                id='end_date'
                type='date'
                value={dateFilters.end_date}
                onChange={e =>
                  setDateFilters(prev => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                className={styles.input()}
              />
            </div>

            {/* Registros - 3 de 10 = 30% */}
            <div className='col-span-3 space-y-2'>
              <Label
                htmlFor='page_size_desktop'
                className='text-sm font-medium'
              >
                Registros
              </Label>
              <Select
                value={dateFilters.page_size.toString()}
                onValueChange={value =>
                  setDateFilters(prev => ({
                    ...prev,
                    page_size: parseInt(value),
                  }))
                }
              >
                <SelectTrigger
                  className={styles.input()}
                  id='page_size_desktop'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='20'>20</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                  <SelectItem value='100'>100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón de Aplicar Filtros */}
          <Button
            onClick={handleLoadSales}
            className={`w-full ${styles.button('primary')}`}
            disabled={isSalesLoading}
            size='lg'
          >
            {isSalesLoading ? (
              <>
                <Package className='w-4 h-4 mr-2 animate-spin' />
                Cargando ventas...
              </>
            ) : (
              <>
                <CheckCircle className='w-4 h-4 mr-2' />
                Aplicar Filtros
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status and Client Filters - Compacto */}
      <Card className={`${styles.card()} shadow-md`}>
        <CardHeader className='border-b py-3'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-4 h-4' />
            <CardTitle className='text-base'>
              Filtros de Estado y Cliente
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className='py-4'>
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
            {/* Estado Buttons - Inline */}
            <div className='flex flex-wrap gap-2 flex-1'>
              <Label className='text-sm font-medium w-full sm:w-auto'>
                Estado de Venta
              </Label>
              <Button
                variant={filters.status === '' ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleFilterByStatus('')}
                className={
                  filters.status === ''
                    ? styles.button('primary')
                    : styles.button('secondary')
                }
                disabled={isSalesLoading}
              >
                <Package className='w-4 h-4 mr-2' />
                Todas
              </Button>
              <Button
                variant={filters.status === 'PENDING' ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleFilterByStatus('PENDING')}
                className={
                  filters.status === 'PENDING'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : styles.button('secondary')
                }
                disabled={isSalesLoading}
              >
                <AlertTriangle className='w-4 h-4 mr-2' />
                Pendientes
              </Button>
              <Button
                variant={
                  filters.status === 'PARTIAL_PAYMENT' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() => handleFilterByStatus('PARTIAL_PAYMENT')}
                className={
                  filters.status === 'PARTIAL_PAYMENT'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : styles.button('secondary')
                }
                disabled={isSalesLoading}
              >
                <Clock className='w-4 h-4 mr-2' />
                Pago Parcial
              </Button>
              <Button
                variant={filters.status === 'COMPLETED' ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleFilterByStatus('COMPLETED')}
                className={
                  filters.status === 'COMPLETED'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : styles.button('secondary')
                }
                disabled={isSalesLoading}
              >
                <CheckCircle className='w-4 h-4 mr-2' />
                Completadas
              </Button>
              <Button
                variant={filters.status === 'CANCELLED' ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleFilterByStatus('CANCELLED')}
                className={
                  filters.status === 'CANCELLED'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : styles.button('secondary')
                }
                disabled={isSalesLoading}
              >
                <X className='w-4 h-4 mr-2' />
                Canceladas
              </Button>
            </div>

            {/* Búsqueda de Cliente - Inline con Input y Botón */}
            <div className='w-full sm:w-auto sm:min-w-[300px]'>
              <Label className='text-sm font-medium block mb-2'>
                Filtrar por Cliente
              </Label>
              <div className='flex gap-2'>
                <Input
                  value={clientNameSearch}
                  onChange={(e) => setClientNameSearch(e.target.value)}
                  onKeyPress={handleClientSearchKeyPress}
                  placeholder='Buscar por nombre...'
                  className={`flex-1 ${styles.input()}`}
                />
                <Button
                  onClick={handleSearchClientByName}
                  disabled={isSalesLoading}
                  className={styles.button('primary')}
                  size='sm'
                >
                  <Users className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List - Compacto */}
      <Card className={`${styles.card()} shadow-md`}>
        <CardHeader className='border-b py-3'>
          <div className='flex items-center gap-2'>
            <Receipt className='w-4 h-4' />
            <CardTitle className='text-base'>
              Ventas para Gestión de Pagos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          {isSalesLoading ? (
            <div className='text-center py-12'>
              <div
                className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${
                  styleConfig?.colors?.accent || 'bg-primary'
                } mb-4`}
              ></div>
              <p className='text-muted-foreground'>Cargando ventas...</p>
            </div>
          ) : salesError ? (
            <div className='text-center py-12'>
              <AlertTriangle className='w-16 h-16 mx-auto text-red-500 mb-4' />
              <h3 className='text-lg font-semibold text-red-600 mb-2'>
                Error al cargar ventas
              </h3>
              <p className='text-muted-foreground mb-4'>{salesError}</p>
              <Button
                onClick={handleLoadSales}
                variant='outline'
                className={styles.button('secondary')}
              >
                Reintentar
              </Button>
            </div>
          ) : sales && sales.length > 0 ? (
            <div className='grid grid-cols-2 gap-4'>
              {sales.map(sale => {
                // Extraer información de payment status y redondear valores
                const totalAmount = Math.round(sale.total_amount || 0)
                const totalPaid = Math.round(sale.total_paid || 0)
                const balanceDue = Math.round(sale.balance_due || 0)
                const paymentProgress = sale.payment_progress || 0
                const paymentCount = sale.payment_count || 0
                const isFullyPaid = sale.is_fully_paid || false
                const hasPaymentStatus = sale.hasOwnProperty('balance_due')

                return (
                  <Card
                    key={sale.id}
                    className={`${styles.card()} hover:shadow-lg transition-all duration-200`}
                  >
                    <CardContent className='p-4'>
                      <div className='space-y-3'>
                        {/* Header con ID y estado */}
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Receipt className='w-4 h-4' />
                            <h3 className='font-bold text-base'>
                              Venta #{sale.id}
                            </h3>
                          </div>
                          {getStatusBadge(sale.status)}
                        </div>

                        {/* Info compacta */}
                        <div className='space-y-2 text-sm'>
                          <div className='flex items-center gap-2'>
                            <User className='w-4 h-4 text-muted-foreground' />
                            <span className='text-muted-foreground'>
                              <strong>Cliente:</strong> {sale.client_name}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4 text-muted-foreground' />
                            <span className='text-muted-foreground'>
                              <strong>Fecha:</strong>{' '}
                              {new Date(
                                sale.sale_date || sale.created_at
                              ).toLocaleDateString('es-PY')}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <DollarSign className='w-4 h-4 text-muted-foreground' />
                            <span className='font-semibold'>
                              <strong>Total:</strong>{' '}
                              {formatGuaranies(totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Payment Status - NUEVO */}
                        {hasPaymentStatus && (
                          <div className='space-y-2 pt-2 border-t'>
                            {/* Barra de progreso */}
                            <div className='space-y-1'>
                              <div className='flex items-center justify-between text-xs'>
                                <span className='font-medium text-gray-600'>
                                  {paymentProgress.toFixed(0)}% pagado
                                </span>
                                {paymentCount > 0 && (
                                  <span className='text-gray-500'>
                                    {paymentCount} pago
                                    {paymentCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    isFullyPaid
                                      ? 'bg-green-500'
                                      : 'bg-orange-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(paymentProgress, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Monto pagado y pendiente */}
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                              {totalPaid > 0 && (
                                <div className='flex items-center gap-1'>
                                  <TrendingUp className='w-3 h-3 text-green-600' />
                                  <span className='text-green-600 font-medium'>
                                    {formatGuaranies(totalPaid)}
                                  </span>
                                </div>
                              )}
                              {balanceDue > 0 && (
                                <div className='flex items-center gap-1'>
                                  <Clock className='w-3 h-3 text-orange-600' />
                                  <span className='text-orange-600 font-medium'>
                                    {formatGuaranies(balanceDue)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className='flex flex-wrap gap-2 pt-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewSaleDetail(sale.id)}
                            className={`flex-1 ${styles.button('secondary')}`}
                          >
                            <Eye className='w-4 h-4 mr-1' />
                            Ver Detalles
                          </Button>

                          {(sale.status === 'PENDING' ||
                            sale.status === 'PARTIAL_PAYMENT') && (
                            <Button
                              size='sm'
                              onClick={() => handleOpenPaymentModal(sale.id)}
                              className='bg-green-600 hover:bg-green-700 text-white flex-1'
                            >
                              <CreditCard className='w-4 h-4 mr-1' />
                              Pago Parcial
                            </Button>
                          )}

                          {(sale.status === 'PENDING' ||
                            sale.status === 'COMPLETED') && (
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => {
                                setSelectedSaleId(sale.id)
                                setCancellationDialog(true)
                              }}
                            >
                              <X className='w-4 h-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className='text-center py-16'>
              <div
                className={`inline-block p-6 ${
                  styleConfig?.colors?.accent || 'bg-primary'
                } rounded-full mb-4`}
              >
                <Package className='w-16 h-16' />
              </div>
              <h3 className={`text-xl font-semibold mb-2`}>No hay ventas</h3>
              <p className={`${'text-muted-foreground'} mb-6 max-w-md mx-auto`}>
                Ajusta los filtros de fecha y haz clic en "Aplicar Filtros" para
                ver las ventas existentes
              </p>
              <Button
                onClick={handleLoadSales}
                className={styles.button('primary')}
              >
                <Package className='w-4 h-4 mr-2' />
                Cargar Ventas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className='!max-w-4xl'>
          <DialogHeader>
            <DialogTitle className='text-2xl flex items-center gap-2'>
              <CreditCard className='w-6 h-6' />
              Procesar Pago de Venta
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProcessPayment} className='space-y-6'>
            {/* Sale Info Summary */}
            {selectedSaleData && (
              <div className='bg-muted/40 p-4 rounded-lg border-l-4 border-primary'>
                <div className='flex items-center gap-2 mb-3'>
                  <Receipt className='w-5 h-5 text-primary' />
                  <h4 className='font-semibold'>Información de la Venta</h4>
                </div>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>ID:</span>
                    <p className='font-medium'>{selectedSaleData.id}</p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Cliente:</span>
                    <p className='font-medium'>
                      {selectedSaleData.client_name}
                    </p>
                  </div>

                  {/* Mostrar desglose de pagos si hay payment status */}
                  {selectedSaleData.hasOwnProperty('balance_due') ? (
                    <>
                      {/* Grid 2 columnas: Total Venta y Pendiente a Pagar */}
                      <div className='col-span-2 grid grid-cols-2 gap-3 border-t pt-3'>
                        <div className='bg-gray-50 border border-gray-200 rounded p-3'>
                          <span className='text-gray-700 font-semibold text-sm'>
                            Total Venta:
                          </span>
                          <p className='text-2xl font-bold text-gray-900 mb-2'>
                            {formatGuaranies(
                              Math.round(selectedSaleData.total_amount || 0)
                            )}
                          </p>
                          <div className='border-t border-gray-300 pt-2 mt-2'>
                            <div className='flex items-center justify-between'>
                              <span className='text-green-600 text-xs font-medium'>
                                Ya Pagado:
                              </span>
                              <span className='font-semibold text-green-600 text-sm'>
                                {formatGuaranies(
                                  Math.round(selectedSaleData.total_paid || 0)
                                )}
                              </span>
                            </div>
                            {selectedSaleData.payment_count > 0 && (
                              <div className='text-xs text-muted-foreground mt-1'>
                                ({selectedSaleData.payment_count} pago
                                {selectedSaleData.payment_count > 1 ? 's' : ''}{' '}
                                realizado
                                {selectedSaleData.payment_count > 1 ? 's' : ''})
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='bg-orange-50 border border-orange-200 rounded p-3'>
                          <span className='text-orange-800 font-semibold text-sm'>
                            Pendiente a Pagar:
                          </span>
                          <p className='text-2xl font-bold text-orange-600'>
                            {formatGuaranies(Math.round(selectedSaleData.balance_due || 0))}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className='col-span-2'>
                      <span className='text-muted-foreground'>
                        Total a Pagar:
                      </span>
                      <p className='text-2xl font-bold text-primary'>
                        {formatGuaranies(Math.round(selectedSaleData.total_amount || 0))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Mode y Caja Registradora - Grid 2 columnas */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Payment Mode */}
              <div className='space-y-3'>
                <Label className='text-sm font-semibold flex items-center gap-2'>
                  <DollarSign className='w-4 h-4' />
                  Modo de Pago
                </Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className='h-11 text-sm px-4 py-3'>
                    <SelectValue placeholder='Seleccione el modo de pago' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value='cash_register'
                      className='text-sm py-3 px-3'
                    >
                      <div className='flex items-center gap-2'>
                        <Package className='w-4 h-4' />
                        <span>Con Caja Registradora</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='standard' className='text-sm py-3 px-3'>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='w-4 h-4' />
                        <span>Pago Estándar</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cash Register Selector */}
              <div className='space-y-3'>
                <Label
                  htmlFor='cash_register'
                  className='text-sm font-semibold flex items-center gap-2'
                >
                  <Package className='w-4 h-4' />
                  Caja Registradora{' '}
                  {paymentMode === 'cash_register' && (
                    <span className='text-red-500'>*</span>
                  )}
                </Label>
                <Select
                  value={selectedCashRegister?.toString()}
                  onValueChange={value =>
                    setSelectedCashRegister(parseInt(value))
                  }
                  disabled={
                    isCashRegistersLoading ||
                    cashRegisters.length === 0 ||
                    paymentMode !== 'cash_register'
                  }
                >
                  <SelectTrigger className='h-11 text-sm px-4 py-3'>
                    <SelectValue
                      placeholder={
                        paymentMode !== 'cash_register'
                          ? 'No aplica'
                          : isCashRegistersLoading
                          ? 'Cargando...'
                          : cashRegisters.length === 0
                          ? 'No hay cajas abiertas'
                          : 'Seleccione una caja'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cashRegisters.map(cashRegister => (
                      <SelectItem
                        key={cashRegister.id}
                        value={cashRegister.id.toString()}
                        className='text-sm py-3 px-3'
                      >
                        <div>
                          <div className='font-medium'>
                            Caja #{cashRegister.id}
                            {cashRegister.name && ` - ${cashRegister.name}`}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Balance:{' '}
                            {formatGuaranies(cashRegister.current_balance || 0)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {paymentMode === 'cash_register' &&
                  cashRegisters.length === 0 &&
                  !isCashRegistersLoading && (
                    <p className='text-xs text-amber-700'>
                      ⚠️ No hay cajas abiertas
                    </p>
                  )}
              </div>
            </div>

            {/* Grid 2 columnas: Monto Exacto Recibido y Vuelto a entregar */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Monto Recibido */}
              <div className='space-y-3'>
                <Label
                  htmlFor='amount_received'
                  className='text-sm font-semibold flex items-center gap-2'
                >
                  <DollarSign className='w-4 h-4' />
                  MONTO EXACTO RECIBIDO <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground'>
                    ₲
                  </span>
                  <Input
                    id='amount_received'
                    type='number'
                    step='1'
                    min='0'
                    value={paymentForm.amount_received}
                    onChange={e =>
                      setPaymentForm(prev => ({
                        ...prev,
                        amount_received: e.target.value,
                      }))
                    }
                    placeholder='0'
                    className='h-14 text-lg font-semibold pl-8 tabular-nums'
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Change Calculation */}
              <div className='space-y-3'>
                <Label className='text-sm font-semibold flex items-center gap-2'>
                  <AlertTriangle className='w-4 h-4' />
                  VUELTO / PENDIENTE
                </Label>
                {selectedSaleData &&
                paymentForm.amount_received &&
                parseFloat(paymentForm.amount_received) > 0 ? (
                  <div className='h-14 flex items-center'>
                    {(() => {
                      // Redondear a enteros porque Guaraníes no tiene decimales
                      const amountReceived = Math.round(parseFloat(
                        paymentForm.amount_received
                      ))

                      // Usar balance_due si existe, sino usar total_amount
                      const rawAmountDue = selectedSaleData.hasOwnProperty(
                        'balance_due'
                      )
                        ? selectedSaleData.balance_due || 0
                        : selectedSaleData.total_amount || 0

                      // Redondear amount_due también
                      const amountDue = Math.round(rawAmountDue)

                      // DEBUG LOG: Cálculo de vuelto/pendiente
                      console.group('🔍 [DEBUG] Payment Change Calculation')
                      console.log('Amount Received (input):', paymentForm.amount_received)
                      console.log('Amount Received (rounded):', amountReceived)
                      console.log('Amount Due (raw):', rawAmountDue)
                      console.log('Amount Due (rounded):', amountDue)
                      console.log('Difference:', amountReceived - amountDue)
                      console.log('Has balance_due?', selectedSaleData.hasOwnProperty('balance_due'))
                      console.log('Selected Sale Data:', selectedSaleData)
                      console.groupEnd()

                      // Verificar si el monto excede ligeramente debido a decimales
                      const inputAmount = parseFloat(paymentForm.amount_received)
                      const exceedsBalance = inputAmount > rawAmountDue
                      const smallExcess = exceedsBalance && (inputAmount - rawAmountDue) < 1

                      if (amountReceived >= amountDue) {
                        return (
                          <div className='space-y-2'>
                            <div className='w-full flex items-center justify-between border-amber-200 bg-amber-50 rounded-lg px-3 py-3 border-2'>
                              <span className='font-semibold text-sm text-amber-900'>
                                Vuelto a entregar:
                              </span>
                              <span className='text-xl font-bold text-amber-700'>
                                {formatGuaranies(amountReceived - amountDue)}
                              </span>
                            </div>
                            {smallExcess && (
                              <div className='text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200'>
                                ℹ️ Monto ajustado a balance exacto: {formatGuaranies(rawAmountDue)}
                              </div>
                            )}
                          </div>
                        )
                      } else {
                        return (
                          <div className='w-full flex items-center justify-between text-blue-700 bg-blue-50 border-blue-200 rounded-lg px-3 py-3 border-2'>
                            <span className='font-semibold text-sm'>
                              Quedarán pendientes:
                            </span>
                            <span className='text-xl font-bold text-blue-700'>
                              {formatGuaranies(amountDue - amountReceived)}
                            </span>
                          </div>
                        )
                      }
                    })()}
                  </div>
                ) : (
                  <div className='h-14 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg'>
                    <span className='text-sm text-muted-foreground'>
                      Ingrese el monto recibido
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Nota de pago y Referencia de pago - Grid 2 columnas */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Payment Notes */}
              <div className='space-y-3'>
                <Label
                  htmlFor='payment_notes'
                  className='text-sm font-semibold'
                >
                  Nota del Pago
                  <span className='text-xs font-normal text-muted-foreground ml-2'>
                    (Opcional)
                  </span>
                </Label>
                <Textarea
                  id='payment_notes'
                  value={paymentForm.payment_notes}
                  onChange={e =>
                    setPaymentForm(prev => ({
                      ...prev,
                      payment_notes: e.target.value,
                    }))
                  }
                  placeholder='Información adicional del pago...'
                  rows={3}
                  className='resize-none text-sm'
                />
              </div>

              {/* Payment Reference */}
              <div className='space-y-3'>
                <Label
                  htmlFor='payment_reference'
                  className='text-sm font-semibold'
                >
                  Referencia de Pago
                  <span className='text-xs font-normal text-muted-foreground ml-2'>
                    (Opcional)
                  </span>
                </Label>
                <Input
                  id='payment_reference'
                  value={paymentForm.payment_reference}
                  onChange={e =>
                    setPaymentForm(prev => ({
                      ...prev,
                      payment_reference: e.target.value,
                    }))
                  }
                  placeholder='Ej: Transferencia #12345, Cheque #987'
                  className='h-11 text-sm'
                />
              </div>
            </div>

            {/* Action Buttons - Grid 2 columnas */}
            <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setPaymentDialog(false)}
                className='h-12 px-6'
                disabled={isProcessingPayment}
              >
                <X className='w-4 h-4 mr-2' />
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={
                  isProcessingPayment ||
                  !paymentForm.amount_received ||
                  (paymentMode === 'cash_register' && !selectedCashRegister)
                }
                className='h-12 px-8 bg-green-600 hover:bg-green-700'
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Procesar Pago
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={cancellationDialog} onOpenChange={setCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venta</DialogTitle>
            <DialogDescription>
              Esta acción cancelará completamente la venta y revertirá todos los
              cambios asociados
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSale} className='space-y-4'>
            <div>
              <Label htmlFor='cancel_reason'>Razón de Cancelación</Label>
              <Textarea
                id='cancel_reason'
                value={cancellationForm.reason}
                onChange={e =>
                  setCancellationForm(prev => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder='Describa la razón de la cancelación...'
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCancellationDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                variant='destructive'
                disabled={isCancellingSale}
              >
                {isCancellingSale ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={saleDetailDialog} onOpenChange={setSaleDetailDialog}>
        <DialogContent className='max-w-[90vw] w-[1100px] max-h-[85vh] overflow-hidden flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle className='text-xl'>Detalles de la Venta</DialogTitle>
            <DialogDescription>
              Información completa de la venta y pagos asociados
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto pr-2'>
            {(selectedSaleData || currentSale) && (
              <div className='space-y-6 pb-4'>
                {(() => {
                  const sale = selectedSaleData || currentSale
                  return (
                    <>
                      {/* Sale Info */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-3 bg-muted/30 p-4 rounded-lg'>
                          <h3 className='font-semibold text-lg border-b pb-2'>
                            Información de la Venta
                          </h3>
                          <div className='space-y-2.5'>
                            <p className='text-sm leading-relaxed'>
                              <strong className='inline-block w-20'>ID:</strong>
                              <span className='text-muted-foreground'>
                                {sale.sale_id || sale.id || 'N/A'}
                              </span>
                            </p>
                            <p className='text-sm leading-relaxed'>
                              <strong className='inline-block w-20'>
                                Cliente:
                              </strong>
                              <span className='text-muted-foreground'>
                                {sale.client_name || 'N/A'}
                              </span>
                            </p>
                            <p className='text-sm leading-relaxed'>
                              <strong className='inline-block w-20'>
                                Fecha:
                              </strong>
                              <span className='text-muted-foreground'>
                                {sale.sale_date
                                  ? new Date(sale.sale_date).toLocaleDateString(
                                      'es-PY',
                                      {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )
                                  : 'N/A'}
                              </span>
                            </p>
                            <p className='text-sm leading-relaxed flex items-center gap-2'>
                              <strong className='inline-block w-20'>
                                Estado:
                              </strong>
                              {getStatusBadge(
                                sale.status?.toUpperCase() || 'PENDING'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className='space-y-3 bg-muted/30 p-4 rounded-lg'>
                          <h3 className='font-semibold text-lg border-b pb-2'>
                            Información de Pago
                          </h3>
                          <div className='space-y-2.5'>
                            <p className='text-sm leading-relaxed'>
                              <strong className='inline-block w-32'>
                                Total:
                              </strong>
                              <span className='text-muted-foreground font-semibold text-base'>
                                {formatGuaranies(Math.round(sale.total_amount || 0))}
                              </span>
                            </p>

                            {/* Mostrar información de payment status si está disponible */}
                            {sale.hasOwnProperty('balance_due') && (
                              <>
                                <div className='border-t pt-2 mt-2'>
                                  <p className='text-sm leading-relaxed'>
                                    <strong className='inline-block w-32'>
                                      Total Pagado:
                                    </strong>
                                    <span className='text-green-600 font-semibold'>
                                      {formatGuaranies(Math.round(sale.total_paid || 0))}
                                    </span>
                                  </p>
                                  <p className='text-sm leading-relaxed'>
                                    <strong className='inline-block w-32'>
                                      Balance Pendiente:
                                    </strong>
                                    <span className='text-orange-600 font-semibold'>
                                      {formatGuaranies(Math.round(sale.balance_due || 0))}
                                    </span>
                                  </p>
                                  <p className='text-sm leading-relaxed'>
                                    <strong className='inline-block w-32'>
                                      Progreso:
                                    </strong>
                                    <span className='text-muted-foreground'>
                                      {sale.payment_progress?.toFixed(1)}% (
                                      {sale.payment_count || 0} pago
                                      {sale.payment_count !== 1 ? 's' : ''})
                                    </span>
                                  </p>
                                </div>

                                {/* Barra de progreso */}
                                <div className='space-y-1 pt-2'>
                                  <div className='w-full bg-gray-200 rounded-full h-3'>
                                    <div
                                      className={`h-3 rounded-full transition-all ${
                                        sale.is_fully_paid
                                          ? 'bg-green-500'
                                          : 'bg-orange-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          sale.payment_progress || 0,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <div className='border-t pt-2 mt-2'>
                              <p className='text-sm leading-relaxed'>
                                <strong className='inline-block w-32'>
                                  Usuario:
                                </strong>
                                <span className='text-muted-foreground'>
                                  {sale.user_name || 'N/A'}
                                </span>
                              </p>
                              <p className='text-sm leading-relaxed'>
                                <strong className='inline-block w-32'>
                                  Método de Pago:
                                </strong>
                                <span className='text-muted-foreground'>
                                  {sale.payment_method || 'N/A'}
                                </span>
                              </p>
                              {sale.currency && (
                                <p className='text-sm leading-relaxed'>
                                  <strong className='inline-block w-32'>
                                    Moneda:
                                  </strong>
                                  <span className='text-muted-foreground'>
                                    {sale.currency}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Products Table */}
                      {sale.details && sale.details.length > 0 && (
                        <div className='space-y-4'>
                          <div className='flex items-center justify-between'>
                            <h3 className='font-semibold text-lg'>Productos</h3>
                            <Badge variant='outline' className='text-sm'>
                              {sale.items || sale.details.length}{' '}
                              {sale.items === 1 || sale.details.length === 1
                                ? 'producto'
                                : 'productos'}
                            </Badge>
                          </div>
                          <div className='border rounded-lg overflow-x-auto'>
                            <Table>
                              <TableHeader>
                                <TableRow className='bg-muted/50'>
                                  <TableHead className='font-semibold min-w-[200px]'>
                                    Producto
                                  </TableHead>
                                  <TableHead className='font-semibold text-center w-[100px]'>
                                    Cantidad
                                  </TableHead>
                                  <TableHead className='font-semibold text-right w-[140px]'>
                                    Precio Base
                                  </TableHead>
                                  <TableHead className='font-semibold text-right w-[180px]'>
                                    Precio Final
                                  </TableHead>
                                  <TableHead className='font-semibold text-right w-[120px]'>
                                    Subtotal
                                  </TableHead>
                                  <TableHead className='font-semibold text-right w-[120px]'>
                                    Total
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sale.details.map((detail, index) => (
                                  <TableRow key={detail.id || index}>
                                    <TableCell className='font-medium min-w-[200px]'>
                                      <div>
                                        <div>{detail.product_name}</div>
                                        {detail.product_type && (
                                          <div className='text-xs text-muted-foreground'>
                                            {detail.product_type}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className='text-center w-[100px] tabular-nums'>
                                      {detail.quantity}
                                    </TableCell>
                                    <TableCell className='text-right w-[140px] tabular-nums'>
                                      {formatGuaranies(detail.base_price)}
                                    </TableCell>
                                    <TableCell className='text-right w-[180px]'>
                                      <div className='flex items-center justify-end gap-2'>
                                        <span className='tabular-nums'>
                                          {formatGuaranies(detail.unit_price)}
                                        </span>
                                        {detail.price_modified && (
                                          <Badge
                                            variant='warning'
                                            className='text-xs whitespace-nowrap'
                                          >
                                            Modificado
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className='text-right w-[120px] tabular-nums'>
                                      {formatGuaranies(detail.subtotal)}
                                    </TableCell>
                                    <TableCell className='text-right font-semibold w-[120px] tabular-nums'>
                                      {formatGuaranies(detail.total_with_tax)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Total Summary */}
                          <div className='flex justify-end pt-4 border-t-2'>
                            <div className='space-y-2 min-w-[350px]'>
                              <div className='border-t pt-2 mt-2'>
                                <div className='bg-primary/5 px-4 py-3 rounded-lg'>
                                  <div className='flex justify-between items-center text-xl font-bold'>
                                    <span>Total:</span>
                                    <span className='tabular-nums'>
                                      {formatGuaranies(Math.round(sale.total_amount || 0))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          <DialogFooter className='flex-shrink-0 border-t pt-4 mt-4'>
            <Button
              onClick={() => setSaleDetailDialog(false)}
              className={styles.button('primary')}
              size='lg'
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SalePayment
