/**
 * Layout principal del sistema ERP con estilo Neo-Brutalista
 * Incluye sidebar responsive, navbar y área de contenido principal
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { BrutalistBadge } from '@/components/ui/Card';
import useAuthStore from '@/store/useAuthStore';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Manejar logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  // Configuración de navegación con colores neo-brutalistas
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

  return (
    <div className="min-h-screen bg-gray-100 font-bold">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r-4 border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-6 border-b-4 border-black">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-black">
                  ERP System
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-4 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-black uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] ${
                    active 
                      ? `bg-brutalist-${item.color} text-black` 
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  <BrutalistBadge color={item.color} className="ml-2">
                    {item.badge}
                  </BrutalistBadge>
                </Link>
              );
            })}
          </nav>

          {/* Upgrade Section */}
          <div className="flex-shrink-0 p-4">
            <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-black mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wide">
                Are you looking for more features? Check out our Pro version.
              </p>
              <Button variant="red" size="sm" className="w-full">
                <span className="mr-2">→</span>
                Upgrade Now
                <BrutalistBadge color="yellow" className="ml-2">
                  22
                </BrutalistBadge>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r-4 border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white border-2 border-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile sidebar content - same as desktop */}
            <div className="flex flex-col flex-grow overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-6 py-6 border-b-4 border-black">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-wide text-black">
                      ERP System
                    </h1>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-6 flex-1 px-4 space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm font-black uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] ${
                        active 
                          ? `bg-brutalist-${item.color} text-black` 
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      <BrutalistBadge color={item.color} className="ml-2">
                        {item.badge}
                      </BrutalistBadge>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-20 bg-white border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-black lg:hidden border-r-4 border-black"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Search */}
            <div className="flex-1 flex justify-center lg:ml-6 lg:mr-6">
              <div className="max-w-lg w-full lg:max-w-xs">
                <Input
                  placeholder="Buscar productos, clientes..."
                  leftIcon={<Search className="h-5 w-5" />}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6" />
                <BrutalistBadge color="red" className="absolute -top-2 -right-2 text-xs">
                  3
                </BrutalistBadge>
              </Button>

              {/* Profile Menu */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="h-6 w-6" />
                  <BrutalistBadge color="green" className="absolute -top-2 -right-2 text-xs">
                    1
                  </BrutalistBadge>
                </Button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50">
                    {/* User Info */}
                    <div className="p-4 border-b-4 border-black">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-lime-400 border-4 border-black flex items-center justify-center">
                          <User className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide">
                            {user?.name || 'Usuario Demo'}
                          </p>
                          <p className="text-xs font-bold text-gray-600">
                            {user?.email || user?.username || 'demo@erp.com'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to="/configuracion"
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-left hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        CONFIGURACIÓN
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-left hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        CERRAR SESIÓN
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

