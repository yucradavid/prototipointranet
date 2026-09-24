import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, LockKeyhole, Building2, BookOpen, Users, ShieldCheck, Wallet, History, Search, AlertTriangle, Info, Calendar } from 'lucide-react'
import { Panel, Badge, Modal, Field } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import UserAdminView from './UserAdminView'
import RolePermissionsView from './RolePermissionsView'
import AuditLogView from './AuditLogView'
import { officeName } from '../data/catalogs'

const emptyOffice = { name: '', short: '', color: '#0284c7', roleTitle: 'Encargado', note: '', provisional: false }

export default function CatalogAdminView({
  offices,
  procedures,
  users,
  rolePermissions,
  paymentInfo,
  holidays,
  auditLog,
  onSaveOffice,
  onDeleteOffice,
  onSaveProcedure,
  onDeleteProcedure,
  onSaveUser,
  onDeleteUser,
  onResetPassword,
  onToggleUserActive,
  onBulkSetActive,
  onImportStudents,
  onSaveRolePermissions,
  onSavePaymentInfo,
  onSaveHolidays
}) {
  const [tab, setTab] = useState('oficinas')
  const [officeModal, setOfficeModal] = useState(null)
  const [procModal, setProcModal] = useState(null)
  const [paymentForm, setPaymentForm] = useState(paymentInfo)
  const [holidaysList, setHolidaysList] = useState(holidays || [])
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '' })
  const [officeQuery, setOfficeQuery] = useState('')
  const [procQuery, setProcQuery] = useState('')

  useEffect(() => { setPaymentForm(paymentInfo) }, [paymentInfo])
  useEffect(() => { setHolidaysList(holidays || []) }, [holidays])

  const filteredOffices = useMemo(() =>
    offices.filter(o => `${o.name} ${o.short} ${o.roleTitle || ''}`.toLowerCase().includes(officeQuery.toLowerCase())),
    [offices, officeQuery]
  )
  const filteredProcedures = useMemo(() =>
    procedures.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(procQuery.toLowerCase())),
    [procedures, procQuery]
  )

  const saveOffice = () => {
    if (!officeModal?.name?.trim()) return
    onSaveOffice(officeModal)
    setOfficeModal(null)
  }

  const saveProcedure = data => {
    onSaveProcedure(data)
    setProcModal(null)
  }

  const paymentFormDirty = JSON.stringify(paymentForm) !== JSON.stringify(paymentInfo)
  const savePaymentInfo = () => {
    if (!paymentForm?.yape?.trim() && !paymentForm?.cuenta?.trim()) return
    onSavePaymentInfo(paymentForm)
  }

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">CATÁLOGOS MAESTROS</span>
          <h1>Usuarios, Dependencias y Tipos de Trámite</h1>
          <p>
            Administración centralizada de cuentas de acceso, organigrama de dependencias operativas y catálogo de trámites institucionales.
          </p>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="segmented" style={{ marginBottom: 20 }}>
        <button
          className={tab === 'oficinas' ? 'active' : ''}
          onClick={() => setTab('oficinas')}
        >
          <Building2 size={16} style={{ marginRight: 6 }} />
          Oficinas y Dependencias <i>{offices.length}</i>
        </button>
        <button
          className={tab === 'tramites' ? 'active' : ''}
          onClick={() => setTab('tramites')}
        >
          <BookOpen size={16} style={{ marginRight: 6 }} />
          Catálogo de Trámites <i>{procedures.length}</i>
        </button>
        <button
          className={tab === 'usuarios' ? 'active' : ''}
          onClick={() => setTab('usuarios')}
        >
          <Users size={16} style={{ marginRight: 6 }} />
          Usuarios y Accesos <i>{users.length}</i>
        </button>
        <button
          className={tab === 'roles' ? 'active' : ''}
          onClick={() => setTab('roles')}
        >
          <ShieldCheck size={16} style={{ marginRight: 6 }} />
          Roles y Permisos
        </button>
        <button
          className={tab === 'auditoria' ? 'active' : ''}
          onClick={() => setTab('auditoria')}
        >
          <History size={16} style={{ marginRight: 6 }} />
          Auditoría <i>{auditLog?.length || 0}</i>
        </button>
        <button
          className={tab === 'feriados' ? 'active' : ''}
          onClick={() => setTab('feriados')}
        >
          <Calendar size={16} style={{ marginRight: 6 }} />
          Feriados <i>{holidaysList.length}</i>
        </button>
      </div>

      {/* Tab: Audit Log */}
      {tab === 'auditoria' && <AuditLogView auditLog={auditLog} />}

      {/* Tab: Users */}
      {tab === 'usuarios' && (
        <UserAdminView
          users={users}
          offices={offices}
          onSaveUser={onSaveUser}
          onDeleteUser={onDeleteUser}
          onResetPassword={onResetPassword}
          onToggleActive={onToggleUserActive}
          onBulkSetActive={onBulkSetActive}
          onImportStudents={onImportStudents}
        />
      )}

      {/* Tab: Roles & Permissions */}
      {tab === 'roles' && (
        <RolePermissionsView
          rolePermissions={rolePermissions}
          onSaveRolePermissions={onSaveRolePermissions}
        />
      )}

      {tab === 'oficinas' && (
        <Panel
          title="Oficinas y Dependencias Institucionales"
          subtitle="Mesa de Partes y Dirección General son dependencias fijas por regla del sistema; las demás oficinas pueden administrarse libremente."
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-mini">
                <Search size={15} />
                <input value={officeQuery} onChange={e => setOfficeQuery(e.target.value)} placeholder="Buscar oficina…" />
              </div>
              <button className="btn primary" onClick={() => setOfficeModal({ ...emptyOffice })}>
                <Plus size={16} /> Nueva oficina
              </button>
            </div>
          }
        >
          {/* Aviso de oficinas provisionales */}
          {offices.some(o => o.provisional) && (
            <div className="rule-banner" style={{ marginBottom: 16 }}>
              <AlertTriangle size={18} style={{ color: '#b45309', flexShrink: 0 }} />
              <div>
                <b>Hay {offices.filter(o => o.provisional).length} oficina(s) provisionales pendientes de validación</b>
                <span>
                  Aparecen en el Excel TUSNE 2026 pero aún no se ha confirmado con la institución si son
                  dependencias formales, cargos dentro de otra oficina o comisiones temporales. No asignarlas
                  a rutas de producción hasta confirmar. Lee la columna "Notas" para el detalle de cada una.
                </span>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dependencia / Oficina</th>
                  <th>Código</th>
                  <th>Color</th>
                  <th>Tipo</th>
                  <th>Notas de correspondencia TUSNE</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffices.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--arib-navy-light)', fontSize: 13 }}>Sin oficinas que coincidan con la búsqueda.</td></tr>
                )}
                {filteredOffices.map(o => {
                  const locked = ['mesa_partes', 'direccion'].includes(o.id)
                  return (
                    <tr key={o.id} style={o.provisional ? { background: '#fffbeb' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ background: o.color, display: 'inline-block', width: 14, height: 14, borderRadius: 4, flexShrink: 0 }} />
                          <div>
                            <b>{o.name}</b>
                            {o.roleTitle && <div style={{ fontSize: 11, color: 'var(--arib-navy-light)' }}>{o.roleTitle}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: 'var(--arib-surface-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{o.short}</code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 24, height: 16, background: o.color, borderRadius: 4, border: '1px solid var(--arib-border)' }} />
                          <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>{o.color}</span>
                        </div>
                      </td>
                      <td>
                        {locked ? (
                          <Badge tone="neutral"><LockKeyhole size={11} style={{ marginRight: 4 }} />Fija</Badge>
                        ) : o.provisional ? (
                          <Badge tone="warning"><AlertTriangle size={11} style={{ marginRight: 4 }} />Provisional</Badge>
                        ) : (
                          <Badge tone="info">Operativa</Badge>
                        )}
                      </td>
                      <td style={{ maxWidth: 280, fontSize: 12, color: 'var(--arib-slate)' }}>
                        {o.note ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                            <Info size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                            <span>{o.note}</span>
                          </div>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {locked ? (
                          <span style={{ fontSize: 12, color: 'var(--arib-navy-light)', fontStyle: 'italic' }}>Protegida</span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn ghost" title="Editar oficina" onClick={() => setOfficeModal({ ...o })}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn danger-soft" title="Eliminar oficina" onClick={() => onDeleteOffice(o.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Tab: Procedures */}
      {tab === 'tramites' && (
        <>
        <Panel
          title="Datos de pago institucional"
          subtitle="Dónde debe pagar el solicitante el derecho de trámite (se muestra en el FUT virtual y en el seguimiento). Un solo destino, compartido por todos los trámites con costo."
        >
          <div className="form-grid two">
            <Field label="Número Yape / Plin">
              <input
                value={paymentForm?.yape || ''}
                onChange={e => setPaymentForm({ ...paymentForm, yape: e.target.value })}
                placeholder="Ej. 958 000 000"
              />
            </Field>
            <Field label="Titular de la cuenta">
              <input
                value={paymentForm?.titular || ''}
                onChange={e => setPaymentForm({ ...paymentForm, titular: e.target.value })}
                placeholder="Nombre de la institución o titular"
              />
            </Field>
            <Field label="Banco">
              <input
                value={paymentForm?.banco || ''}
                onChange={e => setPaymentForm({ ...paymentForm, banco: e.target.value })}
                placeholder="Ej. Banco de la Nación"
              />
            </Field>
            <Field label="N.° de cuenta">
              <input
                value={paymentForm?.cuenta || ''}
                onChange={e => setPaymentForm({ ...paymentForm, cuenta: e.target.value })}
                placeholder="Ej. 00-000-000000"
              />
            </Field>
            <Field label="CCI (interbancario)">
              <input
                value={paymentForm?.cci || ''}
                onChange={e => setPaymentForm({ ...paymentForm, cci: e.target.value })}
                placeholder="Ej. 018-000-000000000000-00"
              />
            </Field>
          </div>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button className="btn primary" disabled={!paymentFormDirty} onClick={savePaymentInfo}>
              <Wallet size={16} /> Guardar datos de pago
            </button>
          </div>
        </Panel>

        <Panel
          title="Catálogo General de Trámites"
          subtitle="Cada trámite define sus requisitos y su ruta inicial de derivación; Dirección General y el Administrador de Flujos pueden versionarla dinámicamente."
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-mini">
                <Search size={15} />
                <input value={procQuery} onChange={e => setProcQuery(e.target.value)} placeholder="Buscar trámite o categoría…" />
              </div>
              <button className="btn primary" onClick={() => setProcModal({})}>
                <Plus size={16} /> Nuevo trámite
              </button>
            </div>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Denominación del trámite</th>
                  <th>Categoría</th>
                  <th>Requisitos referenciales</th>
                  <th>Plazo (SLA)</th>
                  <th>Costo</th>
                  <th>Ruta canónica de dependencias</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcedures.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--arib-navy-light)', fontSize: 13 }}>Sin trámites que coincidan con la búsqueda.</td></tr>
                )}
                {filteredProcedures.map(p => (
                  <tr key={p.id}>
                    <td>
                      <b style={{ color: 'var(--arib-navy)' }}>{p.name}</b>
                      <div><Badge tone={p.active === false ? 'neutral' : 'info'}>{p.active === false ? 'Inactivo' : 'Activo'}</Badge></div>
                      <small>{p.verificationStatus === 'confirmed' ? 'Fuente confirmada' : 'Fuente pendiente de confirmar'}{p.source ? ` · ${p.source}` : ''}{p.validFrom ? ` · Desde ${p.validFrom}` : ''}</small>
                    </td>
                    <td>
                      <Badge tone="neutral">{p.category}</Badge>
                    </td>
                    <td style={{ maxWidth: 260, fontSize: 12, color: 'var(--arib-slate)' }}>
                      {p.requires || 'Sin requisitos específicos'}
                    </td>
                    <td>
                      <Badge tone="info">{p.sla} días hábiles</Badge>
                    </td>
                    <td>
                      {p.tariffStatus === 'pending' ? <Badge tone="warning">Tarifa pendiente</Badge> : p.monto > 0 ? (
                        <Badge tone="warning">S/ {Number(p.monto).toFixed(2)}</Badge>
                      ) : (
                        <Badge tone="success">Gratuito</Badge>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 12 }}>
                        {(p.route || []).map((id, idx) => (
                          <React.Fragment key={id}>
                            {idx > 0 && <span style={{ color: 'var(--arib-navy-light)' }}>→</span>}
                            <span style={{ fontWeight: 600, color: 'var(--arib-navy)' }}>
                              {officeName(id)}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn ghost"
                          title="Editar trámite"
                          onClick={() => setProcModal({ ...p })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn danger-soft"
                          title="Eliminar trámite"
                          onClick={() => onDeleteProcedure(p.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        </>
      )}

      {/* Tab: Feriados */}
      {tab === 'feriados' && (
        <Panel
          title="Calendario de Feriados y Días No Hábiles"
          subtitle="Los feriados aquí registrados se excluyen automáticamente del cómputo de SLA (días hábiles). Los fines de semana siempre se excluyen. Agrega también los días de cierre institucional propios de ARIB."
        >
          <div className="rule-banner" style={{ marginBottom: 16 }}>
            <Info size={18} style={{ color: '#0369a1', flexShrink: 0 }} />
            <div>
              <b>¿Cómo afecta al SLA?</b>
              <span>
                El plazo normativo (DS 006-2017-PCM) comienza el día hábil siguiente al de la presentación.
                Feriados y fines de semana no cuentan. El SLA se pausa además mientras el expediente esté
                observado o con pago pendiente en Tesorería.
              </span>
            </div>
          </div>

          {/* Formulario de nuevo feriado */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
            <Field label="Fecha (YYYY-MM-DD)" hint="Formato: 2026-07-28">
              <input
                type="date"
                value={holidayForm.date}
                onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: 170 }}
              />
            </Field>
            <Field label="Descripción">
              <input
                value={holidayForm.name}
                onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Fiestas Patrias, Cierre institucional"
                style={{ width: 280 }}
              />
            </Field>
            <button
              className="btn primary"
              disabled={!holidayForm.date || !holidayForm.name.trim()}
              onClick={() => {
                if (holidaysList.some(h => h.date === holidayForm.date)) return
                const updated = [...holidaysList, { date: holidayForm.date, name: holidayForm.name.trim() }]
                  .sort((a, b) => a.date.localeCompare(b.date))
                setHolidaysList(updated)
                onSaveHolidays(updated)
                setHolidayForm({ date: '', name: '' })
              }}
              style={{ marginBottom: 2 }}
            >
              <Plus size={15} /> Agregar feriado
            </button>
          </div>

          {/* Tabla de feriados */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Día de la semana</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {holidaysList.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--arib-navy-light)', fontSize: 13 }}>Sin feriados registrados.</td></tr>
                )}
                {holidaysList.map((h, i) => {
                  const d = new Date(h.date + 'T12:00:00')
                  const dow = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <tr key={h.date} style={isWeekend ? { background: '#fef9c3' } : {}}>
                      <td>
                        <code style={{ background: 'var(--arib-surface-subtle)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          {h.date}
                        </code>
                      </td>
                      <td>
                        <Badge tone={isWeekend ? 'warning' : 'neutral'}>{dow}</Badge>
                        {isWeekend && <span style={{ fontSize: 11, color: '#92400e', marginLeft: 6 }}>ya excluido como fin de semana</span>}
                      </td>
                      <td style={{ fontSize: 13 }}>{h.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn danger-soft"
                          title="Eliminar feriado"
                          onClick={() => {
                            const updated = holidaysList.filter((_, xi) => xi !== i)
                            setHolidaysList(updated)
                            onSaveHolidays(updated)
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--arib-navy-light)' }}>
            {holidaysList.length} feriado(s) registrado(s) · Los fines de semana siempre se excluyen automáticamente, aunque estén en esta lista.
          </div>
        </Panel>
      )}

      {/* Office Modal */}
      <Modal
        open={!!officeModal}
        onClose={() => setOfficeModal(null)}
        title={officeModal?.id ? 'Editar Dependencia / Oficina' : 'Nueva Dependencia / Oficina'}
        subtitle="Registra el nombre oficial y el color distintivo para el seguimiento en mapas de ruta."
        size="md"
        footer={
          <>
            <button className="btn ghost" onClick={() => setOfficeModal(null)}>Cancelar</button>
            <button className="btn primary" disabled={!officeModal?.name?.trim()} onClick={saveOffice}>Guardar oficina</button>
          </>
        }
      >
        {officeModal && (
          <div className="form-grid two">
            <Field label="Nombre oficial de la oficina" required>
              <input value={officeModal.name} onChange={e => setOfficeModal({ ...officeModal, name: e.target.value })} placeholder="Ej. Unidad de Bienestar y Empleabilidad" />
            </Field>
            <Field label="Código corto / Siglas" required>
              <input value={officeModal.short} maxLength={8} onChange={e => setOfficeModal({ ...officeModal, short: e.target.value.toUpperCase() })} placeholder="Ej. UBE" />
            </Field>
            <Field label="Cargo de quien la atiende" hint='Cómo se le llama en la institución (ej. "Encargado", "Jefe de Área"). Se muestra como "[Cargo] de [Oficina]".'>
              <input value={officeModal.roleTitle || ''} onChange={e => setOfficeModal({ ...officeModal, roleTitle: e.target.value })} placeholder="Encargado" />
            </Field>
            <Field label="Color representativo" hint="Se usa en los nodos y badges de ruta" required>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="color" value={officeModal.color} onChange={e => setOfficeModal({ ...officeModal, color: e.target.value })} style={{ width: 44, height: 38, padding: 2, cursor: 'pointer', borderRadius: 6 }} />
                <input value={officeModal.color} onChange={e => setOfficeModal({ ...officeModal, color: e.target.value })} placeholder="#0284c7" style={{ width: 110 }} />
              </div>
            </Field>
            <Field label="Estado" hint="Marcar como provisional mientras la institución no confirme si es una dependencia formal.">
              <select value={officeModal.provisional ? 'provisional' : 'operativa'} onChange={e => setOfficeModal({ ...officeModal, provisional: e.target.value === 'provisional' })}>
                <option value="operativa">Operativa (confirmada)</option>
                <option value="provisional">Provisional (pendiente de validar)</option>
              </select>
            </Field>
            <Field label="Notas de correspondencia" hint="Referencia al Excel o aclaración institucional para esta dependencia.">
              <input value={officeModal.note || ''} onChange={e => setOfficeModal({ ...officeModal, note: e.target.value })} placeholder="Ej. TUSNE fila 105 · confirmar si es cargo o dependencia" />
            </Field>
          </div>
        )}
      </Modal>

      {/* Procedure Modal */}
      {procModal && (
        <ProcedureFormModal
          procedure={procModal}
          offices={offices}
          onClose={() => setProcModal(null)}
          onSave={saveProcedure}
        />
      )}
    </div>
  )
}

