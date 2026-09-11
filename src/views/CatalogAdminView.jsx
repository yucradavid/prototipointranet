import React, { useState } from 'react'
import { Plus, Pencil, Trash2, LockKeyhole, Building2, BookOpen, Users, Palette, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Panel, Badge, Modal, Field } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import UserAdminView from './UserAdminView'
import RolePermissionsView from './RolePermissionsView'
import { officeName } from '../data/catalogs'

const emptyOffice = { name: '', short: '', color: '#0284c7' }

export default function CatalogAdminView({
  offices,
  procedures,
  users,
  rolePermissions,
  onSaveOffice,
  onDeleteOffice,
  onSaveProcedure,
  onDeleteProcedure,
  onSaveUser,
  onDeleteUser,
  onResetPassword,
  onToggleUserActive,
  onImportStudents,
  onSaveRolePermissions
}) {
  const [tab, setTab] = useState('oficinas')
  const [officeModal, setOfficeModal] = useState(null)
  const [procModal, setProcModal] = useState(null)

  const saveOffice = () => {
    if (!officeModal?.name?.trim()) return
    onSaveOffice(officeModal)
    setOfficeModal(null)
  }

  const saveProcedure = data => {
    onSaveProcedure(data)
    setProcModal(null)
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
      </div>

      {/* Tab: Users */}
      {tab === 'usuarios' && (
        <UserAdminView
          users={users}
          offices={offices}
          onSaveUser={onSaveUser}
          onDeleteUser={onDeleteUser}
          onResetPassword={onResetPassword}
          onToggleActive={onToggleUserActive}
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

      {/* Tab: Offices */}
      {tab === 'oficinas' && (
        <Panel
          title="Oficinas y Dependencias Institucionales"
          subtitle="Mesa de Partes y Dirección General son dependencias fijas por regla del sistema; las demás oficinas pueden administrarse libremente."
          actions={
            <button className="btn primary" onClick={() => setOfficeModal({ ...emptyOffice })}>
              <Plus size={16} /> Nueva oficina
            </button>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dependencia / Oficina</th>
                  <th>Código</th>
                  <th>Color distintivo</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {offices.map(o => {
                  const locked = ['mesa_partes', 'direccion'].includes(o.id)
                  return (
                    <tr key={o.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="office-color"
                            style={{
                              background: o.color,
                              display: 'inline-block',
                              width: 14,
                              height: 14,
                              borderRadius: 4,
                              flexShrink: 0
                            }}
                          />
                          <b>{o.name}</b>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: 'var(--arib-surface-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {o.short}
                        </code>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 24, height: 16, background: o.color, borderRadius: 4, border: '1px solid var(--arib-border)' }}></span>
                          <span style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>{o.color}</span>
                        </div>
                      </td>
                      <td>
                        {locked ? (
                          <Badge tone="neutral">
                            <LockKeyhole size={11} style={{ marginRight: 4 }} /> Fija (Estructural)
                          </Badge>
                        ) : (
                          <Badge tone="info">Operativa</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {locked ? (
                          <span style={{ fontSize: 12, color: 'var(--arib-navy-light)', fontStyle: 'italic' }}>
                            Protegida
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn ghost"
                              title="Editar oficina"
                              onClick={() => setOfficeModal({ ...o })}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn danger-soft"
                              title="Eliminar oficina"
                              onClick={() => onDeleteOffice(o.id)}
                            >
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
        <Panel
          title="Catálogo General de Trámites"
          subtitle="Cada trámite define sus requisitos y su ruta inicial de derivación; Dirección General y el Administrador de Flujos pueden versionarla dinámicamente."
          actions={
            <button className="btn primary" onClick={() => setProcModal({})}>
              <Plus size={16} /> Nuevo trámite
            </button>
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
                  <th>Ruta canónica de dependencias</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map(p => (
                  <tr key={p.id}>
                    <td>
                      <b style={{ color: 'var(--arib-navy)' }}>{p.name}</b>
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
            <button className="btn ghost" onClick={() => setOfficeModal(null)}>
              Cancelar
            </button>
            <button className="btn primary" disabled={!officeModal?.name?.trim()} onClick={saveOffice}>
              Guardar oficina
            </button>
          </>
        }
      >
        {officeModal && (
          <div className="form-grid two">
            <Field label="Nombre oficial de la oficina" required>
              <input
                value={officeModal.name}
                onChange={e => setOfficeModal({ ...officeModal, name: e.target.value })}
                placeholder="Ej. Unidad de Bienestar y Empleabilidad"
              />
            </Field>
            <Field label="Código corto / Siglas" required>
              <input
                value={officeModal.short}
                maxLength={8}
                onChange={e => setOfficeModal({ ...officeModal, short: e.target.value.toUpperCase() })}
                placeholder="Ej. UBE"
              />
            </Field>
            <Field label="Color representativo en interfaz" required hint="Se usará en los nodos y badges de ruta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={officeModal.color}
                  onChange={e => setOfficeModal({ ...officeModal, color: e.target.value })}
                  style={{ width: 44, height: 38, padding: 2, cursor: 'pointer', borderRadius: 6 }}
                />
                <input
                  value={officeModal.color}
                  onChange={e => setOfficeModal({ ...officeModal, color: e.target.value })}
                  placeholder="#0284c7"
                  style={{ width: 110 }}
                />
              </div>
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

