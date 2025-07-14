/**
 * Página de Login optimizada para Neo-Brutalism
 * Sistema de autenticación con formulario interactivo y estilo brutal mejorado
 * Incluye helper functions específicas para estilo Neo-Brutalist
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
  AlertCircle,
  Shield,
  Zap,
  Coffee
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
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistContainerStyles = () => ({
    background: 'var(--background)',
    border: '6px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3.5rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1',
        textShadow: '4px 4px 0px rgba(0,0,0,0.8)',
        marginBottom: '1rem'
      },
      heading: {
        fontSize: '2rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2',
        marginBottom: '0.5rem'
      },
      subheading: {
        fontSize: '1.25rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistInputStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    padding: '16px 20px',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
    transition: 'all 150ms ease',
    textTransform: 'none',
    width: '100%'
  });

  const getBrutalistButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        padding: '16px 32px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        fontSize: '1.125rem',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        width: '100%'
      },
      secondary: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        fontSize: '1rem',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        width: '100%'
      },
      demo: {
        background: 'var(--brutalist-orange)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        fontSize: '0.875rem',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  const getBrutalistIconStyles = (colorVar) => ({
    background: `var(${colorVar})`,
    border: '3px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colorVar === '--brutalist-lime' ? '#000000' : '#ffffff'
  });

  const getBrutalistErrorStyles = () => ({
    background: 'var(--brutalist-pink)',
    color: '#ffffff',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    padding: '12px 16px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    fontSize: '0.875rem',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    marginBottom: '1rem'
  });

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'EL EMAIL O USUARIO ES REQUERIDO';
    } else if (formData.username.length < 3) {
      errors.username = 'DEBE TENER AL MENOS 3 CARACTERES';
    }
    
    if (!formData.password) {
      errors.password = 'LA CONTRASEÑA ES REQUERIDA';
    } else if (formData.password.length < 6) {
      errors.password = 'LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES';
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
    }
  };

  const handleInputFocus = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-3px, -3px)';
      e.target.style.boxShadow = '7px 7px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleInputBlur = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-3px, -3px)';
      const shadowSize = e.target.classList.contains('demo-button') ? '6px 6px' : '9px 9px';
      e.target.style.boxShadow = `${shadowSize} 0px 0px rgba(0,0,0,1)`;
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      const shadowSize = e.target.classList.contains('demo-button') ? '3px 3px' : '6px 6px';
      e.target.style.boxShadow = `${shadowSize} 0px 0px rgba(0,0,0,1)`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Panel izquierdo - Información */}
        <div className="space-y-8 text-center lg:text-left">
          <div>
            <h1 
              className="text-primary"
              style={getBrutalistTypography('title')}
            >
              ERP SYSTEM
            </h1>
            <h2 
              className="text-foreground"
              style={getBrutalistTypography('heading')}
            >
              NEO-BRUTALIST DESIGN
            </h2>
            <p 
              className="text-muted-foreground mt-4 max-w-md mx-auto lg:mx-0"
              style={getBrutalistTypography('base')}
            >
              SISTEMA DE GESTIÓN EMPRESARIAL CON DISEÑO MODERNO Y FUNCIONALIDAD AVANZADA
            </p>
          </div>

          {/* Características destacadas */}
          <div className="grid gap-6">
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div style={getBrutalistIconStyles('--brutalist-lime')}>
                <Shield className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 style={getBrutalistTypography('subheading')}>
                  SEGURIDAD TOTAL
                </h3>
                <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                  Autenticación robusta y datos protegidos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div style={getBrutalistIconStyles('--brutalist-blue')}>
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 style={getBrutalistTypography('subheading')}>
                  RENDIMIENTO BRUTAL
                </h3>
                <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                  Velocidad extrema en todas las operaciones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div style={getBrutalistIconStyles('--brutalist-orange')}>
                <Coffee className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 style={getBrutalistTypography('subheading')}>
                  FÁCIL DE USAR
                </h3>
                <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                  Interfaz intuitiva con estilo único
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de login */}
        <div className="flex justify-center">
          <div style={getBrutalistContainerStyles()}>
            
            {/* Header del formulario */}
            <div className="text-center mb-8">
              <div style={getBrutalistIconStyles('--brutalist-purple')} className="mx-auto mb-4">
                <User className="w-10 h-10" />
              </div>
              <h2 
                className="text-foreground"
                style={getBrutalistTypography('heading')}
              >
                INICIAR SESIÓN
              </h2>
              <p 
                className="text-muted-foreground mt-2"
                style={getBrutalistTypography('base')}
              >
                ACCEDE A TU PANEL DE CONTROL
              </p>
            </div>

            {/* Mostrar error general */}
            {error && (
              <div style={getBrutalistErrorStyles()}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error.toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo de usuario */}
              <div>
                <label 
                  htmlFor="username"
                  className="block text-foreground mb-3"
                  style={getBrutalistTypography('subheading')}
                >
                  USUARIO O EMAIL
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="pl-14"
                    style={getBrutalistInputStyles()}
                    placeholder="TU USUARIO O EMAIL"
                    disabled={loading}
                  />
                </div>
                {formErrors.username && (
                  <div className="mt-2" style={{...getBrutalistErrorStyles(), padding: '8px 12px'}}>
                    {formErrors.username}
                  </div>
                )}
              </div>

              {/* Campo de contraseña */}
              <div>
                <label 
                  htmlFor="password"
                  className="block text-foreground mb-3"
                  style={getBrutalistTypography('subheading')}
                >
                  CONTRASEÑA
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="pl-14 pr-14"
                    style={getBrutalistInputStyles()}
                    placeholder="TU CONTRASEÑA"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="mt-2" style={{...getBrutalistErrorStyles(), padding: '8px 12px'}}>
                    {formErrors.password}
                  </div>
                )}
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...getBrutalistButtonStyles('primary'),
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={!loading ? handleButtonHover : undefined}
                onMouseLeave={!loading ? handleButtonLeave : undefined}
              >
                <div className="flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      INICIANDO SESIÓN...
                    </>
                  ) : (
                    <>
                      INICIAR SESIÓN
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </div>
              </button>

              {/* Separador */}
              <div className="text-center">
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('base')}
                >
                  O PRUEBA LA DEMO
                </div>
              </div>

              {/* Botón demo */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="demo-button"
                style={{
                  ...getBrutalistButtonStyles('demo'),
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={!loading ? handleButtonHover : undefined}
                onMouseLeave={!loading ? handleButtonLeave : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  <Coffee className="w-5 h-5" />
                  ACCESO DEMO
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p 
                className="text-muted-foreground"
                style={getBrutalistTypography('small')}
              >
                ¿PROBLEMAS CON EL ACCESO?
              </p>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  ...getBrutalistTypography('small'),
                  textDecoration: 'underline',
                  textDecorationThickness: '2px'
                }}
              >
                CONTACTAR SOPORTE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
