const MAX_SOURCE_BYTES = 15 * 1024 * 1024 // sanity cap on the original file, before compression
const MAX_PDF_BYTES = 1.5 * 1024 * 1024 // PDFs aren't recompressed client-side, so cap them directly

const readAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
  reader.readAsDataURL(file)
})

// Convierte una imagen a un data: URL comprimido (JPEG, redimensionado) para que quepa
// cómodamente en localStorage sin backend real. PDFs se leen tal cual, con un tope de
// tamaño más estricto porque no se pueden recomprimir en el cliente.
export function fileToCompressedDataUrl(file, { maxDim = 1000, quality = 0.72 } = {}) {
  if (!file) return Promise.reject(new Error('Selecciona un archivo.'))
  if (file.size > MAX_SOURCE_BYTES) return Promise.reject(new Error('El archivo es demasiado pesado (máx. 15 MB).'))

  if (!file.type.startsWith('image/')) {
    if (file.size > MAX_PDF_BYTES) return Promise.reject(new Error('El PDF pesa demasiado (máx. 1.5 MB). Usa una foto/captura en su lugar.'))
    return readAsDataUrl(file)
  }

  return readAsDataUrl(file).then(src => new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
    img.src = src
  }))
}

export const isDataUrl = url => typeof url === 'string' && url.startsWith('data:')
