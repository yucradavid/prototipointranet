import React, { useEffect, useState } from 'react'
import { Plus, X, ArrowUp, ArrowDown, Route, ListChecks, FileText, BookMarked, Users2 } from 'lucide-react'
import { Modal, Field } from './ui'
import { normalizeProcedure, getRequirementsArray } from '../models/procedure.js'
import { officeName } from '../data/catalogs'

const REQ_TYPES = [
  { value: 'form',      label: 'Formulario',  hint: 'Dato del FUT (no requiere adjunto)' },
  { value: 'document',  label: 'Documento',   hint: 'Archivo o enlace que adjunta el solicitante' },
  { value: 'payment',   label: 'Pago',        hint: 'Comprobante de pago del derecho' },
  { value: 'condition', label: 'Condición',   hint: 'Condición que revisa una oficina interna' },
]

const emptyReq = { label: '', type: 'document', required: true, note: '' }
const emptyForm = {
  name: '', category: '', requires: '', requirementsList: [],
  sla: 3, monto: 0, active: true, tariffStatus: 'pending',
  verificationStatus: 'pending', source: '', validFrom: '',
  allowedCreators: ['applicant', 'secretaria'],
  requiresMesaPartes: true, requiresDireccion: true
}

const CREATOR_OPTIONS = [
  { value: 'applicant',  label: 'El solicitante (portal)' },
  { value: 'secretaria', label: 'Secretaría (ingreso físico)' },
  { value: 'office',     label: 'La oficina especializada de la ruta' },
]

// Encabezado visual reutilizable para cada bloque del formulario — antes solo
// "Requisitos del trámite" tenía uno, y el resto de campos flotaba sin agrupar
// (motivo de la queja de que el formulario era repetitivo y confuso de leer).
function SectionHeader({ icon: Icon, title, hint }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--arib-primary)' }}>
        <Icon size={15} />
        <span>{title}</span>
      </div>
      {hint && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{hint}</p>}
    </div>
  )
}

// Suffix del selector de oficinas: distingue Tesorería (la caja principal) de una
// sub-tesorería (cualquier otra oficina habilitada para cobrar, ej. Comisión de
// Admisión) — ambas comparten la misma capacidad `collectsPayment`, pero se explican
// distinto para que quede claro que las sub-tesorerías dependen de Tesorería.
const paymentSuffix = o => !o.collectsPayment ? '' : o.id === 'tesoreria' ? ' · caja principal' : ' · sub-tesorería de Tesorería'

export default function ProcedureFormModal({ procedure, offices, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...normalizeProcedure(procedure || emptyForm) })
  const [routeDraft, setRouteDraft] = useState(procedure?.route ? [...procedure.route] : [])
  const [reqs, setReqs] = useState(getRequirementsArray(procedure || emptyForm))
  const [reqTab, setReqTab] = useState('list') // 'list' | 'text'

  useEffect(() => {
    const normalized = normalizeProcedure(procedure || emptyForm)
    setForm({ ...emptyForm, ...normalized })
    setRouteDraft(procedure?.route ? [...procedure.route] : [])
    setReqs(getRequirementsArray(procedure || emptyForm))
  }, [procedure])

  const isEdit = !!procedure?.id
  const routableOffices = offices.filter(o => !['mesa_partes', 'direccion'].includes(o.id))
  const treasuryOffices = routableOffices.filter(o => o.collectsPayment)
  const operationalOffices = routableOffices.filter(o => !o.collectsPayment)
  const routeLabel = id => { const office = offices.find(o => o.id === id); return office ? `${office.name}${paymentSuffix(office)}` : id }

  const addRouteOffice = id => {
    if (id && !routeDraft.includes(id)) setRouteDraft([...routeDraft, id])
  }

  const moveRoute = (idx, dir) => {
    const n = [...routeDraft]
    const j = idx + dir
    if (j < 0 || j >= n.length) return
    ;[n[idx], n[j]] = [n[j], n[idx]]
    setRouteDraft(n)
  }

  const addReq = () => setReqs(r => [...r, { ...emptyReq }])
  const removeReq = i => setReqs(r => r.filter((_, xi) => xi !== i))
  const moveReq = (i, dir) => {
    const n = [...reqs]
    const j = i + dir
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    setReqs(n)
  }
  const updateReq = (i, patch) => setReqs(r => r.map((x, xi) => xi === i ? { ...x, ...patch } : x))

  const save = () => {
    if (!form.name.trim()) return
    const route = isEdit ? form.route : routeDraft
    // Sincronizar campo legacy `requires` desde la lista estructurada
    const requiresText = reqs.map(r => r.label).filter(Boolean).join(' + ')
    onSave({
      ...form,
      route,
      requires: requiresText,
      requirementsList: reqs,
      sla: Number(form.sla) || 1,
      monto: form.tariffStatus === 'pending' ? null : form.tariffStatus === 'free' ? 0 : Number(form.monto),
    })
  }

  const activeRoute = isEdit ? form.route : routeDraft

  return (
    <Modal
      open={!!procedure}
      onClose={onClose}
      title={isEdit ? 'Editar Tipo de Trámite' : 'Nuevo Tipo de Trámite'}
      subtitle="Configura los datos del trámite y las dependencias que evaluarán la solicitud."
      size="lg"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            disabled={!form.name.trim() || (!isEdit && !routeDraft.length)}
            onClick={save}
          >
            Guardar trámite
          </button>
        </>
      }
    >
      {/* ── Sección: Datos del trámite ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader icon={FileText} title="Datos del trámite" />
        <div className="form-grid two">
          <Field label="Nombre del trámite" required>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Constancia de estudios" />
          </Field>

          <Field label="Categoría / Tipo">
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej. Constancias, Certificados, Titulación" />
          </Field>

          <Field label="Estado de la tarifa" hint="Una tarifa pendiente impide nuevas solicitudes; no significa que sea gratuita.">
            <select value={form.tariffStatus} onChange={e => setForm({ ...form, tariffStatus: e.target.value })}>
              <option value="pending">Pendiente de definir</option>
              <option value="free">Gratuito</option>
              <option value="fixed">Importe fijo</option>
            </select>
          </Field>

          <Field
            label="Costo del trámite (S/)"
            hint={form.tariffStatus === 'pending' ? 'Pendiente de definir.' : form.tariffStatus === 'free' ? 'Sin costo.' : 'Importe fijo en soles.'}
          >
            <input
              type="number" min="0" step="0.01"
              disabled={form.tariffStatus !== 'fixed'}
              value={form.tariffStatus === 'free' ? 0 : form.monto ?? ''}
              onChange={e => setForm({ ...form, monto: e.target.value })}
            />
          </Field>

          <Field label="Plazo / SLA (días hábiles)" required hint="Tiempo máximo normativo">
            <input type="number" min="1" max="60" value={form.sla} onChange={e => setForm({ ...form, sla: e.target.value })} />
          </Field>

          <Field label="Disponibilidad">
            <select value={form.active ? 'active' : 'inactive'} onChange={e => setForm({ ...form, active: e.target.value === 'active' })}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo para nuevas solicitudes</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Sección: Trazabilidad normativa ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader icon={BookMarked} title="Trazabilidad normativa" hint="De dónde sale este trámite y qué tan confirmada está esa fuente — no afecta el flujo, solo la documentación." />
        <div className="form-grid two">
          <Field label="Documento fuente y referencia">
            <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Ej. TUSNE 2026 · fila 83" />
          </Field>

          <Field label="Vigencia desde">
            <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} />
          </Field>

          <Field label="Verificación de la fuente" hint="Registrar la referencia no confirma automáticamente su vigencia.">
            <select value={form.verificationStatus} onChange={e => setForm({ ...form, verificationStatus: e.target.value })}>
              <option value="pending">Pendiente de confirmar</option>
              <option value="confirmed">Confirmada por la institución</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Sección: Flujo de atención ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader icon={Users2} title="Flujo de atención" hint="Quién puede iniciarlo y si pasa por el registro y proveído estándar antes de llegar a la oficina especializada." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="¿Quién puede iniciar este trámite?" hint="Por defecto, el solicitante y Secretaría, igual que el resto del catálogo.">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {CREATOR_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.allowedCreators.includes(opt.value)}
                    onChange={e => setForm({
                      ...form,
                      allowedCreators: e.target.checked
                        ? [...form.allowedCreators, opt.value]
                        : form.allowedCreators.filter(v => v !== opt.value)
                    })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          <Field
            label="Pasos institucionales de entrada"
            hint="Puedes combinar cada paso de forma independiente. La ruta de oficinas siempre empieza después de los pasos que actives."
          >
            <div style={{ display: 'grid', gap: 8, padding: '10px 12px', background: 'var(--arib-surface-subtle)', border: '1px solid var(--arib-border)', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={form.requiresMesaPartes !== false} onChange={e => setForm({ ...form, requiresMesaPartes: e.target.checked })} />
                <span><b>Mesa de Partes</b><small style={{ display: 'block', color: 'var(--muted)', marginTop: 2 }}>Registra y valida la solicitud antes de derivarla.</small></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={form.requiresDireccion !== false} onChange={e => setForm({ ...form, requiresDireccion: e.target.checked })} />
                <span><b>Dirección General</b><small style={{ display: 'block', color: 'var(--muted)', marginTop: 2 }}>Emite el proveído institucional antes de la atención.</small></span>
              </label>
            </div>
          </Field>
          {!form.requiresMesaPartes && !form.requiresDireccion && isEdit && !(form.route || []).length && (
            <div className="rule-banner">
              <Route size={20} style={{ color: 'var(--arib-warning, #f59e0b)' }} />
              <div><b>Sin ruta publicada</b><span>Este trámite no tiene Mesa de Partes ni Dirección y todavía no tiene una ruta publicada. Publica al menos una oficina en el Diseñador de Rutas.</span></div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sección: Requisitos estructurados ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--arib-primary)' }}>
            <ListChecks size={15} />
            <span>Requisitos del trámite</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className={`btn${reqTab==='list'?' primary':' ghost'}`} style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setReqTab('list')}>Lista</button>
            <button type="button" className={`btn${reqTab==='text'?' primary':' ghost'}`} style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setReqTab('text')}>Texto legacy</button>
          </div>
        </div>

        {reqTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reqs.length === 0 && (
              <div style={{ padding: '10px 14px', background: 'var(--arib-surface-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--arib-navy-light)' }}>
                Sin requisitos definidos. Usa el botón para agregar.
              </div>
            )}
            {reqs.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', background: 'var(--arib-surface-subtle)', border: '1px solid var(--arib-border)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={{ flex: 1 }}
                      placeholder="Descripción del requisito"
                      value={r.label}
                      onChange={e => updateReq(i, { label: e.target.value })}
                    />
                    <select value={r.type} onChange={e => updateReq(i, { type: e.target.value })} style={{ width: 120 }}>
                      {REQ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select
                      value={String(r.required)}
                      onChange={e => updateReq(i, { required: e.target.value === 'conditional' ? 'conditional' : e.target.value === 'true' })}
                      style={{ width: 120 }}
                    >
                      <option value="true">Obligatorio</option>
                      <option value="false">Opcional</option>
                      <option value="conditional">Condicional</option>
                    </select>
                  </div>
                  {(r.type === 'condition' || r.required === 'conditional') && (
                    <input
                      placeholder="Nota aclaratoria (ej. Solo para traslado de salida)"
                      value={r.note || ''}
                      onChange={e => updateReq(i, { note: e.target.value })}
                      style={{ fontSize: 12 }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button type="button" className="btn ghost" style={{ padding: '3px 5px', height: 'auto' }} disabled={i === 0} onClick={() => moveReq(i, -1)} title="Subir"><ArrowUp size={13} /></button>
                  <button type="button" className="btn ghost" style={{ padding: '3px 5px', height: 'auto' }} disabled={i === reqs.length - 1} onClick={() => moveReq(i, 1)} title="Bajar"><ArrowDown size={13} /></button>
                  <button type="button" className="btn danger-soft" style={{ padding: '3px 5px', height: 'auto' }} onClick={() => removeReq(i)} title="Quitar"><X size={13} /></button>
                </div>
              </div>
            ))}
            <button type="button" className="btn soft" style={{ alignSelf: 'flex-start' }} onClick={addReq}>
              <Plus size={14} /> Agregar requisito
            </button>
            <div style={{ fontSize: 11, color: 'var(--arib-navy-light)', marginTop: 2 }}>
              Formulario: dato del FUT ya capturado · Documento: adjunto externo · Pago: comprobante de pago · Condición: verificación interna de una oficina.
            </div>
          </div>
        )}

        {reqTab === 'text' && (
          <Field label="Requisitos referenciales (texto libre)" hint="Campo legacy; se genera automáticamente desde la lista estructurada al guardar.">
            <input
              value={form.requires}
              onChange={e => setForm({ ...form, requires: e.target.value })}
              placeholder="Ej. FUT + Recibo de pago"
            />
          </Field>
        )}
      </div>

      {/* ── Advertencia: trámite con costo sin ninguna oficina que cobre pagos ── */}
      {Number(form.monto) > 0 && !activeRoute.some(id => offices.find(o => o.id === id)?.collectsPayment) && (
        <div className="rule-banner" style={{ marginBottom: 18 }}>
          <Route size={20} style={{ color: 'var(--arib-warning, #f59e0b)' }} />
          <div>
            <b>Ruta sin oficina que cobre pagos</b>
            <span>Este trámite tiene costo pero su ruta no incluye ninguna oficina habilitada para cobrar (Tesorería o una sub-tesorería). Nadie validará el pago. Agrega una oficina con esa capacidad a la ruta.</span>
          </div>
        </div>
      )}

      {/* ── Sección: Ruta de oficinas ── */}
      <div>
        <SectionHeader icon={Route} title="Ruta de oficinas" />
        {isEdit ? (
          <Field label="Ruta canónica actual" hint="Para modificar la ruta en vivo, usa el Diseñador de Rutas.">
            <div className="soft-box" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {form.requiresMesaPartes && (<>
                <span style={{ fontWeight: 700, color: 'var(--arib-primary)' }}>Mesa de Partes</span><span>→</span>
              </>)}
              {form.requiresDireccion && (<>
                <span style={{ fontWeight: 700, color: 'var(--arib-navy)' }}>Dirección General</span><span>→</span>
              </>)}
              {(form.route || []).map(id => (
                <React.Fragment key={id}>
                  <span style={{ fontWeight: 700, color: offices.find(o => o.id === id)?.color || 'var(--arib-primary)' }}>{officeName(id)}</span>
                  <span>→</span>
                </React.Fragment>
              ))}
              <span style={{ fontWeight: 700, color: 'var(--arib-success)' }}>{form.requiresMesaPartes ? 'Cierre y Entrega' : 'Finalizado por la última oficina'}</span>
            </div>
          </Field>
        ) : (
          <>
            <Field
              label={form.requiresMesaPartes || form.requiresDireccion ? 'Ruta secuencial (después de los pasos institucionales)' : 'Ruta secuencial (trámite sin pasos institucionales)'}
              required
              hint={(form.requiresMesaPartes || form.requiresDireccion) ? 'Los pasos seleccionados se muestran antes de la primera oficina.' : 'La ruta empieza directamente en la primera oficina que agregues.'}
            >
              {routeDraft.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {routeDraft.map((id, i) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--arib-surface-subtle)', border: '1px solid var(--arib-border)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--arib-navy-light)' }}>Paso {i + 1}:</span>
                        <b style={{ color: 'var(--arib-navy)' }}>{officeName(id)}</b>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className="btn ghost" style={{ padding: '3px 6px', height: 'auto' }} disabled={i === 0} onClick={() => moveRoute(i, -1)} title="Mover antes"><ArrowUp size={14} /></button>
                        <button type="button" className="btn ghost" style={{ padding: '3px 6px', height: 'auto' }} disabled={i === routeDraft.length - 1} onClick={() => moveRoute(i, 1)} title="Mover después"><ArrowDown size={14} /></button>
                        <button type="button" className="btn danger-soft" style={{ padding: '3px 6px', height: 'auto' }} onClick={() => setRouteDraft(routeDraft.filter(x => x !== id))} title="Quitar"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 14px', background: 'var(--arib-surface-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--arib-navy-light)', marginBottom: 8 }}>
                  Agrega al menos una oficina operativa para el recorrido del trámite.
                </div>
              )}
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} style={{ color: 'var(--arib-primary)' }} />
              <select defaultValue="" onChange={e => { addRouteOffice(e.target.value); e.target.value = '' }} style={{ flex: 1 }}>
                <option value="" disabled>Agregar dependencia u oficina a la ruta…</option>
                {treasuryOffices.filter(o => !routeDraft.includes(o.id)).length > 0 && (
                  <optgroup label="Tesorería y subtesorerías">
                    {treasuryOffices.filter(o => !routeDraft.includes(o.id)).map(o => <option key={o.id} value={o.id}>{routeLabel(o.id)}</option>)}
                  </optgroup>
                )}
                {operationalOffices.filter(o => !routeDraft.includes(o.id)).length > 0 && (
                  <optgroup label="Otras oficinas">
                    {operationalOffices.filter(o => !routeDraft.includes(o.id)).map(o => <option key={o.id} value={o.id}>{routeLabel(o.id)}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
