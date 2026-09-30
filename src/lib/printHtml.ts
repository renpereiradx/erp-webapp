/**
 * printHtml — imprime HTML en un iframe efímero (patrón counterorders).
 *
 * La SPA no tiene print CSS: `window.print()` directo imprime la app entera
 * (anti-patrón documentado en features/counterorders/utils/printTicket.ts).
 * El HTML viaja a un iframe oculto con los estilos inline en el propio markup,
 * porque el iframe no hereda la hoja de estilos de la SPA.
 *
 * `pageCss` define la geometría de página: thermal 80mm para tickets,
 * A4 para reportes. La llamada es síncrona para el caller; el iframe se
 * autodestruye (1s cubre el diálogo de impresora sin dejar nodos colgados).
 * Aislado del DOM en un util para mockearlo en tests (jsdom no implementa
 * print).
 */

export interface PrintHtmlOptions {
  /** Contenido del <body> del documento impreso (con estilos inline). */
  body: string
  /** <title> del documento impreso (nombre default del diálogo). */
  title: string
  /** Regla @page + estilos base; default A4 con márgenes de 12mm. */
  pageCss?: string
}

const DEFAULT_PAGE_CSS =
  '@page { size: A4 portrait; margin: 12mm; } ' +
  "body { margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #000; background: #fff; }"

export function printHtml({ body, title, pageCss }: PrintHtmlOptions): void {
  if (typeof document === 'undefined') return
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(
    `<html><head><title>${title}</title><style>${pageCss ?? DEFAULT_PAGE_CSS}</style></head><body>${body}</body></html>`,
  )
  doc.close()
  // El print necesita un tick para pintar el srcdoc; el iframe se autodestruye.
  const win = iframe.contentWindow
  if (win) {
    win.focus()
    win.print()
  }
  window.setTimeout(() => {
    iframe.remove()
  }, 1000)
}
