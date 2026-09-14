import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Edit, Package, Info, Layout, Activity, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { ProductOperationInfoResponse, ProductVariant } from '@/types';
import { variantService } from '@/services/variantService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import {
  ProductPriceHistoryDialog,
  ProductCostHistoryDialog,
  ProductPriceAdjustmentDialog,
  ProductCostAdjustmentDialog
} from './ProductHistoryModals';
import { VariantsManagerModal } from '@/components/modals/VariantsManagerModal';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductOperationInfoResponse | any;
  onEdit?: (product: any) => void;
}

/**
 * ProductDetailsModal Component
 * Construido sobre EnhancedModal siguiendo DESIGN.md (§6.3, §6.6)
 */
export default function ProductDetailsModal({ isOpen, onClose, product, onEdit }: ProductDetailsModalProps) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('products:write');
  // PLAN_CATALOGO_VENDEDOR 3.4: costo, margen y salud financiera solo con
  // products:cost (el backend ya strippea los campos; esto es defensa en
  // profundidad de UI para roles write-sin-cost).
  const canViewCosts = hasPermission('products:cost');

  // Sub-modal states
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [isCostHistoryOpen, setIsCostHistoryOpen] = useState(false);
  const [isPriceAdjustmentOpen, setIsPriceAdjustmentOpen] = useState(false);
  const [isCostAdjustmentOpen, setIsCostAdjustmentOpen] = useState(false);
  const [isVariantsManagerOpen, setIsVariantsManagerOpen] = useState(false);

  // Track specific row unit and value for adjusting
  const [selectedUnit, setSelectedUnit] = useState('unit');
  const [selectedValue, setSelectedValue] = useState(0);
  // Variante de la fila de precio elegida para ajustar (null = fila del padre).
  const [selectedVariantForRow, setSelectedVariantForRow] = useState<string | null>(null);

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const currentProductId = product?.product_id || product?.id;

  useEffect(() => {
    if (isOpen && currentProductId) {
      setLoadingVariants(true);
      const activeBranch = localStorage.getItem('activeBranch') ? parseInt(localStorage.getItem('activeBranch') as string) : undefined;
      variantService.getEnrichedVariants(currentProductId, activeBranch, true)
        .then(setVariants)
        .catch(console.error)
        .finally(() => setLoadingVariants(false));
    }
  }, [isOpen, currentProductId]);

  if (!isOpen || !product) return null;

  const productId = product.product_id || product.id;
  const productName = product.product_name || product.name;
  const barcode = product.barcode;
  const brand = product.brand;
  const origin = product.origin;
  const categoryName = product.category_name || product.category?.name;
  const productType = product.product_type || product.productType;
  const description = product.description;
  const unitPrices = product.unit_prices || [];
  // Precio de venta destacado: se prefiere el de la unidad base del producto.
  const salePrice = unitPrices.find((up: any) => up.unit === product.base_unit) || unitPrices[0];
  const unitCostsSummary = product.unit_costs_summary || [];
  const stockQuantity = product.stock_quantity ?? product.stock ?? 0;
  const stockStatus = product.stock_status || (stockQuantity < 10 ? 'low_stock' : 'in_stock');
  const financialHealth = product.financial_health || {};
  const hasPrices = financialHealth.has_prices || product.has_valid_prices;
  const hasCosts = financialHealth.has_costs || product.has_valid_costs;
  const hasStock = financialHealth.has_stock || product.has_valid_stock;
  const bestMarginUnit = product.best_margin_unit;
  const bestMarginPercent = product.best_margin_percent;

  const hasVariants = product?.has_variants || variants.length > 0;
  const variantsTotalStock = variants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0);
  const totalConsolidatedStock = stockQuantity; // stockQuantity is already consolidated
  const baseStock = Math.max(0, stockQuantity - variantsTotalStock);

  // unit_prices del padre enriquecido viaja mezclado (filas del padre + de sus
  // variantes, todas con la misma unidad): sin la etiqueta el usuario no puede
  // distinguir a qué variante pertenece cada precio (owner report 2026-09-14).
  const variantNameById: Record<string, string> = {};
  variants.forEach((v) => {
    const vid = (v as any).variant_id || v.id;
    if (vid) variantNameById[vid] = v.variant_name;
  });

  const isAvailable = !(product.state === false || product.status === false || product.is_active === false);

  const infoLabelClass = 'text-label-caps uppercase text-on-surface-deep';
  const infoValueClass = 'text-body-md text-foreground';
  const tableHeadClass = 'text-label-caps uppercase text-on-surface-deep bg-surface-muted';
  const sidebarCardClass = 'bg-surface rounded-md border border-border-subtle p-md';

  const renderIconButton = (label: string, onClick: () => void, icon: React.ReactNode) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="text-on-surface-deep hover:text-primary transition-colors duration-150"
    >
      {icon}
    </Button>
  );

  return (
    <>
      <EnhancedModal
        isOpen={isOpen}
        onClose={onClose}
        title={productName}
        subtitle={`${t('products.details.product_id')}: ${productId || 'N/A'}`}
        variant="default"
        size="xl"
        className="rounded-xl flex flex-col"
        testId="product-details-modal"
        footer={
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={onClose} className="rounded-button">
              {t('products.modal.action.cancel')}
            </Button>
            {onEdit && (
              <Button
                variant="primary"
                onClick={() => { onClose(); onEdit(product); }}
                className="rounded-button"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('products.details.action.edit')}
              </Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">

          {/* Main Content Area (8/12) */}
          <div className="lg:col-span-8 space-y-lg">

            {/* General Info Grid */}
            <section>
              <div className="flex items-center gap-xs mb-md text-primary">
                <Info className="w-5 h-5" />
                <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.general_info')}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-lg gap-x-md">
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('common.status', 'Estado')}</span>
                  <div>
                    <Badge variant={isAvailable ? 'success' : 'destructive'} className="uppercase">
                      {isAvailable
                        ? t('products.state.available', 'Disponible')
                        : t('products.state.unavailable', 'No Disponible')}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.modal.field.category')}</span>
                  <p className={infoValueClass}>{categoryName || '-'}</p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.modal.field.product_type')}</span>
                  <p className={cn(infoValueClass, 'capitalize')}>{(productType || 'PHYSICAL').toLowerCase()}</p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.modal.field.barcode')}</span>
                  <p className={cn(infoValueClass, 'text-data-mono font-data-mono')}>{barcode || '-'}</p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.modal.field.brand')}</span>
                  <p className={infoValueClass}>{brand || '-'}</p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.modal.field.origin')}</span>
                  <p className={infoValueClass}>
                    {origin === 'IMPORTADO' ? t('products.origin.imported') : origin === 'NACIONAL' ? t('products.origin.national') : '-'}
                  </p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.details.field.base_unit', 'Unidad Base')}</span>
                  <p className={cn(infoValueClass, 'uppercase text-data-mono font-data-mono')}>
                    {product.base_unit || '-'}
                  </p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.details.field.tax', 'Impuesto (IVA)')}</span>
                  <p className={cn(infoValueClass, 'text-primary')}>
                    {product.tax?.rate?.tax_name || product.applicable_tax_rate?.tax_name || t('products.details.tax.not_specified', 'No especificado')}
                    {product.tax?.rate?.rate != null ? ` (${product.tax.rate.rate}%)` : ''}
                  </p>
                </div>
                <div className="space-y-xs">
                  <span className={infoLabelClass}>{t('products.details.field.variable_measure', 'Medida Variable')}</span>
                  <p className={infoValueClass}>
                    {product.is_variable_measure ? t('products.details.common.yes', 'Sí') : t('products.details.common.no', 'No')}
                  </p>
                </div>
                {product.is_variable_measure && (
                  <div className="space-y-xs">
                    <span className={infoLabelClass}>{t('products.modal.field.scale_code', 'Código de Balanza')}</span>
                    <p className={cn(infoValueClass, 'text-data-mono font-data-mono')}>
                      {product.scale_code || '-'}
                    </p>
                  </div>
                )}
              </div>
              {description && (
                <div className="mt-lg p-md bg-surface-muted rounded-md">
                  <span className={cn(infoLabelClass, 'block mb-sm')}>{t('products.modal.field.description')}</span>
                  <p className="text-body-md text-on-surface-deep leading-relaxed">{description}</p>
                </div>
              )}
            </section>

            {/* Unit Prices Table */}
            {unitPrices.length > 0 && (
              <section>
                <div className="flex items-center gap-xs mb-sm text-primary">
                  <Layout className="w-5 h-5" />
                  <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.unit_prices')}</h3>
                </div>
                <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                        <TableHead className={tableHeadClass}>{t('products.details.table.unit')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.table.price')}</TableHead>
                        <TableHead className={tableHeadClass}>{t('products.details.table.validity', 'Vigencia')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.table.actions', 'Acciones')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitPrices.map((up: any) => (
                        <TableRow key={up.id} className="hover:bg-surface-muted transition-colors duration-150">
                          <TableCell className="text-body-md text-foreground">
                            <div className="flex items-center gap-sm">
                              <span>{up.unit || '-'}</span>
                              {up.variant_id && (
                                <span className="text-body-sm-bold rounded-full px-2 py-0.5 bg-primary-fixed text-on-primary-fixed">
                                  {variantNameById[up.variant_id] || up.variant_id}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right text-foreground">{formatCurrency(up.price_per_unit)}</TableCell>
                          <TableCell className="text-data-mono font-data-mono text-on-surface-deep">
                            {up.updated_at || up.effective_date ? new Date(up.updated_at || up.effective_date).toLocaleDateString('es') : '-'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {renderIconButton(
                              t('products.details.action.price_history', 'Ver Historial de Precios'),
                              () => {
                                setSelectedUnit(up.unit || 'unit');
                                setIsPriceHistoryOpen(true);
                              },
                              <Clock className="w-4 h-4" />
                            )}
                            {canWrite && renderIconButton(
                              t('products.details.action.adjust_price', 'Ajustar Precio'),
                              () => {
                                setSelectedUnit(up.unit || 'unit');
                                setSelectedValue(up.price_per_unit || 0);
                                setSelectedVariantForRow(up.variant_id || null);
                                setIsPriceAdjustmentOpen(true);
                              },
                              <Edit className="w-4 h-4" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Costs Table — solo con products:cost (PLAN_CATALOGO_VENDEDOR 3.4) */}
            {canViewCosts && unitCostsSummary.length > 0 && (
              <section>
                <div className="flex items-center gap-xs mb-sm text-primary">
                  <Activity className="w-5 h-5" />
                  <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.cost_summary')}</h3>
                </div>
                <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                        <TableHead className={tableHeadClass}>{t('products.details.table.unit')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.label.last_cost')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.label.avg_cost')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.table.variance', 'Variación')}</TableHead>
                        <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.details.table.actions', 'Acciones')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitCostsSummary.map((cs: any, i: number) => (
                        <TableRow key={i} className="hover:bg-surface-muted transition-colors duration-150">
                          <TableCell className="text-body-md text-foreground">{cs.unit || '-'}</TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right text-foreground">{formatCurrency(cs.last_cost)}</TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right text-on-surface-deep">{formatCurrency(cs.weighted_avg_cost_6m)}</TableCell>
                          <TableCell className={cn(
                            'text-data-mono font-data-mono text-right',
                            cs.cost_variance_percent > 0 ? 'text-error' : cs.cost_variance_percent < 0 ? 'text-success' : 'text-on-surface-deep'
                          )}>
                            {cs.cost_variance_percent != null ? `${cs.cost_variance_percent > 0 ? '+' : ''}${cs.cost_variance_percent.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {renderIconButton(
                              t('products.details.action.cost_history', 'Ver Historial de Costos'),
                              () => {
                                setSelectedUnit(cs.unit || 'unit');
                                setIsCostHistoryOpen(true);
                              },
                              <Clock className="w-4 h-4" />
                            )}
                            {canWrite && renderIconButton(
                              t('products.details.action.adjust_cost', 'Ajustar Costo'),
                              () => {
                                setSelectedUnit(cs.unit || 'unit');
                                setSelectedValue(cs.last_cost || 0);
                                setIsCostAdjustmentOpen(true);
                              },
                              <Edit className="w-4 h-4" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Variants Section */}
            <section>
              <div className="flex items-center justify-between mb-sm gap-md">
                <div className="flex items-center gap-xs text-primary">
                  <Package className="w-5 h-5" />
                  <h3 className="text-label-caps uppercase text-on-surface-deep">
                    {hasVariants
                      ? t('products.details.variants.registered', 'Variantes Registradas')
                      : t('products.details.variants.section', 'Variantes')}
                  </h3>
                </div>
                {canWrite && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsVariantsManagerOpen(true)}
                    className="rounded-button"
                  >
                    {t('products.details.variants.manage', 'Administrar variantes, atributos y etiquetas')}
                  </Button>
                )}
              </div>

              {hasVariants ? (
                <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
                  {loadingVariants ? (
                    <div className="p-lg space-y-md" aria-busy="true">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full bg-surface-muted" />
                      ))}
                    </div>
                  ) : variants.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                          <TableHead className={tableHeadClass}>{t('products.details.variants.table.name_sku', 'Nombre / SKU')}</TableHead>
                          <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.variants.table.price', 'Precio')}</TableHead>
                          <TableHead className={cn(tableHeadClass, 'text-right')}>{t('products.table.stock')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((v) => {
                          const isOutOfStock = (v.stock_quantity || 0) <= 0;
                          return (
                            <TableRow key={v.id} className={cn(
                              'transition-colors duration-150',
                              !v.is_active ? 'opacity-50 bg-surface-muted' : 'hover:bg-surface-muted'
                            )}>
                              <TableCell>
                                <div className="text-body-md text-foreground">{v.variant_name}</div>
                                <div className="text-data-mono font-data-mono text-on-surface-deep">{v.sku}</div>
                              </TableCell>
                              <TableCell className="text-data-mono font-data-mono text-right text-foreground">
                                {v.current_price ? formatCurrency(v.current_price) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'text-data-mono font-data-mono rounded-full px-2 py-0.5',
                                  isOutOfStock ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                                )}>
                                  {v.stock_quantity || 0}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-lg text-center text-body-md text-on-surface-deep">
                      {t('products.details.variants.empty', 'Este producto no tiene variantes configuradas.')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-muted rounded-md p-lg text-center">
                  <p className="text-body-md text-foreground mb-xs">
                    {t('products.details.variants.empty', 'Este producto no tiene variantes configuradas.')}
                  </p>
                  <p className="text-body-md text-on-surface-deep">
                    {t('products.details.variants.empty_hint', 'Puedes administrar etiquetas y atributos de este producto, o crear su primera variante.')}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Stats Area (4/12) */}
          <div className="lg:col-span-4 space-y-lg">

            {/* Sale Price Card — dato crítico, jerarquía visual máxima */}
            {salePrice && (
              <div className="space-y-md">
                <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.price', 'Precio de Venta')}</h3>
                <div className={cn(sidebarCardClass, 'bg-primary/5 border-primary/30')}>
                  <div className="font-data-mono text-headline-lg text-primary leading-none break-words">
                    {formatCurrency(salePrice.price_per_unit)}
                  </div>
                  <p className="text-body-sm-bold text-on-surface-deep mt-xs uppercase">
                    {t('products.details.price.per_unit', 'por {unit}', { unit: salePrice.unit || '-' })}
                  </p>
                </div>
              </div>
            )}

            {/* Inventory Card */}
            <div className="space-y-md">
              <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.inventory')}</h3>
              <div className={sidebarCardClass}>
                <div className="flex justify-between items-start mb-md">
                  <div className="size-10 bg-primary-fixed rounded-sm flex items-center justify-center text-on-primary-fixed">
                    <Package className="w-5 h-5" />
                  </div>
                  <Badge variant={stockStatus === 'in_stock' ? 'success' : 'warning'} className="uppercase">
                    {stockStatus === 'in_stock'
                      ? t('products.state.available', 'Disponible')
                      : t('products.details.health.low_stock', 'Stock Bajo')}
                  </Badge>
                </div>

                {hasVariants ? (
                  <div className="space-y-md">
                    <div>
                      <div className="font-data-mono text-headline-lg text-foreground leading-none">{totalConsolidatedStock}</div>
                      <p className="text-body-sm-bold text-on-surface-deep mt-xs">{t('products.details.inventory.total_stock', 'Stock Total (Base + Variantes)')}</p>
                    </div>
                    <div className="pt-sm border-t border-border-subtle">
                      <div className="font-data-mono text-title-md text-foreground leading-none">{baseStock}</div>
                      <p className="text-body-sm-bold text-on-surface-deep mt-xs">{t('products.details.inventory.base_stock', 'Stock Base (Sin Variantes)')}</p>
                    </div>
                    <div className="mt-auto pt-sm border-t border-border-subtle bg-surface-muted -mx-md -mb-md px-md py-md rounded-b-md flex justify-between items-center">
                      <span className="text-label-caps uppercase text-on-surface-deep">{t('products.details.inventory.variants_stock', 'Stock en Variantes')}</span>
                      <span className="font-data-mono text-title-md text-primary">{variantsTotalStock}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-data-mono text-headline-lg text-foreground leading-none">{stockQuantity}</div>
                    <p className="text-body-sm-bold text-on-surface-deep mt-xs">{t('products.details.inventory.base_product', 'Stock del producto base')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profit Margin Card — solo con products:cost (PLAN_CATALOGO_VENDEDOR 3.4) */}
            {canViewCosts && bestMarginUnit && (
              <div className="space-y-md">
                <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.performance', 'Rendimiento')}</h3>
                <div className={cn(sidebarCardClass, 'bg-success/10 border-success/30')}>
                  <div className="flex items-center gap-xs text-success mb-sm">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-label-caps uppercase">{t('products.details.label.best_margin')}</span>
                  </div>
                  <div className="font-data-mono text-title-md text-success">{bestMarginPercent?.toFixed(2)}%</div>
                  <p className="text-body-sm-bold text-on-surface-deep mt-xs uppercase">
                    {t('products.details.best_margin_basis', { unit: bestMarginUnit })}
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Checklist */}
            <div className="space-y-md">
              <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.details.section.configuration', 'Configuración')}</h3>
              <div className={cn(sidebarCardClass, 'space-y-md')}>
                {[
                  { label: t('products.details.health.has_prices'), checked: hasPrices, icon: <Layout className="w-4 h-4" /> },
                  // El estado de costos es dato gated: oculto sin products:cost.
                  ...(canViewCosts
                    ? [{ label: t('products.details.health.has_costs'), checked: hasCosts, icon: <Activity className="w-4 h-4" /> }]
                    : []),
                  { label: t('products.details.health.has_stock', 'Inventario Base'), checked: hasStock, icon: <Package className="w-4 h-4" /> }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-sm">
                    <div className="flex items-center gap-sm">
                      <div className={cn('p-1.5 rounded-sm', item.checked ? 'text-success' : 'text-on-surface-deep')}>
                        {item.icon}
                      </div>
                      <span className={cn('text-body-md', item.checked ? 'text-foreground' : 'text-on-surface-deep line-through')}>{item.label}</span>
                    </div>
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-success" aria-label={t('products.details.common.yes', 'Sí')} />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" aria-label={t('products.details.health.low_stock', 'Stock Bajo')} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Health Status — evalúa costos: solo con products:cost */}
            {canViewCosts && (
              <div className={cn(
                'p-md rounded-md flex items-center gap-sm border',
                hasPrices && hasCosts
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-warning/10 text-warning border-warning/30'
              )}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="text-body-md-bold leading-tight">
                  {hasPrices && hasCosts
                    ? t('products.details.financial.complete', 'Producto con configuración financiera completa')
                    : t('products.details.financial.incomplete', 'Requiere revisión de configuración financiera')}
                </div>
              </div>
            )}
          </div>
        </div>
      </EnhancedModal>

      {/* Sub-modals for pricing and cost transactions */}
      {isPriceHistoryOpen && (
        <ProductPriceHistoryDialog
          productId={productId}
          productName={productName}
          variantNameById={variantNameById}
          isOpen={isPriceHistoryOpen}
          onClose={() => setIsPriceHistoryOpen(false)}
        />
      )}

      {isCostHistoryOpen && (
        <ProductCostHistoryDialog
          productId={productId}
          productName={productName}
          isOpen={isCostHistoryOpen}
          onClose={() => setIsCostHistoryOpen(false)}
        />
      )}

      {isPriceAdjustmentOpen && (
        <ProductPriceAdjustmentDialog
          productId={productId}
          productName={productName}
          currentPriceOrCost={selectedValue}
          unit={selectedUnit}
          variantId={selectedVariantForRow}
          variantName={selectedVariantForRow ? variantNameById[selectedVariantForRow] : undefined}
          isOpen={isPriceAdjustmentOpen}
          onClose={() => setIsPriceAdjustmentOpen(false)}
          onSuccess={() => {
            // Se puede emitir un evento para refrescar los datos o usar toast.
          }}
        />
      )}

      {isCostAdjustmentOpen && (
        <ProductCostAdjustmentDialog
          productId={productId}
          productName={productName}
          currentPriceOrCost={selectedValue}
          unit={selectedUnit}
          isOpen={isCostAdjustmentOpen}
          onClose={() => setIsCostAdjustmentOpen(false)}
          onSuccess={() => {
            // Se puede emitir un evento para refrescar los datos o usar toast.
          }}
        />
      )}

      {isVariantsManagerOpen && (
        <VariantsManagerModal
          isOpen={isVariantsManagerOpen}
          onClose={() => setIsVariantsManagerOpen(false)}
          product={product}
        />
      )}
    </>
  );
}
