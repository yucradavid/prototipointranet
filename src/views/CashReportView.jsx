import React, { useMemo, useState } from 'react'
import { Wallet, Search, Download, Receipt, Landmark, AlertTriangle, ListChecks, ExternalLink, Pencil, History } from 'lucide-react'
import { Kpi, Panel, Badge, Empty, Field, Modal } from '../components/ui'
import { procedureById, procedureForExpediente, officeName } from '../data/catalogs'
import ReciboPagoModal from '../components/ReciboPagoModal'
import { fuzzyFilter } from '../utils/search.js'

// ─── Cierre de caja por periodo (año/trimestre/mes/semana) ─────────────────────
// Rendición de cuentas por comisión (decisión 2026-09-28): cada oficina habilitada
// para cobrar pagos (sub-tesorería) necesita ver sus propios totales agrupados por
// periodo, separado del reporte continuo de Tesorería.
const PERIODS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Año' },
]
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

function parsePeriodDate(fecha) {
  const [d, m, y] = String(fecha || '').split('/').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}

// Semana ISO 8601: la semana que contiene el primer jueves del año es la semana 1.
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return { year: d.getUTCFullYear(), week }
}

function periodKey(fecha, granularity) {
  const d = parsePeriodDate(fecha)
  if (!d) return { key: '—', label: '— (fecha inválida)', sortable: 0 }
  if (granularity === 'week') {
    const { year, week } = isoWeek(d)
    return { key: `${year}-W${week}`, label: `Semana ${week} · ${year}`, sortable: year * 100 + week }
  }
  if (granularity === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1
    return { key: `${d.getFullYear()}-Q${q}`, label: `Trimestre ${q} · ${d.getFullYear()}`, sortable: d.getFullYear() * 10 + q }
  }
  if (granularity === 'year') {
    return { key: String(d.getFullYear()), label: String(d.getFullYear()), sortable: d.getFullYear() }
  }
  return { key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, sortable: d.getFullYear() * 100 + (d.getMonth() + 1) }
}

// Redondea el techo del eje Y a un número "limpio" (10, 20, 50, 100, 200, 500...)
// en vez de usar el máximo exacto de los datos, para que las líneas de referencia
// sean legibles (0 / mitad / techo) en vez de números arbitrarios.
function niceMax(value) {
  if (!(value > 0)) return 10
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const norm = value / base
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return step * base
}

// Camino de una barra con esquinas redondeadas SOLO arriba (4px) y base cuadrada
// apoyada en la línea de base — una barra con las 4 esquinas redondeadas "flota".
function roundedTopBarPath(x, yTop, w, yBase) {
  const r = Math.min(4, w / 2, Math.max(0, yBase - yTop))
  if (r <= 0) return `M${x},${yTop} L${x + w},${yTop} L${x + w},${yBase} L${x},${yBase} Z`
  return `M${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${yBase} L${x},${yBase} Z`
}

const CHART_W = 640, CHART_H = 200, CHART_TOP = 14, CHART_BOTTOM = 168, CHART_LEFT = 44, CHART_RIGHT = 12

// Barras de recaudación por día. "Recaudación por trámite" (más abajo) ya responde
// QUÉ concepto genera más ingresos; esto responde CUÁNDO entró la plata — un bache
// o una racha se ve acá y no en el ranking por concepto.
function DailyRevenueChart({ data }) {
  const [hover, setHover] = useState(null)
  if (!data.length) return <Empty title="Sin recaudación" text="Aún no hay pagos registrados para mostrar por fecha." />

  const max = niceMax(Math.max(...data.map(d => d.total)))
  const n = data.length
  const slot = (CHART_W - CHART_LEFT - CHART_RIGHT) / n
  const barW = Math.min(24, slot * 0.6)
  const yFor = v => CHART_BOTTOM - (v / max) * (CHART_BOTTOM - CHART_TOP)
  const ticks = [0, max / 2, max]

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} role="img" aria-label="Recaudación por fecha">
      {/* Líneas de referencia del eje Y, recesivas */}
      {ticks.map(t => (
        <g key={t}>
          <line x1={CHART_LEFT} x2={CHART_W - CHART_RIGHT} y1={yFor(t)} y2={yFor(t)} stroke="var(--line, #e2e8f0)" strokeWidth="1" />
          <text x={CHART_LEFT - 6} y={yFor(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--muted, #64748b)">
            {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : Math.round(t)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = CHART_LEFT + i * slot + (slot - barW) / 2
        const yTop = yFor(d.total)
        const isHover = hover === i
        return (
          <g key={d.fecha}>
            {/* Área de acierto: todo el carril, más ancha que la barra visible */}
            <rect
              x={CHART_LEFT + i * slot} y={CHART_TOP} width={slot} height={CHART_BOTTOM - CHART_TOP}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${d.fecha}: S/ ${d.total.toFixed(2)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{ outline: 'none', cursor: 'pointer' }}
            />
            <path d={roundedTopBarPath(x, yTop, barW, CHART_BOTTOM)} fill={isHover ? '#059669' : '#16a34a'} style={{ pointerEvents: 'none', transition: 'fill 0.15s' }} />
            {/* Etiqueta de fecha bajo la barra: día/mes corto para no amontonar */}
            <text x={x + barW / 2} y={CHART_BOTTOM + 14} textAnchor="middle" fontSize="9" fill="var(--muted, #64748b)" style={{ pointerEvents: 'none' }}>
              {d.fecha.slice(0, 5)}
            </text>
            {isHover && (
              <text x={x + barW / 2} y={Math.max(CHART_TOP + 9, yTop - 6)} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--arib-navy, #091a2b)" style={{ pointerEvents: 'none' }}>
                S/ {d.total.toFixed(2)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function CashReportView({ items, offices = [], permissions = [], onEditPayment, scopeOfficeId }) {
  const can = perm => permissions.includes(perm)
  const [q, setQ] = useState('')
  const [reciboExp, setReciboExp] = useState(null)
  const [editExp, setEditExp] = useState(null)
  const [editMonto, setEditMonto] = useState('')
  const [editErr, setEditErr] = useState('')
  const [officeFilter, setOfficeFilter] = useState('all')
  const [granularity, setGranularity] = useState('month')

  // scopeOfficeId: una oficina no-admin (sub-tesorería) siempre ve solo lo suyo. El
  // Administrador, sin scope, puede elegir "todas" o una oficina puntual con el selector.
  const payingOffices = offices.filter(o => o.collectsPayment)
  const effectiveOfficeId = scopeOfficeId || (officeFilter !== 'all' ? officeFilter : null)

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
      .filter(x => x.pago?.estado === 'PAGADO' && (!effectiveOfficeId || (x.pago.oficinaId || 'tesoreria') === effectiveOfficeId))
      .map(x => ({ exp: x, pago: x.pago, proc: procedureForExpediente(x) }))
      .sort((a, b) => String(b.pago.registradoAt || '').localeCompare(String(a.pago.registradoAt || ''))),
    [items, effectiveOfficeId]
  )

  const filtered = useMemo(() =>
    fuzzyFilter(payments, q, ({ exp, pago }) => `${exp.numero} ${exp.solicitante} ${pago.voucher}`),
    [payments, q]
  )

  const totalRecaudado = payments.reduce((s, { pago }) => s + Number(pago.monto || 0), 0)

  // Sin scope: igual que siempre, cualquier trámite de pago aún no pagado (llegue o no a
  // haber llegado a una oficina que cobra). Con scope (una sub-tesorería o el filtro del
  // Administrador): solo lo que está actualmente detenido en ESA oficina esperando pago —
  // es lo único que esa oficina puede accionar.
  const pending = items.filter(x =>
    (procedureForExpediente(x)?.monto || 0) > 0 &&
    x.pago?.estado !== 'PAGADO' &&
    x.estado !== 'FINALIZADO' &&
    (!effectiveOfficeId || x.oficinaActual === effectiveOfficeId)
  )
  const totalPendiente = pending.reduce((s, x) => s + Number(procedureForExpediente(x)?.monto || 0), 0)

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

  const byDate = useMemo(() => {
    const map = {}
    payments.forEach(({ pago }) => {
      const key = pago.fecha || '—'
      map[key] = (map[key] || 0) + Number(pago.monto || 0)
    })
    const toSortable = f => {
      const [d, m, y] = String(f || '').split('/').map(Number)
      return d && m && y ? y * 10000 + m * 100 + d : 0
    }
    return Object.entries(map)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => toSortable(a.fecha) - toSortable(b.fecha))
  }, [payments])

  const byPeriod = useMemo(() => {
    const map = {}
    payments.forEach(({ pago }) => {
      const { key, label, sortable } = periodKey(pago.fecha, granularity)
      if (!map[key]) map[key] = { key, label, total: 0, count: 0, sortable }
      map[key].total += Number(pago.monto || 0)
      map[key].count += 1
    })
    return Object.values(map).sort((a, b) => b.sortable - a.sortable)
  }, [payments, granularity])

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
          <span className="eyebrow">{scopeOfficeId ? `${officeName(scopeOfficeId).toUpperCase()} · CIERRE DE CAJA` : 'CAJA · CONTROL FINANCIERO INSTITUCIONAL'}</span>
          <h1>{scopeOfficeId ? `Caja de ${officeName(scopeOfficeId)}` : 'Caja y Reporte de Pagos'}</h1>
          <p>
            {scopeOfficeId
              ? `Consolidado de los derechos de trámite cobrados por ${officeName(scopeOfficeId)}, con trazabilidad de voucher, método de pago y cierre por periodo.`
              : 'Consolidado institucional de los derechos de trámite cobrados, con trazabilidad de voucher, método de pago y trámites pendientes de cobro.'}
          </p>
          {scopeOfficeId && scopeOfficeId !== 'tesoreria' && <Badge tone="success">Sub-tesorería de Tesorería</Badge>}
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
          subtitle={`${filtered.length} pago(s) registrado(s)${scopeOfficeId ? ` por ${officeName(scopeOfficeId)}` : ''}`}
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {!scopeOfficeId && payingOffices.length > 1 && (
                <select value={officeFilter} onChange={e => setOfficeFilter(e.target.value)} style={{ fontSize: 12, height: 34 }} title="Filtrar por oficina que cobra">
                  <option value="all">Todas (Tesorería + sub-tesorerías)</option>
                  {payingOffices.map(o => <option key={o.id} value={o.id}>{o.id === 'tesoreria' ? o.name : `↳ ${o.name} (sub-tesorería)`}</option>)}
                </select>
              )}
              <div className="search-mini">
                <Search size={15} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar por EXP, solicitante o voucher…"
                />
              </div>
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
                      <Empty title="Sin pagos registrados" text={`Aún no se ha registrado ningún pago de derecho de trámite${scopeOfficeId ? ` en ${officeName(scopeOfficeId)}` : ''}.`} />
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
                  {scopeOfficeId
                    ? `Expedientes detenidos en ${officeName(scopeOfficeId)} esperando el registro del pago.`
                    : 'Corresponden a trámites de pago que aún no llegan a la oficina que cobra o cuyo comprobante no ha sido registrado.'}
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div style={{ marginTop: 20 }}>
        <Panel
          title="Recaudación por fecha"
          subtitle="Cuánto entró y cuándo — pasa el mouse (o navega con Tab) sobre una barra para ver el monto exacto del día."
        >
          <DailyRevenueChart data={byDate} />
        </Panel>
      </div>

      <div style={{ marginTop: 20 }}>
        <Panel
          title="Cierre de caja por periodo"
          subtitle={scopeOfficeId
            ? `Rendición de cuentas de ${officeName(scopeOfficeId)}, agrupada por periodo para su cierre.`
            : 'Rendición de cuentas agrupada por periodo — útil para el cierre de cada comisión que cobra pagos.'}
          actions={
            <select value={granularity} onChange={e => setGranularity(e.target.value)} style={{ fontSize: 12, height: 34 }}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          }
        >
          {byPeriod.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Pagos</th>
                    <th style={{ textAlign: 'right' }}>Total recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {byPeriod.map(row => (
                    <tr key={row.key}>
                      <td><b style={{ color: 'var(--arib-navy)' }}>{row.label}</b></td>
                      <td>{row.count}</td>
                      <td style={{ textAlign: 'right' }}><b style={{ color: '#16a34a' }}>S/ {row.total.toFixed(2)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sin recaudación en este alcance" text="Aún no hay pagos registrados para agrupar por periodo." />
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
