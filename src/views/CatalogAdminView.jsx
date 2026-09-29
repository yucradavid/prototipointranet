import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Building2, BookOpen, Users, ShieldCheck, History, Calendar, Info } from 'lucide-react'
import { Panel, Badge, Field } from '../components/ui'
import UserAdminView from './UserAdminView'
import RolePermissionsView from './RolePermissionsView'
import AuditLogView from './AuditLogView'
import OfficeAdminView from './OfficeAdminView'
import ProcedureAdminView from './ProcedureAdminView'


export default function CatalogAdminView({
  offices,
  procedures,
  users,
  rolePermissions,
  officePermissions,
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
  onSaveOfficePermissions,
  onResetOfficePermissions,
  onSavePaymentInfo,
  onSaveHolidays,
  onOpenWorkflow
}) {
  const [tab, setTab] = useState('oficinas')
  const [holidaysList, setHolidaysList] = useState(holidays || [])
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '' })

  useEffect(() => { setHolidaysList(holidays || []) }, [holidays])

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
          onOpenOffices={() => setTab('oficinas')}
        />
      )}

      {/* Tab: Roles & Permissions */}
      {tab === 'roles' && (
        <RolePermissionsView
          offices={offices}
          rolePermissions={rolePermissions}
          officePermissions={officePermissions}
          onSaveRolePermissions={onSaveRolePermissions}
          onSaveOfficePermissions={onSaveOfficePermissions}
          onResetOfficePermissions={onResetOfficePermissions}
          onOpenUsers={() => setTab('usuarios')}
        />
      )}

      {tab === 'oficinas' && (
        <OfficeAdminView
          offices={offices} procedures={procedures} users={users}
          onSaveOffice={onSaveOffice} onDeleteOffice={onDeleteOffice}
          onOpenUsers={() => setTab('usuarios')} onOpenPermissions={() => setTab('roles')}
        />
      )}
      {/* Tab: Procedures */}
      {tab === 'tramites' && (
        <ProcedureAdminView
          procedures={procedures} offices={offices} paymentInfo={paymentInfo}
          onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure}
          onSavePaymentInfo={onSavePaymentInfo} onOpenWorkflow={onOpenWorkflow}
        />
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
    </div>
  )
}

