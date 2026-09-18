import React, { useMemo, useState } from 'react'
import { Wallet, Search, Download, Receipt, Landmark, AlertTriangle, ListChecks, ExternalLink, Pencil, History } from 'lucide-react'
import { Kpi, Panel, Badge, Empty, Field, Modal } from '../components/ui'
import { procedureById } from '../data/catalogs'
import ReciboPagoModal from '../components/ReciboPagoModal'

export default function CashReportView({ items, permissions = [], onEditPayment }) {
  const can = perm => permissions.includes(perm)
  const [q, setQ] = useState('')
  const [reciboExp, setReciboExp] = useState(null)
  const [editExp, setEditExp] = useState(null)
  const [editMonto, setEditMonto] = useState('')
  const [editErr, setEditErr] = useState('')

  const openEdit = exp => { setEditExp(exp); setEditMonto(String(exp.pago.monto)); setEditErr('') }
  const closeEdit = () => { setEditExp(null); setEditErr('') }
  const submitEdit = () => {
    if (!(Number(editMonto) > 0)) { setEditErr('Ingresa el monto corregido.'); return }
    if (Number(editMonto) === Number(editExp.pago.monto)) { setEditErr('El monto corregido debe ser distinto al monto registrado.'); return }
    const result = onEditPayment(editExp, { monto: editMonto })
    if (result) closeEdit()
  }

  const payments = useMemo(() =>
    items
      .filter(x => x.pago?.estado === 'PAGADO')
      .map(x => ({ exp: x, pago: x.pago, proc: procedureById(x.procedureId) }))
      .sort((a, b) => String(b.pago.registradoAt || '').localeCompare(String(a.pago.registradoAt || ''))),
    [items]
  )

  const filtered = useMemo(() =>
    payments.filter(({ exp, pago }) =>
      `${exp.numero} ${exp.solicitante} ${pago.voucher}`.toLowerCase().includes(q.toLowerCase())
    ),
    [payments, q]
  )

  const totalRecaudado = payments.reduce((s, { pago }) => s + Number(pago.monto || 0), 0)

  const pending = items.filter(x =>
    (procedureById(x.procedureId)?.monto || 0) > 0 &&
    x.pago?.estado !== 'PAGADO' &&
    x.estado !== 'FINALIZADO'
  )
  const totalPendiente = pending.reduce((s, x) => s + Number(procedureById(x.procedureId)?.monto || 0), 0)

  const byProcedure = useMemo(() => {
    const map = {}
    payments.forEach(({ exp, pago }) => {
      const key = exp.procedureId
      if (!map[key]) map[key] = { name: procedureById(key)?.name || key, total: 0, count: 0 }
      map[key].total += Number(pago.monto || 0)
      map[key].count += 1
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [payments])
  const maxProcTotal = Math.max(1, ...byProcedure.map(p => p.total))

  const exportCsv = () => {
    const header = ['N Exp', 'Trámite', 'Solicitante', 'Monto', 'Método', 'Voucher', 'Fecha', 'Evidencia']
    const data = filtered.map(({ exp, pago, proc }) => [
      exp.numero, proc?.name || '', exp.solicitante, Number(pago.monto).toFixed(2), pago.metodo, pago.voucher, pago.fecha, pago.comprobante || ''
    ])
    const csv = [header, ...data]
      .map(r => r.map(v => `"${String(v || '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'Reporte_Caja_Pagos_ARIB.csv'
    a.click()
  }

  return (
    <div className="role-page">
      <div className="hero-row">
        <div>
          <span className="eyebrow">TESORERÍA · CONTROL FINANCIERO</span>
          <h1>Caja y Reporte de Pagos</h1>
          <p>
            Consolidado institucional de los derechos de trámite cobrados por Tesorería, con trazabilidad
            de voucher, método de pago y trámites pendientes de cobro.
          </p>
        </div>
        <button className="btn primary big" onClick={exportCsv} disabled={!filtered.length}>
          <Download size={18} /> Exportar reporte (CSV)
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi
          label="Total recaudado"
          value={`S/ ${totalRecaudado.toFixed(2)}`}
          helper="Pagos confirmados y registrados"
          icon={Landmark}
          tone="green"
        />
        <Kpi
          label="Pagos registrados"
          value={payments.length}
          helper="Recibos de caja emitidos"
          icon={Receipt}
          tone="blue"
        />
        <Kpi
          label="Pendiente de cobro"
          value={`S/ ${totalPendiente.toFixed(2)}`}
          helper={`${pending.length} expediente(s) sin pagar`}
          icon={AlertTriangle}
          tone="orange"
        />
        <Kpi
          label="Trámites de pago"
          value={byProcedure.length}
          helper="Conceptos distintos cobrados"
          icon={ListChecks}
          tone="pink"
        />
      </div>

      <div className="admin-two-col">
        <Panel
          title="Historial de pagos"
          subtitle={`${filtered.length} pago(s) registrado(s) por Tesorería`}
          actions={
            <div className="search-mini">
              <Search size={15} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por EXP, solicitante o voucher…"
              />
            </div>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N.° Exp</th>
                  <th>Trámite</th>
                  <th>Solicitante</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Voucher</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Evidencia</th>
                  <th style={{ textAlign: 'right' }}>Recibo</th>
                  {can('case.pay_edit') && <th style={{ textAlign: 'right' }}>Corrección</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(({ exp, pago, proc }) => (
                  <tr key={exp.id}>
                    <td><b style={{ color: 'var(--arib-primary)' }}>EXP {exp.numero}</b></td>
                    <td style={{ fontSize: 12 }}>{proc?.name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{exp.solicitante}</td>
                    <td>
                      <b style={{ color: '#16a34a' }}>S/ {Number(pago.monto).toFixed(2)}</b>
                      {pago.editadoAt && (
                        <div title={`Corregido por ${pago.editadoPor || 'Administrador'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <History size={11} color="#b45309" />
                          <span style={{ fontSize: 10, color: '#b45309' }}>Corregido</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{pago.metodo}</td>
                    <td style={{ fontSize: 12 }}>{pago.voucher}</td>
                    <td style={{ fontSize: 12 }}>{pago.fecha}</td>
                    <td style={{ textAlign: 'right' }}>
                      {pago.comprobante ? (
                        <a href={pago.comprobante} target="_blank" rel="noreferrer" title="Ver evidencia adjunta" style={{ display: 'inline-flex' }}>
                          <ExternalLink size={14} color="#0284c7" />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--arib-navy-light)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost" title="Ver recibo" onClick={() => setReciboExp(exp)}>
                        <Receipt size={14} />
                      </button>
                    </td>
                    {can('case.pay_edit') && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost" title="Corregir monto (solo Administrador)" onClick={() => openEdit(exp)}>
                          <Pencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={can('case.pay_edit') ? 10 : 9}>
                      <Empty title="Sin pagos registrados" text="Aún no se ha registrado ningún pago de derecho de trámite en Tesorería." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Recaudación por trámite"
          subtitle="Permite identificar qué conceptos generan más ingresos institucionales."
        >
          {byProcedure.length ? (
            <div className="office-load">
              {byProcedure.map(p => {
                const pct = Math.min(100, Math.round((p.total / maxProcTotal) * 100))
                return (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <Wallet size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{p.name}</b>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--arib-navy)' }}>
                          S/ {p.total.toFixed(2)} <Badge tone="neutral">{p.count}</Badge>
                        </span>
                      </div>
                      <div className="load-bar" style={{ height: 8, background: 'var(--arib-border)', borderRadius: 4, overflow: 'hidden' }}>
                        <i style={{ width: `${pct}%`, background: '#16a34a', display: 'block', height: '100%', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty title="Sin recaudación" text="Aún no hay pagos registrados para desglosar por trámite." />
          )}

          {pending.length > 0 && (
            <div className="observation-card" style={{ marginTop: 18, background: 'var(--arib-warning-subtle, #fffbeb)', borderColor: '#fde68a' }}>
              <AlertTriangle size={22} style={{ color: '#b45309', flexShrink: 0 }} />
              <div>
                <b style={{ color: '#b45309', fontSize: 13 }}>
                  {pending.length} expediente(s) con pago pendiente · S/ {totalPendiente.toFixed(2)}
                </b>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#92400e' }}>
                  Corresponden a trámites de pago que aún no llegan a Tesorería o cuyo comprobante no ha sido registrado.
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <ReciboPagoModal exp={reciboExp} onClose={() => setReciboExp(null)} />

      <Modal
        open={!!editExp}
        onClose={closeEdit}
        title="Corregir monto del pago"
        subtitle={editExp ? `EXP ${editExp.numero} · ${editExp.solicitante}. Solo el Administrador puede realizar esta corrección, como control adicional.` : ''}
        footer={
          <>
            <button className="btn" onClick={closeEdit}>Cancelar</button>
            <button className="btn primary" onClick={submitEdit}>Guardar corrección</button>
          </>
        }
      >
        {editExp && (
          <>
            <Field label="Monto registrado originalmente">
              <input value={`S/ ${Number(editExp.pago.monto).toFixed(2)}`} disabled />
            </Field>
            <Field label="Monto corregido (S/)" required>
              <input type="number" min="0.01" step="0.01" value={editMonto} onChange={e => setEditMonto(e.target.value)} autoFocus />
            </Field>
            {editErr && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{editErr}</p>}
          </>
        )}
      </Modal>
    </div>
  )
}
