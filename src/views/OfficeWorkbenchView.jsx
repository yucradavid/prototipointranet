import React, { useMemo, useState } from 'react'
import {
  Building2, Search, CheckCircle2, AlertTriangle, ArrowRight, UploadCloud,
  Clock3, Shuffle, FileText, UserRound, ArrowLeftRight, Check, CornerDownRight,
  ShieldAlert, Sparkles, MessageSquare, ExternalLink
} from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList, Modal, Field } from '../components/ui'
import { officeName } from '../data/catalogs'

const QUICK_OBSERVATIONS = [
  'Adjuntar comprobante de pago legible.',
  'Falta firma digital o manuscrita en el documento adjunto.',
  'Documento de identidad (DNI) no coincide con el solicitante.',
  'Información académica incompleta o requiere convalidación.'
]

const QUICK_RESULTS = [
  'Atención conforme. Se emite informe favorable.',
  'Revisión y validación de expediente aprobada sin observaciones.',
  'Paso operativo completado satisfactoriamente.'
]

export default function OfficeWorkbenchView({ officeId, items, offices, permissions=[], onObserve, onComplete, onRedirect }) {
  const can=perm=>permissions.includes(perm)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL') // ALL | EN_OFICINA | OBSERVADO
  const [observeOpen, setObserveOpen] = useState(false)
  const [observeText, setObserveText] = useState('')
  const [note, setNote] = useState('Atención conforme.')
  const [doc, setDoc] = useState('')
  const [redirectOpen, setRedirectOpen] = useState(false)
  const [redirectTarget, setRedirectTarget] = useState('')
  const [redirectNote, setRedirectNote] = useState('')

  const baseQueue = useMemo(() => {
    return items
      .filter(x => ['EN_OFICINA', 'OBSERVADO'].includes(x.estado) && x.oficinaActual === officeId)
      .filter(x => `${x.numero || ''} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase()))
  }, [items, officeId, search])

  const queue = useMemo(() => {
    if (filter === 'EN_OFICINA') return baseQueue.filter(x => x.estado === 'EN_OFICINA')
    if (filter === 'OBSERVADO') return baseQueue.filter(x => x.estado === 'OBSERVADO')
    return baseQueue
  }, [baseQueue, filter])

  const selected = items.find(x => x.id === selectedId) || queue[0]

  React.useEffect(() => {
    setNote('Atención conforme.')
    setDoc('')
    setRedirectTarget('')
    setRedirectNote('')
  }, [selected?.id, officeId])

  const next = selected?.routePlan?.[selected.routeIndex + 1]
  const prev = selected?.routeIndex > 0 ? selected?.routePlan?.[selected.routeIndex - 1] : 'direccion'
  const redirectOptions = (offices || []).filter(o => !['mesa_partes', 'direccion'].includes(o.id) && o.id !== officeId)

  const submitObs = () => {
    if (!observeText.trim()) return
    onObserve(selected, { text: observeText.trim() })
    setObserveOpen(false)
    setObserveText('')
  }

  const complete = () => {
    if (!selected) return
    onComplete(selected, {
      note: note.trim() || 'Atención conforme.',
      document: doc.trim() || `Respuesta_${selected.numero}_${officeId}.pdf`
    })
  }

  const submitRedirect = () => {
    if (!redirectTarget) return
    onRedirect(selected, { officeId: redirectTarget, note: redirectNote })
    setRedirectOpen(false)
  }

  const currentOfficeObj = offices?.find(o => o.id === officeId)
  const officeColor = currentOfficeObj?.color || '#0284c7'

  return (
    <div className="role-page">
      {/* Top Hero Banner */}
      <div className="hero-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="eyebrow" style={{ margin: 0 }}>OFICINA OPERATIVA</span>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: officeColor }}></span>
          </div>
          <h1>{officeName(officeId)}</h1>
          <p>Bandeja de atención especializada según la ruta oficial configurada para cada expediente.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="hero-count office" style={{ borderColor: `${officeColor}40` }}>
            <Building2 size={20} style={{ color: officeColor }} />
            <b>{baseQueue.filter(x => x.estado === 'EN_OFICINA').length}</b>
            <span>por atender</span>
          </div>
          {baseQueue.some(x => x.estado === 'OBSERVADO') && (
            <div className="hero-count" style={{ borderColor: 'var(--arib-danger-subtle)', background: 'var(--arib-danger-subtle)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--arib-danger)' }} />
              <b style={{ color: 'var(--arib-danger)' }}>{baseQueue.filter(x => x.estado === 'OBSERVADO').length}</b>
              <span>observados</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="master-detail-grid">
        {/* Left: Queue List */}
        <Panel
          title="Bandeja de expedientes"
          subtitle="Paso asignado a esta oficina para evaluación y respuesta."
          actions={
            <div className="search-mini">
              <Search size={15} />
              <input
                placeholder="Buscar por EXP, solicitante o asunto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          }
        >
          {/* Quick Filter Pills */}
          <div className="filter-pill-bar" style={{ marginBottom: 14 }}>
            <button
              className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Todos ({baseQueue.length})
            </button>
            <button
              className={`filter-pill ${filter === 'EN_OFICINA' ? 'active' : ''}`}
              onClick={() => setFilter('EN_OFICINA')}
            >
              Por atender ({baseQueue.filter(x => x.estado === 'EN_OFICINA').length})
            </button>
            <button
              className={`filter-pill ${filter === 'OBSERVADO' ? 'active' : ''}`}
              onClick={() => setFilter('OBSERVADO')}
            >
              Observados ({baseQueue.filter(x => x.estado === 'OBSERVADO').length})
            </button>
          </div>

          <div className="case-list">
            {queue.length ? (
              queue.map(x => {
                const isObs = x.estado === 'OBSERVADO'
                return (
                  <button
                    key={x.id}
                    className={`case-item ${selected?.id === x.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(x.id)}
                  >
                    <div
                      className="case-icon office"
                      style={{
                        background: isObs ? 'var(--arib-danger-subtle)' : `${officeColor}15`,
                        color: isObs ? 'var(--arib-danger)' : officeColor
                      }}
                    >
                      {isObs ? <AlertTriangle size={18} /> : <Building2 size={18} />}
                    </div>
                    <div className="case-main">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b>EXP {x.numero}</b>
                        <StatusBadge status={x.estado} />
                      </div>
                      <strong>{x.asunto}</strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UserRound size={12} /> {x.solicitante}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--arib-navy-light)' }}>
                          Paso {x.routeIndex + 1}/{x.routePlan?.length || 1}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <Empty
                title="Bandeja al día"
                text={
                  filter !== 'ALL'
                    ? 'No hay expedientes con el filtro seleccionado.'
                    : `No hay expedientes pendientes de atención en ${officeName(officeId)}.`
                }
              />
            )}
          </div>
        </Panel>

        {/* Right: Selected Case Details & Actions */}
        <Panel
          title={selected ? `EXP ${selected.numero} · ${selected.asunto}` : 'Detalle de atención'}
          subtitle={selected ? `Proveído de Dirección: "${selected.proveido || 'Conforme a la norma.'}"` : 'Selecciona un expediente para evaluar y resolver.'}
        >
          {selected ? (
            <div className="case-detail">
              {/* Header Badges */}
              <div className="detail-top" style={{ flexWrap: 'wrap', gap: 8 }}>
                <StatusBadge status={selected.estado} />
                <SlaBadge exp={selected} />
                <Badge tone="info">
                  Paso {selected.routeIndex + 1} de {selected.routePlan?.length || 1}
                </Badge>
                <Badge tone="neutral">Ruta v{selected.routeVersion || 1}</Badge>
                {selected.canal && <Badge tone="neutral">Canal {selected.canal}</Badge>}
              </div>

              {/* Route Stepper Banner */}
              <div style={{ margin: '14px 0 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)' }}>
                    Ruta de atención del expediente
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                    Siguiente: <strong>{next ? officeName(next) : 'Mesa de Partes (Cierre)'}</strong>
                  </span>
                </div>
                <RouteStrip exp={selected} />
              </div>

              {/* Case when OBSERVED */}
              {selected.estado === 'OBSERVADO' ? (
                <div className="observation-card">
                  <AlertTriangle size={24} style={{ color: 'var(--arib-danger)', flexShrink: 0 }} />
                  <div>
                    <b style={{ color: 'var(--arib-danger)', fontSize: 14 }}>Esperando subsanación del solicitante</b>
                    <p style={{ margin: '6px 0 8px', fontSize: 13, lineHeight: 1.5, color: '#991b1b' }}>
                      "{selected.observation?.text}"
                    </p>
                    <span style={{ fontSize: 12, color: '#991b1b', opacity: 0.85 }}>
                      ⚠️ Mientras el expediente permanezca observado, la oficina no puede completar el paso. Una vez que el usuario suba sus correcciones en el portal, el expediente volverá aquí habilitado para su atención.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Request information box */}
                  <div className="soft-box" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--arib-navy)', fontSize: 12, textTransform: 'uppercase' }}>
                        Fundamento y pedido del solicitante
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                        DNI: <strong>{selected.dni || '—'}</strong> · Tel: <strong>{selected.celular || '—'}</strong>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--arib-slate)' }}>
                      {selected.fundamento || 'Sin fundamento especificado.'}
                    </p>
                  </div>

                  {/* Attached Files */}
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 8 }}>
                      Documentos y anexos recibidos
                    </h4>
                    <FileList files={selected.adjuntos} />
                  </div>

                  {/* Primary Operational Action Box */}
                  <div className="office-action-card" style={{ borderLeft: `4px solid ${officeColor}`, background: 'var(--arib-surface-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `${officeColor}20`,
                          color: officeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <CheckCircle2 size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 15, color: 'var(--arib-navy)' }}>Acción Resolutiva de {officeName(officeId)}</b>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--arib-slate)' }}>
                          {next
                            ? `Al completar este paso, el expediente avanzará automáticamente a ${officeName(next)}.`
                            : 'Este es el último paso de la ruta. Al completar, el expediente retornará a Mesa de Partes para la notificación y entrega final al usuario.'}
                        </p>
                      </div>
                    </div>

                    {/* Quick result template chips */}
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--arib-navy-light)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        Plantillas rápidas de resultado:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {QUICK_RESULTS.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="btn ghost"
                            style={{ fontSize: 11, padding: '4px 8px', height: 'auto', background: 'var(--arib-surface-subtle)' }}
                            onClick={() => setNote(tpl)}
                          >
                            <Sparkles size={11} style={{ marginRight: 4, color: 'var(--arib-primary)' }} />
                            {tpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field label="Resultado / Informe / Comentario resolutivo" required>
                      <textarea
                        rows={3}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Describe el informe, dictamen o resultado emitido por esta oficina…"
                      />
                    </Field>

                    <Field
                      label="Documento de respuesta o informe técnico adjunto"
                      hint="Se registrará en el expediente como archivo oficial de respuesta de esta oficina."
                    >
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder={`Ej. Informe_Tecnico_${selected.numero}_${officeId}.pdf`}
                          value={doc}
                          onChange={e => setDoc(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn soft"
                          onClick={() => setDoc(`Informe_Tecnico_${selected.numero}_${officeId}.pdf`)}
                          title="Generar nombre sugerido"
                        >
                          Auto
                        </button>
                      </div>
                    </Field>

                    {/* Operational Action Buttons */}
                    <div className="action-row" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--arib-border)' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {can('case.observe') && (
                          <button className="btn danger-soft" onClick={() => setObserveOpen(true)}>
                            <AlertTriangle size={16} /> Observar expediente
                          </button>
                        )}
                        {can('case.forward') && (
                          <button className="btn soft" onClick={() => setRedirectOpen(true)}>
                            <Shuffle size={16} /> Redirigir a otra oficina
                          </button>
                        )}
                      </div>

                      {can('case.attend') && (
                        <button className="btn primary big" onClick={complete}>
                          <ArrowRight size={18} /> {next ? `Completar y derivar a ${officeName(next)}` : 'Completar último paso y cerrar ruta'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Audit Timeline */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 12 }}>
                  Historial de trazabilidad del expediente
                </h4>
                <Timeline items={selected.historial} />
              </div>
            </div>
          ) : (
            <Empty
              title="Ningún expediente seleccionado"
              text="Selecciona un expediente de la lista de la izquierda para revisar su documentación y registrar el resultado de atención."
            />
          )}
        </Panel>
      </div>

      {/* Observation Modal */}
      <Modal
        open={observeOpen}
        onClose={() => setObserveOpen(false)}
        title="Observar expediente"
        subtitle="El solicitante recibirá la observación y, al subsanar, el expediente regresará automáticamente a esta oficina."
        size="md"
        footer={
          <>
            <button className="btn ghost" onClick={() => setObserveOpen(false)}>
              Cancelar
            </button>
            <button className="btn danger" disabled={!observeText.trim()} onClick={submitObs}>
              <AlertTriangle size={16} /> Enviar observación
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--arib-navy-light)', display: 'block', marginBottom: 6 }}>
            Motivos frecuentes (clic para autocompletar):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_OBSERVATIONS.map((qObs, idx) => (
              <button
                key={idx}
                type="button"
                className="btn ghost"
                style={{ fontSize: 11, padding: '4px 8px', height: 'auto', background: 'var(--arib-surface-subtle)', textAlign: 'left' }}
                onClick={() => setObserveText(qObs)}
              >
                + {qObs}
              </button>
            ))}
          </div>
        </div>
        <Field label="Detalle claro de la observación requerida al solicitante" required>
          <textarea
            rows={4}
            value={observeText}
            onChange={e => setObserveText(e.target.value)}
            placeholder="Especifica con exactitud qué documento o subsanación debe remitir el usuario…"
          />
        </Field>
      </Modal>

      {/* Redirect Modal */}
      <Modal
        open={redirectOpen}
        onClose={() => setRedirectOpen(false)}
        title="Redirigir a otra oficina especializada"
        subtitle="Excepción manual: envía el expediente a una oficina fuera de la ruta programada por Dirección. Al completarla, continuará con el resto de la ruta original."
        size="md"
        footer={
          <>
            <button className="btn ghost" onClick={() => setRedirectOpen(false)}>
              Cancelar
            </button>
            <button className="btn primary" disabled={!redirectTarget} onClick={submitRedirect}>
              <Shuffle size={16} /> Redirigir expediente
            </button>
          </>
        }
      >
        <div className="rule-banner" style={{ marginBottom: 14 }}>
          <ArrowLeftRight size={20} style={{ color: 'var(--arib-primary)' }} />
          <div>
            <b>Mecanismo de Desviación Temporal</b>
            <span>
              La oficina seleccionada atenderá el expediente de manera extraordinaria. Una vez completado, el flujo se reintegrará al recorrido original.
            </span>
          </div>
        </div>

        <Field label="Oficina de destino requerida" required>
          <select value={redirectTarget} onChange={e => setRedirectTarget(e.target.value)}>
            <option value="" disabled>
              Selecciona oficina de destino…
            </option>
            {redirectOptions.map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Motivo de la derivación extraordinaria" required>
          <textarea
            rows={4}
            value={redirectNote}
            onChange={e => setRedirectNote(e.target.value)}
            placeholder="Ej. Requiere informe técnico previo de Secretaría Académica para continuar la evaluación…"
          />
        </Field>
      </Modal>
    </div>
  )
}

