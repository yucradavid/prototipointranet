const copy = value => JSON.parse(JSON.stringify(value))

// ─── Requisitos estructurados ────────────────────────────────────────────────
// Cada requisito es un objeto con:
//   label       : texto que se muestra al solicitante
//   type        : 'form'       – dato que ya existe en el formulario (no adjunto)
//                 'document'   – archivo / enlace externo que debe adjuntar
//                 'payment'    – comprobante de pago del derecho de trámite
//                 'condition'  – condición que revisa una oficina (no la aporta el solicitante)
//   required    : true | false | 'conditional'
//   note        : (opcional) aclaración breve sobre la condición o el documento
//
// Helper: convierte el campo `requires` (string legado) en array estructurado.
// Se usa durante la migración y como fallback en la UI.
export function parseRequiresString(str) {
  if (!str || !str.trim()) return []
  return str.split('+').map(s => s.trim()).filter(Boolean).map(label => ({
    label,
    type: /pago|recibo|comprobante/i.test(label) ? 'payment'
         : /FUT|formulario/i.test(label) ? 'form'
         : 'document',
    required: true,
  }))
}

// Devuelve los requisitos como array normalizado (migra strings legacy automáticamente).
export function getRequirementsArray(procedure) {
  if (Array.isArray(procedure?.requirementsList) && procedure.requirementsList.length > 0)
    return procedure.requirementsList
  return parseRequiresString(procedure?.requires || '')
}

// Solo los requisitos que el solicitante debe presentar al enviar la solicitud
// (excluyendo condiciones internas y el comprobante de pago, que tiene su propio bloque).
export function getApplicantRequirements(procedure) {
  return getRequirementsArray(procedure).filter(r => r.type !== 'condition' && r.type !== 'payment')
}

// A conditional document requires an explicit applies / does not apply choice.
export function requirementSatisfied(r) {
  if(r.required==='conditional' && r.applies==null) return false
  if(r.required==='conditional' && r.applies===false) return true
  if(r.required===false && !r.checked && !r.url?.trim()) return true
  return !!r.checked && (r.type==='form' || !!r.url?.trim())
}

export function requirementIncluded(r) {
  return r.type!=='form' && r.checked && !!r.url?.trim() &&
    (r.required!=='conditional' || r.applies===true)
}

// ─── Normalización del procedimiento ────────────────────────────────────────
// Existing catalog values remain operational; migration does not certify their source.
export function normalizeProcedure(procedure) {
  const base = {
    active: true,
    source: '',
    validFrom: '',
    verificationStatus: 'pending',
    requirementsList: [],
    ...procedure,
    tariffStatus: procedure.tariffStatus || (procedure.monto == null ? 'pending' : Number(procedure.monto) === 0 ? 'free' : 'fixed'),
  }
  // Migración: si requirementsList está vacío pero hay requires (texto legacy), poblar automáticamente.
  if ((!base.requirementsList || base.requirementsList.length === 0) && base.requires) {
    base.requirementsList = parseRequiresString(base.requires)
  }
  return base
}

export function canRequestProcedure(procedure) {
  return !!procedure && procedure.active !== false && procedure.tariffStatus !== 'pending' &&
    procedure.monto != null && Number.isFinite(Number(procedure.monto)) && Number(procedure.monto) >= 0
}

export function captureProcedure(procedure, origin = 'registration') {
  return { ...copy(normalizeProcedure(procedure)), snapshotOrigin: origin }
}

export function preserveProcedureTerms(items, procedures) {
  return items.map(exp => {
    if (exp.procedureSnapshot) return exp
    const procedure = procedures.find(p => p.id === exp.procedureId)
    // Legacy data has no historical catalog: freeze the available value and identify
    // its provenance explicitly instead of claiming it was the original tariff.
    const snapshot = procedure ? captureProcedure(procedure, 'legacy_catalog') : {
      id: exp.procedureId, name: exp.asunto || exp.procedureId,
      monto: null, sla: null, requires: '', requirementsList: [], tariffStatus: 'pending',
      snapshotOrigin: 'legacy_missing_catalog',
    }
    return { ...exp, procedureSnapshot: snapshot }
  })
}
