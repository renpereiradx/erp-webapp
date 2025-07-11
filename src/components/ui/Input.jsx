/**
 * Componente Input reutilizable con soporte para múltiples temas
 * Incluye variantes para Neo-Brutalist, Material y Fluent Design
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label, 
  helperText,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const { theme } = useTheme();
  const isNeoBrutalist = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  
  const getInputStyles = () => {
    if (isNeoBrutalist) {
      return {
        border: error ? '4px solid var(--destructive)' : '4px solid var(--border)',
        backgroundColor: 'var(--input)',
        color: 'var(--foreground)',
        fontWeight: 'bold',
        boxShadow: error 
          ? '4px 4px 0px 0px var(--destructive)'
          : '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        ':focus': {
          boxShadow: error 
            ? '2px 2px 0px 0px var(--destructive)'
            : '2px 2px 0px 0px rgba(0,0,0,1)',
          transform: 'translate(2px, 2px)'
        }
      };
    }
    return {
      border: error ? '1px solid var(--destructive)' : '1px solid var(--border)',
      backgroundColor: 'var(--input)',
      color: 'var(--foreground)',
      fontWeight: 'normal',
      borderRadius: '6px',
      boxShadow: 'none',
      transition: 'all 200ms ease',
      ':focus': {
        borderColor: 'var(--ring)'
      }
    };
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className={cn(
          "block text-sm mb-3",
          isNeoBrutalist ? "font-black uppercase tracking-wide" : "font-medium"
        )} style={{ color: 'var(--foreground)' }}>
          {label}
          {props.required && (
            <span className="ml-1" style={{ color: 'var(--destructive)' }}>*</span>
          )}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <div className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }}>
              {leftIcon}
            </div>
          </div>
        )}
        
        {/* Input Field */}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full px-4 py-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium transition-all duration-150 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            isNeoBrutalist && "brutalist-input font-bold focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]",
            !isNeoBrutalist && "rounded-md",
            leftIcon && "pl-12",
            rightIcon && "pr-12",
            className
          )}
          style={getInputStyles()}
          onFocus={(e) => {
            if (isNeoBrutalist) {
              e.target.style.boxShadow = error 
                ? '2px 2px 0px 0px var(--destructive)'
                : '2px 2px 0px 0px rgba(0,0,0,1)';
              e.target.style.transform = 'translate(2px, 2px)';
            } else {
              e.target.style.borderColor = 'var(--ring)';
              e.target.style.boxShadow = '0 0 0 2px var(--ring)';
            }
          }}
          onBlur={(e) => {
            if (isNeoBrutalist) {
              e.target.style.boxShadow = error 
                ? '4px 4px 0px 0px var(--destructive)'
                : '4px 4px 0px 0px rgba(0,0,0,1)';
              e.target.style.transform = 'translate(0px, 0px)';
            } else {
              e.target.style.borderColor = error ? 'var(--destructive)' : 'var(--border)';
              e.target.style.boxShadow = 'none';
            }
          }}
          ref={ref}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10">
            <div className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }}>
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text o Error Message */}
      {(helperText || error) && (
        <p className={cn(
          "mt-3 text-sm",
          isNeoBrutalist ? "font-bold uppercase tracking-wide" : "font-normal"
        )} style={{ color: error ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };

