import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageSearch, ArrowLeft } from 'lucide-react'

const InventoryAdjustmentsPage = () => {
  const navigate = useNavigate()

  return (
    <div className='inventory-adjustments-page'>
      <button
        className='inventory-adjustments-page__back-button'
        onClick={() => navigate('/ajustes-producto')}
      >
        <ArrowLeft size={20} strokeWidth={2} />
        <span>Volver</span>
      </button>

      <header className='inventory-adjustments-page__header'>
        <h1 className='inventory-adjustments-page__title'>
          Ajustes de Inventario
        </h1>
        <p className='inventory-adjustments-page__subtitle'>
          Seleccione el tipo de ajuste que desea realizar
        </p>
      </header>

      <section className='inventory-adjustments-page__cards'>
        {/* Unit Adjustment Card */}
        <div
          className='adjustment-card'
          onClick={() => navigate('/ajuste-inventario-unitario')}
        >
          <div className='adjustment-card__content'>
            <div className='adjustment-card__icon-container'>
              <PackagePlus className='adjustment-card__icon' size={32} strokeWidth={2} />
            </div>
            <div className='adjustment-card__info'>
              <h2 className='adjustment-card__title'>
                Ajuste Unitario
              </h2>
              <p className='adjustment-card__description'>
                Ajustar el stock de un producto específico de forma manual.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary adjustment-card__button'
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
          className='adjustment-card'
          onClick={() => navigate('/ajuste-inventario-masivo')}
        >
          <div className='adjustment-card__content'>
            <div className='adjustment-card__icon-container'>
              <PackageSearch className='adjustment-card__icon' size={32} strokeWidth={2} />
            </div>
            <div className='adjustment-card__info'>
              <h2 className='adjustment-card__title'>
                Ajuste Masivo
              </h2>
              <p className='adjustment-card__description'>
                Ajustar el stock de múltiples productos simultáneamente.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary adjustment-card__button'
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
