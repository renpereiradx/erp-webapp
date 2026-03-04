import React from 'react';
import { MapPin, Phone, User, Receipt, Copy } from 'lucide-react';

const ClientInfoList = ({ address = '', contact = '', phone = '', rep = '', taxId = '' }) => {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 p-5 shadow-sm flex-1">
      <h2 className="text-base font-bold text-[#111418] dark:text-white mb-5 uppercase tracking-tight">Información</h2>
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 border border-slate-100 dark:border-slate-700">
            <MapPin size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Dirección</p>
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5 whitespace-pre-wrap">
              {address || 'Dirección no disponible'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 border border-slate-100 dark:border-slate-700">
            <Phone size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Contacto</p>
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5">{contact || 'Sin contacto definido'}</p>
            {phone && <p className="text-xs text-primary hover:underline cursor-pointer font-medium mt-0.5">{phone}</p>}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 border border-slate-100 dark:border-slate-700">
            <User size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Representante</p>
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5">{rep || 'No asignado'}</p>
          </div>
        </div>

        <div className="pt-5 border-t border-[#f0f2f4] dark:border-gray-800">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Identificación Fiscal</p>
          <div className="flex items-center justify-between p-2.5 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg text-xs font-mono text-[#111418] dark:text-white border border-slate-100 dark:border-slate-700">
            <span className="font-bold">{taxId || 'No registrado'}</span>
            <Copy size={14} className="text-gray-400 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoList;