import { reservationService } from '@/services/reservationService'
import { productService } from '@/services/productService'
import { telemetry } from '@/utils/telemetry'
import {
  DEMO_CONFIG_AVAILABLE_SLOTS,
  getDemoAvailableSlotProducts,
  getDemoAvailableSlots,
} from '@/config/demoData'

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
      id:
        slot?.id ??
        slot?.schedule_id ??
        slot?.slot_id ??
        slot?.uuid ??
        `${slot?.product_id || slot?.productId}-${start}`,
      product_id: slot?.product_id ?? slot?.productId ?? slot?.service_id ?? '',
      product_name: slot?.product_name ?? slot?.productName ?? '',
      start_time: start,
      end_time: end,
      duration_minutes: Math.round(durationMinutes || 0),
      is_available:
        typeof slot?.is_available === 'boolean'
          ? slot.is_available
          : slot?.available ?? true,
      raw: slot,
    }
  })

const shouldUseDemoData = () =>
  DEMO_CONFIG_AVAILABLE_SLOTS.enabled && !DEMO_CONFIG_AVAILABLE_SLOTS.useRealAPI

export const availableSlotsService = {
  async getReservableProducts() {
    const startTime = Date.now()

    if (shouldUseDemoData()) {
      const result = await getDemoAvailableSlotProducts()
      telemetry.record('availableSlots.service.products.demo', {
        duration: Date.now() - startTime,
        count: result?.data?.length || 0,
      })
      return result
    }

    try {
      const response = await productService.getServiceCourts()
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

      if (DEMO_CONFIG_AVAILABLE_SLOTS.enabled) {
        const fallback = await getDemoAvailableSlotProducts()
        telemetry.record('availableSlots.service.products.demo_fallback', {
          duration: Date.now() - startTime,
          count: fallback?.data?.length || 0,
        })
        return fallback
      }

      throw error
    }
  },

  async searchAvailableSlots({ productId, date, duration }) {
    const startTime = Date.now()
    const durationMinutes = Number(duration) || 60
    const durationHours = Math.max(durationMinutes / 60, 0.5)

    if (shouldUseDemoData()) {
      const result = await getDemoAvailableSlots({
        productId,
        date,
        durationMinutes,
      })
      telemetry.record('availableSlots.service.slots.demo', {
        duration: Date.now() - startTime,
        count: result?.data?.length || 0,
      })
      return result
    }

    try {
      const response = await reservationService.getAvailableSchedules(
        productId,
        date,
        durationHours
      )
      const data = normalizeSlots(response)

      telemetry.record('availableSlots.service.slots', {
        duration: Date.now() - startTime,
        count: data.length,
      })

      return {
        success: true,
        data,
        raw: response,
      }
    } catch (error) {
      telemetry.record('availableSlots.service.slots.error', {
        duration: Date.now() - startTime,
        error: error?.message,
      })

      if (DEMO_CONFIG_AVAILABLE_SLOTS.enabled) {
        const fallback = await getDemoAvailableSlots({
          productId,
          date,
          durationMinutes,
        })
        telemetry.record('availableSlots.service.slots.demo_fallback', {
          duration: Date.now() - startTime,
          count: fallback?.data?.length || 0,
        })
        return fallback
      }

      throw error
    }
  },
}

export default availableSlotsService
