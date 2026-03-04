import React from 'react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tabla de deudores principales.
 * Estilo 100% fiel al diseño de Stitch.
 */
const AgingByClientTable = ({ clientsData }) => {
  const safeClients = Array.isArray(clientsData) ? clientsData : [];

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
            {safeClients.length > 0 ? (
              safeClients.map((client, idx) => {
                const over90 = client.over_90_days || 0;
                const total = client.total || 0;
                // Riesgo calculado al vuelo según mora de > 90
                const isHighRisk = over90 > (total * 0.2);
                const riskColor = isHighRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                const avatar = client.client_name?.substring(0, 2).toUpperCase() || 'CX';

                return (
                  <tr key={client.client_id || idx} className="hover:bg-[#f8f9fa] dark:hover:bg-[#25303d] transition-colors group text-[#111418] dark:text-white">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-700">
                          {avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{client.client_name}</span>
                          <span className="text-xs text-[#617589]">ID: {client.client_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium">{formatPYG(client.total || 0)}</td>
                    <td className="px-5 py-4 text-right font-mono text-red-600 font-bold">{formatPYG(over90)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${riskColor}`}>
                        {isHighRisk ? 'Alto' : 'Bajo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#617589] dark:text-gray-400">No disp.</td>
                    <td className="px-5 py-4">
                      <button className="text-[#137fec] hover:text-[#137fec]/80 font-medium text-xs uppercase tracking-wider">Ver</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">No hay datos por cliente.</td>
              </tr>
            )}
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
