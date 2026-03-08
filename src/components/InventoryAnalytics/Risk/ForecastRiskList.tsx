import React from 'react';
import { StockForecastProduct } from '../../../types/inventoryAnalytics';

export interface ForecastRiskListProps {
  products: StockForecastProduct[];
}

export const ForecastRiskList: React.FC<ForecastRiskListProps> = ({ products }) => {
  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'HIGH': return { 
        border: 'border-red-500', 
        badgeBg: 'bg-red-50 dark:bg-red-900/20', 
        badgeText: 'text-red-600',
        daysText: 'text-red-600',
        label: 'Alto',
        button: 'bg-primary/10 text-primary hover:bg-primary hover:text-white',
        buttonLabel: 'Generar OC Urgente'
      };
      case 'MEDIUM': return { 
        border: 'border-orange-500', 
        badgeBg: 'bg-orange-50 dark:bg-orange-900/20', 
        badgeText: 'text-orange-600',
        daysText: 'text-orange-600',
        label: 'Medio',
        button: 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200',
        buttonLabel: 'Revisar Demanda'
      };
      case 'LOW': return { 
        border: 'border-emerald-500', 
        badgeBg: 'bg-emerald-50 dark:bg-emerald-900/20', 
        badgeText: 'text-emerald-600',
        daysText: 'text-emerald-600',
        label: 'Bajo',
        button: 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200',
        buttonLabel: 'Ver Historial'
      };
      default: return { 
        border: 'border-slate-300', 
        badgeBg: 'bg-slate-100', 
        badgeText: 'text-slate-500',
        daysText: 'text-slate-500',
        label: 'Normal',
        button: 'bg-slate-100 text-slate-600',
        buttonLabel: 'Detalles'
      };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Pronóstico de Agotamiento
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        {products.map((product) => {
          const styles = getRiskStyles(product.risk);
          return (
            <div key={product.product_id} className={`bg-white dark:bg-slate-900 p-4 rounded-lg border-l-4 ${styles.border} border border-slate-200 dark:border-slate-800 shadow-sm`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-900 dark:text-white">{product.product_name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.badgeText} px-2 py-0.5 ${styles.badgeBg} rounded`}>
                  {styles.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs">Días restantes</span>
                  <span className={`${styles.daysText} font-bold`}>{product.days_until_stockout} días</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs">Stock Proyectado</span>
                  <span className="font-medium">{product.forecasted_stock} unidades</span>
                </div>
              </div>
              <button className={`w-full py-1.5 text-xs font-bold rounded border border-transparent transition-all ${styles.button}`}>
                {styles.buttonLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
