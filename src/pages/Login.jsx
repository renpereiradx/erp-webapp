/**
 * Página de Login - Multi-tema optimizada
 * Soporte completo para Neo-Brutalism, Material Design y Fluent Design
 * Sistema de autenticación con formulario interactivo y estilos específicos por tema
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
import { materialColors, materialTypography, materialSpacing, materialCorners, materialElevation } from '@/utils/materialDesignUtils';
import { fluentColors, fluentTypography, fluentSpacing, fluentCorners, fluentElevation } from '@/utils/fluentDesignUtils';

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

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalism) {
      switch(size) {
        case 'display': return 'font-black uppercase tracking-wide text-5xl';
        case 'large-title': return 'font-black uppercase tracking-wide text-4xl';
        case 'title': return 'font-black uppercase tracking-wide text-2xl';
        case 'subtitle': return 'font-black uppercase tracking-wide text-xl';
        case 'body-large': return 'font-bold uppercase tracking-wide text-lg';
        case 'body': return 'font-bold uppercase tracking-wide text-base';
        case 'caption': return 'font-bold uppercase tracking-wide text-sm';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluent) {
      switch(size) {
        case 'display': return 'fluent-display';
        case 'large-title': return 'fluent-large-title';
        case 'title': return 'fluent-title';
        case 'subtitle': return 'fluent-subtitle';
        case 'body-large': return 'fluent-body-large';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        case 'caption-strong': return 'fluent-caption-strong';
        default: return 'fluent-title';
      }
    }
    if (isMaterial) {
      switch(size) {
        case 'display': return 'material-display';
        case 'large-title': return 'material-headline-large';
        case 'title': return 'material-headline-medium';
        case 'subtitle': return 'material-headline-small';
        case 'body-large': return 'material-body-large';
        case 'body': return 'material-body-medium';
        case 'caption': return 'material-body-small';
        default: return 'material-headline-medium';
      }
    }
    return 'font-bold';
  };

  const getCardClass = () => {
    if (isNeoBrutalism) return 'border-4 border-foreground shadow-neo-brutal bg-background';
    if (isFluent) return 'fluent-elevation-8 fluent-radius-large bg-background';
    if (isMaterial) return 'material-card-elevated bg-background';
    return 'border border-border rounded-xl shadow-2xl bg-background';
  };

  const getButtonClass = () => {
    if (isFluent) return 'fluent-elevation-4 fluent-radius-medium w-full';
    if (isMaterial) return 'material-button-elevated w-full';
    return 'w-full';
  };

  const getInputClass = () => {
    if (isFluent) return 'fluent-radius-small';
    if (isMaterial) return 'material-input';
    return '';
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    // Credenciales de prueba para desarrollo
    const testCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'test', password: 'test123' },
      { username: 'demo', password: 'demo123' },
      { username: 'user', password: 'user123' }
    ];
    
    // Verificar si son credenciales de prueba
    const isTestLogin = testCredentials.some(cred => 
      cred.username === formData.username && cred.password === formData.password
    );
    
    if (isTestLogin) {
      console.log('🧪 Using test credentials, simulating successful login');
      try {
        // Simular login exitoso con datos mock
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.mock';
        localStorage.setItem('auth_token', mockToken);
        
        // Establecer datos de usuario directamente en el store
        const { user, token, roleId, isAuthenticated, loading, error, setLoading, setError, clearError, ...actions } = useAuthStore.getState();
        
        const mockUser = {
          id: '1',
          username: formData.username,
          email: formData.username + '@demo.com',
          role: 'admin',
          role_id: '1',
          name: formData.username.charAt(0).toUpperCase() + formData.username.slice(1),
          company: 'ERP Demo Company',
          lastLogin: new Date().toISOString(),
        };
        
        // Usar set directamente para actualizar el estado
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          roleId: '1',
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        
        console.log('🧪 Test login successful, navigating to dashboard');
        navigate('/dashboard');
        return;
      } catch (err) {
        console.error('Error in test login:', err);
      }
    }
    
    try {
      console.log('🔐 Attempting real API login...');
      await login({
        username: formData.username,
        password: formData.password
      });
      console.log('🔐 Real API login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error de login:', err);
      // Si falla el login real pero hay credenciales de test, mostrar ayuda
      if (!isTestLogin) {
        setFormErrors({
          password: 'Login failed. Try test credentials: admin/admin123, test/test123, demo/demo123, user/user123'
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{
           background: isFluent 
             ? 'linear-gradient(135deg, var(--fluent-brand-primary) 0%, var(--fluent-brand-secondary) 100%)'
             : isNeoBrutalism 
             ? 'linear-gradient(135deg, #84cc16 0%, #eab308 100%)'
             : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-white mb-2 ${getTitleClass('display')}`}>
            ERP System
          </h1>
          <p className={`text-white/90 ${getTitleClass('body-large')}`}>
            {isNeoBrutalism ? 'ACCESO AL SISTEMA' : 'Acceso al sistema'}
          </p>
        </div>

        {/* Formulario de Login */}
        <div className={`p-8 ${getCardClass()}`}>
          <div className="text-center mb-8">
            <h2 className={`text-foreground mb-2 ${getTitleClass('large-title')}`}>
              {isNeoBrutalism ? 'INICIAR SESIÓN' : 'Iniciar Sesión'}
            </h2>
            <p className={`text-muted-foreground ${getTitleClass('body')}`}>
              {isNeoBrutalism ? 'INGRESA TUS CREDENCIALES' : 'Ingresa tus credenciales para continuar'}
            </p>
            
            {/* Credenciales de prueba */}
            <div className={`mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ${
              isNeoBrutalism ? 'border-4 border-blue-600' : 'rounded-lg'
            }`}>
              <p className={`text-blue-800 dark:text-blue-200 text-sm mb-2 ${getTitleClass('caption-strong')}`}>
                {isNeoBrutalism ? 'CREDENCIALES DE PRUEBA:' : 'Credenciales de prueba:'}
              </p>
              <div className={`text-blue-700 dark:text-blue-300 text-xs space-y-1 ${getTitleClass('caption')}`}>
                <div>admin / admin123</div>
                <div>test / test123</div>
                <div>demo / demo123</div>
                <div>user / user123</div>
              </div>
            </div>
          </div>

          {/* Error general */}
          {error && (
            <div className={`mb-6 p-4 border text-red-600 flex items-center ${
              isFluent 
                ? 'fluent-radius-small border-red-300 bg-red-50 dark:bg-red-900/20'
                : isNeoBrutalism
                ? 'border-4 border-red-600 bg-red-100 dark:bg-red-900'
                : 'border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg'
            }`}>
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className={getTitleClass('body')}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Usuario */}
            <div>
              <label className={`block text-foreground mb-2 ${getTitleClass('caption-strong')}`}>
                {isNeoBrutalism ? 'USUARIO O EMAIL' : 'Usuario o Email'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder={isNeoBrutalism ? "INGRESA TU USUARIO" : "Ingresa tu usuario"}
                  className={`pl-10 ${getInputClass()} ${formErrors.username ? 'border-red-500' : ''}`}
                  style={isFluent ? { 
                    border: formErrors.username ? '2px solid var(--fluent-danger-primary)' : '1px solid var(--fluent-neutral-grey-60)'
                  } : {}}
                />
              </div>
              {formErrors.username && (
                <p className={`mt-2 text-red-600 ${getTitleClass('caption')}`}>
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label className={`block text-foreground mb-2 ${getTitleClass('caption-strong')}`}>
                {isNeoBrutalism ? 'CONTRASEÑA' : 'Contraseña'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isNeoBrutalism ? "INGRESA TU CONTRASEÑA" : "Ingresa tu contraseña"}
                  className={`pl-10 pr-10 ${getInputClass()} ${formErrors.password ? 'border-red-500' : ''}`}
                  style={isFluent ? { 
                    border: formErrors.password ? '2px solid var(--fluent-danger-primary)' : '1px solid var(--fluent-neutral-grey-60)'
                  } : {}}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className={`mt-2 text-red-600 ${getTitleClass('caption')}`}>
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className={`mr-3 ${
                  isFluent ? 'fluent-checkbox' : ''
                }`}
              />
              <label htmlFor="remember" className={`text-muted-foreground ${getTitleClass('body')}`}>
                {isNeoBrutalism ? 'RECORDAR SESIÓN' : 'Recordar sesión'}
              </label>
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              variant="blue"
              size="lg"
              disabled={loading}
              className={getButtonClass()}
            >
              {loading ? (
                <span className={getTitleClass('body')}>
                  {isNeoBrutalism ? 'INICIANDO...' : 'Iniciando...'}
                </span>
              ) : (
                <>
                  <span className={getTitleClass('body')}>
                    {isNeoBrutalism ? 'INICIAR SESIÓN' : 'Iniciar Sesión'}
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Links adicionales */}
          <div className="mt-8 text-center space-y-4">
            <a 
              href="#" 
              className={`text-muted-foreground hover:text-foreground transition-colors ${getTitleClass('body')}`}
            >
              {isNeoBrutalism ? '¿OLVIDASTE TU CONTRASEÑA?' : '¿Olvidaste tu contraseña?'}
            </a>
            
            <div className={`pt-4 border-t text-muted-foreground ${
              isFluent ? '' : 'border-gray-200 dark:border-gray-700'
            }`} style={isFluent ? { borderColor: 'var(--fluent-neutral-grey-30)' } : {}}>
              <p className={getTitleClass('caption')}>
                {isNeoBrutalism ? '¿NO TIENES CUENTA?' : '¿No tienes cuenta?'}{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  {isNeoBrutalism ? 'REGISTRARSE' : 'Regístrate'}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-white/70 ${getTitleClass('caption')}`}>
            © 2024 ERP System. {isNeoBrutalism ? 'TODOS LOS DERECHOS RESERVADOS.' : 'Todos los derechos reservados.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
