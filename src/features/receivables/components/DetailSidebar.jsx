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
    <div className="flex flex-col gap-8">
      {/* Acciones Rápidas */}
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.detail.actions.title')}</h3>
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" className="w-full h-12 shadow-md font-black uppercase tracking-widest text-xs">
            <CreditCard size={18} className="mr-2" />
            <span>{t('receivables.detail.actions.register_payment')}</span>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" className="h-11 bg-white border-border-subtle shadow-sm font-black uppercase tracking-widest text-[10px]">
              <Send size={16} className="mr-2" />
              <span>{t('receivables.detail.actions.reminder')}</span>
            </Button>
            <Button variant="secondary" size="md" className="h-11 bg-white border-border-subtle shadow-sm font-black uppercase tracking-widest text-[10px]">
              <Flag size={16} className="mr-2" />
              <span>{t('receivables.detail.actions.dispute')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contacto del Cliente */}
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.detail.contact.title')}</h3>
          <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary hover:text-primary">
            <Pencil size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary font-black text-lg shadow-sm border border-blue-100">
            {client.contact?.charAt(0) || client.name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-text-main truncate">{client.contact || client.name}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Billing Manager</p>
          </div>
        </div>

        <div className="h-px bg-border-subtle opacity-50"></div>

        <div className="space-y-4">
          {client.email && (
            <div className="flex items-center gap-3 text-sm font-medium text-text-secondary group cursor-pointer hover:text-primary transition-colors">
              <Mail size={16} className="opacity-60" />
              <a href={`mailto:${client.email}`} className="truncate">{client.email}</a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3 text-sm font-medium text-text-secondary group cursor-pointer hover:text-primary transition-colors">
              <Phone size={16} className="opacity-60" />
              <a href={`tel:${client.phone}`}>{client.phone}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3 text-sm font-medium text-text-secondary">
              <MapPin size={16} className="opacity-60 mt-0.5" />
              <span className="leading-tight">{client.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actividad y Notas */}
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
        <h3 className="text-sm font-black text-text-main uppercase tracking-tight">{t('receivables.detail.activity.title')}</h3>
        <div className="space-y-3">
          <Textarea
            placeholder={t('receivables.detail.activity.placeholder')}
            className="min-h-[80px] bg-slate-50 border-border-subtle focus:bg-white transition-all text-sm font-medium placeholder:text-text-secondary placeholder:opacity-40"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" className="px-4 h-9 font-black uppercase tracking-widest text-[10px] shadow-sm">
              {t('receivables.detail.activity.post')}
            </Button>
          </div>
        </div>

        <div className="h-px bg-border-subtle opacity-50"></div>

        <div className="space-y-6">
          <div className="flex gap-4 group">
            <div className="relative flex flex-col items-center">
              <div className="size-2 rounded-full bg-primary mt-1.5 shadow-[0_0_0_4px_rgba(16,110,190,0.1)]"></div>
              <div className="w-0.5 h-full bg-slate-100 absolute top-3.5 -bottom-6"></div>
            </div>
            <div className="space-y-1 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Hoy, 9:41 AM</p>
              <p className="text-xs text-text-main font-medium leading-relaxed">
                <strong className="text-primary">Sistema</strong> envió recordatorio automático vía Email.
              </p>
            </div>
          </div>
          <div className="flex gap-4 group">
            <div className="relative flex flex-col items-center">
              <div className="size-2 rounded-full bg-blue-400 mt-1.5 shadow-[0_0_0_4px_rgba(96,165,250,0.1)]"></div>
            </div>
            <div className="space-y-2 pb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Ayer, 4:20 PM</p>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                <p className="text-xs text-text-main font-medium leading-relaxed italic">
                  "Llamé a Sarah. Confirmó que el cheque del saldo restante se enviará este viernes."
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary text-right mt-2">— Tú</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSidebar;
