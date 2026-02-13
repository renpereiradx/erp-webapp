import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tabla optimizada para esfuerzos de cobranza.
 */
const OverdueTable = ({ accounts }) => {
  const { t } = useI18n();

  return (
    <div className="overdue-accounts__main-content">
      <div className="rec-filter-panel">
        <div className="rec-filter-panel__row" style={{ alignItems: 'center' }}>
          <div className="rec-input-group" style={{ flex: 2 }}>
            <div className="rec-input-group__wrapper">
              <div className="rec-input-group__icon">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input 
                className="rec-input" 
                placeholder={t('common.searching', 'Buscando...')} 
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <span>{t('receivables.overdue.table.status')}: Todos</span>
              <span className="material-symbols-outlined">expand_more</span>
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><input type="checkbox" className="rounded" /></TableHead>
              <TableHead>{t('receivables.overdue.table.client_invoice')}</TableHead>
              <TableHead className="text-right">{t('receivables.overdue.table.amount')}</TableHead>
              <TableHead className="text-center">{t('receivables.overdue.table.overdue')}</TableHead>
              <TableHead>{t('receivables.overdue.table.status')}</TableHead>
              <TableHead>{t('receivables.overdue.table.last_contact')}</TableHead>
              <th className="text-right pr-6">{t('receivables.overdue.table.actions')}</th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((acc, idx) => (
              <TableRow key={idx} className="group">
                <TableCell><input type="checkbox" className="rounded" /></TableCell>
                <TableCell>
                  <div className="overdue-accounts__client-cell">
                    <div className="overdue-accounts__avatar" style={{ backgroundColor: acc.bgColor || '#eff6ff' }}>
                      {acc.code}
                    </div>
                    <div className="overdue-accounts__client-info">
                      <span className="overdue-accounts__client-info-name">{acc.client}</span>
                      <span className="overdue-accounts__client-info-id">{acc.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">{formatPYG(acc.amount)}</TableCell>
                <TableCell className="text-center">
                  <span className={`status-pill ${acc.priority === 'High' ? 'status-pill--danger' : 'status-pill--warning'}`}>
                    {acc.days}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`rec-badge ${acc.priority === 'High' ? 'rec-badge--danger' : acc.priority === 'Medium' ? 'rec-badge--warning' : 'rec-badge--success'}`}>
                    {acc.priority} Priority
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-bold">{acc.lastContact}</p>
                  <p className="text-xs text-tertiary">{acc.contactVia}</p>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="overdue-accounts__row-actions">
                    <Button variant="ghost" size="icon" title="Llamar">
                      <span className="material-symbols-outlined">call</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-success" title="WhatsApp">
                      <span className="material-symbols-outlined">chat</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-primary" title="Email">
                      <span className="material-symbols-outlined">mail</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default OverdueTable;
