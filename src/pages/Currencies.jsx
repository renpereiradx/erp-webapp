// ===========================================================================
// Currencies Page - Fluent Design System 2 + BEM
// Logic: useCurrencyStore
// Design: Fluent 2 (specs/fluent2)
// i18n implemented (ES/EN support)
// ===========================================================================

import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Edit2,
  MoreVertical,
  X,
  Settings,
  CreditCard,
  Coins,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useCurrencyStore from '@/store/useCurrencyStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

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

import { PaymentMethodService } from '@/services/paymentMethodService'

// Payment Methods Tab Component
const PaymentMethodsTab = ({ searchTerm }) => {
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

  const filteredMethods = methods.filter(method => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      method.method_code.toLowerCase().includes(term) ||
      method.description.toLowerCase().includes(term)
    )
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-fluent-2">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="text-[12px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.code')}</TableHead>
            <TableHead className="text-[12px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.name')}</TableHead>
            <TableHead className="text-[12px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.payment_methods.table.type')}</TableHead>
            <TableHead className="text-[12px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.status')}</TableHead>
            <TableHead className="text-[12px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-right">{t('currencies.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-text-secondary font-bold uppercase tracking-widest text-xs">{t('common.loading')}</TableCell></TableRow>
          ) : filteredMethods.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-text-secondary font-medium italic">{t('currencies.empty.search')}</TableCell></TableRow>
          ) : (
            filteredMethods.map(method => (
              <tr key={method.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <TableCell className="py-4 px-6"><span className="font-mono font-bold text-primary">{method.method_code}</span></TableCell>
                <TableCell className="py-4 px-6 font-bold text-text-main">{method.description}</TableCell>
                <TableCell className="py-4 px-6 text-xs font-medium text-text-secondary">
                  {PaymentMethodService.requiresAdditionalInfo(method) ? t('currencies.payment_methods.type.complex') : t('currencies.payment_methods.type.simple')}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${method.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`size-1.5 rounded-full ${method.is_active ? 'bg-success' : 'bg-slate-400'}`}></span>
                    {method.is_active ? t('currencies.status.active') : t('currencies.status.inactive')}
                  </span>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <Button variant="ghost" size="icon" className="text-slate-300" disabled><Edit2 size={16} /></Button>
                </TableCell>
              </tr>
            ))
          )}
        </TableBody>
      </Table>
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
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-fluent-16 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter text-text-main">
          {currency ? t('currencies.modal.edit_title') : t('currencies.modal.create_title')}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="size-12 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden border border-border-subtle">
            {flagUrl ? (
               <img src={flagUrl} alt={formData.currency_code} className="w-full h-full object-cover" />
            ) : (
               <span className="text-2xl">{formData.flag_emoji || '🏳️'}</span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-black text-primary leading-none uppercase">{formData.currency_code || 'NEW'}</h4>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">{formData.currency_name || t('currencies.placeholder.name')}</p>
          </div>
        </div>

        <form id="currency-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('currencies.field.name')}</label>
            <Input value={formData.currency_name} onChange={e => setFormData({...formData, currency_name: e.target.value})} placeholder={t('currencies.placeholder.name')} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('currencies.field.code')}</label>
              <Input value={formData.currency_code} onChange={e => setFormData({...formData, currency_code: e.target.value.toUpperCase()})} maxLength={3} placeholder="EUR" disabled={currency?.is_base_currency || !!currency?.id} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('currencies.field.symbol')}</label>
              <Input value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="$" maxLength={5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('currencies.field.decimals')}</label>
            <Input type="number" min={0} max={4} value={formData.decimal_places} onChange={e => setFormData({...formData, decimal_places: parseInt(e.target.value) || 0})} />
            <p className="text-[10px] text-text-secondary font-medium italic px-1">Cantidad de decimales a usar al mostrar montos (0-4)</p>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-border-subtle bg-slate-50/50 flex gap-3">
        <Button form="currency-form" type="submit" className="flex-1 bg-primary hover:bg-primary-hover font-black uppercase tracking-widest h-11" disabled={saving}>
          {saving ? t('action.saving') : t('action.save')}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 border-border-subtle font-bold uppercase tracking-widest h-11">
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
    currencies, loading, searchTerm, fetchCurrencies, createCurrency, updateCurrency, setSearchTerm, getFilteredCurrencies,
  } = useCurrencyStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [activeTab, setActiveTab] = useState('currencies')
  const filteredCurrencies = getFilteredCurrencies()
  const baseCurrency = currencies.find(c => c.is_base_currency)

  useEffect(() => { fetchCurrencies() }, [fetchCurrencies])

  const handleSave = async formData => {
    if (selectedCurrency) { await updateCurrency(selectedCurrency.id, formData); } else { await createCurrency(formData); }
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
    <div className="min-h-screen bg-background-light p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <header className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
            {t('currencies.page.title')}
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            {t('currencies.page.subtitle')}
          </p>
        </header>
        
        {/* Base Currency Widget */}
        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 flex items-center gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{t('currencies.widget.base_currency')}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary leading-none">{baseCurrency?.currency_code || 'PYG'}</span>
              <span className="text-sm font-bold text-text-secondary">({baseCurrency?.symbol || 'Gs'})</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-9 px-4 border-primary/20 text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-primary/5">{t('currencies.widget.change')}</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-border-subtle shadow-sm w-fit">
        {[
          { id: 'currencies', label: t('currencies.tabs.currencies'), icon: Coins },
          { id: 'payment-methods', label: t('currencies.tabs.payment_methods'), icon: CreditCard },
          { id: 'settings', label: t('currencies.tabs.settings'), icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-secondary hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest px-6 h-11">
              <Plus className="size-4 mr-2" />
              {t('currencies.action.create')}
            </Button>
            <div className="w-px h-6 bg-slate-100 mx-2"></div>
            <Button variant="ghost" size="icon" onClick={fetchCurrencies} className="text-slate-400 hover:text-primary"><RefreshCw size={20} /></Button>
            <Button variant="ghost" size="icon" onClick={handleExport} className="text-slate-400 hover:text-primary"><Download size={20} /></Button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <Input
              className="pl-10 h-11 border-border-subtle rounded-lg bg-slate-50/50 focus:bg-white transition-all"
              placeholder={t('currencies.search.placeholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'currencies' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-fluent-2">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 px-6"><input type="checkbox" className="rounded border-slate-300 text-primary" /></TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.code')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.name')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-center">{t('currencies.table.symbol')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-right">{t('currencies.table.exchange_rate')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('currencies.table.status')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-right">{t('currencies.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Cargando Monedas...</TableCell></TableRow>
                ) : (
                  filteredCurrencies.map(currency => {
                    const flagUrl = getFlagUrl(currency.currency_code);
                    return (
                      <TableRow key={currency.id} className={`hover:bg-slate-50 transition-colors group ${currency.is_base_currency ? 'bg-primary/5' : ''}`}>
                        <TableCell className="px-6"><input type="checkbox" className="rounded border-slate-300 text-primary" /></TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center overflow-hidden">
                              {flagUrl ? <img src={flagUrl} className="w-full h-full object-cover" /> : <span className="text-sm">{currency.flag_emoji || '🏳️'}</span>}
                            </div>
                            <span className="font-black text-primary uppercase">{currency.currency_code}</span>
                            {currency.is_base_currency && <span className="text-[9px] font-black bg-primary text-white px-1.5 py-0.5 rounded uppercase leading-none">BASE</span>}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 font-bold text-text-main">{currency.currency_name || currency.name}</TableCell>
                        <TableCell className="py-4 px-6 text-center font-mono font-bold text-text-secondary">{currency.symbol}</TableCell>
                        <TableCell className="py-4 px-6 text-right font-mono font-bold text-text-main">{currency.is_base_currency ? '-' : formatCurrencyValue(currency.exchange_rate, currency)}</TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currency.is_enabled !== false ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                            <span className={`size-1.5 rounded-full ${currency.is_enabled !== false ? 'bg-success' : 'bg-slate-400'}`}></span>
                            {currency.is_enabled !== false ? t('currencies.status.active') : t('currencies.status.inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(currency)} className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-primary"><Edit2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('currencies.results', { count: filteredCurrencies.length, total: filteredCurrencies.length })}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8 rounded-lg border-border-subtle" disabled><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="icon" className="size-8 rounded-lg border-border-subtle" disabled><ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment-methods' && <PaymentMethodsTab searchTerm={searchTerm} />}

        {activeTab === 'settings' && (
           <div className="bg-white p-8 rounded-xl border border-border-subtle shadow-fluent-2 max-w-2xl space-y-8 animate-in fade-in slide-in-from-top-2">
             <div className="border-l-4 border-primary pl-4">
               <h3 className="text-xl font-black uppercase tracking-tighter text-text-main">{t('currencies.settings.general.title')}</h3>
               <p className="text-text-secondary text-sm font-medium mt-1">{t('currencies.settings.general.description')}</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('currencies.settings.field.number_format')}</label>
                  <select className="w-full h-11 rounded-lg border-border-subtle bg-slate-50 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none" disabled>
                    <option>{t('currencies.settings.field.number_format.es_py')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <input type="checkbox" checked readOnly className="rounded border-slate-300 text-primary size-4" />
                  <span className="text-sm font-bold text-text-main">{t('currencies.settings.field.show_symbols')}</span>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-all" onClick={handleCloseDrawer} />}
      <CurrencyDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} currency={selectedCurrency} onSave={handleSave} baseCurrency={baseCurrency} />
    </div>
  )
}

export default CurrenciesPage
