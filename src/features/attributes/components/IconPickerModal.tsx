import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { useI18n } from '@/lib/i18n'

import { materialIcons } from '@/data/materialIcons'

interface IconPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (icon: string) => void
  selectedIcon?: string
}

const ICONS_PER_PAGE = 36

/** Búsqueda en español sobre nombres de íconos Material (dato almacenado en DB). */
const spanishKeywords: Record<string, string> = {
  sell: 'vender etiqueta precio',
  local_offer: 'oferta descuento etiqueta',
  shopping_cart: 'carrito compras',
  shopping_bag: 'bolsa compras',
  store: 'tienda local negocio',
  storefront: 'fachada tienda',
  inventory_2: 'inventario caja',
  category: 'categoria',
  loyalty: 'lealtad corazon fidelidad',
  receipt: 'recibo factura comprobante',
  shopping_basket: 'canasta compras',
  add_shopping_cart: 'agregar carrito',
  payments: 'pagos dinero billetes',
  credit_card: 'tarjeta credito debito',
  account_balance_wallet: 'billetera cartera',
  monetization_on: 'moneda dinero plata',
  savings: 'ahorros alcancia chancho',
  discount: 'descuento rebaja',
  percent: 'porcentaje',
  redeem: 'canjear regalo',
  card_giftcard: 'tarjeta regalo giftcard',
  local_shipping: 'envio camion transporte logistica',
  package: 'paquete caja',
  verified: 'verificado check',
  star: 'estrella favorito destacado',
  new_releases: 'nuevo lanzamiento',
  campaign: 'campaña anuncio megafono',
  trending_up: 'tendencia arriba subir',
  trending_down: 'tendencia abajo bajar',
  bolt: 'rayo energia',
  whatshot: 'fuego caliente hot',
  favorite: 'favorito corazon',
  thumb_up: 'pulgar arriba like me gusta',
  warning: 'advertencia precaucion',
  error: 'error cruz',
  info: 'informacion',
  check_circle: 'circulo check listo',
  check: 'check listo',
  close: 'cerrar',
  block: 'bloquear prohibido',
  schedule: 'horario reloj tiempo',
  event: 'evento calendario',
  timer: 'temporizador',
  auto_awesome: 'brillo magia excelente',
  diamond: 'diamante joya premium',
  workspace_premium: 'premium medalla',
  security: 'seguridad',
  shield: 'escudo seguro',
  lock: 'candado cerrar',
  key: 'llave clave',
  home: 'casa inicio',
  search: 'buscar lupa',
  settings: 'ajustes configuracion',
  build: 'construir llave inglesa',
  visibility: 'visibilidad ojo ver',
  refresh: 'refrescar recargar',
  sync: 'sincronizar',
  delete: 'eliminar borrar basurero',
  edit: 'editar lapiz',
  add: 'agregar suma',
  person: 'persona usuario',
  group: 'grupo personas',
  public: 'publico mundo globo',
  language: 'idioma lenguaje',
  mail: 'correo email mensaje',
  send: 'enviar mandar',
  chat: 'chat charla',
  phone: 'telefono llamar',
  support_agent: 'agente soporte ayuda',
  eco: 'ecologico planta hoja',
  pets: 'mascotas perros gatos',
  restaurant: 'restaurante comida',
  local_cafe: 'cafe cafeteria',
  fastfood: 'comida rapida',
  cake: 'pastel torta cumpleanos',
  celebration: 'celebracion fiesta',
  smartphone: 'celular telefono movil',
  computer: 'computadora pc',
  laptop: 'notebook portatil',
  watch: 'reloj',
  headphones: 'auriculares',
  camera: 'camara foto',
  mic: 'microfono',
  print: 'imprimir impresora',
  tv: 'television tele',
  gamepad: 'juegos consola',
  toys: 'juguetes',
  fitness_center: 'gimnasio pesas',
  healing: 'curar curita',
  medical_services: 'servicios medicos cruz',
  science: 'ciencia tubo',
  construction: 'construccion martillo',
  brush: 'pincel pintar',
  palette: 'paleta colores',
  music_note: 'musica nota',
  movie: 'pelicula cine',
  book: 'libro leer',
  menu_book: 'menu libro',
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon,
}) => {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return materialIcons
    const lowerTerm = searchTerm.toLowerCase()
    return materialIcons.filter((icon) => {
      if (icon.toLowerCase().includes(lowerTerm)) return true
      const spanishMatch = spanishKeywords[icon]
      return spanishMatch ? spanishMatch.includes(lowerTerm) : false
    })
  }, [searchTerm])

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE)
  const currentIcons = filteredIcons.slice(
    (currentPage - 1) * ICONS_PER_PAGE,
    currentPage * ICONS_PER_PAGE,
  )

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('attributes.icon_picker.title')}
      subtitle={t('attributes.icon_picker.subtitle')}
      size="lg"
      footer={null}
      contentClassName="max-h-[85vh]"
    >
      <div className="flex flex-col gap-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none" />
          <Input
            type="text"
            placeholder={t('attributes.icon_picker.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label={t('attributes.icon_picker.search_placeholder')}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[280px]">
          {currentIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl text-on-surface-deep">
              <SearchX className="w-10 h-10 mb-sm opacity-60" />
              <p className="text-body-md">{t('attributes.icon_picker.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-sm">
              {currentIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onSelect(icon)
                    onClose()
                  }}
                  title={icon}
                  aria-label={icon}
                  aria-pressed={selectedIcon === icon}
                  className={`aspect-square rounded-md flex items-center justify-center transition-colors duration-150 ${
                    selectedIcon === icon
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-surface-muted text-on-surface-deep hover:bg-surface-subtle hover:text-foreground border border-transparent'
                  }`}
                >
                  {/* Ícono de DATO: nombre Material Symbols almacenado en la etiqueta */}
                  <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pt-sm border-t border-border-subtle flex items-center justify-between">
            <span className="text-body-sm-bold text-on-surface-deep">
              {t('attributes.icon_picker.count', 'Mostrando {count} de {total}', {
                count: currentIcons.length,
                total: filteredIcons.length,
              })}
            </span>
            <div className="flex items-center gap-xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label={t('attributes.icon_picker.prev')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-body-sm-bold text-foreground min-w-[60px] text-center text-data-mono font-data-mono">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label={t('attributes.icon_picker.next')}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </EnhancedModal>
  )
}

export default IconPickerModal
