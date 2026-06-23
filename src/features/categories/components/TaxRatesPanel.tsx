import React, { useEffect } from 'react';
import useTaxRateStore from '@/store/useTaxRateStore';

export function TaxRatesPanel() {
  const { taxRates, fetchTaxRates, loading } = useTaxRateStore();

  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  return (
    <div className="flex flex-col bg-surface rounded-[16px] shadow-sm border border-outline-variant/30 p-lg">
      <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
        <div>
          <h2 className="text-title-md font-title-md text-on-surface font-bold">Tasas de IVA y Clasificación SIFEN</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Administra los impuestos y su relación con facturación electrónica.</p>
        </div>
        <button type="button" className="btn-secondary px-md py-xs rounded-lg text-body-sm font-bold flex items-center gap-xs shrink-0 ml-sm hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span> Nueva Tasa
        </button>
      </div>
      
      <div className="overflow-x-auto relative min-h-[150px] mt-2">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-10 rounded-lg">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b-2 border-outline-variant/20">
              <th className="p-md text-label-caps font-label-caps text-on-surface-variant rounded-tl-[12px] font-bold w-1/4">Código SIFEN</th>
              <th className="p-md text-label-caps font-label-caps text-on-surface-variant font-bold w-1/3">Nombre del Impuesto</th>
              <th className="p-md text-label-caps font-label-caps text-on-surface-variant font-bold text-center">Tasa Aplicada</th>
              <th className="p-md text-label-caps font-label-caps text-on-surface-variant rounded-tr-[12px] font-bold text-right">Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {taxRates.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="p-xl text-center text-on-surface-variant text-body-md border-b border-outline-variant/10">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-50">receipt_long</span>
                    No hay tasas de IVA configuradas.
                  </div>
                </td>
              </tr>
            ) : (
              taxRates.map((rate: any) => (
                <tr key={rate.id} className="group transition-colors hover:bg-surface-container-low/50 border-b border-outline-variant/10">
                  <td className="p-md text-body-md font-mono text-on-surface-variant">
                    {rate.code || `IVA-${rate.id}`}
                  </td>
                  <td className="p-md text-body-md font-bold text-on-surface">
                    {rate.tax_name || rate.name}
                  </td>
                  <td className="p-md text-center">
                    <span className="inline-flex items-center justify-center px-sm py-[2px] rounded-full bg-primary/10 text-primary font-bold text-body-sm">
                      {rate.rate}%
                    </span>
                  </td>
                  <td className="p-md text-right">
                    <span className={`inline-flex items-center justify-center px-sm py-[2px] rounded-full text-body-sm font-medium ${
                      rate.rate === 0 
                        ? 'bg-surface-container-high text-on-surface-variant' 
                        : 'bg-green-500/10 text-green-700 dark:text-green-400'
                    }`}>
                      {rate.rate === 0 ? 'Exento' : 'Gravado'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info card for SIFEN */}
      <div className="mt-md">
        <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/20 flex gap-md items-start">
          <div className="bg-primary/10 p-sm rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[24px]">info</span>
          </div>
          <div>
            <h3 className="text-title-sm font-bold text-on-surface">Sincronización Automática SIFEN</h3>
            <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
              Las tasas de IVA configuradas en este panel se mapearán automáticamente a los códigos oficiales de la SET al momento de emitir Documentos Electrónicos (KUDE). Asegúrate de que los porcentajes coincidan con las normativas vigentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxRatesPanel;
