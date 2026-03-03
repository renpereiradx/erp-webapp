import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Send, Flag, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Sidebar para la página de detalle, incluyendo acciones rápidas, contacto y actividad.
 */
const DetailSidebar = ({ client = {} }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      {/* Action Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
        <h3 className="text-[#111418] dark:text-white text-lg font-bold mb-4">{t('receivables.detail.actions.title', 'Acciones Rápidas')}</h3>
        <div className="flex flex-col gap-3">
          <button className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary hover:bg-blue-600 text-white font-semibold transition-colors shadow-sm">
            <span className="material-symbols-outlined">add_card</span>
            {t('receivables.detail.actions.register_payment', 'Registrar Pago')}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-[#111418] dark:text-white font-medium text-sm transition-colors">
              <span className="material-symbols-outlined text-lg">send</span>
              {t('receivables.detail.actions.reminder', 'Recordatorio')}
            </button>
            <button className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-[#111418] dark:text-white font-medium text-sm transition-colors">
              <span className="material-symbols-outlined text-lg">flag</span>
              {t('receivables.detail.actions.dispute', 'Disputa')}
            </button>
          </div>
        </div>
      </div>

      {/* Debtor Contact Info */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#111418] dark:text-white text-lg font-bold">{t('receivables.detail.contact.title', 'Contacto del Cliente')}</h3>
          <button className="text-primary text-sm font-medium hover:underline">{t('action.edit', 'Editar')}</button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full flex items-center justify-center bg-blue-50 text-primary font-bold border border-border-light dark:border-border-dark">
              {client.contact?.charAt(0) || client.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111418] dark:text-white">{client.contact || client.name}</p>
              <p className="text-xs text-[#617589] dark:text-gray-400">{t('receivables.profile.billing_manager', 'Gerente de Facturación')}</p>
            </div>
          </div>
          
          <div className="h-px bg-border-light dark:bg-border-dark w-full"></div>
          
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-gray-400">mail</span>
                <a className="text-[#111418] dark:text-gray-200 hover:text-primary truncate" href={`mailto:${client.email}`}>
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-gray-400">call</span>
                <a className="text-[#111418] dark:text-gray-200 hover:text-primary" href={`tel:${client.phone}`}>
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-gray-400">location_on</span>
                <span className="text-[#111418] dark:text-gray-200 truncate">{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline / Notes */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
          <h3 className="text-[#111418] dark:text-white text-base font-bold">{t('receivables.detail.activity.title', 'Actividad y Notas')}</h3>
        </div>
        <div className="p-4 flex flex-col gap-6 max-h-[400px] overflow-y-auto">
          
          {/* Input Note */}
          <div className="flex flex-col gap-2">
            <textarea 
              className="w-full resize-none rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-[#2a3642] p-3 text-sm text-[#111418] dark:text-white placeholder:text-gray-400 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none" 
              placeholder={t('receivables.detail.activity.placeholder', 'Agregar una nota...')}
              rows="2"
            />
            <div className="flex justify-end">
              <button className="text-xs font-semibold text-white bg-primary/80 hover:bg-primary px-3 py-1.5 rounded transition-colors">
                {t('receivables.detail.activity.post', 'Publicar Nota')}
              </button>
            </div>
          </div>

          <div className="relative pl-4 border-l border-border-light dark:border-border-dark space-y-6">
            {/* Timeline Item: System Event */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-surface-dark"></div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">Hoy, 9:41 AM</p>
                <p className="text-sm text-[#111418] dark:text-gray-200">
                  <span className="font-semibold text-primary">Sistema</span> envió recordatorio automático vía Email.
                </p>
              </div>
            </div>

            {/* Timeline Item: Manual Note */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-surface-dark"></div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">Ayer, 4:20 PM</p>
                <div className="bg-blue-50 dark:bg-primary/10 p-3 rounded-lg rounded-tl-none">
                  <p className="text-sm text-[#111418] dark:text-gray-200">
                    Llamé a Sarah. Confirmó que el cheque del saldo restante se enviará este viernes.
                  </p>
                  <p className="text-xs text-primary mt-1 font-medium">- Tú</p>
                </div>
              </div>
            </div>

            {/* Timeline Item: Payment (Mock static for demonstration to match design) */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface-dark"></div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">Nov 15, 2023</p>
                <p className="text-sm text-[#111418] dark:text-gray-200">
                  Pago de <span className="font-bold text-emerald-600 dark:text-emerald-400">$2,000.00</span> recibido vía transferencia bancaria.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSidebar;
