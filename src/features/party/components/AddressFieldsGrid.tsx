import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from './CountrySelect'

export interface AddressFieldsValue {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export type AddressField = keyof AddressFieldsValue

interface AddressFieldsGridProps {
  values: AddressFieldsValue
  onChange: (field: AddressField, value: string) => void
  disabled?: boolean
  errors?: Partial<Record<AddressField, string>>
}

function fieldBlock(params: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  const { id, label, error, children } = params
  return (
    <div className="space-y-xs">
      <Label
        htmlFor={id}
        className="text-label-caps uppercase text-on-surface-variant"
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-body-sm-bold text-error">{error}</p>}
    </div>
  )
}

/**
 * Dirección estructurada de un party (calle, ciudad, estado, código postal
 * y país ISO 3166-1 alpha-2). Mapea 1:1 con las columnas address_* del
 * backend; los campos vacíos simplemente no se envían.
 */
export function AddressFieldsGrid({
  values,
  onChange,
  disabled,
  errors,
}: AddressFieldsGridProps) {
  const { t } = useI18n()

  const textInput = (field: AddressField, id: string) => (
    <Input
      id={id}
      name={field}
      type="text"
      className="h-10 rounded-input"
      state={errors?.[field] ? 'error' : ''}
      value={values[field]}
      onChange={e => onChange(field, e.target.value)}
      disabled={disabled}
    />
  )

  return (
    <fieldset className="space-y-md" disabled={disabled}>
      <legend className="text-body-sm-bold uppercase tracking-widest text-on-surface-variant">
        {t('party.field.address_section')}
      </legend>

      {fieldBlock({
        id: 'address_street',
        label: t('party.field.address_street'),
        error: errors?.street,
        children: textInput('street', 'address_street'),
      })}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {fieldBlock({
          id: 'address_city',
          label: t('party.field.address_city'),
          error: errors?.city,
          children: textInput('city', 'address_city'),
        })}
        {fieldBlock({
          id: 'address_state',
          label: t('party.field.address_state'),
          error: errors?.state,
          children: textInput('state', 'address_state'),
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {fieldBlock({
          id: 'address_zip_code',
          label: t('party.field.address_zip_code'),
          error: errors?.zipCode,
          children: textInput('zipCode', 'address_zip_code'),
        })}
        <div className="md:col-span-2">
          <CountrySelect
            id="address_country"
            value={values.country}
            onChange={v => onChange('country', v)}
            disabled={disabled}
            error={errors?.country}
          />
        </div>
      </div>
    </fieldset>
  )
}

export default AddressFieldsGrid
