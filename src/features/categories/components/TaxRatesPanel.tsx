import React, { useEffect, useState } from 'react';
import useTaxRateStore from '@/store/useTaxRateStore';
import { taxClassificationService } from '@/services/taxClassificationService';
import { productService } from '@/services/productService';
import { toast } from 'sonner';
import { SifenCodeInfo } from '@/types';

interface TaxRatesPanelProps {
  selectedCategory?: any;
}

export function TaxRatesPanel({ selectedCategory }: TaxRatesPanelProps) {
  const { taxRates, fetchTaxRates, loading: loadingRates } = useTaxRateStore();
  const [sifenCodes, setSifenCodes] = useState<SifenCodeInfo[]>([]);
  const [selectedSifenCode, setSelectedSifenCode] = useState('');
  const [detectedSifenCode, setDetectedSifenCode] = useState('');
  const [applyingClassification, setApplyingClassification] = useState(false);
  const [checkingClassification, setCheckingClassification] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    fetchTaxRates();
    
    // Cargar códigos SIFEN del backend
    setLoadingCodes(true);
    taxClassificationService.getInfo()
      .then(res => {
        const codes = Array.isArray(res) ? res : (res?.data || []);
        setSifenCodes(codes);
      })
      .catch(err => {
        console.error("Error al cargar códigos SIFEN:", err);
      })
      .finally(() => {
        setLoadingCodes(false);
      });
  }, [fetchTaxRates]);

  // Buscar clasificación actual en productos de la categoría seleccionada
  useEffect(() => {
    if (selectedCategory && selectedCategory.id) {
      setCheckingClassification(true);
      setDetectedSifenCode('');
      
      productService.searchAdvanced({ category_id: Number(selectedCategory.id), page_size: 1 })
        .then(async (res) => {
          const products = res.data || [];
          if (products.length > 0) {
            const firstProduct = products[0];
            const productId = firstProduct.id || firstProduct.product_id;
            
            try {
              const classification = await taxClassificationService.getByProductId(String(productId));
              if (classification && classification.classification_code) {
                setDetectedSifenCode(classification.classification_code);
              }
            } catch (err) {
              console.log("El producto de muestra no tiene clasificación fiscal activa", err);
            }
          }
        })
        .catch(err => {
          console.error("Error al buscar productos para clasificar:", err);
        })
        .finally(() => {
          setCheckingClassification(false);
        });
    } else {
      setDetectedSifenCode('');
      setCheckingClassification(false);
    }
  }, [selectedCategory]);

  // Pre-seleccionar código SIFEN basado en la tasa de IVA por defecto de la categoría o el detectado en productos
  useEffect(() => {
    if (detectedSifenCode) {
      setSelectedSifenCode(detectedSifenCode);
    } else if (selectedCategory && sifenCodes.length > 0) {
      const defaultRateId = selectedCategory.default_tax_rate_id;
      if (defaultRateId) {
        const matchedCode = sifenCodes.find(c => c.default_tax_rate_id === defaultRateId);
        if (matchedCode) {
          setSelectedSifenCode(matchedCode.code);
        } else {
          setSelectedSifenCode('GENERAL'); // Fallback razonable
        }
      } else {
        setSelectedSifenCode('');
      }
    } else {
      setSelectedSifenCode('');
    }
  }, [selectedCategory, sifenCodes, detectedSifenCode]);

  const handleAutoClassify = async () => {
    if (!selectedCategory || !selectedSifenCode) return;
    setApplyingClassification(true);
    setShowConfirmModal(false);
    
    try {
      const res = await taxClassificationService.autoClassify({
        category_id: Number(selectedCategory.id),
        classification_code: selectedSifenCode
      });
      
      if (res.success) {
        toast.success(res.message || `Clasificación ${selectedSifenCode} aplicada con éxito a ${res.classified_count || 0} productos.`);
        setDetectedSifenCode(selectedSifenCode);
      } else {
        toast.success(`Clasificación ${selectedSifenCode} ejecutada para la categoría.`);
        setDetectedSifenCode(selectedSifenCode);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al aplicar clasificación fiscal a la categoría');
    } finally {
      setApplyingClassification(false);
    }
  };

  const loading = loadingRates || loadingCodes;

  return (
    <div className="flex flex-col bg-surface rounded-[16px] shadow-sm border border-outline-variant/30 p-lg relative">
      <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
        <div>
          <h2 className="text-title-md font-title-md text-on-surface font-bold">Tasas de IVA y Clasificación SIFEN</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Administra los impuestos y su relación con facturación electrónica.</p>
        </div>
      </div>

      {/* Bloque de Clasificación SIFEN acoplado a la Categoría Seleccionada */}
      {selectedCategory ? (
        <div className="bg-slate-50 border border-primary/10 p-md rounded-2xl mb-lg space-y-3.5 transition-all">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">folder_open</span> Configuración Fiscal: {selectedCategory.name}
            </h3>
            <div className="flex items-center gap-2">
              {/* Badge del Estado de Clasificación detectado en los productos de la categoría */}
              {detectedSifenCode ? (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">verified</span> SIFEN: {detectedSifenCode}
                </span>
              ) : checkingClassification ? (
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined animate-spin text-[10px]">autorenew</span> Verificando...
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">warning</span> Sin Clasificación
                </span>
              )}
              {selectedCategory.default_tax_rate_id ? (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  Tasa Default: {taxRates.find((r: any) => r.id === selectedCategory.default_tax_rate_id)?.rate}%
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Sin Tasa
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Clasificación SIFEN para Productos
              </label>
              <div className="relative">
                <select
                  className="w-full h-9 pl-3 pr-10 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                  value={selectedSifenCode}
                  onChange={e => setSelectedSifenCode(e.target.value)}
                  disabled={applyingClassification}
                >
                  <option value="">Seleccionar clasificación...</option>
                  {sifenCodes.map(code => (
                    <option key={code.code} value={code.code}>
                      {code.code} - {code.name} ({code.default_rate_percent}%)
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedSifenCode || applyingClassification}
              className="bg-primary hover:bg-primary/95 text-white h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md disabled:opacity-50 transition-all shrink-0 w-full md:w-auto justify-center"
            >
              {applyingClassification ? (
                <span className="material-symbols-outlined animate-spin text-[16px]">autorenew</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">bolt</span>
              )}
              {detectedSifenCode ? 'Actualizar Clasificación' : 'Auto-Clasificar Productos'}
            </button>
          </div>
          {detectedSifenCode ? (
            <p className="text-[10px] text-green-600 bg-green-50/50 p-2 rounded-lg border border-green-100/30 leading-normal flex items-start gap-1">
              <span className="material-symbols-outlined text-[12px] mt-0.5">info</span>
              Esta categoría ya tiene aplicada la clasificación <b>{detectedSifenCode}</b>. Puedes volver a clasificar si añadiste nuevos productos sin asignar o si deseas cambiar el código impositivo para todo el grupo.
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 italic leading-normal">
              La auto-clasificación aplicará masivamente el código SIFEN y la tasa impositiva correspondiente a todos los productos actuales de la categoría <b>{selectedCategory.name}</b>.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 p-5 rounded-2xl text-center text-slate-400 text-xs mb-lg flex flex-col items-center justify-center py-6 gap-1">
          <span className="material-symbols-outlined text-[28px] opacity-40 text-slate-400">category</span>
          <p className="font-bold text-slate-500">Sin categoría seleccionada</p>
          <p className="opacity-80">Selecciona una categoría del árbol de la izquierda para gestionar su clasificación fiscal SIFEN y aplicar tasas de IVA a sus productos.</p>
        </div>
      )}

      {/* Lista General de Tasas de IVA */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
        Tasas Registradas en el Sistema
      </h3>
      
      <div className="overflow-x-auto relative min-h-[150px] mt-1 border border-slate-100 rounded-xl">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-10 rounded-lg">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80">
              <th className="p-3 text-[10px] tracking-wider text-slate-500 font-bold uppercase w-1/4">Código SIFEN</th>
              <th className="p-3 text-[10px] tracking-wider text-slate-500 font-bold uppercase w-1/3">Nombre del Impuesto</th>
              <th className="p-3 text-[10px] tracking-wider text-slate-500 font-bold uppercase text-center w-1/5">Tasa</th>
              <th className="p-3 text-[10px] tracking-wider text-slate-500 font-bold uppercase text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {taxRates.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-40">receipt_long</span>
                    No hay tasas de IVA configuradas.
                  </div>
                </td>
              </tr>
            ) : (
              taxRates.map((rate: any) => {
                const isActiveRate = selectedCategory && rate.id === selectedCategory.default_tax_rate_id;
                return (
                  <tr 
                    key={rate.id} 
                    className={`group transition-colors hover:bg-slate-50/50 border-b border-slate-100 ${
                      isActiveRate ? 'bg-primary/5 font-semibold text-primary' : ''
                    }`}
                  >
                    <td className="p-3 text-xs font-mono text-slate-500 group-hover:text-slate-700">
                      {rate.code || `IVA-${rate.id}`}
                    </td>
                    <td className="p-3 text-xs text-slate-800">
                      <div className="flex items-center gap-1.5">
                        {rate.tax_name || rate.name}
                        {isActiveRate && (
                          <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                            <span className="material-symbols-outlined text-[10px]">check_circle</span> Default Cat.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs ${
                        isActiveRate ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rate.rate}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        rate.rate === 0 
                          ? 'bg-slate-100 text-slate-500' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {rate.rate === 0 ? 'Exento' : 'Gravado'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info card for SIFEN */}
      <div className="mt-md">
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/40 flex gap-3 items-start text-xs">
          <div className="bg-primary/10 p-1.5 rounded-full flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-[18px]">info</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-700">Sincronización Automática SIFEN</h3>
            <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">
              Las tasas de IVA configuradas en este panel se mapearán automáticamente a los códigos oficiales de la SET al emitir Documentos Electrónicos (KUDE). Asegúrate de que los porcentajes coincidan con las normativas vigentes.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación para Auto-Clasificación (Fluent Style) */}
      {showConfirmModal && selectedCategory && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-primary mb-4">
              <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">bolt</span>
              </div>
              <h3 className="text-base font-bold tracking-tight uppercase leading-none">Confirmar Auto-Clasificación</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas aplicar la clasificación fiscal <b>{selectedSifenCode}</b> a todos los productos de la categoría <b>{selectedCategory.name}</b>?
            </p>
            <p className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mb-6 leading-relaxed">
              Esta operación actualizará la clasificación SIFEN y la tasa impositiva de manera irreversible para los productos bajo esta categoría.
            </p>
            
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAutoClassify}
                className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
              >
                Confirmar y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxRatesPanel;
