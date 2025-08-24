/**
 * PurchaseCard - Card Enterprise con Todas las Acciones
 * Wave 1: Arquitectura Base Sólida  
 * Card completo para purchases con acciones contextuales y estados visuales
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Eye, 
  Edit2, 
  X, 
  CreditCard, 
  Package, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Store y hooks
import usePurchaseStore from '@/store/usePurchaseStore';
import { useI18n } from '@/lib/i18n';

// Types y constantes
import { PURCHASE_STATUS, PAYMENT_STATUS } from '@/types/purchaseTypes';
import { formatErrorMessage } from '@/constants/purchaseErrors';

/**
 * @typedef {Object} PurchaseCardProps
 * @property {Object} purchase - Datos de la orden de compra
 * @property {function} onView - Callback para ver detalles
 * @property {function} onEdit - Callback para editar
 * @property {function} onCancel - Callback para cancelar
 * @property {function} onPayment - Callback para procesar pago
 * @property {boolean} compact - Si debe mostrar versión compacta
 * @property {boolean} selectable - Si es seleccionable
 * @property {boolean} selected - Si está seleccionado
 * @property {function} onSelect - Callback al seleccionar
 */

/**
 * Card enterprise para mostrar órdenes de compra
 */
const PurchaseCard = ({
  purchase,
  onView,
  onEdit,
  onCancel,
  onPayment,
  compact = false,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const { t } = useI18n();
  const { isUpdating, cancelPurchase } = usePurchaseStore();
  const [showActions, setShowActions] = useState(false);

  // Estados derivados
  const canEdit = useMemo(() => {
    return purchase.status === PURCHASE_STATUS.PENDING;
  }, [purchase.status]);

  const canCancel = useMemo(() => {
    return [PURCHASE_STATUS.PENDING, PURCHASE_STATUS.CONFIRMED].includes(purchase.status);
  }, [purchase.status]);

  const canPay = useMemo(() => {
    return [PURCHASE_STATUS.CONFIRMED, PURCHASE_STATUS.PENDING].includes(purchase.status);
  }, [purchase.status]);

  // Formateo de datos
  const formattedDate = useMemo(() => {
    return new Date(purchase.created_at).toLocaleDateString();
  }, [purchase.created_at]);

  const statusConfig = useMemo(() => {
    const configs = {
      [PURCHASE_STATUS.PENDING]: {
        variant: 'secondary',
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      [PURCHASE_STATUS.CONFIRMED]: {
        variant: 'default',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      [PURCHASE_STATUS.COMPLETED]: {
        variant: 'default',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      [PURCHASE_STATUS.CANCELLED]: {
        variant: 'destructive',
        icon: X,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    };
    return configs[purchase.status] || configs[PURCHASE_STATUS.PENDING];
  }, [purchase.status]);

  const priorityConfig = useMemo(() => {
    if (!purchase.metadata?.purchase_priority) return null;
    
    const configs = {
      high: { color: 'text-red-600', bg: 'bg-red-50' },
      medium: { color: 'text-yellow-600', bg: 'bg-yellow-50' },
      low: { color: 'text-green-600', bg: 'bg-green-50' }
    };
    return configs[purchase.metadata.purchase_priority];
  }, [purchase.metadata?.purchase_priority]);

  // Handlers
  const handleView = useCallback((e) => {
    e.stopPropagation();
    onView?.(purchase);
  }, [onView, purchase]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit?.(purchase);
  }, [onEdit, purchase]);

  const handleCancel = useCallback(async (e) => {
    e.stopPropagation();
    
    if (window.confirm(t('purchases.confirm.cancel_order'))) {
      try {
        const result = await cancelPurchase(purchase.id, 'Cancelled by user');
        if (result.success) {
          onCancel?.(purchase);
        }
      } catch (error) {
        console.error('Error cancelling purchase:', error);
      }
    }
  }, [cancelPurchase, purchase, onCancel, t]);

  const handlePayment = useCallback((e) => {
    e.stopPropagation();
    onPayment?.(purchase);
  }, [onPayment, purchase]);

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    onSelect?.(purchase, !selected);
  }, [onSelect, purchase, selected]);

  const handleCardClick = useCallback(() => {
    if (selectable) {
      handleSelect();
    } else {
      handleView();
    }
  }, [selectable, handleSelect, handleView]);

  const StatusIcon = statusConfig.icon;

  return (
    <TooltipProvider>
      <Card 
        className={`
          transition-all duration-200 cursor-pointer
          hover:shadow-md hover:border-gray-300
          ${selected ? 'ring-2 ring-blue-500 border-blue-300' : ''}
          ${compact ? 'p-3' : 'p-4'}
        `}
        onClick={handleCardClick}
      >
        <CardHeader className={`${compact ? 'pb-2' : 'pb-3'}`}>
          <div className="flex items-start justify-between">
            {/* Información Principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Checkbox para selección */}
                {selectable && (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={handleSelect}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                {/* ID de la orden */}
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {t('purchases.order_id')}: #{purchase.id}
                </h3>

                {/* Status */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.color}`} />
                  <Badge variant={statusConfig.variant} className="text-xs">
                    {t(`purchases.status.${purchase.status}`)}
                  </Badge>
                </div>

                {/* Priority */}
                {priorityConfig && (
                  <div className={`inline-flex items-center px-2 py-1 rounded-full ${priorityConfig.bg}`}>
                    <span className={`text-xs font-medium ${priorityConfig.color}`}>
                      {t(`purchases.priority.${purchase.metadata.purchase_priority}`)}
                    </span>
                  </div>
                )}
              </div>

              {/* Supplier */}
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Package className="h-4 w-4 mr-1" />
                <span className="font-medium">
                  {purchase.supplier_name || `Supplier ${purchase.supplier_id}`}
                </span>
              </div>

              {/* Fecha */}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formattedDate}</span>
                {purchase.user_id && (
                  <>
                    <User className="h-4 w-4 ml-3 mr-1" />
                    <span>{purchase.user_id}</span>
                  </>
                )}
              </div>
            </div>

            {/* Monto Total */}
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-green-600">
                ${purchase.total_amount?.toFixed(2) || '0.00'}
              </div>
              {purchase.purchase_items && (
                <div className="text-sm text-gray-500">
                  {purchase.purchase_items.length} {t('purchases.items')}
                </div>
              )}
            </div>

            {/* Menu de Acciones */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('common.actions')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Ver Detalles */}
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('purchases.actions.view_details')}
                </DropdownMenuItem>

                {/* Editar */}
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('purchases.actions.edit')}
                  </DropdownMenuItem>
                )}

                {/* Procesar Pago */}
                {canPay && (
                  <DropdownMenuItem onClick={handlePayment}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t('purchases.actions.process_payment')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Cancelar */}
                {canCancel && (
                  <DropdownMenuItem 
                    onClick={handleCancel}
                    className="text-red-600 focus:text-red-600"
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('purchases.actions.cancel')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {!compact && (
          <CardContent>
            {/* Items Preview */}
            {purchase.purchase_items && purchase.purchase_items.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('purchases.items_preview')}:
                </h4>
                <div className="space-y-1">
                  {purchase.purchase_items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">
                        {item.product_name || item.product_id}
                      </span>
                      <span className="font-medium ml-2">
                        {item.quantity} × ${item.unit_price?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {purchase.purchase_items.length > 3 && (
                    <div className="text-sm text-gray-500 italic">
                      +{purchase.purchase_items.length - 3} {t('purchases.more_items')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Info */}
            {purchase.metadata && (
              <div className="border-t pt-3 space-y-2">
                {/* Delivery Date */}
                {purchase.metadata.delivery_date && (
                  <div className="text-sm">
                    <span className="text-gray-500">
                      {t('purchases.fields.delivery_date')}:
                    </span>
                    <span className="ml-2 font-medium">
                      {new Date(purchase.metadata.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {purchase.metadata.notes && (
                  <div className="text-sm">
                    <span className="text-gray-500">
                      {t('purchases.fields.notes')}:
                    </span>
                    <span className="ml-2 text-gray-700 italic">
                      {purchase.metadata.notes.length > 50 
                        ? `${purchase.metadata.notes.substring(0, 50)}...`
                        : purchase.metadata.notes
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('purchases.actions.view')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('purchases.actions.view_details')}
                </TooltipContent>
              </Tooltip>

              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {t('purchases.actions.edit')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('purchases.actions.edit_order')}
                  </TooltipContent>
                </Tooltip>
              )}

              {canPay && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePayment}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      {t('purchases.actions.pay')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('purchases.actions.process_payment')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
};

export default React.memo(PurchaseCard);
