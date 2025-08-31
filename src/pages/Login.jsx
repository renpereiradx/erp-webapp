import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useAuthStore from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useThemeStyles } from '../hooks/useThemeStyles';

const LoginPage = () => {
  const { t } = useI18n();
  const { login, loading, error, clearError } = useAuthStore();
  const { styles } = useThemeStyles();

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    // Limpiar errores previos al montar el componente
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className={`w-full max-w-md p-8 space-y-6 ${styles.card('shadow-2xl')}`}>
        <div className="text-center">
          <h1 className={styles.header('h1')}>{t('login.title', 'Acceso al Sistema')}</h1>
          <p className={styles.body()}>{t('login.subtitle', 'Ingresa tus credenciales para continuar')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={styles.label()}>{t('login.email_label', 'Email o Usuario')}</label>
            <Input 
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 ${styles.input()}`}
              placeholder={t('login.email_placeholder', 'ej: admin')}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={styles.label()}>{t('login.password_label', 'Contraseña')}</label>
            <Input 
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 ${styles.input()}`}
              placeholder={t('login.password_placeholder', 'ej: admin123')}
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/20 text-destructive font-bold text-sm p-3 text-center">
              {t(error, t('login.error.generic', 'Error: Credenciales incorrectas o problema del servidor.'))}
            </div>
          )}

          <div>
            <Button type="submit" disabled={loading} className={`w-full ${styles.button('primary')}`}>
              {loading ? t('login.loading', 'Iniciando Sesión...') : t('login.submit', 'Iniciar Sesión')}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
            <p className={styles.body()}>{t('login.forgot_password', '¿Olvidaste tu contraseña?')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;