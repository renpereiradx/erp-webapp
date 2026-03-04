import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Package } from 'lucide-react'

const ProductAdjustmentsPage = () => {
  const navigate = useNavigate()

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      <header className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
        <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase'>
          Bienvenido al Sistema de Gestión
        </h1>
        <p className='text-text-secondary text-sm font-medium'>
          Seleccione una acción para comenzar
        </p>
      </header>

      <section className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Price Adjustment Card */}
        <div
          className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col gap-4 cursor-pointer hover:shadow-fluent-8 transition-shadow group'
          onClick={() => navigate('/ajustes-precios')}
        >
          <div className='flex items-start gap-4'>
            <div className='flex-shrink-0 size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
              <Tag size={24} strokeWidth={2} />
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-bold text-text-main leading-tight'>
                Ajuste de Precio de Producto
              </h2>
              <p className='text-sm text-text-secondary mt-1'>
                Modificar precios de productos de forma manual.
              </p>
            </div>
          </div>
          <button
            className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all mt-auto'
            onClick={e => {
              e.stopPropagation()
              navigate('/ajustes-precios')
            }}
          >
            Gestionar Precios
          </button>
        </div>

        {/* Stock Adjustment Card */}
        <div
          className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col gap-4 cursor-pointer hover:shadow-fluent-8 transition-shadow group'
          onClick={() => navigate('/ajustes-inventario')}
        >
          <div className='flex items-start gap-4'>
            <div className='flex-shrink-0 size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
              <Package size={24} strokeWidth={2} />
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-bold text-text-main leading-tight'>
                Ajuste de Stock de Inventario
              </h2>
              <p className='text-sm text-text-secondary mt-1'>
                Actualizar las cantidades de stock en el inventario.
              </p>
            </div>
          </div>
          <button
            className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all mt-auto'
            onClick={e => {
              e.stopPropagation()
              navigate('/ajustes-inventario')
            }}
          >
            Gestionar Stock
          </button>
        </div>
      </section>
    </div>
  )
}

export default ProductAdjustmentsPage
