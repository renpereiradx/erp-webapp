import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tabla principal para la lista maestra de cuentas por cobrar.
 */
const MasterListTable = ({ invoices = [], loading }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Defensive check: ensure invoices is always an array
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="rec-grid-container">
      <div className="rec-grid-toolbar">
        <div className="rec-grid-toolbar__info">
          {t('common.pagination.showing', 'Mostrando')} <strong>1-{safeInvoices.length}</strong> {t('common.pagination.of', 'de')} <strong>1,248</strong> items
        </div>
        <div className="rec-grid-toolbar__actions">
          <Button variant="ghost" size="icon" title="Actualizar">
            <span className="material-symbols-outlined">refresh</span>
          </Button>
          <Button variant="ghost" size="icon" title="Columnas">
            <span className="material-symbols-outlined">view_column</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><input type="checkbox" className="fluent-checkbox" /></TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer">
                  {t('receivables.master.table.id')} <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_downward</span>
                </div>
              </TableHead>
              <TableHead>{t('receivables.master.table.client')}</TableHead>
              <TableHead>{t('receivables.master.table.sale_date')}</TableHead>
              <TableHead>{t('receivables.master.table.due_date')}</TableHead>
              <TableHead className="text-right">{t('receivables.master.table.original_amt')}</TableHead>
              <TableHead className="text-right">{t('receivables.master.table.pending_amt')}</TableHead>
              <TableHead className="text-center">{t('receivables.master.table.status')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('receivables.loading.generic')}
                </TableCell>
              </TableRow>
            ) : (
              safeInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell><input type="checkbox" className="fluent-checkbox" /></TableCell>
                  <TableCell>
                    <a 
                      href="#" 
                      className="text-primary font-medium hover:underline"
                      onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}
                    >
                      #{inv.id}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ 
                          backgroundColor: inv.clientColor || '#eff6ff', 
                          color: '#1d4ed8' 
                        }}
                      >
                        {inv.clientInitial || inv.clientName?.charAt(0)}
                      </div>
                      <span className="font-medium">{inv.clientName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary">{inv.issueDate}</TableCell>
                  <TableCell className="text-secondary">{inv.dueDate}</TableCell>
                  <TableCell className="text-secondary text-right font-mono">{formatPYG(inv.originalAmt)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatPYG(inv.pendingAmt)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`status-pill status-pill--${(inv.statusColor || inv.status || '').toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rec-pagination">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span>{t('receivables.master.pagination.rows_per_page')}</span>
          <select className="bg-transparent font-medium text-primary focus:outline-none cursor-pointer">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-secondary">
            {t('receivables.master.pagination.page_info', { page: 1, total: 125 })}
          </span>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </Button>
            <Button variant="ghost" size="icon">
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterListTable;
