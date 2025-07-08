/**
 * Componente Input reutilizable con estilo Neo-Brutalista
 * Incluye bordes gruesos, sombras pronunciadas y tipografía bold
 */

import React from 'react';
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
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-black uppercase tracking-wide text-foreground mb-3">
          {label}
          {props.required && <span className="text-brutalist-red ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <div className="h-5 w-5 text-black font-bold">
              {leftIcon}
            </div>
          </div>
        )}
        
        {/* Input Field */}
        <input
          type={type}
          className={cn(
            // Estilos base neo-brutalistas
            "flex h-12 w-full border-4 border-black bg-white px-4 py-3 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-gray-500 placeholder:font-bold focus-visible:outline-none focus-visible:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50",
            // Espaciado para iconos
            leftIcon && "pl-12",
            rightIcon && "pr-12",
            // Estado de error
            error && "border-brutalist-red shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] focus-visible:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10">
            <div className="h-5 w-5 text-black font-bold">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text o Error Message */}
      {(helperText || error) && (
        <p className={cn(
          "mt-3 text-sm font-bold uppercase tracking-wide",
          error ? "text-brutalist-red" : "text-gray-600"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };

