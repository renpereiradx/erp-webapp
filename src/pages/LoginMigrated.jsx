/**
 * Login Page - Migrado a Fluent UI React v9
 * Usando sistema de temas Sass + BEM
 */

import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../contexts/AuthContext'
import {
  Field,
  Input,
  Button,
  Spinner
} from '@fluentui/react-components'
import { Eye24Regular, EyeOff24Regular } from '@fluentui/react-icons'

const LoginMigrated = () => {
  const { t } = useI18n()
  const { login, loading, error, clearError } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Limpiar errores previos al montar el componente
    return () => clearError()
  }, [clearError])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      await login(formData)
    } catch (error) {
      // Error is handled by the AuthContext and displayed to the user.
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__header">
          <h1 className="login__title">
            {t('login.title', 'Acceso al Sistema')}
          </h1>
          <p className="login__subtitle">
            {t('login.subtitle', 'Ingresa tus credenciales para continuar')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login__form">
          <Field
            label={t('login.email_label', 'Email o Usuario')}
            required
          >
            <Input
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('login.email_placeholder', 'ej: admin')}
              required
              appearance="outline"
              className="login__input"
            />
          </Field>

          <Field
            label={t('login.password_label', 'Contraseña')}
            required
          >
            <div className="login__input-wrapper">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder={t('login.password_placeholder', 'ej: admin123')}
                required
                appearance="outline"
                className="login__input login__input--with-icon"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login__toggle-password"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
              </button>
            </div>
          </Field>

          {error && (
            <div className="login__error" role="alert">
              {t(
                error,
                t(
                  'login.error.generic',
                  'Error: Credenciales incorrectas o problema del servidor.'
                )
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            appearance="primary"
            size="large"
            className={`login__submit ${loading ? 'login__submit--loading' : ''}`}
          >
            {loading
              ? t('login.loading', 'Iniciando Sesión...')
              : t('login.submit', 'Iniciar Sesión')}
          </Button>
        </form>

        <div className="login__footer">
          <p className="login__footer-text">
            <span
              className="login__forgot-link"
              role="button"
              tabIndex={0}
              onClick={() => console.log('Forgot password clicked')}
              onKeyPress={(e) => e.key === 'Enter' && console.log('Forgot password clicked')}
            >
              {t('login.forgot_password', '¿Olvidaste tu contraseña?')}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginMigrated
