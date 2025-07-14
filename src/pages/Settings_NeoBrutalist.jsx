/**
 * Página Settings optimizada para Neo-Brutalism
 * Panel de configuración con estilo brutal y controles interactivos
 * Incluye helper functions específicas para estilo Neo-Brutalist
 */

import React from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import MaterialDesignShowcase from '../components/MaterialDesignShowcase';
import { useTheme } from 'next-themes';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Monitor, 
  Smartphone, 
  Globe, 
  Bell, 
  Shield, 
  Database,
  Zap,
  Users,
  Save,
  RotateCcw
} from 'lucide-react';

const Settings = () => {
  const { theme } = useTheme();
  const isMaterial = theme?.includes('material');
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isFluent = theme?.includes('fluent');

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistCardStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 200ms ease',
    overflow: 'hidden'
  });

  const getBrutalistHeaderStyles = (colorVar = '--brutalist-lime') => ({
    background: `var(${colorVar})`,
    color: colorVar === '--brutalist-lime' ? '#000000' : '#ffffff',
    padding: '20px',
    border: 'none',
    borderBottom: '4px solid var(--border)',
    margin: '-1px -1px 0 -1px'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
      },
      heading: {
        fontSize: '1.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
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

  const getBrutalistButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
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

  const getBrutalistSwitchStyles = () => ({
    appearance: 'none',
    width: '60px',
    height: '30px',
    background: 'var(--background)',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
  });

  const getBrutalistSelectStyles = () => ({
    background: 'var(--background)',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    textTransform: 'uppercase',
    cursor: 'pointer'
  });

  const handleCardHover = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(-3px, -3px)';
      e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleCardLeave = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Neo-Brutalist */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getBrutalistTypography('title')}
          >
            CONFIGURACIÓN
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto"
            style={getBrutalistTypography('base')}
          >
            PERSONALIZA LA APARIENCIA Y FUNCIONALIDAD DE TU APLICACIÓN ERP
          </p>
        </header>

        {/* Grid de configuraciones */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Tema de Apariencia */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-purple')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-lime')}>
                  <Palette className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    TEMA DE APARIENCIA
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    SELECCIONA EL ESTILO VISUAL
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p 
                className="text-foreground mb-6"
                style={getBrutalistTypography('base')}
              >
                CADA TEMA INCLUYE VARIANTES CLARAS Y OSCURAS CON DISEÑOS ÚNICOS.
              </p>
              <ThemeSwitcher />
            </div>
          </div>

          {/* Configuración de Pantalla */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-blue')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-orange')}>
                  <Monitor className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    CONFIGURACIÓN PANTALLA
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    AJUSTES DE VISUALIZACIÓN
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    PANTALLA COMPLETA
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    EXPANDIR A TODA LA PANTALLA
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    SIDEBAR COMPACTO
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    MENÚ LATERAL REDUCIDO
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div>
                <label style={getBrutalistTypography('subheading')} className="block mb-3">
                  RESOLUCIÓN
                </label>
                <select style={getBrutalistSelectStyles()} className="w-full">
                  <option>AUTO (RECOMENDADO)</option>
                  <option>1920X1080</option>
                  <option>2560X1440</option>
                  <option>3840X2160</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-orange')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-pink')}>
                  <Bell className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    NOTIFICACIONES
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    GESTIONA TUS ALERTAS
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    VENTAS
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    ALERTAS DE NUEVAS VENTAS
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    STOCK BAJO
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    ALERTAS DE INVENTARIO
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    CLIENTES NUEVOS
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    REGISTROS DE USUARIOS
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div>
                <label style={getBrutalistTypography('subheading')} className="block mb-3">
                  FRECUENCIA
                </label>
                <select style={getBrutalistSelectStyles()} className="w-full">
                  <option>INMEDIATO</option>
                  <option>CADA 5 MINUTOS</option>
                  <option>CADA HORA</option>
                  <option>DIARIO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-pink')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-green')}>
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    SEGURIDAD
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    PROTECCIÓN Y PRIVACIDAD
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    AUTENTICACIÓN 2FA
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    VERIFICACIÓN EN DOS PASOS
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    SESIÓN AUTOMÁTICA
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    CERRAR SESIÓN AUTOMÁTICAMENTE
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div>
                <label style={getBrutalistTypography('subheading')} className="block mb-3">
                  TIEMPO LÍMITE
                </label>
                <select style={getBrutalistSelectStyles()} className="w-full">
                  <option>30 MINUTOS</option>
                  <option>1 HORA</option>
                  <option>4 HORAS</option>
                  <option>SIN LÍMITE</option>
                </select>
              </div>

              <button
                style={getBrutalistButtonStyles('secondary')}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
                className="w-full"
              >
                <Shield className="w-5 h-5 mr-2" />
                CAMBIAR CONTRASEÑA
              </button>
            </div>
          </div>

          {/* Rendimiento */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-green')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-blue')}>
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    RENDIMIENTO
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    OPTIMIZACIÓN DEL SISTEMA
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    CARGA RÁPIDA
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    OPTIMIZAR VELOCIDAD
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    CACHE LOCAL
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    ALMACENAMIENTO TEMPORAL
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div>
                <label style={getBrutalistTypography('subheading')} className="block mb-3">
                  CALIDAD GRÁFICOS
                </label>
                <select style={getBrutalistSelectStyles()} className="w-full">
                  <option>ULTRA (RECOMENDADO)</option>
                  <option>ALTO</option>
                  <option>MEDIO</option>
                  <option>BÁSICO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Datos y Backup */}
          <div 
            className="cursor-pointer"
            style={getBrutalistCardStyles()}
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-lime')}>
              <div className="flex items-center gap-4">
                <div style={getBrutalistIconStyles('--brutalist-purple')}>
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h2 style={getBrutalistTypography('heading')}>
                    DATOS Y BACKUP
                  </h2>
                  <p style={getBrutalistTypography('base')}>
                    GESTIÓN DE INFORMACIÓN
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={getBrutalistTypography('subheading')}>
                    BACKUP AUTOMÁTICO
                  </h3>
                  <p style={getBrutalistTypography('small')} className="text-muted-foreground">
                    RESPALDOS PERIÓDICOS
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked
                  style={getBrutalistSwitchStyles()}
                />
              </div>

              <div>
                <label style={getBrutalistTypography('subheading')} className="block mb-3">
                  FRECUENCIA BACKUP
                </label>
                <select style={getBrutalistSelectStyles()} className="w-full">
                  <option>DIARIO</option>
                  <option>SEMANAL</option>
                  <option>MENSUAL</option>
                  <option>MANUAL</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  style={getBrutalistButtonStyles('primary')}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <Database className="w-5 h-5 mr-2" />
                  BACKUP AHORA
                </button>
                <button
                  style={getBrutalistButtonStyles('secondary')}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  RESTAURAR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Material Design Showcase - Solo visible cuando el tema Material está activo */}
        {isMaterial && (
          <div 
            className="mt-8"
            style={getBrutalistCardStyles()}
          >
            <div style={getBrutalistHeaderStyles('--brutalist-blue')}>
              <h2 style={getBrutalistTypography('heading')}>
                MATERIAL DESIGN SHOWCASE
              </h2>
            </div>
            <div className="p-6">
              <MaterialDesignShowcase />
            </div>
          </div>
        )}

        {/* Botones de acción global */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getBrutalistButtonStyles('primary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Save className="w-5 h-5 mr-2" />
              GUARDAR CONFIGURACIÓN
            </button>
            <button
              style={getBrutalistButtonStyles('secondary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              RESTAURAR DEFAULTS
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Settings;
