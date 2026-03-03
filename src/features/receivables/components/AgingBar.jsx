import React from 'react';

const AgingBar = ({ aging = {}, totalAR = 0 }) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white uppercase tracking-tight">Análisis de Antigüedad</h2>
        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500"></span>Al Día</div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-yellow-400"></span>1-30 Días</div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500"></span>31-60 Días</div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500"></span>&gt; 90 Días</div>
        </div>
      </div>
      <div className="w-full">
        {/* Visual Bar */}
        <div className="flex h-12 w-full rounded-lg overflow-hidden mb-2 shadow-inner border border-slate-50 dark:border-slate-800">
          <div className="bg-emerald-500 h-full flex items-center justify-center text-white text-[11px] font-black transition-all hover:brightness-95" style={{ width: '55%' }} title="Al Día: $68,475">$68k</div>
          <div className="bg-yellow-400 h-full flex items-center justify-center text-yellow-900 text-[11px] font-black transition-all hover:brightness-95" style={{ width: '25%' }} title="1-30 Días: $31,125">$31k</div>
          <div className="bg-orange-500 h-full flex items-center justify-center text-white text-[11px] font-black transition-all hover:brightness-95" style={{ width: '12%' }} title="31-60 Días: $14,940">$14k</div>
          <div className="bg-red-500 h-full flex items-center justify-center text-white text-[11px] font-black transition-all hover:brightness-95" style={{ width: '8%' }} title=">90 Días: $10,000">$10k</div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[0.1em]">
          <span>Total AR: ${totalAR?.toLocaleString('en-US') || '124,500'}</span>
          <span className="text-red-500">Alerta Máxima: &gt; 90 Días</span>
        </div>
      </div>
    </div>
  );
};

export default AgingBar;