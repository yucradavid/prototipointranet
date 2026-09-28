// jsPDF trae html2canvas y DOMPurify como dependencias transitivas del paquete
// (varios cientos de KB) aunque acá no se use ninguna de las dos. Se importa de forma
// perezosa para que ese peso no entre al bundle principal — este archivo lo usa
// ApplicantPortalView.jsx, que NO es una vista lazy (App.jsx la importa estática para
// todos los roles), así que un import estático de 'jspdf' aquí lo descargaría todo
// usuario en la carga inicial, use o no esta función.
async function loadJsPDF() {
  const { jsPDF } = await import('jspdf')
  return jsPDF
}

// Construye el PDF de la respuesta oficial de un trámite finalizado. Antes este
// documento se entregaba como texto plano con extensión .pdf falsa; mismos datos,
// ahora en un PDF real con el membrete institucional (igual al de CargoModal.jsx).
export async function buildRespuestaPdf(exp) {
  const jsPDF = await loadJsPDF()
  const doc = new jsPDF()
  const marginX = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - marginX * 2
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('INSTITUTO DE EDUCACIÓN SUPERIOR TECNOLÓGICO PÚBLICO', pageWidth / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(14)
  doc.text('"ALIANZA RENOVADA ICHUÑA BÉLGICA"', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Revalidado con RM N.° 0353-2004-ED · Ichuña, Moquegua', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setDrawColor(9, 26, 43) // #091a2b, mismo tono que el membrete de CargoModal
  doc.setLineWidth(0.6)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('RESPUESTA OFICIAL DE TRÁMITE', pageWidth / 2, y, { align: 'center' })
  y += 12

  const field = (label, value) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${label}:`, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value ?? '—'), marginX + 42, y)
    y += 7
  }

  field('Expediente', exp.numero)
  field('Código', exp.tracking)
  field('Trámite', exp.asunto)
  field('Solicitante', exp.solicitante)
  field('DNI', exp.dni)
  field('Fecha de emisión', exp.fecha)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DETALLE DE RESOLUCIÓN', marginX, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(exp.respuesta || 'Sin detalle registrado.', contentWidth)
  doc.text(lines, marginX, y)
  y += lines.length * 5 + 12

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text('Documento emitido conforme a los reglamentos del IESTP ARIB.', pageWidth / 2, y, { align: 'center' })

  return doc
}

// El motor de flujo (workflowEngine.js) o una oficina pueden asignar cualquier
// nombre libre al documento de respuesta — esto garantiza que la descarga siempre
// termine en .pdf real, sin importar lo que traiga exp.documentoRespuesta.
export function ensurePdfExtension(name, fallback) {
  const base = (name || fallback || 'Respuesta.pdf').trim()
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`
}

export async function downloadRespuestaPdf(exp) {
  const doc = await buildRespuestaPdf(exp)
  const filename = ensurePdfExtension(exp.documentoRespuesta, `Respuesta_EXP_${exp.numero}.pdf`)
  doc.save(filename)
}
