import React from 'react';

const AgingTrendChart = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 h-full flex flex-col min-h-[340px]">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-base font-bold text-slate-800">Evolución de Morosidad 12 Meses</h3>
          <p className="text-xs text-slate-400 mt-1">Tendencia histórica de Deuda Total vs. Deuda Vencida (+30 días)</p>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.15em]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#3b82f6] rounded-full" />
            <span className="text-slate-400">TOTAL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 border-t-2 border-dashed border-red-500" />
            <span className="text-slate-400">VENCIDA</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full px-2">
        {/* Simple SVG Chart to match the UI perfectly */}
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0,60 Q10,58 20,62 T40,55 T60,50 T80,45 T100,35" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0,85 Q10,83 20,86 T40,88 T60,82 T80,78 T100,70" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" strokeLinecap="round" />
        </svg>

        {/* Labels X-Axis */}
        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>JUN '23</span>
          <span>AGO '23</span>
          <span>OCT '23</span>
          <span>DIC '23</span>
          <span>FEB '24</span>
          <span>ABR '24</span>
          <span>MAY '24</span>
        </div>
      </div>
    </div>
  );
};

export default AgingTrendChart;