import React from 'react';
import { Search, Filter, MoreVertical, ArrowForward } from 'lucide-react';

/**
 * Tabla de deudores principales.
 * Estilo 100% fiel al diseño de Stitch.
 */
const AgingByClientTable = ({ clientsData }) => {
  const debtors = [
    { name: 'Acme Corp', id: '#9201', total: 124500.00, over90: 12000.00, risk: 'Medio', riskColor: 'bg-orange-100 text-orange-700', avatar: 'AC', avatarBg: 'bg-blue-100 text-blue-700' },
    { name: 'Globex Inc.', id: '#8821', total: 89200.00, over90: 0.00, risk: 'Bajo', riskColor: 'bg-green-100 text-green-700', avatar: 'GI', avatarBg: 'bg-purple-100 text-purple-700' },
    { name: 'Soylent Ind.', id: '#7732', total: 215000.00, over90: 45000.00, risk: 'Alto', riskColor: 'bg-red-100 text-red-700', avatar: 'SI', avatarBg: 'bg-red-100 text-red-700' },
    { name: 'Umbrella Corp', id: '#1002', total: 54320.00, over90: 0.00, risk: 'Bajo', riskColor: 'bg-green-100 text-green-700', avatar: 'UM', avatarBg: 'bg-teal-100 text-teal-700' },
    { name: 'Massive Ind.', id: '#5512', total: 32100.00, over90: 5400.00, risk: 'Medio', riskColor: 'bg-orange-100 text-orange-700', avatar: 'MI', avatarBg: 'bg-indigo-100 text-indigo-700' },
  ];

  return (
    <div className="flex-1 bg-white dark:bg-[#1a2632] rounded-lg border border-[#e5e7eb] dark:border-[#2e3640] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden min-h-[400px]">
      <div className="p-5 border-b border-[#f0f2f4] dark:border-[#2e3640] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-[#111418] dark:text-white text-lg font-bold">Principales Deudores</h3>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Riesgo Alto</span>
        </div>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#2e3640] rounded text-[#617589]">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#2e3640] rounded text-[#617589]">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f8f9fa] dark:bg-[#25303d] text-[#617589] dark:text-gray-400 font-medium">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre del Cliente</th>
              <th className="px-5 py-3 font-medium text-right">Pendiente Total</th>
              <th className="px-5 py-3 font-medium text-right text-red-600">&gt; 90 Días</th>
              <th className="px-5 py-3 font-medium text-center">Score de Riesgo</th>
              <th className="px-5 py-3 font-medium">Último Pago</th>
              <th className="px-5 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#2e3640]">
            {debtors.map((debtor, idx) => (
              <tr key={idx} className="hover:bg-[#f8f9fa] dark:hover:bg-[#25303d] transition-colors group text-[#111418] dark:text-white">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${debtor.avatarBg}`}>
                      {debtor.avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">{debtor.name}</span>
                      <span className="text-xs text-[#617589]">ID: {debtor.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-mono font-medium">${debtor.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-5 py-4 text-right font-mono text-red-600 font-bold">${debtor.over90.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${debtor.riskColor}`}>{debtor.risk}</span>
                </td>
                <td className="px-5 py-4 text-[#617589] dark:text-gray-400">Oct 12, 2023</td>
                <td className="px-5 py-4">
                  <button className="text-[#137fec] hover:text-[#137fec]/80 font-medium text-xs uppercase tracking-wider">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-[#f0f2f4] dark:border-[#2e3640] flex justify-center">
        <button className="text-sm font-medium text-[#617589] hover:text-[#137fec] flex items-center gap-1 transition-colors">
          Ver todos los clientes <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default AgingByClientTable;
