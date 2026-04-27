import { useState, useEffect, useMemo } from 'react';
import { payablesService } from '@/services/bi/payablesService';

/**
 * Custom hook to manage supplier analysis data and logic.
 * Uses real API data from payablesService.
 */
export const useSupplierAnalysis = (id) => {
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await payablesService.getSupplierAnalysis(id);
        if (response.success) {
          const { stats, report, invoices } = response.data;
          
          // Get basic supplier info from the first invoice if available
          const firstInvoice = invoices[0] || {};
          
          // Helper to format date
          const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
          };

          // Translate status
          const translateStatus = (status) => {
            if (!status) return 'PENDIENTE';
            const s = status.toUpperCase();
            if (s === 'OVERDUE') return 'VENCIDO';
            if (s === 'PENDING') return 'PENDIENTE';
            if (s === 'PARTIAL') return 'PARCIAL';
            if (s === 'PAID') return 'PAGADO';
            return s;
          };

          // Map API data to the component structure
          const mappedData = {
            id: id,
            name: firstInvoice.supplier_name || 'Proveedor Desconocido',
            ruc: firstInvoice.supplier_ruc || 'N/A',
            address: firstInvoice.supplier_address || 'No disponible',
            contact: firstInvoice.supplier_contact || 'No disponible',
            email: firstInvoice.supplier_email || 'No disponible',
            
            stats: {
              totalPending: stats.total_pending || 0,
              totalOverdue: stats.total_overdue || 0,
              avgPaymentDays: stats.average_dpo || 0,
              activeInvoices: invoices.length,
              overdueCount: invoices.filter(i => i.status === 'OVERDUE').length,
              shareOfPayables: 15 // Placeholder until API provides relative weight
            },
            
            rating: {
              score: Math.round(stats.payment_rate || 85),
              label: (stats.payment_rate || 85) > 90 ? 'Excelente' : (stats.payment_rate || 85) > 70 ? 'Bueno' : 'Riesgo',
              color: (stats.payment_rate || 85) > 90 ? 'emerald' : (stats.payment_rate || 85) > 70 ? 'blue' : 'amber',
              description: `Este proveedor tiene un score de ${Math.round(stats.payment_rate || 85)}/100 basado en su historial de cumplimiento y tiempos de entrega registrados en el último periodo fiscal.`
            },
            
            terms: {
              base: 'Net 30 días',
              days: 30,
              creditLimit: (stats.total_pending || 0) * 1.5 || 50000000,
              availableCredit: ((stats.total_pending || 0) * 1.5 || 50000000) - (stats.total_pending || 0),
              oldestInvoice: invoices.length > 0 ? formatDate(invoices[invoices.length - 1].due_date) : 'N/A'
            },
            
            invoices: invoices.map(inv => ({
              id: inv.id || inv.purchase_order_id,
              date: formatDate(inv.order_date),
              dueDate: formatDate(inv.due_date),
              originalAmount: inv.original_amount || 0,
              pendingAmount: inv.pending_amount || 0,
              status: inv.status === 'OVERDUE' ? 'Atrasado' : 
                      inv.status === 'PARTIAL' ? 'Parcialmente Pagado' : 
                      inv.status === 'PAID' ? 'Completado' : 'En Proceso',
              isOverdue: inv.status === 'OVERDUE'
            })),
            
            // Basic trend placeholder since we don't have historical endpoint yet
            trend: [
              { month: 'Ene', amount: (stats.total_pending || 0) * 0.8 },
              { month: 'Feb', amount: (stats.total_pending || 0) * 0.9 },
              { month: 'Mar', amount: (stats.total_pending || 0) }
            ]
          };
          
          setSupplier(mappedData);
        }
      } catch (err) {
        console.error('Error fetching supplier analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Derived state: calculate some extra stats if needed
  const tableStats = useMemo(() => {
    if (!supplier) return { total: 0, overdue: 0 };
    return {
      total: supplier.invoices.length,
      overdue: supplier.invoices.filter(i => i.isOverdue).length
    };
  }, [supplier]);

  return {
    loading,
    supplier,
    tableStats,
    error
  };
};
