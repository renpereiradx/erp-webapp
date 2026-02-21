import React from 'react';

/**
 * Footer Visual Section: Trend Chart & Executive Summary.
 * 100% STITCH FIDELITY: Inline styles used to bypass SCSS pollution.
 */
const AgingTrendAnalysis = ({ trendData }) => {
  return (
    <section className="grid grid-cols-4 gap-8 mb-12 animate-in fade-in">
      {/* 12-Month Morosity Evolution Chart */}
      <div className="col-span-3 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolución de Morosidad 12 Meses</h3>
            <p className="text-sm text-slate-500">Tendencia histórica de Deuda Total vs. Deuda Vencida (+30 días)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#137fec]"></div>
              <span className="text-xs font-semibold uppercase text-slate-400">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#dc3545]"></div>
              <span className="text-xs font-semibold uppercase text-slate-400">Vencida</span>
            </div>
          </div>
        </div>

        <div className="relative h-64 w-full group">
          <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
            <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
            <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
            <div className="border-t border-slate-100 dark:border-slate-800 w-full h-0"></div>
          </div>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path d="M 0 100 Q 200 80, 400 90 T 800 60 T 1200 40 T 1600 70 T 2000 50 L 2560 65" fill="none" stroke="#137fec" strokeLinecap="round" strokeWidth="3"></path>
            <path d="M 0 200 Q 200 190, 400 210 T 800 180 T 1200 170 T 1600 190 T 2000 160 L 2560 180" fill="none" stroke="#dc3545" strokeDasharray="5,5" strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="absolute -bottom-8 w-full flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Jun '23</span>
            <span>Ago '23</span>
            <span>Oct '23</span>
            <span>Dic '23</span>
            <span>Feb '24</span>
            <span>Abr '24</span>
            <span>May '24</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY - FORCED VISUALS VIA INLINE STYLES */}
      <div 
        className="col-span-1 p-8 rounded-xl border flex flex-col justify-between shadow-lg"
        style={{ 
          backgroundColor: '#137fec', 
          borderColor: '#137fec',
          boxShadow: '0 10px 15px -3px rgba(19, 127, 236, 0.2), 0 4px 6px -2px rgba(19, 127, 236, 0.1)'
        }}
      >
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>Resumen Ejecutivo</h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            La morosidad se ha incrementado un <span className="font-bold underline" style={{ color: '#ffffff' }}>5.2%</span> respecto al trimestre anterior, impulsado principalmente por el retraso en el sector de Insumos.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="material-icons-round" style={{ color: '#ffc107' }}>warning</span>
              <div className="text-sm">
                <p className="font-bold" style={{ color: '#ffffff' }}>Alerta de Liquidez</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>8 cuentas superan los 90 días.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-icons-round" style={{ color: '#28a745' }}>verified_user</span>
              <div className="text-sm">
                <p className="font-bold" style={{ color: '#ffffff' }}>Flujo Optimizado</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>DPO superior al promedio del sector.</p>
              </div>
            </li>
          </ul>
        </div>
        <button 
          className="w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#137fec'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <span className="material-icons-round">analytics</span>
          Descargar Informe PDF
        </button>
      </div>
    </section>
  );
};

export default AgingTrendAnalysis;
