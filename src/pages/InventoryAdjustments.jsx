import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageSearch, ArrowLeft } from 'lucide-react'

const InventoryAdjustmentsPage = () => {
  const navigate = useNavigate()

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      <button
        className='flex items-center gap-2 text-text-secondary hover:text-text-main hover:bg-slate-50 w-fit px-3 py-2 rounded-md transition-colors text-sm font-semibold'
        onClick={() => navigate('/ajustes-producto')}
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>Volver</span>
      </button>

      <header className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
        <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase'>
          Ajustes de Inventario
        </h1>
        <p className='text-text-secondary text-sm font-medium'>
          Seleccione el tipo de ajuste que desea realizar
        </p>
      </header>

      <section className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Unit Adjustment Card */}
        <div
          className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col gap-4 cursor-pointer hover:shadow-fluent-8 transition-shadow group'
          onClick={() => navigate('/ajuste-inventario-unitario')}
        >
          <div className='flex items-start gap-4'>
            <div className='flex-shrink-0 size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
              <PackagePlus size={24} strokeWidth={2} />
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-bold text-text-main leading-tight'>
                Ajuste Unitario
              </h2>
              <p className='text-sm text-text-secondary mt-1'>
                Ajustar el stock de un producto específico de forma manual.
              </p>
            </div>
          </div>
          <button
            className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all mt-auto'
            onClick={e => {
              e.stopPropagation()
              navigate('/ajuste-inventario-unitario')
            }}
          >
            Ajuste Unitario
          </button>
        </div>

        {/* Bulk Adjustment Card */}
        <div
          className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden flex flex-col gap-4 cursor-pointer hover:shadow-fluent-8 transition-shadow group'
          onClick={() => navigate('/ajuste-inventario-masivo')}
        >
          <div className='flex items-start gap-4'>
            <div className='flex-shrink-0 size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
              <PackageSearch size={24} strokeWidth={2} />
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='text-lg font-bold text-text-main leading-tight'>
                Ajuste Masivo
              </h2>
              <p className='text-sm text-text-secondary mt-1'>
                Ajustar el stock de múltiples productos simultáneamente.
              </p>
            </div>
          </div>
          <button
            className='px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all mt-auto'
            onClick={e => {
              e.stopPropagation()
              navigate('/ajuste-inventario-masivo')
            }}
          >
            Ajuste Masivo
          </button>
        </div>
      </section>
    </div>
  )
}

export default InventoryAdjustmentsPage
