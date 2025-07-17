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
        fontSize: '3.5rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        fontFamily: 'inherit'
      },
      subtitle: {
        fontSize: '1.5rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      heading: {
        fontSize: '1.875rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.4'
      },
      small: {
        fontSize: '0.875rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }
    };
    return styles[type] || styles.base;
  } else if (isMaterial) {
    const styles = {
      title: {
        fontSize: '2.5rem',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.2',
        fontFamily: '"Roboto", sans-serif'
      },
      subtitle: {
        fontSize: '1.5rem',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      heading: {
        fontSize: '1.25rem',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.5'
      },
      small: {
        fontSize: '0.875rem',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal'
      }
    };
    return styles[type] || styles.base;
  } else if (isFluent) {
    const styles = {
      title: {
        fontSize: '2.25rem',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.2',
        fontFamily: '"Segoe UI", sans-serif'
      },
      subtitle: {
        fontSize: '1.375rem',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      heading: {
        fontSize: '1.125rem',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.3'
      },
      base: {
        fontSize: '0.875rem',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal',
        lineHeight: '1.4'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 'normal'
      }
    };
    return styles[type] || styles.base;
  }
  return {};
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
      margin: '8px',
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
      transition: 'all 150ms ease'
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
      boxShadow: 'none',
      transition: 'all 200ms ease'
    };
  } else if (isFluent) {
    return {
      background: 'var(--input)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '0.875rem',
      fontWeight: '400',
      color: 'var(--foreground)',
      boxShadow: 'none',
      transition: 'all 150ms ease'
    };
  }
  return {};
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
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      },
      secondary: {
        background: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      }
    };
    return variants[variant] || variants.primary;
  } else if (isMaterial) {
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: '20px',
        padding: '12px 24px',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      },
      secondary: {
        background: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: 'none',
        borderRadius: '20px',
        padding: '12px 24px',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
    return variants[variant] || variants.primary;
  } else if (isFluent) {
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 16px',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 150ms ease-out'
      },
      secondary: {
        background: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 16px',
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 'normal',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 150ms ease-out'
      }
    };
    return variants[variant] || variants.primary;
  }
  return {};
};

export const getThemeGridLayout = (theme) => {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: theme?.includes('neo-brutalism') ? '2rem' : '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto'
  };
};
