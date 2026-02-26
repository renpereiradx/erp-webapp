import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la lista de información del cliente.
 */
const ClientInfoList = ({ address, contact, phone, rep, taxId }) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
      <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.info.title')}</h3>
      <div className="space-y-6">
        <div className="flex gap-4 group">
          <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-text-secondary opacity-60 flex-shrink-0 group-hover:text-primary group-hover:bg-blue-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.info.billing_address')}</p>
            <p className="text-sm font-bold text-text-main leading-snug">{address}</p>
          </div>
        </div>
        
        <div className="flex gap-4 group">
          <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-text-secondary opacity-60 flex-shrink-0 group-hover:text-primary group-hover:bg-blue-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">call</span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.info.primary_contact')}</p>
            <p className="text-sm font-bold text-text-main leading-snug">{contact}</p>
            <a href={`tel:${phone}`} className="block text-xs font-black text-primary hover:underline transition-all">{phone}</a>
          </div>
        </div>

        <div className="flex gap-4 group">
          <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-text-secondary opacity-60 flex-shrink-0 group-hover:text-primary group-hover:bg-blue-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.info.assigned_rep')}</p>
            <p className="text-sm font-bold text-text-main leading-snug">{rep}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle/50 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.info.tax_id')}</p>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-border-subtle/50 group cursor-pointer hover:bg-white transition-all">
            <span className="text-sm font-black text-text-main tracking-tight uppercase">{taxId}</span>
            <span className="material-symbols-outlined text-[18px] text-text-secondary opacity-40 group-hover:text-primary group-hover:opacity-100 transition-all">content_copy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoList;
