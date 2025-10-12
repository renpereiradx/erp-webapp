import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button';
import { Input } from '../components/ui/input'
import { useTheme } from '../contexts/ThemeContext'
import { Eye, EyeOff } from 'lucide-react'

const LoginPage = () => {
  const { t } = useI18n()
  const { login, loading, error, clearError } = useAuth()
  const { isNeoBrutalism } = useTheme()

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

  const cardClasses = isNeoBrutalism()
    ? 'w-full max-w-md p-8 space-y-6 bg-card text-card-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
    : 'w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-2xl border'

  const headerClasses = isNeoBrutalism()
    ? 'text-3xl font-black uppercase tracking-wide'
    : 'text-3xl font-bold'

  const bodyClasses = isNeoBrutalism()
    ? 'text-sm font-bold text-muted-foreground uppercase'
    : 'text-muted-foreground'

  const labelClasses = isNeoBrutalism()
    ? 'text-sm font-black uppercase'
    : 'text-sm font-medium'

  const inputClasses = isNeoBrutalism()
    ? 'mt-1 border-4 border-black bg-background text-foreground p-3 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    : 'mt-1 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring/50'

  const buttonClasses = isNeoBrutalism()
    ? 'w-full bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all py-3 px-6'
    : 'w-full bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90'

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <div className={cardClasses}>
        <div className='text-center'>
          <h1 className={headerClasses}>
            {t('login.title', 'Acceso al Sistema')}
          </h1>
          <p className={bodyClasses}>
            {t('login.subtitle', 'Ingresa tus credenciales para continuar')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label htmlFor='email' className={labelClasses}>
              {t('login.email_label', 'Email o Usuario')}
            </label>
            <Input
              id='email'
              name='email'
              type='text'
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              placeholder={t('login.email_placeholder', 'ej: admin')}
              required
            />
          </div>

          <div>
            <label htmlFor='password' className={labelClasses}>
              {t('login.password_label', 'Contraseña')}
            </label>
            <div className='relative'>
              <Input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={inputClasses + ' pr-12'}
                placeholder={t('login.password_placeholder', 'ej: admin123')}
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className='bg-destructive/20 text-destructive font-bold text-sm p-3 text-center'>
              {t(
                error,
                t(
                  'login.error.generic',
                  'Error: Credenciales incorrectas o problema del servidor.'
                )
              )}
            </div>
          )}

          <div>
            <Button type='submit' disabled={loading} className={buttonClasses}>
              {loading
                ? t('login.loading', 'Iniciando Sesión...')
                : t('login.submit', 'Iniciar Sesión')}
            </Button>
          </div>
        </form>

        <div className='text-center text-sm'>
          <p className={bodyClasses}>
            {t('login.forgot_password', '¿Olvidaste tu contraseña?')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
