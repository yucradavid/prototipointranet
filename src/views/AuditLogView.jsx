import React, { useState } from 'react'
import { Search, ShieldAlert } from 'lucide-react'
import { Panel, Empty } from '../components/ui'

export default function AuditLogView({ auditLog = [] }) {
  const [q, setQ] = useState('')

  const rows = auditLog.filter(x =>
    `${x.actor} ${x.action} ${x.detail}`.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <Panel
      title="Auditoría de acciones administrativas"
      subtitle="Quién creó, editó o eliminó oficinas, trámites, usuarios, permisos y datos de pago — independiente del historial propio de cada expediente."
      actions={
        <div className="search-mini">
          <Search size={15} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por acción, usuario o detalle…" />
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
                  <Empty title="Sin acciones registradas" text="Aquí aparecerá cada vez que se cree, edite o elimine una oficina, trámite, usuario, rol o dato de pago." />
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
