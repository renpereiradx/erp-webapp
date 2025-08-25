/**
 * Theme Selector Component - Wave 4 UX & Accessibility
 * Selector de temas accesible con preview y soporte WCAG 2.1 AA
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Contrast, 
  Check,
  ChevronDown 
} from 'lucide-react';
import { useTheme, useThemeClasses } from '../themes/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Iconos para cada tema
const themeIcons = {
  light: Sun,
  dark: Moon,
  'high-contrast': Contrast,
  enterprise: Monitor
};

// Descripciones accesibles para cada tema
const themeDescriptions = {
  light: 'Tema claro con colores suaves, ideal para uso diurno',
  dark: 'Tema oscuro que reduce el cansancio visual en entornos con poca luz',
  'high-contrast': 'Tema de alto contraste para máxima accesibilidad visual',
  enterprise: 'Tema corporativo personalizable con colores de marca'
};

const ThemeSelector = ({ 
  showPreview = true,
  compact = false,
  className = '',
  onThemeChange
}) => {
  const { 
    currentTheme, 
    setTheme, 
    availableThemes, 
    systemPreference,
    followSystemPreference 
  } = useTheme();
  
  const themeClasses = useThemeClasses();
  const [isOpen, setIsOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Cerrar dropdown con escape o click fuera
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Navegación por teclado en el dropdown
  const handleKeyNavigation = (e, themeName) => {
    const themes = availableThemes;
    const currentIndex = themes.indexOf(themeName);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextButton = dropdownRef.current?.querySelector(
          `[data-theme="${themes[nextIndex]}"]`
        );
        nextButton?.focus();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? themes.length - 1 : currentIndex - 1;
        const prevButton = dropdownRef.current?.querySelector(
          `[data-theme="${themes[prevIndex]}"]`
        );
        prevButton?.focus();
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleThemeSelect(themeName);
        break;
        
      case 'Home':
        e.preventDefault();
        const firstButton = dropdownRef.current?.querySelector(
          `[data-theme="${themes[0]}"]`
        );
        firstButton?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        const lastButton = dropdownRef.current?.querySelector(
          `[data-theme="${themes[themes.length - 1]}"]`
        );
        lastButton?.focus();
        break;
    }
  };
  
  const handleThemeSelect = (themeName) => {
    setTheme(themeName);
    setIsOpen(false);
    setPreviewTheme(null);
    buttonRef.current?.focus();
    onThemeChange?.(themeName);
    
    // Anunciar cambio para lectores de pantalla
    const announcement = `Tema cambiado a ${themeDescriptions[themeName]}`;
    announceToScreenReader(announcement);
  };
  
  const handlePreview = (themeName) => {
    if (showPreview) {
      setPreviewTheme(themeName);
    }
  };
  
  const handlePreviewEnd = () => {
    setPreviewTheme(null);
  };
  
  // Función para anunciar a lectores de pantalla
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };
  
  const getCurrentThemeIcon = () => {
    const IconComponent = themeIcons[currentTheme] || Palette;
    return IconComponent;
  };
  
  const CurrentIcon = getCurrentThemeIcon();
  
  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Selector de tema. Tema actual: ${themeDescriptions[currentTheme]}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`${themeClasses.focusRing} ${themeClasses.border.primary}`}
        >
          <CurrentIcon className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
        
        {isOpen && (
          <Card className={`absolute top-full mt-1 right-0 z-[var(--z-dropdown)] min-w-48 ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
            <CardContent className="p-1">
              <div role="listbox" aria-label="Seleccionar tema">
                {availableThemes.map((themeName) => {
                  const IconComponent = themeIcons[themeName];
                  const isSelected = currentTheme === themeName;
                  
                  return (
                    <button
                      key={themeName}
                      data-theme={themeName}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleThemeSelect(themeName)}
                      onKeyDown={(e) => handleKeyNavigation(e, themeName)}
                      onMouseEnter={() => handlePreview(themeName)}
                      onMouseLeave={handlePreviewEnd}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm rounded-md
                        ${themeClasses.text.primary} hover:${themeClasses.bg.secondary}
                        ${themeClasses.focusRing}
                        ${isSelected ? themeClasses.bg.secondary : ''}
                      `}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      <span className="flex-1 text-left">
                        {themeDescriptions[themeName].split(',')[0]}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 ml-2" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
                
                <hr className={`my-1 ${themeClasses.border.primary}`} />
                
                <button
                  onClick={followSystemPreference}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm rounded-md
                    ${themeClasses.text.secondary} hover:${themeClasses.bg.secondary}
                    ${themeClasses.focusRing}
                  `}
                >
                  <Monitor className="h-4 w-4 mr-3" />
                  <span>Seguir sistema ({systemPreference})</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
  // Versión completa con preview
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5" />
        <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
          Seleccionar Tema
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableThemes.map((themeName) => {
          const IconComponent = themeIcons[themeName];
          const isSelected = currentTheme === themeName;
          const isPreview = previewTheme === themeName;
          
          return (
            <Card
              key={themeName}
              className={`
                cursor-pointer transition-all duration-200
                ${isSelected ? 'ring-2 ring-[var(--color-primary-500)]' : ''}
                ${isPreview ? 'scale-105' : ''}
                ${themeClasses.bg.primary} ${themeClasses.border.primary}
                hover:${themeClasses.bg.secondary}
              `}
              onClick={() => handleThemeSelect(themeName)}
              onMouseEnter={() => handlePreview(themeName)}
              onMouseLeave={handlePreviewEnd}
              role="button"
              tabIndex={0}
              aria-label={`Seleccionar ${themeDescriptions[themeName]}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleThemeSelect(themeName);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-8 w-8" />
                    <div>
                      <h4 className={`font-semibold ${themeClasses.text.primary}`}>
                        {themeName.charAt(0).toUpperCase() + themeName.slice(1).replace('-', ' ')}
                      </h4>
                      <p className={`text-sm ${themeClasses.text.secondary}`}>
                        {themeDescriptions[themeName]}
                      </p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check className="h-6 w-6 text-[var(--color-primary-500)]" />
                  )}
                </div>
                
                {showPreview && (
                  <div className="grid grid-cols-4 gap-2 h-8">
                    <div className="rounded bg-[var(--color-primary-500)]" />
                    <div className="rounded bg-[var(--color-secondary-500)]" />
                    <div className="rounded bg-[var(--color-success-500)]" />
                    <div className="rounded bg-[var(--color-warning-500)]" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card className={`${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6" />
              <div>
                <h4 className={`font-semibold ${themeClasses.text.primary}`}>
                  Seguir preferencia del sistema
                </h4>
                <p className={`text-sm ${themeClasses.text.secondary}`}>
                  Cambiar automáticamente según la configuración del dispositivo
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={followSystemPreference}
              aria-label={`Seguir preferencia del sistema. Actual: ${systemPreference}`}
            >
              Usar sistema
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Anuncio para lectores de pantalla */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {previewTheme && `Previsualizando tema: ${themeDescriptions[previewTheme]}`}
      </div>
    </div>
  );
};

export default ThemeSelector;
