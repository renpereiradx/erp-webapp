/**
 * Login Page - Diseño simplificado con Fluent Design System
 * Página de acceso al sistema ERP
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { t } = useI18n();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Limpiar errores previos al montar el componente
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the AuthContext and displayed to the user.
    }
  };

  return (
    <div className="login">
      <div className="login__container">
        <div className="login__header">
          <h1 className="login__title">
            {t('login.title', 'Acceso al Sistema')}
          </h1>
          <p className="login__subtitle">
            {t('login.subtitle', 'Ingresa tus credenciales para continuar')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login__form">
          <div className="login__field">
            <label htmlFor="email" className="login__label">
              {t('login.email_label', 'Email o Usuario')}
            </label>
            <input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              className="login__input"
              placeholder={t('login.email_placeholder', 'ej: admin')}
              required
            />
          </div>

          <div className="login__field">
            <label htmlFor="password" className="login__label">
              {t('login.password_label', 'Contraseña')}
            </label>
            <div className="login__input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="login__input login__input--with-button"
                placeholder={t('login.password_placeholder', 'ej: admin123')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login__toggle-password"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="login__submit"
          >
            {loading
              ? t('login.loading', 'Iniciando Sesión...')
              : t('login.submit', 'Iniciar Sesión')}
          </button>
        </form>

        <div className="login__footer">
          <p className="login__footer-text">
            {t('login.forgot_password', '¿Olvidaste tu contraseña?')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
