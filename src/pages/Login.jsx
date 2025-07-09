/**
 * Página de Login con estilo Neo-Brutalista
 * Sistema de autenticación con formulario interactivo
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { login, loading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wide mb-2">
            Sistema ERP
          </h1>
          <p className="text-lg font-bold text-gray-600 uppercase tracking-wide">
            Acceso al Sistema
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
          {/* Error general */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-4 border-red-500 rounded-none">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-black text-red-800 uppercase text-sm mb-1">
                    Error de Autenticación
                  </h3>
                  <p className="font-bold text-red-700 text-sm leading-relaxed">
                    {error}
                  </p>
                  {error.includes('conexión') && (
                    <div className="mt-2 text-xs font-bold text-red-600">
                      <p>💡 Sugerencias:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Verifica que el servidor esté ejecutándose</li>
                        <li>Comprueba tu conexión a internet</li>
                        <li>Contacta al soporte técnico si persiste</li>
                      </ul>
                    </div>
                  )}
                  {error.includes('credenciales') && (
                    <div className="mt-2 text-xs font-bold text-red-600">
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
              <label className="block text-sm font-black uppercase tracking-wide mb-2">
                Email o Usuario
              </label>
              <div className="relative">
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="USUARIO@EMAIL.COM"
                  className={`pl-12 font-bold ${
                    formErrors.username ? 'border-red-500' : ''
                  }`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {formErrors.username && (
                <p className="mt-2 text-sm font-bold text-red-600 uppercase">
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-black uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`pl-12 pr-12 font-bold ${
                    formErrors.password ? 'border-red-500' : ''
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-2 text-sm font-bold text-red-600 uppercase">
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
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
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
            <div className="flex-1 border-t-4 border-black"></div>
            <span className="px-4 text-sm font-black uppercase tracking-wide">O</span>
            <div className="flex-1 border-t-4 border-black"></div>
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
          <div className="mt-4 p-4 bg-gray-50 border-4 border-black">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
              API Endpoint:
            </p>
            <p className="text-sm font-bold">POST localhost:5050/login</p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mt-2 mb-1">
              Request format:
            </p>
            <p className="text-sm font-bold">{"{ \"email\": \"user@email.com\", \"password\": \"pass\" }"}</p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mt-2 mb-1">
              Acepta email o username:
            </p>
            <p className="text-sm font-bold">demo@erp.com o demo | demo123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Sistema ERP © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
