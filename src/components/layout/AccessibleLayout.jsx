/**
 * Accessible Layout Component - Wave 4 UX & Accessibility
 * Layout principal con navegación accesible y responsive
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Globe,
  ChevronDown
} from 'lucide-react';

import { useResponsive } from '@/responsive/hooks';
import { useTheme, useThemeClasses } from '@/themes/ThemeProvider';
import { 
  useAccessibility, 
  useFocusManagement, 
  useKeyboardNavigation 
} from '@/accessibility/hooks';
import {
  SkipLink,
  AccessibleButton,
  FocusTrap,
  ScreenReaderOnly
} from '@/components/accessibility/AccessibleComponents';
import ThemeSelector from '@/components/ui/ThemeSelector';

// Configuración de navegación
const navigationItems = [
  {
    id: 'dashboard',
    icon: Home,
    href: '/',
    requiresAuth: true
  },
  {
    id: 'purchases',
    icon: ShoppingCart,
    href: '/purchases',
    requiresAuth: true
  },
  {
    id: 'products',
    icon: Package,
    href: '/products',
    requiresAuth: true
  },
  {
    id: 'suppliers',
    icon: Users,
    href: '/suppliers',
    requiresAuth: true
  },
  {
    id: 'reports',
    icon: BarChart3,
    href: '/reports',
    requiresAuth: true
  }
];

const AccessibleLayout = ({ children, currentPath = '/' }) => {
  const { t, i18n } = useTranslation();
  const { currentTheme, toggleTheme } = useTheme();
  const themeClasses = useThemeClasses();
  
  // Responsive
  const { isMobileRange, isTabletUp } = useResponsive();
  
  // Accessibility
  const { isUsingKeyboard, shouldReduceMotion } = useAccessibility();
  const { trapFocus, saveFocus, restoreFocus } = useFocusManagement();
  
  // Estado local
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  
  const mobileMenuRef = useRef(null);
  const mainContentRef = useRef(null);
  const skipLinkRef = useRef(null);
  
  // Keyboard shortcuts
  const shortcuts = {
    'alt+m': () => toggleMobileMenu(),
    'alt+t': () => toggleTheme(),
    'alt+l': () => setIsLanguageMenuOpen(prev => !prev),
    'alt+1': () => navigateTo('/'),
    'alt+2': () => navigateTo('/purchases'),
    'alt+3': () => navigateTo('/products'),
    'escape': () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      } else if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
      } else if (isLanguageMenuOpen) {
        setIsLanguageMenuOpen(false);
      }
    }
  };
  
  useKeyboardNavigation(shortcuts);
  
  // Efectos
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      saveFocus();
    } else {
      document.body.style.overflow = '';
      if (isMobileMenuOpen === false) { // Explícitamente false, no inicial
        restoreFocus();
      }
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, saveFocus, restoreFocus]);
  
  // Handlers
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };
  
  const navigateTo = (path) => {
    // Aquí iría la lógica de navegación
    console.log('Navigate to:', path);
    setIsMobileMenuOpen(false);
  };
  
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setIsLanguageMenuOpen(false);
  };
  
  const getCurrentLanguage = () => {
    const lang = i18n.language || 'es';
    const languages = {
      es: 'Español',
      en: 'English',
      pt: 'Português'
    };
    return languages[lang] || 'Español';
  };
  
  // Navegación principal
  const NavigationList = ({ mobile = false }) => (
    <nav
      role="navigation"
      aria-label={mobile ? t('accessibility.mobileNavigation') : t('accessibility.mainNavigation')}
    >
      <ul className={mobile ? 'space-y-2' : 'space-y-1'}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <li key={item.id}>
              <AccessibleButton
                variant="ghost"
                className={`
                  w-full justify-start gap-3 px-3 py-2
                  ${isActive 
                    ? `${themeClasses.bg.primary} ${themeClasses.text.primary} font-medium` 
                    : `${themeClasses.text.secondary} hover:${themeClasses.bg.secondary}`
                  }
                  ${mobile ? 'text-base' : 'text-sm'}
                `}
                onClick={() => navigateTo(item.href)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0`} aria-hidden="true" />
                <span>{t(`navigation.${item.id}`)}</span>
                {isActive && (
                  <ScreenReaderOnly>{t('accessibility.currentPage')}</ScreenReaderOnly>
                )}
              </AccessibleButton>
            </li>
          );
        })}
      </ul>
    </nav>
  );
  
  return (
    <div className={`min-h-screen ${themeClasses.bg.primary}`}>
      {/* Skip Links */}
      <SkipLink 
        ref={skipLinkRef}
        href="#main-content"
      >
        {t('accessibility.skipToContent')}
      </SkipLink>
      
      <SkipLink href="#main-navigation">
        {t('accessibility.skipToNavigation')}
      </SkipLink>
      
      {/* Desktop Sidebar */}
      {isTabletUp && (
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64
            ${themeClasses.bg.secondary} ${themeClasses.border.primary}
            border-r transition-transform duration-300
            ${shouldReduceMotion ? '' : 'transform'}
          `}
          aria-label={t('accessibility.sidebar')}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={`px-6 py-8 ${themeClasses.border.primary} border-b`}>
              <h1 className={`text-xl font-bold ${themeClasses.text.primary}`}>
                ERP System
              </h1>
              <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>
                Enterprise Resource Planning
              </p>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 px-4 py-6" id="main-navigation">
              <NavigationList />
            </div>
            
            {/* Footer with controls */}
            <div className={`px-4 py-4 ${themeClasses.border.primary} border-t space-y-4`}>
              {/* Theme selector */}
              <ThemeSelector compact />
              
              {/* Language selector */}
              <div className="relative">
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                  aria-expanded={isLanguageMenuOpen}
                  aria-haspopup="listbox"
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">{getCurrentLanguage()}</span>
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </AccessibleButton>
                
                {isLanguageMenuOpen && (
                  <div 
                    className={`
                      absolute bottom-full mb-1 left-0 right-0
                      ${themeClasses.bg.primary} ${themeClasses.border.primary}
                      border rounded-md shadow-lg z-50
                    `}
                    role="listbox"
                    aria-label={t('accessibility.languageSelector')}
                  >
                    {['es', 'en', 'pt'].map((lang) => (
                      <button
                        key={lang}
                        role="option"
                        aria-selected={i18n.language === lang}
                        onClick={() => changeLanguage(lang)}
                        className={`
                          w-full px-3 py-2 text-left text-sm rounded-md
                          ${i18n.language === lang 
                            ? `${themeClasses.bg.secondary} font-medium`
                            : `hover:${themeClasses.bg.secondary}`
                          }
                          ${themeClasses.text.primary}
                        `}
                      >
                        {lang === 'es' ? 'Español' : lang === 'en' ? 'English' : 'Português'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}
      
      {/* Mobile Header */}
      {isMobileRange && (
        <header 
          className={`
            ${themeClasses.bg.secondary} ${themeClasses.border.primary}
            border-b px-4 py-3 flex items-center justify-between
          `}
        >
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? t('accessibility.closeMenu') : t('accessibility.openMenu')}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </AccessibleButton>
          
          <h1 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
            ERP System
          </h1>
          
          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={t('accessibility.toggleTheme')}
            >
              {currentTheme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </AccessibleButton>
          </div>
        </header>
      )}
      
      {/* Mobile Menu */}
      {isMobileRange && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <FocusTrap active={isMobileMenuOpen}>
            <aside
              ref={mobileMenuRef}
              id="mobile-menu"
              className={`
                fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]
                ${themeClasses.bg.primary}
                transform transition-transform duration-300
                ${shouldReduceMotion ? '' : 'ease-in-out'}
              `}
              aria-label={t('accessibility.mobileMenu')}
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className={`px-6 py-4 ${themeClasses.border.primary} border-b`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                      Menu
                    </h2>
                    <AccessibleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label={t('accessibility.closeMenu')}
                    >
                      <X className="h-5 w-5" />
                    </AccessibleButton>
                  </div>
                </div>
                
                {/* Navigation */}
                <div className="flex-1 px-6 py-4">
                  <NavigationList mobile />
                </div>
                
                {/* Footer */}
                <div className={`px-6 py-4 ${themeClasses.border.primary} border-t space-y-4`}>
                  <ThemeSelector />
                </div>
              </div>
            </aside>
          </FocusTrap>
        </div>
      )}
      
      {/* Main Content */}
      <main
        ref={mainContentRef}
        id="main-content"
        className={`
          ${isTabletUp ? 'ml-64' : ''}
          min-h-screen transition-all duration-300
        `}
        role="main"
        aria-label={t('accessibility.mainContent')}
      >
        {children}
      </main>
    </div>
  );
};

export default AccessibleLayout;
