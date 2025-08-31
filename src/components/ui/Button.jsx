/**
 * Componente Button simplificado para MVP - Sin hooks problemáticos
 * Versión simplificada que funciona sin dependencias de contexto
 */

import React from 'react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  
  const getVariantClass = () => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      primary: "bg-lime-400 text-black font-bold hover:bg-lime-500"
    };
    return variants[variant] || variants.default;
  };

  const getSizeClass = () => {
    const sizes = {
      default: "h-10 px-6 py-2",
      sm: "h-8 rounded-md px-4 text-sm",
      lg: "h-12 rounded-md px-8 text-lg",
      icon: "h-10 w-10"
    };
    return sizes[size] || sizes.default;
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        getVariantClass(),
        getSizeClass(),
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };