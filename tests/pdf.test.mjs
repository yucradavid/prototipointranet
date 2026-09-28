import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRespuestaPdf, ensurePdfExtension } from '../src/utils/pdf.js'

const exp = {
  numero: 5225,
  tracking: 'ARIB-5225',
  asunto: 'Constancia de biblioteca',
  solicitante: 'Juan Carlos Mamani',
  dni: '70223344',
  fecha: '24/09/2026',
  respuesta: 'Se entrega la constancia solicitada conforme a lo indicado por el usuario.',
  documentoRespuesta: 'Respuesta_5225.pdf',
}

test('buildRespuestaPdf genera un documento PDF con contenido real', async () => {
  const doc = await buildRespuestaPdf(exp)
  const bytes = doc.output('arraybuffer')
  assert.ok(bytes.byteLength > 500, `esperaba un PDF con contenido, obtuvo ${bytes.byteLength} bytes`)
})

test('buildRespuestaPdf no revienta con una respuesta larga (ajuste de línea)', async () => {
  const largo = { ...exp, respuesta: 'Detalle extenso. '.repeat(60) }
  const doc = await buildRespuestaPdf(largo)
  assert.ok(doc.output('arraybuffer').byteLength > 500)
})

test('ensurePdfExtension siempre agrega .pdf si falta, sin duplicarlo', () => {
  assert.equal(ensurePdfExtension('Respuesta_5225.pdf'), 'Respuesta_5225.pdf')
  assert.equal(ensurePdfExtension('Respuesta_5225'), 'Respuesta_5225.pdf')
  assert.equal(ensurePdfExtension('', 'Respuesta_EXP_5225.pdf'), 'Respuesta_EXP_5225.pdf')
  assert.equal(ensurePdfExtension(null, null), 'Respuesta.pdf')
})
