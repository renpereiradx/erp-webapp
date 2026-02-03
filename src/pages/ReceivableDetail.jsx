import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { receivablesService } from '@/services/receivablesService';

const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use mock data structure from Stitch if service fails or while loading
  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      try {
        const response = await receivablesService.getTransactionDetail(id);
        setData(response.data || response);
      } catch (error) {
        console.warn('Error loading detail, using mock data for UI demo:', error);
        setData({
            id: 'INV-2023-001',
            client: { name: 'Acme Corporation', id: '8832', contact: 'Sarah Jenkins', email: 'billing@acmecorp.com', phone: '+1 (555) 000-1234', address: '123 Market St, San Francisco, CA' },
            transaction: { 
                issueDate: 'Oct 24, 2023', 
                dueDate: 'Nov 24, 2023', 
                amount: '10,000.00', 
                paid: '2,500.00',
                balance: '7,500.00',
                status: 'Overdue',
                currency: '$'
            },
            paymentHistory: [
                { date: 'Nov 15, 2023', ref: 'TRX-00921', method: 'ACH Transfer', note: 'Partial payment per agreement', amount: '2,000.00' },
                { date: 'Nov 01, 2023', ref: 'CHK-8821', method: 'Check', note: 'Initial deposit', amount: '500.00' }
            ]
        });
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  if (loading) return <div className="flex justify-center p-10"><span className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></span></div>;
  if (!data) return <div className="p-10 text-center">Transaction not found</div>;

  return (
    <div className="receivable-detail">
        {/* Breadcrumbs */}
        <div className="receivable-detail__breadcrumbs">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/receivables'); }}>Receivables</a>
            <span>/</span>
            <a href="#">Active</a>
            <span>/</span>
            <span className="current">Invoice #{data.id}</span>
        </div>

        {/* Header Section */}
        <div className="rec-card rec-card--header">
            <div className="receivable-detail__main-info">
                <div className="receivable-detail__title-group">
                    <div className="receivable-detail__icon-box">
                        <span className="material-symbols-outlined text-3xl">domain</span>
                    </div>
                    <div>
                        <div className="receivable-detail__title">
                            <h1>Invoice #{data.id}</h1>
                            <div className="rec-badge rec-badge--danger">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                <span>Overdue</span>
                            </div>
                        </div>
                        <p className="receivable-detail__subtitle">{data.client.name} • Client ID: {data.client.id || 'N/A'}</p>
                        <div className="receivable-detail__meta">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            <span>Issued: <strong>{data.transaction.issueDate}</strong></span>
                            <span className="size-1 rounded-full bg-gray-300"></span>
                            <span>Due: <strong>{data.transaction.dueDate}</strong></span>
                            <span className="size-1 rounded-full bg-gray-300"></span>
                            <span className="text-danger font-medium">15 Days Overdue</span>
                        </div>
                    </div>
                </div>
                <div className="receivable-detail__actions">
                    <button className="fluent-btn fluent-btn--outline h-10">
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>PDF</span>
                    </button>
                    <button className="fluent-btn fluent-btn--outline h-10">
                        <span className="material-symbols-outlined text-lg">print</span>
                        <span>Print</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="receivable-detail__stats-bar">
                <div className="receivable-detail__stat-item">
                    <p className="receivable-detail__stat-label">Total Invoiced</p>
                    <p className="receivable-detail__stat-value">{data.transaction.currency}{data.transaction.amount}</p>
                </div>
                <div className="receivable-detail__stat-item has-connector">
                    <p className="receivable-detail__stat-label">Total Paid</p>
                    <p className="receivable-detail__stat-value receivable-detail__stat-value--success">
                        {data.transaction.currency}{data.transaction.paid}
                    </p>
                </div>
                <div className="receivable-detail__stat-item has-equal">
                    <p className="receivable-detail__stat-label">Balance Due</p>
                    <p className="receivable-detail__stat-value receivable-detail__stat-value--primary">
                        {data.transaction.currency}{data.transaction.balance}
                    </p>
                    <div className="receivable-detail__progress">
                        <div className="receivable-detail__progress-fill" style={{ width: '75%' }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Grid */}
        <div className="receivable-detail__content-grid">
            {/* Left Column: Payment History */}
            <div className="rec-card p-0 overflow-hidden flex flex-col h-full">
                <div className="payment-history__header">
                    <h3 className="payment-history__title">Payment History</h3>
                    <div className="flex gap-2">
                        <button className="rec-grid-toolbar__btn" title="Filter">
                            <span className="material-symbols-outlined text-xl">filter_list</span>
                        </button>
                        <button className="rec-grid-toolbar__btn" title="Export CSV">
                            <span className="material-symbols-outlined text-xl">ios_share</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="rec-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Reference</th>
                                <th>Method</th>
                                <th>Note</th>
                                <th className="text-right">Amount</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {data.paymentHistory.map((payment, idx) => (
                                <tr key={idx} className="group transition-colors">
                                    <td>{payment.date}</td>
                                    <td className="payment-history__ref">{payment.ref}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">
                                                {payment.method === 'Check' ? 'payments' : 'account_balance'}
                                            </span>
                                            <span>{payment.method}</span>
                                        </div>
                                    </td>
                                    <td className="text-secondary truncate max-w-[150px]">{payment.note}</td>
                                    <td className="text-right font-medium">{data.transaction.currency}{payment.amount}</td>
                                    <td className="text-center">
                                        <button className="invisible group-hover:visible text-gray-400 hover:text-primary">
                                            <span className="material-symbols-outlined text-lg">more_vert</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="payment-history__footer">
                            <tr>
                                <td colSpan="4" className="text-right text-xs font-medium uppercase tracking-wide text-secondary">Total Paid</td>
                                <td className="text-right font-bold text-lg">{data.transaction.currency}{data.transaction.paid}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Right Column: Actions & Contact */}
            <div className="receivable-detail__sidebar">
                {/* Quick Actions */}
                <div className="action-card">
                    <h3 className="action-card__title">Quick Actions</h3>
                    <button className="fluent-btn fluent-btn--primary fluent-btn--full h-11 text-base shadow-sm">
                        <span className="material-symbols-outlined">add_card</span>
                        Register Payment
                    </button>
                    <div className="action-card__grid">
                        <button className="fluent-btn fluent-btn--outline h-10 text-sm font-medium">
                            <span className="material-symbols-outlined text-lg">send</span>
                            Reminder
                        </button>
                        <button className="fluent-btn fluent-btn--outline h-10 text-sm font-medium">
                            <span className="material-symbols-outlined text-lg">flag</span>
                            Dispute
                        </button>
                    </div>
                </div>

                {/* Client Contact */}
                <div className="client-card">
                    <div className="client-card__header">
                        <h3 className="rec-card__title mb-0">Client Contact</h3>
                        <button className="text-primary text-sm font-medium hover:underline">Edit</button>
                    </div>
                    
                    <div className="client-card__profile">
                        <div className="client-card__avatar" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuCOi30NHUaf4I_kmAj1oKcwcBBQ3j0_6RBSnHpQWB8NW1YnneN_vvv0kcfmz2Ne7ufTUu1ztIRThGXrgQ_SfVFqqzZDG0eF5ipF8Pm4-WEzrSzhaEMv5x8mll5B41UXRGzcm5QqEXNBLhES8oQGTo8stzwSTEbj6wyqtSXeIIATfikRcGJh1Xi2-HMT0CCebBaHciPnu-Dy9DlvwqLVv7tyM58VwZyYhFdKLWHAX4MoBaPrsLyuOBr2XTB2zRyn_YSYw3M96DQ-JA)' }}></div>
                        <div>
                            <p className="text-sm font-semibold">{data.client.contact}</p>
                            <p className="text-xs text-secondary">Billing Manager</p>
                        </div>
                    </div>
                    
                    <div className="h-px bg-border w-full mb-4"></div>
                    
                    <div className="flex flex-col gap-3">
                        <div className="client-card__info-row">
                            <span className="material-symbols-outlined client-card__icon">mail</span>
                            <a href={`mailto:${data.client.email}`} className="truncate">{data.client.email}</a>
                        </div>
                        <div className="client-card__info-row">
                            <span className="material-symbols-outlined client-card__icon">call</span>
                            <a href={`tel:${data.client.phone}`}>{data.client.phone}</a>
                        </div>
                        <div className="client-card__info-row">
                            <span className="material-symbols-outlined client-card__icon">location_on</span>
                            <span className="truncate text-secondary">{data.client.address}</span>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="activity-card">
                    <div className="activity-card__header">Activity & Notes</div>
                    <div className="activity-card__body">
                        <div className="activity-card__input-area">
                            <textarea className="activity-card__textarea" placeholder="Add a note..." rows="2"></textarea>
                            <div className="flex justify-end">
                                <button className="fluent-btn fluent-btn--primary fluent-btn--sm">Post Note</button>
                            </div>
                        </div>
                        <div className="activity-card__timeline">
                            {/* System Event */}
                            <div className="activity-card__item">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-secondary">Today, 9:41 AM</p>
                                    <p className="text-sm"><span className="font-semibold">System</span> sent automated overdue reminder via Email.</p>
                                </div>
                            </div>
                            {/* Manual Note */}
                            <div className="activity-card__item activity-card__item--primary">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-secondary">Yesterday, 4:20 PM</p>
                                    <div className="bg-blue-50 p-3 rounded-lg rounded-tl-none">
                                        <p className="text-sm">Called Sarah. She confirmed the remaining balance check will be mailed this Friday.</p>
                                        <p className="text-xs text-primary mt-1 font-medium">- You</p>
                                    </div>
                                </div>
                            </div>
                            {/* Payment */}
                            <div className="activity-card__item activity-card__item--success">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-secondary">Nov 15, 2023</p>
                                    <p className="text-sm">Payment of <span className="font-bold text-success">$2,000.00</span> received via ACH.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReceivableDetail;
