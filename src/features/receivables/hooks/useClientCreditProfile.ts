import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { clientService } from '@/services/clientService'
import { tRaw } from '@/lib/i18n'
import { buildInvoiceAgingBuckets } from '@/domain/receivables/aging'
import type { ClientCreditProfileBundle } from '../types'

/**
 * Perfil de crédito unificado del cliente (endpoints 6 y 7 + cliente
 * básico). Migración FASE 3: .ts + guard anti-carrera + tRaw.
 */
export const useClientCreditProfile = (clientId: string | undefined) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ClientCreditProfileBundle | null>(null)
  const requestSeq = useRef(0)

  const fetchAllData = useCallback(async () => {
    if (!clientId) return
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      // Ejecutamos ambas peticiones en paralelo (Endpoints 6 y 7)
      const [profileRes, riskRes, basicInfoRes] = (await Promise.all([
        receivablesService.getClientProfile(clientId).catch((err) => ({ success: false, error: err })),
        receivablesService.getClientRisk(clientId).catch((err) => ({ success: false, error: err })),
        clientService.getById(clientId).catch(() => null),
      ])) as [Record<string, any>, Record<string, any>, Record<string, any> | null]

      if (seq !== requestSeq.current) return

      // Normalizamos la respuesta (podría ser un array directo o un objeto con data)
      const profile = profileRes?.data || profileRes
      const risk = riskRes?.data || riskRes

      if (!profile || (profileRes?.success === false && !profileRes.client_name)) {
        throw new Error(
          tRaw('bi.receivables.profile.loadError', 'No se pudo cargar la información del cliente', {}),
        )
      }

      // Formateador de moneda PYG
      const formatPYG = (val: unknown) =>
        new Intl.NumberFormat('es-PY', {
          style: 'currency',
          currency: 'PYG',
          maximumFractionDigits: 0,
        }).format(Number(val) || 0)

      const p = (profile ?? {}) as Record<string, any>
      const basic = (basicInfoRes ?? {}) as Record<string, any>

      // Mapear datos a estructura camelCase esperada por la UI
      setData({
        client: {
          name: p.client_name || p.name || basic.name || 'Cliente',
          id: p.client_id || p.id || clientId,
          status: (p.total_overdue || 0) > 0 ? 'Cuenta con Deuda' : 'Cuenta Activa',
          address: p.client_address || p.address || basic.address || 'Sin dirección registrada',
          contact: p.client_contact || p.contact || basic.contact || 'Sin contacto definido',
          phone: p.client_phone || p.phone || basic.phone || 'Sin télefono',
          rep: p.assigned_rep || p.rep || 'No asignado',
          taxId: p.tax_id || p.taxId || basic.document_id || 'No registrado',
        },
        risk: {
          // La API no provee score numérico: el gauge muestra el nivel (RiskGauge maneja score null)
          score: risk.risk_score ?? risk.score ?? null,
          level:
            (risk.risk_level || risk.level) === 'LOW'
              ? 'Riesgo Bajo'
              : (risk.risk_level || risk.level) === 'MEDIUM'
                ? 'Riesgo Medio'
                : 'Riesgo Alto',
          recommendation: Array.isArray(risk.recommendations)
            ? risk.recommendations.join('. ')
            : risk.recommendation ||
              ((risk.overdue_ratio ?? 0) >= 0.5
                ? `El ${(risk.overdue_ratio * 100).toFixed(0)}% del saldo está vencido (máximo ${Math.round(risk.max_days_overdue || 0)} días). Solicitar regularización antes de nuevo crédito.`
                : 'Sin alertas automáticas para este cliente.'),
        },
        metrics: {
          outstanding: formatPYG(p.total_pending),
          limit: p.credit_limit ? formatPYG(p.credit_limit) : 'Sin límite definido',
          avgDays: `${p.average_days_to_pay || p.avg_days_to_pay || 0} Días`,
          lastPayment: formatPYG(p.last_payment_amount || 0),
          utilization: p.credit_limit
            ? Math.round(((p.total_pending || 0) / p.credit_limit) * 100)
            : null,
        },
        aging: buildInvoiceAgingBuckets(p.receivables).map((b) => ({
          ...b,
          amount: formatPYG(b.amount),
          width: `${b.percent}%`,
        })),
        invoices: Array.isArray(p.receivables)
          ? p.receivables.map((inv: Record<string, any>) => ({
              id: inv.id,
              date: new Date(inv.sale_date).toLocaleDateString('es-PY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              due: new Date(inv.due_date).toLocaleDateString('es-PY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              amount: formatPYG(inv.original_amount),
              balance: formatPYG(inv.pending_amount),
              status:
                inv.status === 'OVERDUE'
                  ? 'Vencido'
                  : inv.status === 'PARTIAL'
                    ? 'Pago Parcial'
                    : 'Corriente',
            }))
          : [],
      })
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.error('Error fetching client profile data:', err)
      setError((err as Error).message)
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return { data, loading, error, refresh: fetchAllData }
}
