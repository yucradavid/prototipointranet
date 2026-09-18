import React, { useMemo, useState } from 'react'
import { Search, ShieldAlert, Download } from 'lucide-react'
import { Panel, Empty } from '../components/ui'

// x.time se guarda como "dd/mm/aaaa HH:MM" (ver logAction en App.jsx). Para poder
// filtrar por rango de fecha con un <input type="date"> (que trabaja en aaaa-mm-dd)
// hace falta convertir solo la parte de fecha a ese mismo formato comparable.
const toIsoDate = time => {
  const [d, m, y] = (time || '').split(' ')[0].split('/')
  return d && m && y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
}

export default function AuditLogView({ auditLog = [] }) {
  const [q, setQ] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const actionTypes = useMemo(() =>
    [...new Set(auditLog.map(x => x.action))].sort(),
    [auditLog]
  )

  const rows = useMemo(() => auditLog.filter(x => {
    if (actionFilter !== 'ALL' && x.action !== actionFilter) return false
    const iso = toIsoDate(x.time)
    if (dateFrom && iso && iso < dateFrom) return false
    if (dateTo && iso && iso > dateTo) return false
    return `${x.actor} ${x.action} ${x.detail}`.toLowerCase().includes(q.toLowerCase())
  }), [auditLog, q, actionFilter, dateFrom, dateTo])

  const hasActiveFilters = actionFilter !== 'ALL' || dateFrom || dateTo || q
  const clearFilters = () => { setQ(''); setActionFilter('ALL'); setDateFrom(''); setDateTo('') }

  const exportCsv = () => {
    const header = ['Fecha y hora', 'Realizado por', 'Acción', 'Detalle']
    const data = rows.map(x => [x.time, x.actor, x.action, x.detail])
    const csv = [header, ...data]
      .map(r => r.map(v => `"${String(v || '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'Auditoria_Administrativa_ARIB.csv'
    a.click()
  }

  return (
    <Panel
      title="Auditoría de acciones administrativas"
      subtitle="Quién creó, editó o eliminó oficinas, trámites, usuarios, permisos y datos de pago — independiente del historial propio de cada expediente."
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-mini">
            <Search size={15} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por acción, usuario o detalle…" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ fontSize: 12, height: 34 }}>
            <option value="ALL">Todas las acciones</option>
            {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Desde" style={{ fontSize: 12, height: 34 }} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Hasta" style={{ fontSize: 12, height: 34 }} />
          {hasActiveFilters && (
            <button className="btn ghost" style={{ fontSize: 11, padding: '4px 8px', height: 34 }} onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
          <button className="btn soft" onClick={exportCsv} disabled={!rows.length}>
            <Download size={15} /> Exportar (CSV)
          </button>
        </div>
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Realizado por</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((x, i) => (
              <tr key={i}>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{x.time}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>{x.actor}</td>
                <td style={{ fontSize: 12 }}>{x.action}</td>
                <td style={{ fontSize: 12, color: 'var(--arib-slate)' }}>{x.detail}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4}>
                  <Empty
                    title="Sin acciones registradas"
                    text={hasActiveFilters
                      ? 'Ningún registro coincide con los filtros aplicados.'
                      : 'Aquí aparecerá cada vez que se cree, edite o elimine una oficina, trámite, usuario, rol o dato de pago.'}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {auditLog.length > 0 && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--arib-navy-light)', marginTop: 12 }}>
          <ShieldAlert size={13} /> Se conservan las últimas 200 acciones. "Restaurar demo" también reinicia este registro.
        </p>
      )}
    </Panel>
  )
}
