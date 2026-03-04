import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Package, Send, RefreshCw, X } from 'lucide-react'
import useInventoryStore from '@/store/useInventoryStore'
import { productService } from '@/services/productService'
import {
  REASON_OPTIONS,
  DEFAULT_REASONS,
  REASON_DETAIL_TEMPLATES,
} from '@/constants/inventoryDefaults'
import { getUnitLabel } from '@/constants/units'

const InventoryAdjustmentManualPage = () => {
  const navigate = useNavigate()

  // Store hooks
  const {
    createManualAdjustment,
    getManualAdjustmentHistory,
    loadingCreate,
    error: storeError,
    clearError,
  } = useInventoryStore()

  // Estado local para productos
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
    details: REASON_DETAIL_TEMPLATES['PHYSICAL_COUNT'],
    approvalLevel: 'operator',
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Refs para el dropdown
  const productSearchInputRef = useRef(null)
  const productDropdownRef = useRef(null)

  const loadHistory = useCallback(async productId => {
    if (!productId) return

    setLoadingHistory(true)
    try {
      const storeResponse = await getManualAdjustmentHistory(productId, 50, 0)
      if (storeResponse.success && storeResponse.data) {
        const apiData = storeResponse.data
        if (apiData.history && Array.isArray(apiData.history)) {
          setAdjustmentHistory(apiData.history)
        } else if (Array.isArray(apiData)) {
          setAdjustmentHistory(apiData)
        } else {
          setAdjustmentHistory([])
        }
      } else {
        setAdjustmentHistory([])
      }
    } catch {
      setAdjustmentHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [getManualAdjustmentHistory])

  // Búsqueda de productos con debounce
  useEffect(() => {
    const searchProducts = async () => {
      if (!productSearchTerm || productSearchTerm.trim().length < 2) {
        setLocalProducts([])
        return
      }

      setLoadingProducts(true)
      try {
        const results = await productService.searchProducts(
          productSearchTerm.trim()
        )
        const productsArray = Array.isArray(results) ? results : [results]
        const activeProducts = productsArray.filter(
          product => product.state !== false && product.is_active !== false
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

  // Scroll automático al item resaltado
  useEffect(() => {
    if (highlightedIndex >= 0 && productDropdownRef.current) {
      const highlightedElement = productDropdownRef.current.querySelector(
        `#inventory-product-option-${highlightedIndex}`
      )
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

  // Cargar historial
  useEffect(() => {
    if (selectedProduct) {
      loadHistory(selectedProduct.product_id)
    }
  }, [selectedProduct, loadHistory])

  // Atajo de teclado Ctrl+A
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        setShowProductSearch(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleProductSelect = product => {
    setSelectedProduct(product)
    setShowProductSearch(false)
    setProductSearchTerm('')
    setSuccessMessage('')
    setFormErrors({})
    setFormData({
      quantityAdjustment: '',
      reasonCategory: 'PHYSICAL_COUNT',
      details: REASON_DETAIL_TEMPLATES['PHYSICAL_COUNT'],
      approvalLevel: 'operator',
    })
  }

  const handleReasonCategoryChange = newCategory => {
    setFormData(prev => ({
      ...prev,
      reasonCategory: newCategory,
      details: REASON_DETAIL_TEMPLATES[newCategory] || '',
    }))
  }

  const validateForm = () => {
    const errors = {}
    if (!selectedProduct) errors.product = 'Debe seleccionar un producto'
    if (formData.quantityAdjustment === '') errors.quantityAdjustment = 'Debe introducir la cantidad de stock real'
    if (!formData.details || formData.details.trim().length < 10) errors.details = 'Los detalles deben tener al menos 10 caracteres'
    return errors
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    clearError()
    const newQuantity = parseFloat(formData.quantityAdjustment)
    if (newQuantity < 0) {
      setFormErrors({ quantityAdjustment: 'La cantidad resultante no puede ser negativa' })
      return
    }
    const metadata = {
      source: 'manual_adjustment',
      timestamp: new Date().toISOString(),
      reason_category: formData.reasonCategory,
      approval_level: formData.approvalLevel,
      notes: formData.details,
    }
    const adjustmentData = {
      product_id: selectedProduct.product_id,
      new_quantity: newQuantity,
      reason: DEFAULT_REASONS.MANUAL_ADJUSTMENT[formData.reasonCategory],
      metadata: metadata,
      unit: selectedProduct.base_unit || 'unit',
    }
    const result = await createManualAdjustment(adjustmentData)
    if (result.success) {
      setSuccessMessage('Ajuste creado exitosamente')
      await loadHistory(selectedProduct.product_id)
      setFormData({
        quantityAdjustment: '',
        reasonCategory: 'PHYSICAL_COUNT',
        details: REASON_DETAIL_TEMPLATES['PHYSICAL_COUNT'],
        approvalLevel: 'operator',
      })
      setSelectedProduct(prev => ({ ...prev, stock_quantity: newQuantity }))
    } else {
      setFormErrors({ submit: result.error || 'Error al crear ajuste' })
    }
  }

  const handleClear = () => {
    setFormData({
      quantityAdjustment: '',
      reasonCategory: 'PHYSICAL_COUNT',
      details: REASON_DETAIL_TEMPLATES['PHYSICAL_COUNT'],
      approvalLevel: 'operator',
    })
    setFormErrors({})
    setSuccessMessage('')
  }

  const filteredProducts = localProducts
  const filteredHistory = adjustmentHistory.filter(
    item =>
      !historyFilter ||
      item.reason?.toLowerCase().includes(historyFilter.toLowerCase()) ||
      item.user_id?.toLowerCase().includes(historyFilter.toLowerCase())
  )

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      {/* Header */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <button
            className='p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors'
            onClick={() => navigate('/ajustes-inventario')}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
            <h1 className='text-2xl font-black text-text-main tracking-tighter uppercase'>
              Ajuste Manual de Stock
            </h1>
            <p className='text-text-secondary text-xs font-medium uppercase tracking-widest'>
              Gestión Unitaria de Inventario
            </p>
          </div>
        </div>
        <button
          className='flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all'
          onClick={() => setShowProductSearch(true)}
        >
          <Search size={18} strokeWidth={2} />
          <span>Buscar Producto</span>
        </button>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Sección izquierda: Producto y Formulario */}
        <div className='lg:col-span-5 flex flex-col gap-6'>
          {/* Card Producto Seleccionado */}
          <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
            <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4'>
              Producto Seleccionado
            </p>
            {selectedProduct ? (
              <div className='flex items-center gap-4'>
                <div className='size-16 bg-slate-50 border border-border-subtle rounded-lg flex items-center justify-center text-primary overflow-hidden flex-shrink-0'>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.product_name} className='w-full h-full object-cover' />
                  ) : (
                    <Package size={32} strokeWidth={1.5} />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-mono text-primary font-bold truncate'>{selectedProduct.product_id}</p>
                  <h3 className='text-lg font-bold text-text-main leading-tight truncate'>{selectedProduct.product_name}</h3>
                  <p className='text-sm text-text-secondary mt-1'>
                    Stock Actual: <span className='font-bold text-text-main'>{selectedProduct.stock_quantity || 0}</span> {getUnitLabel(selectedProduct.base_unit || 'unit')}
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300'>
                <Package className='text-slate-300 mb-2' size={40} />
                <p className='text-sm text-text-secondary px-4'>
                  No hay producto seleccionado. <br />
                  <button onClick={() => setShowProductSearch(true)} className='text-primary font-bold hover:underline'>Haz clic aquí</button> para buscar uno.
                </p>
              </div>
            )}
          </div>

          {/* Card Formulario de Ajuste */}
          <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
            <h2 className='text-sm font-black uppercase text-text-main tracking-widest mb-6 border-b border-slate-100 pb-3'>Nuevo Ajuste</h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Stock Real</label>
                  <input
                    type='number'
                    className={`h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${formErrors.quantityAdjustment ? 'border-error' : ''}`}
                    placeholder={`Unidades (${selectedProduct ? getUnitLabel(selectedProduct.base_unit || 'unit') : '...'})`}
                    value={formData.quantityAdjustment}
                    onChange={e => setFormData(prev => ({ ...prev, quantityAdjustment: e.target.value }))}
                    disabled={!selectedProduct}
                    step={selectedProduct && selectedProduct.base_unit && ['basic', 'packing', 'grocery'].includes(getUnitLabel(selectedProduct.base_unit)) ? '1' : '0.01'}
                  />
                  {formErrors.quantityAdjustment && <p className='text-error text-[10px] font-bold uppercase'>{formErrors.quantityAdjustment}</p>}
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Categoría Motivo</label>
                  <select
                    className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                    value={formData.reasonCategory}
                    onChange={e => handleReasonCategoryChange(e.target.value)}
                    disabled={!selectedProduct}
                  >
                    {REASON_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Detalles / Justificación</label>
                <textarea
                  className={`p-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[100px] ${formErrors.details ? 'border-error' : ''}`}
                  placeholder='Añadir un comentario detallado...'
                  value={formData.details}
                  onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  disabled={!selectedProduct}
                />
                {formErrors.details && <p className='text-error text-[10px] font-bold uppercase'>{formErrors.details}</p>}
              </div>

              <div className='flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 border-t border-slate-50 pt-4'>
                <p>Fuente: <span className='text-text-main'>Manual</span></p>
                <p>Fecha: <span className='text-text-main'>{new Date().toLocaleString('es-ES')}</span></p>
              </div>

              {successMessage && <div className='bg-success/10 text-success p-3 rounded text-xs font-bold text-center'>{successMessage}</div>}
              {(formErrors.submit || storeError) && <div className='bg-error/10 text-error p-3 rounded text-xs font-bold text-center'>{formErrors.submit || storeError}</div>}

              <div className='grid grid-cols-2 gap-4 pt-2'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Nivel de Aprobación</label>
                  <select
                    className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                    value={formData.approvalLevel}
                    onChange={e => setFormData(prev => ({ ...prev, approvalLevel: e.target.value }))}
                    disabled={!selectedProduct}
                  >
                    <option value='operator'>Operador</option>
                    <option value='supervisor'>Supervisor</option>
                    <option value='manager'>Manager</option>
                    <option value='admin'>Admin</option>
                  </select>
                </div>

                <div className='flex items-end gap-2'>
                  <button
                    type='submit'
                    className='flex-1 h-11 flex items-center justify-center gap-2 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-all'
                    disabled={!selectedProduct || loadingCreate}
                  >
                    <Send size={16} strokeWidth={2} />
                    <span>{loadingCreate ? '...' : 'Enviar'}</span>
                  </button>
                  <button
                    type='button'
                    className='h-11 px-4 border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-slate-50 disabled:opacity-50 transition-all'
                    onClick={handleClear}
                    disabled={!selectedProduct}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sección derecha: Historial */}
        <div className='lg:col-span-7'>
          <div className='bg-white rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden h-full flex flex-col'>
            <div className='px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-[#fafafa]'>
              <h3 className='text-[13px] font-bold text-gray-700 uppercase tracking-widest'>Historial de Ajustes</h3>
              <div className='relative w-64'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={16} />
                <input
                  type='text'
                  className='w-full pl-10 pr-3 py-2 border border-border-subtle rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-9'
                  placeholder='Filtrar historial...'
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value)}
                />
              </div>
            </div>

            <div className='flex-1 overflow-auto custom-scrollbar'>
              {selectedProduct ? (
                loadingHistory ? (
                  <div className='flex items-center justify-center py-20 text-text-secondary text-sm italic'>Cargando historial...</div>
                ) : filteredHistory.length > 0 ? (
                  <table className='w-full text-left'>
                    <thead className='bg-gray-50/50 border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider sticky top-0 z-10'>
                      <tr>
                        <th className='py-3 px-6'>Fecha</th>
                        <th className='py-3 px-4'>Operador</th>
                        <th className='py-3 px-4'>Ajuste</th>
                        <th className='py-3 px-4'>Motivo</th>
                        <th className='py-3 px-6'>Nivel</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 text-xs'>
                      {filteredHistory.map((item, index) => (
                        <tr key={index} className='hover:bg-gray-50 transition-colors'>
                          <td className='py-3 px-6 font-medium'>{formatDate(item.adjustment_date)}</td>
                          <td className='py-3 px-4 text-text-secondary'>{item.metadata?.operator || item.user_id || 'N/A'}</td>
                          <td className={`py-3 px-4 font-black ${item.value_change > 0 ? 'text-success' : 'text-error'}`}>
                            {item.value_change > 0 ? '+' : ''}{item.value_change}
                          </td>
                          <td className='py-3 px-4 italic text-slate-500'>{item.reason}</td>
                          <td className='py-3 px-6 text-right'>
                            <span className='px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold uppercase text-[9px]'>
                              {item.metadata?.approval_level || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className='flex flex-col items-center justify-center py-20 text-text-secondary opacity-50'>
                    <RefreshCw size={40} className='mb-2' />
                    <p className='text-sm italic'>{historyFilter ? 'Sin resultados para el filtro' : 'No hay ajustes registrados'}</p>
                  </div>
                )
              ) : (
                <div className='flex items-center justify-center py-20 text-text-secondary text-sm italic'>
                  Selecciona un producto para ver su historial
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Búsqueda de Producto */}
      {showProductSearch && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white w-full max-w-2xl rounded-xl shadow-fluent-16 overflow-hidden flex flex-col max-h-[80vh] scale-100 animate-in zoom-in-95 duration-200'>
            <header className='p-6 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10'>
              <div>
                <h2 className='text-xl font-black text-text-main tracking-tighter uppercase'>Buscar Producto</h2>
                <p className='text-xs text-text-secondary font-medium uppercase tracking-widest'>Ctrl+A para abrir rápido</p>
              </div>
              <button onClick={() => setShowProductSearch(false)} className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
                <X size={24} className='text-text-secondary' />
              </button>
            </header>

            <div className='p-6 bg-slate-50 border-b border-border-subtle'>
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
                <input
                  ref={productSearchInputRef}
                  type='text'
                  className='w-full pl-12 pr-4 h-14 border border-border-subtle rounded-xl text-lg bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all'
                  placeholder='Nombre, SKU o ID de producto...'
                  value={productSearchTerm}
                  onChange={e => setProductSearchTerm(e.target.value)}
                  onKeyDown={e => {
                    const itemCount = filteredProducts.length
                    if (itemCount === 0) return
                    switch (e.key) {
                      case 'ArrowDown':
                        e.preventDefault()
                        setHighlightedIndex(prev => prev < itemCount - 1 ? prev + 1 : 0)
                        break
                      case 'ArrowUp':
                        e.preventDefault()
                        setHighlightedIndex(prev => prev > 0 ? prev - 1 : itemCount - 1)
                        break
                      case 'Enter':
                        e.preventDefault()
                        if (highlightedIndex >= 0 && highlightedIndex < itemCount) handleProductSelect(filteredProducts[highlightedIndex])
                        else if (itemCount > 0) handleProductSelect(filteredProducts[0])
                        break
                      case 'Escape':
                        e.preventDefault()
                        setShowProductSearch(false)
                        setHighlightedIndex(-1)
                        break
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className='flex-1 overflow-auto p-2 custom-scrollbar' ref={productDropdownRef}>
              {loadingProducts ? (
                <div className='py-12 flex flex-col items-center gap-3'>
                  <div className='size-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
                  <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>Buscando...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className='grid grid-cols-1 gap-1'>
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.product_id}
                      id={`inventory-product-option-${index}`}
                      className={`p-4 flex gap-4 cursor-pointer rounded-lg transition-all ${highlightedIndex === index ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                      onClick={() => handleProductSelect(product)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className='size-12 bg-white rounded-lg flex items-center justify-center text-primary overflow-hidden flex-shrink-0 border border-border-subtle'>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className='w-full h-full object-cover' />
                        ) : (
                          <Package size={24} strokeWidth={1.5} />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-start'>
                          <p className={`text-[10px] font-mono font-bold uppercase ${highlightedIndex === index ? 'text-white/80' : 'text-primary'}`}>
                            {product.product_id}
                          </p>
                          <p className={`text-[10px] font-bold uppercase ${highlightedIndex === index ? 'text-white/80' : 'text-slate-400'}`}>
                            Stock: {product.stock_quantity || 0}
                          </p>
                        </div>
                        <h4 className='font-bold leading-tight truncate'>{product.product_name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-20 text-center'>
                  <Package className='mx-auto text-slate-200 mb-4' size={64} strokeWidth={1} />
                  <p className='text-slate-400 font-medium italic'>
                    {productSearchTerm.length < 2 ? 'Escribe al menos 2 caracteres' : 'No se encontraron productos'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryAdjustmentManualPage
