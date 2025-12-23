import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Package, Send, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useInventoryStore from '@/store/useInventoryStore'
import { productService } from '@/services/productService'
import { REASON_OPTIONS, DEFAULT_REASONS } from '@/constants/inventoryDefaults'

const InventoryAdjustmentManualPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()

  // Store hooks
  const {
    createManualAdjustment,
    getManualAdjustmentHistory,
    loadingCreate,
    error: storeError,
    clearError
  } = useInventoryStore()

  // Estado local para productos (independiente de la página Products)
  const [localProducts, setLocalProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Estados locales
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [adjustmentHistory, setAdjustmentHistory] = useState([])
  const [historyFilter, setHistoryFilter] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Formulario de ajuste
  const [formData, setFormData] = useState({
    quantityAdjustment: '',
    reasonCategory: 'PHYSICAL_COUNT',
    details: '',
    approvalLevel: 'operator',
    operator: '',
    location: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Búsqueda de productos con debounce
  useEffect(() => {
    const searchProducts = async () => {
      if (!productSearchTerm || productSearchTerm.trim().length < 2) {
        setLocalProducts([])
        return
      }

      setLoadingProducts(true)
      try {
        const results = await productService.searchProducts(productSearchTerm.trim())
        const productsArray = Array.isArray(results) ? results : [results]
        // Filtrar solo productos activos (un producto está activo si ninguno de estos campos es false)
        const activeProducts = productsArray.filter(product =>
          product.state !== false && product.is_active !== false
        )
        setLocalProducts(activeProducts)
      } catch (error) {
        console.error('Error searching products:', error)
        setLocalProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [productSearchTerm])

  // Cargar historial cuando se selecciona un producto
  useEffect(() => {
    if (selectedProduct) {
      loadHistory(selectedProduct.product_id)
    }
  }, [selectedProduct])

  // Atajo de teclado Ctrl+A para abrir modal de búsqueda
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setShowProductSearch(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadHistory = async (productId) => {
    if (!productId) {
      console.warn('loadHistory called without productId')
      return
    }

    setLoadingHistory(true)
    try {
      console.log('Loading history for product:', productId)
      const storeResponse = await getManualAdjustmentHistory(productId, 50, 0)
      console.log('Store response:', storeResponse)

      // El store devuelve { success: true, data: result }
      // El servicio devuelve { count, history, limit, offset, product_id }
      if (storeResponse.success && storeResponse.data) {
        const apiData = storeResponse.data
        console.log('API data:', apiData)

        if (apiData.history && Array.isArray(apiData.history)) {
          console.log('Setting history from apiData.history:', apiData.history.length, 'items')
          setAdjustmentHistory(apiData.history)
        } else if (Array.isArray(apiData)) {
          console.log('Setting history from array apiData:', apiData.length, 'items')
          setAdjustmentHistory(apiData)
        } else {
          console.log('No valid history data in apiData, setting empty array')
          setAdjustmentHistory([])
        }
      } else {
        console.log('Store response not successful or no data, setting empty array')
        setAdjustmentHistory([])
      }
    } catch (error) {
      console.error('Error loading history:', error)
      setAdjustmentHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setShowProductSearch(false)
    setProductSearchTerm('')
    setSuccessMessage('')
    setFormErrors({})
    // Reset form but keep operator and location if already filled
    setFormData(prev => ({
      quantityAdjustment: '',
      reasonCategory: 'PHYSICAL_COUNT',
      details: '',
      approvalLevel: 'operator',
      operator: prev.operator,
      location: prev.location
    }))
  }

  const validateForm = () => {
    const errors = {}

    if (!selectedProduct) {
      errors.product = 'Debe seleccionar un producto'
    }

    if (!formData.quantityAdjustment || formData.quantityAdjustment === '0') {
      errors.quantityAdjustment = 'La cantidad no puede ser cero'
    }

    if (!formData.operator || formData.operator.trim() === '') {
      errors.operator = 'El operador es obligatorio'
    }

    if (!formData.location || formData.location.trim() === '') {
      errors.location = 'La ubicación es obligatoria'
    }

    if (!formData.details || formData.details.trim().length < 10) {
      errors.details = 'Los detalles deben tener al menos 10 caracteres'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar formulario
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    clearError()

    // Calcular nueva cantidad
    const currentQuantity = selectedProduct.stock_quantity || 0
    const adjustment = parseFloat(formData.quantityAdjustment)
    const newQuantity = currentQuantity + adjustment

    if (newQuantity < 0) {
      setFormErrors({ quantityAdjustment: 'La cantidad resultante no puede ser negativa' })
      return
    }

    // Construir metadata con valores del formulario
    const metadata = {
      source: 'manual_adjustment',
      timestamp: new Date().toISOString(),
      reason_category: formData.reasonCategory,
      approval_level: formData.approvalLevel,
      notes: formData.details,
      operator: formData.operator,
      location: formData.location
    }

    // Crear ajuste
    const adjustmentData = {
      product_id: selectedProduct.product_id,
      new_quantity: newQuantity,
      reason: DEFAULT_REASONS.MANUAL_ADJUSTMENT[formData.reasonCategory],
      metadata: metadata
    }

    const result = await createManualAdjustment(adjustmentData)

    if (result.success) {
      setSuccessMessage('Ajuste creado exitosamente')
      // Recargar historial
      await loadHistory(selectedProduct.product_id)
      // Limpiar formulario pero mantener operador y ubicación
      setFormData(prev => ({
        quantityAdjustment: '',
        reasonCategory: 'PHYSICAL_COUNT',
        details: '',
        approvalLevel: 'operator',
        operator: prev.operator,
        location: prev.location
      }))
      // Actualizar stock del producto seleccionado
      setSelectedProduct(prev => ({
        ...prev,
        stock_quantity: newQuantity
      }))
    } else {
      setFormErrors({ submit: result.error || 'Error al crear ajuste' })
    }
  }

  const handleClear = () => {
    setFormData({
      quantityAdjustment: '',
      reasonCategory: 'PHYSICAL_COUNT',
      details: '',
      approvalLevel: 'operator',
      operator: '',
      location: ''
    })
    setFormErrors({})
    setSuccessMessage('')
  }

  // Los productos ya vienen filtrados del servicio de búsqueda
  const filteredProducts = localProducts

  // Filtrar historial
  const filteredHistory = adjustmentHistory.filter(item =>
    !historyFilter ||
    item.reason?.toLowerCase().includes(historyFilter.toLowerCase()) ||
    item.user_id?.toLowerCase().includes(historyFilter.toLowerCase())
  )

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className='inventory-adjustment-manual-page'>
      {/* Header */}
      <div className='inventory-adjustment-manual-page__header'>
        <button
          className='btn btn--icon btn--secondary'
          onClick={() => navigate('/ajustes-inventario')}
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className='inventory-adjustment-manual-page__title'>
          Ajuste Manual de Stock
        </h1>
        <button
          className='btn btn--primary'
          onClick={() => setShowProductSearch(true)}
        >
          <Search size={18} strokeWidth={2} />
          <span>Buscar Producto</span>
        </button>
      </div>

      <div className='inventory-adjustment-manual-page__content'>
        {/* Sección izquierda */}
        <div className='inventory-adjustment-manual-page__left'>
          {/* Producto seleccionado */}
          <div className='selected-product-card'>
            <h2 className='selected-product-card__header'>Producto Seleccionado</h2>
            {selectedProduct ? (
              <div className='selected-product-card__content'>
                <div className='selected-product-card__image'>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.product_name} />
                  ) : (
                    <div className='selected-product-card__image-placeholder'>
                      <Package size={24} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className='selected-product-card__info'>
                  <p className='selected-product-card__sku'>
                    {selectedProduct.product_id}
                  </p>
                  <h3 className='selected-product-card__name'>
                    {selectedProduct.product_name}
                  </h3>
                  <p className='selected-product-card__stock'>
                    Stock Actual: <strong>{selectedProduct.stock_quantity || 0}</strong> Unidades
                  </p>
                </div>
              </div>
            ) : (
              <p className='selected-product-card__empty'>
                No hay producto seleccionado. Haz clic en "Buscar Producto" para seleccionar uno.
              </p>
            )}
          </div>

          {/* Formulario de ajuste */}
          <div className='adjustment-form-card'>
            <h2 className='adjustment-form-card__header'>Nuevo Ajuste</h2>
            <form onSubmit={handleSubmit} className='adjustment-form'>
              {/* Cantidad a ajustar */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Cantidad a Ajustar
                </label>
                <input
                  type='number'
                  className={`form-field__input ${formErrors.quantityAdjustment ? 'form-field__input--error' : ''}`}
                  placeholder='Ej: -10 o 25'
                  value={formData.quantityAdjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantityAdjustment: e.target.value }))}
                  disabled={!selectedProduct}
                  step='0.01'
                />
                {formErrors.quantityAdjustment && (
                  <p className='form-field__error'>{formErrors.quantityAdjustment}</p>
                )}
              </div>

              {/* Categoría del motivo */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Categoría del Motivo
                </label>
                <select
                  className='form-field__select'
                  value={formData.reasonCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, reasonCategory: e.target.value }))}
                  disabled={!selectedProduct}
                >
                  {REASON_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operador */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Operador
                </label>
                <input
                  type='text'
                  className={`form-field__input ${formErrors.operator ? 'form-field__input--error' : ''}`}
                  placeholder='Nombre del operador'
                  value={formData.operator}
                  onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                  disabled={!selectedProduct}
                />
                {formErrors.operator && (
                  <p className='form-field__error'>{formErrors.operator}</p>
                )}
              </div>

              {/* Ubicación */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Ubicación
                </label>
                <input
                  type='text'
                  className={`form-field__input ${formErrors.location ? 'form-field__input--error' : ''}`}
                  placeholder='Ubicación del conteo'
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!selectedProduct}
                />
                {formErrors.location && (
                  <p className='form-field__error'>{formErrors.location}</p>
                )}
              </div>

              {/* Detalles / Justificación */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Detalles / Justificación
                </label>
                <textarea
                  className={`form-field__textarea ${formErrors.details ? 'form-field__textarea--error' : ''}`}
                  placeholder='Añadir un comentario detallado...'
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  disabled={!selectedProduct}
                />
                {formErrors.details && (
                  <p className='form-field__error'>{formErrors.details}</p>
                )}
              </div>

              {/* Nivel de aprobación */}
              <div className='form-field'>
                <label className='form-field__label'>
                  Nivel de Aprobación
                </label>
                <select
                  className='form-field__select'
                  value={formData.approvalLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalLevel: e.target.value }))}
                  disabled={!selectedProduct}
                >
                  <option value='operator'>Nivel 1 - Operador</option>
                  <option value='supervisor'>Nivel 2 - Supervisor</option>
                  <option value='manager'>Nivel 3 - Manager</option>
                  <option value='admin'>Nivel 4 - Admin</option>
                </select>
              </div>

              {/* Información adicional */}
              <div className='adjustment-form__metadata'>
                <p><strong>Fuente:</strong> Manual</p>
                <p><strong>Fecha/Hora:</strong> {new Date().toLocaleString('es-ES')}</p>
                <p><strong>Operador:</strong> {formData.operator || 'No especificado'}</p>
              </div>

              {/* Mensajes */}
              {successMessage && (
                <div className='adjustment-form__success'>
                  {successMessage}
                </div>
              )}
              {(formErrors.submit || storeError) && (
                <div className='adjustment-form__error'>
                  {formErrors.submit || storeError}
                </div>
              )}

              {/* Botones */}
              <div className='adjustment-form__buttons'>
                <button
                  type='submit'
                  className='btn btn--primary'
                  disabled={!selectedProduct || loadingCreate}
                >
                  <Send size={18} strokeWidth={2} />
                  <span>{loadingCreate ? 'Enviando...' : 'Enviar Ajuste'}</span>
                </button>
                <button
                  type='button'
                  className='btn btn--secondary'
                  onClick={handleClear}
                  disabled={!selectedProduct}
                >
                  <RefreshCw size={18} strokeWidth={2} />
                  <span>Limpiar</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sección derecha - Historial */}
        <div className='inventory-adjustment-manual-page__right'>
          <div className='history-card'>
            <h2 className='history-card__header'>Historial de Ajustes</h2>

            {/* Filtro de búsqueda */}
            <div className='history-card__search'>
              <Search className='history-card__search-icon' size={18} />
              <input
                type='text'
                className='history-card__search-input'
                placeholder='Filtrar por operador, motivo...'
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              />
            </div>

            {/* Tabla de historial */}
            {selectedProduct ? (
              loadingHistory ? (
                <p className='history-card__loading'>Cargando historial...</p>
              ) : filteredHistory.length > 0 ? (
                <div className='history-table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Operador</th>
                        <th>Cambio</th>
                        <th>Motivo</th>
                        <th>Aprobación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item, index) => (
                        <tr key={item.adjustment_id || index}>
                          <td>{formatDate(item.adjustment_date)}</td>
                          <td>
                            <span className={`history-table__type history-table__type--${item.adjustment_type}`}>
                              {item.adjustment_type === 'stock' ? 'Stock' : 'Precio'}
                            </span>
                          </td>
                          <td>{item.metadata?.operator || item.user_id || 'N/A'}</td>
                          <td className={item.value_change > 0 ? 'history-table__positive' : 'history-table__negative'}>
                            {item.value_change > 0 ? '+' : ''}{item.value_change}
                            {item.adjustment_type === 'price' && ' $'}
                          </td>
                          <td className='history-table__reason'>{item.reason}</td>
                          <td>
                            <span className='history-table__badge'>
                              {item.metadata?.approval_level || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='history-card__empty'>
                  {historyFilter ? 'No se encontraron resultados' : 'No hay ajustes registrados para este producto'}
                </p>
              )
            ) : (
              <p className='history-card__empty'>
                Selecciona un producto para ver su historial
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de búsqueda de producto */}
      {showProductSearch && (
        <div className='product-search-modal'>
          <div className='product-search-modal__overlay' onClick={() => setShowProductSearch(false)} />
          <div className='product-search-modal__content'>
            <div className='product-search-modal__header'>
              <h2>Buscar Producto</h2>
              <button
                className='btn btn--icon btn--secondary'
                onClick={() => setShowProductSearch(false)}
              >
                ×
              </button>
            </div>

            <div className='product-search-modal__search'>
              <Search className='product-search-modal__search-icon' size={20} />
              <input
                type='text'
                className='product-search-modal__search-input'
                placeholder='Buscar por nombre, SKU o ID...'
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className='product-search-modal__results'>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.product_id}
                    className='product-search-item'
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className='product-search-item__image'>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.product_name} />
                      ) : (
                        <Package size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className='product-search-item__info'>
                      <p className='product-search-item__sku'>{product.product_id}</p>
                      <h4 className='product-search-item__name'>{product.product_name}</h4>
                      <p className='product-search-item__stock'>Stock: {product.stock_quantity || 0}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className='product-search-modal__empty'>
                  No se encontraron productos
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryAdjustmentManualPage
