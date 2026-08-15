import { describe, it, expect } from 'vitest'
import {
  partitionOpenRegisters,
  resolveDefaultRegisterId,
  type RegisterOption,
} from '@/features/sales/registerSelection'

const reg = (id: number, branchId: number | null): RegisterOption => ({ id, branchId })

describe('partitionOpenRegisters', () => {
  it('separa cajas de la sucursal actual de las de otras sucursales', () => {
    const result = partitionOpenRegisters([reg(1, 1), reg(2, 3), reg(3, 1)], 1)
    expect(result.inBranch.map((r) => r.id)).toEqual([1, 3])
    expect(result.otherBranches.map((r) => r.id)).toEqual([2])
    expect(result.hasAny).toBe(true)
  })

  it('sin branchId conocido, todas las cajas son seleccionables', () => {
    const result = partitionOpenRegisters([reg(1, 1), reg(2, 3)], null)
    expect(result.inBranch.map((r) => r.id)).toEqual([1, 2])
    expect(result.otherBranches).toEqual([])
  })

  it('trata cajas sin branch_id como parte de la sucursal actual', () => {
    const result = partitionOpenRegisters([reg(1, null), reg(2, 3)], 1)
    expect(result.inBranch.map((r) => r.id)).toEqual([1])
    expect(result.otherBranches.map((r) => r.id)).toEqual([2])
  })

  it('reporta hasAny=false con lista vacía', () => {
    const result = partitionOpenRegisters([], 1)
    expect(result.hasAny).toBe(false)
  })
})

describe('resolveDefaultRegisterId', () => {
  it('preselecciona la caja activa si está abierta en la sucursal actual', () => {
    expect(resolveDefaultRegisterId([reg(30, 1), reg(31, 1)], 30)).toBe(30)
  })

  it('no preselecciona la caja activa si pertenece a otra sucursal', () => {
    // La activa (30, sucursal 3) no está en las cajas de la sucursal 1 → Sin caja.
    expect(resolveDefaultRegisterId([reg(31, 1)], 30)).toBeNull()
  })

  it('devuelve null sin caja activa', () => {
    expect(resolveDefaultRegisterId([reg(31, 1)], null)).toBeNull()
  })
})
