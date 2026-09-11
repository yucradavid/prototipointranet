import React, { useEffect, useState } from 'react'
import { Plus, X, ArrowUp, ArrowDown, Building2, Route, Clock3, BookOpen } from 'lucide-react'
import { Modal, Field } from './ui'
import { officeName } from '../data/catalogs'

const emptyForm = { name: '', category: '', requires: '', sla: 3 }

export default function ProcedureFormModal({ procedure, offices, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...procedure })
  const [routeDraft, setRouteDraft] = useState(procedure?.route ? [...procedure.route] : [])

  useEffect(() => {
    setForm({ ...emptyForm, ...procedure })
    setRouteDraft(procedure?.route ? [...procedure.route] : [])
  }, [procedure])

  const isEdit = !!procedure?.id
  const routableOffices = offices.filter(o => !['mesa_partes', 'direccion'].includes(o.id))

  const addRouteOffice = id => {
    if (id && !routeDraft.includes(id)) {
      setRouteDraft([...routeDraft, id])
    }
  }

  const moveRoute = (idx, dir) => {
    const n = [...routeDraft]
    const j = idx + dir
    if (j < 0 || j >= n.length) return
    ;[n[idx], n[j]] = [n[j], n[idx]]
    setRouteDraft(n)
  }

  const save = () => {
    if (!form.name.trim()) return
    const route = isEdit ? form.route : routeDraft
    onSave({ ...form, route, sla: Number(form.sla) || 1 })
  }

  return (
    <Modal
      open={!!procedure}
      onClose={onClose}
      title={isEdit ? 'Editar Tipo de Trámite' : 'Nuevo Tipo de Trámite'}
      subtitle="Configura los datos del trámite y las dependencias que evaluarán la solicitud."
      size="lg"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
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
      <div className="form-grid two" style={{ marginBottom: 16 }}>
        <Field label="Nombre del trámite" required>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej. Emisión de Certificado de Estudios"
          />
        </Field>
        <Field label="Categoría / Tipo">
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="Ej. Académico, Administrativo, Grados"
          />
        </Field>
        <Field label="Requisitos referenciales exigidos">
          <input
            value={form.requires}
            onChange={e => setForm({ ...form, requires: e.target.value })}
            placeholder="Ej. FUT completado, Comprobante de pago Banco de la Nación"
          />
        </Field>
        <Field label="Plazo de atención / SLA (días hábiles)" required hint="Tiempo máximo normativo">
          <input
            type="number"
            min="1"
            max="60"
            value={form.sla}
            onChange={e => setForm({ ...form, sla: e.target.value })}
          />
        </Field>
      </div>

      {isEdit ? (
        <Field
          label="Ruta canónica actual"
          hint="Para modificar visualmente la ruta en vivo o versionarla, utiliza el Diseñador de Rutas en la pestaña de Administración."
        >
          <div className="soft-box" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--arib-primary)' }}>Mesa de Partes</span>
            <span>→</span>
            <span style={{ fontWeight: 700, color: 'var(--arib-navy)' }}>Dirección General</span>
            {(form.route || []).map(id => (
              <React.Fragment key={id}>
                <span>→</span>
                <span style={{ fontWeight: 700, color: offices.find(o => o.id === id)?.color || 'var(--arib-primary)' }}>
                  {officeName(id)}
                </span>
              </React.Fragment>
            ))}
            <span>→</span>
            <span style={{ fontWeight: 700, color: 'var(--arib-success)' }}>Cierre y Entrega</span>
          </div>
        </Field>
      ) : (
        <>
          <Field
            label="Ruta secuencial de oficinas (después de Dirección General)"
            required
            hint="Mesa de Partes y Dirección se añaden automáticamente."
          >
            {routeDraft.length ? (
              <div className="route-edit-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {routeDraft.map((id, i) => (
                  <div
                    className="route-edit-card"
                    key={id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--arib-surface-subtle)',
                      border: '1px solid var(--arib-border)',
                      borderRadius: 8,
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--arib-navy-light)' }}>
                        Paso {i + 1}:
                      </span>
                      <b style={{ color: 'var(--arib-navy)' }}>{officeName(id)}</b>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ padding: '3px 6px', height: 'auto' }}
                        disabled={i === 0}
                        onClick={() => moveRoute(i, -1)}
                        title="Mover antes"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ padding: '3px 6px', height: 'auto' }}
                        disabled={i === routeDraft.length - 1}
                        onClick={() => moveRoute(i, 1)}
                        title="Mover después"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn danger-soft"
                        style={{ padding: '3px 6px', height: 'auto' }}
                        onClick={() => setRouteDraft(routeDraft.filter(x => x !== id))}
                        title="Quitar oficina"
                      >
                        <X size={14} />
                      </button>
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

          <div className="add-office-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} style={{ color: 'var(--arib-primary)' }} />
            <select
              defaultValue=""
              onChange={e => {
                addRouteOffice(e.target.value)
                e.target.value = ''
              }}
              style={{ flex: 1 }}
            >
              <option value="" disabled>
                Agregar dependencia u oficina a la ruta…
              </option>
              {routableOffices
                .filter(o => !routeDraft.includes(o.id))
                .map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}
    </Modal>
  )
}

