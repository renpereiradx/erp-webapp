/**
 * Componente Button simplificado para MVP - Sin hooks problemáticos
 * Versión simplificada que funciona sin dependencias de contexto
 * Actualizado para soportar sistema de temas
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useThemeStyles } from '@/hooks/useThemeStyles';

/**
 * Button temático unificado.
 * Usa la configuración de `useThemeStyles` (STYLE_CONFIG) para mapear variantes por tipo de design system.
 * Mantiene compatibilidad con variantes legacy (outline, link) usando fallbacks.
 */
const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', asChild = false, disabled, ...props }, ref) => {
  const Comp = asChild ? 'span' : 'button';
  const { styles, isMaterial, isFluent, isNeoBrutalism } = useThemeStyles();

  // Mapear aliases Material 3 si aplica
  const materialAlias = (v) => {
    if (!isMaterial) return v;
    const map = {
      primary: 'filled',
      secondary: 'outlined',
      ghost: 'text'
    };
    return map[v] || v;
  };

  const resolvedVariant = materialAlias(variant);

  // Clases base accesibles y neutrales
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all';

  // Obtener cadena de estilos del tema (solo cubre primary/secondary/destructive/ghost)
  const themed = styles.button(resolvedVariant) || styles.button(variant) || '';

  // Fallbacks para variantes no definidas en algunos temas
  const ensureVariantLayer = () => {
    if (/link/.test(variant)) return 'bg-transparent underline-offset-4 text-primary hover:underline';
    if (/outline|outlined/.test(variant) && !/border/.test(themed)) return 'border border-border bg-transparent text-foreground hover:bg-accent/5';
    // Si themed ya trae fondo/texto asumimos suficiente.
    if (themed) return '';
    return 'bg-primary text-primary-foreground hover:bg-primary/90';
  };

  const sizeClasses = (() => {
    switch (size) {
      case 'sm': return 'h-8 px-3 text-xs rounded-md';
      case 'lg': return isMaterial ? 'h-12 px-8 text-base rounded-[28px]' : 'h-12 px-8 text-base rounded-md';
      case 'icon': return isMaterial ? 'h-10 w-10 p-0 rounded-full' : 'h-10 w-10 p-0 rounded-md';
      default: return isMaterial ? 'h-10 px-6 py-2 rounded-[20px] text-sm' : 'h-10 px-4 py-2 text-sm rounded-md';
    }
  })();

  // Añadir clase de rol del design system para que los CSS temáticos (material/fluent/brutalist) apliquen comportamientos extra.
  const designSystemMarker = cn({
    'md-button': isMaterial,
    'fluent-button-wrapper': isFluent, // marcador opcional si se quiere apuntar desde CSS futuro
    'brutalist-button': isNeoBrutalism
  });

  return (
    <Comp
      ref={ref}
      disabled={disabled}
      className={cn(base, themed, ensureVariantLayer(), sizeClasses, designSystemMarker, className)}
      data-variant={variant}
      data-resolved-variant={resolvedVariant}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };