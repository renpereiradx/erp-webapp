import React, { useEffect } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  RefreshCcw,
  Columns
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { invoicesMasterData } from '../features/accounts-payable/data/invoicesMockData';

/**
 * Invoices Master List Page.
 * Displays all invoices with advanced filtering and high-density table.
 */
const InvoicesMasterList = () => {
  useEffect(() => {
    document.title = 'Lista Maestra de Facturas | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="invoices-master animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <nav className="invoices-master__breadcrumb">
        <span>Home</span>
        <span>/</span>
        <span>Finanzas</span>
        <span>/</span>
        <span>Facturas</span>
      </nav>

      {/* Header Section */}
      <header className="invoices-master__header">
        <div className="invoices-master__title-group">
          <h1 className="invoices-master__title">Lista Maestra de Facturas</h1>
          <p className="invoices-master__subtitle">Gestiona y rastrea todas las facturas de proveedores y estados de pago.</p>
        </div>
        <div className="invoices-master__actions">
          <Button variant="secondary" className="invoices-master__action-btn">
            <Download size={18} />
            <span className="invoices-master__action-text">Exportar CSV</span>
          </Button>
          <Button variant="primary" className="invoices-master__action-btn">
            <Plus size={18} />
            <span>Nueva Factura</span>
          </Button>
        </div>
      </header>

      {/* Filter Panel */}
      <section className="invoices-master__filters">
        <div className="invoices-master__filter-item invoices-master__filter-item--search">
          <label>Buscar</label>
          <div className="invoices-master__search-wrapper">
            <Search />
            <Input 
              placeholder="Buscar proveedor o factura..." 
              className="invoices-master__search-input"
            />
          </div>
        </div>
        
        <div className="invoices-master__filter-item">
          <label>Estado</label>
          <select className="input input--filled">
            <option>Todos los Estados</option>
            <option>Vencida</option>
            <option>Pendiente</option>
            <option>Pagada</option>
            <option>Parcial</option>
          </select>
        </div>

        <div className="invoices-master__filter-item">
          <label>Prioridad</label>
          <select className="input input--filled">
            <option>Todas las Prioridades</option>
            <option>ALTA</option>
            <option>MEDIA</option>
            <option>BAJA</option>
          </select>
        </div>

        <div className="invoices-master__filter-item invoices-master__filter-item--date">
          <label>Rango de Fechas</label>
          <div className="invoices-master__date-range">
            <Input type="date" className="input--filled" />
            <span className="invoices-master__date-separator">-</span>
            <Input type="date" className="input--filled" />
          </div>
        </div>

        <div className="invoices-master__filter-actions">
          <Button variant="ghost" size="icon" className="invoices-master__filter-btn">
            <Filter size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="invoices-master__filter-btn">
            <Search size={20} />
          </Button>
        </div>
      </section>

      {/* Data Grid Container */}
      <Card className="invoices-master__table-card">
        <CardHeader className="invoices-master__table-toolbar">
          <div className="invoices-master__table-info">
            Mostrando <strong>1-{invoicesMasterData.invoices.length}</strong> de <strong>1,248</strong> facturas
          </div>
          <div className="invoices-master__toolbar-actions">
            <Button variant="ghost" size="icon" title="Actualizar">
              <RefreshCcw size={18} />
            </Button>
            <Button variant="ghost" size="icon" title="Configurar Columnas">
              <Columns size={18} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto payables-table-container">
            <Table className="high-density-table">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="invoices-master__table-check">
                                <input type="checkbox" className="checkbox" />
                              </TableHead>
                              <TableHead>ID Factura</TableHead>
                              <TableHead>Proveedor</TableHead>
                              <TableHead>Fecha Pedido</TableHead>
                              <TableHead>Vencimiento</TableHead>
                              <TableHead className="invoices-master__table-cell-right">Importe Total</TableHead>
                              <TableHead className="invoices-master__table-cell-right">Importe Pendiente</TableHead>
                              <TableHead className="invoices-master__table-cell-center">Estado</TableHead>
                              <TableHead className="invoices-master__table-cell-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoicesMasterData.invoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell>
                                  <input type="checkbox" className="checkbox" />
                                </TableCell>
                                <TableCell className="invoice-table__id">#{invoice.id}</TableCell>
                                <TableCell>
                                  <div className="invoice-table__vendor-cell">
                                    <div className="avatar avatar--24 avatar--brand">
                                      <span className="avatar__initials">{invoice.vendor.substring(0, 1)}</span>
                                    </div>
                                    <span className="invoice-table__vendor">{invoice.vendor}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{invoice.orderDate}</TableCell>
                                <TableCell>{invoice.dueDate}</TableCell>
                                <TableCell className="invoice-table__amount invoices-master__table-cell-right">
                                  {formatCurrency(invoice.totalAmount)}
                                </TableCell>
                                <TableCell className={`invoice-table__amount-pending invoices-master__table-cell-right ${invoice.pendingAmount > 0 && invoice.status === 'Vencida' ? 'invoice-table__amount-pending--danger' : ''}`}>
                                  {formatCurrency(invoice.pendingAmount)}
                                </TableCell>
                                <TableCell className="invoices-master__table-cell-center">
                                  <span className={`payment-list__status payment-list__status--${invoice.statusType}`}>
                                    {invoice.status}
                                  </span>
                                </TableCell>
                                <TableCell className="invoices-master__table-cell-right">
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal size={18} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
              
            </Table>
          </div>
        </CardContent>

        <CardFooter className="invoices-master__footer">
          <div className="invoices-master__rows-per-page">
            <span>Filas por página:</span>
            <select>
              <option>10</option>
              <option selected>20</option>
              <option>50</option>
            </select>
          </div>
          
          <div className="invoices-master__pagination">
            <span className="invoices-master__pagination-info">Página 1 de 63</span>
            <div className="invoices-master__pagination-actions">
              <Button variant="secondary" className="btn--icon-only h-8 w-8" disabled>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="primary" className="btn--icon-only h-8 w-8">1</Button>
              <Button variant="ghost" className="btn--icon-only h-8 w-8">2</Button>
              <Button variant="ghost" className="btn--icon-only h-8 w-8">3</Button>
              <Button variant="secondary" className="btn--icon-only h-8 w-8">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvoicesMasterList;
