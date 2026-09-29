import React, { useState } from 'react'
import {
  Plus, Pencil, Trash2, KeyRound, Power, Download, UploadCloud,
  Search, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Eye, EyeOff, PowerOff, Building2
} from 'lucide-react'
import { Panel, Badge, Modal, Field, Empty } from '../components/ui'
import UserFormModal from '../components/UserFormModal'
import { officeName, roleLabel } from '../data/catalogs'
import { parseStudentsCsv, buildStudentsTemplateCsv, buildCredentialsCsv } from '../data/userImport'
import { fuzzyFilter } from '../utils/search.js'
import './UserAdminView.css'

function downloadText(filename, text) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  a.download = filename
  a.click()
}

export default function UserAdminView({
  users,
  offices,
  onSaveUser,
  onDeleteUser,
  onResetPassword,
  onToggleActive,
  onBulkSetActive,
  onImportStudents,
  onOpenOffices
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [userModal, setUserModal] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selected, setSelected] = useState(() => new Set())

  const byRole = users.filter(u => {
    if (roleFilter === 'STUDENT') return u.role === 'estudiante'
    if (roleFilter === 'OFFICE') return u.role === 'oficina'
    if (roleFilter === 'STAFF') return ['secretaria', 'direccion', 'admin'].includes(u.role)
    return true
  })
  const rows = fuzzyFilter(byRole, search, u => `${u.fullName} ${u.username} ${u.email || ''} ${u.dni || ''} ${u.codigo || ''}`)
  const activeCount = users.filter(u => u.active !== false).length
  const payingOffices = offices.filter(o => o.collectsPayment)

  // Avisos contextuales, mismo criterio que OfficeAdminView: cuentas de oficina sin
  // dependencia asignada, y oficinas habilitadas para cobrar que todavía no tienen a
  // nadie a cargo (no pueden operar hasta que se les asigne un usuario aquí).
  const officeUsersWithoutOffice = users.filter(u => u.role === 'oficina' && !u.office)
  const payingOfficesWithoutUser = offices.filter(o =>
    o.collectsPayment && !users.some(u => u.office === o.id && u.role === 'oficina' && u.active !== false)
  )

  const allVisibleSelected = rows.length > 0 && rows.every(u => selected.has(u.id))
  const toggleSelectAll = () => {
    setSelected(curr => {
      if (allVisibleSelected) return new Set([...curr].filter(id => !rows.some(u => u.id === id)))
      return new Set([...curr, ...rows.map(u => u.id)])
    })
  }
  const toggleSelectOne = id => {
    setSelected(curr => {
      const next = new Set(curr)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const bulkSetActive = active => {
    onBulkSetActive([...selected], active)
    setSelected(new Set())
  }

  const openReset = u => {
    setResetTarget(u)
    setNewPassword(u.password || '')
    setShowPassword(false)
  }
  const confirmReset = () => {
    if (!newPassword.trim()) return
    onResetPassword(resetTarget.id, newPassword.trim())
    setResetTarget(null)
  }

  const readFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportFile({ name: file.name, text: String(reader.result || '') })
    reader.readAsText(file)
  }

  const doImport = () => {
    if (importFile) setImportResult(onImportStudents(importFile.text))
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportResult(null)
  }

  return (
    <Panel
      title="Gestión de Cuentas y Accesos"
      subtitle="Cada usuario accede con credenciales individuales según su rol institucional y oficina asignada."
      className="user-admin"
    >
      <div className="ua-body">
        <div className="ua-toolbar">
          <div className="ua-sections" aria-label="Filtrar por tipo de cuenta">
            <button type="button" aria-pressed={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')}>Todos<b>{users.length}</b></button>
            <button type="button" aria-pressed={roleFilter === 'STUDENT'} onClick={() => setRoleFilter('STUDENT')}>Estudiantes<b>{users.filter(u => u.role === 'estudiante').length}</b></button>
            <button type="button" aria-pressed={roleFilter === 'OFFICE'} onClick={() => setRoleFilter('OFFICE')}>Oficinas<b>{users.filter(u => u.role === 'oficina').length}</b></button>
            <button type="button" aria-pressed={roleFilter === 'STAFF'} onClick={() => setRoleFilter('STAFF')}>Administrativos y Dirección<b>{users.filter(u => ['secretaria', 'direccion', 'admin'].includes(u.role)).length}</b></button>
          </div>
          <label className="search-mini ua-search"><Search size={16} /><input aria-label="Buscar usuario" placeholder="Buscar por nombre, usuario, DNI o código…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        </div>

        <div className="ua-section-head">
          <div><h3><Building2 size={19} /> Cuentas de acceso <span>{rows.length}</span></h3><p>{activeCount} de {users.length} cuenta(s) activa(s) en total.</p></div>
          <div className="ua-actions">
            <button className="btn soft" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Importar CSV</button>
            <button className="btn primary" onClick={() => setUserModal({})}><Plus size={16} /> Nuevo usuario</button>
          </div>
        </div>

        {(officeUsersWithoutOffice.length > 0 || payingOfficesWithoutUser.length > 0) && (
          <div className="ua-notices">
            {officeUsersWithoutOffice.length > 0 && (
              <p className="ua-notice"><AlertTriangle size={13} /> {officeUsersWithoutOffice.length} cuenta(s) de oficina sin dependencia asignada — edítalas para elegir su oficina.</p>
            )}
            {payingOfficesWithoutUser.length > 0 && (
              <p className="ua-notice"><AlertTriangle size={13} /> {payingOfficesWithoutUser.map(o => o.name).join(', ')} {payingOfficesWithoutUser.length === 1 ? 'está habilitada para cobrar pagos pero no tiene' : 'están habilitadas para cobrar pagos pero no tienen'} ningún usuario activo a cargo.</p>
            )}
          </div>
        )}

        {payingOffices.length > 0 && (
          <div className="ua-treasury-board">
            <div className="ua-treasury-board-head">
              <div><h3>Responsables de Tesorería y subtesorerías</h3><p>Cambia la dependencia o activa/desactiva cada cuenta desde el formulario de usuario.</p></div>
              <Badge tone="info">{payingOffices.length} dependencia(s) con cobro</Badge>
            </div>
            <div className="ua-treasury-cards">
              {payingOffices.map(office => {
                const assigned = users.filter(user => user.role === 'oficina' && user.office === office.id)
                const active = assigned.filter(user => user.active !== false)
                const caja = active.filter(user => !Array.isArray(user.moduleAccess) || user.moduleAccess.includes('caja')).length
                return (
                  <button type="button" className="ua-treasury-card" key={office.id} onClick={() => { setRoleFilter('OFFICE'); setSearch(office.name) }}>
                    <div><b>{office.name}</b><span>{office.id === 'tesoreria' ? 'Caja principal' : 'Subtesorería de Tesorería'}</span></div>
                    <strong>{active.length}<small> activo(s)</small></strong>
                    <em>{caja} con módulo Caja activo</em>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bulk action bar, visible only with an active selection */}
        {selected.size > 0 && (
          <div className="rule-banner" style={{ marginBottom: 14, background: 'var(--arib-info-subtle)', borderColor: 'var(--arib-info)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--arib-info)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13, color: 'var(--arib-navy)' }}>{selected.size} usuario(s) seleccionado(s)</b>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn soft" onClick={() => bulkSetActive(true)}>
                <Power size={14} /> Activar
              </button>
              <button className="btn soft" onClick={() => bulkSetActive(false)}>
                <PowerOff size={14} /> Desactivar
              </button>
              <button className="btn ghost" onClick={() => setSelected(new Set())}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} title="Seleccionar todos los visibles" />
                </th>
                <th>Usuario / Nombres</th>
                <th>Login / Identificador</th>
                <th>Correo Institucional</th>
                <th>Rol</th>
                <th>Oficina Asignada</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelectOne(u.id)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="ua-avatar">{u.fullName.charAt(0)}</div>
                      <div>
                        <b style={{ color: 'var(--arib-navy)', display: 'block' }}>{u.fullName}</b>
                        {u.codigo && (
                          <span style={{ fontSize: 11, color: 'var(--arib-navy-light)' }}>
                            Cód: <code>{u.codigo}</code> {u.dni ? `· DNI: ${u.dni}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: 'var(--arib-surface-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      {u.username}
                    </code>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--arib-navy-light)' }}>
                    {u.email ? (
                      <span>{u.email}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin vincular</span>
                    )}
                  </td>
                  <td>
                    <Badge
                      tone={
                        u.role === 'admin'
                          ? 'warning'
                          : u.role === 'direccion'
                          ? 'orange'
                          : u.role === 'secretaria'
                          ? 'info'
                          : u.role === 'oficina'
                          ? 'neutral'
                          : 'success'
                      }
                    >
                      {roleLabel(u)}
                    </Badge>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {u.office ? (
                      <div style={{ display: 'grid', gap: 3 }}>
                        <b style={{ color: 'var(--arib-navy)' }}>{officeName(u.office)}</b>
                        {u.role === 'oficina' && offices.find(o => o.id === u.office)?.collectsPayment && (
                          <span style={{ color: 'var(--arib-success)', fontSize: 10 }}>
                            {Array.isArray(u.moduleAccess) ? `${u.moduleAccess.length} módulo(s) configurado(s)` : 'Permisos heredados de la oficina'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--arib-navy-light)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <Badge tone={u.active !== false ? 'success' : 'neutral'}>
                      {u.active !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn ghost"
                        title="Editar usuario"
                        onClick={() => setUserModal({ ...u })}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn ghost"
                        title="Cambiar contraseña"
                        onClick={() => openReset(u)}
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        className="btn ghost"
                        title={u.active !== false ? 'Desactivar usuario' : 'Activar usuario'}
                        style={{ color: u.active !== false ? 'var(--arib-warning)' : 'var(--arib-success)' }}
                        onClick={() => onToggleActive(u.id)}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        className="btn danger-soft"
                        title="Eliminar usuario"
                        onClick={() => onDeleteUser(u.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8}><Empty title="Sin usuarios" text="Ningún usuario coincide con la búsqueda o filtro seleccionado." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ua-help">
          <div><b>¿La oficina que necesitas aún no existe?</b><p>Créala primero en Oficinas y Dependencias — ahí también se marca si cobra pagos (sub-tesorería) antes de asignarle un usuario.</p></div>
          <button className="btn ghost" onClick={onOpenOffices}><Building2 size={15} /> Oficinas y Dependencias</button>
        </div>
      </div>

      {/* User Form Modal */}
      {userModal && (
        <UserFormModal
          user={userModal}
          offices={offices}
          users={users}
          onClose={() => setUserModal(null)}
          onSave={data => {
            const saved = onSaveUser(data)
            if (saved) setUserModal(null)
          }}
        />
      )}

      {/* CSV Student Import Modal */}
      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Importación Masiva de Estudiantes (CSV)"
        subtitle="Carga las nóminas estudiantiles. El sistema creará automáticamente sus cuentas con usuario = Código y contraseña = DNI."
        size="lg"
        footer={
          <>
            <button className="btn ghost" onClick={closeImport}>
              Cerrar
            </button>
            {!importResult && (
              <button className="btn primary" disabled={!importFile} onClick={doImport}>
                <UploadCloud size={16} /> Procesar importación
              </button>
            )}
          </>
        }
      >
        {!importResult ? (
          <>
            <div className="form-note" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileSpreadsheet size={20} style={{ color: 'var(--arib-primary)' }} />
                <span>¿No cuentas con el formato oficial?</span>
              </div>
              <button
                type="button"
                className="btn soft"
                onClick={() => downloadText('Plantilla_Estudiantes_ARIB.csv', buildStudentsTemplateCsv())}
              >
                <Download size={14} /> Descargar plantilla CSV
              </button>
            </div>

            <label className="dropzone" style={{ cursor: 'pointer' }}>
              <UploadCloud size={32} style={{ color: 'var(--arib-primary)', marginBottom: 8 }} />
              <b style={{ fontSize: 14, color: 'var(--arib-navy)' }}>
                {importFile ? importFile.name : 'Haz clic o arrastra aquí el archivo .CSV'}
              </b>
              <span style={{ fontSize: 12, color: 'var(--arib-navy-light)', marginTop: 4 }}>
                Columnas requeridas: <code>Nombre y Apellido, DNI, Código, Año de ingreso, Carrera</code>
              </span>
              <input type="file" accept=".csv" onChange={readFile} style={{ display: 'none' }} />
            </label>
          </>
        ) : (
          <>
            <div
              className="rule-banner"
              style={{
                borderColor: importResult.created.length > 0 ? 'var(--arib-success)' : 'var(--arib-warning)',
                background: importResult.created.length > 0 ? 'var(--arib-success-subtle)' : 'var(--arib-warning-subtle)',
                marginBottom: 16
              }}
            >
              <CheckCircle2 size={24} style={{ color: 'var(--arib-success)', flexShrink: 0 }} />
              <div>
                <b style={{ color: 'var(--arib-navy)', fontSize: 14 }}>
                  {importResult.created.length} estudiante(s) importado(s) exitosamente
                </b>
                <span style={{ color: 'var(--arib-slate)', fontSize: 12 }}>
                  {importResult.skipped.length
                    ? `${importResult.skipped.length} fila(s) omitida(s) por duplicidad o datos incompletos.`
                    : 'Todos los registros fueron procesados sin observaciones.'}
                </span>
              </div>
            </div>

            {importResult.skipped.length > 0 && (
              <div className="soft-box" style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 600, color: 'var(--arib-warning)' }}>
                  Observaciones encontradas:
                </span>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--arib-slate)' }}>
                  {importResult.skipped.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.created.length > 0 && (
              <button
                className="btn primary full big"
                style={{ justifyContent: 'center' }}
                onClick={() =>
                  downloadText('Credenciales_Estudiantes_ARIB.csv', buildCredentialsCsv(importResult.created))
                }
              >
                <Download size={18} /> Descargar archivo de credenciales generadas (CSV)
              </button>
            )}
          </>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Restablecer contraseña"
        subtitle={resetTarget ? `Nueva contraseña de acceso para ${resetTarget.fullName}.` : ''}
        footer={
          <>
            <button className="btn ghost" onClick={() => setResetTarget(null)}>Cancelar</button>
            <button className="btn primary" disabled={!newPassword.trim()} onClick={confirmReset}>
              <KeyRound size={15} /> Guardar contraseña
            </button>
          </>
        }
      >
        {resetTarget && (
          <Field label="Nueva contraseña" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
                autoFocus
              />
              <button
                type="button"
                className="btn ghost"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
        )}
      </Modal>
    </Panel>
  )
}
