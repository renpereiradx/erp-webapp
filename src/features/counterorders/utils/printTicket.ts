// ===========================================================================
// printTicket (FASE 5 — ticket del pedido, render 100% FE)
// Delega en el util compartido src/lib/printHtml.ts (iframe oculto): la
// página NO tiene print CSS y el patrón window.print() imprimiría la app
// entera. Aquí solo vive la geometría thermal 80mm; los estilos del ticket
// van inline en el propio markup (OrderTicketContent), porque el iframe no
// hereda la hoja de estilos de la SPA.
// La firma exportada se mantiene (TransferTicketModal + tests la consumen).
// ===========================================================================

import { printHtml } from '@/lib/printHtml'

const TICKET_80MM_PAGE_CSS =
  '@page { size: 80mm auto; margin: 4mm; } ' +
  "body { margin: 0; font-family: 'Courier New', ui-monospace, monospace; color: #000; background: #fff; }"

/** Inyecta `innerHtml` en un iframe efímero y dispara la impresión. */
export function printTicketHtml(innerHtml: string, title: string): void {
  printHtml({ body: innerHtml, title, pageCss: TICKET_80MM_PAGE_CSS })
}
