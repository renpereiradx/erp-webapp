import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Package } from 'lucide-react'

const ProductAdjustmentsPage = () => {
  const navigate = useNavigate()

  return (
    <div className='product-adjustments-page'>
      <header className='product-adjustments-page__header'>
        <h1 className='product-adjustments-page__title'>
          Bienvenido al Sistema de Gestión
        </h1>
        <p className='product-adjustments-page__subtitle'>
          Seleccione una acción para comenzar
        </p>
      </header>

      <section className='product-adjustments-page__cards'>
        {/* Price Adjustment Card */}
        <div
          className='adjustment-card'
          onClick={() => navigate('/ajustes-precios')}
        >
          <div className='adjustment-card__content'>
            <div className='adjustment-card__icon-container'>
              <Tag className='adjustment-card__icon' size={32} strokeWidth={2} />
            </div>
            <div className='adjustment-card__info'>
              <h2 className='adjustment-card__title'>
                Ajuste de Precio de Producto
              </h2>
              <p className='adjustment-card__description'>
                Modificar precios de productos de forma manual.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary adjustment-card__button'
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
          className='adjustment-card'
          onClick={() => navigate('/ajustes-inventario')}
        >
          <div className='adjustment-card__content'>
            <div className='adjustment-card__icon-container'>
              <Package className='adjustment-card__icon' size={32} strokeWidth={2} />
            </div>
            <div className='adjustment-card__info'>
              <h2 className='adjustment-card__title'>
                Ajuste de Stock de Inventario
              </h2>
              <p className='adjustment-card__description'>
                Actualizar las cantidades de stock en el inventario.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary adjustment-card__button'
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
