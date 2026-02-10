import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Sidebar para la página de detalle, incluyendo acciones rápidas, contacto y actividad.
 */
const DetailSidebar = ({ client }) => {
  const { t } = useI18n();

  return (
    <div className="receivable-detail__sidebar">
      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('receivables.detail.actions.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button variant="primary" block className="h-11">
            <span className="material-symbols-outlined">add_card</span>
            <span>{t('receivables.detail.actions.register_payment')}</span>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10">
              <span className="material-symbols-outlined">send</span>
              <span>{t('receivables.detail.actions.reminder')}</span>
            </Button>
            <Button variant="outline" className="h-10">
              <span className="material-symbols-outlined">flag</span>
              <span>{t('receivables.detail.actions.dispute')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacto del Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 mb-4">
          <CardTitle className="mb-0">{t('receivables.detail.contact.title')}</CardTitle>
          <Button variant="link" size="sm">{t('action.edit', 'Editar')}</Button>
        </CardHeader>
        <CardContent>
          <div className="client-card__profile">
            <div className="client-card__avatar"></div>
            <div>
              <p className="text-sm font-bold">{client.contact}</p>
              <p className="text-xs text-tertiary">Billing Manager</p>
            </div>
          </div>
          
          <hr className="card__divider" />
          
          <div className="flex flex-col gap-3">
            <div className="client-card__info-row">
              <span className="material-symbols-outlined client-card__icon">mail</span>
              <a href={`mailto:${client.email}`} className="truncate text-sm">{client.email}</a>
            </div>
            <div className="client-card__info-row">
              <span className="material-symbols-outlined client-card__icon">call</span>
              <a href={`tel:${client.phone}`} className="text-sm">{client.phone}</a>
            </div>
            <div className="client-card__info-row">
              <span className="material-symbols-outlined client-card__icon">location_on</span>
              <span className="truncate text-tertiary text-sm">{client.address}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actividad y Notas */}
      <Card>
        <CardHeader className="bg-secondary p-4 border-b">
          <CardTitle className="text-sm font-bold">{t('receivables.detail.activity.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="activity-card__input-area">
            <textarea 
              className="activity-card__textarea" 
              placeholder={t('receivables.detail.activity.placeholder')}
              rows={2}
            ></textarea>
            <div className="flex justify-end mt-2">
              <Button variant="primary" size="sm">
                {t('receivables.detail.activity.post')}
              </Button>
            </div>
          </div>
          <div className="activity-card__timeline mt-6">
            <div className="activity-card__item">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-tertiary">Hoy, 9:41 AM</p>
                <p className="text-sm"><span className="font-bold">Sistema</span> envió recordatorio automático vía Email.</p>
              </div>
            </div>
            <div className="activity-card__item activity-card__item--primary">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-tertiary">Ayer, 4:20 PM</p>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-sm">Llamé a Sarah. Confirmó que el cheque del saldo restante se enviará este viernes.</p>
                  <p className="text-xs text-primary mt-1 font-bold">- Tú</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailSidebar;
