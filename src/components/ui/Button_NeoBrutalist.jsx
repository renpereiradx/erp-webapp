/**
 * Componente Button optimizado para Neo-Brutalism
 * Incluye variantes brutalist específicas con énfasis en bordes gruesos, sombras y colores vibrantes
 * Mantiene compatibilidad con Material Design y Fluent Design
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isFluent = theme?.includes('fluent');
  const isMaterial = theme?.includes('material');
  
  const Comp = asChild ? "span" : "button";
  
  // Helper functions específicas para Neo-Brutalism
  const getBrutalistBaseStyles = () => ({
    border: '4px solid var(--border)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 150ms ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'inherit'
  });

  const getBrutalistHoverStyles = () => ({
    transform: 'translate(-3px, -3px)',
    boxShadow: '9px 9px 0px 0px rgba(0,0,0,1)'
  });

  const getBrutalistActiveStyles = () => ({
    transform: 'translate(2px, 2px)',
    boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)'
  });

  const getBrutalistSizeStyles = (size) => {
    const sizes = {
      sm: {
        padding: '8px 16px',
        fontSize: '0.75rem',
        lineHeight: '1.2',
        border: '3px solid var(--border)',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'
      },
      default: {
        padding: '12px 24px',
        fontSize: '0.875rem',
        lineHeight: '1.25',
        border: '4px solid var(--border)',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)'
      },
      lg: {
        padding: '16px 32px',
        fontSize: '1rem',
        lineHeight: '1.5',
        border: '5px solid var(--border)',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)'
      }
    };
    return sizes[size] || sizes.default;
  };

  const getButtonStyles = () => {
    if (isNeoBrutalism) {
      return {
        ...getBrutalistBaseStyles(),
        ...getBrutalistSizeStyles(size)
      };
    }
    if (isFluent) {
      return {
        border: variant === 'outline' ? '1px solid var(--fluent-border-neutral)' : 'none',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        borderRadius: 'var(--fluent-corner-radius-medium)',
        boxShadow: variant === 'ghost' || variant === 'link' ? 'none' : 'var(--fluent-shadow-2)',
        transition: 'all 0.1s var(--fluent-curve-easy-ease, cubic-bezier(0.33, 0, 0.67, 1))',
        fontFamily: 'var(--fluent-font-family-base, "Segoe UI", system-ui, sans-serif)',
        position: 'relative',
        overflow: 'hidden'
      };
    }
    if (isMaterial) {
      return {
        border: variant === 'outline' ? '1px solid var(--material-outline)' : 'none',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.5px',
        borderRadius: 'var(--material-corner-radius-medium, 20px)',
        boxShadow: variant === 'ghost' || variant === 'link' ? 'none' : 'var(--material-elevation-2)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'var(--material-font-family, "Roboto", system-ui, sans-serif)',
        position: 'relative',
        overflow: 'hidden'
      };
    }
    return {
      border: variant === 'outline' ? 'var(--border-width, 1px) solid var(--border)' : 'none',
      fontWeight: '500',
      textTransform: 'none',
      letterSpacing: 'normal',
      borderRadius: '6px',
      transition: 'all 200ms ease'
    };
  };
  
  const getVariantStyles = () => {
    const baseStyle = getButtonStyles();
    
    if (isNeoBrutalism) {
      const brutalistVariants = {
        default: { 
          backgroundColor: 'var(--background)', 
          color: 'var(--foreground)',
          borderColor: 'var(--border)'
        },
        primary: { 
          backgroundColor: 'var(--primary)', 
          color: 'var(--primary-foreground)',
          borderColor: 'var(--border)'
        },
        lime: { 
          backgroundColor: 'var(--brutalist-lime)', 
          color: '#000000',
          borderColor: 'var(--border)'
        },
        blue: { 
          backgroundColor: 'var(--brutalist-blue)', 
          color: '#ffffff',
          borderColor: 'var(--border)'
        },
        pink: { 
          backgroundColor: 'var(--brutalist-pink)', 
          color: '#ffffff',
          borderColor: 'var(--border)'
        },
        orange: { 
          backgroundColor: 'var(--brutalist-orange)', 
          color: '#ffffff',
          borderColor: 'var(--border)'
        },
        purple: { 
          backgroundColor: 'var(--brutalist-purple)', 
          color: '#ffffff',
          borderColor: 'var(--border)'
        },
        green: { 
          backgroundColor: 'var(--brutalist-green)', 
          color: '#ffffff',
          borderColor: 'var(--border)'
        },
        destructive: { 
          backgroundColor: 'var(--destructive)', 
          color: 'var(--destructive-foreground)',
          borderColor: 'var(--border)'
        },
        outline: {
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
          borderColor: 'var(--border)'
        },
        ghost: {
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
          border: '4px solid transparent',
          boxShadow: 'none'
        },
        link: {
          backgroundColor: 'transparent',
          color: 'var(--primary)',
          border: 'none',
          boxShadow: 'none',
          textDecoration: 'underline',
          textDecorationThickness: '3px'
        }
      };
      
      return {
        ...baseStyle,
        ...brutalistVariants[variant]
      };
    }
    
    if (isFluent) {
      const fluentVariants = {
        default: { backgroundColor: 'var(--fluent-neutral-background-1)', color: 'var(--fluent-neutral-foreground-1)' },
        primary: { backgroundColor: 'var(--fluent-brand-background)', color: 'var(--fluent-neutral-foreground-on-brand)' },
        destructive: { backgroundColor: 'var(--fluent-palette-red-background-1)', color: 'var(--fluent-neutral-foreground-on-brand)' },
        outline: { backgroundColor: 'transparent', color: 'var(--fluent-brand-foreground-1)' },
        secondary: { backgroundColor: 'var(--fluent-neutral-background-2)', color: 'var(--fluent-neutral-foreground-2)' },
        ghost: { backgroundColor: 'transparent', color: 'var(--fluent-neutral-foreground-1)' },
        link: { backgroundColor: 'transparent', color: 'var(--fluent-brand-foreground-1)', textDecoration: 'underline' }
      };
      
      return {
        ...baseStyle,
        ...fluentVariants[variant]
      };
    }
    
    if (isMaterial) {
      const materialVariants = {
        default: { backgroundColor: 'var(--material-primary)', color: 'var(--material-on-primary)' },
        primary: { backgroundColor: 'var(--material-primary)', color: 'var(--material-on-primary)' },
        destructive: { backgroundColor: 'var(--material-error)', color: 'var(--material-on-error)' },
        outline: { backgroundColor: 'transparent', color: 'var(--material-primary)' },
        secondary: { backgroundColor: 'var(--material-secondary)', color: 'var(--material-on-secondary)' },
        ghost: { backgroundColor: 'transparent', color: 'var(--material-primary)' },
        link: { backgroundColor: 'transparent', color: 'var(--material-primary)', textDecoration: 'underline' }
      };
      
      return {
        ...baseStyle,
        ...materialVariants[variant]
      };
    }

    // Default variants
    const defaultVariants = {
      default: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
      destructive: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' },
      outline: { backgroundColor: 'transparent', color: 'var(--foreground)' },
      secondary: { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' },
      ghost: { backgroundColor: 'transparent', color: 'var(--primary)' },
      link: { backgroundColor: 'transparent', color: 'var(--primary)', textDecoration: 'underline' }
    };
    
    return {
      ...baseStyle,
      ...defaultVariants[variant]
    };
  };

  const handleMouseEnter = (e) => {
    if (isNeoBrutalism && variant !== 'ghost' && variant !== 'link') {
      Object.assign(e.target.style, getBrutalistHoverStyles());
    }
  };

  const handleMouseLeave = (e) => {
    if (isNeoBrutalism && variant !== 'ghost' && variant !== 'link') {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = getBrutalistSizeStyles(size).boxShadow;
    }
  };

  const handleMouseDown = (e) => {
    if (isNeoBrutalism && variant !== 'ghost' && variant !== 'link') {
      Object.assign(e.target.style, getBrutalistActiveStyles());
    }
  };

  const handleMouseUp = (e) => {
    if (isNeoBrutalism && variant !== 'ghost' && variant !== 'link') {
      Object.assign(e.target.style, getBrutalistHoverStyles());
    }
  };

  return (
    <Comp
      className={cn(className)}
      ref={ref}
      style={getVariantStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
