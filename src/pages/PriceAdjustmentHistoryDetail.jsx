/**
 * Página de Detalle de Ajuste de Precio Específico - Patrón MVP
 * Muestra información detallada de un ajuste de precio individual
 * Siguiendo Fluent Design System 2 - Dashboard Layout
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Tag, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DataState from '@/components/ui/DataState';

const PriceAdjustmentHistoryDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adjustmentId } = useParams();

  // Estado del ajuste
  const [adjustment] = useState(location.state?.adjustment || null);
  const [product] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.adjustment);
  const [error, setError] = useState(null);

  // Cargar ajuste si no viene del estado de navegación
  useEffect(() => {
    if (adjustment) return;

    setLoading(true);
    setError(null);

    // Si no hay datos, mostramos error
    setError('Ajuste no encontrado');
    setLoading(false);
  }, [adjustmentId, adjustment]);

  // Handlers
  const handleBack = () => {
    navigate(-1);
  };

  // Estados de UI
  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <DataState variant="loading" />
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-border-subtle shadow-fluent-2 max-w-2xl mx-auto my-10 animate-in fade-in zoom-in-95">
        <p className="text-error font-black uppercase mb-4 tracking-widest">Error</p>
        <p className="text-text-secondary text-sm mb-6">{error || 'Ajuste no encontrado'}</p>
        <button 
          onClick={handleBack} 
          className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all"
        >
          Volver al Historial
        </button>
      </div>
    );
  }

  // Calcular datos
  const changePercent = adjustment.old_value > 0
    ? ((adjustment.value_change / adjustment.old_value) * 100).toFixed(2)
    : 0;
  const isIncrease = adjustment.value_change > 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header con botón de volver y título */}
      <header className='flex items-center gap-4'>
        <button 
          onClick={handleBack} 
          className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
          <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase leading-tight">
            Detalle del Ajuste
          </h1>
          <p className='text-xs font-mono text-primary font-bold uppercase tracking-widest'>
            Ref: {adjustmentId}
          </p>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Informativo: Producto y Responsable */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col gap-6 overflow-hidden">
            {/* Producto */}
            <div className='flex flex-col gap-1'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1'>Producto Impactado</p>
              <div className='flex items-start gap-3 mt-1'>
                <div className='p-2.5 bg-slate-50 rounded-lg border border-border-subtle text-primary'>
                  <Tag size={20} />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-bold text-text-main leading-tight truncate'>
                    {product ? product.product_name || product.name : 'N/A'}
                  </p>
                  <p className='text-[10px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-wider'>
                    SKU: {product ? product.product_id || product.id : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Usuario */}
            <div className='flex flex-col gap-1 pt-2 border-t border-slate-50'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1'>Responsable del Cambio</p>
              <div className='flex items-center gap-3 mt-1'>
                <div className='size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 shadow-inner'>
                  {adjustment.user_id?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-bold text-text-main truncate'>{adjustment.user_id || 'Usuario Desconocido'}</p>
                  <p className='text-[10px] font-black text-slate-400 uppercase'>ID: {adjustment.user_id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div className='flex flex-col gap-1 pt-2 border-t border-slate-50'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1'>Marca Temporal</p>
              <div className='flex items-center gap-3 mt-1'>
                <div className='p-2 bg-slate-50 rounded-lg border border-border-subtle text-slate-400'>
                  <Calendar size={18} />
                </div>
                <p className='text-sm font-bold text-text-main'>
                  {new Date(adjustment.adjustment_date).toLocaleString('es-PY', { 
                    dateStyle: 'long', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Central: Precios, Razón y Metadatos */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card de Cambio de Precio (Efecto Visual Fuerte) */}
          <div className="bg-white p-8 rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col md:flex-row items-center gap-8 md:gap-12 justify-center relative overflow-hidden group">
            {/* Elemento decorativo de fondo */}
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-colors ${isIncrease ? 'bg-success' : 'bg-error'}`}></div>
            
            <div className='text-center relative z-10'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2'>Valor Anterior</p>
              <p className='text-2xl font-bold text-slate-400 line-through opacity-60'>
                PYG {adjustment.old_value.toLocaleString('es-PY')}
              </p>
            </div>
            
            <div className={`size-14 rounded-full flex items-center justify-center transition-all shadow-md relative z-10 ${isIncrease ? 'bg-success text-white scale-110' : 'bg-error text-white scale-110'}`}>
              {isIncrease ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
            </div>

            <div className='text-center relative z-10'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2'>Nuevo Valor</p>
              <p className={`text-4xl font-black tracking-tight ${isIncrease ? 'text-success' : 'text-error'}`}>
                PYG {adjustment.new_value.toLocaleString('es-PY')}
              </p>
            </div>

            <div className='md:border-l border-slate-100 md:pl-12 text-center md:text-left relative z-10'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1'>Impacto del Ajuste</p>
              <div className='flex flex-col'>
                <p className={`text-xl font-black ${isIncrease ? 'text-success' : 'text-error'}`}>
                  {isIncrease ? '+' : ''}{changePercent}%
                </p>
                <p className='text-[11px] font-bold text-slate-500 uppercase mt-0.5'>
                  {isIncrease ? 'Aumento' : 'Reducción'} neto
                </p>
              </div>
            </div>
          </div>

          {/* Motivo del Ajuste */}
          <div className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle flex flex-col gap-4 overflow-hidden">
            <div className='flex items-center gap-2 border-b border-slate-50 pb-3'>
              <Info size={18} className='text-primary' />
              <h2 className='text-sm font-black uppercase text-text-main tracking-widest'>Justificación del Ajuste</h2>
            </div>
            <div className='bg-slate-50/50 border-l-4 border-primary/20 p-5 rounded-r-xl'>
              <p className='text-text-main font-medium italic leading-relaxed'>
                "{adjustment.reason}"
              </p>
            </div>
          </div>

          {/* Tabla de Metadatos */}
          {adjustment.metadata && Object.keys(adjustment.metadata).length > 0 && (
            <div className="bg-white rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col">
              <div className='px-6 py-4 border-b border-border-subtle bg-[#fafafa] flex items-center gap-2'>
                <h2 className='text-[13px] font-bold text-gray-700 uppercase tracking-widest'>Contexto y Metadatos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className='w-full text-left text-sm'>
                  <thead className='bg-gray-50/50 border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider'>
                    <tr>
                      <th className='py-3 px-6'>Clave</th>
                      <th className='py-3 px-6'>Valor Técnico</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {Object.entries(adjustment.metadata).map(([key, value]) => (
                      <tr key={key} className='hover:bg-slate-50 transition-colors group'>
                        <td className='py-3 px-6 font-bold text-slate-600 uppercase text-[10px] tracking-wider group-hover:text-primary transition-colors'>
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className='py-3 px-6 font-mono text-xs text-slate-700 bg-slate-50/30'>
                          {typeof value === 'object' ? (
                            <pre className='whitespace-pre-wrap'>{JSON.stringify(value, null, 2)}</pre>
                          ) : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAdjustmentHistoryDetail;
