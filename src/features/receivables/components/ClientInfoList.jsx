import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la lista de información del cliente.
 */
const ClientInfoList = ({ address, contact, phone, rep, taxId }) => {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-[#f0f2f4] dark:border-gray-800 p-6 shadow-sm flex-1">
      <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">{t('receivables.info.title', 'Información del Cliente')}</h2>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{t('receivables.info.billing_address', 'Dirección de Facturación')}</p>
            <p className="text-sm font-medium text-[#111418] dark:text-white mt-0.5 whitespace-pre-line">{address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
            <span className="material-symbols-outlined text-[18px]">call</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{t('receivables.info.primary_contact', 'Contacto Principal')}</p>
            <p className="text-sm font-medium text-[#111418] dark:text-white mt-0.5">{contact}</p>
            <p className="text-sm text-primary hover:underline cursor-pointer">{phone}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
            <span className="material-symbols-outlined text-[18px]">badge</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{t('receivables.info.assigned_rep', 'Representante Asignado')}</p>
            <p className="text-sm font-medium text-[#111418] dark:text-white mt-0.5">{rep}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#f0f2f4] dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('receivables.info.tax_id', 'RUC / Identificación Fiscal')}</p>
          <div className="flex items-center justify-between p-2 bg-[#f0f2f4] dark:bg-gray-800 rounded text-sm font-mono text-[#111418] dark:text-white group">
            <span>{taxId}</span>
            <span className="material-symbols-outlined text-gray-400 text-[16px] cursor-pointer hover:text-primary transition-colors">content_copy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoList;
