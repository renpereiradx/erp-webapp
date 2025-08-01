/**
 * Layout principal del sistema ERP - Multi-tema
 * Soporte para Neo-Brutalism, Material Design y Fluent Design
 * Incluye sidebar responsive, navbar y área de contenido principal
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck,
  ShoppingCart, 
  BarChart3, 
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// TEMPORAL: Desactivamos useAuthStore
// import useAuthStore from '@/store/useAuthStore';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // TEMPORAL: Desactivamos la autenticación
  // const { user, logout } = useAuthStore();
  const user = { name: 'Demo User', email: 'demo@erp.com' }; // Usuario temporal
  const { theme } = useTheme();

  // Hook para detectar cuando estamos en el cliente (post-hidratación)
  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determinar los temas activos - Corregido para detección exacta
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Asegurar que el tema se aplique correctamente al DOM
  useEffect(() => {
    if (typeof window !== 'undefined' && theme) {
      const body = document.body;
      const html = document.documentElement;
      
      // Asegurar que el tema se aplique tanto al html como al body
      html.setAttribute('data-theme', theme);
      body.setAttribute('data-theme', theme);
      
      // console.log('🎨 Theme applied to DOM:', { 
      //   theme, 
      //   htmlTheme: html.getAttribute('data-theme'), 
      //   bodyTheme: body.getAttribute('data-theme'),
      //   isNeoBrutalist,
      //   isMaterial,
      //   isFluent
      // });
      
      // Verificar que las variables CSS están disponibles
      // const rootStyle = getComputedStyle(document.documentElement);
      // console.log('🔍 CSS Variables verification:', {
      //   theme,
      //   background: rootStyle.getPropertyValue('--background'),
      //   foreground: rootStyle.getPropertyValue('--foreground'),
      //   primary: rootStyle.getPropertyValue('--primary'),
      //   mdPrimary: rootStyle.getPropertyValue('--md-primary-main'),
      //   mdError: rootStyle.getPropertyValue('--md-error-main'),
      //   fluentPrimary: rootStyle.getPropertyValue('--fluent-brand-primary'),
      //   fluentDanger: rootStyle.getPropertyValue('--fluent-semantic-danger')
      // });
    }
  }, [theme, isNeoBrutalist, isMaterial, isFluent]);

  // ...existing code...

  // Debug log temporal (comentado para reducir ruido)
  // console.log('MainLayout Debug:', {
  //   isClient,
  //   isLargeScreen,
  //   windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'undefined',
  //   theme,
  //   sidebarShouldShow: isClient && isLargeScreen,
  //   buttonShouldShow: isClient && !isLargeScreen
  // });

  // Manejar logout - TEMPORAL: Desactivado
  const handleLogout = () => {
    // Logout temporalmente desactivado para development
  };

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalist) {
      switch(size) {
        case 'title': return 'font-black uppercase tracking-wide';
        case 'body': return 'font-bold uppercase tracking-wide';
        case 'caption': return 'font-bold uppercase tracking-wide text-sm';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluent) {
      switch(size) {
        case 'title': return 'fluent-title';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        default: return 'fluent-body';
      }
    }
    if (isMaterial) {
      switch(size) {
        case 'title': return 'material-headline-medium';
        case 'body': return 'material-body-medium';
        case 'caption': return 'material-body-small';
        default: return 'material-body-medium';
      }
    }
    return 'font-medium';
  };

  const getCardClass = () => {
    if (isNeoBrutalist) return 'border-4 border-foreground shadow-neo-brutal';
    if (isFluent) return 'fluent-elevation-2 fluent-radius-medium';
    if (isMaterial) return 'material-card-elevated';
    return 'border border-border rounded-lg shadow-lg';
  };

  const getButtonClass = () => {
    if (isFluent) return 'fluent-elevation-2 fluent-radius-small';
    if (isMaterial) return 'material-button-elevated';
    return '';
  };
  // Configuración de navegación
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      color: 'lime',
      badge: '1'
    },
    { 
      name: 'Productos', 
      href: '/productos', 
      icon: Package, 
      color: 'blue',
      badge: '2'
    },
    { 
      name: 'Clientes', 
      href: '/clientes', 
      icon: Users, 
      color: 'orange',
      badge: '3'
    },
    { 
      name: 'Proveedores', 
      href: '/proveedores', 
      icon: Truck, 
      color: 'teal',
      badge: '4'
    },
    { 
      name: 'Pedidos', 
      href: '/pedidos', 
      icon: ShoppingCart, 
      color: 'purple',
      badge: '5'
    },
    { 
      name: 'Reportes', 
      href: '/reportes', 
      icon: BarChart3, 
      color: 'green',
      badge: '6'
    },
    { 
      name: 'Configuración', 
      href: '/configuracion', 
      icon: Settings, 
      color: 'pink',
      badge: '7'
    },
  ];

  const isActive = (href) => location.pathname === href;

  // Aplicar estilos condicionales según el tema
  const getLayoutStyles = () => {
    if (isNeoBrutalist) {
      return {
        fontFamily: 'var(--font-sans)',
        fontWeight: 'bold'
      };
    }
    return {
      fontFamily: 'var(--font-sans)'
    };
  };

  const getSidebarStyles = () => {
    if (isNeoBrutalist) {
      return {
        backgroundColor: 'var(--background)', 
        borderRight: '4px solid var(--border)',
        boxShadow: '4px 0px 0px 0px rgba(0,0,0,1)'
      };
    }
    if (isFluent) {
      return {
        backgroundColor: 'var(--fluent-surface-primary)', 
        borderRight: '1px solid var(--fluent-neutral-grey-30)',
        boxShadow: 'var(--fluent-elevation-4)'
      };
    }
    if (isMaterial) {
      return {
        backgroundColor: 'var(--material-surface)', 
        borderRight: '1px solid var(--material-outline)',
        boxShadow: 'var(--material-elevation-2)'
      };
    }
    return {
      backgroundColor: 'var(--background)', 
      borderRight: 'var(--border-width, 1px) solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    };
  };

  const getNavItemStyles = (active, item) => {
    if (isNeoBrutalist) {
      return {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        backgroundColor: active ? `var(--brutalist-${item?.color || 'blue'})` : 'var(--card)',
        color: active ? '#000000' : 'var(--foreground)',
        boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        transition: 'all 150ms ease',
        ':hover': {
          boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)',
          transform: 'translate(1px, 1px)'
        }
      };
    }
    if (isFluent) {
      return {
        backgroundColor: active ? 'var(--fluent-brand-primary)' : 'transparent',
        color: active ? 'white' : 'var(--fluent-text-primary)',
        borderRadius: 'var(--fluent-radius-small)',
        boxShadow: active ? 'var(--fluent-elevation-2)' : 'none',
        transition: 'all var(--fluent-duration-normal) var(--fluent-curve-easy-ease)',
        ':hover': {
          backgroundColor: active ? 'var(--fluent-brand-primary-hover)' : 'var(--fluent-surface-secondary)'
        }
      };
    }
    if (isMaterial) {
      return {
        backgroundColor: active ? 'var(--material-primary)' : 'transparent',
        color: active ? 'var(--material-on-primary)' : 'var(--material-on-surface)',
        borderRadius: 'var(--material-radius-medium)',
        transition: 'all 200ms ease',
        ':hover': {
          backgroundColor: active ? 'var(--material-primary-hover)' : 'var(--material-surface-variant)'
        }
      };
    }
    return {
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? 'var(--accent-foreground)' : 'var(--foreground)',
      transition: 'colors 200ms ease'
    };
  };

  // Helper function para obtener colores de badges según el tema
  const getBadgeColors = (type = 'notification') => {
    // console.log('🎨 getBadgeColors called:', { theme, type, isNeoBrutalist, isMaterial, isFluent });
    
    if (isNeoBrutalist) {
      return {
        notification: {
          backgroundColor: 'var(--brutalist-red)',
          color: '#000000'
        },
        profile: {
          backgroundColor: 'var(--brutalist-green)',
          color: '#000000'
        }
      };
    } else if (isMaterial) {
      return {
        notification: {
          backgroundColor: 'var(--md-error-main, #B00020)',
          color: 'var(--md-on-error, #FFFFFF)'
        },
        profile: {
          backgroundColor: 'var(--md-secondary-main, #03DAC6)',
          color: 'var(--md-on-secondary, #000000)'
        }
      };
    } else if (isFluent) {
      return {
        notification: {
          backgroundColor: 'var(--fluent-semantic-danger, #D13438)',
          color: '#FFFFFF'
        },
        profile: {
          backgroundColor: 'var(--fluent-brand-primary, #0078D4)',
          color: '#FFFFFF'
        }
      };
    } else {
      // Default theme fallback
      return {
        notification: {
          backgroundColor: 'var(--destructive, #ef4444)',
          color: 'var(--destructive-foreground, #ffffff)'
        },
        profile: {
          backgroundColor: 'var(--accent, #0078d4)',
          color: 'var(--accent-foreground, #ffffff)'
        }
      };
    }
  };

  // Helper function para obtener estilos base de badges
  const getBaseBadgeStyles = (type = 'notification') => {
    const colors = getBadgeColors(type);
    // console.log('🎯 getBaseBadgeStyles called:', { type, colors, theme });
    
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      minWidth: '20px',
      width: '20px',
      height: '20px',
      fontSize: '11px',
      lineHeight: '1',
      fontWeight: isNeoBrutalist ? 900 : isMaterial ? 500 : isFluent ? 600 : 700,
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      visibility: 'visible',
      opacity: '1',
      zIndex: 20,
      padding: '0',
      pointerEvents: 'none',
      ...colors[type]
    };

    if (isNeoBrutalist) {
      return {
        ...baseStyles,
        border: '2px solid #000000',
        boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
        borderRadius: '0px',
        minWidth: '22px',
        width: '22px',
        height: '22px'
      };
    } else if (isMaterial) {
      return {
        ...baseStyles,
        borderRadius: '50%',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
        border: 'none'
      };
    } else if (isFluent) {
      return {
        ...baseStyles,
        borderRadius: '50%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none'
      };
    } else {
      return {
        ...baseStyles,
        borderRadius: '50%',
        border: 'none'
      };
    }
  };

  return (
    <div className="erp-main-layout flex min-h-screen" style={{ backgroundColor: 'var(--muted, #f9fafb)', ...getLayoutStyles() }} data-component="main-layout" data-testid="main-layout">
      {/* Sidebar Desktop - Fixed sidebar */}
      <div 
        className={`erp-sidebar-desktop fixed inset-y-0 left-0 z-30 w-72 ${!isClient ? 'hidden lg:block' : ''}`}
        style={{ 
          display: isClient ? (isLargeScreen ? 'block' : 'none') : undefined
        }}
        data-component="sidebar-desktop" 
        data-testid="sidebar-desktop"
      >
        <div className="erp-sidebar-content h-full flex flex-col overflow-y-auto"
             style={getSidebarStyles()} data-component="sidebar-content" data-testid="sidebar-content">
          {/* Logo */}
          <div className="erp-sidebar-logo flex items-center flex-shrink-0 px-6 py-6"
               style={{ 
                 borderBottom: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)'
               }}
               data-component="sidebar-logo" data-testid="sidebar-logo">
            <div className="erp-logo-content flex items-center space-x-3" data-component="logo-content" data-testid="logo-content">
              <div className="erp-logo-icon w-10 h-10 flex items-center justify-center rounded-md"
                   style={{ 
                     backgroundColor: 'var(--primary)', 
                     color: 'var(--primary-foreground)',
                     border: isNeoBrutalist ? '2px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                     boxShadow: isNeoBrutalist ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none'
                   }}>
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div className="erp-logo-text">
                <h1 className={`erp-logo-title text-xl ${getTitleClass('title')}`}
                    style={{ color: 'var(--foreground)' }}
                    data-testid="logo-title">
                  ERP System
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`erp-sidebar-nav mt-6 flex-1 px-4 ${isNeoBrutalist ? 'space-y-3' : 'space-y-2'}`} data-component="sidebar-nav" data-testid="sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const navStyles = getNavItemStyles(active, item);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`erp-nav-item group flex items-center px-4 py-3 text-sm ${getTitleClass('body')} ${isNeoBrutalist ? '' : isFluent ? 'fluent-radius-small' : 'rounded-md'} transition-all duration-200`}
                  style={navStyles}
                  data-component="nav-item" 
                  data-testid={`nav-item-${item.name.toLowerCase()}`}
                  data-active={active}
                  onMouseEnter={(e) => {
                    if (!active && !isNeoBrutalist) {
                      e.target.style.backgroundColor = 'var(--accent)';
                      e.target.style.color = 'var(--accent-foreground)';
                    } else if (isNeoBrutalist) {
                      e.target.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)';
                      e.target.style.transform = 'translate(1px, 1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active && !isNeoBrutalist) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'var(--foreground)';
                    } else if (isNeoBrutalist) {
                      e.target.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)';
                      e.target.style.transform = 'translate(0px, 0px)';
                    }
                  }}
                >
                  <Icon className="erp-nav-icon mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="erp-nav-text flex-1">{item.name}</span>
                  {isNeoBrutalist ? (
                    <span className={`erp-nav-badge ml-2 px-2 py-1 text-xs font-black border-2 border-black`}
                          style={{ 
                            backgroundColor: `var(--brutalist-${item.color})`,
                            boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)'
                          }}
                          data-testid={`nav-badge-${item.name.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  ) : (
                    <span className="erp-nav-badge ml-2 px-2 py-1 text-xs font-medium rounded-full"
                          style={{ 
                            backgroundColor: 'var(--muted)', 
                            color: 'var(--muted-foreground)' 
                          }}
                          data-testid={`nav-badge-${item.name.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Upgrade Section */}
          <div className="flex-shrink-0 p-4">
            <div className={`p-4 ${isNeoBrutalist ? '' : 'rounded-lg'}`}
                 style={{ 
                   backgroundColor: 'var(--card)', 
                   border: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                   boxShadow: isNeoBrutalist ? '4px 4px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)'
                 }}>
              <h3 className={`text-sm ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-semibold'} mb-2`}
                  style={{ color: 'var(--foreground)' }}>
                Upgrade to Pro
              </h3>
              <p className={`text-xs mb-4 ${isNeoBrutalist ? 'font-bold uppercase tracking-wide' : ''}`}
                 style={{ color: 'var(--muted-foreground)' }}>
                Are you looking for more features? Check out our Pro version.
              </p>
              <Button variant={isNeoBrutalist ? "red" : "default"} size="sm" className="w-full">
                <span className="mr-2">→</span>
                Upgrade Now
                {isNeoBrutalist && (
                  <span className="ml-2 px-2 py-1 text-xs font-black border-2 border-black bg-yellow-400">
                    22
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full"
               style={{ 
                 backgroundColor: 'var(--background)',
                 borderRight: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                 boxShadow: isNeoBrutalist ? '4px 0px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)'
               }}>
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className={`text-white ${isNeoBrutalist ? 'border-2 border-white' : ''}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile sidebar content - same as desktop */}
            <div className="flex flex-col flex-grow overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-6 py-6"
                   style={{ 
                     borderBottom: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)'
                   }}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md"
                       style={{ 
                         backgroundColor: 'var(--primary)', 
                         color: 'var(--primary-foreground)',
                         border: isNeoBrutalist ? '2px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                         boxShadow: isNeoBrutalist ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none'
                       }}>
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className={`text-xl ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-bold'}`}
                        style={{ color: 'var(--foreground)' }}>
                      ERP System
                    </h1>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className={`mt-6 flex-1 px-4 ${isNeoBrutalist ? 'space-y-3' : 'space-y-2'}`}>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const navStyles = getNavItemStyles(active, item);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'} ${isNeoBrutalist ? '' : 'rounded-md'} transition-all duration-200`}
                      style={navStyles}
                      onMouseEnter={(e) => {
                        if (!active && !isNeoBrutalist) {
                          e.target.style.backgroundColor = 'var(--accent)';
                          e.target.style.color = 'var(--accent-foreground)';
                        } else if (isNeoBrutalist) {
                          e.target.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)';
                          e.target.style.transform = 'translate(1px, 1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active && !isNeoBrutalist) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--foreground)';
                        } else if (isNeoBrutalist) {
                          e.target.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)';
                          e.target.style.transform = 'translate(0px, 0px)';
                        }
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {isNeoBrutalist ? (
                        <span className={`ml-2 px-2 py-1 text-xs font-black border-2 border-black`}
                              style={{ 
                                backgroundColor: `var(--brutalist-${item.color})`,
                                boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)'
                              }}>
                          {item.badge}
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: 'var(--muted)', 
                                color: 'var(--muted-foreground)' 
                              }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className={`erp-main-content flex flex-col min-h-screen ${!isClient ? 'lg:ml-72' : ''}`}
        style={{
          marginLeft: isClient ? ((isLargeScreen) ? '288px' : '0px') : undefined, // 288px = w-72
          width: isClient ? ((isLargeScreen) ? 'calc(100vw - 288px)' : '100vw') : undefined,
          maxWidth: isClient ? ((isLargeScreen) ? 'calc(100vw - 288px)' : '100vw') : undefined
        }}
        data-component="main-content" 
        data-testid="main-content"
      >
        {/* Top navbar */}
        <div className="erp-navbar sticky top-0 z-10 flex-shrink-0 flex h-20 w-full" 
             style={{ 
               backgroundColor: 'var(--background)', 
               borderBottom: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
               boxShadow: isNeoBrutalist ? '0px 4px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)',
               color: 'var(--foreground)',
               maxWidth: '100%'
             }}
             data-component="navbar" data-testid="navbar">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className={`erp-mobile-menu-btn px-4 ${!isClient ? 'lg:hidden' : ''}`}
            style={{ 
              borderRight: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
              color: 'var(--foreground)',
              display: isClient ? (!isLargeScreen ? 'flex' : 'none') : undefined,
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px'
            }}
            data-testid="mobile-menu-btn"
            data-component="mobile-menu-btn"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="erp-navbar-content flex-1 px-4 flex justify-between items-center" data-component="navbar-content" data-testid="navbar-content">
            {/* Search */}
            <div className="erp-search-section flex-1 flex justify-center lg:ml-6 lg:mr-6" data-component="search-section" data-testid="search-section">
              <div className="erp-search-container max-w-lg w-full lg:max-w-xs" data-component="search-container" data-testid="search-container">
                <Input
                  placeholder="Buscar productos, clientes..."
                  leftIcon={<Search className="h-5 w-5" />}
                  className="erp-search-input w-full"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="erp-navbar-actions ml-4 flex items-center md:ml-6 space-x-4" 
                 style={{ overflow: 'visible' }}
                 data-component="navbar-actions" 
                 data-testid="navbar-actions">
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="erp-notifications-btn relative" 
                style={{ 
                  overflow: 'visible', 
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  minHeight: '48px'
                }}
                data-testid="notifications-btn">
                <Bell className="h-6 w-6" />
                <span style={getBaseBadgeStyles('notification')} data-testid="notification-badge">
                  3
                </span>
              </Button>

              {/* Profile Menu */}
              <div className="erp-profile-menu relative" 
                   style={{ overflow: 'visible' }}
                   data-component="profile-menu" 
                   data-testid="profile-menu">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="erp-profile-btn relative"
                  style={{ 
                    overflow: 'visible', 
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    minWidth: '48px',
                    minHeight: '48px'
                  }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  data-testid="profile-btn"
                >
                  <User className="h-6 w-6" />
                  <span style={getBaseBadgeStyles('profile')}>
                    1
                  </span>
                </Button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-72 z-50 ${isNeoBrutalist ? '' : 'rounded-lg'}`}
                       style={{ 
                         backgroundColor: 'var(--popover)', 
                         border: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                         boxShadow: isNeoBrutalist ? '8px 8px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)'
                       }}>
                    {/* User Info */}
                    <div className="p-4"
                         style={{ 
                           borderBottom: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)'
                         }}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 flex items-center justify-center ${isNeoBrutalist ? '' : 'rounded-full'}`}
                             style={{ 
                               backgroundColor: 'var(--primary)', 
                               color: 'var(--primary-foreground)',
                               border: isNeoBrutalist ? '4px solid var(--border)' : 'none'
                             }}>
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-sm ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-semibold'}`}
                             style={{ color: 'var(--foreground)' }}>
                            {user?.name || 'Usuario Demo'}
                          </p>
                          <p className={`text-xs ${isNeoBrutalist ? 'font-bold' : ''}`}
                             style={{ color: 'var(--muted-foreground)' }}>
                            {user?.email || user?.username || 'demo@erp.com'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to="/configuracion"
                        className={`flex items-center w-full px-4 py-3 text-sm ${isNeoBrutalist ? 'font-bold' : 'font-medium'} text-left transition-colors ${isNeoBrutalist ? '' : 'rounded-md'}`}
                        style={{ color: 'var(--foreground)' }}
                        onClick={() => setShowUserMenu(false)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = isNeoBrutalist ? 'var(--muted)' : 'var(--accent)';
                          e.target.style.color = isNeoBrutalist ? 'var(--foreground)' : 'var(--accent-foreground)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--foreground)';
                        }}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        {isNeoBrutalist ? 'CONFIGURACIÓN' : 'Configuración'}
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 text-sm ${isNeoBrutalist ? 'font-bold' : 'font-medium'} text-left transition-colors ${isNeoBrutalist ? '' : 'rounded-md'}`}
                        style={{ color: 'var(--destructive)' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--destructive)';
                          e.target.style.color = 'var(--destructive-foreground)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--destructive)';
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isNeoBrutalist ? 'CERRAR SESIÓN' : 'Cerrar Sesión'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Overlay for user menu */}
          {showUserMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowUserMenu(false)}
            />
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none w-full" style={{ minHeight: '100vh', maxWidth: '100%' }}>
          <div className="py-8 px-6 lg:px-8 w-full max-w-full" style={{ minHeight: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

