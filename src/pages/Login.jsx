/**
 * Página de Login con estilo Neo-Brutalista
 * Sistema de autenticación con formulario interactivo
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useAuthStore from '@/store/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { login, loading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const isNeoBrutalism = theme?.includes('neo-brutalism');

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'El email o usuario es requerido';
    } else if (formData.username.length < 3) {
      errors.username = 'Debe tener al menos 3 caracteres';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    clearError();
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  // Login demo rápido
  const handleDemoLogin = async () => {
    const demoCredentials = {
      username: 'demo@erp.com',
      password: 'demo123'
    };
    
    setFormData(demoCredentials);
    
    try {
      await login(demoCredentials);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error en demo login:', error);
      // El error será mostrado automáticamente por el store
    }
  };

  return (
    <div className="login-page min-h-screen bg-background flex items-center justify-center p-4" data-component="login-page" data-testid="login-page" style={{ backgroundColor: 'var(--background)' }}>
      <div className="login-container w-full max-w-md" data-component="login-container" data-testid="login-container">
        {/* Header con logo */}
        <div className="login-header text-center mb-8" data-component="login-header" data-testid="login-header">
          <div className={`login-logo inline-flex items-center justify-center w-20 h-20 mb-6 ${
            isNeoBrutalism 
              ? 'bg-foreground rounded-none border-4 border-foreground shadow-neo-brutal'
              : 'bg-primary rounded-lg border border-border shadow-lg'
          }`} data-component="login-logo" data-testid="login-logo" style={{
            backgroundColor: isNeoBrutalism ? 'var(--foreground)' : 'var(--primary)',
            border: isNeoBrutalism ? '4px solid var(--border)' : '1px solid var(--border)'
          }}>
            <User className={`w-10 h-10 ${isNeoBrutalism ? 'text-background' : 'text-primary-foreground'}`} style={{
              color: isNeoBrutalism ? 'var(--background)' : 'var(--primary-foreground)'
            }} />
          </div>
          <h1 className={`login-title text-4xl mb-2 ${
            isNeoBrutalism 
              ? 'font-black uppercase tracking-wide'
              : 'font-bold'
          }`} data-testid="login-title" style={{ color: 'var(--foreground)' }}>
            Sistema ERP
          </h1>
          <p className={`login-subtitle text-lg text-muted-foreground ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`} data-testid="login-subtitle" style={{ color: 'var(--muted-foreground)' }}>
            Acceso al Sistema
          </p>
        </div>

        {/* Formulario de login */}
        <div className={`login-form bg-card p-8 ${
          isNeoBrutalism 
            ? 'border-4 border-foreground shadow-neo-brutal'
            : 'border border-border rounded-lg shadow-lg'
        }`} data-component="login-form" data-testid="login-form" style={{
          backgroundColor: 'var(--card)',
          border: isNeoBrutalism ? '4px solid var(--border)' : '1px solid var(--border)',
          boxShadow: isNeoBrutalism ? '8px 8px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)'
        }}>
          {/* Error general */}
          {error && (
            <div className={`mb-6 p-4 bg-destructive/10 border border-destructive ${
              isNeoBrutalism ? 'border-4 rounded-none' : 'rounded-lg'
            }`}>
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className={`text-destructive mb-1 ${
                    isNeoBrutalism 
                      ? 'font-black uppercase text-sm'
                      : 'font-semibold text-sm'
                  }`}>
                    Error de Autenticación
                  </h3>
                  <p className={`text-destructive text-sm leading-relaxed ${
                    isNeoBrutalism ? 'font-bold' : 'font-medium'
                  }`}>
                    {error}
                  </p>
                  {error.includes('conexión') && (
                    <div className={`mt-2 text-xs text-destructive ${
                      isNeoBrutalism ? 'font-bold' : 'font-medium'
                    }`}>
                      <p>💡 Sugerencias:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Verifica que el servidor esté ejecutándose</li>
                        <li>Comprueba tu conexión a internet</li>
                        <li>Contacta al soporte técnico si persiste</li>
                      </ul>
                    </div>
                  )}
                  {error.includes('credenciales') && (
                    <div className={`mt-2 text-xs text-destructive ${
                      isNeoBrutalism ? 'font-bold' : 'font-medium'
                    }`}>
                      <p>💡 Sugerencias:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Verifica que el usuario y contraseña sean correctos</li>
                        <li>Asegúrate de que tu cuenta esté activa</li>
                        <li>Intenta recuperar tu contraseña</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email/Username */}
            <div>
              <label className={`block text-sm mb-2 ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Email o Usuario
              </label>
              <div className="relative">
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="USUARIO@EMAIL.COM"
                  className={`pl-12 ${
                    isNeoBrutalism ? 'font-bold' : ''
                  } ${formErrors.username ? 'border-destructive' : ''}`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              {formErrors.username && (
                <p className={`mt-2 text-sm text-destructive ${
                  isNeoBrutalism ? 'font-bold uppercase' : 'font-medium'
                }`}>
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className={`block text-sm mb-2 ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`pl-12 pr-12 ${
                    isNeoBrutalism ? 'font-bold' : ''
                  } ${formErrors.password ? 'border-destructive' : ''}`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className={`mt-2 text-sm text-destructive ${
                  isNeoBrutalism ? 'font-bold uppercase' : 'font-medium'
                }`}>
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Botón de login */}
            <Button
              type="submit"
              variant="lime"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-2 ${
                    isNeoBrutalism ? 'border-foreground' : 'border-current'
                  }`}></div>
                  INICIANDO SESIÓN...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  INICIAR SESIÓN
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              )}
            </Button>
          </form>

          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className={`flex-1 ${
              isNeoBrutalism 
                ? 'border-t-4 border-foreground'
                : 'border-t border-border'
            }`}></div>
            <span className={`px-4 text-sm ${
              isNeoBrutalism 
                ? 'font-black uppercase tracking-wide'
                : 'font-medium'
            }`}>O</span>
            <div className={`flex-1 ${
              isNeoBrutalism 
                ? 'border-t-4 border-foreground'
                : 'border-t border-border'
            }`}></div>
          </div>

          {/* Demo Login */}
          <Button
            type="button"
            variant="blue"
            size="lg"
            className="w-full"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            <div className="flex items-center justify-center">
              🚀 ACCESO DEMO (API)
            </div>
          </Button>

          {/* Información de API */}
          <div className={`mt-4 p-4 bg-muted ${
            isNeoBrutalism 
              ? 'border-4 border-foreground'
              : 'border border-border rounded-lg'
          }`}>
            <p className={`text-xs text-muted-foreground mb-1 ${
              isNeoBrutalism 
                ? 'font-bold uppercase tracking-wide'
                : 'font-medium'
            }`}>
              API Endpoint:
            </p>
            <p className={`text-sm ${isNeoBrutalism ? 'font-bold' : 'font-medium'}`}>POST localhost:5050/login</p>
            <p className={`text-xs text-muted-foreground mt-2 mb-1 ${
              isNeoBrutalism 
                ? 'font-bold uppercase tracking-wide'
                : 'font-medium'
            }`}>
              Request format:
            </p>
            <p className={`text-sm ${isNeoBrutalism ? 'font-bold' : 'font-medium'}`}>{"{ \"email\": \"user@email.com\", \"password\": \"pass\" }"}</p>
            <p className={`text-xs text-muted-foreground mt-2 mb-1 ${
              isNeoBrutalism 
                ? 'font-bold uppercase tracking-wide'
                : 'font-medium'
            }`}>
              Acepta email o username:
            </p>
            <p className={`text-sm ${isNeoBrutalism ? 'font-bold' : 'font-medium'}`}>demo@erp.com o demo | demo123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-sm text-muted-foreground ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`}>
            Sistema ERP © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
