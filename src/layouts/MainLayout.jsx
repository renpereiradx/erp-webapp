/**
 * Layout principal del sistema ERP con estilo Neo-Brutalista
 * Incluye sidebar responsive, navbar y área de contenido principal
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
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
import useAuthStore from '@/store/useAuthStore';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    // Inicializar con el valor correcto si window está disponible
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme } = useTheme();

  // Hook para detectar pantallas grandes (mantenido para el futuro si es necesario)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determinar si estamos en tema neo-brutalista
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';

  // Manejar logout
  const handleLogout = () => {
    logout();
    navigate('/login');
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
      name: 'Pedidos', 
      href: '/pedidos', 
      icon: ShoppingCart, 
      color: 'purple',
      badge: '4'
    },
    { 
      name: 'Reportes', 
      href: '/reportes', 
      icon: BarChart3, 
      color: 'green',
      badge: '5'
    },
    { 
      name: 'Configuración', 
      href: '/configuracion', 
      icon: Settings, 
      color: 'pink',
      badge: '6'
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
    return {
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? 'var(--accent-foreground)' : 'var(--foreground)',
      transition: 'colors 200ms ease'
    };
  };

  return (
    <div className="erp-main-layout min-h-screen" style={{ backgroundColor: 'var(--muted, #f9fafb)', ...getLayoutStyles() }} data-component="main-layout" data-testid="main-layout">
      {/* Sidebar Desktop */}
      <div 
        className="erp-sidebar-desktop fixed inset-y-0 left-0 z-30 w-72 hidden lg:block"
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
                <h1 className={`erp-logo-title text-xl ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-bold'}`}
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
                  className={`erp-nav-item group flex items-center px-4 py-3 text-sm ${isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'} ${isNeoBrutalist ? '' : 'rounded-md'} transition-all duration-200`}
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
      <div className="erp-main-content lg:pl-72 flex flex-col flex-1" data-component="main-content" data-testid="main-content">
        {/* Top navbar */}
        <div className="erp-navbar sticky top-0 z-10 flex-shrink-0 flex h-20" 
             style={{ 
               backgroundColor: 'var(--background)', 
               borderBottom: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
               boxShadow: isNeoBrutalist ? '0px 4px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)',
               color: 'var(--foreground)'
             }}
             data-component="navbar" data-testid="navbar">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="erp-mobile-menu-btn px-4 lg:hidden"
            style={{ 
              borderRight: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
              color: 'var(--foreground)'
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
            <div className="erp-navbar-actions ml-4 flex items-center md:ml-6 space-x-4" data-component="navbar-actions" data-testid="navbar-actions">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="erp-notifications-btn relative" data-testid="notifications-btn">
                <Bell className="h-6 w-6" />
                {isNeoBrutalist ? (
                  <span className="erp-notification-badge absolute -top-2 -right-2 px-2 py-1 text-xs font-black border-2 border-black bg-red-400"
                        style={{ boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)' }}
                        data-testid="notification-badge">
                    3
                  </span>
                ) : (
                  <span className="erp-notification-badge absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
                        style={{ 
                          backgroundColor: 'var(--destructive)', 
                          color: 'var(--destructive-foreground)' 
                        }}
                        data-testid="notification-badge">
                    3
                  </span>
                )}
              </Button>

              {/* Profile Menu */}
              <div className="erp-profile-menu relative" data-component="profile-menu" data-testid="profile-menu">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="erp-profile-btn relative"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  data-testid="profile-btn"
                >
                  <User className="h-6 w-6" />
                  {isNeoBrutalist ? (
                    <span className="erp-profile-badge absolute -top-2 -right-2 px-2 py-1 text-xs font-black border-2 border-black bg-green-400"
                          style={{ boxShadow: '1px 1px 0px 0px rgba(0,0,0,1)' }}>
                      1
                    </span>
                  ) : (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
                          style={{ 
                            backgroundColor: 'var(--accent)', 
                            color: 'var(--accent-foreground)' 
                          }}>
                      1
                    </span>
                  )}
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
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-8 px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

