import React, { useMemo, useState } from 'react'
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

const PRODUCT_CATALOG = [
  { id: 'product-a', sku: 'SKU-001', name: 'Producto A', price: 120 },
  { id: 'product-b', sku: 'SKU-002', name: 'Producto B', price: 85 },
  { id: 'product-c', sku: 'SKU-003', name: 'Producto C', price: 75 },
  { id: 'product-d', sku: 'SKU-004', name: 'Producto D', price: 140 },
]

const INITIAL_ITEMS = [
  {
    id: 'line-1',
    productId: 'product-a',
    name: 'Producto A',
    quantity: 2,
    price: 100,
    discount: 0,
  },
  {
    id: 'line-2',
    productId: 'product-b',
    name: 'Producto B',
    quantity: 1,
    price: 50,
    discount: 0,
  },
  {
    id: 'line-3',
    productId: 'product-c',
    name: 'Producto C',
    quantity: 3,
    price: 75,
    discount: 0,
  },
]

const CLIENTS = [
  {
    id: 'client-a',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+1 234 567 890',
  },
  {
    id: 'client-b',
    name: 'Ana Gómez',
    email: 'ana.gomez@email.com',
    phone: '+1 987 654 321',
  },
  {
    id: 'client-c',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    phone: '+1 555 123 456',
  },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta de Crédito/Débito' },
  { value: 'transfer', label: 'Transferencia Bancaria' },
  { value: 'other', label: 'Otro' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar Estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'PYG', label: 'PYG - Guaraní Paraguayo' },
]

const SALE_HISTORY = [
  {
    id: '12345',
    date: '2023-10-26',
    client: 'Cliente C',
    total: 350,
    salesperson: 'Vendedor 1',
    status: 'completed',
  },
  {
    id: '12344',
    date: '2023-10-25',
    client: 'Cliente D',
    total: 120.5,
    salesperson: 'Vendedor 2',
    status: 'completed',
  },
  {
    id: '12343',
    date: '2023-10-24',
    client: 'Cliente E',
    total: 800,
    salesperson: 'Vendedor 1',
    status: 'cancelled',
  },
]

const STATUS_STYLES = {
  completed: { label: 'Completada', badge: 'badge--subtle-success' },
  cancelled: { label: 'Cancelada', badge: 'badge--subtle-error' },
  pending: { label: 'Pendiente', badge: 'badge--subtle-warning' },
}

const formatCurrency = (value, currencyCode) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const SalesNew = () => {
  const [activeTab, setActiveTab] = useState('new-sale')
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [searchTerm, setSearchTerm] = useState('')
  const [generalDiscount, setGeneralDiscount] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState(CLIENTS[0].id)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[1].value)
  const [currency, setCurrency] = useState(CURRENCIES[0].value)
  const [historySearch, setHistorySearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalProductId, setModalProductId] = useState(PRODUCT_CATALOG[0].id)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalDiscount, setModalDiscount] = useState(0)

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

  const activeClient = useMemo(
    () => CLIENTS.find(client => client.id === selectedClientId),
    [selectedClientId]
  )

  const filteredHistory = useMemo(
    () =>
      SALE_HISTORY.filter(entry => {
        const matchesTerm =
          !historySearch ||
          entry.client.toLowerCase().includes(historySearch.toLowerCase()) ||
          entry.id.toLowerCase().includes(historySearch.toLowerCase())
        const matchesFrom = !dateFrom || entry.date >= dateFrom
        const matchesTo = !dateTo || entry.date <= dateTo
        return matchesTerm && matchesFrom && matchesTo
      }),
    [historySearch, dateFrom, dateTo]
  )

  const modalProduct = useMemo(
    () => PRODUCT_CATALOG.find(item => item.id === modalProductId),
    [modalProductId]
  )

  const modalUnitPrice = modalProduct?.price ?? 0

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

  const modalDiscountValue = useMemo(
    () => Math.min(parsedModalDiscount, modalSubtotal),
    [parsedModalDiscount, modalSubtotal]
  )

  const modalLineTotal = useMemo(
    () => Math.max(0, modalSubtotal - modalDiscountValue),
    [modalSubtotal, modalDiscountValue]
  )

  const handleRemoveItem = lineId => {
    setItems(prev => prev.filter(item => item.id !== lineId))
  }

  const handleOpenModal = () => {
    setModalProductId(PRODUCT_CATALOG[0].id)
    setModalQuantity(1)
    setModalDiscount(0)
    setIsModalOpen(true)
  }

  const handleConfirmAdd = () => {
    if (!modalProduct) {
      setIsModalOpen(false)
      return
    }

    setItems(prev => [
      ...prev,
      {
        id: `${modalProduct.id}-${prev.length + 1}`,
        productId: modalProduct.id,
        name: modalProduct.name,
        quantity: parsedModalQuantity,
        price: modalProduct.price,
        discount: modalDiscountValue,
      },
    ])
    setModalQuantity(1)
    setModalDiscount(0)
    setIsModalOpen(false)
  }

  const resetSaleForm = () => {
    setItems(INITIAL_ITEMS)
    setGeneralDiscount(0)
    setSelectedClientId(CLIENTS[0].id)
    setPaymentMethod(PAYMENT_METHODS[1].value)
    setCurrency(CURRENCIES[0].value)
  }

  const handleSaveSale = () => {
    // Placeholder para flujo de guardado real
    console.info('Venta guardada (mock)', {
      items,
      subtotal,
      lineDiscounts,
      generalDiscount,
      taxes,
      total,
      client: activeClient,
      paymentMethod,
      currency,
    })
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
                                  {formatCurrency(item.price, currency)}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(item.discount || 0, currency)}
                                </td>
                                <td className='text-right'>
                                  {formatCurrency(lineTotal, currency)}
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
                        <span>{formatCurrency(subtotal, currency)}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Impuestos (IVA 16%)</span>
                        <span>{formatCurrency(taxes, currency)}</span>
                      </div>
                      <div className='sales-new__summary-row'>
                        <span className='text-muted'>Descuentos</span>
                        <span>
                          {formatCurrency(
                            lineDiscounts + generalDiscount,
                            currency
                          )}
                        </span>
                      </div>
                      <hr className='card__divider' />
                      <div className='sales-new__summary-row sales-new__summary-total'>
                        <span>Total</span>
                        <span>{formatCurrency(total, currency)}</span>
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
                        >
                          Guardar Venta
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
                  <label className='form-field__label' htmlFor='client-select'>
                    Buscar Cliente
                  </label>
                  <select
                    id='client-select'
                    className='input'
                    value={selectedClientId}
                    onChange={event => setSelectedClientId(event.target.value)}
                  >
                    {CLIENTS.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {activeClient && (
                    <div className='client-info' aria-live='polite'>
                      <p>
                        <strong>Nombre:</strong> {activeClient.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {activeClient.email}
                      </p>
                      <p>
                        <strong>Teléfono:</strong> {activeClient.phone}
                      </p>
                    </div>
                  )}

                  <button type='button' className='btn btn--ghost btn--block'>
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
                    value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value)}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>

                  <label
                    className='form-field__label'
                    htmlFor='currency-select'
                  >
                    Moneda
                  </label>
                  <select
                    id='currency-select'
                    className='input'
                    value={currency}
                    onChange={event => setCurrency(event.target.value)}
                  >
                    {CURRENCIES.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                      <th scope='col'>Vendedor</th>
                      <th scope='col' className='text-center'>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(entry => {
                      const status =
                        STATUS_STYLES[entry.status] || STATUS_STYLES.pending
                      return (
                        <tr key={entry.id}>
                          <td className='font-medium'>#{entry.id}</td>
                          <td>
                            {new Date(entry.date).toLocaleDateString('es-ES')}
                          </td>
                          <td>{entry.client}</td>
                          <td className='text-right'>
                            {formatCurrency(entry.total, currency)}
                          </td>
                          <td>{entry.salesperson}</td>
                          <td className='text-center'>
                            <span
                              className={`badge badge--pill badge--small ${status.badge}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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
                      {modalProduct?.name || 'Selecciona un producto'}
                    </span>
                  </div>
                  <div className='sales-modal__info-item'>
                    <span className='sales-modal__label'>SKU</span>
                    <span className='sales-modal__value'>
                      {modalProduct?.sku || '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className='sales-modal__section'>
                <div className='sales-modal__form-grid'>
                  <label className='sales-modal__field' htmlFor='modal-product'>
                    <span className='sales-modal__field-label'>Producto</span>
                    <select
                      id='modal-product'
                      className='input'
                      value={modalProductId}
                      onChange={event => setModalProductId(event.target.value)}
                    >
                      {PRODUCT_CATALOG.filter(product =>
                        product.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      ).map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} —{' '}
                          {formatCurrency(product.price, currency)}
                        </option>
                      ))}
                    </select>
                    <span className='sales-modal__field-note'>
                      Precio unitario actual:{' '}
                      {formatCurrency(modalUnitPrice, currency)}
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
                    htmlFor='modal-discount'
                  >
                    <span className='sales-modal__field-label'>
                      Descuento por línea
                    </span>
                    <div className='sales-modal__input-wrapper'>
                      <input
                        id='modal-discount'
                        type='number'
                        min='0'
                        step='0.01'
                        className='input sales-modal__input'
                        value={modalDiscount}
                        onChange={event => setModalDiscount(event.target.value)}
                        placeholder='0.00'
                        aria-describedby='modal-discount-help'
                      />
                      <span className='sales-modal__input-affix'>
                        {currency}
                      </span>
                    </div>
                    <span
                      id='modal-discount-help'
                      className='sales-modal__field-note'
                    >
                      No puede exceder {formatCurrency(modalSubtotal, currency)}
                    </span>
                  </label>
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
                        {formatCurrency(modalUnitPrice, currency)}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Subtotal sin descuento
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalSubtotal, currency)}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>
                        Descuento aplicado
                      </span>
                      <span className='sales-modal__value'>
                        {formatCurrency(modalDiscountValue, currency)}
                      </span>
                    </div>
                    <div className='sales-modal__info-item'>
                      <span className='sales-modal__label'>Total de línea</span>
                      <span className='sales-modal__value sales-modal__value--highlight'>
                        {formatCurrency(modalLineTotal, currency)}
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
