import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const formatDateTime = (value, locale = 'es-MX') => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return value
  }
}

const SupplierDirectoryDetailsModal = ({ isOpen, onClose, supplier }) => {
  const { t, locale } = useI18n()

  if (!isOpen || !supplier) return null

  const contact = supplier.contact || {}
  const addressLine =
    contact.address || supplier.address || supplier.contactAddress || '-'

  return (
    <div className='dialog-overlay' onClick={onClose}>
      <div
        className='dialog dialog--medium'
        onClick={event => event.stopPropagation()}
      >
        <div className='dialog__header'>
          <h2 className='dialog__title'>
            {t('supplier.details.title', 'Detalle del proveedor')}
          </h2>
          <button
            type='button'
            className='dialog__close'
            onClick={onClose}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        <div className='dialog__content'>
          <div className='supplier-details'>
            <div className='supplier-details__row'>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>ID</span>
                <span className='supplier-details__value'>
                  {supplier.id ?? '-'}
                </span>
              </div>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.status', 'Estado')}
                </span>
                <span className='supplier-details__value'>
                  <span
                    className={`badge badge--${
                      supplier.status ? 'success' : 'default'
                    }`}
                  >
                    {supplier.status
                      ? t('supplier.status.active', 'Activo')
                      : t('supplier.status.inactive', 'Inactivo')}
                  </span>
                </span>
              </div>
            </div>

            <div className='supplier-details__row'>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.name', 'Nombre')}
                </span>
                <span className='supplier-details__value'>
                  {supplier.name || '-'}
                </span>
              </div>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.taxId', 'RFC / Tax ID')}
                </span>
                <span className='supplier-details__value'>
                  {supplier.taxId || supplier.tax_id || '-'}
                </span>
              </div>
            </div>

            <div className='supplier-details__row'>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.email', 'Correo')}
                </span>
                <span className='supplier-details__value'>
                  {contact.email || '-'}
                </span>
              </div>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.phone', 'Teléfono')}
                </span>
                <span className='supplier-details__value'>
                  {contact.phone || '-'}
                </span>
              </div>
            </div>

            <div className='supplier-details__row'>
              <div className='supplier-details__field supplier-details__field--full'>
                <span className='supplier-details__label'>
                  {t('supplier.details.address', 'Dirección')}
                </span>
                <span className='supplier-details__value'>
                  {addressLine || '-'}
                </span>
              </div>
            </div>

            <div className='supplier-details__row'>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.createdBy', 'Creado por')}
                </span>
                <span className='supplier-details__value'>
                  {supplier.user_id || supplier.userId || '-'}
                </span>
              </div>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.createdAt', 'Creado')}
                </span>
                <span className='supplier-details__value'>
                  {formatDateTime(
                    supplier.created_at || supplier.createdAt,
                    locale
                  )}
                </span>
              </div>
            </div>

            <div className='supplier-details__row'>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.updatedAt', 'Actualizado')}
                </span>
                <span className='supplier-details__value'>
                  {formatDateTime(
                    supplier.updated_at || supplier.updatedAt,
                    locale
                  )}
                </span>
              </div>
              <div className='supplier-details__field'>
                <span className='supplier-details__label'>
                  {t('supplier.details.metadata', 'Notas')}
                </span>
                <span className='supplier-details__value'>
                  {supplier.metadata?.notes || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className='dialog__footer dialog__footer--single'>
            <button
              type='button'
              className='btn btn--secondary'
              onClick={onClose}
            >
              {t('action.close', 'Cerrar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDirectoryDetailsModal
