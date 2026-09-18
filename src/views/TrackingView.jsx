import React, { useState } from 'react'
import { Search, Route, FileText, UserRound, Calendar, Hash, FileCheck, Sparkles, HelpCircle } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, RouteStrip, Timeline, Empty, FileList, PaymentStatusCard } from '../components/ui'
import ReciboPagoModal from '../components/ReciboPagoModal'

const QUICK_SEARCH_EXAMPLES = ['5225', '5226', '5227', 'ARIB-5225', '71234567']

// Un estudiante/docente que inicia sesión aquí NO debe poder buscar expedientes ajenos
// solo adivinando un número o un DNI — esta vista también la usan Secretaría, Dirección
// y las oficinas, que sí necesitan buscar entre TODOS los expedientes para su trabajo.
// Por eso el alcance se restringe únicamente para el rol solicitante, igual que ya se
// restringe en el portal (ApplicantPortalView) y en las alertas (App.jsx).
export default function TrackingView({ items, profileId, currentUser }) {
  const isApplicant = profileId === 'estudiante' || profileId === 'docente'
  const ownItems = isApplicant
    ? items.filter(x => currentUser ? x.ownerUserId === currentUser.id : x.ownerProfile === profileId)
    : items
  const scope = isApplicant ? ownItems : items

  const [q, setQ] = useState(isApplicant ? '' : '5225')
  const [selectedId, setSelectedId] = useState(null)
  const [reciboExp, setReciboExp] = useState(null)

  const results = scope.filter(x =>
    `${x.numero || ''} ${x.tracking || ''} ${x.solicitante} ${x.dni || ''}`
      .toLowerCase()
      .includes(q.toLowerCase())
  )

  const selected = scope.find(x => x.id === selectedId) || results[0]

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">{isApplicant ? 'MIS SOLICITUDES' : 'CONSULTA OPERATIVA INTERNA'}</span>
          <h1>{isApplicant ? 'Seguimiento de mis expedientes' : 'Seguimiento y Trazabilidad de Expedientes'}</h1>
          <p>
            {isApplicant
              ? 'Verifica el estado en tiempo real, la oficina actual y el recorrido de las solicitudes que has presentado.'
              : 'Verifica el estado en tiempo real, la oficina actual y el recorrido de cualquier expediente por N.° de Expediente, código de seguimiento o DNI.'}
          </p>
        </div>
      </div>

      {/* Prominent Search Bar */}
      <div
        className="tracking-search"
        style={{
          background: 'var(--arib-surface-card)',
          border: '1px solid var(--arib-border)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--arib-shadow-md)',
          marginBottom: 12
        }}
      >
        <Search size={22} style={{ color: 'var(--arib-primary)', flexShrink: 0 }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={isApplicant ? 'Filtrar tus solicitudes por número o asunto…' : 'Ingresa el N.° de expediente (ej. 5225), código temporal (ARIB-5225) o número de DNI…'}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            width: '100%',
            color: 'var(--arib-navy)'
          }}
        />
        {q && (
          <button
            type="button"
            className="btn ghost"
            style={{ padding: '4px 8px', fontSize: 12 }}
            onClick={() => setQ('')}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Quick Search Chips — solo tiene sentido cuando se busca entre TODOS los expedientes */}
      {!isApplicant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--arib-navy-light)', fontWeight: 600 }}>
            Búsquedas de ejemplo:
          </span>
          {QUICK_SEARCH_EXAMPLES.map(sample => (
            <button
              key={sample}
              type="button"
              className="btn ghost"
              style={{ fontSize: 11, padding: '3px 8px', height: 'auto', background: 'var(--arib-surface-subtle)' }}
              onClick={() => setQ(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
      )}

      {/* Master Detail Grid */}
      <div className="tracking-grid">
        {/* Left: Search Results */}
        <Panel
          title="Expedientes encontrados"
          subtitle={`${results.length} coincidencia(s)`}
        >
          <div className="case-list">
            {results.length ? (
              results.map(x => (
                <button
                  key={x.id}
                  className={`case-item ${selected?.id === x.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(x.id)}
                >
                  <div className="case-icon" style={{ background: 'var(--arib-primary-subtle)', color: 'var(--arib-primary)' }}>
                    <Route size={18} />
                  </div>
                  <div className="case-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <b>{x.numero ? `EXP ${x.numero}` : x.tracking}</b>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <StatusBadge status={x.estado} />
                        <SlaBadge exp={x} />
                      </div>
                    </div>
                    <strong>{x.asunto}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <UserRound size={12} /> {x.solicitante}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <Empty
                title="Sin coincidencias"
                text={isApplicant
                  ? (ownItems.length ? 'Ninguna de tus solicitudes coincide con ese término de búsqueda.' : 'Aún no has presentado ninguna solicitud.')
                  : 'No encontramos expedientes con ese término de búsqueda. Verifica el número o escribe el DNI.'}
              />
            )}
          </div>
        </Panel>

        {/* Right: Selected Case Details */}
        <Panel
          title={
            selected
              ? `${selected.numero ? `EXP ${selected.numero}` : selected.tracking} · ${selected.asunto}`
              : 'Detalle de seguimiento'
          }
          subtitle={selected ? `Presentado el ${selected.fecha} · Canal ${selected.canal || 'Virtual'}` : 'Selecciona un expediente para ver su estado.'}
        >
          {selected ? (
            <div className="case-detail">
              {/* Header Badges */}
              <div className="detail-top" style={{ flexWrap: 'wrap', gap: 8 }}>
                <StatusBadge status={selected.estado} />
                <SlaBadge exp={selected} />
                <Badge tone="neutral">Canal {selected.canal || 'Virtual'}</Badge>
                {selected.routeVersion && <Badge tone="info">Ruta v{selected.routeVersion}</Badge>}
              </div>

              {/* Visual Route Stepper */}
              <div style={{ margin: '14px 0 20px' }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 8 }}>
                  Recorrido y Dependencia Actual
                </h4>
                <RouteStrip exp={selected} />
              </div>

              {/* Estado del pago (solo si el trámite tiene costo) */}
              <PaymentStatusCard exp={selected} onViewReceipt={() => setReciboExp(selected)} />

              {/* Key metadata grid */}
              <div
                className="detail-cols"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  background: 'var(--arib-surface-subtle)',
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 18
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: 'var(--arib-navy-light)', display: 'block', textTransform: 'uppercase' }}>
                    Solicitante
                  </span>
                  <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{selected.solicitante}</b>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--arib-navy-light)', display: 'block', textTransform: 'uppercase' }}>
                    Documento Identidad
                  </span>
                  <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{selected.dni || '—'}</b>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--arib-navy-light)', display: 'block', textTransform: 'uppercase' }}>
                    Fecha y Hora
                  </span>
                  <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>
                    {selected.fecha} <small style={{ fontWeight: 'normal' }}>{selected.hora}</small>
                  </b>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--arib-navy-light)', display: 'block', textTransform: 'uppercase' }}>
                    Folios Registrados
                  </span>
                  <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{selected.numeroFolios || 1}</b>
                </div>
              </div>

              {/* Fundamento */}
              {selected.fundamento && (
                <div className="soft-box" style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 600, color: 'var(--arib-navy)', fontSize: 12, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Fundamento del Pedido:
                  </span>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--arib-slate)', lineHeight: 1.5 }}>
                    {selected.fundamento}
                  </p>
                </div>
              )}

              {/* Attachments */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 8 }}>
                  Documentos y Anexos
                </h4>
                <FileList files={selected.adjuntos} />
              </div>

              {/* Audit Timeline */}
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 12 }}>
                  Historial de Movimientos y Actuaciones
                </h4>
                <Timeline items={selected.historial} />
              </div>
            </div>
          ) : (
            <Empty
              title="Selecciona un expediente"
              text="Ingresa un número o selecciona uno de los expedientes encontrados para ver el detalle de trazabilidad."
            />
          )}
        </Panel>
      </div>

      <ReciboPagoModal exp={reciboExp} onClose={() => setReciboExp(null)} />
    </div>
  )
}

