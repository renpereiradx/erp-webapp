import React from 'react';

/**
 * Footer Visual Section: Trend Chart & Executive Summary.
 * 100% STITCH FIDELITY - RESPONSIVE OPTIMIZED
 */
const AgingTrendAnalysis = ({ trendData }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-12 animate-in fade-in">
      {/* 12-Month Morosity Evolution Chart */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4 md:gap-0">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Evolución de Morosidad 12 Meses</h3>
            <p className="text-xs md:text-sm text-slate-500">Deuda Total vs. Deuda Vencida (+30 días)</p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#137fec]"></div>
              <span className="text-[10px] md:text-xs font-semibold uppercase text-slate-400">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#dc3545]"></div>
              <span className="text-[10px] md:text-xs font-semibold uppercase text-slate-400">Vencida</span>
            </div>
          </div>
        </div>

        <div className="relative h-48 md:h-64 w-full group">
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
          <div className="absolute -bottom-8 w-full flex justify-between text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">
            <span>Jun</span>
            <span>Ago</span>
            <span>Oct</span>
            <span>Dic</span>
            <span>Feb</span>
            <span>Abr</span>
            <span>May</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY - RESPONSIVE STYLING */}
      <div 
        className="lg:col-span-1 p-6 md:p-8 rounded-xl border flex flex-col justify-between shadow-lg gap-6"
        style={{ 
          backgroundColor: '#137fec', 
          borderColor: '#137fec',
          boxShadow: '0 10px 15px -3px rgba(19, 127, 236, 0.2)'
        }}
      >
        <div>
          <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#ffffff' }}>Resumen Ejecutivo</h3>
          <p className="text-xs md:text-sm leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            La morosidad se ha incrementado un <span className="font-bold underline" style={{ color: '#ffffff' }}>5.2%</span>, impulsado por el sector de Insumos.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="material-icons-round text-sm md:text-base" style={{ color: '#ffc107' }}>warning</span>
              <div className="text-xs md:text-sm">
                <p className="font-bold" style={{ color: '#ffffff' }}>Alerta de Liquidez</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>8 cuentas &gt; 90 días.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-icons-round text-sm md:text-base" style={{ color: '#28a745' }}>verified_user</span>
              <div className="text-xs md:text-sm">
                <p className="font-bold" style={{ color: '#ffffff' }}>Flujo Optimizado</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>DPO superior al sector.</p>
              </div>
            </li>
          </ul>
        </div>
        <button 
          className="w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#137fec'
          }}
        >
          <span className="material-icons-round text-sm md:text-base">analytics</span>
          Informe PDF
        </button>
      </div>
    </section>
  );
};

export default AgingTrendAnalysis;
