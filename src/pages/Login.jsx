import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../contexts/ThemeContext';
import { DEMO_CONFIG, getDemoCredentialsList } from '../config/demoAuth';
import { Copy, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { t } = useI18n();
  const { login, loading, error, clearError } = useAuth();
  const { isNeoBrutalism } = useTheme();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  useEffect(() => {
    // Limpiar errores previos al montar el componente
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Attempting login with:', formData);
    
    try {
      const result = await login(formData);
      console.log('🔐 Login result:', result);
      
      if (result?.success) {
        console.log('✅ Login successful, should redirect automatically');
      } else {
        console.error('❌ Login failed:', result?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };

  const fillDemoCredentials = (credentials) => {
    setFormData({ email: credentials.email, password: credentials.password });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Podrías mostrar un toast aquí
    });
  };

  const cardClasses = isNeoBrutalism() 
    ? "w-full max-w-md p-8 space-y-6 bg-card text-card-foreground border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    : "w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-2xl border";

  const headerClasses = isNeoBrutalism() 
    ? "text-3xl font-black uppercase tracking-wide"
    : "text-3xl font-bold";

  const bodyClasses = isNeoBrutalism() 
    ? "text-sm font-bold text-muted-foreground uppercase"
    : "text-muted-foreground";

  const labelClasses = isNeoBrutalism() 
    ? "text-sm font-black uppercase"
    : "text-sm font-medium";

  const inputClasses = isNeoBrutalism() 
    ? "mt-1 border-4 border-black bg-background text-foreground p-3 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    : "mt-1 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring/50";

  const buttonClasses = isNeoBrutalism() 
    ? "w-full bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all py-3 px-6"
    : "w-full bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className={cardClasses}>
        <div className="text-center">
          <h1 className={headerClasses}>{t('login.title', 'Acceso al Sistema')}</h1>
          <p className={bodyClasses}>{t('login.subtitle', 'Ingresa tus credenciales para continuar')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={labelClasses}>{t('login.email_label', 'Email o Usuario')}</label>
            <Input 
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              placeholder={t('login.email_placeholder', 'ej: admin')}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClasses}>{t('login.password_label', 'Contraseña')}</label>
            <div className="relative">
              <Input 
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={inputClasses + " pr-12"}
                placeholder={t('login.password_placeholder', 'ej: admin123')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/20 text-destructive font-bold text-sm p-3 text-center">
              {t(error, t('login.error.generic', 'Error: Credenciales incorrectas o problema del servidor.'))}
            </div>
          )}

          <div>
            <Button type="submit" disabled={loading} className={buttonClasses}>
              {loading ? t('login.loading', 'Iniciando Sesión...') : t('login.submit', 'Iniciar Sesión')}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
            <p className={bodyClasses}>{t('login.forgot_password', '¿Olvidaste tu contraseña?')}</p>
        </div>

        {/* Demo Credentials Section */}
        {DEMO_CONFIG.enabled && DEMO_CONFIG.showCredentials && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-sm ${isNeoBrutalism() ? 'font-black uppercase' : 'font-semibold'}`}>
                🧪 Credenciales Demo
              </h3>
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className={`text-xs ${bodyClasses} hover:text-foreground transition-colors`}
              >
                {showDemoCredentials ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showDemoCredentials && (
              <div className="space-y-3">
                <p className={`text-xs ${bodyClasses} mb-3`}>
                  API no disponible. Usa estas credenciales para probar la aplicación:
                </p>
                
                {getDemoCredentialsList().map((demo, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded ${isNeoBrutalism() ? 'border-2 border-black' : 'border-border'} bg-muted/30`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-bold ${demo.role === 'admin' ? 'text-green-600' : demo.role === 'manager' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {demo.label} ({demo.role})
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-background px-2 py-1 rounded">{demo.email}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(demo.email)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-background px-2 py-1 rounded">{demo.password}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(demo.password)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials(demo)}
                        className={`text-xs ${isNeoBrutalism() ? 'border-2 border-black font-bold' : ''}`}
                      >
                        Usar
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className={`text-xs ${bodyClasses} text-center pt-2`}>
                  💡 Tip: La opción más rápida es <strong>demo / demo</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;