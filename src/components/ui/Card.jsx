/**
 * Componente Card reutilizable con estilo Neo-Brutalista
 * Incluye bordes gruesos, sombras pronunciadas y componentes relacionados
 */

import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-black uppercase tracking-wide leading-none",
      // Responsive typography
      "sm:text-xl md:text-2xl",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm font-bold text-gray-600 uppercase tracking-wide",
      // Responsive typography
      "sm:text-sm md:text-base",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0",
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
      "flex items-center p-6 pt-0",
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
  const colorClasses = {
    white: "bg-white",
    lime: "bg-brutalist-lime",
    blue: "bg-brutalist-blue", 
    pink: "bg-brutalist-pink",
    orange: "bg-brutalist-orange",
    purple: "bg-brutalist-purple",
    green: "bg-brutalist-green",
    red: "bg-brutalist-red",
    yellow: "bg-brutalist-yellow",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 text-black transition-all duration-150 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
        colorClasses[color] || colorClasses.white,
        className
      )}
      {...props}
    />
  );
});
MetricCard.displayName = "MetricCard";

const BrutalistBadge = React.forwardRef(({ className, color = "lime", children, ...props }, ref) => {
  const colorClasses = {
    lime: "bg-brutalist-lime text-black",
    blue: "bg-brutalist-blue text-white", 
    pink: "bg-brutalist-pink text-white",
    orange: "bg-brutalist-orange text-white",
    purple: "bg-brutalist-purple text-white",
    green: "bg-brutalist-green text-white",
    red: "bg-brutalist-red text-white",
    yellow: "bg-brutalist-yellow text-black",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center border-2 border-black font-black text-xs px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide",
        colorClasses[color] || colorClasses.lime,
        className
      )}
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

