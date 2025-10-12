import React from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Component that displays a product with financial information
 * Demonstrates usage of the new financial enriched product data
 */
const FinancialProductCard = ({ product, onViewDetails, className = "" }) => {
  if (!product) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(amount);
  };

  const formatPercentage = (percent) => {
    if (percent == null) return 'N/A';
    return `${percent.toFixed(1)}%`;
  };

  const getFinancialHealthStatus = () => {
    if (!product.financial_health) return 'unknown';
    
    const { has_prices, has_costs, has_stock } = product.financial_health;
    
    if (has_prices && has_costs && has_stock) {
      return 'healthy';
    } else if (has_prices && has_costs) {
      return 'partial';
    } else {
      return 'incomplete';
    }
  };

  const getFinancialHealthConfig = () => {
    const status = getFinancialHealthStatus();
    
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          label: 'Completo',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          label: 'Sin stock',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'incomplete':
        return {
          icon: AlertTriangle,
          label: 'Incompleto',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Package,
          label: 'Sin datos',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getMarginColor = (margin) => {
    if (margin == null) return 'text-gray-500';
    if (margin < 20) return 'text-red-600';
    if (margin < 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMarginIcon = (margin) => {
    if (margin == null) return null;
    return margin >= 20 ? TrendingUp : TrendingDown;
  };

  const healthConfig = getFinancialHealthConfig();
  const HealthIcon = healthConfig.icon;
  const MarginIcon = getMarginIcon(product.best_margin_percent);

  return (
    <div className={`bg-white border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Product Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {product.product_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            ID: {product.product_id}
            {product.barcode && ` • Código: ${product.barcode}`}
          </p>
          {product.category_name && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2">
              {product.category_name}
            </span>
          )}
        </div>
        
        {/* Financial Health Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${healthConfig.bgColor} ${healthConfig.borderColor} border`}>
          <HealthIcon className={`w-4 h-4 ${healthConfig.color}`} />
          <span className={`text-sm font-medium ${healthConfig.color}`}>
            {healthConfig.label}
          </span>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Prices */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Precios de Venta</h4>
          {product.unit_prices && product.unit_prices.length > 0 ? (
            <div className="space-y-1">
              {product.unit_prices.slice(0, 2).map((price, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{price.unit}:</span>
                  <span className="font-medium">{formatCurrency(price.price_per_unit)}</span>
                </div>
              ))}
              {product.unit_prices.length > 2 && (
                <p className="text-xs text-gray-500">+{product.unit_prices.length - 2} más</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sin precios configurados</p>
          )}
        </div>

        {/* Costs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Costos</h4>
          {product.unit_costs_summary && product.unit_costs_summary.length > 0 ? (
            <div className="space-y-1">
              {product.unit_costs_summary.slice(0, 2).map((cost, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cost.unit}:</span>
                  <span className="font-medium">{formatCurrency(cost.last_cost)}</span>
                </div>
              ))}
              {product.unit_costs_summary.length > 2 && (
                <p className="text-xs text-gray-500">+{product.unit_costs_summary.length - 2} más</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sin costos registrados</p>
          )}
        </div>
      </div>

      {/* Stock and Margin */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          {/* Stock */}
          <div className="text-sm">
            <span className="text-gray-600">Stock: </span>
            <span className={`font-medium ${
              product.stock_quantity > 20 ? 'text-green-600' :
              product.stock_quantity > 5 ? 'text-yellow-600' :
              product.stock_quantity > 0 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {product.stock_quantity ?? 'N/A'}
            </span>
          </div>

          {/* Best Margin */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">Margen: </span>
            {MarginIcon && <MarginIcon className={`w-4 h-4 ${getMarginColor(product.best_margin_percent)}`} />}
            <span className={`font-medium ${getMarginColor(product.best_margin_percent)}`}>
              {formatPercentage(product.best_margin_percent)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <Button 
          onClick={() => onViewDetails?.(product)}
          size="sm"
          variant="outline"
        >
          Ver detalles
        </Button>
      </div>

      {/* Match Score (if from search) */}
      {product.match_score && (
        <div className="mt-2 flex items-center justify-end">
          <span className="text-xs text-gray-500">
            Relevancia: {(product.match_score * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default FinancialProductCard;
