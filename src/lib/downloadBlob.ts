/**
 * Descarga de un blob con el nombre sugerido por el backend.
 *
 * `window.open` no sirve para endpoints protegidos (no manda el header
 * Authorization) y `URL.createObjectURL` no está en jsdom: si el navegador no
 * lo soporta, se lanza un error para que la pantalla lo muestre en vez de
 * simular una descarga exitosa.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('El navegador no soporta la descarga de archivos')
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
