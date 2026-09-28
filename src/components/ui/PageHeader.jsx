/**
 * PageHeader simplificado para MVP - Sin hooks problemáticos
 * Encabezado consistente para todas las páginas
 */

import React from 'react';

/** @param {{ title?: any; subtitle?: any; actions?: React.ReactNode; compact?: boolean; breadcrumb?: any }} props */
const PageHeader = ({ title, subtitle, actions = null, compact = true, breadcrumb = null }) => {
  const renderBreadcrumb = () => {
    if (!breadcrumb) return null;
    if (typeof breadcrumb === 'string') return <div className="text-body-md text-on-surface-deep mb-xs">{breadcrumb}</div>;

    if (Array.isArray(breadcrumb)) {
      return (
        <nav className="text-body-md text-on-surface-deep mb-xs" aria-label="Breadcrumb">
          <ol className="inline-flex items-center gap-xs">
            {breadcrumb.map((item, idx) => (
              <li key={idx} className="inline-flex items-center">
                {item.href ? (
                  <a href={item.href} className="text-primary hover:underline">
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
                {idx < breadcrumb.length - 1 && <span className="mx-xs opacity-60">·</span>}
              </li>
            ))}
          </ol>
        </nav>
      );
    }

    return null;
  };

  return (
    <header className="pb-md mb-lg border-b border-divider">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="flex-1">
          {renderBreadcrumb()}
          <div className="space-y-xs">
            <h1 className="text-headline-lg text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-body-md text-on-surface-deep">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="shrink-0">
            <div className="flex items-center gap-sm">
              {actions}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
