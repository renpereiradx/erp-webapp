import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { PARTY_DOCUMENT_TYPES } from '@/domain/party/identity'

interface DocumentTypeSelectProps {
  id: string
  /** document_type canónico ('' = sin especificar). */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

/** Radix Select items no aceptan value vacío: sentinel para "sin especificar". */
const UNSET = '__unset__'

/**
 * Selector de tipo de documento restringido a la whitelist del backend
 * (internal/party · PARTY_DOCUMENT_TYPES). El valor se envía en mayúsculas.
 */
export function DocumentTypeSelect({
  id,
  value,
  onChange,
  disabled,
  error,
}: DocumentTypeSelectProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-xs">
      <Label
        htmlFor={id}
        className="text-label-caps uppercase text-on-surface-variant"
      >
        {t('party.field.document_type')}
      </Label>
      <Select
        value={value || UNSET}
        onValueChange={v => onChange(v === UNSET ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={`h-10 rounded-input border-border-subtle text-body-md ${error ? 'border-error' : ''}`}
          data-testid={`${id}-trigger`}
        >
          <SelectValue placeholder={t('party.select.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>{t('party.select.placeholder')}</SelectItem>
          {PARTY_DOCUMENT_TYPES.map(dt => (
            <SelectItem key={dt} value={dt}>
              {t(`party.document_type.${dt}`, dt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-body-sm-bold text-error">{error}</p>}
    </div>
  )
}

export default DocumentTypeSelect
