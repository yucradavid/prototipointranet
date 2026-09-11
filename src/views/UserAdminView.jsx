import React, { useState } from 'react'
import {
  Plus, Pencil, Trash2, KeyRound, Power, Download, UploadCloud,
  Search, UserRound, ShieldCheck, Building2, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Sparkles, Eye, EyeOff
} from 'lucide-react'
import { Panel, Badge, Modal, Field } from '../components/ui'
import UserFormModal from '../components/UserFormModal'
import { officeName, roleLabel } from '../data/catalogs'
import { parseStudentsCsv, buildStudentsTemplateCsv, buildCredentialsCsv } from '../data/userImport'

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
  onImportStudents
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

  const rows = users
    .filter(u => {
      if (roleFilter === 'STUDENT') return u.role === 'estudiante'
      if (roleFilter === 'OFFICE') return u.role === 'oficina'
      if (roleFilter === 'STAFF') return ['secretaria', 'direccion', 'admin'].includes(u.role)
      return true
    })
    .filter(u =>
      `${u.fullName} ${u.username} ${u.email || ''} ${u.dni || ''} ${u.codigo || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )

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
    <>
      <Panel
        title="Gestión de Cuentas y Accesos"
        subtitle="Cada usuario accede con credenciales individuales según su rol institucional y oficina asignada."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-mini">
              <Search size={15} />
              <input
                placeholder="Buscar por nombre, usuario, DNI o código…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn soft" onClick={() => setImportOpen(true)}>
              <UploadCloud size={15} /> Importar CSV
            </button>
            <button className="btn primary" onClick={() => setUserModal({})}>
              <Plus size={16} /> Nuevo usuario
            </button>
          </div>
        }
      >
        {/* Role filter pills */}
        <div className="filter-pill-bar" style={{ marginBottom: 14 }}>
          <button
            className={`filter-pill ${roleFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            Todos ({users.length})
          </button>
          <button
            className={`filter-pill ${roleFilter === 'STUDENT' ? 'active' : ''}`}
            onClick={() => setRoleFilter('STUDENT')}
          >
            Estudiantes ({users.filter(u => u.role === 'estudiante').length})
          </button>
          <button
            className={`filter-pill ${roleFilter === 'OFFICE' ? 'active' : ''}`}
            onClick={() => setRoleFilter('OFFICE')}
          >
            Oficinas ({users.filter(u => u.role === 'oficina').length})
          </button>
          <button
            className={`filter-pill ${roleFilter === 'STAFF' ? 'active' : ''}`}
            onClick={() => setRoleFilter('STAFF')}
          >
            Administrativos y Dirección ({users.filter(u => ['secretaria', 'direccion', 'admin'].includes(u.role)).length})
          </button>
        </div>

        {/* User Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--arib-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--arib-primary)',
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0
                        }}
                      >
                        {u.fullName.charAt(0)}
                      </div>
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
                      <b style={{ color: 'var(--arib-navy)' }}>{officeName(u.office)}</b>
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
            </tbody>
          </table>
        </div>
      </Panel>

      {/* User Form Modal */}
      {userModal && (
        <UserFormModal
          user={userModal}
          offices={offices}
          onClose={() => setUserModal(null)}
          onSave={data => {
            onSaveUser(data)
            setUserModal(null)
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
    </>
  )
}

