/**
 * Layout principal del sistema ERP - Multi-tema
 * Soporte para Neo-Brutalism, Material Design y Fluent Design
 * Incluye sidebar responsive, navbar y área de contenido principal
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck,
  ShoppingCart,
  ShoppingBag,
  Calendar,
  Clock,
  BarChart3, 
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  CreditCard,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// TEMPORAL: Desactivamos useAuthStore
// import useAuthStore from '@/store/useAuthStore';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const profileBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0, width: 288 });

  useEffect(() => {
    const calcPos = () => {
      if (!profileBtnRef.current) return;
      const rect = profileBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
        width: 288
      });
    };
    if (showUserMenu) {
      calcPos();
      window.addEventListener('resize', calcPos);
      window.addEventListener('scroll', calcPos, true);
    }
    return () => {
      window.removeEventListener('resize', calcPos);
      window.removeEventListener('scroll', calcPos, true);
    };
  }, [showUserMenu]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // TEMPORAL: Desactivamos la autenticación
  // const { user, logout } = useAuthStore();
  const user = { name: 'Demo User', email: 'demo@erp.com' }; // Usuario temporal
  // Usar Context para temas (compatible con React 19)
  const { theme, isNeoBrutalism, isMaterial, isFluent } = useTheme();
  
  // Obtener valores computados de las funciones helper
  const isNeoBrutalismValue = isNeoBrutalism();
  const isMaterialValue = isMaterial();
  const isFluentValue = isFluent();
  
  // Sistema centralizado de estilos - Computa TODOS los estilos necesarios
  const computedStyles = useMemo(() => {
    const neo = isNeoBrutalismValue;
    const material = isMaterialValue;
    const fluent = isFluentValue;
    
    return {
      // Estilos de layout principal
      layout: {
        backgroundColor: 'var(--muted, #f9fafb)',
        fontFamily: 'var(--font-sans)',
        fontWeight: neo ? 'bold' : 'normal'
      },
      
      // Estilos de sidebar desktop y mobile
      sidebar: {
        backgroundColor: neo ? 'var(--background)' : fluent ? 'var(--fluent-surface-primary)' : material ? 'var(--material-surface)' : 'var(--background)',
        borderRight: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '4px 0px 0px 0px rgba(0,0,0,1)' : fluent ? 'var(--fluent-elevation-4)' : material ? 'var(--material-elevation-2)' : 'var(--shadow-sm)'
      },
      
      // Estilos específicos para mobile sidebar
      sidebarMobile: {
        backgroundColor: 'var(--background)',
        borderRight: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '4px 0px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)'
      },
      
      // Estilos de logo (ambas versiones)
      logoContainer: {
        borderBottom: neo ? '4px solid var(--border)' : '1px solid var(--border)'
      },
      
      logoIcon: {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: neo ? '2px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none'
      },
      
      // Estilos de upgrade section
      upgradeCard: {
        backgroundColor: 'var(--card)',
        border: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '4px 4px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)'
      },
      
      // Estilos de navbar
      navbar: {
        backgroundColor: 'var(--background)',
        borderBottom: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '0px 4px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)',
        color: 'var(--foreground)',
        maxWidth: '100%'
      },
      
      // Estilos de botón móvil
      mobileMenuBtn: {
        borderRight: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        color: 'var(--foreground)',
        display: 'flex',
        width: '48px',
        height: '48px',
        minWidth: '48px',
        minHeight: '48px'
      },
      
      // Estilos de close button mobile
      mobileCloseBtn: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        border: neo ? '2px solid white' : 'none'
      },
      
      // Estilos de dropdown menu
      dropdownMenu: {
        backgroundColor: 'var(--popover)',
        border: neo ? '4px solid var(--border)' : '1px solid var(--border)',
        boxShadow: neo ? '8px 8px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)'
      },
      
      dropdownHeader: {
        borderBottom: neo ? '4px solid var(--border)' : '1px solid var(--border)'
      },
      
      userAvatar: {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: neo ? '4px solid var(--border)' : 'none'
      },
      
      // Clases CSS
      css: {
        navSpacing: neo ? 'space-y-2' : 'space-y-1',
        titleClass: neo ? 'font-black uppercase tracking-wide' : fluent ? 'fluent-title' : material ? 'material-headline-medium' : 'font-medium',
        bodyClass: neo ? 'font-bold uppercase tracking-wide' : fluent ? 'fluent-body' : material ? 'material-body-medium' : 'font-medium',
        captionClass: neo ? 'font-bold uppercase tracking-wide text-sm' : fluent ? 'fluent-caption' : material ? 'material-body-small' : 'font-medium',
        cardClass: neo ? 'border-4 border-foreground shadow-neo-brutal' : fluent ? 'fluent-elevation-2 fluent-radius-medium' : material ? 'material-card-elevated' : 'border border-border rounded-lg shadow-lg',
        buttonClass: fluent ? 'fluent-elevation-2 fluent-radius-small' : material ? 'material-button-elevated' : '',
        cardRadius: neo ? '' : fluent ? 'fluent-radius-medium' : 'rounded-lg',
        navItemRadius: neo ? '' : fluent ? 'fluent-radius-small' : 'rounded-md',
        avatarRadius: neo ? '' : 'rounded-full',
        semiboldClass: neo ? 'font-black uppercase tracking-wide' : 'font-semibold',
        mediumClass: neo ? 'font-black uppercase tracking-wide' : 'font-medium',
        boldClass: neo ? 'font-bold uppercase tracking-wide' : '',
        textWhite: neo ? 'border-2 border-white' : ''
      },
      
      // Valores para badges y otros elementos
      values: {
        fontWeight: neo ? 900 : material ? 500 : fluent ? 600 : 700,
        buttonVariant: neo ? 'red' : 'default',
        configText: neo ? 'CONFIGURACIÓN' : 'Configuración',
        logoutText: neo ? 'CERRAR SESIÓN' : 'Cerrar Sesión'
      },
      
      // Función para obtener estilos de navegación
      getNavItemStyles: (active, item) => {
        if (neo) {
          return {
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'var(--border)',
            backgroundColor: active ? `var(--brutalist-${item?.color || 'blue'})` : 'transparent',
            color: active ? '#000000' : 'var(--foreground)',
            boxShadow: active ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            transition: 'all 150ms ease'
          };
        }
        if (fluent) {
          return {
            backgroundColor: active ? 'var(--fluent-brand-primary, #0078d4)' : 'transparent',
            color: active ? '#ffffff' : 'var(--foreground)',
            borderRadius: 'var(--fluent-radius-small, 4px)',
            boxShadow: active ? 'var(--fluent-elevation-2, 0 2px 4px rgba(0,0,0,0.14))' : 'none',
            transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)'
          };
        }
        if (material) {
          return {
            backgroundColor: active ? 'var(--md-primary)' : 'transparent',
            color: active ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
            borderRadius: 'var(--md-shape-corner-small)',
            transition: 'all var(--md-motion-duration-short4) var(--md-motion-easing-standard)'
          };
        }
        return {
          backgroundColor: active ? 'var(--accent)' : 'transparent',
          color: active ? 'var(--accent-foreground)' : 'var(--foreground)',
          transition: 'colors 200ms ease'
        };
      },
      
      // Función para obtener estilos de hover usando tokens del sistema de diseño
      getNavItemHoverStyles: (theme) => {
        if (theme === 'neo') {
          return {
            backgroundColor: 'var(--muted)',
            color: 'var(--foreground)',
            boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)',
            transform: 'translate(1px, 1px)',
            transition: 'all 150ms ease'
          };
        }
        if (theme === 'fluent') {
          return {
            backgroundColor: 'var(--fluent-neutral-grey-14, rgba(0,0,0,0.06))',
            color: 'var(--foreground)',
            borderRadius: 'var(--fluent-radius-small, 4px)',
            transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)'
          };
        }
        if (theme === 'material') {
          return {
            backgroundColor: 'var(--md-on-surface-hover)',
            color: 'var(--md-on-surface)',
            borderRadius: 'var(--md-shape-corner-small)',
            transition: 'all var(--md-motion-duration-short4) var(--md-motion-easing-standard)'
          };
        }
        return {
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)',
          transition: 'all 200ms ease'
        };
      },
      
      // Función para obtener colores de badges
      getBadgeColors: (type = 'notification') => {
        if (neo) {
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
        } else if (material) {
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
        } else if (fluent) {
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
      },
      
      // Función para obtener estilos base de badges
      getBaseBadgeStyles: (type = 'notification') => {
        const colors = neo ? {
          notification: { backgroundColor: 'var(--brutalist-red)', color: '#000000' },
          profile: { backgroundColor: 'var(--brutalist-green)', color: '#000000' }
        } : material ? {
          notification: { backgroundColor: 'var(--md-error-main, #B00020)', color: 'var(--md-on-error, #FFFFFF)' },
          profile: { backgroundColor: 'var(--md-secondary-main, #03DAC6)', color: 'var(--md-on-secondary, #000000)' }
        } : fluent ? {
          notification: { backgroundColor: 'var(--fluent-semantic-danger, #D13438)', color: '#FFFFFF' },
          profile: { backgroundColor: 'var(--fluent-brand-primary, #0078D4)', color: '#FFFFFF' }
        } : {
          notification: { backgroundColor: 'var(--destructive, #ef4444)', color: 'var(--destructive-foreground, #ffffff)' },
          profile: { backgroundColor: 'var(--accent, #0078d4)', color: 'var(--accent-foreground, #ffffff)' }
        };
        
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
          fontWeight: neo ? 900 : material ? 500 : fluent ? 600 : 700,
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

        if (neo) {
          return {
            ...baseStyles,
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
            borderRadius: '0px',
            minWidth: '22px',
            width: '22px',
            height: '22px'
          };
        } else if (material) {
          return {
            ...baseStyles,
            borderRadius: '50%',
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
            border: 'none'
          };
        } else if (fluent) {
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
      }
    };
  }, [isNeoBrutalismValue, isMaterialValue, isFluentValue]);

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

  // Asegurar que el tema se aplique correctamente al DOM
  useEffect(() => {
    if (typeof window !== 'undefined' && theme) {
      const body = document.body;
      const html = document.documentElement;
      
      // Asegurar que el tema se aplique tanto al html como al body
      html.setAttribute('data-theme', theme);
      body.setAttribute('data-theme', theme);
      
    }
  }, [theme]);

  // ...existing code...


  // Manejar logout - TEMPORAL: Desactivado
  const handleLogout = () => {
    // Logout temporalmente desactivado para development
  };

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalism) {
      switch(size) {
        case 'title': return 'font-black uppercase tracking-wide';
        case 'body': return 'font-bold uppercase tracking-wide';
        case 'caption': return 'font-bold uppercase tracking-wide text-sm';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluentValue) {
      switch(size) {
        case 'title': return 'fluent-title';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        default: return 'fluent-body';
      }
    }
    if (isMaterialValue) {
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
    if (isNeoBrutalismValue) return 'border-4 border-foreground shadow-neo-brutal';
    if (isFluentValue) return 'fluent-elevation-2 fluent-radius-medium';
    if (isMaterialValue) return 'material-card-elevated';
    return 'border border-border rounded-lg shadow-lg';
  };

  const getButtonClass = () => {
    if (isFluentValue) return 'fluent-elevation-2 fluent-radius-small';
    if (isMaterialValue) return 'material-button-elevated';
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
      name: 'Ventas', 
      href: '/ventas', 
      icon: ShoppingCart, 
      color: 'green',
      badge: '5'
    },
    { 
      name: 'Reservas', 
      href: '/reservas', 
      icon: Calendar, 
      color: 'purple',
      badge: '6'
    },
    { 
      name: 'Inventario', 
      href: '/inventario', 
      icon: Package, 
      color: 'purple',
      badge: '7'
    },
    { 
      name: 'Compras', 
      href: '/compras', 
      icon: ShoppingBag, 
      color: 'indigo',
      badge: '8'
    },
    { 
      name: 'Caja Registradora', 
      href: '/caja-registradora', 
      icon: DollarSign, 
      color: 'green',
      badge: '9'
    },
    { 
      name: 'Pagos Compras', 
      href: '/pagos-compras', 
      icon: CreditCard, 
      color: 'blue',
      badge: '10'
    },
    { 
      name: 'Pagos Ventas', 
      href: '/pagos-ventas', 
      icon: Receipt, 
      color: 'emerald',
      badge: '11'
    },
    { 
      name: 'Reportes', 
      href: '/reportes', 
      icon: BarChart3, 
      color: 'green',
      badge: '12'
    },
  ];

  const isActive = (href) => location.pathname === href;

  // Aplicar estilos condicionales según el tema
  const getLayoutStyles = () => {
    if (isNeoBrutalism) {
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
    if (isNeoBrutalism) {
      return {
        backgroundColor: 'var(--background)', 
        borderRight: '4px solid var(--border)',
        boxShadow: '4px 0px 0px 0px rgba(0,0,0,1)'
      };
    }
    if (isFluentValue) {
      return {
        backgroundColor: 'var(--fluent-surface-primary)', 
        borderRight: '1px solid var(--fluent-neutral-grey-30)',
        boxShadow: 'var(--fluent-elevation-4)'
      };
    }
    if (isMaterialValue) {
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
    return computedStyles.getNavItemStyles(active, item);
  };

  // Helper function para obtener colores de badges según el tema
  const getBadgeColors = (type = 'notification') => {
    return computedStyles.getBadgeColors(type);
  };

  // Helper function para obtener estilos base de badges
  const getBaseBadgeStyles = (type = 'notification') => {
    return computedStyles.getBaseBadgeStyles(type);
  };

  return (
    <div className="erp-main-layout flex min-h-screen" style={computedStyles.layout} data-component="main-layout" data-testid="main-layout">
      {/* Sidebar Desktop - Fixed sidebar */}
      <div 
        className={`erp-sidebar-desktop fixed inset-y-0 left-0 z-30 w-72 ${!isClient ? 'hidden lg:block' : ''}`}
        style={{ 
          display: isClient ? (isLargeScreen ? 'block' : 'none') : undefined
        }}
        data-component="sidebar-desktop" 
        data-testid="sidebar-desktop"
      >
        <div className="erp-sidebar-content h-full flex flex-col"
             style={getSidebarStyles()} data-component="sidebar-content" data-testid="sidebar-content">
          {/* Logo */}
          <div className="erp-sidebar-logo flex items-center flex-shrink-0 px-6 py-6"
               style={computedStyles.logoContainer}
               data-component="sidebar-logo" data-testid="sidebar-logo">
            <div className="erp-logo-content flex items-center space-x-3" data-component="logo-content" data-testid="logo-content">
              <div className="erp-logo-icon w-10 h-10 flex items-center justify-center rounded-md"
                   style={computedStyles.logoIcon}>
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
          <nav className={`erp-sidebar-nav mt-4 flex-1 px-4 pb-4 ${computedStyles.css.navSpacing} overflow-y-auto`} data-component="sidebar-nav" data-testid="sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const navStyles = getNavItemStyles(active, item);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`erp-nav-item group flex items-center px-3 py-2 text-xs ${getTitleClass('body')} ${isNeoBrutalismValue ? '' : isFluentValue ? 'fluent-radius-small' : 'rounded-md'} transition-all duration-150`}
                  style={navStyles}
                  data-component="nav-item" 
                  data-testid={`nav-item-${item.name.toLowerCase()}`}
                  data-active={active}
                  onMouseEnter={(e) => {
                    if (!active) {
                      const themeType = isNeoBrutalismValue ? 'neo' : isFluentValue ? 'fluent' : isMaterialValue ? 'material' : 'default';
                      const hoverStyles = computedStyles.getNavItemHoverStyles(themeType);
                      
                      // Apply hover styles smoothly
                      Object.entries(hoverStyles).forEach(([prop, value]) => {
                        e.target.style.setProperty(prop, value, 'important');
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      // Reset all hover styles to original values
                      const originalStyles = navStyles;
                      Object.entries(originalStyles).forEach(([prop, value]) => {
                        e.target.style.setProperty(prop, value, 'important');
                      });
                      
                      // Ensure transform is reset for neo-brutalism
                      if (isNeoBrutalismValue && !active) {
                        e.target.style.setProperty('transform', 'translate(0px, 0px)', 'important');
                        e.target.style.setProperty('box-shadow', 'none', 'important');
                      }
                    }
                  }}
                >
                  <Icon className="erp-nav-icon mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="erp-nav-text flex-1">{item.name}</span>
                  {isNeoBrutalismValue ? (
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

        </div>
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full"
               style={computedStyles.sidebarMobile}>
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className={`text-white ${computedStyles.css.textWhite}`}
                style={computedStyles.mobileCloseBtn}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile sidebar content - same as desktop */}
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-6 py-6"
                   style={{ 
                     borderBottom: isNeoBrutalismValue ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)'
                   }}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-md"
                       style={{ 
                         backgroundColor: 'var(--primary)', 
                         color: 'var(--primary-foreground)',
                         border: isNeoBrutalismValue ? '2px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                         boxShadow: isNeoBrutalismValue ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none'
                       }}>
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className={`text-xl ${computedStyles.css.titleClass}`}
                        style={{ color: 'var(--foreground)' }}>
                      ERP System
                    </h1>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className={`mt-4 flex-1 px-4 pb-4 ${isNeoBrutalismValue ? 'space-y-2' : 'space-y-1'} overflow-y-auto`}>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const navStyles = getNavItemStyles(active, item);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-2 text-xs ${computedStyles.css.mediumClass} ${isNeoBrutalismValue ? '' : 'rounded-md'} transition-all duration-150`}
                      style={navStyles}
                      onMouseEnter={(e) => {
                        if (!active) {
                          const themeType = isNeoBrutalismValue ? 'neo' : isFluentValue ? 'fluent' : isMaterialValue ? 'material' : 'default';
                          const hoverStyles = computedStyles.getNavItemHoverStyles(themeType);
                          
                          // Apply hover styles smoothly
                          Object.entries(hoverStyles).forEach(([prop, value]) => {
                            e.target.style.setProperty(prop, value, 'important');
                          });
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          // Reset all hover styles to original values
                          const originalStyles = navStyles;
                          Object.entries(originalStyles).forEach(([prop, value]) => {
                            e.target.style.setProperty(prop, value, 'important');
                          });
                          
                          // Ensure transform is reset for neo-brutalism
                          if (isNeoBrutalismValue && !active) {
                            e.target.style.setProperty('transform', 'translate(0px, 0px)', 'important');
                            e.target.style.setProperty('box-shadow', 'none', 'important');
                          }
                        }
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {isNeoBrutalismValue ? (
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
  <div className="erp-navbar sticky top-0 z-40 flex-shrink-0 flex h-16 w-full" 
             style={computedStyles.navbar}
             data-component="navbar" data-testid="navbar">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className={`erp-mobile-menu-btn hide-desktop px-4 lg:hidden`}
            style={{
              ...computedStyles.mobileMenuBtn,
              // Forzar display none en desktop incluso si estados aún no inicializan
              display: isLargeScreen ? 'none' : 'flex'
            }}
            data-testid="mobile-menu-btn"
            data-component="mobile-menu-btn"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="erp-navbar-content flex-1 px-4 flex justify-end items-center" data-component="navbar-content" data-testid="navbar-content">
            {/* Right side only (search eliminado) */}
      <div className="erp-navbar-actions ml-2 flex items-center space-x-4" 
        style={{ overflow: 'visible', marginTop: '4px' }}
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
          style={{ overflow: 'visible', zIndex: 55, position: 'relative' }}
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
                  ref={profileBtnRef}
                  onClick={() => {
                    setShowUserMenu(prev => !prev);
                  }}
                  data-testid="profile-btn"
                >
                  <User className="h-6 w-6" />
                  <span style={getBaseBadgeStyles('profile')}>
                    1
                  </span>
                </Button>
                {showUserMenu && profileBtnRef.current && createPortal(
                  <div
                    className={`erp-user-dropdown fixed ${computedStyles.css.cardRadius}`}
                    style={{
                      top: `${menuPos.top}px`,
                      left: `${menuPos.right - menuPos.width}px`,
                      width: '18rem',
                      minWidth: '16rem',
                      minHeight: '10rem',
                      maxHeight: '80vh',
                      backgroundColor: 'var(--popover)',
                      border: isNeoBrutalismValue ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
                      boxShadow: isNeoBrutalismValue ? '8px 8px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-lg)',
                      overflow: 'hidden',
                      zIndex: 1000
                    }}
                  >
                    <div className="p-4" style={{ borderBottom: isNeoBrutalismValue ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)' }}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 flex items-center justify-center ${isNeoBrutalismValue ? '' : 'rounded-full'}`}
                             style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: isNeoBrutalismValue ? '4px solid var(--border)' : 'none' }}>
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-sm ${computedStyles.css.semiboldClass}`} style={{ color: 'var(--foreground)' }}>{user?.name || 'Usuario Demo'}</p>
                          <p className={`text-xs ${isNeoBrutalismValue ? 'font-bold' : ''}`} style={{ color: 'var(--muted-foreground)' }}>{user?.email || user?.username || 'demo@erp.com'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/configuracion"
                        className={`flex items-center w-full px-4 py-3 text-sm ${computedStyles.css.mediumClass} text-left transition-colors ${isNeoBrutalismValue ? '' : 'rounded-md'}`}
                        style={{ color: 'var(--foreground)' }}
                        onClick={() => setShowUserMenu(false)}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = isNeoBrutalismValue ? 'var(--muted)' : 'var(--accent)'; e.target.style.color = isNeoBrutalismValue ? 'var(--foreground)' : 'var(--accent-foreground)'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--foreground)'; }}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        {computedStyles.values.configText}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 text-sm ${computedStyles.css.mediumClass} text-left transition-colors ${isNeoBrutalismValue ? '' : 'rounded-md'}`}
                        style={{ color: 'var(--destructive)' }}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--destructive)'; e.target.style.color = 'var(--destructive-foreground)'; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--destructive)'; }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {computedStyles.values.logoutText}
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
          
          {/* Overlay for user menu */}
          {showUserMenu && (
            <div className="fixed inset-0 z-[999]" onClick={() => setShowUserMenu(false)} />
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

