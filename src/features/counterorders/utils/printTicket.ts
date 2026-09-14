// ===========================================================================
// printTicket (FASE 5 — ticket del pedido, render 100% FE)
// Imprime el ticket vía iframe oculto: la página NO tiene print CSS y el
// patrón window.print() de SalesPaymentHistory imprimiría la app entera. El
// HTML viaja como srcdoc con @page 80mm (thermal-friendly); los estilos del
// ticket van inline en el propio markup (OrderTicketContent), porque el
// iframe no hereda la hoja de estilos de la SPA.
// Aislado en un util para mockearlo en tests (jsdom no implementa print).
// ===========================================================================

/** Inyecta `innerHtml` en un iframe efímero y dispara la impresión. */
export function printTicketHtml(innerHtml: string, title: string): void {
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
    `<html><head><title>${title}</title><style>` +
      `@page { size: 80mm auto; margin: 4mm; }` +
      `body { margin: 0; font-family: 'Courier New', ui-monospace, monospace; color: #000; background: #fff; }` +
      `</style></head><body>${innerHtml}</body></html>`,
  )
  doc.close()
  // El print necesita un tick para pintar el srcdoc; el iframe se autodestruye
  // (1s cubre el diálogo de impresora sin dejar nodos colgados).
  const win = iframe.contentWindow
  if (win) {
    win.focus()
    win.print()
  }
  window.setTimeout(() => {
    iframe.remove()
  }, 1000)
}
