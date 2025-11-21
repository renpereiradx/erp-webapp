import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'

const ReservationsAndSchedules = () => {
  const navigate = useNavigate()

  return (
    <div className='reservations-schedules-page'>
      <header className='reservations-schedules-page__header'>
        <h1 className='reservations-schedules-page__title'>
          Gestión de Reservas y Horarios
        </h1>
        <p className='reservations-schedules-page__subtitle'>
          Seleccione una acción para comenzar
        </p>
      </header>

      <section className='reservations-schedules-page__cards'>
        {/* Reservations Card */}
        <div className='reservation-card' onClick={() => navigate('/reservas')}>
          <div className='reservation-card__content'>
            <div className='reservation-card__icon-container'>
              <Calendar
                className='reservation-card__icon'
                size={32}
                strokeWidth={2}
              />
            </div>
            <div className='reservation-card__info'>
              <h2 className='reservation-card__title'>Reservas</h2>
              <p className='reservation-card__description'>
                Gestionar las reservas de los clientes, ver disponibilidad y
                administrar citas.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary reservation-card__button'
            onClick={e => {
              e.stopPropagation()
              navigate('/reservas')
            }}
          >
            Gestionar Reservas
          </button>
        </div>

        {/* Schedules Card */}
        <div className='reservation-card' onClick={() => navigate('/horarios')}>
          <div className='reservation-card__content'>
            <div className='reservation-card__icon-container'>
              <Clock
                className='reservation-card__icon'
                size={32}
                strokeWidth={2}
              />
            </div>
            <div className='reservation-card__info'>
              <h2 className='reservation-card__title'>Horarios</h2>
              <p className='reservation-card__description'>
                Configurar y administrar los horarios disponibles, turnos y
                excepciones.
              </p>
            </div>
          </div>
          <button
            className='btn btn--primary reservation-card__button'
            onClick={e => {
              e.stopPropagation()
              navigate('/horarios')
            }}
          >
            Gestionar Horarios
          </button>
        </div>
      </section>
    </div>
  )
}

export default ReservationsAndSchedules
