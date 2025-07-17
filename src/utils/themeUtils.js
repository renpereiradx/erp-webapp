/**
 * Utilidades de diseño multi-tema para el sistema ERP
 * Incluye helpers para Neo-Brutalism, Material Design y Fluent Design
 */

export const getThemeTypography = (type, theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    const styles = {
      title: {
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        lineHeight: '1.1',
        fontFamily: 'inherit'
      },
      subtitle: {
        fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.2'
      },
      heading: {
        fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.2'
      },
      base: {
        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.4'
      },
      small: {
        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      caption: {
        fontSize: 'clamp(0.7rem, 1vw, 0.875rem)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }
    };
    return styles[type] || styles.base;
  } else if (isMaterial) {
    const styles = {
      title: {
        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: '-0.015em',
        lineHeight: '1.2',
        fontFamily: '"Roboto", sans-serif'
      },
      subtitle: {
        fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3',
        fontFamily: '"Roboto", sans-serif'
      },
      heading: {
        fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3',
        fontFamily: '"Roboto", sans-serif'
      },
      base: {
        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.5',
        fontFamily: '"Roboto", sans-serif'
      },
      small: {
        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontFamily: '"Roboto", sans-serif'
      },
      caption: {
        fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: '0.025em',
        fontFamily: '"Roboto", sans-serif'
      }
    };
    return styles[type] || styles.base;
  } else if (isFluent) {
    const styles = {
      title: {
        fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.2',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      },
      subtitle: {
        fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      },
      heading: {
        fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      },
      base: {
        fontSize: 'clamp(0.875rem, 1vw, 1rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.5',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      },
      small: {
        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      },
      caption: {
        fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      }
    };
    return styles[type] || styles.base;
  } else {
    // Default theme
    const styles = {
      title: {
        fontSize: 'clamp(1.875rem, 3vw, 2.25rem)',
        fontWeight: '700',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.2'
      },
      subtitle: {
        fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      heading: {
        fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      base: {
        fontSize: 'clamp(0.875rem, 1vw, 1rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.5'
      },
      small: {
        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal'
      },
      caption: {
        fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal'
      }
    };
    return styles[type] || styles.base;
  }
};

export const getThemeCardStyles = (theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    return {
      background: 'var(--background)',
      border: '4px solid var(--border)',
      borderRadius: '0px',
      boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      color: 'var(--foreground)',
      fontWeight: 'bold',
      padding: '24px',
      margin: '0',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 200ms ease, box-shadow 200ms ease'
    };
  } else if (isMaterial) {
    return {
      background: 'var(--card)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
      color: 'var(--card-foreground)',
      fontFamily: '"Roboto", sans-serif',
      fontWeight: 'normal',
      padding: '20px',
      transition: 'box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      elevation: '2'
    };
  } else if (isFluent) {
    return {
      background: 'var(--fluent-surface-card, var(--card))',
      border: '1px solid var(--fluent-neutral-stroke-1, var(--border))',
      borderRadius: '8px',
      boxShadow: 'var(--fluent-elevation-4, 0 4px 16px rgba(0,0,0,0.08))',
      color: 'var(--fluent-text-primary, var(--card-foreground))',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      fontWeight: 'normal',
      padding: '16px',
      transition: 'box-shadow 300ms cubic-bezier(0.1, 0.9, 0.2, 1), transform 300ms cubic-bezier(0.1, 0.9, 0.2, 1)',
      backdropFilter: 'blur(16px)',
      borderTopColor: 'rgba(255,255,255,0.1)'
    };
  } else {
    return {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      color: 'var(--card-foreground)',
      fontWeight: 'normal',
      padding: '16px',
      transition: 'all 200ms ease'
    };
  }
};

export const getThemeInputStyles = (theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    return {
      background: 'var(--input)',
      border: '3px solid var(--border)',
      borderRadius: '0px',
      padding: '12px 16px',
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--foreground)',
      boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
      transition: 'all 150ms ease',
      textTransform: 'uppercase',
      letterSpacing: '0.025em'
    };
  } else if (isMaterial) {
    return {
      background: 'var(--input)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '1rem',
      fontWeight: '400',
      color: 'var(--foreground)',
      fontFamily: '"Roboto", sans-serif',
      boxShadow: 'none',
      transition: 'border-color 200ms ease, box-shadow 200ms ease'
    };
  } else if (isFluent) {
    return {
      background: 'var(--fluent-surface-primary, var(--input))',
      border: '1px solid var(--fluent-neutral-stroke-1, var(--border))',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '0.875rem',
      fontWeight: '400',
      color: 'var(--fluent-text-primary, var(--foreground))',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      boxShadow: 'var(--fluent-elevation-2, 0 1px 2px rgba(0,0,0,0.04))',
      transition: 'border-color 150ms ease, box-shadow 150ms ease'
    };
  } else {
    return {
      background: 'var(--input)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '10px 14px',
      fontSize: '0.875rem',
      fontWeight: '400',
      color: 'var(--foreground)',
      boxShadow: 'none',
      transition: 'border-color 200ms ease'
    };
  }
};

export const getThemeButtonStyles = (variant, theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        padding: '16px 32px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '1rem',
        lineHeight: '1',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        padding: '16px 32px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '1rem',
        lineHeight: '1',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        cursor: 'pointer'
      }
    };
    return variants[variant] || variants.primary;
  } else if (isMaterial) {
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: '24px',
        padding: '12px 24px',
        fontFamily: '"Roboto", sans-serif',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.025em',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      },
      secondary: {
        background: 'transparent',
        color: 'var(--primary)',
        border: '1px solid var(--primary)',
        borderRadius: '24px',
        padding: '12px 24px',
        fontFamily: '"Roboto", sans-serif',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.025em',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: 'none',
        transition: 'background-color 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }
    };
    return variants[variant] || variants.primary;
  } else if (isFluent) {
    const variants = {
      primary: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var(--primary-foreground))',
        border: '1px solid transparent',
        borderRadius: '4px',
        padding: '8px 16px',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: 'var(--fluent-elevation-4, 0 2px 8px rgba(0,0,0,0.1))',
        transition: 'all 300ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--fluent-surface-secondary, var(--secondary))',
        color: 'var(--fluent-text-primary, var(--secondary-foreground))',
        border: '1px solid var(--fluent-neutral-stroke-1, var(--border))',
        borderRadius: '4px',
        padding: '8px 16px',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: 'var(--fluent-elevation-2, 0 1px 4px rgba(0,0,0,0.08))',
        transition: 'all 300ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        cursor: 'pointer'
      }
    };
    return variants[variant] || variants.primary;
  } else {
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: '1px solid transparent',
        borderRadius: '6px',
        padding: '10px 20px',
        fontWeight: '500',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 200ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '10px 20px',
        fontWeight: '500',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 200ms ease',
        cursor: 'pointer'
      }
    };
    return variants[variant] || variants.primary;
  }
};

export const getThemeGridLayout = (theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '32px',
      padding: '24px 0'
    };
  } else if (isMaterial) {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px',
      padding: '16px 0'
    };
  } else if (isFluent) {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      padding: '20px 0'
    };
  } else {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      padding: '16px 0'
    };
  }
};

// Helper para hover effects específicos por tema
export const getThemeHoverEffects = (theme) => {
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  if (isNeoBrutalist) {
    return {
      onMouseEnter: (e) => {
        e.currentTarget.style.transform = 'translate(-3px, -3px)';
        e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.transform = 'translate(0px, 0px)';
        e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
      }
    };
  } else if (isMaterial) {
    return {
      onMouseEnter: (e) => {
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0px)';
      }
    };
  } else if (isFluent) {
    return {
      onMouseEnter: (e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0px)';
      }
    };
  } else {
    return {
      onMouseEnter: (e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
    };
  }
};
