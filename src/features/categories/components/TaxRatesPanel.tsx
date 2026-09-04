import { useState } from 'react'
import { BadgeCheck, Bolt, FolderOpen, Info, Loader2, ReceiptText, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import EmptyState from '@/components/ui/EmptyState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EnhancedModal from '@/components/ui/EnhancedModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

import type { Category } from '../types'
import { useSifenClassification } from '../hooks/useSifenClassification'

interface TaxRatesPanelProps {
  selectedCategory?: Category | null
}

export function TaxRatesPanel({ selectedCategory }: TaxRatesPanelProps) {
  const { t } = useI18n()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const {
    taxRates,
    sifenCodes,
    selectedSifenCode,
    setSelectedSifenCode,
    detectedSifenCode,
    defaultRate,
    loading,
    applying,
    checkingClassification,
    autoClassify,
  } = useSifenClassification(selectedCategory)

  const handleAutoClassify = async () => {
    setShowConfirmModal(false)
    await autoClassify()
  }

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <div className="mb-md border-b border-border-subtle pb-sm">
        <h2 className="text-title-md text-foreground">{t('categories.tax.title')}</h2>
        <p className="text-body-md text-on-surface-deep mt-xs">
          {t('categories.tax.subtitle')}
        </p>
      </div>

      {/* Bloque de Clasificación SIFEN acoplado a la categoría seleccionada */}
      {selectedCategory ? (
        <div className="bg-surface-muted rounded-md p-md mb-lg space-y-md">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-sm pb-sm border-b border-border-subtle">
            <h3 className="text-body-sm-bold uppercase text-primary flex items-center gap-xs">
              <FolderOpen className="w-4 h-4" />
              {t('categories.tax.config_title', { name: selectedCategory.name })}
            </h3>
            <div className="flex items-center gap-sm flex-wrap">
              {detectedSifenCode ? (
                <Badge variant="success">
                  <BadgeCheck className="w-3 h-3 mr-xs" />
                  {t('categories.tax.badge_classified', { code: detectedSifenCode })}
                </Badge>
              ) : checkingClassification ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-xs animate-spin" />
                  {t('categories.tax.badge_checking')}
                </Badge>
              ) : (
                <Badge variant="warning">
                  <TriangleAlert className="w-3 h-3 mr-xs" />
                  {t('categories.tax.badge_unclassified')}
                </Badge>
              )}
              {defaultRate !== null ? (
                <Badge variant="secondary" className="text-data-mono font-data-mono">
                  {t('categories.tax.default_rate', { rate: defaultRate })}
                </Badge>
              ) : (
                <Badge variant="outline">{t('categories.tax.no_rate')}</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-md justify-between">
            <div className="flex-1 w-full space-y-xs">
              <Label htmlFor="sifen-code" className="text-body-sm-bold uppercase text-on-surface-deep">
                {t('categories.tax.select_label')}
              </Label>
              <Select
                value={selectedSifenCode}
                onValueChange={setSelectedSifenCode}
                disabled={applying}
              >
                <SelectTrigger id="sifen-code" className="bg-surface">
                  <SelectValue placeholder={t('categories.tax.select_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {sifenCodes.map((code) => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.code} - {code.name} ({code.default_rate_percent}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedSifenCode || applying}
              loading={applying}
              className="w-full md:w-auto shrink-0"
            >
              <Bolt className="w-4 h-4 mr-xs" />
              {detectedSifenCode
                ? t('categories.tax.action_update')
                : t('categories.tax.action_apply')}
            </Button>
          </div>

          {detectedSifenCode ? (
            <p className="text-body-sm text-success flex items-start gap-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                {t('categories.tax.applied_note', { code: detectedSifenCode })}
              </span>
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-deep">
              {t('categories.tax.pending_note', { name: selectedCategory.name })}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-lg">
          <EmptyState
            icon={FolderOpen}
            size="small"
            title={t('categories.tax.empty_no_category')}
            description={t('categories.tax.empty_no_category_desc')}
          />
        </div>
      )}

      {/* Lista general de tasas de IVA */}
      <h3 className="text-body-sm-bold uppercase text-on-surface-deep mb-sm">
        {t('categories.tax.rates_title')}
      </h3>

      {loading ? (
        <GenericSkeletonList count={4} data-testid="tax-rates-loading" />
      ) : taxRates.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          size="small"
          title={t('categories.tax.table.empty')}
          description={t('categories.tax.table.empty_description')}
        />
      ) : (
        <div className="rounded-md bg-surface shadow-whisper overflow-hidden border border-border-subtle overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('categories.tax.table.code')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('categories.tax.table.name')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('categories.tax.table.rate')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('categories.tax.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate: any) => {
                const isActiveRate =
                  !!selectedCategory && rate.id === selectedCategory.default_tax_rate_id
                return (
                  <TableRow
                    key={rate.id}
                    className={`transition-colors duration-150 hover:bg-surface-muted ${isActiveRate ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep">
                      {rate.code || `IVA-${rate.id}`}
                    </TableCell>
                    <TableCell className="text-body-md text-foreground">
                      <span className="flex items-center gap-sm">
                        {rate.tax_name || rate.name}
                        {isActiveRate ? (
                          <Badge variant="secondary">
                            <BadgeCheck className="w-3 h-3 mr-xs" />
                            {t('categories.tax.badge_default_cat')}
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-right">
                      {rate.rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rate.rate === 0 ? 'secondary' : 'success'}>
                        {rate.rate === 0
                          ? t('categories.tax.status_exempt')
                          : t('categories.tax.status_taxed')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info card SIFEN */}
      <div className="mt-lg bg-surface-muted rounded-md p-md flex gap-md items-start">
        <div className="bg-primary/10 p-sm rounded-full shrink-0 text-primary">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-body-md-bold text-foreground">{t('categories.tax.sync_title')}</h3>
          <p className="text-body-md text-on-surface-deep mt-xs">
            {t('categories.tax.sync_desc')}
          </p>
        </div>
      </div>

      {/* Confirmación de auto-clasificación (§6.6) */}
      <EnhancedModal
        isOpen={showConfirmModal && !!selectedCategory}
        onClose={() => setShowConfirmModal(false)}
        title={t('categories.tax.confirm.title')}
        variant="warning"
        size="sm"
        footer={
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAutoClassify} loading={applying}>
              {t('categories.tax.confirm.apply')}
            </Button>
          </div>
        }
      >
        <p className="text-body-md text-on-surface-deep">
          {t('categories.tax.confirm.body', {
            code: selectedSifenCode,
            name: selectedCategory?.name ?? '',
          })}
        </p>
        <p className="text-body-sm text-on-error-container bg-error-container rounded-sm p-sm mt-md">
          {t('categories.tax.confirm.warning')}
        </p>
      </EnhancedModal>
    </div>
  )
}

export default TaxRatesPanel
