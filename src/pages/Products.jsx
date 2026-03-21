// ===========================================================================
// Products Page - Fluent Design System 2 + Tailwind CSS
// Patrón: Zustand + Tailwind
// Basado en el rediseño de Stitch: b924dd75a6f1443ab01d2164934bd635
// ===========================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Share,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Package,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useProductStore from '@/store/useProductStore'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import ProductFormModal from '@/components/ProductFormModal'
import ProductDetailsModal from '@/components/ProductDetailsModal'
import { cn } from '@/lib/utils'

/**
 * Custom hook para debounce
 */
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)

  const debouncedFunction = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedFunction
}

const Products = () => {
  const { t } = useI18n()
  const navigate = useNavigate()

  // Zustand store
  const {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    fetchProducts,
    fetchProductsPaginated,
    fetchCategories,
    categories,
    filters,
    setFilters,
    setCurrentPage,
    clearError,
  } = useProductStore()

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState('paginated')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    category: 'all',
    status: 'all',
  })

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Cargar productos paginados y categorías al inicio
  useEffect(() => {
    fetchProductsPaginated(1, 10)
    fetchCategories()
  }, [fetchProductsPaginated, fetchCategories])

  // Función de búsqueda
  const performSearch = useCallback(
    term => {
      const trimmedTerm = term.trim()

      if (!trimmedTerm) {
        setIsSearching(false)
        setViewMode('paginated')
        fetchProductsPaginated(1, 10)
        return
      }

      if (trimmedTerm.length < 3) {
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      setViewMode('search')
      fetchProducts(1, 10, trimmedTerm).finally(() => {
        setIsSearching(false)
      })
    },
    [fetchProducts, fetchProductsPaginated],
  )

  const debouncedSearch = useDebounce(performSearch, 500)

  const handleSearch = e => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleSearchKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = searchTerm.trim()
      if (value.length >= 3) {
        performSearch(value)
      }
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      if (viewMode === 'search') {
        fetchProducts(currentPage - 1, 10, searchTerm)
      } else {
        fetchProductsPaginated(currentPage - 1, 10)
      }
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      if (viewMode === 'search') {
        fetchProducts(currentPage + 1, 10, searchTerm)
      } else {
        fetchProductsPaginated(currentPage + 1, 10)
      }
    }
  }

  const handleApplyFilters = () => {
    setFilters(localFilters)
    setShowFilters(false)
    if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10)
    }
  }

  const handleClearFilters = () => {
    const clearedFilters = { category: 'all', status: 'all' }
    setLocalFilters(clearedFilters)
    setFilters(clearedFilters)
    if (viewMode === 'paginated') {
      fetchProductsPaginated(1, 10)
    }
  }

  const handleRefresh = () => {
    if (viewMode === 'search' && searchTerm) {
      fetchProducts(currentPage, 10, searchTerm)
    } else {
      fetchProductsPaginated(currentPage, 10)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map(p => p.id || p.product_id))
    }
  }

  const toggleSelectProduct = id => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id],
    )
  }

  const getStockDisplay = product => {
    const stock =
      product.stock_quantity ?? product.stock ?? product.quantity ?? 0
    const isLow = stock < 10

    return {
      display: isLow
        ? t('products.stock.low', { quantity: stock })
        : stock.toString(),
      isLow,
    }
  }

  const handleOpenCreateModal = () => {
    setSelectedProduct(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = product => {
    setSelectedProduct(product)
    setIsFormModalOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setSelectedProduct(null)
    handleRefresh()
  }

  const handleOpenDetailsModal = product => {
    setSelectedProduct(product)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleEditFromDetails = product => {
    setIsDetailsModalOpen(false)
    setSelectedProduct(product)
    setIsFormModalOpen(true)
  }

  const getHealthIndicator = product => {
    const stock =
      product.stock_quantity ?? product.stock ?? product.quantity ?? 0
    const isActive = product.state !== false && product.is_active !== false

    if (product.financial_health) {
      const { has_prices, has_costs, has_stock } = product.financial_health
      if (!has_prices || !has_costs || !has_stock) {
        return { level: 'poor', text: t('products.health.poor'), color: 'bg-error' }
      } else if (stock < 10) {
        return { level: 'at-risk', text: t('products.health.at_risk'), color: 'bg-warning' }
      } else {
        return { level: 'healthy', text: t('products.health.healthy'), color: 'bg-success' }
      }
    }

    if (!isActive || stock === 0) {
      return { level: 'poor', text: t('products.health.poor'), color: 'bg-error' }
    } else if (stock < 10) {
      return { level: 'at-risk', text: t('products.health.at_risk'), color: 'bg-warning' }
    } else {
      return { level: 'healthy', text: t('products.health.healthy'), color: 'bg-success' }
    }
  }

  const startIndex = (currentPage - 1) * 10 + 1
  const endIndex = Math.min(currentPage * 10, totalProducts)

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      
      {/* Breadcrumbs */}
      <nav className='flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400'>
        <span onClick={() => navigate('/dashboard')} className='flex items-center gap-1 hover:text-primary cursor-pointer transition-colors'>
          <span className="material-icons-round text-xs">home</span> {t('products.breadcrumb.home', 'Inicio')}
        </span>
        <span className='material-icons-round text-[10px]'>chevron_right</span>
        <span className='hover:text-primary cursor-pointer transition-colors'>
          {t('products.breadcrumb.inventory', 'Inventario')}
        </span>
        <span className='material-icons-round text-[10px]'>chevron_right</span>
        <span className='text-text-main'>{t('products.page.title')}</span>
      </nav>

      {/* Page Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div>
          <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>{t('products.page.title')}</h1>
          <p className='text-text-secondary text-sm font-medium mt-1'>{t('products.page.subtitle')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
          >
            <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>{t('products.action.refresh', 'Refrescar')}</span>
          </Button>
          <Button variant='outline' className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            <Share className='size-4 mr-2' />
            <span className='hidden sm:inline'>{t('products.action.export')}</span>
          </Button>
          <Button 
            className='bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest px-6 h-10 rounded shadow-fluent-2'
            onClick={handleOpenCreateModal}
          >
            <Plus className='size-4 mr-2' />
            <span>{t('products.action.new_product')}</span>
          </Button>
        </div>
      </div>

      {/* Toolbar Card */}
      <Card className='bg-white border-border-subtle rounded-xl shadow-fluent-2 p-6'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
          {/* Search */}
          <div className='relative flex-1 max-w-xl'>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              {isSearching ? (
                <RefreshCw className="size-5 animate-spin" />
              ) : (
                <Search className="size-5" />
              )}
            </span>
            <Input
              type='search'
              className='block w-full pl-10 pr-3 py-2.5 border-border-subtle rounded-full bg-slate-50 focus:bg-white transition-all h-11 font-bold text-xs uppercase tracking-wider'
              placeholder={t('products.search.by_name_sku')}
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={handleSearchKeyDown}
            />
            {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
              <p className='absolute -bottom-6 left-0 text-[10px] font-black uppercase tracking-widest text-warning'>
                {t('products.search.min_chars', 'Escribe al menos 3 caracteres')} ({searchTerm.trim().length}/3)
              </p>
            )}
          </div>

          {/* Filters Toggle */}
          <div className='flex items-center gap-2'>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 px-6 font-black uppercase text-[10px] tracking-widest transition-all",
                showFilters ? "bg-primary text-white" : "bg-white border-border-subtle text-text-secondary hover:bg-slate-50"
              )}
            >
              <Filter className='size-4 mr-2' />
              {t('products.action.filter')}
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className='mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2'>
            {/* Category Filter */}
            <div className='space-y-2'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1'>
                {t('products.filter.category', 'Categoría')}
              </label>
              <Select
                value={localFilters.category}
                onValueChange={value =>
                  setLocalFilters(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className='w-full border-border-subtle bg-white h-11 font-bold text-sm rounded-xl shadow-sm'>
                  <SelectValue placeholder={t('products.filter.all_categories')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border-subtle shadow-fluent-16">
                  <SelectItem value='all' className="font-bold text-xs uppercase">{t('products.filter.all_categories')}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()} className="font-bold text-xs uppercase">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='space-y-2'>
              <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1'>
                {t('products.filter.status', 'Estado')}
              </label>
              <Select
                value={localFilters.status}
                onValueChange={value =>
                  setLocalFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className='w-full border-border-subtle bg-white h-11 font-bold text-sm rounded-xl shadow-sm'>
                  <SelectValue placeholder={t('products.filter.all_statuses')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border-subtle shadow-fluent-16">
                  <SelectItem value='all' className="font-bold text-xs uppercase">{t('products.filter.all_statuses')}</SelectItem>
                  <SelectItem value='active' className="font-bold text-xs uppercase">{t('products.state.active')}</SelectItem>
                  <SelectItem value='inactive' className="font-bold text-xs uppercase">{t('products.state.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className='flex items-end gap-3'>
              <Button
                className='flex-1 bg-primary hover:bg-primary-hover text-white h-11 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-fluent-2'
                onClick={handleApplyFilters}
              >
                {t('products.filter.apply', 'Aplicar')}
              </Button>
              <Button
                variant='outline'
                className='flex-1 border-border-subtle text-text-secondary h-11 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest rounded-xl'
                onClick={handleClearFilters}
              >
                {t('products.filter.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Table Container */}
      <div className='bg-white border border-border-subtle rounded-xl shadow-fluent-2 overflow-hidden'>
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-border-subtle">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className='w-[60px] text-center px-6'>
                <Checkbox
                  checked={selectedIds.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="border-slate-300"
                />
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.product_name')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.category')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">IVA</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.stock')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.state')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.financial_health')}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-4">{t('products.table.created_at', 'Creado')}</TableHead>
              <TableHead className='text-right py-4 px-6'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-32">
                  <div className='flex flex-col items-center justify-center gap-4'><RefreshCw className='w-12 h-12 animate-spin text-primary opacity-20' /><p className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400'>Cargando Inventario...</p></div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20">
                  <DataState
                    variant='error'
                    title={t('products.error.title')}
                    message={error}
                    onRetry={() => {
                      clearError()
                      handleRefresh()
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20">
                  <DataState
                    variant='empty'
                    title={viewMode === 'search' ? t('products.empty.no_results') : t('products.empty.title')}
                    description={viewMode === 'search' ? `No se encontraron productos con "${searchTerm}"` : t('products.empty.description')}
                    actionLabel={t('products.action.new_product')}
                    onAction={handleOpenCreateModal}
                  />
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => {
                const productId = product.product_id || product.id
                const productName = product.product_name || product.name || t('field.no_name')
                const categoryName = product.category_name || product.category?.name || '-'
                const isSelected = selectedIds.includes(productId)
                const stockInfo = getStockDisplay(product)
                const healthInfo = getHealthIndicator(product)
                const isActive = product.state !== false && product.is_active !== false

                return (
                  <TableRow 
                    key={productId} 
                    selected={isSelected}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="px-6 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectProduct(productId)}
                        className="border-slate-300"
                      />
                    </TableCell>
                    <TableCell className='py-5 px-4'>
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center border border-border-subtle overflow-hidden text-slate-400 shadow-sm shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <span 
                          className='font-bold text-text-main cursor-pointer hover:text-primary transition-colors'
                          onClick={() => handleOpenDetailsModal(product)}
                        >
                          {productName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary font-medium px-4 text-sm">{categoryName}</TableCell>
                    <TableCell className="px-4">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tighter">
                        {product.applied_tax_name || product.tax_rate_name || product.tax_rate_code || '10% (STD)'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className={cn(
                        "font-black font-mono",
                        stockInfo.isLow ? 'text-error' : 'text-text-main'
                      )}>
                        {stockInfo.display}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit",
                        isActive ? "bg-green-50 text-success border-green-200" : "bg-red-50 text-error border-red-200"
                      )}>
                        <span className={cn("size-1.5 rounded-full", isActive ? "bg-success" : "bg-error")}></span>
                        {isActive ? t('products.state.active') : t('products.state.inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className='flex items-center gap-2'>
                        <div className={cn("size-2 rounded-full", healthInfo.color)} />
                        <span className='text-[10px] font-black uppercase tracking-widest text-text-secondary'>{healthInfo.text}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-text-secondary tabular-nums px-4 text-xs font-mono'>
                      {product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : '-'}
                    </TableCell>
                    <TableCell className='text-right px-6'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className="text-text-secondary hover:text-primary transition-colors size-8 rounded opacity-0 group-hover:opacity-100"
                        onClick={() => handleOpenEditModal(product)}
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className='px-10 py-6 flex items-center justify-between bg-slate-50/50 border-t border-border-subtle'>
          <p className='text-[10px] font-black uppercase tracking-widest text-text-secondary'>
            {t('products.pagination.showing', {
              start: startIndex,
              end: endIndex,
              total: totalProducts,
            })}
          </p>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-1'>
                <Button
                    variant='outline'
                    size='icon'
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                    className="size-8 rounded border-border-subtle hover:bg-white disabled:opacity-30"
                >
                    <ChevronLeft size={18} />
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                    className="size-8 rounded border-border-subtle hover:bg-white disabled:opacity-30"
                >
                    <ChevronRight size={18} />
                </Button>
            </div>
            <span className='text-[10px] font-black uppercase tracking-[0.2em] text-text-main'>
              Página {currentPage} de {totalPages || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        product={selectedProduct}
      />

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
      />
    </div>
  )
}

export default Products
