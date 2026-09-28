import Fuse from 'fuse.js'

// Reemplazo directo de `lista.filter(x => texto(x).toLowerCase().includes(q.toLowerCase()))`
// que tolera errores de tipeo y orden de palabras distinto. Con query vacía devuelve la
// lista tal cual (mismo comportamiento que el substring: todo coincide con '').
export function fuzzyFilter(items, query, toText, options = {}) {
  const q = (query || '').trim()
  if (!q) return items
  const texts = items.map(toText)
  const fuse = new Fuse(texts, { threshold: 0.35, ignoreLocation: true, ...options })
  return fuse.search(q).map(r => items[r.refIndex])
}
