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
  MoreHorizontal,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useProductStore from '@/store/useProductStore'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import StatusBadge from '@/components/ui/StatusBadge'
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
  const [hasSearched, setHasSearched] = useState(false)
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
        setHasSearched(false)
        setViewMode('paginated')
        fetchProductsPaginated(1, 10)
        return
      }

      if (trimmedTerm.length < 3) {
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      setHasSearched(true)
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
        return { level: 'poor', text: t('products.health.poor'), color: 'bg-red-500' }
      } else if (stock < 10) {
        return { level: 'at-risk', text: t('products.health.at_risk'), color: 'bg-yellow-500' }
      } else {
        return { level: 'healthy', text: t('products.health.healthy'), color: 'bg-green-500' }
      }
    }

    if (!isActive || stock === 0) {
      return { level: 'poor', text: t('products.health.poor'), color: 'bg-red-500' }
    } else if (stock < 10) {
      return { level: 'at-risk', text: t('products.health.at_risk'), color: 'bg-yellow-500' }
    } else {
      return { level: 'healthy', text: t('products.health.healthy'), color: 'bg-green-500' }
    }
  }

  const startIndex = (currentPage - 1) * 10 + 1
  const endIndex = Math.min(currentPage * 10, totalProducts)

  return (
    <div className='min-h-screen bg-[#f3f4f6] text-[#323130] p-8 overflow-y-auto'>
      <div className='max-w-[1600px] mx-auto'>
        
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-gray-500 mb-6">
          <span onClick={() => navigate('/dashboard')} className="hover:text-[#106ebe] cursor-pointer transition-colors">
            {t('products.breadcrumb.home', 'Inicio')}
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-400">
            {t('products.breadcrumb.inventory', 'Inventario')}
          </span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">{t('products.page.title')}</span>
        </nav>

        {/* Page Header */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-[#242424]'>{t('products.page.title')}</h1>
            <p className='text-[#616161] mt-1'>{t('products.page.subtitle')}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className='hidden sm:inline'>{t('products.action.refresh', 'Refrescar')}</span>
            </Button>
            <Button variant='outline' className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700">
              <Share className='size-4 mr-2' />
              <span className='hidden sm:inline'>{t('products.action.export')}</span>
            </Button>
            <Button 
              className='bg-[#106ebe] hover:bg-[#005a9e] text-white px-5 shadow-sm border-none'
              onClick={handleOpenCreateModal}
            >
              <Plus className='size-4 mr-2' />
              <span>{t('products.action.new_product')}</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Card */}
        <Card className='bg-white border-gray-200 rounded-xl shadow-sm p-6 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
            {/* Search */}
            <div className='relative flex-1 max-w-xl'>
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                {isSearching ? (
                  <RefreshCw className="size-5 animate-spin" />
                ) : (
                  <Search className="size-5" />
                )}
              </span>
              <Input
                type='search'
                className='block w-full pl-10 pr-3 py-2.5 border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#106ebe] focus:border-transparent outline-none transition-all h-11'
                placeholder={t('products.search.by_name_sku')}
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
                <p className='absolute -bottom-6 left-0 text-xs text-orange-600'>
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
                className={`h-11 px-4 ${showFilters ? 'bg-[#106ebe] text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className='size-4 mr-2' />
                {t('products.action.filter')}
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className='mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2'>
              {/* Category Filter */}
              <div className='space-y-2'>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  {t('products.filter.category', 'Categoría')}
                </label>
                <Select
                  value={localFilters.category}
                  onValueChange={value =>
                    setLocalFilters(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className='w-full border-gray-200 bg-white h-10'>
                    <SelectValue placeholder={t('products.filter.all_categories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('products.filter.all_categories')}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className='space-y-2'>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  {t('products.filter.status', 'Estado')}
                </label>
                <Select
                  value={localFilters.status}
                  onValueChange={value =>
                    setLocalFilters(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className='w-full border-gray-200 bg-white h-10'>
                    <SelectValue placeholder={t('products.filter.all_statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('products.filter.all_statuses')}</SelectItem>
                    <SelectItem value='active'>{t('products.state.active')}</SelectItem>
                    <SelectItem value='inactive'>{t('products.state.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className='flex items-end gap-2'>
                <Button
                  className='flex-1 bg-[#106ebe] hover:bg-[#005a9e] text-white h-10'
                  onClick={handleApplyFilters}
                >
                  {t('products.filter.apply', 'Aplicar')}
                </Button>
                <Button
                  variant='outline'
                  className='flex-1 border-gray-200 text-gray-700 h-10 hover:bg-gray-50'
                  onClick={handleClearFilters}
                >
                  {t('products.filter.clear', 'Limpiar')}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Table Container */}
        <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className='w-[60px] text-center px-6'>
                  <Checkbox
                    checked={selectedIds.length === products.length && products.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                  />
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">{t('products.table.product_name')}</TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">{t('products.table.category')}</TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">{t('products.table.stock')}</TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">{t('products.table.state')}</TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">{t('products.table.financial_health')}</TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('products.table.created_at', 'Creado')}
                </TableHead>
                <TableHead className='text-right py-4 px-6'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* States: Loading, Error, Empty, Data */}
              {loading && products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20">
                    <DataState variant='loading' skeletonVariant='list' skeletonProps={{ count: 10 }} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-20">
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
                  <TableCell colSpan={8} className="py-20">
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
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                    >
                      <TableCell className="px-6 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectProduct(productId)}
                          className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                        />
                      </TableCell>
                      <TableCell className='py-4 px-4'>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden text-gray-400">
                            {product.image_url ? (
                              <img src={product.image_url} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                          <span 
                            className='font-medium text-[#242424] cursor-pointer hover:text-[#106ebe] hover:underline'
                            onClick={() => handleOpenDetailsModal(product)}
                          >
                            {productName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 px-4">{categoryName}</TableCell>
                      <TableCell className="px-4">
                        <span className={stockInfo.isLow ? 'text-red-600 font-medium' : 'text-[#242424]'}>
                          {stockInfo.display}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive 
                            ? 'bg-[#dff6dd] text-[#107c10]' 
                            : 'bg-[#fde7e9] text-[#a4262c]'
                        }`}>
                          {isActive ? t('products.state.active') : t('products.state.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className='flex items-center gap-2'>
                          <div className={`size-2 rounded-full ${healthInfo.color}`} />
                          <span className='text-sm text-[#242424]'>{healthInfo.text}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-gray-500 tabular-nums px-4 text-[13px]'>
                        {product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : '-'}
                      </TableCell>
                      <TableCell className='text-right px-6'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          onClick={() => handleOpenEditModal(product)}
                        >
                          <MoreVertical className='size-5' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className='px-6 py-4 flex items-center justify-between bg-[#fafafa] border-t border-gray-100'>
            <p className='text-[13px] text-gray-500 font-medium'>
              {t('products.pagination.showing', {
                start: startIndex,
                end: endIndex,
                total: totalProducts,
              })}
            </p>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='icon'
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 h-8 w-8"
              >
                <ChevronLeft className='size-5' />
              </Button>
              <span className='text-sm font-semibold text-gray-700'>
                {currentPage} / {totalPages || 1}
              </span>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 h-8 w-8"
              >
                <ChevronRight className='size-5' />
              </Button>
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
    </div>
  )
}

export default Products
