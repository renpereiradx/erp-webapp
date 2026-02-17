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
    <div className="receivable-detail__sidebar">
      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('receivables.detail.actions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="receivable-detail__sidebar-actions">
            <Button variant="default" className="w-full h-11">
              <CreditCard size={16} />
              <span>{t('receivables.detail.actions.register_payment')}</span>
            </Button>
            <div className="receivable-detail__sidebar-actions-grid">
              <Button variant="outline" className="h-10">
                <Send size={16} />
                <span>{t('receivables.detail.actions.reminder')}</span>
              </Button>
              <Button variant="outline" className="h-10">
                <Flag size={16} />
                <span>{t('receivables.detail.actions.dispute')}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto del Cliente */}
      <Card>
        <CardHeader className="receivable-detail__contact-header">
          <CardTitle>{t('receivables.detail.contact.title')}</CardTitle>
          <Button variant="ghost" size="sm">
            <Pencil size={14} />
            <span>{t('action.edit', 'Editar')}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="receivable-detail__contact-profile">
            <Avatar size={40} color="brand">
              <AvatarFallback>{client.contact?.charAt(0) || client.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="receivable-detail__contact-name">{client.contact || client.name}</p>
              <p className="receivable-detail__contact-role">Billing Manager</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="receivable-detail__contact-info">
            {client.email && (
              <div className="receivable-detail__contact-row">
                <Mail size={16} style={{ flexShrink: 0 }} />
                <a href={`mailto:${client.email}`} className="truncate">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="receivable-detail__contact-row">
                <Phone size={16} style={{ flexShrink: 0 }} />
                <a href={`tel:${client.phone}`}>{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="receivable-detail__contact-row">
                <MapPin size={16} style={{ flexShrink: 0 }} />
                <span className="truncate">{client.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actividad y Notas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('receivables.detail.activity.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="receivable-detail__activity-input">
            <Textarea
              placeholder={t('receivables.detail.activity.placeholder')}
              rows={2}
              className="activity-card__textarea"
            />
            <div className="receivable-detail__activity-submit">
              <Button variant="default" size="sm">
                {t('receivables.detail.activity.post')}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="activity-card__timeline">
            <div className="activity-card__item">
              <div className="activity-card__item-content">
                <p className="activity-card__item-date">Hoy, 9:41 AM</p>
                <p className="activity-card__item-text"><strong>Sistema</strong> envió recordatorio automático vía Email.</p>
              </div>
            </div>
            <div className="activity-card__item activity-card__item--primary">
              <div className="activity-card__item-content">
                <p className="activity-card__item-date">Ayer, 4:20 PM</p>
                <div className="activity-card__item-note">
                  <p className="activity-card__item-text">Llamé a Sarah. Confirmó que el cheque del saldo restante se enviará este viernes.</p>
                  <p className="activity-card__item-author">- Tú</p>
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
