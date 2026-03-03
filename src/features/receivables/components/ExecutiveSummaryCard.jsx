import React from 'react';
import { AlertTriangle, CheckCircle, FileDown } from 'lucide-react';

const ExecutiveSummaryCard = () => {
  return (
    <div className="bg-[#3b82f6] rounded-xl shadow-lg p-8 h-full flex flex-col text-white min-h-[340px]">
      <h3 className="text-[19px] font-bold mb-4 tracking-tight">Resumen Ejecutivo</h3>
      <p className="text-[13px] text-blue-50/80 mb-8 leading-relaxed font-medium">
        La morosidad se ha incrementado un <strong className="text-white font-bold underline decoration-blue-300 underline-offset-4">1.2%</strong> respecto al trimestre anterior, impulsada principalmente por el retraso en el sector de insumos.
      </p>

      <div className="space-y-6 flex-1">
        <div className="flex items-start gap-4">
          <div className="mt-1 text-yellow-300">
            <AlertTriangle size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold tracking-wide">Alerta de Liquidez</h4>
            <p className="text-xs text-blue-100/70 mt-1 font-medium tracking-tight">8 cuentas superan los 90 días.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-1 text-green-300">
            <CheckCircle size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold tracking-wide">Flujo Optimizado</h4>
            <p className="text-xs text-blue-100/70 mt-1 font-medium tracking-tight">DPO superior al promedio del sector.</p>
          </div>
        </div>
      </div>

      <button className="mt-8 w-full bg-white text-[#3b82f6] hover:bg-blue-50 py-3.5 rounded-xl flex items-center justify-center gap-2.5 text-sm font-black transition-all active:scale-[0.98] shadow-md shadow-blue-700/20">
        <FileDown size={18} />
        Descargar informe PDF
      </button>
    </div>
  );
};

export default ExecutiveSummaryCard;