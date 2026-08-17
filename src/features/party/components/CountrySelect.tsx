import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import {
  PARTY_COUNTRIES,
  countryDisplayName,
  isISOAlpha2,
} from '@/domain/party/identity'

interface CountrySelectProps {
  id: string
  /** ISO 3166-1 alpha-2 ('' = sin especificar). */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  /** Etiqueta alternativa (default: party.field.address_country). */
  label?: string
}

/** Radix Select items no aceptan value vacío: sentinel para "sin especificar". */
const UNSET = '__unset__'

/**
 * Selector de país (ISO 3166-1 alpha-2) con nombres localizados vía
 * Intl.DisplayNames. Si el valor persistido no está en la lista curada
 * pero es un alpha-2 válido, se agrega como opción extra para no perderlo.
 */
export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  error,
  label,
}: CountrySelectProps) {
  const { t, lang } = useI18n()

  const extraOption =
    value &&
    isISOAlpha2(value) &&
    !(PARTY_COUNTRIES as readonly string[]).includes(value)
      ? [value]
      : []

  return (
    <div className="space-y-xs">
      <Label
        htmlFor={id}
        className="text-label-caps uppercase text-on-surface-variant"
      >
        {label ?? t('party.field.address_country')}
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
          {[...PARTY_COUNTRIES, ...extraOption].map(code => (
            <SelectItem key={code} value={code}>
              {countryDisplayName(code, lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-body-sm-bold text-error">{error}</p>}
    </div>
  )
}

export default CountrySelect
