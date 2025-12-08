import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  DollarSign,
  Filter,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react'
import useProductStore from '@/store/useProductStore'
import useClientStore from '@/store/useClientStore'
import useSaleStore from '@/store/useSaleStore'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { CurrencyService } from '@/services/currencyService'
import { productService } from '@/services/productService'

const STATUS_STYLES = {
  completed: { label: 'Completada', badge: 'badge--subtle-success' },
  cancelled: { label: 'Cancelada', badge: 'badge--subtle-error' },
  pending: { label: 'Pendiente', badge: 'badge--subtle-warning' },
}

const formatCurrency = (value, currencyCode) => {
  const isPYG = currencyCode === 'PYG'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value)
}

const formatDocumentId = value => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const getProductDisplay = product => {
  if (!product) return { name: '', id: '', price: 0, sku: '' }
  return {
    name: product.name || product.product_name || '',
    id: product.id || product.product_id || '',
    price:
      product.sale_price ||
      product.price ||
      product.unit_prices?.[0]?.price_per_unit ||
      0,
    sku: product.sku || product.barcode || product.code || '',
  }
}

const SalesNew = () => {
  const navigate = useNavigate()
  const clientSearchContainerRef = useRef(null)

  // Zustand stores
  const {
    products,
    fetchProducts,
    loading: productsLoading,
  } = useProductStore()
  const {
    searchResults: clients,
    searchClients,
    loading: clientsLoading,
  } = useClientStore()
  const {
    createSale,
    sales,
    fetchSalesByDateRange,
    loading: saleLoading,
  } = useSaleStore()

  // Tab state
  const [activeTab, setActiveTab] = useState('new-sale')

  // Cart state (temporal - se envía a API al guardar)
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [generalDiscount, setGeneralDiscount] = useState(0)

  // Client search state
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Payment and currency state
  const [paymentMethodId, setPaymentMethodId] = useState(1)
  const [currencyId, setCurrencyId] = useState(1)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [currenciesLoading, setCurrenciesLoading] = useState(false)

  // History tab state
  const [historySearch, setHistorySearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalProduct, setSelectedModalProduct] = useState(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalDiscount, setModalDiscount] = useState(0)
  const [modalDiscountType, setModalDiscountType] = useState('amount') // 'amount' | 'percent'
  const [modalDiscountReason, setModalDiscountReason] = useState('')

  // Modal product search state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [modalSearchResults, setModalSearchResults] = useState([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productSearchContainerRef = useRef(null)
  const productDropdownRef = useRef(null)

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 100 })
  }, [fetchProducts])

  // Cargar métodos de pago y monedas al montar
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setPaymentMethodsLoading(true)
        const methods = await PaymentMethodService.getAll()
        setPaymentMethods(methods)
        if (methods.length > 0) {
          setPaymentMethodId(methods[0].id)
        }
      } catch (error) {
        console.error('Error loading payment methods:', error)
      } finally {
        setPaymentMethodsLoading(false)
      }

      try {
        setCurrenciesLoading(true)
        const currencyList = await CurrencyService.getAll()
        setCurrencies(currencyList)
        if (currencyList.length > 0) {
          setCurrencyId(currencyList[0].id)
        }
      } catch (error) {
        console.error('Error loading currencies:', error)
      } finally {
        setCurrenciesLoading(false)
      }
    }
    loadPaymentData()
  }, [])

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clientSearchTerm.trim().length >= 3) {
        // Evitar búsqueda si el término coincide con el cliente seleccionado
        if (selectedClient && clientSearchTerm === selectedClient.name) {
          return
        }

        try {
          await searchClients(clientSearchTerm)
          setShowClientDropdown(true)
        } catch (error) {
          console.error('Error searching clients:', error)
          setShowClientDropdown(false)
        }
      } else {
        setShowClientDropdown(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [clientSearchTerm, searchClients, selectedClient])

  // Buscar productos para el modal
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = (productSearchTerm || '').trim()
      if (term.length >= 3) {
        // Evitar búsqueda si el término coincide con el producto seleccionado
        const currentProduct = getProductDisplay(selectedModalProduct)
        if (selectedModalProduct && term === currentProduct.name) {
          return
        }

        setIsSearchingProducts(true)
        try {
          const results = await productService.searchProducts(term)
          const allResults = Array.isArray(results)
            ? results
            : results
            ? [results]
            : []
          // Filtrar productos activos (state !== false && is_active !== false)
          // Nota: La API puede devolver 'state', 'status' o 'is_active'
          const activeResults = allResults.filter(p => {
            // Si tiene 'status' explícito (booleano), usarlo
            if (typeof p.status === 'boolean') return p.status
            
            // Lógica de Products.jsx: state !== false && is_active !== false
            return p.state !== false && p.is_active !== false
          })
          setModalSearchResults(activeResults)
          setShowProductDropdown(true)
        } catch (error) {
          console.error('Error searching products:', error)
          setModalSearchResults([])
        } finally {
          setIsSearchingProducts(false)
        }
      } else {
        setModalSearchResults([])
        // No cerrar dropdown aquí para permitir ver mensaje de "escribe más caracteres"
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [productSearchTerm, selectedModalProduct])

  // Establecer producto inicial en modal cuando carguen productos
  useEffect(() => {
    if (products.length > 0 && !selectedModalProduct) {
      // No pre-seleccionar automáticamente para obligar a buscar
      // setSelectedModalProduct(products[0])
    }
  }, [products, selectedModalProduct])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        clientSearchContainerRef.current &&
        !clientSearchContainerRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false)
      }
      if (
        productSearchContainerRef.current &&
        !productSearchContainerRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false)
      }
    }

    if (showClientDropdown || showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showClientDropdown, showProductDropdown])

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items]
  )

  const filteredItems = useMemo(
    () =>
      items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  )

  const lineDiscounts = useMemo(
    () => items.reduce((acc, item) => acc + (item.discount || 0), 0),
    [items]
  )

  const taxes = useMemo(() => {
    const taxableBase = Math.max(0, subtotal - lineDiscounts - generalDiscount)
    return taxableBase * 0.16
  }, [subtotal, lineDiscounts, generalDiscount])

  const total = useMemo(
    () => Math.max(0, subtotal - lineDiscounts - generalDiscount + taxes),
    [subtotal, lineDiscounts, generalDiscount, taxes]
  )

  // Cargar ventas por rango de fechas
  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchSalesByDateRange({
        start_date: dateFrom,
        end_date: dateTo,
        page: 1,
        page_size: 50,
      })
    }
  }, [dateFrom, dateTo, fetchSalesByDateRange])

  const filteredHistory = useMemo(
    () =>
      (sales || []).filter(entry => {
        if (!historySearch) return true
        const searchLower = historySearch.toLowerCase()
        return (
          entry.client_name?.toLowerCase().includes(searchLower) ||
          entry.sale_id?.toString().toLowerCase().includes(searchLower)
        )
      }),
    [sales, historySearch]
  )

  const modalProduct = selectedModalProduct
  const modalDisplay = getProductDisplay(modalProduct)

  const modalUnitPrice = modalDisplay.price

  const parsedModalQuantity = useMemo(() => {
    const quantityValue = Number(modalQuantity)
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      return 1
    }
    return quantityValue
  }, [modalQuantity])

  const parsedModalDiscount = useMemo(() => {
    const discountValue = Number(modalDiscount)
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      return 0
    }
    return discountValue
  }, [modalDiscount])

  const modalSubtotal = useMemo(
    () => modalUnitPrice * parsedModalQuantity,
    [modalUnitPrice, parsedModalQuantity]
  )

  const modalDiscountValue = useMemo(() => {
    let totalDiscount = 0
    if (modalDiscountType === 'percent') {
      // Porcentaje sobre el precio unitario, multiplicado por cantidad
      const discountPerUnit = modalUnitPrice * (parsedModalDiscount / 100)
      totalDiscount = discountPerUnit * parsedModalQuantity
    } else {
      // Monto fijo unitario, multiplicado por cantidad
      totalDiscount = parsedModalDiscount * parsedModalQuantity
    }
    return Math.min(totalDiscount, modalSubtotal)
  }, [
    parsedModalDiscount,
    modalSubtotal,
    modalDiscountType,
    modalUnitPrice,
    parsedModalQuantity,
  ])

  const modalLineTotal = useMemo(
    () => Math.max(0, modalSubtotal - modalDiscountValue),
    [modalSubtotal, modalDiscountValue]
  )

  const handleRemoveItem = lineId => {
    setItems(prev => prev.filter(item => item.id !== lineId))
  }

  const handleSelectClient = client => {
    setSelectedClient(client)
    setShowClientDropdown(false)
    setClientSearchTerm(client.name || '')
  }

  const handleOpenModal = () => {
    setSelectedModalProduct(null)
    setProductSearchTerm('')
    setModalQuantity(1)
    setModalDiscount(0)
    setModalDiscountType('amount')
    setModalDiscountReason('')
    setIsModalOpen(true)
    setShowProductDropdown(false)
    setModalSearchResults([])
  }

  const handleConfirmAdd = () => {
    if (!modalProduct) {
      setIsModalOpen(false)
      return
    }

    // Validar razón de descuento si hay descuento
    if (modalDiscountValue > 0 && !modalDiscountReason.trim()) {
      alert('Debes ingresar una razón para el descuento')
      return
    }

    setItems(prev => [
      ...prev,
      {
        id: `${modalDisplay.id}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        productId: modalDisplay.id,
        name: modalDisplay.name,
        quantity: parsedModalQuantity,
        price: modalDisplay.price,
        discount: modalDiscountValue, // Total discount amount for the line
        discountType: modalDiscountType,
        discountInput: parsedModalDiscount, // Unitary value entered
        discountReason: modalDiscountReason,
      },
    ])
    setModalQuantity(1)
    setModalDiscount(0)
    setModalDiscountType('amount')
    setModalDiscountReason('')
    setIsModalOpen(false)
  }

  const resetSaleForm = () => {
    setItems([])
    setGeneralDiscount(0)
    if (clients.length > 0) {
      setSelectedClient(clients[0])
    }
    setPaymentMethodId(1)
    setCurrencyId(1)
  }

  const handleSaveSale = async () => {
    // Validaciones según SALE_API.md
    if (!selectedClient) {
      alert('Por favor selecciona un cliente')
      return
    }

    if (items.length === 0) {
      alert('Por favor agrega al menos un producto al carrito')
      return
    }

    // Construir estructura según SALE_API.md
    const saleData = {
      client_id: selectedClient.id,
      allow_price_modifications: items.some(item => item.discount > 0),
      product_details: items.map(item => {
        const detail = {
          product_id: item.productId,
          quantity: item.quantity,
        }

        // Agregar descuentos si existen
        if (item.discount > 0) {
          if (item.discountType === 'percent') {
            detail.discount_percent = Number(item.discountInput)
          } else {
            // Es monto fijo unitario
            detail.discount_amount = Number(item.discountInput)
          }
          detail.discount_reason =
            item.discountReason || 'Descuento aplicado en venta'
        }

        return detail
      }),
      payment_method_id: paymentMethodId,
      currency_id: currencyId,
    }

    try {
      const response = await createSale(saleData)

      if (response && response.sale_id) {
        alert(`Venta creada exitosamente: ${response.sale_id}`)

        // Limpiar carrito
        setItems([])
        setGeneralDiscount(0)
      } else {
        alert('Error: No se recibió ID de venta')
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert(
        `Error al guardar la venta: ${error.message || 'Error desconocido'}`
      )
    }
  }

  const handleSelectProduct = product => {
    const display = getProductDisplay(product)
    setSelectedModalProduct(product)
    setProductSearchTerm(display.name)
    setShowProductDropdown(false)
  }

  return (
    <div className='sales-new'>
      <div className='tabs sales-new__tabs' aria-label='Gestión de ventas'>
        <div className='tabs__list' role='tablist'>
          <button
            type='button'
            className={`tabs__tab ${
              activeTab === 'new-sale' ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveTab('new-sale')}
            id='sales-new-tab'
            role='tab'
            aria-selected={activeTab === 'new-sale'}
            aria-controls='sales-new-panel'
          >
            Nueva Venta
          </button>
          <button
            type='button'
            className={`tabs__tab ${
              activeTab === 'history' ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveTab('history')}
            id='sales-history-tab'
            role='tab'
            aria-selected={activeTab === 'history'}
            aria-controls='sales-history-panel'
          >
            Historial de Ventas
          </button>
        </div>
      </div>

      {activeTab === 'new-sale' && (
        <section
          id='sales-new-panel'
          role='tabpanel'
          aria-label='Gestión de nueva venta'
          aria-labelledby='sales-new-tab'
          className='sales-new__section'
        >
          <div className='sales-new__grid'>
            <div className='sales-new__main'>
              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <ShoppingCart size={18} />
                    </span>
                    <span className='card__title-text'>
                      Productos Seleccionados
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <div className='sales-new__search-row'>
                    <div className='search-box'>
                      <Search className='search-box__icon' aria-hidden='true' />
                      <input
                        type='search'
                        className='input search-box__input'
                        placeholder='Buscar productos para agregar...'
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                      />
                    </div>
                    <button
                      type='button'
                      className='btn btn--primary'
                      onClick={handleOpenModal}
                    >
                      <Plus size={16} aria-hidden='true' />
                      Agregar Producto
                    </button>
                  </div>

                  <div className='table-container'>
                    <table
                      className='table'
                      aria-label='Productos seleccionados'
                    >
                      <thead>
                        <tr>
                          <th scope='col'>Producto</th>
                          <th scope='col' className='text-right'>
                            Cantidad
                          </th>
                          <th scope='col' className='text-right'>
                            Precio Unitario
                          </th>
                          <th scope='col' className='text-right'>
                            Descuento
                          </th>
                          <th scope='col' className='text-right'>
                            Total
                          </th>
                          <th scope='col' aria-label='Acciones' />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className='text-center text-muted'>
                              No se encontraron productos que coincidan con la
                              búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map(item => {
                            const lineTotal =
                              item.price * item.quantity - (item.discount || 0)
                            return (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td className='text-right'>{item.quantity}</td>
                                <td className='text-right'>
                                  {formatCurrency(item.price, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(item.discount || 0, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(lineTotal, 'PYG')}
                                </td>
                                <td className='text-right'>
                                  <button
                                    type='button'
                                    className='btn btn--destructive btn--icon-only btn--small'
                                    onClick={() => handleRemoveItem(item.id)}
                                    aria-label={`Eliminar ${item.name}`}
                                  >
                                    <Trash2 size={16} aria-hidden='true' />
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <DollarSign size={18} />
                    </span>
                    <span className='card__title-text'>
                      Resumen de la Venta
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <div className='sales-new__summary'>
                    <div className='sales-new__summary-column'>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Subtotal</span>
                        <span>{formatCurrency(subtotal, 'PYG')}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Impuestos (IVA 16%)</span>
                        <span>{formatCurrency(taxes, 'PYG')}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Descuentos</span>
                        <span>
                          {formatCurrency(
                            lineDiscounts + generalDiscount,
                            'PYG'
                          )}
                        </span>
                      </div>
                      <hr className='card__divider' />
                      <div className='sales-new__summary-row sales-new__summary-total'>
                        <span>Total</span>
                        <span>{formatCurrency(total, 'PYG')}</span>
                      </div>
                    </div>
                    <div className='sales-new__summary-actions'>
                      <button
                        type='button'
                        className='btn btn--ghost'
                        onClick={() => setGeneralDiscount(value => value + 10)}
                      >
                        Aplicar Descuento General
                      </button>
                      <div className='sales-new__summary-buttons'>
                        <button
                          type='button'
                          className='btn btn--secondary'
                          onClick={resetSaleForm}
                        >
                          Cancelar
                        </button>
                        <button
                          type='button'
                          className='btn btn--primary'
                          onClick={handleSaveSale}
                          disabled={saleLoading || items.length === 0}
                        >
                          {saleLoading ? 'Guardando...' : 'Guardar Venta'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <aside
              className='sales-new__sidebar'
              aria-label='Detalles de la venta'
            >
              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <User size={18} />
                    </span>
                    <span className='card__title-text'>
                      Información del Cliente
                    </span>
                  </h3>
                </div>
                <div className='card__content'>
                  <label className='form-field__label' htmlFor='client-search'>
                    Buscar Cliente
                  </label>
                  <div
                    style={{ position: 'relative' }}
                    ref={clientSearchContainerRef}
                  >
                    <div className='search-box'>
                      <Search className='search-box__icon' aria-hidden='true' />
                      <input
                        id='client-search'
                        type='search'
                        className='input search-box__input'
                        placeholder='Escribe al menos 3 caracteres...'
                        value={clientSearchTerm}
                        onChange={event => {
                          setClientSearchTerm(event.target.value)
                          if (
                            selectedClient &&
                            event.target.value !== selectedClient.name
                          ) {
                            setSelectedClient(null)
                          }
                        }}
                        onFocus={() => {
                          if (
                            clientSearchTerm.length >= 3 &&
                            clients.length > 0
                          ) {
                            setShowClientDropdown(true)
                          }
                        }}
                        disabled={clientsLoading}
                      />
                    </div>

                    {showClientDropdown && clients.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: '6px',
                          boxShadow:
                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          zIndex: 1000,
                        }}
                      >
                        {clients.map((client, index) => (
                          <button
                            key={`${client.id}-${index}`}
                            type='button'
                            onClick={() => handleSelectClient(client)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                              borderBottom:
                                '1px solid var(--color-border-subtle)',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor =
                                'var(--color-bg-secondary)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor =
                                'transparent'
                            }}
                          >
                            <div
                              style={{ fontWeight: '500', marginBottom: '2px' }}
                            >
                              {client.name}
                            </div>
                            {client.document_id && (
                              <div
                                style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                Doc: {formatDocumentId(client.document_id)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {clientSearchTerm.length > 0 &&
                      clientSearchTerm.length < 3 && (
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          Escribe al menos 3 caracteres para buscar
                        </p>
                      )}

                    {clientsLoading && clientSearchTerm.length >= 3 && (
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        Buscando...
                      </p>
                    )}

                    {!clientsLoading &&
                      clientSearchTerm.length >= 3 &&
                      clients.length === 0 && (
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          No se encontraron clientes
                        </p>
                      )}
                  </div>

                  {selectedClient && (
                    <div className='client-info' aria-live='polite'>
                      <p>
                        <strong>Nombre:</strong> {selectedClient.name}
                      </p>
                      {selectedClient.document_id && (
                        <p>
                          <strong>Documento:</strong>{' '}
                          {formatDocumentId(selectedClient.document_id)}
                        </p>
                      )}
                      {selectedClient.contact?.email && (
                        <p>
                          <strong>Email:</strong> {selectedClient.contact.email}
                        </p>
                      )}
                      {selectedClient.contact?.phone && (
                        <p>
                          <strong>Teléfono:</strong>{' '}
                          {selectedClient.contact.phone}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type='button'
                    className='btn btn--ghost btn--block'
                    onClick={() => navigate('/clientes')}
                  >
                    Crear nuevo cliente
                  </button>
                </div>
              </article>

              <article className='card card--elevated'>
                <div className='card__header'>
                  <h3 className='card__title'>
                    <span className='card__title-icon'>
                      <CreditCard size={18} />
                    </span>
                    <span className='card__title-text'>Opciones de Pago</span>
                  </h3>
                </div>
                <div className='card__content'>
                  <label className='form-field__label' htmlFor='payment-method'>
                    Método de Pago
                  </label>
                  <select
                    id='payment-method'
                    className='input'
                    value={paymentMethodId}
                    onChange={event =>
                      setPaymentMethodId(Number(event.target.value))
                    }
                    disabled={paymentMethodsLoading}
                  >
                    {paymentMethodsLoading ? (
                      <option value=''>Cargando métodos de pago...</option>
                    ) : paymentMethods.length === 0 ? (
                      <option value=''>No hay métodos disponibles</option>
                    ) : (
                      paymentMethods.map((method, index) => (
                        <option key={`${method.id}-${index}`} value={method.id}>
                          {method.method_code} - {method.description}
                        </option>
                      ))
                    )}
                  </select>

                  <label
                    className='form-field__label'
                    htmlFor='currency'
                    style={{ marginTop: '12px' }}
                  >
                    Moneda
                  </label>
                  <select
                    id='currency'
                    className='input'
                    value={currencyId}
                    onChange={event =>
                      setCurrencyId(Number(event.target.value))
                    }
                    disabled={currenciesLoading}
                  >
                    {currenciesLoading ? (
                      <option value=''>Cargando monedas...</option>
                    ) : currencies.length === 0 ? (
                      <option value=''>No hay monedas disponibles</option>
                    ) : (
                      currencies.map((currency, index) => (
                        <option
                          key={`${currency.id}-${index}`}
                          value={currency.id}
                        >
                          {currency.currency_code} -{' '}
                          {currency.currency_name || currency.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </article>
            </aside>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section
          id='sales-history-panel'
          role='tabpanel'
          aria-label='Historial de ventas'
          aria-labelledby='sales-history-tab'
          className='sales-history'
        >
          <article className='card card--elevated'>
            <div className='card__content'>
              <div className='sales-history__filters'>
                <div className='search-box'>
                  <Search className='search-box__icon' aria-hidden='true' />
                  <input
                    type='search'
                    className='input search-box__input'
                    placeholder='Buscar por cliente o ID...'
                    value={historySearch}
                    onChange={event => setHistorySearch(event.target.value)}
                  />
                </div>
                <input
                  type='date'
                  className='input'
                  value={dateFrom}
                  onChange={event => setDateFrom(event.target.value)}
                  aria-label='Fecha desde'
                />
                <input
                  type='date'
                  className='input'
                  value={dateTo}
                  onChange={event => setDateTo(event.target.value)}
                  aria-label='Fecha hasta'
                />
                <button type='button' className='btn btn--primary'>
                  <Filter size={16} aria-hidden='true' />
                  Filtrar
                </button>
              </div>

              <div className='table-container'>
                <table className='table' aria-label='Historial de ventas'>
                  <thead>
                    <tr>
                      <th scope='col'>ID Venta</th>
                      <th scope='col'>Fecha</th>
                      <th scope='col'>Cliente</th>
                      <th scope='col' className='text-right'>
                        Total
                      </th>
                      <th scope='col' className='text-center'>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleLoading ? (
                      <tr>
                        <td colSpan={5} className='text-center text-muted'>
                          Cargando ventas...
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className='text-center text-muted'>
                          {dateFrom && dateTo
                            ? 'No se encontraron ventas en el rango de fechas seleccionado'
                            : 'Selecciona un rango de fechas para ver el historial de ventas'}
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((entry, index) => {
                        const status =
                          STATUS_STYLES[entry.status] || STATUS_STYLES.pending
                        return (
                          <tr key={`${entry.sale_id || entry.id}-${index}`}>
                            <td className='font-medium'>
                              #{entry.sale_id || entry.id}
                            </td>
                            <td>
                              {entry.order_date
                                ? new Date(entry.order_date).toLocaleDateString(
                                    'es-ES'
                                  )
                                : '—'}
                            </td>
                            <td>{entry.client_name || '—'}</td>
                            <td className='text-right'>
                              {formatCurrency(
                                entry.total_amount || entry.total || 0,
                                'PYG'
                              )}
                            </td>
                            <td className='text-center'>
                              <span
                                className={`badge badge--pill badge--small ${status.badge}`}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>
      )}

      {isModalOpen && (
        <div
          className='sales-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='sales-modal-title'
        >
          <div
            className='sales-modal__overlay'
            onClick={() => setIsModalOpen(false)}
            aria-hidden='true'
          />
          <div className='sales-modal__dialog'>
            <header className='sales-modal__header'>
              <div className='sales-modal__header-content'>
                <h3 id='sales-modal-title' className='sales-modal__title'>
                  Agregar producto a la venta
                </h3>
                <p className='sales-modal__subtitle'>
                  Seleccione un artículo del catálogo, ajuste la cantidad y
                  configure un descuento antes de añadirlo a la orden.
                </p>
              </div>
              <button
                type='button'
                className='sales-modal__close'
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} aria-hidden='true' />
                <span className='sr-only'>Cerrar</span>
              </button>
            </header>
            <div className='sales-modal__body'>
              <section className='sales-modal__section sales-modal__section--context'>
                <div className='sales-modal__info-grid'>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>
                      Producto seleccionado
                    </span>
                    <span className='sales-modal__value'>
                      {modalDisplay.name || 'Selecciona un producto'}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>ID</span>
                    <span className='sales-modal__value'>
                      {modalDisplay.id || '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className='sales-modal__section'>
                <div className='sales-modal__form-grid'>
                  <label className='sales-modal__field' htmlFor='modal-product'>
                    <span className='sales-modal__field-label'>Producto</span>
                    <div
                      style={{ position: 'relative' }}
                      ref={productSearchContainerRef}
                    >
                      <input
                        id='modal-product'
                        type='text'
                        className='input'
                        value={productSearchTerm}
                        onChange={event => {
                          setProductSearchTerm(event.target.value)
                          setShowProductDropdown(true)
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setShowProductDropdown(true)
                            setTimeout(() => {
                              const firstBtn =
                                productDropdownRef.current?.querySelector(
                                  'button'
                                )
                              if (firstBtn) firstBtn.focus()
                            }, 0)
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (
                              showProductDropdown &&
                              modalSearchResults.length > 0
                            ) {
                              handleSelectProduct(modalSearchResults[0])
                            }
                          }
                        }}
                        placeholder='Buscar por nombre, ID o código de barras...'
                        disabled={false}
                        autoComplete='off'
                      />
                      {showProductDropdown && (
                        <div
                          ref={productDropdownRef}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: 'white',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: '6px',
                            boxShadow:
                              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            maxHeight: '240px',
                            overflowY: 'auto',
                            zIndex: 1000,
                          }}
                        >
                          {isSearchingProducts ? (
                            <div style={{ padding: '12px 16px' }}>
                              Buscando...
                            </div>
                          ) : modalSearchResults.length === 0 ? (
                            <div style={{ padding: '12px 16px' }}>
                              {productSearchTerm.length < 3
                                ? 'Escribe al menos 3 caracteres'
                                : 'No se encontraron productos'}
                            </div>
                          ) : (
                            modalSearchResults.map((product, index) => {
                              const display = getProductDisplay(product)
                              return (
                                <button
                                  key={`${display.id}-${index}`}
                                  type='button'
                                  className='product-dropdown-item'
                                  onClick={() => handleSelectProduct(product)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleSelectProduct(product)
                                    }
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault()
                                      const next =
                                        e.currentTarget.nextElementSibling
                                      if (next) next.focus()
                                    }
                                    if (e.key === 'ArrowUp') {
                                      e.preventDefault()
                                      const prev =
                                        e.currentTarget.previousElementSibling
                                      if (prev) prev.focus()
                                      else {
                                        const input =
                                          productSearchContainerRef.current?.querySelector(
                                            'input'
                                          )
                                        if (input) input.focus()
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setShowProductDropdown(false)
                                      const input =
                                        productSearchContainerRef.current?.querySelector(
                                          'input'
                                        )
                                      if (input) input.focus()
                                    }
                                  }}
                                >
                                  <div className='product-dropdown-item__info'>
                                    <div className='product-dropdown-item__name'>
                                      {display.name}
                                    </div>
                                    <div className='product-dropdown-item__meta'>
                                      ID: {display.id}
                                    </div>
                                  </div>
                                  <div className='product-dropdown-item__price-block'>
                                    <div className='product-dropdown-item__price'>
                                      {formatCurrency(display.price, 'PYG')}
                                    </div>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                    <span className='sales-modal__field-note'>
                      Precio unitario actual:{' '}
                      {formatCurrency(modalUnitPrice, 'PYG')}
                    </span>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-quantity'
                  >
                    <span className='sales-modal__field-label'>Cantidad</span>
                    <input
                      id='modal-quantity'
                      type='number'
                      min='1'
                      step='1'
                      className='input'
                      value={modalQuantity}
                      onChange={event => setModalQuantity(event.target.value)}
                    />
                    <span className='sales-modal__field-note'>
                      Máximo disponible: sin límite definido
                    </span>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-discount-type'
                  >
                    <span className='sales-modal__field-label'>
                      Tipo de Descuento
                    </span>
                    <select
                      id='modal-discount-type'
                      className='input'
                      value={modalDiscountType}
                      onChange={e => setModalDiscountType(e.target.value)}
                    >
                      <option value='amount'>Monto Fijo (Unitario)</option>
                      <option value='percent'>Porcentaje (%)</option>
                    </select>
                  </label>

                  <label
                    className='sales-modal__field'
                    htmlFor='modal-discount'
                  >
                    <span className='sales-modal__field-label'>
                      Valor del Descuento
                    </span>
                    <div className='sales-modal__input-wrapper'>
                      <input
                        id='modal-discount'
                        type='number'
                        min='0'
                        step={modalDiscountType === 'percent' ? '1' : '0.01'}
                        className='input sales-modal__input'
                        value={modalDiscount}
                        onChange={event => setModalDiscount(event.target.value)}
                        placeholder={
                          modalDiscountType === 'percent' ? '0' : '0.00'
                        }
                      />
                      <span className='sales-modal__input-affix'>
                        {modalDiscountType === 'percent' ? '%' : 'PYG'}
                      </span>
                    </div>
                    <span className='sales-modal__field-note'>
                      {modalDiscountType === 'percent'
                        ? 'Porcentaje sobre precio unitario'
                        : 'Monto a descontar por unidad'}
                    </span>
                  </label>

                  {modalDiscountValue > 0 && (
                    <label
                      className='sales-modal__field'
                      htmlFor='modal-discount-reason'
                      style={{ gridColumn: '1 / -1' }}
                    >
                      <span className='sales-modal__field-label'>
                        Razón del Descuento (Requerido)
                      </span>
                      <input
                        id='modal-discount-reason'
                        type='text'
                        className='input'
                        value={modalDiscountReason}
                        onChange={e => setModalDiscountReason(e.target.value)}
                        placeholder='Ej: Promoción de verano, Cliente frecuente...'
                        required
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className='sales-modal__section'>
                <div className='sales-modal__totals'>
                  <div className='sales-modal__totals-grid'>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Precio unitario
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalUnitPrice, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Subtotal sin descuento
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalSubtotal, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Descuento aplicado
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalDiscountValue, 'PYG')}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>Total de línea</span>
                      <span className='sales-modal__value sales-modal__value--highlight'>
                        {formatCurrency(modalLineTotal, 'PYG')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <footer className='sales-modal__footer'>
              <button
                type='button'
                className='btn btn--secondary'
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='btn btn--primary'
                onClick={handleConfirmAdd}
              >
                Confirmar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesNew
