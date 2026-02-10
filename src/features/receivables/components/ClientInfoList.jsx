import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la lista de información del cliente.
 */
const ClientInfoList = ({ address, contact, phone, rep, taxId }) => {
  const { t } = useI18n();

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('receivables.info.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="client-info-list">
          <div className="client-info-list__item">
            <div className="client-info-list__icon-box">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div className="client-info-list__content">
              <p className="client-info-list__label">{t('receivables.info.billing_address')}</p>
              <p className="client-info-list__value">{address}</p>
            </div>
          </div>
          
          <div className="client-info-list__item">
            <div className="client-info-list__icon-box">
              <span className="material-symbols-outlined">call</span>
            </div>
            <div className="client-info-list__content">
              <p className="client-info-list__label">{t('receivables.info.primary_contact')}</p>
              <p className="client-info-list__value">{contact}</p>
              <a href={`tel:${phone}`} className="client-info-list__link">{phone}</a>
            </div>
          </div>

          <div className="client-info-list__item">
            <div className="client-info-list__icon-box">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div className="client-info-list__content">
              <p className="client-info-list__label">{t('receivables.info.assigned_rep')}</p>
              <p className="client-info-list__value">{rep}</p>
            </div>
          </div>

          <div className="client-info-list__tax-id">
            <p className="client-info-list__label">{t('receivables.info.tax_id')}</p>
            <div className="client-info-list__tax-id-box">
              <span>{taxId}</span>
              <span className="material-symbols-outlined text-tertiary cursor-pointer">content_copy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoList;
