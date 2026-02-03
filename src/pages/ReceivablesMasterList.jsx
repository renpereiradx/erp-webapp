import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receivablesService } from '@/services/receivablesService';

const ReceivablesMasterList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await receivablesService.getMasterList(filters);
      setInvoices(response.data || response || []);
    } catch (error) {
      console.warn('Error loading master list, using fallback data:', error);
      // Mock data matching Stitch
      setInvoices([
          { id: 'INV-2023-001', clientName: 'Acme Corp', clientInitial: 'A', clientColor: 'blue', issueDate: 'Oct 12, 2023', dueDate: 'Nov 12, 2023', originalAmt: '$5,000.00', pendingAmt: '$2,500.00', status: 'Partial', statusColor: 'orange' },
          { id: 'INV-2023-042', clientName: 'Global Tech', clientInitial: 'G', clientColor: 'purple', issueDate: 'Sep 05, 2023', dueDate: 'Oct 05, 2023', originalAmt: '$12,450.00', pendingAmt: '$12,450.00', status: 'Overdue', statusColor: 'red' },
          { id: 'INV-2023-089', clientName: 'Wayne Ent.', clientInitial: 'W', clientColor: 'green', issueDate: 'Oct 20, 2023', dueDate: 'Nov 20, 2023', originalAmt: '$3,200.00', pendingAmt: '$3,200.00', status: 'Pending', statusColor: 'green' },
          { id: 'INV-2023-092', clientName: 'Stark Ind.', clientInitial: 'S', clientColor: 'indigo', issueDate: 'Oct 22, 2023', dueDate: 'Nov 22, 2023', originalAmt: '$85,000.00', pendingAmt: '$15,000.00', status: 'Partial', statusColor: 'orange' },
          { id: 'INV-2023-101', clientName: 'Daily Planet', clientInitial: 'D', clientColor: 'gray', issueDate: 'Oct 25, 2023', dueDate: 'Nov 25, 2023', originalAmt: '$1,200.00', pendingAmt: '$1,200.00', status: 'Pending', statusColor: 'green' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="receivables-master">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* Breadcrumbs */}
        <div className="receivable-detail__breadcrumbs">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Home</a>
            <span>/</span>
            <a href="#">Finance</a>
            <span>/</span>
            <span className="current">Receivables</span>
        </div>

        {/* Header */}
        <div className="receivables-master__header">
          <div>
            <h1 className="receivables-master__title">Accounts Receivable</h1>
            <p className="receivables-master__subtitle">Manage pending customer payments and collection status.</p>
          </div>
          <div className="receivables-master__actions">
            <button className="fluent-btn fluent-btn--outline">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button className="fluent-btn fluent-btn--primary">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>New Receivable</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="rec-filter-panel">
          <div className="rec-filter-panel__row">
            {/* Search */}
            <div className="rec-input-group">
              <label className="rec-input-group__label">Search Client</label>
              <div className="rec-input-group__wrapper">
                <div className="rec-input-group__icon">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input 
                  type="text" 
                  className="rec-input" 
                  placeholder="Company or Name"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="rec-input-group">
              <label className="rec-input-group__label">Status</label>
              <div className="rec-select-wrapper">
                <select 
                  className="rec-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="rec-input-group">
              <label className="rec-input-group__label">Due Date Range</label>
              <div className="flex gap-2 items-center">
                <div className="rec-input-group__wrapper">
                  <input type="date" className="rec-input" />
                </div>
                <span className="text-secondary">-</span>
                <div className="rec-input-group__wrapper">
                  <input type="date" className="rec-input" />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2">
              <button className="fluent-btn fluent-btn--outline" onClick={() => setFilters({ search: '', status: 'all', dateStart: '', dateEnd: '' })}>Clear</button>
              <button className="fluent-btn fluent-btn--primary">
                <span className="material-symbols-outlined">filter_list</span>
                <span>Apply</span>
              </button>
            </div>
          </div>

          {/* Active Tags */}
          <div className="rec-filter-panel__active-tags">
            {filters.status !== 'all' && (
              <div className="rec-tag rec-tag--blue">
                Status: {filters.status}
                <span className="rec-tag__close material-symbols-outlined">close</span>
              </div>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="rec-grid-container">
          <div className="rec-grid-toolbar">
            <div className="rec-grid-toolbar__info">
              Showing <strong>1-{invoices.length}</strong> of <strong>1,248</strong> items
            </div>
            <div className="rec-grid-toolbar__actions">
              <button className="rec-grid-toolbar__btn" title="Refresh" onClick={loadData}>
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button className="rec-grid-toolbar__btn" title="Settings">
                <span className="material-symbols-outlined">view_column</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="rec-table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" className="fluent-checkbox" /></th>
                  <th>
                    <div className="flex items-center gap-1 cursor-pointer">
                      ID <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </div>
                  </th>
                  <th>Client</th>
                  <th>Sale Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Original Amt</th>
                  <th className="text-right">Pending Amt</th>
                  <th className="text-center">Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center py-8">Loading...</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><input type="checkbox" className="fluent-checkbox" /></td>
                      <td>
                        <a href="#" className="text-primary font-medium hover:underline text-sm" onClick={(e) => { e.preventDefault(); navigate(`/receivables/detail/${inv.id}`); }}>
                          #{inv.id}
                        </a>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div 
                            className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ 
                              backgroundColor: `var(--rec-${inv.clientColor}-bg, #eff6ff)`, 
                              color: `var(--rec-${inv.clientColor}-text, #1d4ed8)` 
                            }}
                          >
                            {inv.clientInitial}
                          </div>
                          <span className="font-medium">{inv.clientName}</span>
                        </div>
                      </td>
                      <td className="text-secondary text-sm">{inv.issueDate}</td>
                      <td className="text-secondary text-sm">{inv.dueDate}</td>
                      <td className="text-secondary text-sm text-right font-mono">{inv.originalAmt}</td>
                      <td className="text-right font-mono font-semibold">{inv.pendingAmt}</td>
                      <td className="text-center">
                        <span className={`status-pill status-pill--${inv.statusColor || inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="text-secondary hover:text-primary p-1">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rec-pagination">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span>Rows per page:</span>
              <select className="bg-transparent font-medium text-primary focus:outline-none cursor-pointer">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-secondary">Page 1 of 125</span>
              <div className="flex items-center">
                <button className="p-1 rounded text-gray-400 cursor-not-allowed">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-1 rounded text-primary hover:bg-gray-100">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivablesMasterList;
