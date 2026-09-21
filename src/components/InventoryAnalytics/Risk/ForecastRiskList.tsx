import React from 'react';
import { useI18n } from '@/lib/i18n';
import { StockForecastProduct } from '../../../types/inventoryAnalytics';
import { formatNumber } from '../../../utils/currencyUtils';

export interface ForecastRiskListProps {
  products: StockForecastProduct[];
}

export const ForecastRiskList: React.FC<ForecastRiskListProps> = ({ products }) => {
  const { t } = useI18n();

  // H7: los botones por carda ejecutaban alert() — fuera; el riesgo es
  // informativo hasta que exista flujo real de orden de compra.
  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'HIGH': return {
        border: 'border-error',
        badgeBg: 'bg-error/10',
        badgeText: 'text-error',
        daysText: 'text-error',
        label: t('bi.inventory.risk.riskHigh', 'Alto', {}),
      };
      case 'MEDIUM': return {
        border: 'border-warning',
        badgeBg: 'bg-warning/10',
        badgeText: 'text-warning',
        daysText: 'text-warning',
        label: t('bi.inventory.risk.riskMedium', 'Medio', {}),
      };
      case 'LOW': return {
        border: 'border-success',
        badgeBg: 'bg-success/10',
        badgeText: 'text-success',
        daysText: 'text-success',
        label: t('bi.inventory.risk.riskLow', 'Bajo', {}),
      };
      default: return {
        border: 'border-border-subtle',
        badgeBg: 'bg-surface-muted',
        badgeText: 'text-on-surface-deep',
        daysText: 'text-on-surface-deep',
        label: t('bi.inventory.risk.riskNormal', 'Normal', {}),
      };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          {t('bi.inventory.risk.forecastTitle', 'Pronóstico de Agotamiento', {})}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const styles = getRiskStyles(product.risk);
          return (
            <div key={product.product_id} className={`bg-surface p-4 rounded-lg border-l-4 ${styles.border} border border-border-subtle shadow-sm hover:shadow-whisper transition-all`}>
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="font-bold text-foreground leading-tight">{product.product_name}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${styles.badgeText} px-2 py-0.5 ${styles.badgeBg} rounded border border-current/10 shrink-0`}>
                  {t('bi.inventory.risk.riskLabel', 'Riesgo {level}', { level: styles.label })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex flex-col border-r border-border-subtle">
                  <span className="text-on-surface-deep text-[10px] uppercase font-bold tracking-tight">{t('bi.inventory.risk.col.daysToStockout', 'Días para Agotamiento', {})}</span>
                  <span className={`${styles.daysText} font-black text-lg font-mono`}>
                    {t('bi.inventory.days', '{n} días', { n: formatNumber(product.days_until_stockout) })}
                  </span>
                </div>
                <div className="flex flex-col pl-2">
                  <span className="text-on-surface-deep text-[10px] uppercase font-bold tracking-tight">{t('bi.inventory.risk.col.currentStock', 'Stock Actual', {})}</span>
                  <span className="font-bold text-foreground text-lg font-mono">
                    {product.current_stock || 0} <span className="text-[10px] font-normal font-display">{t('bi.inventory.units', 'uds.', {})}</span>
                  </span>
                </div>
              </div>

              <div className="bg-surface-muted rounded-lg p-2 border border-border-subtle">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-deep font-bold uppercase">{t('bi.inventory.risk.suggestedOrder', 'Pedido Sugerido:', {})}</span>
                  <span className="text-primary font-black font-mono">
                    {t('bi.inventory.risk.suggestedUnits', '+{n} unidades', { n: product.recommended_order || 0 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
