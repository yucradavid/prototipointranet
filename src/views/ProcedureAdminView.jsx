import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Search, Wallet, AlertTriangle, Route } from 'lucide-react'
import { Panel, Badge, Field } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import { officeName } from '../data/catalogs'
import { fuzzyFilter } from '../utils/search.js'
import './ProcedureAdminView.css'

const lacksPayingOffice = (p, offices) =>
  Number(p.monto) > 0 && !(p.route || []).some(id => offices.find(o => o.id === id)?.collectsPayment)

export default function ProcedureAdminView({ procedures, offices, paymentInfo, onSaveProcedure, onDeleteProcedure, onSavePaymentInfo, onOpenWorkflow }) {
  const [category, setCategory] = useState('ALL')
  const [query, setQuery] = useState('')
  const [procModal, setProcModal] = useState(null)
  const [paymentForm, setPaymentForm] = useState(paymentInfo)

  useEffect(() => { setPaymentForm(paymentInfo) }, [paymentInfo])

  const categories = useMemo(() => {
    const map = {}
    procedures.forEach(p => { const c = p.category || 'General'; map[c] = (map[c] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  }, [procedures])

  const byCategory = category === 'ALL' ? procedures : procedures.filter(p => (p.category || 'General') === category)
  const filtered = fuzzyFilter(byCategory, query, p => `${p.name} ${p.category}`)

  const saveProcedure = data => { onSaveProcedure(data); setProcModal(null) }

  const paymentFormDirty = JSON.stringify(paymentForm) !== JSON.stringify(paymentInfo)
  const savePaymentInfo = () => {
    if (!paymentForm?.yape?.trim() && !paymentForm?.cuenta?.trim()) return
    onSavePaymentInfo(paymentForm)
  }

  return (
    <Panel title="Catálogo de Trámites" subtitle="Cada trámite define sus requisitos, su tarifa y la ruta de dependencias que lo atienden." className="procedure-admin">
      <div className="pa-body">
        <div className="pa-toolbar">
          <div className="pa-categories" aria-label="Categorías de trámite">
            <button type="button" aria-pressed={category === 'ALL'} onClick={() => setCategory('ALL')}>Todos<b>{procedures.length}</b></button>
            {categories.map(c => (
              <button type="button" key={c.name} aria-pressed={category === c.name} onClick={() => setCategory(c.name)}>{c.name}<b>{c.count}</b></button>
            ))}
          </div>
          <label className="search-mini pa-search"><Search size={16} /><input aria-label="Buscar trámite" placeholder="Buscar por nombre o categoría…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" className="btn ghost" onClick={() => setQuery('')}>Limpiar</button>}</label>
        </div>

        <div className="pa-section-head">
          <div><h3><BookOpen size={19} /> Trámites <span>{filtered.length}</span></h3><p>Cada fila puede editarse para ajustar requisitos, tarifa, flujo de atención y quién puede iniciarlo.</p></div>
          <button className="btn primary" onClick={() => setProcModal({})}><Plus size={16} /> Nuevo trámite</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Denominación del trámite</th>
                <th>Categoría</th>
                <th>Plazo (SLA)</th>
                <th>Costo</th>
                <th>Ruta canónica de dependencias</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>Sin trámites que coincidan con la búsqueda.</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <b style={{ color: 'var(--navy)' }}>{p.name}</b>
                    <div className="pa-row-badges">
                      <Badge tone={p.active === false ? 'neutral' : 'info'}>{p.active === false ? 'Inactivo' : 'Activo'}</Badge>
                      {p.requiresDireccion === false && <Badge tone="warning">Sin Mesa de Partes/Dirección</Badge>}
                    </div>
                    <small>{p.verificationStatus === 'confirmed' ? 'Fuente confirmada' : 'Fuente pendiente de confirmar'}{p.source ? ` · ${p.source}` : ''}</small>
                  </td>
                  <td><Badge tone="neutral">{p.category}</Badge></td>
                  <td><Badge tone="info">{p.sla ?? '—'} días hábiles</Badge></td>
                  <td>
                    {p.tariffStatus === 'pending' ? <Badge tone="warning">Tarifa pendiente</Badge> : p.monto > 0 ? (
                      <Badge tone="warning">S/ {Number(p.monto).toFixed(2)}</Badge>
                    ) : (
                      <Badge tone="success">Gratuito</Badge>
                    )}
                  </td>
                  <td>
                    <div className="pa-route">
                      {(p.route || []).map((id, idx) => (
                        <React.Fragment key={id}>
                          {idx > 0 && <span className="pa-route-arrow">→</span>}
                          <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{officeName(id)}</span>
                        </React.Fragment>
                      ))}
                    </div>
                    {lacksPayingOffice(p, offices) && (
                      <p className="pa-notice"><AlertTriangle size={12} /> Tiene costo pero ninguna oficina de su ruta cobra pagos.</p>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn ghost" title="Editar trámite" onClick={() => setProcModal({ ...p })}><Pencil size={14} /></button>
                      <button className="btn danger-soft" title="Eliminar trámite" onClick={() => onDeleteProcedure(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="pa-payment-details">
          <summary><Wallet size={15} /> Datos de pago institucional</summary>
          <p className="pa-payment-hint">Dónde debe pagar el solicitante el derecho de trámite (se muestra en el FUT virtual y en el seguimiento). Un solo destino, compartido por todos los trámites con costo.</p>
          <div className="form-grid two">
            <Field label="Número Yape / Plin"><input value={paymentForm?.yape || ''} onChange={e => setPaymentForm({ ...paymentForm, yape: e.target.value })} placeholder="Ej. 958 000 000" /></Field>
            <Field label="Titular de la cuenta"><input value={paymentForm?.titular || ''} onChange={e => setPaymentForm({ ...paymentForm, titular: e.target.value })} placeholder="Nombre de la institución o titular" /></Field>
            <Field label="Banco"><input value={paymentForm?.banco || ''} onChange={e => setPaymentForm({ ...paymentForm, banco: e.target.value })} placeholder="Ej. Banco de la Nación" /></Field>
            <Field label="N.° de cuenta"><input value={paymentForm?.cuenta || ''} onChange={e => setPaymentForm({ ...paymentForm, cuenta: e.target.value })} placeholder="Ej. 00-000-000000" /></Field>
            <Field label="CCI (interbancario)"><input value={paymentForm?.cci || ''} onChange={e => setPaymentForm({ ...paymentForm, cci: e.target.value })} placeholder="Ej. 018-000-000000000000-00" /></Field>
          </div>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button className="btn primary" disabled={!paymentFormDirty} onClick={savePaymentInfo}><Wallet size={16} /> Guardar datos de pago</button>
          </div>
        </details>

        <div className="pa-help">
          <div><b>¿Necesitas cambiar por dónde pasa un trámite?</b><p>La ruta de oficinas y si pasa por Mesa de Partes/Dirección se ajustan aquí (al crear o editar) y se publican desde el Diseñador de Rutas.</p></div>
          <button className="btn ghost" onClick={onOpenWorkflow}><Route size={15} /> Diseñador de Rutas</button>
        </div>
      </div>

      {procModal && (
        <ProcedureFormModal procedure={procModal} offices={offices} onClose={() => setProcModal(null)} onSave={saveProcedure} />
      )}
    </Panel>
  )
}
