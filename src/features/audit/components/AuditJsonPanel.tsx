interface AuditJsonPanelProps {
  title: string
  content: string
  testId?: string
}

/**
 * Bloque `<pre>` con un JSONB real (`old_values`/`new_values`/`metadata`).
 * Solo se monta cuando el dominio encontró contenido: nunca un `{}` vacío
 * presentado como cambio registrado.
 */
export const AuditJsonPanel = ({ title, content, testId }: AuditJsonPanelProps) => (
  <div className="space-y-xs" data-testid={testId}>
    <h3 className="text-body-md-bold text-foreground">{title}</h3>
    <pre className="max-h-80 overflow-auto rounded-md bg-surface-muted p-md font-data-mono text-data-mono text-foreground">
      {content}
    </pre>
  </div>
)

export default AuditJsonPanel
