import React, { useMemo, useState } from 'react'
import { Search, Download, BookOpen, FileText, CheckCircle2, UserRound, ShieldCheck, Clock3, Eye } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, Timeline } from '../components/ui'
import { officeName } from '../data/catalogs'
import { slaInfo } from '../workflowEngine'

export default function BookAuditView({ items }) {
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const rows = useMemo(() => {
    return items
      .filter(x => x.numero && x.estado !== 'SOLICITUD_VIRTUAL')
      .filter(x => `${x.numero} ${x.solicitante} ${x.asunto} ${x.estado}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.numero - a.numero)
  }, [items, q])

  const selected = items.find(x => x.id === selectedId) || rows[0]

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
            <div className="search-mini">
              <Search size={15} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por N.° Exp, solicitante o asunto…"
              />
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
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(x => (
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
                      <SlaBadge exp={x} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

