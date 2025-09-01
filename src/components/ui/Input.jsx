/**
 * Componente Input simplificado para MVP - Sin hooks problemáticos
 * Versión básica que funciona sin dependencias de contexto
 * Actualizado para soportar sistema de temas
 */

import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  error, 
  label, 
  helperText,
  leftIcon,
  rightIcon,
  id,
  name,
  ...props 
}, ref) => {
  const { styles } = useThemeStyles();
  const generatedId = useId();
  const inputId = id || (name ? `${name}-${generatedId}` : `input-${generatedId}`);
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={cn("block mb-2", styles.label())}>
          {label}
          {props.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-muted-foreground">
              {leftIcon}
            </div>
          </div>
        )}
        
        {/* Input Field */}
        <input
          id={inputId}
          name={name}
          type={type}
          aria-invalid={!!error}
          aria-describedby={helperText ? helperId : undefined}
          className={cn(
            "flex h-10 w-full ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            styles.input(),
            error && "border-destructive",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-muted-foreground">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      {helperText && (
        <p 
          id={helperId} 
          className={cn(
            "text-sm mt-1",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };