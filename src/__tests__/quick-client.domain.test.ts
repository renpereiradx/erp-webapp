import { describe, it, expect } from 'vitest'

import { validateQuickClient, type QuickClientForm } from '@/domain/party/quickClient'

import { visiblePartyTabs, resolvePartyTab } from '@/domain/party/partiesTabs'

const validForm: QuickClientForm = {
  first_name: 'Juan',
  last_name: 'Pérez',
  document_type: 'CI',
  document_id: '1234567',
  phone: '',
}

describe('domain/party/quickClient — validateQuickClient', () => {
  it('acepta un formulario mínimo válido', () => {
    expect(validateQuickClient(validForm)).toEqual({})
  })

  it('marca nombre y apellido como requeridos; el documento es opcional', () => {
    const errors = validateQuickClient({
      first_name: '',
      last_name: '  ',
      document_type: '',
      document_id: '',
      phone: '',
    })
    expect(errors.first_name).toBe('party.quick_client.error.first_name')
    expect(errors.last_name).toBe('party.quick_client.error.last_name')
    // Documento opcional: backend y DB lo aceptan vacío (consumo final).
    expect(errors.document_type).toBeUndefined()
    expect(errors.document_id).toBeUndefined()
  })

  it('acepta el formulario sin documento (tipo y número vacíos)', () => {
    expect(
      validateQuickClient({ ...validForm, document_type: '', document_id: '' }),
    ).toEqual({})
  })

  it('ignora espacios en los campos de texto', () => {
    const errors = validateQuickClient({
      ...validForm,
      first_name: '  ',
      document_id: ' ',
    })
    expect(errors.first_name).toBeDefined()
    // Documento en blanco = sin documento: no es error.
    expect(errors.document_id).toBeUndefined()
  })

  it('el teléfono es opcional', () => {
    expect(validateQuickClient({ ...validForm, phone: '' })).toEqual({})
    expect(validateQuickClient({ ...validForm, phone: '0981 123 456' })).toEqual({})
  })
})

describe('domain/party/partiesTabs — visibilidad de tabs del directorio', () => {
  it('solo clientes si el usuario ve únicamente clients:read', () => {
    expect(visiblePartyTabs(true, false)).toEqual(['clientes'])
  })

  it('solo proveedores si el usuario ve únicamente suppliers:read', () => {
    expect(visiblePartyTabs(false, true)).toEqual(['proveedores'])
  })

  it('ambas tabs con acceso completo', () => {
    expect(visiblePartyTabs(true, true)).toEqual(['clientes', 'proveedores'])
  })

  it('ninguna tab sin permisos', () => {
    expect(visiblePartyTabs(false, false)).toEqual([])
  })

  it('respeta la tab pedida si está visible', () => {
    expect(resolvePartyTab('proveedores', visiblePartyTabs(true, true))).toBe('proveedores')
    expect(resolvePartyTab('clientes', visiblePartyTabs(true, false))).toBe('clientes')
  })

  it('cae a la primera visible si la pedida no se puede ver', () => {
    expect(resolvePartyTab('proveedores', visiblePartyTabs(true, false))).toBe('clientes')
    expect(resolvePartyTab('clientes', visiblePartyTabs(false, true))).toBe('proveedores')
  })

  it('cae a clientes ante entrada inválida o sin tabs visibles', () => {
    expect(resolvePartyTab('otra', visiblePartyTabs(true, true))).toBe('clientes')
    expect(resolvePartyTab(null, visiblePartyTabs(true, true))).toBe('clientes')
    expect(resolvePartyTab('proveedores', [])).toBe('clientes')
  })
})
