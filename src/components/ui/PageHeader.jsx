/**
 * PageHeader simplificado para MVP - Sin hooks problemáticos
 * Encabezado consistente para todas las páginas
 */

import React from 'react';

const PageHeader = ({ title, subtitle, actions = null, compact = true, breadcrumb = null }) => {
  const renderBreadcrumb = () => {
    if (!breadcrumb) return <div className="text-muted-foreground mb-1 text-sm font-medium">Sección</div>;
    if (typeof breadcrumb === 'string') return <div className="text-muted-foreground mb-1 text-sm font-medium">{breadcrumb}</div>;

    if (Array.isArray(breadcrumb)) {
      return (
        <nav className="text-muted-foreground mb-1 text-sm font-medium" aria-label="Breadcrumb">
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
    <header className="bg-background border-b pb-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          {renderBreadcrumb()}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-base">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
