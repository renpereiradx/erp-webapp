import React from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';

/**
 * PageHeader
 * Encabezado compacto y consistente para todas las páginas (excepto Dashboard)
 * - Respeta el sistema de diseño (Material 3 / Fluent 2 / Neo-Brutalism)
 * - Usa tokens (bg-background, text-foreground, primary, muted-foreground)
 */
const PageHeader = ({ title, subtitle, actions = null, compact = true, breadcrumb = null }) => {
  const { header: themeHeader, label: themeLabel } = useThemeStyles();

  const renderBreadcrumb = () => {
    if (!breadcrumb) return <div className={`text-muted-foreground mb-1 ${themeLabel()}`}>Sección</div>;
    if (typeof breadcrumb === 'string') return <div className={`text-muted-foreground mb-1 ${themeLabel()}`}>{breadcrumb}</div>;

    if (Array.isArray(breadcrumb)) {
      return (
        <nav className={`text-muted-foreground mb-1 ${themeLabel()}`} aria-label="Breadcrumb">
          <ol className="inline-flex items-center gap-1">
            {breadcrumb.map((item, idx) => (
              <li key={idx} className="inline-flex items-center">
                {item.href ? (
                  <a href={item.href} className="text-primary hover:underline">
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
                {idx < breadcrumb.length - 1 && <span className="mx-2 opacity-60">·</span>}
              </li>
            ))}
          </ol>
        </nav>
      );
    }

    return null;
  };
  
  return (
    <header className={`text-center ${compact ? 'py-4' : 'py-8'}`} data-testid={props?.['data-testid'] ?? 'page-header'}>
      {renderBreadcrumb()}
      <h1 className={`${themeHeader('h1')} text-primary mb-1`} data-testid="page-header-title">{title}</h1>
      {subtitle && (
        <p className={`text-muted-foreground max-w-2xl mx-auto ${compact ? 'mb-4' : 'mb-6'} ${themeLabel()}`} data-testid="page-header-subtitle">{subtitle}</p>
      )}
      {actions && (
        <div className="flex flex-wrap justify-center gap-3" data-testid="page-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
