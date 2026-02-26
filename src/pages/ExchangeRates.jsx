// ===========================================================================
// Exchange Rates Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// Spec: specs/fluent2/payment_dashboard_summary/exchange_rates_(table_with_filters)
// ===========================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Download,
  Calendar,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useExchangeRateStore from '@/store/useExchangeRateStore'
import DataState from '@/components/ui/DataState'
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

// Currency Pair Cell Component
const CurrencyPairCell = ({ rate, baseCurrency = 'PYG' }) => {
  const currencyCode = rate.currency_code || 'XXX'
  const currencyName = rate.currency_name || rate.name || 'Unknown Currency'

  const getFlag = code => {
    const flagMap = { PYG: '🇵🇾', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', BRL: '🇧🇷', ARS: '🇦🇷' }
    return flagMap[code] || '🏳️'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        <div className="size-7 rounded-full bg-white border border-slate-100 flex items-center justify-center text-sm shadow-sm z-10">{getFlag(currencyCode)}</div>
        <div className="size-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-sm">{getFlag(baseCurrency)}</div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-black text-primary uppercase tracking-tighter leading-none">{currencyCode} / {baseCurrency}</span>
        <span className="text-[10px] text-text-secondary font-bold uppercase truncate mt-1">{currencyName}</span>
      </div>
    </div>
  )
}

// Source Badge Component
const SourceBadge = ({ source }) => {
  const { t } = useI18n()
  const sourceKey = source?.toLowerCase().replace(/\s+/g, '-') || 'manual'
  const sourceLabels = {
    manual: t('exchangeRates.source.manual', 'Manual'),
    'central-bank': t('exchangeRates.source.centralBank', 'Banco Central'),
    'forex-api': t('exchangeRates.source.forexApi', 'Forex API'),
    system: t('exchangeRates.source.system', 'Sistema'),
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
      sourceKey === 'manual' ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary'
    }`}>
      {sourceLabels[sourceKey] || source || 'Manual'}
    </span>
  )
}

// Exchange Rate Form Modal
const ExchangeRateFormModal = ({ isOpen, onClose, rate, currencies, onSave }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({ currency_id: '', rate: '', effective_date: new Date().toISOString().split('T')[0], source: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (rate) {
      setFormData({ currency_id: rate.currency_id || '', rate: rate.rate_to_base || rate.rate || '', effective_date: rate.effective_date?.split('T')[0] || rate.date || new Date().toISOString().split('T')[0], source: rate.source || '' })
    } else {
      setFormData({ currency_id: '', rate: '', effective_date: new Date().toISOString().split('T')[0], source: '' })
    }
    setErrors({})
  }, [rate, isOpen])

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try { await onSave({ currency_id: formData.currency_id, rate_to_base: parseFloat(formData.rate), date: formData.effective_date, source: formData.source }); onClose(); } catch (error) { setErrors({ submit: error.message }); } finally { setSaving(false); }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-fluent-16 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter text-text-main">
            {rate ? t('exchangeRates.modal.edit_title') : t('exchangeRates.modal.create_title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('exchangeRates.field.currency')}</label>
              <select className="w-full h-11 rounded-lg border-border-subtle bg-slate-50 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" value={formData.currency_id} onChange={e => setFormData({...formData, currency_id: e.target.value})} disabled={!!rate} required>
                <option value="">{t('exchangeRates.filter.fromCurrency')}</option>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.currency_code} - {c.currency_name || c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('exchangeRates.field.rate')}</label>
              <Input type="number" step="0.000001" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="0.0000" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('exchangeRates.field.effectiveDate')}</label>
              <Input type="date" value={formData.effective_date} onChange={e => setFormData({...formData, effective_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('exchangeRates.field.source')}</label>
              <Input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="ej. Banco Central" required />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover font-black uppercase tracking-widest h-11" disabled={saving}>
              {saving ? t('action.saving') : t('action.save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border-subtle font-bold uppercase tracking-widest h-11">
              {t('action.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Exchange Rates Page Component
const ExchangeRates = () => {
  const { t } = useI18n()
  const {
    exchangeRates, currencies, loading, error, filters, pagination, fetchExchangeRates, fetchCurrencies, createExchangeRate, updateExchangeRate, deleteExchangeRate, setFilter, setViewMode, setPage,
  } = useExchangeRateStore()

  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedRate, setSelectedRate] = useState(null)

  useEffect(() => { fetchCurrencies(); fetchExchangeRates(); }, [fetchCurrencies, fetchExchangeRates])
  useEffect(() => { fetchExchangeRates(); }, [filters.viewMode, filters.currencyCode, filters.dateFrom, filters.dateTo, fetchExchangeRates])

  const handleCreateClick = () => { setSelectedRate(null); setShowFormModal(true); }
  const handleEditClick = rate => { setSelectedRate(rate); setShowFormModal(true); }
  const handleSave = async data => { if (selectedRate) { await updateExchangeRate(selectedRate.id, data); } else { await createExchangeRate(data); } }

  const totalItems = exchangeRates.length
  const startItem = totalItems > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const endItem = Math.min(pagination.page * pagination.pageSize, totalItems)
  const totalPages = Math.ceil(totalItems / pagination.pageSize)
  const paginatedRates = exchangeRates.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
  const filteredRates = filters.searchTerm ? paginatedRates.filter(r => r.currency_code?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || r.currency_name?.toLowerCase().includes(filters.searchTerm.toLowerCase())) : paginatedRates

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">{t('exchangeRates.title')}</h1>
          <p className="text-text-secondary text-sm font-medium mt-1">{t('exchangeRates.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 border-border-subtle font-bold uppercase text-[11px] tracking-widest"><Download size={18} className="mr-2" />{t('exchangeRates.action.export')}</Button>
          <Button onClick={handleCreateClick} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest px-6 h-11"><Plus size={18} className="mr-2" />{t('exchangeRates.action.create')}</Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <Input className="pl-10 h-11 border-border-subtle" placeholder={t('exchangeRates.search.placeholder')} value={filters.searchTerm} onChange={e => setFilter('searchTerm', e.target.value)} />
          </div>
          <Input type="date" className="w-40 h-11 border-border-subtle" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          <select className="h-11 w-40 rounded-lg border-border-subtle bg-slate-50 px-4 text-xs font-black uppercase tracking-wider outline-none" value={filters.currencyCode} onChange={e => setFilter('currencyCode', e.target.value)}>
            <option value="">{t('exchangeRates.filter.fromCurrency')}</option>
            {currencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
          </select>
        </div>

        <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100">
          <button onClick={() => setViewMode('latest')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${filters.viewMode === 'latest' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}>{t('exchangeRates.view.latest')}</button>
          <button onClick={() => setViewMode('historical')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${filters.viewMode === 'historical' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}>{t('exchangeRates.view.historical')}</button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-fluent-2">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('exchangeRates.table.currencyPair')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-right">{t('exchangeRates.table.rate')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('exchangeRates.table.source')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('exchangeRates.table.createdAt')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6 text-right">{t('exchangeRates.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && exchangeRates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Cargando Tasas...</TableCell></TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">No se encontraron registros</TableCell></TableRow>
            ) : (
              filteredRates.map(rate => (
                <TableRow key={rate.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="py-4 px-6"><CurrencyPairCell rate={rate} /></TableCell>
                  <TableCell className="py-4 px-6 text-right font-mono font-bold text-text-main">{parseFloat(rate.rate_to_base || rate.rate).toFixed(4)}</TableCell>
                  <TableCell className="py-4 px-6"><SourceBadge source={rate.source} /></TableCell>
                  <TableCell className="py-4 px-6 text-xs font-bold text-slate-400">{new Date(rate.created_at || rate.effective_date).toLocaleDateString()}</TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(rate)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-error"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{startItem}-{endItem} de {totalItems} registros</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page === 1} className="size-8 rounded-lg border-border-subtle"><ChevronLeft size={16} /></Button>
            <span className="text-xs font-black px-3">{pagination.page} / {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= totalPages} className="size-8 rounded-lg border-border-subtle"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      <ExchangeRateFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} rate={selectedRate} currencies={currencies} onSave={handleSave} />
    </div>
  )
}

export default ExchangeRates
