import React, { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/ProductDetailModal.css'
import {
  X,
  Package,
  FileText,
  DollarSign,
  Layers,
  Tag,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Factory,
} from 'lucide-react'
import ManufacturingPanel from '@/features/products/components/ManufacturingPanel'

const DetailSection = ({ title, icon: Icon, children, className = '' }) => {
  const { styles } = useThemeStyles()

  return (
    <div className={`space-y-3 ${className}`}>
      <div className='flex items-center gap-2'>
        {Icon && <Icon className='h-5 w-5 text-primary' />}
        <h3 className={`${styles.header('h3')} text-base font-semibold`}>
          {title}
        </h3>
      </div>
      <div
        className={`space-y-2 p-3 rounded-lg border ${styles.card('subtle')}`}
      >
        {children}
      </div>
    </div>
  )
}

const DetailRow = ({ label, value, type = 'text' }) => {
  const renderValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span className='text-muted-foreground italic'>No disponible</span>
    }

    switch (type) {
      case 'boolean':
        return (
          <Badge
            variant={value ? 'default' : 'secondary'}
            className='flex items-center gap-1 product-badge'
          >
            {value ? (
              <CheckCircle className='h-3 w-3' />
            ) : (
              <XCircle className='h-3 w-3' />
            )}
            {value ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      case 'stock_status': {
        const statusConfig = {
          in_stock: { variant: 'default', text: 'En Stock', icon: CheckCircle },
          out_of_stock: {
            variant: 'destructive',
            text: 'Sin Stock',
            icon: XCircle,
          },
          low_stock: {
            variant: 'secondary',
            text: 'Stock Bajo',
            icon: AlertTriangle,
          },
        }
        const config = statusConfig[value] || {
          variant: 'outline',
          text: value,
          icon: Info,
        }
        const StatusIcon = config.icon

        return (
          <Badge
            variant={config.variant}
            className={`flex items-center gap-1 product-badge ${
              value === 'in_stock'
                ? 'validation-success'
                : value === 'out_of_stock'
                ? 'validation-error'
                : value === 'low_stock'
                ? 'validation-warning'
                : ''
            }`}
          >
            <StatusIcon className='h-3 w-3' />
            {config.text}
          </Badge>
        )
      }
      case 'price':
        return value === 'N/A' ? (
          <span className='text-muted-foreground italic'>No configurado</span>
        ) : (
          <span className='font-semibold text-green-600'>{value}</span>
        )
      case 'category':
        return (
          <Badge variant='outline' className='flex items-center gap-1'>
            <Tag className='h-3 w-3' />
            {value}
          </Badge>
        )
      default:
        return <span className='font-medium'>{value}</span>
    }
  }

  return (
    <div className='flex justify-between items-center py-2'>
      <span className='text-sm text-muted-foreground font-medium'>
        {label}:
      </span>
      <div className='text-sm'>{renderValue()}</div>
    </div>
  )
}

const ProductDetailModal = ({ isOpen, onClose, product, container = null }) => {
  const { t } = useI18n()
  const { styles } = useThemeStyles()

  if (!isOpen || !product) return null

  // Procesar datos del servidor con estructura financial
  const processedProduct = {
    ...product,
    // Usar la estructura correcta del servidor
    categoryName:
      product.category?.name || product.category_name || 'Sin categoría',
    categoryDescription: product.category?.description || '',
    isActive: product.state, // El servidor usa 'state' en lugar de 'is_active'
    // Estructura financial - precios
    hasValidPrice:
      product.financial_health?.has_prices || product.has_valid_prices,
    priceFormatted: product.unit_prices?.[0]?.price_per_unit
      ? `PYG ${product.unit_prices[0].price_per_unit.toLocaleString('es-PY')}`
      : product.price_formatted,
    purchasePrice: product.unit_costs_summary?.[0]?.last_cost
      ? `PYG ${product.unit_costs_summary[0].last_cost.toLocaleString('es-PY')}`
      : product.purchase_price,
    // Estructura financial - stock
    hasValidStock:
      product.financial_health?.has_stock || product.has_valid_stock,
    stockStatus: product.stock_status,
    productType: product.product_type,
    // Fechas formateadas
    priceUpdatedAt: product.unit_prices?.[0]?.effective_date
      ? new Date(product.unit_prices[0].effective_date).toLocaleDateString()
      : product.price_updated_at
      ? new Date(product.price_updated_at).toLocaleDateString()
      : null,
    stockUpdatedAt: product.stock_updated_at
      ? new Date(product.stock_updated_at).toLocaleDateString()
      : null,
    // Información adicional de financial structure
    hasUnitPricing: product.unit_prices && product.unit_prices.length > 0,
  }

  const showManufacturingTab =
    (processedProduct.productType || '').toUpperCase() === 'PRODUCTION'
  const manufacturingLabel = t('products.tabs.manufacturing', 'Manufactura')
  const tabColumnsClass = showManufacturingTab ? 'grid-cols-5' : 'grid-cols-4'
  const effectiveProductId = processedProduct.product_id || processedProduct.id

  return (
    <div
      className={`${
        container ? 'absolute' : 'fixed'
      } inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 product-detail-modal ${
        container ? 'modal-in-container' : ''
      }`}
    >
      <div
        className={`w-full max-w-3xl max-h-[85vh] flex flex-col modal-content ${styles.card()} shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}
      >
        {/* Header */}
        <div className='flex items-start justify-between p-4 border-b'>
          <div className='flex-1'>
            <div className='flex items-start justify-between'>
              <div>
                <h2 className={`${styles.header('h2')} text-xl font-bold mb-2`}>
                  {processedProduct.product_name || processedProduct.name}
                </h2>
                <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Package className='h-4 w-4' />
                    ID: {processedProduct.product_id || processedProduct.id}
                  </span>
                  {processedProduct.barcode && (
                    <span className='flex items-center gap-1'>
                      <Tag className='h-4 w-4' />
                      Barcode: {processedProduct.barcode}
                    </span>
                  )}
                  <Badge
                    variant={
                      processedProduct.isActive ? 'default' : 'secondary'
                    }
                    className='product-badge'
                  >
                    {processedProduct.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='shrink-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className='flex-1 p-4 product-scroll-area'>
          <Tabs defaultValue='general' className='w-full'>
            <TabsList
              className={`grid w-full ${tabColumnsClass} mb-4 tab-list`}
            >
              <TabsTrigger
                value='general'
                className='flex items-center gap-2 product-tab tab-trigger'
              >
                <Info className='h-4 w-4' />
                General
              </TabsTrigger>
              <TabsTrigger
                value='description'
                className='flex items-center gap-2 product-tab tab-trigger'
              >
                <FileText className='h-4 w-4' />
                Descripción
              </TabsTrigger>
              <TabsTrigger
                value='pricing'
                className='flex items-center gap-2 product-tab tab-trigger'
              >
                <DollarSign className='h-4 w-4' />
                Precios
              </TabsTrigger>
              <TabsTrigger
                value='inventory'
                className='flex items-center gap-2 product-tab tab-trigger'
              >
                <Layers className='h-4 w-4' />
                Inventario
              </TabsTrigger>
              {showManufacturingTab && (
                <TabsTrigger
                  value='manufacturing'
                  className='flex items-center gap-2 product-tab tab-trigger'
                >
                  <Factory className='h-4 w-4' />
                  {manufacturingLabel}
                </TabsTrigger>
              )}
            </TabsList>

            <div className='space-y-4'>
              <TabsContent value='general' className='space-y-4 tab-content'>
                <DetailSection title='Información General' icon={Info}>
                  <DetailRow
                    label='Categoría'
                    value={processedProduct.categoryName}
                    type='category'
                  />
                  <Separator />
                  <DetailRow
                    label='Tipo de Producto'
                    value={processedProduct.productType}
                  />
                  <Separator />
                  <DetailRow
                    label='Código de Barras'
                    value={processedProduct.barcode || 'No configurado'}
                  />
                  <Separator />
                  <DetailRow
                    label='Estado'
                    value={processedProduct.isActive}
                    type='boolean'
                  />
                  <Separator />
                  <DetailRow
                    label='Usuario Propietario'
                    value={processedProduct.user_id}
                  />
                </DetailSection>

                {processedProduct.categoryDescription && (
                  <DetailSection title='Categoría' icon={Tag}>
                    <div className='text-sm text-muted-foreground'>
                      <strong>{processedProduct.categoryName}</strong>
                      {processedProduct.categoryDescription && (
                        <p className='mt-1'>
                          {processedProduct.categoryDescription}
                        </p>
                      )}
                    </div>
                  </DetailSection>
                )}
              </TabsContent>

              <TabsContent
                value='description'
                className='space-y-4 tab-content'
              >
                <DetailSection title='Descripción del Producto' icon={FileText}>
                  {processedProduct.description ? (
                    <div className='space-y-3'>
                      <p className='text-sm leading-relaxed'>
                        {processedProduct.description}
                      </p>
                      {processedProduct.description_id && (
                        <div className='text-xs text-muted-foreground pt-2 border-t'>
                          ID de Descripción: {processedProduct.description_id}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-muted-foreground'>
                      <FileText className='h-12 w-12 mx-auto mb-3 opacity-50' />
                      <p>No hay descripción disponible para este producto</p>
                    </div>
                  )}
                </DetailSection>
              </TabsContent>

              <TabsContent value='pricing' className='space-y-4 tab-content'>
                <DetailSection title='Información de Precios' icon={DollarSign}>
                  <DetailRow
                    label='Precio de Venta'
                    value={processedProduct.priceFormatted}
                    type='price'
                  />
                  <Separator />
                  <DetailRow
                    label='Precio de Compra'
                    value={processedProduct.purchasePrice || 'No configurado'}
                    type='price'
                  />
                  <Separator />
                  <DetailRow
                    label='Precio Válido'
                    value={processedProduct.hasValidPrice}
                    type='boolean'
                  />
                  <Separator />
                  <DetailRow
                    label='Pricing por Unidades'
                    value={processedProduct.hasUnitPricing}
                    type='boolean'
                  />

                  {(processedProduct.price_id ||
                    processedProduct.priceUpdatedAt ||
                    processedProduct.price_updated_by) && (
                    <>
                      <Separator />
                      <div className='pt-3 space-y-2 text-xs text-muted-foreground'>
                        <h4 className='font-medium'>Metadatos de Precio:</h4>
                        {processedProduct.price_id && (
                          <DetailRow
                            label='ID de Precio'
                            value={processedProduct.price_id}
                          />
                        )}
                        {processedProduct.priceUpdatedAt && (
                          <DetailRow
                            label='Última Actualización'
                            value={processedProduct.priceUpdatedAt}
                          />
                        )}
                        {processedProduct.price_updated_by && (
                          <DetailRow
                            label='Actualizado Por'
                            value={processedProduct.price_updated_by}
                          />
                        )}
                      </div>
                    </>
                  )}
                </DetailSection>
              </TabsContent>

              <TabsContent value='inventory' className='space-y-4 tab-content'>
                <DetailSection title='Información de Inventario' icon={Layers}>
                  <DetailRow
                    label='Estado de Stock'
                    value={processedProduct.stockStatus}
                    type='stock_status'
                  />
                  <Separator />
                  <DetailRow
                    label='Cantidad en Stock'
                    value={processedProduct.stock_quantity || 'No configurado'}
                  />
                  <Separator />
                  <DetailRow
                    label='Stock Válido'
                    value={processedProduct.hasValidStock}
                    type='boolean'
                  />

                  {(processedProduct.stock_id ||
                    processedProduct.stockUpdatedAt ||
                    processedProduct.stock_updated_by) && (
                    <>
                      <Separator />
                      <div className='pt-3 space-y-2 text-xs text-muted-foreground'>
                        <h4 className='font-medium'>
                          Metadatos de Inventario:
                        </h4>
                        {processedProduct.stock_id && (
                          <DetailRow
                            label='ID de Stock'
                            value={processedProduct.stock_id}
                          />
                        )}
                        {processedProduct.stockUpdatedAt && (
                          <DetailRow
                            label='Última Actualización'
                            value={processedProduct.stockUpdatedAt}
                          />
                        )}
                        {processedProduct.stock_updated_by && (
                          <DetailRow
                            label='Actualizado Por'
                            value={processedProduct.stock_updated_by}
                          />
                        )}
                      </div>
                    </>
                  )}
                </DetailSection>
              </TabsContent>

              {showManufacturingTab && (
                <TabsContent
                  value='manufacturing'
                  className='space-y-4 tab-content'
                >
                  <ManufacturingPanel
                    productId={effectiveProductId}
                    productName={
                      processedProduct.product_name || processedProduct.name
                    }
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </ScrollArea>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-6 border-t bg-muted/20'>
          <Button variant='outline' onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
