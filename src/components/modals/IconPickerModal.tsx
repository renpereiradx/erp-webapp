import React, { useState, useMemo } from 'react';
import { materialIcons } from '../../data/materialIcons';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  selectedIcon?: string;
}

const ICONS_PER_PAGE = 36;

const spanishKeywords: Record<string, string> = {
  'sell': 'vender etiqueta precio',
  'local_offer': 'oferta descuento etiqueta',
  'shopping_cart': 'carrito compras',
  'shopping_bag': 'bolsa compras',
  'store': 'tienda local negocio',
  'storefront': 'fachada tienda',
  'inventory_2': 'inventario caja',
  'category': 'categoria',
  'loyalty': 'lealtad corazon fidelidad',
  'receipt': 'recibo factura comprobante',
  'shopping_basket': 'canasta compras',
  'add_shopping_cart': 'agregar carrito',
  'payments': 'pagos dinero billetes',
  'credit_card': 'tarjeta credito debito',
  'account_balance_wallet': 'billetera cartera',
  'monetization_on': 'moneda dinero plata',
  'savings': 'ahorros alcancia chancho',
  'discount': 'descuento rebaja',
  'percent': 'porcentaje',
  'redeem': 'canjear regalo',
  'card_giftcard': 'tarjeta regalo giftcard',
  'local_shipping': 'envio camion transporte logistica',
  'airport_shuttle': 'transporte van shuttle',
  'two_wheeler': 'moto motocicleta',
  'pedal_bike': 'bici bicicleta',
  'directions_car': 'auto carro coche',
  'flight': 'vuelo avion',
  'directions_boat': 'barco bote',
  'train': 'tren',
  'package': 'paquete caja',
  'package_2': 'paquete caja dos',
  'inventory': 'inventario',
  'deployed_code': 'codigo desplegado',
  'verified': 'verificado check',
  'star': 'estrella favorito destacado',
  'new_releases': 'nuevo lanzamiento',
  'campaign': 'campaña anuncio megafono',
  'trending_up': 'tendencia arriba subir',
  'trending_down': 'tendencia abajo bajar',
  'flash_on': 'rayo flash rapido oferta',
  'bolt': 'rayo energia',
  'whatshot': 'fuego caliente hot',
  'favorite': 'favorito corazon',
  'recommend': 'recomendar pulgar arriba',
  'thumb_up': 'pulgar arriba like me gusta',
  'thumb_down': 'pulgar abajo dislike no me gusta',
  'warning': 'advertencia precaucion',
  'error': 'error cruz',
  'info': 'informacion',
  'check_circle': 'circulo check listo',
  'check': 'check listo',
  'cancel': 'cancelar cruz',
  'close': 'cerrar',
  'do_not_disturb': 'no molestar',
  'block': 'bloquear prohibido',
  'schedule': 'horario reloj tiempo',
  'event': 'evento calendario',
  'timer': 'temporizador',
  'auto_awesome': 'brillo magia excelente',
  'diamond': 'diamante joya premium',
  'workspace_premium': 'premium medalla',
  'verified_user': 'usuario verificado seguro',
  'security': 'seguridad',
  'shield': 'escudo seguro',
  'lock': 'candado cerrar',
  'key': 'llave clave',
  'home': 'casa inicio',
  'search': 'buscar lupa',
  'settings': 'ajustes configuracion',
  'build': 'construir llave inglesa',
  'menu': 'menu hamburguesa',
  'more_vert': 'mas vertical opciones',
  'more_horiz': 'mas horizontal opciones',
  'arrow_back': 'flecha atras',
  'arrow_forward': 'flecha adelante',
  'arrow_upward': 'flecha arriba',
  'arrow_downward': 'flecha abajo',
  'expand_more': 'expandir mas',
  'expand_less': 'expandir menos',
  'chevron_right': 'chevron derecha',
  'chevron_left': 'chevron izquierda',
  'visibility': 'visibilidad ojo ver',
  'visibility_off': 'visibilidad oculta ocultar',
  'refresh': 'refrescar recargar',
  'sync': 'sincronizar',
  'delete': 'eliminar borrar basurero',
  'edit': 'editar lapiz',
  'add': 'agregar suma',
  'remove': 'quitar resta',
  'person': 'persona usuario',
  'group': 'grupo personas',
  'public': 'publico mundo globo',
  'language': 'idioma lenguaje',
  'mail': 'correo email mensaje',
  'send': 'enviar mandar',
  'chat': 'chat charla',
  'forum': 'foro conversacion',
  'phone': 'telefono llamar',
  'support_agent': 'agente soporte ayuda',
  'eco': 'ecologico planta hoja',
  'forest': 'bosque arboles',
  'pets': 'mascotas perros gatos',
  'child_care': 'cuidado niños bebes',
  'restaurant': 'restaurante comida',
  'local_cafe': 'cafe cafeteria',
  'local_bar': 'bar trago',
  'fastfood': 'comida rapida',
  'cake': 'pastel torta cumpleanos',
  'celebration': 'celebracion fiesta',
  'smartphone': 'celular telefono movil',
  'computer': 'computadora pc',
  'laptop': 'notebook portatil',
  'watch': 'reloj',
  'headphones': 'auriculares',
  'camera': 'camara foto',
  'videocam': 'camara video',
  'mic': 'microfono',
  'print': 'imprimir impresora',
  'tv': 'television tele',
  'router': 'router internet wifi',
  'gamepad': 'juegos consola',
  'toys': 'juguetes',
  'sports_esports': 'esports deportes electronicos',
  'sports_soccer': 'futbol pelota',
  'sports_basketball': 'basquetbol',
  'fitness_center': 'gimnasio pesas',
  'directions_run': 'correr runing',
  'directions_walk': 'caminar',
  'healing': 'curar curita',
  'medical_services': 'servicios medicos cruz',
  'science': 'ciencia tubo',
  'biotech': 'biotecnologia',
  'architecture': 'arquitectura compas',
  'construction': 'construccion martillo',
  'brush': 'pincel pintar',
  'palette': 'paleta colores',
  'format_paint': 'rodillo pintar',
  'music_note': 'musica nota',
  'movie': 'pelicula cine',
  'book': 'libro leer',
  'menu_book': 'menu libro'
};

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ isOpen, onClose, onSelect, selectedIcon }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return materialIcons;
    const lowerTerm = searchTerm.toLowerCase();
    return materialIcons.filter(icon => {
      if (icon.toLowerCase().includes(lowerTerm)) return true;
      const spanishMatch = spanishKeywords[icon];
      if (spanishMatch && spanishMatch.includes(lowerTerm)) return true;
      return false;
    });
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const currentIcons = filteredIcons.slice((currentPage - 1) * ICONS_PER_PAGE, currentPage * ICONS_PER_PAGE);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-level-3 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden border border-outline-variant/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-outline-variant/30">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Seleccionar Icono</h2>
            <p className="text-body-sm text-on-surface-variant">Elige un ícono para tu etiqueta</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-lg pb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              placeholder="Buscar ícono (ej. estrella, carrito, local_offer)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
            />
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-lg pb-lg">
          {currentIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant opacity-60">
              <span className="material-symbols-outlined text-[48px] mb-2">search_off</span>
              <p>No se encontraron íconos</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {currentIcons.map(icon => (
                <button
                  key={icon}
                  onClick={() => {
                    onSelect(icon);
                    onClose();
                  }}
                  title={icon}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all
                    ${selectedIcon === icon 
                      ? 'bg-primary/10 text-primary border-2 border-primary shadow-sm' 
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-transparent'}
                  `}
                >
                  <span className="material-symbols-outlined text-[28px]">{icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
            <span className="text-body-sm text-on-surface-variant">
              Mostrando {currentIcons.length} de {filteredIcons.length}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <span className="text-body-sm font-bold text-on-surface min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
