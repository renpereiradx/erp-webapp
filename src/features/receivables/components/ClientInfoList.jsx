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
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5 leading-snug">
              {address || '1200 Logistics Blvd, Suite 400\nSan Diego, CA 92101, USA'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 border border-slate-100 dark:border-slate-700">
            <Phone size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Contacto</p>
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5">{contact || 'Sarah Jenkins (CFO)'}</p>
            <p className="text-xs text-primary hover:underline cursor-pointer font-medium mt-0.5">{phone || '+1 (619) 555-0123'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0 border border-slate-100 dark:border-slate-700">
            <User size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Representante</p>
            <p className="text-[13px] font-bold text-[#111418] dark:text-white mt-0.5">{rep || 'Michael Ross'}</p>
          </div>
        </div>

        <div className="pt-5 border-t border-[#f0f2f4] dark:border-gray-800">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Identificación Fiscal</p>
          <div className="flex items-center justify-between p-2.5 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg text-xs font-mono text-[#111418] dark:text-white border border-slate-100 dark:border-slate-700">
            <span className="font-bold">{taxId || 'US-99-882145'}</span>
            <Copy size={14} className="text-gray-400 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoList;