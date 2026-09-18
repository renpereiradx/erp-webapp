import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { clientService } from '@/services/clientService'
import { tRaw } from '@/lib/i18n'
import { transformDetailData } from '@/domain/receivables/mappers'
import type { ReceivableDetailData } from '../types'

/**
 * Detalle de una cuenta por cobrar (GET /receivables/{id} + enriquecimiento
 * con datos del cliente e historial de auditoría opcional).
 * Migración FASE 3: .ts + guard anti-carrera + tRaw.
 */
export const useReceivableDetail = (id: string | undefined) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReceivableDetailData | null>(null)
  const requestSeq = useRef(0)

  const loadDetail = useCallback(async () => {
    if (!id) return
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getTransactionDetail(id)
      if (seq !== requestSeq.current) return
      const raw =
        (response as Record<string, any>)?.data?.data ||
        (response as Record<string, any>)?.data ||
        response

      const transformed = transformDetailData(raw) as ReceivableDetailData

      // Intentar enriquecer con datos básicos del cliente si faltan
      if (transformed.client?.id) {
        try {
          const clientBasic = await clientService.getById(transformed.client.id)
          if (seq !== requestSeq.current) return
          if (clientBasic) {
            const basic = clientBasic as Record<string, any>
            transformed.client.phone = transformed.client.phone || basic.phone
            transformed.client.email = transformed.client.email || basic.email
            transformed.client.address = transformed.client.address || basic.address
            transformed.client.taxId = basic.document_id
          }
        } catch (e) {
          console.warn('Could not fetch additional client info:', e)
        }
      }

      // Intentar cargar historial de auditoría real si está disponible
      try {
        // Si el ID referencia la venta (prefijo SALE/VTA), la entidad auditada es SALE
        const entityType = id.includes('SALE') || id.includes('VTA') ? 'SALE' : 'RECEIVABLE'
        const auditResponse = (await receivablesService.getTransactionHistory(id, entityType)) as Record<string, any>

        if (seq !== requestSeq.current) return
        if (auditResponse && auditResponse.success && auditResponse.data?.changes) {
          const auditActivities = auditResponse.data.changes.map((change: Record<string, any>) => ({
            id: `audit-${change.id}`,
            type: change.action === 'CREATE' ? 'SYSTEM' : 'NOTE',
            date: change.timestamp?.split('T')[0] || '',
            time: change.timestamp?.split('T')[1]?.substring(0, 5) || '',
            description: change.description || `Cambio en la entidad: ${change.action}`,
            user: change.username || change.user_id || 'Sistema',
          }))

          // Combinar y volver a ordenar
          transformed.activities = [
            ...transformed.activities,
            ...auditActivities,
          ].sort(
            (a, b) =>
              new Date(`${b.date}T${b.time || '00:00'}`).getTime() -
              new Date(`${a.date}T${a.time || '00:00'}`).getTime(),
          )

          // Eliminar duplicados si los hay (por ID)
          const seen = new Set<string>()
          transformed.activities = transformed.activities.filter((a) => {
            if (seen.has(a.id)) return false
            seen.add(a.id)
            return true
          })
        }
      } catch (auditErr) {
        console.debug('Audit history not available for this entity. Using payment history only.')
      }

      if (seq !== requestSeq.current) return
      setData(transformed)
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.error('Error loading receivable detail:', err)
      setError(tRaw('bi.receivables.detail.loadError', 'Error al cargar el detalle de la cuenta.', {}))
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  return {
    data,
    loading,
    error,
    refresh: loadDetail,
  }
}
