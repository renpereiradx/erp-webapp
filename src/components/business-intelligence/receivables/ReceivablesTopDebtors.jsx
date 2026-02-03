import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceivablesTopDebtors = ({ debtorsData }) => {
  const navigate = useNavigate();

  // Mock data strictly matching Stitch screenshot "Recent Invoices" table
  const invoices = [
      { id: 'INV-2023-001', client: 'Acme Corp', code: 'AC', color: '#eff6ff', textColor: '#2563eb', date: 'Oct 24, 2023', amount: '$12,450.00', status: 'Paid', statusClass: 'status-pill--success' },
      { id: 'INV-2023-002', client: 'Globex Inc', code: 'GI', color: '#f5f3ff', textColor: '#7c3aed', date: 'Oct 22, 2023', amount: '$3,200.00', status: 'Pending', statusClass: 'status-pill--warning' },
      { id: 'INV-2023-003', client: 'Soylent Corp', code: 'ST', color: '#fef2f2', textColor: '#dc2626', date: 'Sep 15, 2023', amount: '$8,900.00', status: 'Overdue', statusClass: 'status-pill--danger' },
  ];

  return (
    <div className="overflow-x-auto">
        <table className="rec-table">
            <thead>
                <tr>
                    <th className="px-6 py-3">Invoice ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                {invoices.map((inv, idx) => (
                    <tr key={idx}>
                        <td className="col-id">{inv.id}</td>
                        <td>
                            <div className="col-customer">
                                <div 
                                    className="customer-avatar"
                                    style={{ backgroundColor: inv.color, color: inv.textColor }}
                                >
                                    {inv.code}
                                </div>
                                <span>{inv.client}</span>
                            </div>
                        </td>
                        <td>{inv.date}</td>
                        <td className="col-amount">{inv.amount}</td>
                        <td>
                            <span className={`status-pill ${inv.statusClass}`}>
                                {inv.status}
                            </span>
                        </td>
                        <td className="text-right">
                            <button 
                                onClick={() => navigate(`/receivables/detail/${inv.id}`)}
                                className="action-btn"
                            >
                                View
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default ReceivablesTopDebtors;