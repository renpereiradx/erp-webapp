/**
 * Componente Button reutilizable con estilo Neo-Brutalista
 * Utiliza Tailwind CSS para estilos brutalist con bordes gruesos y sombras pronunciadas
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Definición de variantes usando class-variance-authority con estilo neo-brutalista
const buttonVariants = cva(
  // Estilos base neo-brutalistas
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-black uppercase tracking-wide ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-gray-50",
        primary: "bg-black text-white hover:bg-gray-800",
        lime: "bg-brutalist-lime text-black hover:bg-lime-400",
        blue: "bg-brutalist-blue text-white hover:bg-blue-600",
        pink: "bg-brutalist-pink text-white hover:bg-pink-600",
        orange: "bg-brutalist-orange text-white hover:bg-orange-600",
        purple: "bg-brutalist-purple text-white hover:bg-purple-600",
        green: "bg-brutalist-green text-white hover:bg-emerald-600",
        red: "bg-brutalist-red text-white hover:bg-red-600",
        yellow: "bg-brutalist-yellow text-black hover:bg-yellow-400",
        destructive: "bg-brutalist-red text-white hover:bg-red-600",
        outline: "border-4 border-black bg-white text-black hover:bg-gray-50",
        secondary: "bg-gray-200 text-black hover:bg-gray-300",
        ghost: "border-0 shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0 hover:bg-gray-100",
        link: "border-0 shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0 text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };

