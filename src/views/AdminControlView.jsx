import React, { useMemo, useState } from 'react'
import {
  Activity, Stamp, CheckCircle2, AlertTriangle, ShieldCheck, Search,
  Clock3, Route, FileText, LayoutGrid, Users, Building2, ChevronRight,
  TrendingUp, BarChart3, AlertCircle, ArrowUpRight
} from 'lucide-react'
import { Kpi, Panel, StatusBadge, SlaBadge, Badge, RouteStrip, Empty } from '../components/ui'
import { PROFILES, officeName, rolePerms } from '../data/catalogs'
import { slaInfo } from '../workflowEngine'

export default function AdminControlView({ items, offices, setActiveView }) {
  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState('ALL') // ALL | DIRECCION | OBSERVADO | OVERDUE | FINALIZADO

  const active = items.filter(x => !['FINALIZADO', 'SOLICITUD_VIRTUAL'].includes(x.estado))
  const finalized = items.filter(x => x.estado === 'FINALIZADO')
  const observed = items.filter(x => x.estado === 'OBSERVADO')
  const inDirection = items.filter(x => x.estado === 'EN_DIRECCION')
  const overdue = items.filter(x => slaInfo(x)?.overdue)

  const rows = useMemo(() => {
    let base = items
    if (filterState === 'ACTIVE') base = active
    else if (filterState === 'DIRECCION') base = inDirection
    else if (filterState === 'OBSERVADO') base = observed
    else if (filterState === 'OVERDUE') base = overdue
    else if (filterState === 'FINALIZADO') base = finalized
    else base = active // default to active

    return base.filter(x =>
      `${x.numero || ''} ${x.tracking || ''} ${x.solicitante} ${x.asunto}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [items, active, inDirection, observed, overdue, finalized, filterState, query])

  const operationalOffices = offices.filter(o => !['mesa_partes', 'direccion'].includes(o.id))
  const officeLoad = operationalOffices.map(o => {
    const count = items.filter(
      x => x.oficinaActual === o.id && ['EN_OFICINA', 'OBSERVADO'].includes(x.estado)
    ).length
    return { office: o, count }
  })
  const maxLoad = Math.max(1, ...officeLoad.map(l => l.count))

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">PANEL ADMINISTRATIVO</span>
          <h1>Centro de Control y Monitoreo Institucional</h1>
          <p>Supervisión en tiempo real de expedientes, cuellos de botella por oficina, cumplimiento de SLA y políticas de acceso.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn soft" onClick={() => setActiveView('book')}>
            <FileText size={16} /> Libro Oficial
          </button>
          <button className="btn primary" onClick={() => setActiveView('workflow')}>
            <Route size={16} /> Administrar Rutas
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="kpi-grid five">
        <div
          onClick={() => setFilterState(filterState === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          style={{ cursor: 'pointer' }}
          title="Clic para filtrar activos"
        >
          <Kpi
            label="En Proceso"
            value={active.length}
            helper="Expedientes en trámite"
            icon={Activity}
            tone={filterState === 'ACTIVE' ? 'blue' : undefined}
          />
        </div>

        <div
          onClick={() => setFilterState(filterState === 'DIRECCION' ? 'ALL' : 'DIRECCION')}
          style={{ cursor: 'pointer' }}
          title="Clic para filtrar en Dirección"
        >
          <Kpi
            label="En Dirección"
            value={inDirection.length}
            helper="Pendiente de proveído"
            icon={Stamp}
            tone="orange"
          />
        </div>

        <div
          onClick={() => setFilterState(filterState === 'OBSERVADO' ? 'ALL' : 'OBSERVADO')}
          style={{ cursor: 'pointer' }}
          title="Clic para filtrar observados"
        >
          <Kpi
            label="Observados"
            value={observed.length}
            helper="Esperando al usuario"
            icon={AlertTriangle}
            tone="pink"
          />
        </div>

        <div
          onClick={() => setFilterState(filterState === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          style={{ cursor: 'pointer' }}
          title="Clic para filtrar fuera de SLA"
        >
          <Kpi
            label="Fuera de SLA"
            value={overdue.length}
            helper="Excedieron plazo legal"
            icon={Clock3}
            tone="pink"
          />
        </div>

        <div
          onClick={() => setFilterState(filterState === 'FINALIZADO' ? 'ALL' : 'FINALIZADO')}
          style={{ cursor: 'pointer' }}
          title="Clic para filtrar finalizados"
        >
          <Kpi
            label="Cerrados"
            value={finalized.length}
            helper="Atendidos con cargo"
            icon={CheckCircle2}
            tone="green"
          />
        </div>
      </div>

      {/* Two Column Layout: Live Monitor + Workload per Office */}
      <div className="admin-two-col">
        {/* Live Monitor Table */}
        <Panel
          title="Monitor en vivo de expedientes"
          subtitle={`Mostrando ${rows.length} expediente(s) ${filterState !== 'ALL' ? `(Filtro: ${filterState})` : '(Activos)'}`}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {filterState !== 'ALL' && (
                <button
                  className="btn ghost"
                  style={{ fontSize: 11, padding: '4px 8px', height: 'auto' }}
                  onClick={() => setFilterState('ALL')}
                >
                  Limpiar filtro
                </button>
              )}
              <div className="search-mini">
                <Search size={15} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por EXP, nombre o asunto…"
                />
              </div>
            </div>
          }
        >
          <div className="monitor-list">
            {rows.length ? (
              rows.map(x => (
                <div className="monitor-row" key={x.id}>
                  <div className="monitor-id">
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <b>{x.numero ? `EXP ${x.numero}` : x.tracking}</b>
                      <StatusBadge status={x.estado} />
                      <SlaBadge exp={x} />
                    </div>
                    <strong style={{ fontSize: 13, color: 'var(--arib-navy)', display: 'block', marginTop: 2 }}>
                      {x.asunto}
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                      Solicitante: <b>{x.solicitante}</b> {x.dni ? `· DNI ${x.dni}` : ''}
                    </span>
                  </div>

                  <div className="monitor-route">
                    <RouteStrip exp={x} compact />
                  </div>

                  <div className="monitor-owner">
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--arib-navy-light)' }}>
                      Ubicación actual
                    </span>
                    <b style={{ color: 'var(--arib-navy)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={13} style={{ color: 'var(--arib-primary)' }} />
                      {officeName(x.oficinaActual)}
                    </b>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                title="Sin registros"
                text="No hay expedientes que coincidan con la búsqueda o filtro seleccionado."
              />
            )}
          </div>
        </Panel>

        {/* Workload Capacity by Office */}
        <Panel
          title="Carga de trabajo por oficina"
          subtitle="Permite detectar inmediatamente cuellos de botella y balancear la atención institucional."
        >
          <div className="office-load">
            {officeLoad.map(({ office, count }) => {
              const pct = Math.min(100, Math.round((count / (maxLoad || 1)) * 100))
              const isHeavy = count >= 3
              return (
                <div key={office.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                  <span
                    className="office-color"
                    style={{
                      background: office.color,
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{office.name}</b>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isHeavy ? 'var(--arib-warning)' : 'var(--arib-navy)' }}>
                        {count} exp.
                      </span>
                    </div>
                    <div className="load-bar" style={{ height: 8, background: 'var(--arib-border)', borderRadius: 4, overflow: 'hidden' }}>
                      <i
                        style={{
                          width: `${pct}%`,
                          background: isHeavy ? 'var(--arib-warning)' : office.color,
                          display: 'block',
                          height: '100%',
                          borderRadius: 4,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* Quick Navigation Cards */}
      <div className="admin-three" style={{ marginTop: 20 }}>
        <button className="admin-card" onClick={() => setActiveView('workflow')}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--arib-primary-subtle)', color: 'var(--arib-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Route size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Trámites y Diseñador de Rutas</b>
              <ArrowUpRight size={16} style={{ color: 'var(--arib-navy-light)' }} />
            </div>
            <span>Configura flujos visuales, versionamiento y simulación interactiva.</span>
          </div>
        </button>

        <button className="admin-card" onClick={() => setActiveView('book')}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--arib-info-subtle)', color: 'var(--arib-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Libro Oficial y Auditoría</b>
              <ArrowUpRight size={16} style={{ color: 'var(--arib-navy-light)' }} />
            </div>
            <span>Registro correlativo de folios, firmas y exportación oficial en CSV.</span>
          </div>
        </button>

        <button className="admin-card" onClick={() => setActiveView('catalog')}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--arib-warning-subtle)', color: 'var(--arib-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Usuarios, Oficinas y Trámites</b>
              <ArrowUpRight size={16} style={{ color: 'var(--arib-navy-light)' }} />
            </div>
            <span>Gestión de accesos, importación CSV de estudiantes y catálogo maestro.</span>
          </div>
        </button>
      </div>

      {/* RBAC Authorization Matrix */}
      <div style={{ marginTop: 20 }}>
        <Panel
          title="Matriz de Autorización y Seguridad (RBAC)"
          subtitle="En producción: el acceso se determina dinámicamente por (Rol + Oficina + Permisos asignados). Ningún perfil operativo está acoplado rígidamente en el frontend."
        >
          <div className="permission-matrix">
            {PROFILES.map(p => {
              const perms=rolePerms(p.id)
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={18} style={{ color: 'var(--arib-primary)', flexShrink: 0 }} />
                    <div>
                      <b>{p.label}</b>
                      <span>
                        Rol: <code>{p.role}</code> {p.office ? `· Oficina: ${officeName(p.office)}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="permission-tags">
                    {perms.slice(0, 4).map(x => (
                      <Badge key={x} tone="neutral">
                        {x}
                      </Badge>
                    ))}
                    {perms.length > 4 && (
                      <Badge tone="info">+{perms.length - 4} más</Badge>
                    )}
                    {perms.length === 0 && (
                      <Badge tone="neutral">Sin permisos asignados</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 14, textAlign: 'right' }}>
            <button className="btn soft" onClick={() => setActiveView('catalog')}>
              <ShieldCheck size={15} /> Editar roles y permisos
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

