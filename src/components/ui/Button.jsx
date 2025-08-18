/**
 * Componente Button reutilizable con soporte para múltiples temas
 * Incluye variantes para Neo-Brutalist, Material y Fluent Design
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isFluent = theme?.includes('fluent');
  const isMaterial = theme?.includes('material');
  
  const Comp = asChild ? "span" : "button";
  
  const getButtonStyles = () => {
    if (isNeoBrutalist) {
      return {
        border: '4px solid var(--border)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      };
    }
    if (isFluent) {
      return {
        border: variant === 'outline' ? '1px solid var(--fluent-border-neutral)' : 'none',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
        boxShadow: variant === 'ghost' || variant === 'link' ? 'none' : 'var(--fluent-shadow-2)',
        transition: 'all var(--fluent-duration-fast, 0.1s) var(--fluent-curve-easy-ease, cubic-bezier(0.33, 0, 0.67, 1))',
        fontFamily: 'var(--fluent-font-family-base, "Segoe UI", system-ui, sans-serif)',
        position: 'relative',
        overflow: 'hidden'
      };
    }
    if (isMaterial) {
      return {
        border: variant === 'outline' ? '1px solid var(--border)' : 'none',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.5px',
        borderRadius: '20px',
        boxShadow: variant === 'ghost' || variant === 'link' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '"Roboto", system-ui, sans-serif',
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
    
    if (isNeoBrutalist) {
      const brutalistVariants = {
        default: { backgroundColor: 'var(--background)', color: 'var(--foreground)' },
        primary: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
        lime: { backgroundColor: 'var(--brutalist-lime)', color: '#000000' },
        blue: { backgroundColor: 'var(--brutalist-blue)', color: '#ffffff' },
        pink: { backgroundColor: 'var(--brutalist-pink)', color: '#ffffff' },
        orange: { backgroundColor: 'var(--brutalist-orange)', color: '#ffffff' },
        purple: { backgroundColor: 'var(--brutalist-purple)', color: '#ffffff' },
        green: { backgroundColor: 'var(--brutalist-green)', color: '#ffffff' },
        red: { backgroundColor: 'var(--brutalist-red)', color: '#ffffff' },
        yellow: { backgroundColor: 'var(--brutalist-yellow)', color: '#000000' },
        destructive: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' },
        outline: { backgroundColor: 'transparent', color: 'var(--foreground)' },
        secondary: { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' },
        ghost: { backgroundColor: 'transparent', color: 'var(--foreground)', border: 'none', boxShadow: 'none' },
        link: { backgroundColor: 'transparent', color: 'var(--foreground)', border: 'none', boxShadow: 'none', textDecoration: 'underline' },
      };
      return { ...baseStyle, ...brutalistVariants[variant] };
    } else if (isFluent) {
      const fluentVariants = {
        default: { 
          backgroundColor: 'var(--fluent-brand-primary)', 
          color: 'var(--fluent-text-on-accent)' 
        },
        primary: { 
          backgroundColor: 'var(--fluent-brand-primary)', 
          color: 'var(--fluent-text-on-accent)' 
        },
        destructive: { 
          backgroundColor: 'var(--fluent-semantic-danger)', 
          color: 'var(--fluent-neutral-white)' 
        },
        outline: { 
          backgroundColor: 'transparent', 
          color: 'var(--fluent-brand-primary)',
          border: '1px solid var(--fluent-border-neutral)',
          boxShadow: 'none'
        },
        secondary: { 
          // Celeste background with white text, using brand secondary
          backgroundColor: 'var(--fluent-brand-secondary, var(--fluent-brand-primary-hover))', 
          color: 'var(--fluent-text-on-accent)',
          boxShadow: 'var(--fluent-shadow-2)'
        },
        ghost: { 
          backgroundColor: 'transparent', 
          color: 'var(--fluent-text-primary)', 
          border: 'none', 
          boxShadow: 'none' 
        },
        link: { 
          backgroundColor: 'transparent', 
          color: 'var(--fluent-brand-primary)', 
          border: 'none', 
          boxShadow: 'none', 
          textDecoration: 'underline' 
        },
        // Color variants for Fluent
        blue: { 
          backgroundColor: 'var(--fluent-brand-primary)', 
          color: 'var(--fluent-text-on-accent)' 
        },
        green: { 
          backgroundColor: 'var(--fluent-semantic-success)', 
          color: 'var(--fluent-neutral-white)' 
        },
        red: { 
          backgroundColor: 'var(--fluent-semantic-danger)', 
          color: 'var(--fluent-neutral-white)' 
        },
        yellow: { 
          backgroundColor: 'var(--fluent-semantic-warning)', 
          color: 'var(--fluent-neutral-black)' 
        },
        orange: { 
          backgroundColor: '#F7630C', 
          color: 'var(--fluent-neutral-white)' 
        },
        purple: { 
          backgroundColor: '#8764B8', 
          color: 'var(--fluent-neutral-white)' 
        },
        pink: { 
          backgroundColor: '#E3008C', 
          color: 'var(--fluent-neutral-white)' 
        },
        lime: { 
          backgroundColor: '#73AA24', 
          color: 'var(--fluent-neutral-white)' 
        }
      };
      return { ...baseStyle, ...fluentVariants[variant] };
    } else if (isMaterial) {
      const materialVariants = {
        default: { 
          backgroundColor: 'var(--primary)', 
          color: 'var(--primary-foreground)' 
        },
        primary: { 
          backgroundColor: 'var(--primary)', 
          color: 'var(--primary-foreground)' 
        },
        destructive: { 
          backgroundColor: 'var(--destructive)', 
          color: 'var(--destructive-foreground)' 
        },
        outline: { 
          backgroundColor: 'transparent', 
          color: 'var(--primary)',
          border: '1px solid var(--border)',
          boxShadow: 'none'
        },
        secondary: { 
          backgroundColor: 'var(--secondary)', 
          color: 'var(--secondary-foreground)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        ghost: { 
          backgroundColor: 'transparent', 
          color: 'var(--primary)', 
          border: 'none', 
          boxShadow: 'none' 
        },
        link: { 
          backgroundColor: 'transparent', 
          color: 'var(--primary)', 
          border: 'none', 
          boxShadow: 'none', 
          textDecoration: 'underline' 
        },
        // Color variants for Material
        blue: { 
          backgroundColor: 'var(--primary)', 
          color: 'var(--primary-foreground)' 
        },
        green: { 
          backgroundColor: '#4CAF50', 
          color: '#FFFFFF' 
        },
        red: { 
          backgroundColor: 'var(--destructive)', 
          color: 'var(--destructive-foreground)' 
        },
        yellow: { 
          backgroundColor: '#FF9800', 
          color: '#000000' 
        },
        orange: { 
          backgroundColor: '#FF5722', 
          color: '#FFFFFF' 
        },
        purple: { 
          backgroundColor: '#9C27B0', 
          color: '#FFFFFF' 
        },
        pink: { 
          backgroundColor: '#E91E63', 
          color: '#FFFFFF' 
        },
        lime: { 
          backgroundColor: '#8BC34A', 
          color: '#000000' 
        }
      };
      return { ...baseStyle, ...materialVariants[variant] };
    } else {
      const standardVariants = {
        default: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
        primary: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
        destructive: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' },
        outline: { backgroundColor: 'transparent', color: 'var(--foreground)' },
        secondary: { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' },
        ghost: { backgroundColor: 'transparent', color: 'var(--foreground)' },
        link: { backgroundColor: 'transparent', color: 'var(--primary)', textDecoration: 'underline' },
      };
      return { ...baseStyle, ...standardVariants[variant] };
    }
  };
  
  const getSizeStyles = () => {
    if (isFluent) {
      const sizes = {
        default: { height: '2rem', padding: '0 1rem', fontSize: '0.875rem' }, // 32px
        sm: { height: '1.5rem', padding: '0 0.75rem', fontSize: '0.75rem' }, // 24px
        lg: { height: '2.5rem', padding: '0 1.25rem', fontSize: '0.875rem' }, // 40px
        icon: { height: '2rem', width: '2rem', padding: '0' }, // 32px
      };
      return sizes[size] || sizes.default;
    }
    const sizes = {
      default: { height: '2.5rem', padding: '0 1.5rem' },
      sm: { height: '2rem', padding: '0 1rem', fontSize: '0.875rem' },
      lg: { height: '3rem', padding: '0 2rem', fontSize: '1.125rem' },
      icon: { height: '2.5rem', width: '2.5rem', padding: '0' },
    };
    return sizes[size] || sizes.default;
  };

  return (
    <Comp
      data-testid={props['data-testid'] ?? `button-${variant}-${size}`}
      className={cn(
        "erp-button inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isNeoBrutalist && "hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]",
        variant === 'ghost' && isNeoBrutalist && "hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
        variant === 'link' && isNeoBrutalist && "hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
        isFluent && "fluent-button",
        isMaterial && "material-button",
        className
      )}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles()
      }}
      onMouseEnter={(e) => {
        if (isNeoBrutalist && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)';
        } else if (isFluent && variant !== 'link') {
          e.target.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--fluent-shadow-4)';
          e.target.style.transform = variant === 'ghost' ? 'none' : 'translateY(-1px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'var(--fluent-surface-card-hover)';
          }
          if (variant === 'secondary') {
            e.target.style.backgroundColor = 'var(--fluent-brand-secondary-hover, var(--fluent-brand-primary))';
          }
          if (variant === 'ghost') {
            e.target.style.backgroundColor = 'var(--fluent-surface-subtle-hover, transparent)';
          }
        } else if (isMaterial && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          e.target.style.transform = 'translateY(-2px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'rgba(0,0,0,0.04)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (isNeoBrutalist && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
        } else if (isFluent && variant !== 'link') {
          e.target.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--fluent-shadow-2)';
          e.target.style.transform = 'translateY(0px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'transparent';
          }
          if (variant === 'secondary') {
            e.target.style.backgroundColor = 'var(--fluent-brand-secondary, var(--fluent-brand-primary-hover))';
          }
          if (variant === 'ghost') {
            e.target.style.backgroundColor = 'transparent';
          }
        } else if (isMaterial && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          e.target.style.transform = 'translateY(0px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'transparent';
          }
        }
      }}
      onMouseDown={(e) => {
        if (isNeoBrutalist && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = 'none';
        } else if (isFluent && variant !== 'link') {
          e.target.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--fluent-shadow-2)';
          e.target.style.transform = 'translateY(0px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'var(--fluent-surface-card-pressed)';
          }
          if (variant === 'secondary') {
            e.target.style.backgroundColor = 'var(--fluent-brand-secondary-pressed, var(--fluent-brand-primary-pressed, var(--fluent-brand-primary)))';
          }
          if (variant === 'ghost') {
            e.target.style.backgroundColor = 'var(--fluent-surface-subtle-pressed, transparent)';
          }
        } else if (isMaterial && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
          e.target.style.transform = 'translateY(0px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'rgba(0,0,0,0.08)';
          }
        }
      }}
      onMouseUp={(e) => {
        if (isNeoBrutalist && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)';
        } else if (isFluent && variant !== 'link') {
          e.target.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--fluent-shadow-4)';
          e.target.style.transform = variant === 'ghost' ? 'none' : 'translateY(-1px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'var(--fluent-surface-card-hover)';
          }
          if (variant === 'secondary') {
            e.target.style.backgroundColor = 'var(--fluent-brand-secondary-hover, var(--fluent-brand-primary))';
          }
          if (variant === 'ghost') {
            e.target.style.backgroundColor = 'var(--fluent-surface-subtle-hover, transparent)';
          }
        } else if (isMaterial && variant !== 'ghost' && variant !== 'link') {
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          e.target.style.transform = 'translateY(-2px)';
          if (variant === 'outline') {
            e.target.style.backgroundColor = 'rgba(0,0,0,0.04)';
          }
        }
      }}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
