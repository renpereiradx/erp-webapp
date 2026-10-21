import type { ReactNode } from 'react'

interface ForecastPageLayoutProps {
  title: string
  subtitle: string
  /** Metadato real ya localizado (`Generado: 21 oct 2026, 15:03`). */
  meta?: string
  /** Controles de la pantalla (selectores + refresh), debajo del encabezado. */
  toolbar?: ReactNode
  children: ReactNode
}

/**
 * Shell de las 5 pantallas de Pronósticos.
 *
 * No reusa `PageHeader` porque ese componente pone título y subtítulo en la
 * misma línea: con títulos largos ("Pronóstico de demanda") y 3 selectores de
 * horizonte, el título quedaba en una columna de 4 líneas. Acá el encabezado
 * apila título/subtítulo y los controles viven en su propia fila con etiqueta
 * visible, así ningún selector se corta a 1440 px.
 */
export const ForecastPageLayout = ({
  title,
  subtitle,
  meta,
  toolbar,
  children,
}: ForecastPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
      <header className="mb-lg border-b border-divider pb-md pt-md">
        <h1 className="text-headline-lg text-foreground">{title}</h1>
        <p className="mt-xs max-w-prose text-body-md text-on-surface-deep">
          {meta ? `${subtitle} · ${meta}` : subtitle}
        </p>
      </header>
      {toolbar ? (
        <div className="mb-lg flex flex-col gap-md rounded-md border border-border-subtle bg-surface p-md shadow-whisper md:flex-row md:items-end md:justify-between">
          {toolbar}
        </div>
      ) : null}
      <div className="space-y-xl">{children}</div>
    </div>
  </div>
)

export default ForecastPageLayout
