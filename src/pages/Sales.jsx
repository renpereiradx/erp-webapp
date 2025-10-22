/**
 * Página de Ventas - Separada de Reservas
 * Siguiendo guía MVP: funcionalidad básica navegable
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Check,
  AlertCircle,
  CreditCard,
  DollarSign,
  Calculator,
  User,
  Plus,
  Minus,
  Trash2,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/lib/i18n'
import DataState from '@/components/ui/DataState'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useAnnouncement } from '@/contexts/AnnouncementContext'
import { useSalesLogic } from '@/hooks/useSalesLogic'
import DiscountModal from '@/components/DiscountModal'
import SalesHistorySection from '@/components/SalesHistorySection'
import CurrencySelector from '@/components/payment/CurrencySelector'
import { SYSTEM_MESSAGES } from '@/constants/mockData'
import useSaleStore from '@/store/useSaleStore'
import useProductStore from '@/store/useProductStore'
import useClientStore from '@/store/useClientStore'
import useReservationStore from '@/store/useReservationStore'
import saleService from '@/services/saleService'
import { validateReserve } from '@/utils/discountValidation'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'

const Sales = () => {
  const { t } = useI18n()
  const { styles, isMaterial } = useThemeStyles()
  const { announceSuccess, announceError } = useAnnouncement()

  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [amountPaidInput, setAmountPaidInput] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('PYG')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState(null)
  const [showPendingSalesModal, setShowPendingSalesModal] = useState(false)
  const [pendingSaleSelection, setPendingSaleSelection] = useState(null)
  const [selectedPendingSale, setSelectedPendingSale] = useState(null)
  const [activeTab, setActiveTab] = useState('new')

  const salesHistoryRef = useRef(null)

  const [paymentMethods, setPaymentMethods] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [loadingPaymentData, setLoadingPaymentData] = useState(true)

  const {
    currentSaleData,
    paymentInProgress,
    calculateChange,
    setCurrentSaleClient,
    setPaymentMethod,
    getCurrentSaleTotal,
    getChangeAmount,
    fetchPendingSalesByClient,
    pendingSales,
    pendingSalesLoading,
    clearPendingSales,
  } = useSaleStore()

  const {
    products,
    loading: productsLoading,
    error: productsError,
    searchProducts: searchProductsStore,
  } = useProductStore()

  const { clients, fetchClients } = useClientStore()

  const {
    reservations,
    fetchReservationsByClient,
    loading: reservationsLoading,
  } = useReservationStore()

  const hasPendingSales = useMemo(() => {
    return Array.isArray(pendingSales) && pendingSales.length > 0
  }, [pendingSales])

  const availableProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const hasValidData = product.product_name && product.product_id
      const isActive = product.active !== false && product.state !== false
      const stockValue =
        product.stock_quantity || product.stock || product.quantity || 0
      const hasStock =
        stockValue > 0 ||
        (!Object.prototype.hasOwnProperty.call(product, 'stock_quantity') &&
          !Object.prototype.hasOwnProperty.call(product, 'stock') &&
          !Object.prototype.hasOwnProperty.call(product, 'quantity'))

      return hasValidData && isActive && hasStock
    })

    return filtered
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableProducts
    }

    return availableProducts
  }, [availableProducts, searchQuery])

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) {
      return clients
    }

    const query = clientSearchQuery.toLowerCase().trim()
    return clients.filter(client => {
      return (
        client.name?.toLowerCase().includes(query) ||
        client.last_name?.toLowerCase().includes(query) ||
        client.document_id?.toLowerCase().includes(query) ||
        client.contact?.email?.toLowerCase().includes(query) ||
        client.contact?.phone?.toLowerCase().includes(query)
      )
    })
  }, [clients, clientSearchQuery])

  const salesLogic = useSalesLogic()
  const {
    saleItems,
    subtotal,
    tax,
    total,
    validations,
    selectedReserve,
    setSelectedReserve,
    applyPercentageDiscount,
    applyFixedDiscount,
    setDirectPrice,
    removeDiscount,
    clearCart,
  } = salesLogic

  const availableReservations = useMemo(() => {
    if (!salesLogic.selectedClient) {
      return []
    }

    return reservations.filter(reservation => {
      const statusMatch = reservation.status?.toLowerCase() === 'confirmed'

      const clientMatch =
        reservation.client_id === salesLogic.selectedClient ||
        reservation.client_id?.toString() ===
          salesLogic.selectedClient?.toString()

      return statusMatch && clientMatch
    })
  }, [reservations, salesLogic.selectedClient])

  const parseStockError = errorDetails => {
    const regex =
      /Stock insuficiente para producto "([^\"]+)" \(ID: ([^)]+)\)\. Disponible: ([0-9.]+), Requerido: ([0-9.]+)/
    const match = errorDetails.match(regex)

    if (match) {
      return {
        productName: match[1],
        productId: match[2],
        available: parseFloat(match[3]),
        required: parseFloat(match[4]),
      }
    }

    return null
  }

  const formatStockError = stockError => {
    return (
      `⚠️ Stock insuficiente para "${stockError.productName}"\n\n` +
      `• Disponible: ${stockError.available}\n` +
      `• Requerido: ${stockError.required}\n\n` +
      `Por favor, ajuste la cantidad o verifique el inventario.`
    )
  }

  const parseDiscountError = errorDetails => {
    const regex =
      /El descuento \(([0-9.]+)\) no puede ser mayor al precio \(([0-9.]+)\) para producto ([^(]+) \(([^)]+)\)/
    const match = errorDetails.match(regex)

    if (match) {
      return {
        discount: parseFloat(match[1]),
        price: parseFloat(match[2]),
        productName: match[3].trim(),
        productId: match[4],
      }
    }
    return null
  }

  const formatDiscountError = discountError => {
    return (
      `⚠️ Error en descuento para "${discountError.productName}"\n\n` +
      `• Precio del producto: $${discountError.price.toLocaleString()}\n` +
      `• Descuento aplicado: $${discountError.discount.toLocaleString()}\n\n` +
      `El descuento no puede ser mayor al precio del producto.`
    )
  }

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Cargar clientes al inicializar (todos para búsqueda)
  useEffect(() => {
    fetchClients(1000) // Cargar hasta 1000 clientes para búsqueda local
  }, [fetchClients])

  // Cargar métodos de pago y monedas dinámicamente
  useEffect(() => {
    const loadPaymentData = async () => {
      setLoadingPaymentData(true)
      try {
        // Cargar métodos de pago y monedas en paralelo
        const [methodsData, currenciesData] = await Promise.all([
          PaymentMethodService.getAll().catch(err => {
            console.warn('Error loading payment methods, using defaults:', err)
            return [
              { id: 1, method_code: 'CASH', description: 'Efectivo' },
              { id: 2, method_code: 'CARD', description: 'Tarjeta' },
              { id: 3, method_code: 'TRANSFER', description: 'Transferencia' },
            ]
          }),
          CurrencyService.getAll().catch(err => {
            console.warn('Error loading currencies, using defaults:', err)
            return [
              { id: 1, currency_code: 'PYG', name: 'Guaraní' },
              { id: 2, currency_code: 'USD', name: 'Dólar' },
              { id: 3, currency_code: 'EUR', name: 'Euro' },
            ]
          }),
        ])

        // Mapear métodos de pago al formato esperado por el frontend
        const mappedMethods = methodsData.map(method => {
          const iconMap = {
            CASH: DollarSign,
            CARD: CreditCard,
            TRANSFER: CreditCard,
            EFECTIVO: DollarSign,
            TARJETA: CreditCard,
            TRANSFERENCIA: CreditCard,
          }

          return {
            id: method.id,
            value: method.method_code.toLowerCase(),
            label: method.description,
            icon: iconMap[method.method_code.toUpperCase()] || DollarSign,
            methodCode: method.method_code,
          }
        })

        setPaymentMethods(mappedMethods)
        setCurrencies(currenciesData)
      } catch (error) {
        console.error('Error loading payment data:', error)
        // Usar valores por defecto en caso de error
        setPaymentMethods([
          {
            id: 1,
            value: 'cash',
            label: 'Efectivo',
            icon: DollarSign,
            methodCode: 'CASH',
          },
          {
            id: 2,
            value: 'card',
            label: 'Tarjeta',
            icon: CreditCard,
            methodCode: 'CARD',
          },
          {
            id: 3,
            value: 'transfer',
            label: 'Transferencia',
            icon: CreditCard,
            methodCode: 'TRANSFER',
          },
        ])
        setCurrencies([
          { id: 1, currency_code: 'PYG', name: 'Guaraní' },
          { id: 2, currency_code: 'USD', name: 'Dólar' },
          { id: 3, currency_code: 'EUR', name: 'Euro' },
        ])
      } finally {
        setLoadingPaymentData(false)
      }
    }

    loadPaymentData()
  }, [])

  // Cargar reservas cuando se selecciona un cliente
  useEffect(() => {
    if (salesLogic.selectedClient) {
      fetchReservationsByClient(salesLogic.selectedClient).catch(error => {
        console.error('Error loading client reservations:', error)
      })
    } else {
      // Si no hay cliente seleccionado, limpiar reserva
      salesLogic.setSelectedReserve(null)
    }
  }, [
    salesLogic.selectedClient,
    fetchReservationsByClient,
    salesLogic.setSelectedReserve,
  ])

  useEffect(() => {
    if (!salesLogic.selectedClient) {
      setSelectedPendingSale(null)
      clearPendingSales()
      return
    }

    setSelectedPendingSale(null)

    fetchPendingSalesByClient(salesLogic.selectedClient).catch(error => {
      console.error('Error loading pending sales:', error)
      showNotification(
        `Error al cargar ventas pendientes: ${error.message}`,
        'error'
      )
    })
  }, [salesLogic.selectedClient, fetchPendingSalesByClient, clearPendingSales])

  useEffect(() => {
    if (showPendingSalesModal) {
      if (Array.isArray(pendingSales) && pendingSales.length > 0) {
        setPendingSaleSelection(currentSelection => {
          if (
            currentSelection &&
            pendingSales.some(sale => sale.sale_id === currentSelection.sale_id)
          ) {
            return currentSelection
          }
          if (selectedPendingSale) {
            const match = pendingSales.find(
              sale => sale.sale_id === selectedPendingSale.sale_id
            )
            if (match) {
              return match
            }
          }
          return pendingSales[0]
        })
      } else {
        setPendingSaleSelection(null)
      }
    } else {
      setPendingSaleSelection(null)
    }
  }, [showPendingSalesModal, pendingSales, selectedPendingSale])

  useEffect(() => {
    if (!selectedPendingSale) {
      return
    }

    if (paymentMethods.length > 0) {
      const matchedMethod =
        paymentMethods.find(
          method => method.id === selectedPendingSale.payment_method_id
        ) ||
        paymentMethods.find(method => {
          const label = selectedPendingSale.payment_method?.toLowerCase()
          return label && method.label.toLowerCase() === label
        }) ||
        paymentMethods.find(method => {
          const code =
            selectedPendingSale.payment_method_code ||
            selectedPendingSale.payment_method
          return (
            code &&
            method.methodCode &&
            method.methodCode.toLowerCase() === code.toLowerCase()
          )
        })

      if (matchedMethod && matchedMethod.value !== selectedPaymentMethod) {
        setSelectedPaymentMethod(matchedMethod.value)
        setPaymentMethod(matchedMethod.value)
      }
    }

    if (currencies.length > 0) {
      const matchedCurrency =
        currencies.find(
          currency => currency.id === selectedPendingSale.currency_id
        ) ||
        currencies.find(
          currency =>
            currency.currency_code === selectedPendingSale.currency_code
        ) ||
        currencies.find(
          currency => currency.currency_code === selectedPendingSale.currency
        )

      if (
        matchedCurrency &&
        matchedCurrency.currency_code &&
        matchedCurrency.currency_code !== selectedCurrency
      ) {
        setSelectedCurrency(matchedCurrency.currency_code)
      }
    }
  }, [
    selectedPendingSale,
    paymentMethods,
    currencies,
    selectedPaymentMethod,
    selectedCurrency,
    setPaymentMethod,
  ])

  // Cargar productos iniciales con una búsqueda vacía (como en Products.jsx)
  useEffect(() => {
    if (products.length === 0 && !productsLoading) {
      searchProductsStore('').catch(error => {
        console.error('Error loading initial products:', error)
      })
    }
  }, [products.length, productsLoading, searchProductsStore])

  // Función para buscar productos usando la API del store
  const handleProductSearch = async query => {
    try {
      const searchTerm = query.trim()
      const result = await searchProductsStore(searchTerm)
    } catch (error) {
      console.error('Error searching products:', error)
      showNotification(`Error al buscar productos: ${error.message}`, 'error')
    }
  }

  // Efecto para realizar búsqueda cuando cambia el query
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        handleProductSearch(searchQuery)
      }, 300) // Debounce de 300ms

      return () => clearTimeout(debounceTimer)
    } else {
      // No limpiar productos, solo hacer búsqueda vacía para cargar productos iniciales
      handleProductSearch('')
    }
  }, [searchQuery])

  // Efecto para sincronizar cambios de pago
  useEffect(() => {
    const amount = parseFloat(amountPaidInput) || 0
    const total = getCurrentSaleTotal()
    if (amount > 0 && total > 0) {
      calculateChange(total, amount)
    }
  }, [amountPaidInput, calculateChange, getCurrentSaleTotal])

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = method => {
    setSelectedPaymentMethod(method)
    setPaymentMethod(method)

    if (method === 'cash') {
      setShowPaymentSection(true)
    } else {
      setShowPaymentSection(false)
      setAmountPaidInput('')
    }
  }

  // Manejar cambio en monto pagado
  const handleAmountPaidChange = value => {
    setAmountPaidInput(value)
  }

  // Handlers para modal de descuentos
  const handleOpenDiscountModal = item => {
    setSelectedItemForDiscount(item)
    setShowDiscountModal(true)
  }

  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false)
    setSelectedItemForDiscount(null)
  }

  // Handlers para reservas en el carrito
  const handleAddReservationToCart = reservation => {
    // El precio viene en total_amount según RESERVES_API.md
    const price = reservation.total_amount || 0

    // Extraer fecha del start_time (viene como timestamp ISO completo)
    const reservationDate = reservation.start_time
      ? reservation.start_time.split('T')[0]
      : null

    // Obtener el ID correcto de la reserva (puede venir como reserve_id o id)
    const reserveId = reservation.reserve_id || reservation.id

    // Crear un producto virtual basado en la reserva
    const reservationProduct = {
      product_id: reservation.product_id || `reservation_${reserveId}`,
      id: reservation.product_id || `reservation_${reserveId}`,
      product_name:
        reservation.product_name ||
        reservation.service_name ||
        `Servicio Reserva #${reserveId}`,
      name:
        reservation.product_name ||
        reservation.service_name ||
        `Servicio Reserva #${reserveId}`,
      price: price,
      originalPrice: price, // Para reservas, el precio original es el precio de la reserva
      category: 'Servicio Reservado',
      stock_quantity: 1,
      product_type: 'SERVICE',
      state: true,
      // Marcar como proveniente de reserva
      fromReservation: true,
      reservation_id: reserveId, // ✅ FIX: Usar el ID correcto (reserve_id o id)
      reservation_date: reservationDate,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      // Información de precios para justificación si es necesario
      reservationPrice: price,
      baseProductPrice: null, // Se determinará si es necesario
    }

    // Agregar al carrito con cantidad 1
    salesLogic.addSaleItem(reservationProduct, 1)

    // Marcar la reserva como seleccionada para el envío de la venta
    salesLogic.setSelectedReserve(reservation)

    showNotification(
      `Servicio de reserva "${reservationProduct.name}" agregado al carrito`
    )
  }

  const handleRemoveReservationFromCart = reservation => {
    // Obtener el ID correcto de la reserva
    const reserveId = reservation.reserve_id || reservation.id

    // Buscar y remover el item del carrito usando SOLO el reservation_id
    const itemToRemove = saleItems.find(
      item => item.reservation_id === reserveId
    )

    if (itemToRemove) {
      salesLogic.removeItem(itemToRemove.product_id || itemToRemove.id)

      // Si no hay más items de reserva, limpiar la reserva seleccionada
      const hasOtherReservationItems = saleItems.some(
        item => item.fromReservation && item.reservation_id !== reserveId
      )

      if (!hasOtherReservationItems) {
        salesLogic.setSelectedReserve(null)
      }

      showNotification(`Servicio de reserva removido del carrito`)
    }
  }

  // Manejar envío de venta según SALE_WITH_DISCOUNT_API.md y ADD_PRODUCT_TO_SALE.md
  const handleSaleSubmit = async (options = {}) => {
    const {
      skipPendingPrompt = false,
      pendingSaleOverride = null,
      enforceNewSale = false,
    } = options

    const activePendingSale = pendingSaleOverride || selectedPendingSale

    if (!salesLogic.validations.canProceed) {
      showNotification(SYSTEM_MESSAGES.ERROR.VALIDATION_ERROR, 'error')
      announceError('Venta', 'Validación')
      return
    }

    if (!salesLogic.selectedClient) {
      showNotification('Debe seleccionar un cliente', 'error')
      return
    }

    const pendingSalesCount = Array.isArray(pendingSales)
      ? pendingSales.length
      : 0

    if (
      !skipPendingPrompt &&
      pendingSalesCount > 0 &&
      !activePendingSale &&
      !enforceNewSale
    ) {
      setShowPendingSalesModal(true)
      return
    }

    const isAppendingToPendingSale = Boolean(activePendingSale)

    if (!isAppendingToPendingSale && !selectedPaymentMethod) {
      showNotification('Debe seleccionar un método de pago', 'error')
      return
    }

    if (isAppendingToPendingSale && selectedReserve) {
      showNotification(
        'No se pueden usar reservas al agregar productos a una venta pendiente',
        'error'
      )
      return
    }

    if (!isAppendingToPendingSale && selectedReserve) {
      const reserveValidation = validateReserve(
        selectedReserve,
        salesLogic.selectedClient
      )
      if (!reserveValidation.isValid) {
        showNotification(
          `Error en reserva: ${reserveValidation.errors.join(', ')}`,
          'error'
        )
        return
      }

      console.log('📋 Procesando venta con reserva:', {
        reserveId: selectedReserve.id,
        serviceName:
          selectedReserve.product_name || selectedReserve.service_name,
        amount: selectedReserve.total_amount || selectedReserve.amount,
        date: selectedReserve.reservation_date,
      })
    }

    setLoading(true)
    try {
      const saleData = salesLogic.prepareSaleData()

      if (isAppendingToPendingSale) {
        const payload = {
          product_details: saleData.product_details,
          allow_price_modifications: Boolean(
            saleData.allow_price_modifications
          ),
        }

        const response = await saleService.addProductsToSale(
          activePendingSale.sale_id,
          payload
        )

        if (!response.success) {
          throw new Error(
            response.error ||
              response.message ||
              'Error al agregar productos a la venta'
          )
        }

        const successMessage =
          response.message ||
          `Se agregaron ${
            response.products_added || payload.product_details.length
          } producto(s) a la venta ${activePendingSale.sale_id}`

        showNotification(successMessage)
        announceSuccess('Venta')

        if (salesHistoryRef.current) {
          salesHistoryRef.current.refreshToday()
        }

        clearCart()
        setAmountPaidInput('')
        setShowPaymentSection(false)

        try {
          const refreshed = await fetchPendingSalesByClient(
            salesLogic.selectedClient
          )
          if (refreshed && Array.isArray(refreshed.data)) {
            const updatedSale = refreshed.data.find(
              item => item.sale_id === activePendingSale.sale_id
            )
            setSelectedPendingSale(updatedSale || null)
          } else {
            setSelectedPendingSale(null)
          }
        } catch (refreshError) {
          console.error(
            'Error refreshing pending sales after addition:',
            refreshError
          )
        }

        return
      }

      const paymentMethod = paymentMethods.find(
        m => m.value === selectedPaymentMethod
      )
      const currency = currencies.find(
        c => c.currency_code === selectedCurrency
      )

      const finalSaleData = {
        ...saleData,
        payment_method_id: paymentMethod?.id || 1,
        currency_id: currency?.id || 1,
      }

      const response = await saleService.createSale(finalSaleData)

      if (response.success) {
        const successMessage = selectedReserve
          ? `Venta con reserva #${selectedReserve.id} creada exitosamente. ${
              response.message || ''
            }`
          : `Venta creada exitosamente. Factura: ${
              response.invoice_number || 'N/A'
            }`

        showNotification(successMessage)
        announceSuccess('Venta')

        if (response.reserve_processed) {
          console.log('✅ Reserva procesada exitosamente en la venta')
        }

        if (salesHistoryRef.current) {
          salesHistoryRef.current.refreshToday()
        }

        salesLogic.resetSale()
        setSelectedPaymentMethod('')
        setAmountPaidInput('')
        setShowPaymentSection(false)
      }
    } catch (error) {
      console.error('Error creating sale:', error)

      let errorMessage = 'Error desconocido al procesar la venta'

      // Manejar diferentes tipos de errores del backend
      if (error.response?.data) {
        const responseData = error.response.data

        // Error con formato estructurado
        if (responseData.error_code) {
          switch (responseData.error_code) {
            case 'PROCESSING_ERROR':
              if (responseData.details?.includes('permission denied')) {
                errorMessage =
                  'Error de permisos en el servidor. Contacte al administrador.'
              } else if (responseData.details?.includes('Stock insuficiente')) {
                // Extraer información específica del error de stock
                const stockError = parseStockError(responseData.details)
                errorMessage = stockError
                  ? formatStockError(stockError)
                  : 'Stock insuficiente para completar la venta'
              } else if (
                responseData.details?.includes('EXCESSIVE_DISCOUNT_AMOUNT')
              ) {
                // Extraer información específica del error de descuento
                const discountError = parseDiscountError(responseData.details)
                errorMessage = discountError
                  ? formatDiscountError(discountError)
                  : 'Error en el cálculo de descuentos'
              } else {
                errorMessage = `Error de procesamiento: ${
                  responseData.message || responseData.details
                }`
              }
              break
            case 'INSUFFICIENT_STOCK':
              errorMessage = `Stock insuficiente: ${responseData.message}`
              break
            case 'CLIENT_INACTIVE':
              errorMessage =
                'Cliente inactivo. Por favor seleccione otro cliente.'
              break
            case 'PRICE_MODIFICATION_NOT_ALLOWED':
              errorMessage = 'Modificación de precio no permitida'
              break
            default:
              errorMessage =
                responseData.message ||
                responseData.details ||
                'Error al procesar la venta'
          }
        }
        // Error con formato simple (string)
        else if (typeof responseData === 'string') {
          errorMessage = responseData
        }
        // Error con propiedad error
        else if (responseData.error) {
          const detail = responseData.error_detail
            ? ` (${responseData.error_detail})`
            : ''
          errorMessage = `${responseData.error}${detail}`
        }
        // Error con mensaje directo
        else if (responseData.message) {
          errorMessage = responseData.message
        }
      }
      // Error de autenticación (ApiError o response 401)
      else if (
        error.name === 'UNAUTHORIZED' ||
        error.code === 'UNAUTHORIZED' ||
        error.response?.status === 401 ||
        error.message?.includes('Sesión expirada') ||
        error.message?.includes('token inválido')
      ) {
        // Mostrar información detallada del error para debugging
        const tokenPreview =
          localStorage.getItem('authToken')?.substring(0, 50) + '...'
        console.error('❌ Error de autenticación - Detalles completos:', {
          errorName: error.name,
          errorCode: error.code,
          errorMessage: error.message,
          responseStatus: error.response?.status,
          tokenPreview: tokenPreview,
          fullError: error,
        })

        errorMessage =
          '🔒 Error de Autenticación (401)\n\n' +
          'El backend rechazó el token.\n\n' +
          '📋 Información técnica:\n' +
          `• Error: ${error.message}\n` +
          `• Token: ${tokenPreview}\n\n` +
          '🔧 Soluciones:\n' +
          '1. Verifica logs de la consola (F12)\n' +
          '2. Haz logout manual\n' +
          '3. Verifica que el backend esté actualizado\n\n' +
          '⚠️ NO se cerrará sesión automáticamente'

        // REMOVIDO: Ya no redirigimos automáticamente
        // Esto permite al usuario ver y copiar los logs
      }
      // Error de red o timeout
      else if (
        error.code === 'NETWORK_ERROR' ||
        error.message?.includes('timeout')
      ) {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.'
      }
      // Otros errores HTTP
      else if (error.response?.status) {
        errorMessage = `Error del servidor (${error.response.status}). Intente nuevamente.`
      }
      // Error genérico con mensaje
      else if (error.message) {
        errorMessage = error.message
      }

      showNotification(errorMessage, 'error')
      announceError('Venta', 'Error de procesamiento')
    } finally {
      setLoading(false)
    }
  }

  const handleRememberPendingSaleSelection = () => {
    if (!pendingSaleSelection) {
      showNotification(
        'Selecciona una venta pendiente para continuar.',
        'error'
      )
      return
    }

    setSelectedPendingSale(pendingSaleSelection)
    setSelectedReserve(null)
    setShowPendingSalesModal(false)
    showNotification(
      `Venta #${pendingSaleSelection.sale_id} seleccionada. Completa la venta cuando estés listo/a.`,
      'success'
    )
  }

  const handleCreateStandaloneSale = () => {
    setSelectedPendingSale(null)
    setShowPendingSalesModal(false)
    handleSaleSubmit({ skipPendingPrompt: true, enforceNewSale: true })
  }

  const handleAddProductsToSelectedPendingSale = () => {
    if (!pendingSaleSelection) {
      showNotification(
        'Selecciona una venta pendiente para agregar los productos.',
        'error'
      )
      return
    }

    setSelectedPendingSale(pendingSaleSelection)
    setSelectedReserve(null)
    setShowPendingSalesModal(false)
    handleSaleSubmit({
      skipPendingPrompt: true,
      pendingSaleOverride: pendingSaleSelection,
    })
  }

  // Componente de notificación mejorado
  const NotificationBanner = () => {
    if (!notification) return null
    const isError = notification.type === 'error'
    const icon = isError ? AlertCircle : Check
    const variant = isError ? 'error' : 'success'

    // Separar mensaje por saltos de línea para mejor formato
    const messageLines = notification.message
      .split('\n')
      .filter(line => line.trim())
    const title = messageLines[0]
    const details = messageLines.slice(1)

    const bannerClasses = styles.card(variant, {
      density: 'compact',
      extra: 'mb-6',
    })

    return (
      <div className={bannerClasses} role={isError ? 'alert' : 'status'}>
        <div className='flex items-start gap-3'>
          {React.createElement(icon, { className: 'w-5 h-5 shrink-0 mt-0.5' })}
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-medium leading-snug mb-1'>{title}</div>
            {details.length > 0 && (
              <div className='text-xs leading-relaxed opacity-90 space-y-1'>
                {details.map((line, index) => (
                  <div key={index} className='whitespace-pre-line'>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setNotification(null)}
            className='shrink-0 text-current hover:opacity-70 transition-opacity p-1 -m-1'
            aria-label='Cerrar notificación'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }
  // Componente del resumen de venta
  const SaleSummary = () => {
    if (saleItems.length === 0) return null

    return (
      <Card
        className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', {
          density: 'compact',
        })}
      >
        <CardHeader>
          <CardTitle className={styles.header('h3')}>
            {t('sales.summary.title', 'Resumen de Venta')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex justify-between'>
            <span>{t('sales.summary.subtotal', 'Subtotal:')}</span>
            <span>${subtotal}</span>
          </div>
          {selectedReserve && (
            <div className='flex justify-between text-green-600'>
              <span>Reserva aplicada:</span>
              <span>-₲{selectedReserve.amount?.toLocaleString()}</span>
            </div>
          )}
          <Separator className='my-2' />
          <div className='flex justify-between'>
            <span className='font-medium'>
              {t('sales.summary.total', 'Total:')}
            </span>
            <span className='font-bold text-lg'>${total}</span>
          </div>
          <Badge variant='outline' className='w-full justify-center'>
            {saleItems.reduce((sum, item) => sum + item.quantity, 0)}{' '}
            {t('sales.summary.items', 'artículos')}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  // Función para manejar búsqueda de productos con Enter
  const handleSearchKeyPress = e => {
    if (e.key === 'Enter') {
      // Si hay texto, buscar productos antes de abrir modal
      if (searchQuery.trim()) {
        handleProductSearch(searchQuery)
      }
      setShowProductModal(true)
    }
  }

  // Función para abrir modal de productos
  const openProductModal = () => {
    // Si no hay productos y no hay búsqueda, cargar productos iniciales
    if (products.length === 0 && !searchQuery.trim()) {
      handleProductSearch('')
    } else if (searchQuery.trim()) {
      // Si hay texto, buscar productos antes de abrir modal
      handleProductSearch(searchQuery)
    }
    setShowProductModal(true)
  }

  // Función para manejar búsqueda de clientes con Enter
  const handleClientSearchKeyPress = e => {
    if (e.key === 'Enter') {
      setShowClientModal(true)
    }
  }

  // Utilidad para obtener configuración de unidad
  const getUnitConfig = unit => {
    // Unidades con decimales
    const DECIMAL_UNITS = {
      kg: { step: 0.01, min: 0.01, decimals: 2, label: 'Kilogramo' },
      g: { step: 0.1, min: 0.1, decimals: 1, label: 'Gramo' },
      lb: { step: 0.01, min: 0.01, decimals: 2, label: 'Libra' },
      oz: { step: 0.1, min: 0.1, decimals: 1, label: 'Onza' },
      ton: { step: 0.001, min: 0.001, decimals: 3, label: 'Tonelada' },
      l: { step: 0.01, min: 0.01, decimals: 2, label: 'Litro' },
      ml: { step: 1, min: 1, decimals: 0, label: 'Mililitro' },
      gal: { step: 0.1, min: 0.1, decimals: 1, label: 'Galón' },
      meter: { step: 0.01, min: 0.01, decimals: 2, label: 'Metro' },
      cm: { step: 0.1, min: 0.1, decimals: 1, label: 'Centímetro' },
      sqm: { step: 0.01, min: 0.01, decimals: 2, label: 'Metro cuadrado' },
      month: { step: 0.5, min: 0.5, decimals: 1, label: 'Mes' },
    }

    // Unidades enteras (por defecto)
    const INTEGER_CONFIG = {
      step: 1,
      min: 1,
      decimals: 0,
      allowDecimals: false,
    }

    if (DECIMAL_UNITS[unit]) {
      return { ...DECIMAL_UNITS[unit], allowDecimals: true }
    }

    return { ...INTEGER_CONFIG, label: unit || 'unidad' }
  }

  // Validar cantidad según unidad
  const validateQuantity = (value, unit) => {
    const config = getUnitConfig(unit)

    // Validar que value sea un string o número válido
    const valueStr = String(value).trim()
    if (!valueStr || valueStr === '') {
      return { valid: false, error: 'Ingrese una cantidad' }
    }

    const num = parseFloat(valueStr)

    // Validar que sea un número válido
    if (isNaN(num)) {
      return { valid: false, error: 'Debe ser un número válido' }
    }

    // Validar mínimo
    if (num < config.min) {
      return { valid: false, error: `Mínimo: ${config.min}` }
    }

    // Validar decimales para unidades que NO permiten decimales
    if (!config.allowDecimals) {
      // Verificar si el string contiene un punto decimal
      if (valueStr.includes('.') || valueStr.includes(',')) {
        return { valid: false, error: 'Solo números enteros permitidos' }
      }
      // Verificar que sea un entero
      if (!Number.isInteger(num)) {
        return { valid: false, error: 'Solo números enteros permitidos' }
      }
    }

    // Validar cantidad de decimales para unidades que SÍ permiten decimales
    if (config.allowDecimals && config.decimals !== undefined) {
      const decimalPart = valueStr.split('.')[1]
      if (decimalPart && decimalPart.length > config.decimals) {
        return {
          valid: false,
          error: `Máximo ${config.decimals} decimal${
            config.decimals > 1 ? 'es' : ''
          }`,
        }
      }
    }

    return { valid: true, error: null }
  }

  // Componente del modal de selección de productos
  const ProductSelectionModal = () => {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [quantity, setQuantity] = useState('1')
    const [quantityError, setQuantityError] = useState(null)

    const handleProductSelect = product => {
      setSelectedProduct(product)
      // Reset cantidad al seleccionar producto
      const unit = product.unit || 'unit'
      const config = getUnitConfig(unit)
      setQuantity(config.min.toString())
      setQuantityError(null)
    }

    const handleQuantityChange = value => {
      setQuantity(value)

      if (selectedProduct) {
        const unit = selectedProduct.unit || 'unit'
        const validation = validateQuantity(value, unit)
        setQuantityError(validation.error)
      }
    }

    const handleAddProduct = () => {
      if (!selectedProduct) return

      const unit = selectedProduct.unit || 'unit'
      const validation = validateQuantity(quantity, unit)

      if (!validation.valid) {
        setQuantityError(validation.error)
        return
      }

      const numQuantity = parseFloat(quantity)
      salesLogic.addSaleItem(selectedProduct, numQuantity)
      setSelectedProduct(null)
      setQuantity('1')
      setQuantityError(null)
      setShowProductModal(false)
      setSearchQuery('') // Limpiar búsqueda al agregar producto
    }

    if (!showProductModal) return null

    const selectedUnit = selectedProduct?.unit || 'unit'
    const unitConfig = getUnitConfig(selectedUnit)

    return (
      <div
        className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        onClick={() => setShowProductModal(false)}
      >
        <Card
          className='w-full max-w-2xl m-4 bg-white shadow-xl max-h-[80vh] overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          <CardHeader className='bg-white'>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Package className='w-5 h-5 mr-2' />
                Seleccionar Producto
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowProductModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='bg-white p-0'>
            {/* Info y búsqueda */}
            <div className='p-4 border-b'>
              <div className='text-sm text-gray-600 mb-2'>
                {productsLoading && (
                  <span className='text-blue-600'>
                    🔍 Buscando productos...
                  </span>
                )}
                {!productsLoading && (
                  <>
                    {availableProducts.length} productos disponibles
                    {searchQuery && <span> (búsqueda: "{searchQuery}")</span>}
                  </>
                )}
                {productsError && (
                  <span className='text-red-600'>
                    ❌ {String(productsError)}
                  </span>
                )}
              </div>
            </div>

            {/* Lista de productos */}
            <div className='max-h-60 overflow-y-auto'>
              {filteredProducts.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  <Package className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>No se encontraron productos</p>
                  {searchQuery && (
                    <p className='text-sm'>
                      Intenta con otro término de búsqueda
                    </p>
                  )}
                </div>
              ) : (
                <div className='divide-y'>
                  {filteredProducts.map(product => (
                    <div
                      key={product.product_id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedProduct?.product_id === product.product_id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-medium text-gray-900'>
                            {product.product_name || 'Sin nombre'}
                          </h3>
                          {product.category && (
                            <p className='text-sm text-gray-500'>
                              {String(product.category)}
                            </p>
                          )}
                          {product.unit && (
                            <Badge variant='outline' className='mt-1 text-xs'>
                              📏 {getUnitConfig(product.unit).label}
                            </Badge>
                          )}
                          {product.product_id && (
                            <p className='text-xs text-gray-400 mt-1'>
                              ID: {String(product.product_id)}
                            </p>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium'>
                            ₲
                            {(
                              product.price ||
                              product.unit_prices?.[0]?.price_per_unit ||
                              product.unit_prices?.[0]?.price ||
                              product.unit_prices?.[0]?.selling_price ||
                              product.unit_prices?.[0]?.base_price ||
                              0
                            ).toLocaleString()}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              (product.stock_quantity || product.stock || 0) >
                              10
                                ? 'bg-green-100 text-green-700'
                                : (product.stock_quantity ||
                                    product.stock ||
                                    0) > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            Stock:{' '}
                            {product.stock_quantity || product.stock || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cantidad y botones */}
            {selectedProduct && (
              <div className='p-4 border-t bg-gray-50'>
                <div className='mb-4'>
                  <Label className='text-sm font-medium'>
                    Producto seleccionado:
                  </Label>
                  <p className='text-sm text-gray-600'>
                    {selectedProduct?.product_name || 'Sin nombre'}
                  </p>
                  <div className='flex items-center gap-2 mt-1'>
                    <Badge variant='secondary' className='text-xs'>
                      📏 {unitConfig.label}
                    </Badge>
                    <span className='text-xs text-gray-500'>
                      {unitConfig.allowDecimals
                        ? `✅ Decimales permitidos (hasta ${unitConfig.decimals})`
                        : '❌ Solo números enteros'}
                    </span>
                  </div>
                </div>

                <div className='mb-4'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Cantidad ({unitConfig.label})
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const current = parseFloat(quantity) || unitConfig.min
                        const newVal = Math.max(
                          unitConfig.min,
                          current - unitConfig.step
                        )
                        handleQuantityChange(
                          newVal.toFixed(unitConfig.decimals)
                        )
                      }}
                    >
                      <Minus className='w-4 h-4' />
                    </Button>
                    <Input
                      type='number'
                      value={quantity}
                      onChange={e => handleQuantityChange(e.target.value)}
                      onKeyDown={e => {
                        // Bloquear punto decimal para unidades enteras
                        if (
                          !unitConfig.allowDecimals &&
                          (e.key === '.' || e.key === ',')
                        ) {
                          e.preventDefault()
                        }
                      }}
                      className={`w-24 text-center ${
                        quantityError ? 'border-red-500' : ''
                      }`}
                      min={unitConfig.min}
                      step={unitConfig.step}
                      placeholder={unitConfig.min.toString()}
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const current = parseFloat(quantity) || unitConfig.min
                        const newVal = current + unitConfig.step
                        handleQuantityChange(
                          newVal.toFixed(unitConfig.decimals)
                        )
                      }}
                    >
                      <Plus className='w-4 h-4' />
                    </Button>
                  </div>
                  {quantityError && (
                    <p className='text-red-500 text-xs mt-1'>{quantityError}</p>
                  )}
                  <p className='text-xs text-gray-500 mt-1'>
                    Ejemplos:{' '}
                    {unitConfig.allowDecimals
                      ? '0.5, 1.25, 2.5'
                      : '1, 2, 5, 10'}
                  </p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className='p-4 border-t'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() => setShowProductModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className='flex-1'
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || !!quantityError}
                >
                  Agregar Producto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Componente de tabla de productos
  const ProductsTable = () => {
    if (saleItems.length === 0) {
      return (
        <Card>
          <CardContent className='p-8 text-center text-muted-foreground'>
            <Package className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p className='text-lg font-medium'>No hay productos agregados</p>
            <p className='text-sm'>
              Usa el botón "Agregar Producto" para comenzar
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Seleccionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left p-2'>Producto</th>
                  <th className='text-center p-2'>Cantidad</th>
                  <th className='text-right p-2'>Precio Unit.</th>
                  <th className='text-right p-2'>Subtotal</th>
                  <th className='text-center p-2'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map(item => (
                  <tr key={item.product_id || item.id} className='border-b'>
                    <td className='p-2'>
                      <div className='flex items-center gap-2'>
                        <div className='font-medium'>{item.name}</div>
                        {item.fromReservation && (
                          <Badge
                            variant='outline'
                            className='text-xs bg-blue-100 text-blue-700'
                          >
                            📅 Reserva
                          </Badge>
                        )}
                      </div>
                      {item.category && !item.fromReservation && (
                        <div className='text-sm text-muted-foreground'>
                          {item.category}
                        </div>
                      )}
                      {item.fromReservation && item.reservation_date && (
                        <div className='mt-2 p-2 bg-blue-50 rounded border border-blue-200'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Badge
                              variant='outline'
                              className='text-xs bg-blue-100 text-blue-700 border-blue-300'
                            >
                              📅{' '}
                              {new Date(
                                item.reservation_date
                              ).toLocaleDateString('es-PY', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Badge>
                          </div>
                          <div className='flex items-center justify-between text-xs bg-white rounded px-2 py-1'>
                            <div className='flex items-center gap-1'>
                              <span className='text-gray-500'>🕒 Inicio:</span>
                              <span className='font-semibold'>
                                {item.start_time}
                              </span>
                            </div>
                            <span className='text-gray-400'>→</span>
                            <div className='flex items-center gap-1'>
                              <span className='text-gray-500'>Fin:</span>
                              <span className='font-semibold'>
                                {item.end_time}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {item.hasDiscount && (
                        <div className='flex items-center gap-1 mt-1'>
                          <Badge variant='secondary' className='text-xs'>
                            -{item.discountPercentage?.toFixed(1)}%
                          </Badge>
                          <span className='text-xs text-green-600'>
                            Ahorras ₲{item.discountAmount?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className='p-2 text-center'>
                      {item.fromReservation ? (
                        <div className='flex items-center justify-center'>
                          <Badge variant='secondary' className='text-xs'>
                            Cantidad fija: {item.quantity}
                          </Badge>
                        </div>
                      ) : (
                        <div className='flex items-center justify-center gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              salesLogic.updateQuantity(
                                item.product_id || item.id,
                                -1
                              )
                            }
                            className='h-6 w-6 p-0'
                          >
                            <Minus className='w-3 h-3' />
                          </Button>
                          <span className='mx-2 min-w-8 text-center'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              salesLogic.updateQuantity(
                                item.product_id || item.id,
                                1
                              )
                            }
                            className='h-6 w-6 p-0'
                          >
                            <Plus className='w-3 h-3' />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className='p-2 text-right'>
                      {item.hasDiscount ? (
                        <div className='space-y-1'>
                          <div className='text-sm text-gray-500 line-through'>
                            ₲{item.originalPrice?.toLocaleString()}
                          </div>
                          <div className='font-medium text-green-600'>
                            ₲{item.price?.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div>₲{item.price?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className='p-2 text-right font-medium'>
                      ₲{(item.price * item.quantity).toLocaleString()}
                    </td>
                    <td className='p-2 text-center'>
                      <div className='flex items-center gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleOpenDiscountModal(item)}
                          className='text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          title='Aplicar descuento'
                        >
                          <Calculator className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            salesLogic.removeItem(item.product_id || item.id)
                          }
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          title='Eliminar producto'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Componente de procesamiento de pago
  const PaymentSection = () => {
    if (saleItems.length === 0) return null

    const changeAmount = getChangeAmount()
    const totalAmount = getCurrentSaleTotal()

    return (
      <Card
        className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', {
          density: 'compact',
        })}
      >
        <CardHeader>
          <CardTitle className={styles.header('h3')}>
            <CreditCard className='w-5 h-5 mr-2' />
            {t('sales.payment.title', 'Procesamiento de Pago')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Selector de método de pago */}
            <div>
              <Label htmlFor='payment-method' className={styles.label()}>
                {t('sales.payment.method', 'Método de Pago')}
              </Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={handlePaymentMethodChange}
                disabled={Boolean(selectedPendingSale)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar método' />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => {
                    const IconComponent = method.icon
                    return (
                      <SelectItem key={method.value} value={method.value}>
                        <div className='flex items-center'>
                          <IconComponent className='w-4 h-4 mr-2' />
                          {method.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedPendingSale && (
                <p className='mt-1 text-xs text-muted-foreground'>
                  El método de pago se mantiene en la venta pendiente
                  seleccionada.
                </p>
              )}
            </div>

            {/* Selector de moneda */}
            <div>
              <Label htmlFor='currency' className={styles.label()}>
                {t('sales.payment.currency', 'Moneda')}
              </Label>
              <CurrencySelector
                value={selectedCurrency}
                onChange={currency =>
                  setSelectedCurrency(currency.currency_code || currency)
                }
                placeholder='Seleccionar moneda...'
                currencies={currencies}
                loading={loadingPaymentData}
                disabled={Boolean(selectedPendingSale)}
              />
            </div>
          </div>

          {/* Campo de monto pagado (solo para efectivo) */}
          {showPaymentSection && (
            <div>
              <Label htmlFor='amount-paid' className={styles.label()}>
                {t('sales.payment.amount_paid', 'Monto Pagado')}
              </Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  id='amount-paid'
                  type='number'
                  step='0.01'
                  min={totalAmount}
                  value={amountPaidInput}
                  onChange={e => handleAmountPaidChange(e.target.value)}
                  placeholder={`Mínimo $${totalAmount}`}
                  className={styles.input(isMaterial ? 'outlined' : 'subtle', {
                    density: 'compact',
                    extra: 'pl-10',
                  })}
                />
              </div>

              {/* Mostrar cambio */}
              {amountPaidInput &&
                parseFloat(amountPaidInput) >= totalAmount && (
                  <div
                    className={styles.card('success', {
                      density: 'compact',
                      extra: 'mt-2 p-3 flex items-center justify-between',
                    })}
                  >
                    <span className='font-medium flex items-center gap-2 text-sm'>
                      <Calculator className='w-4 h-4' />
                      {t('sales.payment.change', 'Cambio:')}
                    </span>
                    <span className='font-bold text-base'>
                      {(parseFloat(amountPaidInput) - totalAmount).toFixed(2)}
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Resumen de pago */}
          <div className='pt-2 border-t'>
            <div className='flex justify-between items-center'>
              <span className='font-medium'>
                {t('sales.payment.total', 'Total a Pagar:')}
              </span>
              <span className='font-bold text-xl'>${totalAmount}</span>
            </div>
            {(selectedPaymentMethod || selectedPendingSale) && (
              <div className='flex justify-between items-center mt-2'>
                <span className='text-sm text-gray-600'>
                  {t('sales.payment.method', 'Método:')}
                </span>
                <Badge variant='outline'>
                  {selectedPendingSale
                    ? selectedPendingSale.payment_method || 'Registrado'
                    : paymentMethods.find(
                        m => m.value === selectedPaymentMethod
                      )?.label}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Componente del modal de selección de clientes
  const ClientSelectionModal = () => {
    const [selectedClientInModal, setSelectedClientInModal] = useState(null)

    const handleClientSelect = client => {
      setSelectedClientInModal(client)
    }

    const handleSelectClient = () => {
      if (!selectedClientInModal) return

      salesLogic.setSelectedClient(selectedClientInModal.id)
      setCurrentSaleClient(selectedClientInModal.id)
      setSelectedReserve(null)
      setSelectedPendingSale(null)
      clearPendingSales()
      setSelectedClientInModal(null)
      setShowClientModal(false)
      setClientSearchQuery('') // Limpiar búsqueda al seleccionar cliente
    }

    if (!showClientModal) return null

    return (
      <div
        className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        onClick={() => setShowClientModal(false)}
      >
        <Card
          className='w-full max-w-2xl m-4 bg-white shadow-xl max-h-[80vh] overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          <CardHeader className='bg-white'>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <User className='w-5 h-5 mr-2' />
                Seleccionar Cliente
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowClientModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='bg-white p-0'>
            {/* Info y búsqueda */}
            <div className='p-4 border-b'>
              <div className='text-sm text-gray-600 mb-2'>
                {clients.length} clientes disponibles, {filteredClients.length}{' '}
                después del filtro
                {clientSearchQuery && (
                  <span> (búsqueda: "{clientSearchQuery}")</span>
                )}
              </div>
            </div>

            {/* Lista de clientes */}
            <div className='max-h-60 overflow-y-auto'>
              {filteredClients.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  <User className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>No se encontraron clientes</p>
                  {clientSearchQuery && (
                    <p className='text-sm'>
                      Intenta con otro término de búsqueda
                    </p>
                  )}
                </div>
              ) : (
                <div className='divide-y'>
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedClientInModal?.id === client.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-medium text-gray-900'>
                            {client.name || 'Sin nombre'}
                          </h3>
                          {client.contact?.email && (
                            <p className='text-sm text-gray-500'>
                              📧 {client.contact.email}
                            </p>
                          )}
                          {client.contact?.phone && (
                            <p className='text-sm text-gray-500'>
                              📞 {client.contact.phone}
                            </p>
                          )}
                          {client.id && (
                            <p className='text-xs text-gray-400'>
                              ID: {client.id}
                            </p>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          {client.document_id && (
                            <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                              {client.document_id}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              client.status !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {client.status !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cliente seleccionado */}
            {selectedClientInModal && (
              <div className='p-4 border-t bg-gray-50'>
                <div className='mb-4'>
                  <Label className='text-sm font-medium'>
                    Cliente seleccionado:
                  </Label>
                  <p className='text-sm text-gray-600'>
                    {selectedClientInModal.name}
                  </p>
                  {selectedClientInModal.contact?.email && (
                    <p className='text-xs text-gray-500'>
                      📧 {selectedClientInModal.contact.email}
                    </p>
                  )}
                  {selectedClientInModal.contact?.phone && (
                    <p className='text-xs text-gray-500'>
                      📞 {selectedClientInModal.contact.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className='p-4 border-t'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() => setShowClientModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className='flex-1'
                  onClick={handleSelectClient}
                  disabled={!selectedClientInModal}
                >
                  Seleccionar Cliente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const PendingSalesModal = () => {
    const formatSaleDate = saleDate => {
      if (!saleDate) return 'Sin fecha registrada'

      const parsed = new Date(saleDate)
      if (Number.isNaN(parsed.getTime())) {
        return String(saleDate)
      }

      return parsed.toLocaleString('es-PY', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    }

    return (
      <Dialog
        open={showPendingSalesModal}
        onOpenChange={open => setShowPendingSalesModal(open)}
      >
        <DialogContent className='max-w-3xl'>
          <DialogHeader className='space-y-2'>
            <DialogTitle>Ventas pendientes del cliente</DialogTitle>
            <DialogDescription>
              {hasPendingSales
                ? `Selecciona una venta pendiente para integrar los productos actuales o crea una venta aparte.`
                : 'No se encontraron ventas pendientes para este cliente.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {pendingSalesLoading ? (
              <div className='flex flex-col items-center justify-center py-10 text-sm text-gray-500'>
                <RefreshCw className='w-5 h-5 animate-spin mb-3 text-primary' />
                Cargando ventas pendientes...
              </div>
            ) : hasPendingSales ? (
              <div className='grid gap-3 max-h-[320px] overflow-y-auto pr-1'>
                {pendingSales.map(sale => {
                  const isSelected =
                    pendingSaleSelection?.sale_id === sale.sale_id
                  const itemsCount = sale.items ?? sale.details?.length ?? 0
                  const totalAmount =
                    sale.total_amount ?? sale.subtotal_amount ?? 0

                  return (
                    <button
                      key={sale.sale_id}
                      type='button'
                      onClick={() => setPendingSaleSelection(sale)}
                      className={`w-full text-left border rounded-lg p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-primary/60 hover:shadow-sm'
                      }`}
                    >
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div>
                          <p className='text-sm font-semibold text-gray-900'>
                            Venta #{sale.sale_id}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {formatSaleDate(sale.sale_date)}
                          </p>
                        </div>
                        <Badge variant='secondary' className='text-xs'>
                          Pendiente
                        </Badge>
                      </div>
                      <div className='mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700'>
                        <span className='inline-flex items-center gap-1'>
                          <Package className='w-4 h-4 text-gray-500' />
                          {itemsCount} producto{itemsCount === 1 ? '' : 's'}
                        </span>
                        <span className='inline-flex items-center gap-1'>
                          <DollarSign className='w-4 h-4 text-gray-500' />₲
                          {Number(totalAmount).toLocaleString()}
                        </span>
                        {sale.payment_method && (
                          <span className='inline-flex items-center gap-1 text-xs text-gray-500'>
                            <CreditCard className='w-3 h-3' />
                            {sale.payment_method}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-10 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200'>
                <Package className='w-8 h-8 mb-3 text-gray-400' />
                No hay ventas pendientes registradas para este cliente.
              </div>
            )}
          </div>

          <DialogFooter className='gap-2 sm:justify-between'>
            <Button
              variant='ghost'
              onClick={() => setShowPendingSalesModal(false)}
            >
              Cancelar
            </Button>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
              <Button
                variant='outline'
                className='sm:flex-1'
                onClick={handleRememberPendingSaleSelection}
                disabled={!hasPendingSales || !pendingSaleSelection}
              >
                Seleccionar y continuar
              </Button>
              <Button
                variant='outline'
                className='sm:flex-1'
                onClick={handleCreateStandaloneSale}
              >
                Crear venta aparte
              </Button>
              <Button
                className='sm:flex-1'
                onClick={handleAddProductsToSelectedPendingSale}
                disabled={!hasPendingSales || !pendingSaleSelection}
              >
                Agregar productos ahora
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const canCompleteSale =
    salesLogic.validations.canProceed &&
    Boolean(salesLogic.selectedClient) &&
    Boolean(selectedPendingSale || selectedPaymentMethod)
  const isProcessingSale = loading || paymentInProgress
  const primaryCtaTagline = selectedPendingSale
    ? 'Agregar productos a la venta pendiente'
    : 'Listo para completar'
  const primaryCtaHeading = selectedPendingSale
    ? `Venta #${selectedPendingSale.sale_id}`
    : isProcessingSale
    ? t('sales.processing', 'Procesando...')
    : t('sales.complete', 'Completar Venta')
  const primaryCtaChip = isProcessingSale
    ? t('sales.processing', 'Procesando...')
    : selectedPendingSale
    ? 'Agregar productos ahora'
    : 'Generar venta'
  const formattedTotal = total > 0 ? total.toLocaleString() : null

  return (
    <div className={styles.page('space-y-6')} data-testid='sales-page'>
      {/* Header con título y tabs */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{t('sales.title', 'Ventas')}</h1>
      </div>

      <NotificationBanner />

      {/* Tabs para Nueva Venta e Historial */}
      <div className='flex gap-2 border-b'>
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'new'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Nueva Venta
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Historial de Ventas
        </button>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'history' ? (
        <SalesHistorySection ref={salesHistoryRef} />
      ) : loading && saleItems.length === 0 && !salesLogic.selectedClient ? (
        <DataState
          variant='loading'
          skeletonVariant='list'
          testId='sales-loading'
          skeletonProps={{ count: 4 }}
        />
      ) : (
        <div className='space-y-6'>
          {/* Header Superior - Cliente, Pago, Moneda y Productos */}
          <Card
            className={styles.card(isMaterial ? 'elevated' : 'elevated', {
              density: 'comfy',
            })}
          >
            <CardHeader>
              <CardTitle className='text-lg'>Información de Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
                {/* Cliente con búsqueda */}
                <div>
                  <Label className='text-sm font-medium'>Cliente</Label>
                  <div className='flex gap-2'>
                    <Input
                      value={clientSearchQuery}
                      onChange={e => setClientSearchQuery(e.target.value)}
                      onKeyPress={handleClientSearchKeyPress}
                      placeholder='Buscar cliente...'
                      className='flex-1'
                    />
                    <Button
                      onClick={() => setShowClientModal(true)}
                      variant='outline'
                      className='shrink-0'
                    >
                      <User className='w-4 h-4 mr-2' />
                      Buscar Cliente
                    </Button>
                  </div>
                  {salesLogic.selectedClient && (
                    <div className='mt-2 p-2 bg-gray-50 rounded text-sm'>
                      Cliente seleccionado:{' '}
                      {clients.find(c => c.id === salesLogic.selectedClient)
                        ?.name || salesLogic.selectedClient}
                    </div>
                  )}
                </div>

                {salesLogic.selectedClient && (
                  <div className='col-span-full'>
                    {pendingSalesLoading ? (
                      <div className='flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700'>
                        <RefreshCw className='w-4 h-4 animate-spin' />
                        Buscando ventas pendientes para este cliente...
                      </div>
                    ) : hasPendingSales ? (
                      <div className='flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-start gap-3 text-amber-900'>
                          <AlertCircle className='mt-1 h-5 w-5 text-amber-600' />
                          <div className='space-y-2 text-sm'>
                            <p className='font-semibold'>
                              Este cliente tiene {pendingSales.length} venta
                              {pendingSales.length === 1 ? '' : 's'} pendiente
                              {pendingSales.length === 1 ? '' : 's'}.
                            </p>
                            <p className='leading-relaxed'>
                              {selectedPendingSale
                                ? `Los productos actuales se integrarán a la venta #${selectedPendingSale.sale_id}.`
                                : 'Puedes integrar los productos actuales a una venta pendiente o crear una venta nueva.'}
                            </p>
                            {selectedPendingSale && (
                              <div className='text-xs text-amber-800'>
                                Total registrado: ₲
                                {Number(
                                  selectedPendingSale.total_amount ||
                                    selectedPendingSale.subtotal_amount ||
                                    0
                                ).toLocaleString()}{' '}
                                ·{' '}
                                {selectedPendingSale.items ||
                                  selectedPendingSale.details?.length ||
                                  0}{' '}
                                artículo
                                {(selectedPendingSale.items ||
                                  selectedPendingSale.details?.length ||
                                  0) === 1
                                  ? ''
                                  : 's'}{' '}
                                · Pago registrado:{' '}
                                {selectedPendingSale.payment_method ||
                                  'Sin datos'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='flex flex-col gap-2 sm:w-64'>
                          <Button
                            variant='outline'
                            onClick={() => setShowPendingSalesModal(true)}
                          >
                            Gestionar ventas pendientes
                          </Button>
                          {selectedPendingSale && (
                            <Button
                              variant='ghost'
                              className='text-amber-700 hover:bg-amber-100 hover:text-amber-900'
                              onClick={() => {
                                setSelectedPendingSale(null)
                              }}
                            >
                              Crear venta nueva
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Reservas del Cliente */}
                <div className='col-span-full'>
                  <Label className='text-sm font-medium mb-3 block'>
                    Reservas del Cliente
                  </Label>
                  {!salesLogic.selectedClient ? (
                    <div className='p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm'>
                      Selecciona un cliente para ver sus reservas
                    </div>
                  ) : reservationsLoading ? (
                    <div className='p-4 bg-blue-50 rounded-lg text-center text-blue-600 text-sm'>
                      <RefreshCw className='w-4 h-4 animate-spin inline mr-2' />
                      Cargando reservas...
                    </div>
                  ) : availableReservations.length === 0 ? (
                    <div className='p-4 bg-yellow-50 rounded-lg text-center text-yellow-700 text-sm'>
                      Este cliente no tiene reservas confirmadas
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                      {availableReservations.map(reservation => {
                        // ✅ FIX: Usar reserve_id correcto para identificar cada reserva de manera única
                        const reserveId =
                          reservation.reserve_id || reservation.id
                        const isInCart = saleItems.some(
                          item => item.reservation_id === reserveId
                        )

                        // Formatear fecha desde start_time (timestamp ISO completo)
                        const formatDateFromTimestamp = timestamp => {
                          if (!timestamp) return { formatted: null, raw: null }

                          try {
                            const date = new Date(timestamp)

                            // Validar que la fecha sea válida
                            if (!date || isNaN(date.getTime())) {
                              return { formatted: null, raw: timestamp }
                            }

                            // Formatear la fecha
                            const formatted = date.toLocaleDateString('es-PY', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })

                            return { formatted, raw: timestamp }
                          } catch (e) {
                            console.error(
                              'Error formateando fecha:',
                              e,
                              timestamp
                            )
                            return { formatted: null, raw: String(timestamp) }
                          }
                        }

                        // Formatear hora de manera más legible
                        const formatTime = timeStr => {
                          if (!timeStr) return '--:--'
                          // Si viene como timestamp completo, extraer solo la hora
                          if (timeStr.includes('T')) {
                            const time = timeStr.split('T')[1]?.substring(0, 5)
                            return time || '--:--'
                          }
                          // Si viene como HH:MM:SS, tomar solo HH:MM
                          return timeStr.substring(0, 5)
                        }

                        // Calcular duración del servicio
                        const calculateDuration = (start, end) => {
                          if (!start || !end) return null
                          try {
                            const startTime = formatTime(start)
                            const endTime = formatTime(end)
                            const [startH, startM] = startTime
                              .split(':')
                              .map(Number)
                            const [endH, endM] = endTime.split(':').map(Number)

                            if (
                              isNaN(startH) ||
                              isNaN(startM) ||
                              isNaN(endH) ||
                              isNaN(endM)
                            )
                              return null

                            const durationMinutes =
                              endH * 60 + endM - (startH * 60 + startM)
                            if (durationMinutes <= 0) return null

                            const hours = Math.floor(durationMinutes / 60)
                            const minutes = durationMinutes % 60
                            return hours > 0
                              ? `${hours}h ${minutes}m`
                              : `${minutes}m`
                          } catch (e) {
                            return null
                          }
                        }

                        // Usar start_time para extraer la fecha (es un timestamp ISO completo)
                        const dateInfo = formatDateFromTimestamp(
                          reservation.start_time
                        )
                        const startTime = formatTime(reservation.start_time)
                        const endTime = formatTime(reservation.end_time)
                        const duration = calculateDuration(
                          reservation.start_time,
                          reservation.end_time
                        )

                        return (
                          <Card
                            key={reservation.id}
                            className={`transition-all border ${
                              isInCart
                                ? 'border-green-500 bg-green-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <CardContent className='p-4'>
                              {/* Header: Título y Status */}
                              <div className='flex items-start justify-between mb-3'>
                                <div className='flex-1 min-w-0'>
                                  <h4 className='font-semibold text-gray-900 text-sm mb-1 truncate'>
                                    {reservation.service_name ||
                                      reservation.product_name ||
                                      `Servicio #${reservation.id}`}
                                  </h4>
                                  <Badge
                                    variant='outline'
                                    className='text-xs bg-green-50 text-green-700 border-green-200 px-2 py-0.5'
                                  >
                                    ✓ Confirmada
                                  </Badge>
                                </div>
                                <span className='text-sm font-bold text-gray-900 ml-2 whitespace-nowrap'>
                                  ₲
                                  {(
                                    reservation.total_amount || 0
                                  ).toLocaleString()}
                                </span>
                              </div>

                              {/* Fecha - mostrar formateada o raw */}
                              <div className='mb-2 flex items-center gap-1.5 text-xs'>
                                <span className='text-blue-600'>📅</span>
                                {dateInfo.formatted ? (
                                  <span className='font-medium text-gray-700'>
                                    {dateInfo.formatted}
                                  </span>
                                ) : dateInfo.raw ? (
                                  <span className='font-medium text-orange-600'>
                                    {dateInfo.raw}
                                  </span>
                                ) : (
                                  <span className='text-gray-400'>
                                    Sin fecha
                                  </span>
                                )}
                              </div>

                              {/* Horario en caja destacada */}
                              <div className='mb-3 p-2.5 bg-white rounded border border-gray-200 shadow-sm'>
                                <div className='flex items-center justify-between text-xs'>
                                  <div className='flex items-center gap-1.5'>
                                    <span className='text-gray-500'>🕒</span>
                                    <span className='font-semibold text-gray-900'>
                                      {startTime}
                                    </span>
                                  </div>
                                  <span className='text-gray-400 px-2'>→</span>
                                  <div className='flex items-center gap-1.5'>
                                    <span className='font-semibold text-gray-900'>
                                      {endTime}
                                    </span>
                                  </div>
                                </div>
                                {duration && (
                                  <div className='text-xs text-center text-gray-600 mt-1.5 pt-1.5 border-t border-gray-200'>
                                    Duración:{' '}
                                    <span className='font-semibold text-blue-600'>
                                      {duration}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Botón de acción */}
                              <div className='flex justify-end'>
                                {isInCart ? (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() =>
                                      handleRemoveReservationFromCart(
                                        reservation
                                      )
                                    }
                                    className='text-red-600 hover:bg-red-50 border-red-300 text-xs px-3 py-1.5 h-auto'
                                  >
                                    <Trash2 className='w-3 h-3 mr-1.5' />
                                    Quitar
                                  </Button>
                                ) : (
                                  <Button
                                    size='sm'
                                    onClick={() =>
                                      handleAddReservationToCart(reservation)
                                    }
                                    className='bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1.5 h-auto'
                                  >
                                    <Plus className='w-3 h-3 mr-1.5' />
                                    Agregar
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Método de Pago */}
                <div>
                  <Label className='text-sm font-medium'>Método de Pago</Label>
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={handlePaymentMethodChange}
                    disabled={Boolean(selectedPendingSale)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar método' />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => {
                        const IconComponent = method.icon
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className='flex items-center'>
                              <IconComponent className='w-4 h-4 mr-2' />
                              {method.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedPendingSale && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Agregar productos a una venta pendiente reutiliza el pago
                      existente.
                    </p>
                  )}
                </div>

                {/* Moneda */}
                <div>
                  <Label className='text-sm font-medium'>Moneda</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                    disabled={
                      loadingPaymentData || Boolean(selectedPendingSale)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingPaymentData
                            ? 'Cargando...'
                            : selectedPendingSale
                            ? 'Moneda ya definida en la venta pendiente'
                            : 'Seleccionar moneda...'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem
                          key={currency.id}
                          value={currency.currency_code}
                        >
                          <div className='flex items-center'>
                            <span className='font-mono font-bold mr-2'>
                              {currency.currency_code}
                            </span>
                            <span>{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPendingSale && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Se mantiene la moneda configurada en la venta pendiente.
                    </p>
                  )}
                </div>

                {/* Búsqueda y Botón de Productos */}
                <div className='flex flex-col justify-end'>
                  <Label className='text-sm font-medium mb-2'>
                    Buscar Producto
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      placeholder='Nombre, ID o código de barras...'
                      className='flex-1'
                    />
                    <Button
                      onClick={openProductModal}
                      variant='outline'
                      className='shrink-0'
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Buscar Producto
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Productos */}
          <ProductsTable />

          {/* Resumen y Botón de Venta - Solo si hay productos */}
          {saleItems.length > 0 && (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Resumen de Venta */}
              <div className='lg:col-span-2'>
                <SaleSummary />
              </div>

              {/* Botón de Completar Venta */}
              <div className='flex flex-col justify-end'>
                {canCompleteSale ? (
                  <Button
                    onClick={handleSaleSubmit}
                    disabled={isProcessingSale}
                    className='w-full h-full min-h-[140px] rounded-xl border border-emerald-500 bg-emerald-600 px-6 py-8 text-white shadow-xl transition-all hover:bg-emerald-500 hover:shadow-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-300'
                    size='lg'
                    variant='default'
                  >
                    <div className='flex flex-col items-center gap-3 text-center'>
                      <span className='text-xs uppercase tracking-wide text-white/75'>
                        {primaryCtaTagline}
                      </span>
                      <span className='text-2xl font-semibold'>
                        {primaryCtaHeading}
                      </span>
                      {formattedTotal && (
                        <span className='text-lg font-medium text-white/85'>
                          Total actual:{' '}
                          {(selectedCurrency || 'PYG').toUpperCase()}{' '}
                          {formattedTotal}
                        </span>
                      )}
                      {selectedPendingSale && (
                        <span className='text-xs text-white/70'>
                          Pago original:{' '}
                          {selectedPendingSale.payment_method || 'Sin datos'} ·{' '}
                          {(
                            selectedPendingSale.currency ||
                            selectedCurrency ||
                            'Moneda original'
                          ).toString()}
                        </span>
                      )}
                      <div className='mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium'>
                        <Check className='h-4 w-4' />
                        <span>{primaryCtaChip}</span>
                      </div>
                    </div>
                  </Button>
                ) : (
                  <Card className='min-h-[120px] flex items-center justify-center'>
                    <CardContent className='text-center'>
                      <AlertCircle className='w-8 h-8 mx-auto mb-2 text-orange-500' />
                      <p className='text-sm font-medium mb-2'>
                        Para completar la venta:
                      </p>
                      <div className='space-y-1 text-xs text-muted-foreground'>
                        {!salesLogic.validations.canProceed && (
                          <p>• Agrega productos al carrito</p>
                        )}
                        {!salesLogic.selectedClient && (
                          <p>• Selecciona un cliente</p>
                        )}
                        {hasPendingSales && !selectedPendingSale && (
                          <p>• Define si usarás una venta pendiente</p>
                        )}
                        {!selectedPendingSale && !selectedPaymentMethod && (
                          <p>• Selecciona método de pago</p>
                        )}
                        {selectedReserve && (
                          <p className='text-green-600'>
                            • Reserva #{selectedReserve.id} será procesada
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Ventas Pendientes */}
      <PendingSalesModal />

      {/* Modal de Selección de Productos */}
      <ProductSelectionModal />

      {/* Modal de Selección de Clientes */}
      <ClientSelectionModal />

      {/* Modal de Descuentos */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={handleCloseDiscountModal}
        item={selectedItemForDiscount}
        onApplyPercentageDiscount={applyPercentageDiscount}
        onApplyFixedDiscount={applyFixedDiscount}
        onSetDirectPrice={setDirectPrice}
        onRemoveDiscount={removeDiscount}
        currentUser={{ id: 1, name: 'Usuario Actual' }} // TODO: Get from auth store
      />
    </div>
  )
}

export default Sales
