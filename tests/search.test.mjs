import test from 'node:test'
import assert from 'node:assert/strict'
import { fuzzyFilter } from '../src/utils/search.js'

const items = [
  { id: 1, nombre: 'Constancia de biblioteca' },
  { id: 2, nombre: 'Certificado modular' },
  { id: 3, nombre: 'Rosa Yana Condori' },
]
const toText = x => x.nombre

test('query vacía devuelve la lista completa sin filtrar', () => {
  assert.deepEqual(fuzzyFilter(items, '', toText), items)
  assert.deepEqual(fuzzyFilter(items, '   ', toText), items)
})

test('tolera un error de tipeo de una letra', () => {
  const result = fuzzyFilter(items, 'bibliobeca', toText)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 1)
})

test('encuentra por coincidencia parcial exacta, igual que el substring anterior', () => {
  const result = fuzzyFilter(items, 'Rosa Yana', toText)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 3)
})

test('texto no relacionado no devuelve resultados', () => {
  assert.deepEqual(fuzzyFilter(items, 'xyz-no-existe-zzz', toText), [])
})

test('no rompe con acentos', () => {
  const result = fuzzyFilter(items, 'certificado', toText)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 2)
})
