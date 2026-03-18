// ===========================================================================
// Currencies Page - Fluent Design System 2 + BEM
// Logic: useCurrencyStore
// Design: Fluent 2 (specs/fluent2)
// i18n implemented (ES/EN support)
// ===========================================================================

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import useCurrencyStore from '@/store/useCurrencyStore'
import useCategoryStore from '@/store/useCategoryStore'
import useTaxRateStore from '@/store/useTaxRateStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { PaymentMethodService } from '@/services/paymentMethodService'

// --- Components ---

const getFlagUrl = (code) => {
  if (!code) return null;
  const mapping = {
    'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CAD': 'ca',
    'AUD': 'au', 'PYG': 'py', 'BRL': 'br', 'ARS': 'ar', 'MXN': 'mx',
    'CLP': 'cl', 'COP': 'co', 'PEN': 'pe', 'UYU': 'uy', 'CNY': 'cn',
  };
  const countryCode = mapping[code.toUpperCase()];
  return countryCode ? `https://flagcdn.com/w40/${countryCode}.png` : null;
}

// Categories Tab Component
const CategoriesTab = ({ searchTerm, onEdit, onAdd }) => {
  const { t } = useI18n()
  const { categories, loading, fetchCategories } = useCategoryStore()

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = categories.filter(cat => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (cat.name || '').toLowerCase().includes(term) ||
      (cat.description || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Categorías de Producto</h3>
        <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[10px] px-4 h-9 rounded-md shadow-sm flex items-center gap-2">
          <span className="material-icons-round text-[16px]">add</span>
          Nueva Categoría
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Nombre</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Descripción</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">IVA Defecto</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Estado</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">{t('common.loading')}</TableCell></TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500 font-medium italic">No se encontraron categorías</TableCell></TableRow>
            ) : (
              filteredCategories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                  <TableCell className="py-2 px-3 font-semibold text-text-main">{cat.name}</TableCell>
                  <TableCell className="py-2 px-3 text-xs text-slate-500">{cat.description || '-'}</TableCell>
                  <TableCell className="py-2 px-3 font-mono text-xs">{cat.default_tax_rate_id ? `ID: ${cat.default_tax_rate_id}` : 'General (10%)'}</TableCell>
                  <TableCell className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${cat.is_active !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      {cat.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-primary transition-colors" onClick={() => onEdit(cat)}><span className="material-icons-round text-[18px]">edit</span></Button>
                  </TableCell>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Category Drawer Component
const CategoryDrawer = ({ isOpen, onClose, category, onSave }) => {
  const { t } = useI18n()
  const { taxRates, fetchTaxRates } = useTaxRateStore()
  const { categories: allCategories } = useCategoryStore()
  
  const [formData, setFormData] = useState({
    name: '', description: '', default_tax_rate_id: '', parent_id: '', is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTaxRates()
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          default_tax_rate_id: category.default_tax_rate_id?.toString() || '',
          parent_id: category.parent_id?.toString() || '',
          is_active: category.is_active !== false
        })
      } else {
        setFormData({ name: '', description: '', default_tax_rate_id: '', parent_id: '', is_active: true })
      }
    }
  }, [category, isOpen])

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        default_tax_rate_id: formData.default_tax_rate_id ? parseInt(formData.default_tax_rate_id) : null,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
      }
      await onSave(payload); 
      onClose(); 
    } catch (error) { 
      console.error('Failed to save category', error); 
    } finally { setSaving(false); }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-xl z-[100] flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight text-text-main uppercase">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <span className="material-icons-round text-[20px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Nombre</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Electrónicos" className="rounded-md border-slate-200" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Descripción</label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Breve descripción..." className="rounded-md border-slate-200" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Tasa de IVA por Defecto</label>
            <Select value={formData.default_tax_rate_id} onValueChange={v => setFormData({...formData, default_tax_rate_id: v})}>
              <SelectTrigger className="rounded-md border-slate-200"><SelectValue placeholder="Seleccionar tasa..." /></SelectTrigger>
              <SelectContent>
                {taxRates.map(rate => (
                  <SelectItem key={rate.id} value={rate.id.toString()}>{rate.tax_name || rate.name} ({rate.rate}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Categoría Padre</label>
            <Select value={formData.parent_id} onValueChange={v => setFormData({...formData, parent_id: v})}>
              <SelectTrigger className="rounded-md border-slate-200"><SelectValue placeholder="Ninguna (Raíz)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {allCategories.filter(c => c.id !== category?.id).map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800">
            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded border-slate-300 text-primary size-4" />
            <span className="text-sm font-semibold text-text-main">Categoría Activa</span>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
        <Button form="category-form" type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md shadow-sm" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Categoría'}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md">Cancelar</Button>
      </div>
    </div>
  )
}

// Tax Rates Tab Component
const TaxRatesTab = ({ searchTerm, onEdit, onAdd }) => {
  const { t } = useI18n()
  const { taxRates, loading, fetchTaxRates } = useTaxRateStore()

  useEffect(() => {
    fetchTaxRates()
  }, [])

  const filteredRates = taxRates.filter(rate => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (rate.tax_name || '').toLowerCase().includes(term) ||
      (rate.code || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Tasas de Impuestos (IVA)</h3>
        <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[10px] px-4 h-9 rounded-md shadow-sm flex items-center gap-2">
          <span className="material-icons-round text-[16px]">add</span>
          Nueva Tasa
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Código</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Nombre</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Tasa %</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">Por Defecto</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">{t('common.loading')}</TableCell></TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500 font-medium italic">No se encontraron tasas</TableCell></TableRow>
            ) : (
              filteredRates.map(rate => (
                <tr key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                  <TableCell className="py-2 px-3"><span className="font-mono font-semibold text-primary">{rate.code}</span></TableCell>
                  <TableCell className="py-2 px-3 font-semibold text-text-main">{rate.tax_name || rate.name}</TableCell>
                  <TableCell className="py-2 px-3 font-mono font-bold">{rate.rate}%</TableCell>
                  <TableCell className="py-2 px-3">
                    {rate.is_default && <Badge className="bg-amber-100 text-amber-700 border-amber-200 uppercase text-[9px]">Sistema</Badge>}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-primary transition-colors" onClick={() => onEdit(rate)}><span className="material-icons-round text-[18px]">edit</span></Button>
                  </TableCell>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Tax Rate Drawer Component
const TaxRateDrawer = ({ isOpen, onClose, taxRate, onSave }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    tax_name: '', code: '', rate: '', jurisdiction_type: 'NATIONAL', operation_type: 'NACIONAL', is_default: false, is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (taxRate) {
      setFormData({
        tax_name: taxRate.tax_name || taxRate.name || '',
        code: taxRate.code || '',
        rate: taxRate.rate?.toString() || '',
        jurisdiction_type: taxRate.jurisdiction_type || 'NATIONAL',
        operation_type: taxRate.operation_type || 'NACIONAL',
        is_default: !!taxRate.is_default,
        is_active: taxRate.is_active !== false
      })
    } else {
      setFormData({ tax_name: '', code: '', rate: '', jurisdiction_type: 'NATIONAL', operation_type: 'NACIONAL', is_default: false, is_active: true })
    }
  }, [taxRate, isOpen])

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...formData, rate: parseFloat(formData.rate) }
      await onSave(payload); onClose();
    } catch (error) { console.error('Failed to save tax rate', error); } finally { setSaving(false); }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-xl z-[100] flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight text-text-main uppercase">
          {taxRate ? 'Editar Tasa de IVA' : 'Nueva Tasa de IVA'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <span className="material-icons-round text-[20px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <form id="tax-rate-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Código (Ej: IVA10)</label>
            <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="IVA10, IVA5, EXENTO" className="rounded-md border-slate-200 uppercase font-mono" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Nombre Descriptivo</label>
            <Input value={formData.tax_name} onChange={e => setFormData({...formData, tax_name: e.target.value})} placeholder="Ej: IVA General 10%" className="rounded-md border-slate-200" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Tasa Porcentual (%)</label>
            <Input type="number" step="0.1" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="10.0" className="rounded-md border-slate-200 font-mono" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Jurisdicción</label>
              <Select value={formData.jurisdiction_type} onValueChange={v => setFormData({...formData, jurisdiction_type: v})}>
                <SelectTrigger className="rounded-md border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">Nacional</SelectItem>
                  <SelectItem value="STATE">Estatal/Dpto</SelectItem>
                  <SelectItem value="LOCAL">Local/Mun.</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Operación</label>
              <Select value={formData.operation_type} onValueChange={v => setFormData({...formData, operation_type: v})}>
                <SelectTrigger className="rounded-md border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NACIONAL">Nacional</SelectItem>
                  <SelectItem value="CANASTA">Canasta Básica</SelectItem>
                  <SelectItem value="EXEMPT">Exento</SelectItem>
                  <SelectItem value="IMPORT">Importación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
              <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="rounded border-slate-300 text-primary size-4" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-main">Tasa por Defecto</span>
                <span className="text-[10px] text-amber-700 font-medium">Se aplicará automáticamente a nuevos productos</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
        <Button form="tax-rate-form" type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md shadow-sm" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Tasa'}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md">Cancelar</Button>
      </div>
    </div>
  )
}

// Payment Methods Tab Component
const PaymentMethodsTab = ({ searchTerm, onEdit, onAdd }) => {
  const { t } = useI18n()
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const data = await PaymentMethodService.getAll()
      setMethods(data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  // Expose fetchMethods to parent if needed, but for now we'll just handle it here
  // Actually, we should probably lift state or use a store, but let's keep it consistent with the existing pattern.

  const filteredMethods = methods.filter(method => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (method.method_code || '').toLowerCase().includes(term) ||
      (method.description || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('currencies.tabs.payment_methods')}</h3>
        <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[10px] px-4 h-9 rounded-md shadow-sm flex items-center gap-2">
          <span className="material-icons-round text-[16px]">add</span>
          Nuevo Método
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.code')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.name')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.payment_methods.table.type')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.status')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">{t('currencies.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">{t('common.loading')}</TableCell></TableRow>
            ) : filteredMethods.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500 font-medium italic">{t('currencies.empty.search')}</TableCell></TableRow>
            ) : (
              filteredMethods.map(method => (
                <tr key={method.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                  <TableCell className="py-2 px-3"><span className="font-mono font-semibold text-primary tabular-nums">{method.method_code}</span></TableCell>
                  <TableCell className="py-2 px-3 font-semibold text-text-main">{method.description}</TableCell>
                  <TableCell className="py-2 px-3 text-xs font-medium text-slate-500">
                    {PaymentMethodService.requiresAdditionalInfo(method) ? t('currencies.payment_methods.type.complex') : t('currencies.payment_methods.type.simple')}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${method.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      <span className={`size-1.5 rounded-full ${method.is_active ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                      {method.is_active ? t('currencies.status.active') : t('currencies.status.inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-primary transition-colors" onClick={() => onEdit(method)}><span className="material-icons-round text-[18px]">edit</span></Button>
                  </TableCell>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Payment Method Drawer Component
const PaymentMethodDrawer = ({ isOpen, onClose, method, onSave }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    method_code: '', description: '', is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (method) {
      setFormData({
        method_code: method.method_code || '',
        description: method.description || '',
        is_active: method.is_active !== false
      })
    } else {
      setFormData({
        method_code: '', description: '', is_active: true
      })
    }
  }, [method, isOpen])

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(formData); onClose(); } catch (error) { console.error('Failed to save payment method', error); } finally { setSaving(false); }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-xl z-[100] flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight text-text-main uppercase">
          {method ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <span className="material-icons-round text-[20px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <form id="payment-method-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Código del Método</label>
            <Input value={formData.method_code} onChange={e => setFormData({...formData, method_code: e.target.value.toUpperCase()})} placeholder="CASH, CARD, etc." disabled={!!method?.id} className="rounded-md border-slate-200 uppercase font-mono" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Descripción</label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej: Pago en Efectivo" className="rounded-md border-slate-200" required />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800">
            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded border-slate-300 text-primary size-4" />
            <span className="text-sm font-semibold text-text-main">Método Activo</span>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
        <Button form="payment-method-form" type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md shadow-sm" disabled={saving}>
          {saving ? t('action.saving') : t('action.save')}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md">
          {t('action.cancel')}
        </Button>
      </div>
    </div>
  )
}

// Drawer (Slide-over) Component for Add/Edit
const CurrencyDrawer = ({ isOpen, onClose, currency, onSave, baseCurrency }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    currency_code: '', currency_name: '', symbol: '', decimal_places: 2,
    is_enabled: true, flag_emoji: '🏳️', exchange_rate: 1,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currency) {
      setFormData({
        currency_code: currency.currency_code || '',
        currency_name: currency.currency_name || currency.name || '',
        symbol: currency.symbol || '',
        decimal_places: currency.decimal_places ?? 2,
        is_enabled: currency.is_enabled !== false,
        flag_emoji: currency.flag_emoji || '🏳️',
        exchange_rate: currency.exchange_rate || 1,
      })
    } else {
      setFormData({
        currency_code: '', currency_name: '', symbol: '', decimal_places: 2,
        is_enabled: true, flag_emoji: '🏳️', exchange_rate: 1,
      })
    }
  }, [currency, isOpen])

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(formData); onClose(); } catch (error) { console.error('Failed to save currency', error); } finally { setSaving(false); }
  }

  if (!isOpen) return null

  const flagUrl = getFlagUrl(formData.currency_code);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-xl z-[100] flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight text-text-main uppercase">
          {currency ? t('currencies.modal.edit_title') : t('currencies.modal.create_title')}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
          <span className="material-icons-round text-[20px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="size-12 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
            {flagUrl ? (
               <img src={flagUrl} alt={formData.currency_code} className="w-full h-full object-cover" />
            ) : (
               <span className="text-2xl">{formData.flag_emoji || '🏳️'}</span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-primary leading-none uppercase">{formData.currency_code || '---'}</h4>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1.5">{formData.currency_name || t('currencies.placeholder.name')}</p>
          </div>
        </div>

        <form id="currency-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('currencies.field.name')}</label>
            <Input value={formData.currency_name} onChange={e => setFormData({...formData, currency_name: e.target.value})} placeholder={t('currencies.placeholder.name')} className="rounded-md border-slate-200" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('currencies.field.code')}</label>
              <Input value={formData.currency_code} onChange={e => setFormData({...formData, currency_code: e.target.value.toUpperCase()})} maxLength={3} placeholder="EUR" disabled={currency?.is_base_currency || !!currency?.id} className="rounded-md border-slate-200 uppercase font-mono" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('currencies.field.symbol')}</label>
              <Input value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="$" maxLength={5} className="rounded-md border-slate-200 font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('currencies.field.decimals')}</label>
            <Input type="number" min={0} max={4} value={formData.decimal_places} onChange={e => setFormData({...formData, decimal_places: parseInt(e.target.value) || 0})} className="rounded-md border-slate-200 font-mono" />
            <p className="text-[10px] text-slate-500 font-medium italic px-1">Cantidad de decimales a usar al mostrar montos (0-4)</p>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
        <Button form="currency-form" type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md shadow-sm" disabled={saving}>
          {saving ? t('action.saving') : t('action.save')}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md">
          {t('action.cancel')}
        </Button>
      </div>
    </div>
  )
}

// Main Page Component
const CurrenciesPage = () => {
  const { t } = useI18n()
  const {
    currencies, loading: currenciesLoading, searchTerm, fetchCurrencies, createCurrency, updateCurrency, setSearchTerm, getFilteredCurrencies,
  } = useCurrencyStore()

  const { createCategory, updateCategory, deleteCategory } = useCategoryStore()
  const { createTaxRate, updateTaxRate, deleteTaxRate } = useTaxRateStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [methodDrawerOpen, setMethodDrawerOpen] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [taxRateDrawerOpen, setTaxRateDrawerOpen] = useState(false)

  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTaxRate, setSelectedTaxRate] = useState(null)

  const [activeTab, setActiveTab] = useState('currencies')
  const filteredCurrencies = getFilteredCurrencies()
  const baseCurrency = currencies.find(c => c.is_base_currency)

  useEffect(() => { fetchCurrencies() }, [fetchCurrencies])

  // Handlers for Categories
  const handleOpenCreateCategory = () => { setSelectedCategory(null); setCategoryDrawerOpen(true); }
  const handleOpenEditCategory = (cat) => { setSelectedCategory(cat); setCategoryDrawerOpen(true); }
  const handleSaveCategory = async data => {
    if (selectedCategory) await updateCategory(selectedCategory.id, data)
    else await createCategory(data)
  }

  // Handlers for Tax Rates
  const handleOpenCreateTaxRate = () => { setSelectedTaxRate(null); setTaxRateDrawerOpen(true); }
  const handleOpenEditTaxRate = (rate) => { setSelectedTaxRate(rate); setTaxRateDrawerOpen(true); }
  const handleSaveTaxRate = async data => {
    if (selectedTaxRate) await updateTaxRate(selectedTaxRate.id, data)
    else await createTaxRate(data)
  }

  const handleOpenCreate = () => {
    setSelectedCurrency(null)
    setDrawerOpen(true)
  }

  const handleOpenEdit = (currency) => {
    setSelectedCurrency(currency)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedCurrency(null)
  }

  const handleOpenCreateMethod = () => {
    setSelectedMethod(null)
    setMethodDrawerOpen(true)
  }

  const handleOpenEditMethod = (method) => {
    setSelectedMethod(method)
    setMethodDrawerOpen(true)
  }

  const handleCloseMethodDrawer = () => {
    setMethodDrawerOpen(false)
    setSelectedMethod(null)
  }

  const handleSave = async formData => {
    if (selectedCurrency) { await updateCurrency(selectedCurrency.id, formData); } else { await createCurrency(formData); }
  }

  const handleSaveMethod = async formData => {
    try {
      if (selectedMethod) {
        await PaymentMethodService.update(selectedMethod.id, formData)
      } else {
        await PaymentMethodService.create(formData)
      }
      window.location.reload(); 
    } catch (error) {
      console.error('Error saving payment method', error)
    }
  }

  const handleExport = () => {
    const csvContent = [[t('currencies.table.code'), t('currencies.table.name'), t('currencies.table.symbol'), t('currencies.field.decimals'), t('currencies.table.status'), t('currencies.table.exchange_rate')].join(','), ...filteredCurrencies.map(c => [c.currency_code, `"${c.currency_name || c.name}"`, c.symbol, c.decimal_places, c.is_enabled !== false ? t('currencies.status.enabled') : t('currencies.status.disabled'), c.exchange_rate || ''].join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `monedas_${new Date().toISOString().split('T')[0]}.csv`; link.click()
  }

  const formatCurrencyValue = (value, currency) => {
    if (value === null || value === undefined) return '-'
    let decimals = baseCurrency?.currency_code === 'PYG' ? 0 : (currency?.decimal_places ?? 4)
    return Number(value).toLocaleString('es-PY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight uppercase leading-none">
            {t('currencies.page.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {t('currencies.page.subtitle')}
          </p>
        </header>
        
        {/* Base Currency Widget */}
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-2">{t('currencies.widget.base_currency')}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-primary leading-none font-mono uppercase">{baseCurrency?.currency_code || 'PYG'}</span>
              <span className="text-sm font-medium text-slate-400">({baseCurrency?.symbol || '₲'})</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-9 px-4 border-slate-200 dark:border-slate-700 text-primary font-semibold uppercase text-[10px] tracking-widest hover:bg-primary/5 rounded-md shadow-sm">{t('currencies.widget.change')}</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {[
          { id: 'currencies', label: t('currencies.tabs.currencies'), icon: 'payments' },
          { id: 'payment-methods', label: t('currencies.tabs.payment_methods'), icon: 'credit_card' },
          { id: 'tax-rates', label: 'IVA / Tasas', icon: 'account_balance' },
          { id: 'categories', label: 'Categorías', icon: 'category' },
          { id: 'settings', label: t('currencies.tabs.settings'), icon: 'settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-icons-round text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Toolbar (Only for Currencies tab) */}
        {activeTab === 'currencies' && (
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] px-6 h-10 rounded-md shadow-sm flex items-center gap-2">
                <span className="material-icons-round text-[18px]">add</span>
                {t('currencies.action.create')}
              </Button>
              <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-2"></div>
              <Button variant="ghost" size="icon" onClick={fetchCurrencies} className="size-10 text-slate-400 hover:text-primary rounded-md"><span className="material-icons-round text-[20px]">refresh</span></Button>
              <Button variant="ghost" size="icon" onClick={handleExport} className="size-10 text-slate-400 hover:text-primary rounded-md"><span className="material-icons-round text-[20px]">download</span></Button>
            </div>

            <div className="relative flex-1 max-w-sm">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <Input
                className="pl-10 h-10 border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-surface-dark transition-all font-medium text-sm"
                placeholder={t('currencies.search.placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'currencies' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-12 px-4"><input type="checkbox" className="rounded border-slate-300 text-primary" /></TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.code')}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.name')}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-center">{t('currencies.table.symbol')}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">{t('currencies.table.exchange_rate')}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('currencies.table.status')}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">{t('currencies.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currenciesLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-20 text-center text-slate-400 font-semibold uppercase tracking-[0.2em] text-xs">Cargando Monedas...</TableCell></TableRow>
                ) : (
                  filteredCurrencies.map(currency => {
                    const flagUrl = getFlagUrl(currency.currency_code);
                    return (
                      <TableRow key={currency.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${currency.is_base_currency ? 'bg-primary/5' : ''} border-b border-slate-100 dark:border-slate-800`}>
                        <TableCell className="px-4"><input type="checkbox" className="rounded border-slate-300 text-primary" /></TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                              {flagUrl ? <img src={flagUrl} className="w-full h-full object-cover" /> : <span className="text-sm">{currency.flag_emoji || '🏳️'}</span>}
                            </div>
                            <span className="font-semibold text-primary uppercase font-mono">{currency.currency_code}</span>
                            {currency.is_base_currency && <span className="text-[9px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded-sm uppercase leading-none ml-1">BASE</span>}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3 font-semibold text-text-main text-sm">{currency.currency_name || currency.name}</TableCell>
                        <TableCell className="py-2 px-3 text-center font-mono font-semibold text-slate-500 tabular-nums">{currency.symbol}</TableCell>
                        <TableCell className="py-2 px-3 text-right font-mono font-semibold text-text-main tabular-nums">{currency.is_base_currency ? '-' : formatCurrencyValue(currency.exchange_rate, currency)}</TableCell>
                        <TableCell className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${currency.is_enabled !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <span className={`size-1.5 rounded-full ${currency.is_enabled !== false ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                            {currency.is_enabled !== false ? t('currencies.status.active') : t('currencies.status.inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-primary rounded-md size-8" onClick={() => handleOpenEdit(currency)}><span className="material-icons-round text-[18px]">edit</span></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{t('currencies.results', { count: filteredCurrencies.length, total: filteredCurrencies.length })}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="size-7 rounded-md border-slate-200 dark:border-slate-700" disabled><span className="material-icons-round text-[16px]">chevron_left</span></Button>
                <Button variant="outline" size="icon" className="size-7 rounded-md border-slate-200 dark:border-slate-700" disabled><span className="material-icons-round text-[16px]">chevron_right</span></Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment-methods' && <PaymentMethodsTab searchTerm={searchTerm} onEdit={handleOpenEditMethod} onAdd={handleOpenCreateMethod} />}
        {activeTab === 'categories' && <CategoriesTab searchTerm={searchTerm} onEdit={handleOpenEditCategory} onAdd={handleOpenCreateCategory} />}
        {activeTab === 'tax-rates' && <TaxRatesTab searchTerm={searchTerm} onEdit={handleOpenEditTaxRate} onAdd={handleOpenCreateTaxRate} />}

        {activeTab === 'settings' && (
           <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-6 animate-in fade-in slide-in-from-top-2">
             <div className="border-l-4 border-primary pl-4">
               <h3 className="text-xl font-semibold tracking-tight text-text-main uppercase">{t('currencies.settings.general.title')}</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{t('currencies.settings.general.description')}</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('currencies.settings.field.number_format')}</label>
                  <select className="w-full h-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 text-sm font-semibold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-not-allowed" disabled>
                    <option>{t('currencies.settings.field.number_format.es_py')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <input type="checkbox" checked readOnly className="rounded border-slate-300 text-primary size-4" />
                  <span className="text-sm font-semibold text-text-main">{t('currencies.settings.field.show_symbols')}</span>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* Drawer Overlays */}
      {(drawerOpen || methodDrawerOpen || categoryDrawerOpen || taxRateDrawerOpen) && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-all" onClick={() => { handleCloseDrawer(); handleCloseMethodDrawer(); setCategoryDrawerOpen(false); setTaxRateDrawerOpen(false); }} />}
      <CurrencyDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} currency={selectedCurrency} onSave={handleSave} baseCurrency={baseCurrency} />
      <PaymentMethodDrawer isOpen={methodDrawerOpen} onClose={handleCloseMethodDrawer} method={selectedMethod} onSave={handleSaveMethod} />
      <CategoryDrawer isOpen={categoryDrawerOpen} onClose={() => setCategoryDrawerOpen(false)} category={selectedCategory} onSave={handleSaveCategory} />
      <TaxRateDrawer isOpen={taxRateDrawerOpen} onClose={() => setTaxRateDrawerOpen(false)} taxRate={selectedTaxRate} onSave={handleSaveTaxRate} />
    </div>
  )
}

export default CurrenciesPage
