import React, { useEffect, useMemo, useState } from 'react'
import { Search, Download, BookOpen, FileText, CheckCircle2, UserRound, ShieldCheck, Clock3, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, Timeline } from '../components/ui'
import { officeName, procedureById, procedureForExpediente } from '../data/catalogs'
import { slaInfo } from '../workflowEngine'

const PAGE_SIZE = 25

// x.fecha se guarda en formato "dd/mm/aaaa" (ver today() en App.jsx). Se convierte a
// "aaaa-mm-dd" para poder compararlo con un <input type="date">.
const toIsoDate = fecha => {
  const [d, m, y] = (fecha || '').split('/')
  return d && m && y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
}

export default function BookAuditView({ items }) {
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)

  const rows = useMemo(() => {
    return items
      .filter(x => x.numero && x.estado !== 'SOLICITUD_VIRTUAL')
      .filter(x => `${x.numero} ${x.solicitante} ${x.asunto} ${x.estado}`.toLowerCase().includes(q.toLowerCase()))
      .filter(x => {
        const iso = toIsoDate(x.fecha)
        if (dateFrom && iso && iso < dateFrom) return false
        if (dateTo && iso && iso > dateTo) return false
        return true
      })
      .sort((a, b) => b.numero - a.numero)
  }, [items, q, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [q, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected = items.find(x => x.id === selectedId) || pageRows[0] || rows[0]

  const paymentLabel = x => {
    const monto = procedureForExpediente(x)?.monto || 0
    if (!monto) return 'Gratuito'
    return x.pago?.estado === 'PAGADO' ? `Pagado (S/ ${Number(x.pago.monto).toFixed(2)})` : `Pendiente (S/ ${Number(monto).toFixed(2)})`
  }

  const exportCsv = () => {
    const header = [
      'N Exp',
      'Fecha',
      'Hora',
      'Tipo Doc',
      'Solicitante',
      'Asunto',
      'Folios',
      'Firma Secretaria',
      'VB Direccion',
      'Oficina actual',
      'Estado',
      'Pago',
      'Vencido SLA'
    ]
    const data = rows.map(x => [
      x.numero,
      x.fecha,
      x.hora,
      x.tipoDocumento,
      x.solicitante,
      x.asunto,
      x.numeroFolios,
      x.firmaSecretaria,
      x.vistoBuenoDireccion,
      officeName(x.oficinaActual),
      x.estado,
      paymentLabel(x),
      slaInfo(x)?.overdue ? 'Sí' : 'No'
    ])
    const csv = [header, ...data]
      .map(r => r.map(v => `"${String(v || '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'Libro_Oficial_Mesa_Partes_ARIB.csv'
    a.click()
  }

  return (
    <div className="role-page">
      {/* Hero Row */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">REGISTRO OFICIAL Y TRAZABILIDAD</span>
          <h1>Libro Digital de Mesa de Partes y Auditoría</h1>
          <p>
            Digitalización del libro oficial de registro con correlativo institucional, control de folios, firmas y auditoría cronológica inmutable.
          </p>
        </div>
        <button className="btn primary big" onClick={exportCsv}>
          <Download size={18} /> Exportar Libro Oficial (CSV)
        </button>
      </div>

      {/* Two Column Layout: Official Book Table + Audit Trail */}
      <div className="book-layout">
        {/* Left: Official Digital Ledger Table */}
        <Panel
          title="Libro Oficial de Registro"
          subtitle={`${rows.length} expediente(s) registrados formalmente`}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-mini">
                <Search size={15} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar por N.° Exp, solicitante o asunto…"
                />
              </div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Desde" style={{ fontSize: 12, height: 34 }} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Hasta" style={{ fontSize: 12, height: 34 }} />
              {(dateFrom || dateTo) && (
                <button className="btn ghost" style={{ fontSize: 11, padding: '4px 8px', height: 34 }} onClick={() => { setDateFrom(''); setDateTo('') }}>
                  Limpiar fechas
                </button>
              )}
            </div>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N.° Exp</th>
                  <th>Fecha / Hora</th>
                  <th>Tipo Trámite</th>
                  <th>Solicitante / Entidad</th>
                  <th>Asunto</th>
                  <th>Folios</th>
                  <th>Firma Sec.</th>
                  <th>V°B° Dir.</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={12} style={{ textAlign: 'center', padding: 24, color: 'var(--arib-navy-light)', fontSize: 13 }}>Ningún expediente coincide con la búsqueda o el rango de fechas.</td></tr>
                )}
                {pageRows.map(x => (
                  <tr
                    key={x.id}
                    className={selected?.id === x.id ? 'selected' : ''}
                    onClick={() => setSelectedId(x.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <b style={{ color: 'var(--arib-primary)' }}>EXP {x.numero}</b>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{x.fecha}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--arib-navy-light)' }}>{x.hora}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{x.tipoDocumento}</td>
                    <td>
                      <b style={{ color: 'var(--arib-navy)', fontSize: 13 }}>{x.solicitante}</b>
                      {x.dni && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--arib-navy-light)' }}>
                          DNI {x.dni}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 12 }}>{x.asunto}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 12 }}>
                      {x.numeroFolios || 1}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {x.firmaSecretaria ? (
                        <span title={`Firmado por ${x.firmaSecretaria}`} style={{ color: 'var(--arib-success)' }}>
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--arib-navy-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {x.vistoBuenoDireccion ? (
                        <span title={`V°B° por ${x.vistoBuenoDireccion}`} style={{ color: 'var(--arib-success)' }}>
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--arib-navy-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{officeName(x.oficinaActual)}</td>
                    <td>
                      <StatusBadge status={x.estado} />
                    </td>
                    <td>
                      {(() => {
                        const monto = procedureForExpediente(x)?.monto || 0
                        if (!monto) return <Badge tone="neutral">Gratuito</Badge>
                        return x.pago?.estado === 'PAGADO'
                          ? <Badge tone="success">Pagado S/ {Number(x.pago.monto).toFixed(2)}</Badge>
                          : <Badge tone="warning">Pendiente S/ {Number(monto).toFixed(2)}</Badge>
                      })()}
                    </td>
                    <td>
                      <SlaBadge exp={x} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                Página {page} de {totalPages} · {rows.length} expediente(s)
              </span>
              <button className="btn ghost" style={{ padding: '4px 8px', height: 30 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn ghost" style={{ padding: '4px 8px', height: 30 }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </Panel>

        {/* Right: Selected Case Audit Details */}
        <Panel
          title={selected ? `Auditoría EXP ${selected.numero}` : 'Auditoría Forense'}
          subtitle={selected ? `Trazabilidad completa: ${selected.asunto}` : 'Selecciona un expediente para inspeccionar su historial.'}
        >
          {selected ? (
            <>
              <div className="audit-summary" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <Badge tone="info">Canal: {selected.canal || 'Virtual'}</Badge>
                <Badge tone="neutral">Ruta v{selected.routeVersion || 1}</Badge>
                <span style={{ fontSize: 12, color: 'var(--arib-navy)', fontWeight: 600 }}>
                  Solicitante: {selected.solicitante}
                </span>
              </div>

              <div className="soft-box" style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--arib-navy-light)', display: 'block' }}>Firma de Mesa de Partes:</span>
                    <b>{selected.firmaSecretaria || 'Pendiente'}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--arib-navy-light)', display: 'block' }}>Visto Bueno Dirección:</span>
                    <b>{selected.vistoBuenoDireccion || 'Pendiente'}</b>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--arib-navy-light)', display: 'block' }}>Proveído de Dirección:</span>
                    <b>{selected.proveido || 'Sin proveído'}</b>
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 12 }}>
                Línea de tiempo inmutable de eventos
              </h4>
              <Timeline items={selected.historial} />
            </>
          ) : (
            <Empty
              title="Selecciona un expediente"
              text="Haz clic en cualquier fila del libro de registro para revisar su auditoría y trazabilidad paso a paso."
            />
          )}
        </Panel>
      </div>
    </div>
  )
}

