import { reservationService } from '@/services/reservationService'
import { productService } from '@/services/productService'
import { scheduleService } from '@/services/scheduleService'
import { telemetry } from '@/utils/telemetry'
import {
  DEMO_CONFIG_AVAILABLE_SLOTS,
  getDemoAvailableSlotProducts,
  getDemoAvailableSlots,
  getDemoAvailableSlotsDefaultDate,
} from '@/config/demoData'

const getTodayISODate = () => new Date().toISOString().split('T')[0]

const ensureArray = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  const candidates = [
    'data',
    'results',
    'items',
    'schedules',
    'slots',
    'products',
  ]
  for (const key of candidates) {
    if (Array.isArray(payload?.[key])) {
      return payload[key]
    }
  }
  return []
}

const normalizeProducts = payload =>
  ensureArray(payload)
    .map(item => {
      const id = item?.id ?? item?.product_id ?? item?.productId
      if (!id) return null

      const rawHours = item?.duration_hours ?? item?.durationHours
      const metadataHours = item?.metadata?.duration_hours

      const durationMinutesRaw =
        item?.duration_minutes ??
        item?.durationMinutes ??
        (typeof rawHours === 'number' ? rawHours * 60 : undefined)

      const metadataDuration =
        item?.metadata?.duration_minutes ??
        (typeof metadataHours === 'number' ? metadataHours * 60 : undefined)

      const durationMinutes = durationMinutesRaw ?? metadataDuration ?? 60

      return {
        id: String(id),
        name: item?.name ?? item?.product_name ?? 'Producto sin nombre',
        description: item?.description ?? item?.product_description ?? '',
        duration_minutes: durationMinutes,
        raw: item,
      }
    })
    .filter(Boolean)

const normalizeSlots = payload =>
  ensureArray(payload).map(slot => {
    const start = slot?.start_time ?? slot?.startTime ?? slot?.start
    const end = slot?.end_time ?? slot?.endTime ?? slot?.end
    const durationMinutes = slot?.duration_minutes
      ? Number(slot.duration_minutes)
      : slot?.durationMinutes
      ? Number(slot.durationMinutes)
      : slot?.duration_hours
      ? Number(slot.duration_hours) * 60
      : start && end
      ? Math.max(0, (new Date(end) - new Date(start)) / 60000)
      : 0

    return {
      id: slot?.id ?? slot?.schedule_id ?? slot?.slot_id ?? slot?.uuid ?? null,
      product_id: slot?.product_id ?? slot?.productId ?? slot?.service_id ?? '',
      product_name: slot?.product_name ?? slot?.productName ?? '',
      start_time: start,
      end_time: end,
      duration_minutes: Math.round(durationMinutes || 0),
      available_consecutive_hours: slot?.available_consecutive_hours,
      is_available:
        typeof slot?.is_available === 'boolean'
          ? slot.is_available
          : slot?.available ?? true,
      raw: slot,
    }
  })

export const availableSlotsService = {
  getDefaultSearchDate() {
    return getTodayISODate()
  },

  getMinimumSearchDate() {
    return getTodayISODate()
  },

  isDemoMode() {
    return false
  },

  async getReservableProducts() {
    const startTime = Date.now()

    try {
      // Usar getBeachTennisCourts que es el método disponible en apiClient
      const response = await productService.getBeachTennisCourts()
      const data = normalizeProducts(response)

      telemetry.record('availableSlots.service.products', {
        duration: Date.now() - startTime,
        count: data.length,
      })

      return {
        success: true,
        data,
        raw: response,
      }
    } catch (error) {
      telemetry.record('availableSlots.service.products.error', {
        duration: Date.now() - startTime,
        error: error?.message,
      })

      throw error
    }
  },

  async searchAvailableSlots({ productId, date, duration }) {
    const startTime = Date.now()
    const durationMinutes = Number(duration) || 60
    const durationHours = durationMinutes / 60

    try {
      // Usar el endpoint que devuelve TODOS los schedules (disponibles y reservados)
      const response = await scheduleService.getAllSchedulesByProductAndDate(
        productId,
        date
      )

      // Extraer los schedules del response
      const schedules = response?.data || response || []
      const normalizedData = normalizeSlots(schedules)

      // 🎯 Devolver todos los slots que vienen del backend
      // El backend ya devuelve los slots en el formato correcto
      const individualSlots = normalizedData.map(slot => ({
        ...slot,
        duration_minutes: durationMinutes,
        available_consecutive_hours: durationHours,
      }))

      telemetry.record('availableSlots.service.slots', {
        duration: Date.now() - startTime,
        count: individualSlots.length,
        total_from_backend: normalizedData.length,
      })

      return {
        success: true,
        data: individualSlots,
        raw: response,
      }
    } catch (error) {
      telemetry.record('availableSlots.service.slots.error', {
        duration: Date.now() - startTime,
        error: error?.message,
      })

      throw error
    }
  },
}

export default availableSlotsService
