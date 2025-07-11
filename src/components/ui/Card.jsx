/**
 * Componente Card reutilizable con soporte para múltiples temas
 * Incluye variantes para Neo-Brutalist, Material y Fluent Design
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  return (
    <div
      ref={ref}
      className={cn(
        "erp-card",
        isNeoBrutalist ? "brutalist-card" : "rounded-lg",
        className
      )}
      style={{
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        border: isNeoBrutalist ? '4px solid var(--border)' : 'var(--border-width, 1px) solid var(--border)',
        boxShadow: isNeoBrutalist ? '8px 8px 0px 0px rgba(0,0,0,1)' : 'var(--shadow-sm)'
      }}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("erp-card-header flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  return (
    <h3
      ref={ref}
      className={cn(
        "erp-card-title",
        isNeoBrutalist 
          ? "text-2xl font-black uppercase tracking-wide leading-none sm:text-xl md:text-2xl"
          : "text-2xl font-semibold leading-none sm:text-xl md:text-2xl",
        className
      )}
      style={{ color: 'var(--card-foreground)' }}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  return (
    <p
      ref={ref}
      className={cn(
        "erp-card-description",
        isNeoBrutalist
          ? "text-sm font-bold uppercase tracking-wide sm:text-sm md:text-base"
          : "text-sm font-normal sm:text-sm md:text-base",
        className
      )}
      style={{ color: 'var(--muted-foreground)' }}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "erp-card-content p-6 pt-0",
      // Responsive padding
      "sm:p-4 sm:pt-0 md:p-6 md:pt-0",
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "erp-card-footer flex items-center p-6 pt-0",
      // Responsive layout
      "flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Variantes especiales de Card para diferentes propósitos
const MetricCard = React.forwardRef(({ className, color = "white", ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  const getCardStyles = () => {
    if (isNeoBrutalist) {
      const colorClasses = {
        white: { backgroundColor: 'var(--card)' },
        lime: { backgroundColor: 'var(--brutalist-lime)', color: '#000000' },
        blue: { backgroundColor: 'var(--brutalist-blue)', color: '#ffffff' }, 
        pink: { backgroundColor: 'var(--brutalist-pink)', color: '#ffffff' },
        orange: { backgroundColor: 'var(--brutalist-orange)', color: '#ffffff' },
        purple: { backgroundColor: 'var(--brutalist-purple)', color: '#ffffff' },
        green: { backgroundColor: 'var(--brutalist-green)', color: '#ffffff' },
        red: { backgroundColor: 'var(--brutalist-red)', color: '#ffffff' },
        yellow: { backgroundColor: 'var(--brutalist-yellow)', color: '#000000' },
      };
      return {
        ...colorClasses[color] || colorClasses.white,
        border: '4px solid var(--border)',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        ':hover': {
          boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          transform: 'translate(2px, 2px)'
        }
      };
    }
    return {
      backgroundColor: 'var(--card)',
      color: 'var(--card-foreground)',
      border: 'var(--border-width, 1px) solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      borderRadius: '8px'
    };
  };

  return (
    <div
      ref={ref}
      className={cn(
        "erp-metric-card p-6 transition-all duration-150",
        isNeoBrutalist && "hover:translate-x-[2px] hover:translate-y-[2px]",
        className
      )}
      style={getCardStyles()}
      onMouseEnter={(e) => {
        if (isNeoBrutalist) {
          e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
          e.target.style.transform = 'translate(2px, 2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (isNeoBrutalist) {
          e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
          e.target.style.transform = 'translate(0px, 0px)';
        }
      }}
      {...props}
    />
  );
});
MetricCard.displayName = "MetricCard";

const BrutalistBadge = React.forwardRef(({ className, color = "lime", children, ...props }, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  const getBadgeStyles = () => {
    if (isNeoBrutalist) {
      const colorClasses = {
        lime: { backgroundColor: 'var(--brutalist-lime)', color: '#000000' },
        blue: { backgroundColor: 'var(--brutalist-blue)', color: '#ffffff' }, 
        pink: { backgroundColor: 'var(--brutalist-pink)', color: '#ffffff' },
        orange: { backgroundColor: 'var(--brutalist-orange)', color: '#ffffff' },
        purple: { backgroundColor: 'var(--brutalist-purple)', color: '#ffffff' },
        green: { backgroundColor: 'var(--brutalist-green)', color: '#ffffff' },
        red: { backgroundColor: 'var(--brutalist-red)', color: '#ffffff' },
        yellow: { backgroundColor: 'var(--brutalist-yellow)', color: '#000000' },
      };
      return {
        ...colorClasses[color] || colorClasses.lime,
        border: '2px solid var(--border)',
        boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      };
    }
    return {
      backgroundColor: 'var(--accent)',
      color: 'var(--accent-foreground)',
      borderRadius: '9999px',
      fontWeight: '500'
    };
  };

  return (
    <span
      ref={ref}
      className={cn(
        "erp-brutalist-badge inline-flex items-center justify-center text-xs px-3 py-1",
        isNeoBrutalist ? "font-black uppercase tracking-wide" : "font-medium",
        className
      )}
      style={getBadgeStyles()}
      {...props}
    >
      {children}
    </span>
  );
});
BrutalistBadge.displayName = "BrutalistBadge";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MetricCard,
  BrutalistBadge
};

