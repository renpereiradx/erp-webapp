/**
 * Sonner simplificado para MVP - Sin hooks problemáticos
 * Versión básica que funciona sin dependencias de contexto
 */

import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={{
        "--normal-bg": "hsl(var(--popover))",
        "--normal-text": "hsl(var(--popover-foreground))",
        "--normal-border": "hsl(var(--border))"
      }}
      {...props} 
    />
  );
}

export { Toaster }
