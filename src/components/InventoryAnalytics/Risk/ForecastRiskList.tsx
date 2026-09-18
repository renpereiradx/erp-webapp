import React from 'react';
import { StockForecastProduct } from '../../../types/inventoryAnalytics';
import { formatNumber } from '../../../utils/currencyUtils';

export interface ForecastRiskListProps {
  products: StockForecastProduct[];
}

export const ForecastRiskList: React.FC<ForecastRiskListProps> = ({ products }) => {
  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'HIGH': return { 
        border: 'border-error', 
        badgeBg: 'bg-error/10 dark:bg-error/10/20', 
        badgeText: 'text-error',
        daysText: 'text-error',
        label: 'Alto',
        button: 'bg-primary/10 text-primary hover:bg-primary hover:text-white',
        buttonLabel: 'Generar OC Urgente'
      };
      case 'MEDIUM': return { 
        border: 'border-warning', 
        badgeBg: 'bg-warning/10 dark:bg-warning/10/20', 
        badgeText: 'text-warning',
        daysText: 'text-warning',
        label: 'Medio',
        button: 'bg-surface-muted dark:bg-surface-deep text-on-surface-deep hover:bg-surface-subtle',
        buttonLabel: 'Revisar Demanda'
      };
      case 'LOW': return { 
        border: 'border-success', 
        badgeBg: 'bg-success/10 dark:bg-success/10/20', 
        badgeText: 'text-success',
        daysText: 'text-success',
        label: 'Bajo',
        button: 'bg-surface-muted dark:bg-surface-deep text-on-surface-deep hover:bg-surface-subtle',
        buttonLabel: 'Ver Historial'
      };
      default: return { 
        border: 'border-border-subtle', 
        badgeBg: 'bg-surface-muted', 
        badgeText: 'text-on-surface-deep',
        daysText: 'text-on-surface-deep',
        label: 'Normal',
        button: 'bg-surface-muted text-on-surface-deep',
        buttonLabel: 'Detalles'
      };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Pronóstico de Agotamiento
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const styles = getRiskStyles(product.risk);
          return (
            <div key={product.product_id} className={`bg-surface dark:bg-inverse-background p-4 rounded-lg border-l-4 ${styles.border} border border-border-subtle dark:border-border-subtle shadow-sm hover:shadow-whisper transition-all`}>
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="font-bold text-foreground leading-tight">{product.product_name}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${styles.badgeText} px-2 py-0.5 ${styles.badgeBg} rounded border border-current/10 shrink-0`}>
                  Riesgo {styles.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex flex-col border-r border-border-subtle">
                  <span className="text-on-surface-deep text-[10px] uppercase font-bold tracking-tight">Días para Agotamiento</span>
                  <span className={`${styles.daysText} font-black text-lg font-mono`}>{formatNumber(product.days_until_stockout)} días</span>
                </div>
                <div className="flex flex-col pl-2">
                  <span className="text-on-surface-deep text-[10px] uppercase font-bold tracking-tight">Stock Actual</span>
                  <span className="font-bold text-foreground text-lg font-mono">{product.current_stock || 0} <span className="text-[10px] font-normal font-display">uds.</span></span>
                </div>
              </div>

              <div className="bg-surface-muted rounded-lg p-2 mb-3 border border-border-subtle">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-deep font-bold uppercase">Pedido Sugerido:</span>
                  <span className="text-primary font-black font-mono">+{product.recommended_order || 0} unidades</span>
                </div>
              </div>

              <button 
                onClick={() => alert(`Iniciando orden de compra para: ${product.product_name}`)}
                className={`w-full py-2 text-xs font-black rounded uppercase tracking-widest transition-all shadow-sm ${styles.button}`}
              >
                {styles.buttonLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
