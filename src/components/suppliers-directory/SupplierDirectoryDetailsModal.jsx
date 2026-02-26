import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

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
    <div 
      className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity' 
      onClick={onClose}
    >
      <div
        className='w-full max-w-xl bg-white rounded-xl shadow-fluent-16 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200'
        onClick={event => event.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-[#d1d1d1]'>
          <h2 className='text-xl font-black text-[#323130] uppercase tracking-tighter'>
            {t('supplier.details.title', 'Detalle del proveedor')}
          </h2>
          <button
            type='button'
            className='p-2 text-[#616161] hover:bg-[#f3f4f6] hover:text-[#323130] rounded-md transition-all'
            onClick={onClose}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* ID */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                ID
              </span>
              <span className='text-sm font-mono font-bold text-[#323130]'>{supplier.id ?? '-'}</span>
            </div>

            {/* Status */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.status', 'Estado')}
              </span>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                    supplier.status
                      ? 'bg-[#dff6dd] text-[#107c10]'
                      : 'bg-[#f3f4f6] text-[#616161]'
                  }`}
                >
                  {supplier.status
                    ? t('supplier.status.active', 'Activo')
                    : t('supplier.status.inactive', 'Inactivo')}
                </span>
              </div>
            </div>

            {/* Name */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.name', 'Nombre')}
              </span>
              <span className='text-sm font-bold text-[#323130]'>{supplier.name || '-'}</span>
            </div>

            {/* Tax ID */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.taxId', 'RFC / Tax ID')}
              </span>
              <span className='text-sm font-mono font-bold text-[#323130]'>{supplier.taxId || supplier.tax_id || '-'}</span>
            </div>

            {/* Email */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.email', 'Correo')}
              </span>
              <span className='text-sm font-medium text-[#323130]'>{contact.email || '-'}</span>
            </div>

            {/* Phone */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.phone', 'Teléfono')}
              </span>
              <span className='text-sm font-medium text-[#323130]'>{contact.phone || '-'}</span>
            </div>

            {/* Address */}
            <div className='md:col-span-2 space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.address', 'Dirección')}
              </span>
              <span className='text-sm font-medium text-[#323130]'>{addressLine || '-'}</span>
            </div>

            {/* Created By */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.createdBy', 'Creado por')}
              </span>
              <span className='text-sm font-bold text-[#323130]'>{supplier.user_id || supplier.userId || '-'}</span>
            </div>

            {/* Created At */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.createdAt', 'Creado')}
              </span>
              <span className='text-sm font-bold text-[#323130]'>
                {formatDateTime(
                  supplier.created_at || supplier.createdAt,
                  locale
                )}
              </span>
            </div>

            {/* Updated At */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.updatedAt', 'Actualizado')}
              </span>
              <span className='text-sm font-bold text-[#323130]'>
                {formatDateTime(
                  supplier.updated_at || supplier.updatedAt,
                  locale
                )}
              </span>
            </div>

            {/* Notes */}
            <div className='space-y-1'>
              <span className='text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block'>
                {t('supplier.details.metadata', 'Notas')}
              </span>
              <span className='text-sm font-medium text-[#323130]'>{supplier.metadata?.notes || '-'}</span>
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-center pt-8 border-t border-[#f3f4f6]'>
            <Button
              variant="outline"
              type='button'
              className='px-10 py-2 border border-[#d1d1d1] text-[#323130] text-xs font-bold uppercase rounded shadow-sm hover:bg-[#f3f4f6] active:scale-[0.98] transition-all'
              onClick={onClose}
            >
              {t('action.close', 'Cerrar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDirectoryDetailsModal
