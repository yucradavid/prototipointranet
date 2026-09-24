import React, { useMemo, useState } from 'react'
import {
  Building2, Search, CheckCircle2, AlertTriangle, ArrowRight, UploadCloud,
  Clock3, Shuffle, FileText, UserRound, ArrowLeftRight, Check, CornerDownRight,
  ShieldAlert, Sparkles, MessageSquare, ExternalLink, Wallet, Receipt, History
} from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList, Modal, Field, RequirementsBlock } from '../components/ui'
import { officeName, procedureById, procedureForExpediente } from '../data/catalogs'
import ReciboPagoModal from '../components/ReciboPagoModal'
import { fileToCompressedDataUrl, isDataUrl } from '../utils/imageUpload'

const PAYMENT_METHODS = ['Yape / Plin', 'Tarjeta / POS', 'Depósito bancario', 'Transferencia', 'Efectivo en caja']
const todayPE = () => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())

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

export default function OfficeWorkbenchView({ officeId, items, offices, permissions=[], onObserve, onComplete, onRedirect, onRegisterPayment }) {
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
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payMonto, setPayMonto] = useState('')
  const [payMetodo, setPayMetodo] = useState(PAYMENT_METHODS[0])
  const [payVoucher, setPayVoucher] = useState('')
  const [payFecha, setPayFecha] = useState(todayPE())
  const [payComprobante, setPayComprobante] = useState('')
  const [payFileName, setPayFileName] = useState('')
  const [payFileError, setPayFileError] = useState('')
  const [payFileBusy, setPayFileBusy] = useState(false)
  const [reciboExp, setReciboExp] = useState(null)

  const choosePayFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setPayFileError('')
    setPayFileBusy(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPayComprobante(dataUrl)
      setPayFileName(file.name)
    } catch (err) {
      setPayFileError(err.message)
    } finally {
      setPayFileBusy(false)
      e.target.value = ''
    }
  }

  const baseQueue = useMemo(() => {
    return items
      .filter(x => ['EN_OFICINA', 'OBSERVADO'].includes(x.estado) && x.oficinaActual === officeId)
      .filter(x => `${x.numero || ''} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase()))
  }, [items, officeId, search])

  // Una vez que esta oficina completa su paso, el expediente avanza y desaparece de
  // baseQueue — sin esto la oficina no tenía ninguna memoria de lo que ya atendió.
  // "Resuelto por nosotros" = esta oficina aparece en la ruta y el expediente ya avanzó
  // más allá de su posición en ella (o la ruta ya terminó).
  const resolvedByOffice = useMemo(() => {
    return items
      .filter(x => {
        const idx = (x.routePlan || []).indexOf(officeId)
        return idx !== -1 && x.routeIndex > idx
      })
      .filter(x => `${x.numero || ''} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase()))
  }, [items, officeId, search])

  const queue = useMemo(() => {
    if (filter === 'EN_OFICINA') return baseQueue.filter(x => x.estado === 'EN_OFICINA')
    if (filter === 'OBSERVADO') return baseQueue.filter(x => x.estado === 'OBSERVADO')
    if (filter === 'RESUELTOS') return resolvedByOffice
    return baseQueue
  }, [baseQueue, resolvedByOffice, filter])

  const selected = items.find(x => x.id === selectedId) || queue[0]
  const procedure = procedureForExpediente(selected)
  const needsPayment = officeId === 'tesoreria' && (procedure?.monto || 0) > 0
  const isPaid = selected?.pago?.estado === 'PAGADO'
  const paymentPending = needsPayment && !isPaid

  React.useEffect(() => {
    setNote('Atención conforme.')
    setDoc('')
    setRedirectTarget('')
    setRedirectNote('')
    setPayMonto(procedure?.monto ? String(procedure.monto) : '')
    setPayVoucher('')
    setPayMetodo(PAYMENT_METHODS[0])
    setPayFecha(todayPE())
    const studentAttachment = selected?.adjuntos?.find(a => a.name === 'Comprobante de pago')
    setPayComprobante(studentAttachment?.url || '')
    setPayFileName(studentAttachment && isDataUrl(studentAttachment.url) ? (studentAttachment.size || 'Comprobante del solicitante') : '')
    setPayFileError('')
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

  const submitPayment = () => {
    if (!(Number(payMonto) > 0) || !payVoucher.trim()) return
    const result = onRegisterPayment(selected, { monto: payMonto, metodo: payMetodo, voucher: payVoucher, fecha: payFecha, comprobante: payComprobante })
    if (result) {
      setPaymentOpen(false)
      setReciboExp(result)
    }
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
            <button
              className={`filter-pill ${filter === 'RESUELTOS' ? 'active' : ''}`}
              onClick={() => setFilter('RESUELTOS')}
              title="Expedientes que esta oficina ya atendió y derivó"
            >
              <History size={12} style={{ marginRight: 4 }} /> Resueltos por nosotros ({resolvedByOffice.length})
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

                  {/* Requirements checklist for this procedure */}
                  <RequirementsBlock exp={selected} />

                  {/* Payment / Caja box (only for Tesorería on paid procedures) */}
                  {needsPayment && (
                    <div
                      className="observation-card"
                      style={{
                        background: isPaid ? 'var(--arib-success-subtle, #f0fdf4)' : 'var(--arib-warning-subtle, #fffbeb)',
                        borderColor: isPaid ? '#86efac' : '#fde68a',
                        marginBottom: 16
                      }}
                    >
                      <Wallet size={24} style={{ color: isPaid ? '#16a34a' : '#b45309', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        {isPaid ? (
                          <>
                            <b style={{ color: '#16a34a', fontSize: 14 }}>
                              Pago conforme · S/ {Number(selected.pago.monto).toFixed(2)}
                            </b>
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#166534' }}>
                              {selected.pago.metodo} · Voucher {selected.pago.voucher} · {selected.pago.fecha}
                            </p>
                            {selected.pago.comprobante && (
                              <a
                                href={selected.pago.comprobante}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0284c7', marginTop: 4 }}
                              >
                                Ver evidencia del pago
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            <b style={{ color: '#b45309', fontSize: 14 }}>
                              Pago pendiente · S/ {Number(procedure?.monto || 0).toFixed(2)}
                            </b>
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#92400e' }}>
                              Este trámite requiere el pago del derecho de trámite. No se puede completar el paso hasta registrarlo.
                            </p>
                            {payComprobante && (
                              <a
                                href={payComprobante}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0284c7', marginTop: 4 }}
                              >
                                El solicitante adjuntó un comprobante — verifícalo antes de registrar
                              </a>
                            )}
                          </>
                        )}
                      </div>
                      {isPaid ? (
                        <button className="btn soft" onClick={() => setReciboExp(selected)}>
                          <Receipt size={16} /> Ver recibo
                        </button>
                      ) : (
                        can('case.pay') && (
                          <button className="btn primary" onClick={() => setPaymentOpen(true)}>
                            <Wallet size={16} /> Registrar pago
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Case already moved past this office (viewed from the "Resueltos" tab): read-only, no action box */}
                  {selected.oficinaActual !== officeId ? (
                    <div className="soft-box" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <CheckCircle2 size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <div>
                        <b style={{ color: 'var(--arib-navy)', fontSize: 13 }}>Ya resuelto por {officeName(officeId)}</b>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--arib-slate)' }}>
                          {selected.estado === 'FINALIZADO'
                            ? 'El expediente completó toda su ruta y fue cerrado por Mesa de Partes.'
                            : `El expediente avanzó a ${officeName(selected.oficinaActual)}. Solo se muestra en consulta; ya no se puede modificar desde esta bandeja.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                  <>
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
                        <button
                          className="btn primary big"
                          onClick={complete}
                          disabled={paymentPending}
                          title={paymentPending ? 'Registra el pago del derecho de trámite antes de completar este paso.' : undefined}
                        >
                          <ArrowRight size={18} /> {next ? `Completar y derivar a ${officeName(next)}` : 'Completar último paso y cerrar ruta'}
                        </button>
                      )}
                    </div>
                  </div>
                  </>
                  )}
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

      {/* Payment Registration Modal */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Registrar pago del derecho de trámite"
        subtitle="Verifica el comprobante presentado por el usuario (depósito, transferencia o efectivo) y registra los datos exactos del pago."
        size="md"
        footer={
          <>
            <button className="btn ghost" onClick={() => setPaymentOpen(false)}>
              Cancelar
            </button>
            <button className="btn primary" disabled={!(Number(payMonto) > 0) || !payVoucher.trim() || payFileBusy} onClick={submitPayment}>
              <Wallet size={16} /> Registrar pago
            </button>
          </>
        }
      >
        <div className="form-grid two" style={{ marginBottom: 4 }}>
          <Field label="Monto pagado (S/)" required hint={`Tarifa del trámite: S/ ${Number(procedure?.monto || 0).toFixed(2)}`}>
            <input type="number" min="0" step="0.5" value={payMonto} onChange={e => setPayMonto(e.target.value)} />
          </Field>
          <Field label="Método de pago" required>
            <select value={payMetodo} onChange={e => setPayMetodo(e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="N.° de operación / voucher" required>
            <input
              value={payVoucher}
              onChange={e => setPayVoucher(e.target.value)}
              placeholder="Ej. 0045-8871-2201"
            />
          </Field>
          <Field label="Fecha de pago" required>
            <input value={payFecha} onChange={e => setPayFecha(e.target.value)} placeholder="dd/mm/aaaa" />
          </Field>
        </div>
        <Field
          label="Evidencia del pago (opcional)"
          hint="Si el solicitante ya subió su comprobante, aquí aparece automáticamente. También puedes escanear/fotografiar un voucher físico (ej. pago en efectivo) y subirlo tú mismo."
        >
          <label className="dropzone" style={{ padding: 12 }}>
            <UploadCloud size={20} />
            <b>{payFileBusy ? 'Procesando archivo…' : (payFileName || 'Subir foto o captura del comprobante')}</b>
            <span>Formatos: JPG, PNG o PDF · Máximo 15 MB</span>
            <input type="file" accept="image/*,.pdf" disabled={payFileBusy} onChange={choosePayFile} />
          </label>
          {payFileError && <div className="login-error">{payFileError}</div>}
          {isDataUrl(payComprobante) && payComprobante.startsWith('data:image') && (
            <img
              src={payComprobante}
              alt="Vista previa del comprobante"
              style={{ maxWidth: 140, borderRadius: 8, marginTop: 8, border: '1px solid var(--arib-border)', display: 'block' }}
            />
          )}
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--arib-navy-light)', display: 'block', marginBottom: 4 }}>
              o pega un enlace de Google Drive:
            </span>
            <input
              value={isDataUrl(payComprobante) ? '' : payComprobante}
              onChange={e => { setPayComprobante(e.target.value); setPayFileName('') }}
              placeholder="Enlace de Google Drive con la captura o foto del comprobante"
            />
          </div>
        </Field>
      </Modal>

      <ReciboPagoModal exp={reciboExp} onClose={() => setReciboExp(null)} />
    </div>
  )
}

