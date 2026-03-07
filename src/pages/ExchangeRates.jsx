// ===========================================================================
// Exchange Rates Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// Spec: specs/fluent2/payment_dashboard_summary/exchange_rates_(table_with_filters)
// ===========================================================================

import React, { useState, useEffect, useCallback } from 'react'
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
        <div className="size-7 rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm shadow-sm z-10">{getFlag(currencyCode)}</div>
        <div className="size-7 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm shadow-sm">{getFlag(baseCurrency)}</div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-semibold text-primary uppercase tracking-tight leading-none font-mono">{currencyCode} / {baseCurrency}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase truncate mt-1">{currencyName}</span>
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
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${
      sourceKey === 'manual' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-primary/5 border-primary/20 text-primary'
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
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-text-main uppercase">
            {rate ? t('exchangeRates.modal.edit_title') : t('exchangeRates.modal.create_title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('exchangeRates.field.currency')}</label>
              <div className="relative">
                <select 
                  className="w-full h-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 pr-10 text-sm font-semibold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer" 
                  value={formData.currency_id} 
                  onChange={e => setFormData({...formData, currency_id: e.target.value})} 
                  disabled={!!rate} 
                  required
                >
                  <option value="">{t('exchangeRates.filter.fromCurrency')}</option>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.currency_code} - {c.currency_name || c.name}</option>)}
                </select>
                <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('exchangeRates.field.rate')}</label>
              <Input type="number" step="0.000001" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} placeholder="0.0000" className="rounded-md border-slate-200 font-mono" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('exchangeRates.field.effectiveDate')}</label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
                <Input type="date" value={formData.effective_date} onChange={e => setFormData({...formData, effective_date: e.target.value})} className="pl-10 rounded-md border-slate-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('exchangeRates.field.source')}</label>
              <Input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="ej. Banco Central" className="rounded-md border-slate-200" required />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md shadow-sm" disabled={saving}>
              {saving ? t('action.saving') : t('action.save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-200 font-semibold uppercase tracking-widest text-[11px] h-11 rounded-md">
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight uppercase leading-none">{t('exchangeRates.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('exchangeRates.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-widest rounded-md shadow-sm flex items-center gap-2">
            <span className="material-icons-round text-[18px]">download</span>
            {t('exchangeRates.action.export')}
          </Button>
          <Button onClick={handleCreateClick} className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[10px] px-6 h-10 rounded-md shadow-sm flex items-center gap-2">
            <span className="material-icons-round text-[18px]">add</span>
            {t('exchangeRates.action.create')}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <Input className="pl-10 h-10 border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white transition-all font-medium text-sm" placeholder={t('exchangeRates.search.placeholder')} value={filters.searchTerm} onChange={e => setFilter('searchTerm', e.target.value)} />
          </div>
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
            <Input type="date" className="w-44 h-10 pl-10 border-slate-200 dark:border-slate-700 rounded-md font-medium" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          </div>
          <div className="relative">
            <select className="h-10 w-44 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 pr-10 text-xs font-semibold uppercase tracking-widest outline-none appearance-none cursor-pointer" value={filters.currencyCode} onChange={e => setFilter('currencyCode', e.target.value)}>
              <option value="">{t('exchangeRates.filter.fromCurrency')}</option>
              {currencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
            </select>
            <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button onClick={() => setViewMode('latest')} className={`px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${filters.viewMode === 'latest' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>{t('exchangeRates.view.latest')}</button>
          <button onClick={() => setViewMode('historical')} className={`px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${filters.viewMode === 'historical' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>{t('exchangeRates.view.historical')}</button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('exchangeRates.table.currencyPair')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">{t('exchangeRates.table.rate')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('exchangeRates.table.source')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3">{t('exchangeRates.table.createdAt')}</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 py-2 px-3 text-right">{t('exchangeRates.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && exchangeRates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-semibold uppercase tracking-[0.2em] text-xs">Cargando Tasas...</TableCell></TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-500 font-medium italic">No se encontraron registros</TableCell></TableRow>
            ) : (
              filteredRates.map(rate => (
                <TableRow key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <TableCell className="py-2 px-3"><CurrencyPairCell rate={rate} /></TableCell>
                  <TableCell className="py-2 px-3 text-right font-mono font-semibold text-text-main tabular-nums">{parseFloat(rate.rate_to_base || rate.rate).toFixed(4)}</TableCell>
                  <TableCell className="py-2 px-3"><SourceBadge source={rate.source} /></TableCell>
                  <TableCell className="py-2 px-3 text-xs font-semibold text-slate-500">{new Date(rate.created_at || rate.effective_date).toLocaleDateString()}</TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(rate)} className="size-8 text-slate-400 hover:text-primary rounded-md"><span className="material-icons-round text-[18px]">edit</span></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-red-600 rounded-md"><span className="material-icons-round text-[18px]">delete</span></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{startItem}-{endItem} de {totalItems} registros</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page === 1} className="size-7 rounded-md border-slate-200 dark:border-slate-700"><span className="material-icons-round text-[16px]">chevron_left</span></Button>
            <span className="text-[11px] font-semibold px-3 uppercase tracking-widest text-slate-600">{pagination.page} / {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= totalPages} className="size-7 rounded-md border-slate-200 dark:border-slate-700"><span className="material-icons-round text-[16px]">chevron_right</span></Button>
          </div>
        </div>
      </div>

      <ExchangeRateFormModal isOpen={showFormModal} onClose={() => setShowFormModal(false)} rate={selectedRate} currencies={currencies} onSave={handleSave} />
    </div>
  )
}

export default ExchangeRates
