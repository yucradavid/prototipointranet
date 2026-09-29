import React, { useEffect, useState } from 'react'
import { Modal, Field } from './ui'
import { PROFILES, PROGRAMS, OFFICE_ACCESS_MODULES, normalizeOfficeModuleAccess } from '../data/catalogs'
import { CheckCircle2, Wallet } from 'lucide-react'

const emptyForm = {
  username: '',
  password: '',
  email: '',
  fullName: '',
  role: 'estudiante',
  office: '',
  dni: '',
  codigo: '',
  anioIngreso: new Date().getFullYear().toString(),
  carrera: PROGRAMS[0],
  active: true,
  moduleAccess: []
}

export default function UserFormModal({ user, offices, users = [], onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...user })

  useEffect(() => {
    const next = { ...emptyForm, ...user }
    if (next.role === 'oficina') {
      const office = offices.find(item => item.id === next.office)
      next.moduleAccess = normalizeOfficeModuleAccess(office, next.moduleAccess)
    }
    setForm(next)
  }, [user, offices])

  const isEdit = !!user?.id
  const needsOffice = form.role === 'oficina'
  const isStudent = form.role === 'estudiante'
  const routableOffices = offices.filter(o => !['mesa_partes', 'direccion'].includes(o.id))
  const assignedOffice = routableOffices.find(o => o.id === form.office)
  const isTreasuryOffice = !!assignedOffice?.collectsPayment
  const availableModules = OFFICE_ACCESS_MODULES.filter(module => !module.treasuryOnly || isTreasuryOffice)
  const assignedUsers = users.filter(item => item.role === 'oficina' && item.office === form.office && item.id !== user?.id)

  const changeRole = role => {
    const office = role === 'oficina' ? assignedOffice : null
    setForm(current => ({
      ...current,
      role,
      office: role === 'oficina' ? current.office : '',
      moduleAccess: role === 'oficina' ? normalizeOfficeModuleAccess(office, current.moduleAccess) : [],
    }))
  }

  const changeOffice = officeId => {
    const office = routableOffices.find(item => item.id === officeId)
    setForm(current => ({
      ...current,
      office: officeId,
      moduleAccess: normalizeOfficeModuleAccess(office, officeId === current.office ? current.moduleAccess : undefined),
    }))
  }

  const toggleModule = moduleId => {
    setForm(current => {
      const currentModules = normalizeOfficeModuleAccess(assignedOffice, current.moduleAccess)
      const nextModules = currentModules.includes(moduleId)
        ? currentModules.filter(id => id !== moduleId)
        : [...currentModules, moduleId]
      return { ...current, moduleAccess: normalizeOfficeModuleAccess(assignedOffice, nextModules) }
    })
  }

  const save = () => {
    if (!form.fullName.trim() || !form.username.trim() || !form.password) return
    if (needsOffice && !form.office) return
    const office = needsOffice ? form.office : PROFILES.find(p => p.id === form.role)?.office || null
    onSave({ ...form, office, moduleAccess: needsOffice ? normalizeOfficeModuleAccess(assignedOffice, form.moduleAccess) : [] })
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={isEdit ? 'Editar Cuenta de Usuario' : 'Nueva Cuenta de Usuario'}
      subtitle="Define el perfil de acceso, credenciales y asignación de dependencia institucional."
      size="lg"
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            disabled={!form.fullName.trim() || !form.username.trim() || !form.password || (needsOffice && !form.office)}
            onClick={save}
          >
            Guardar usuario
          </button>
        </>
      }
    >
      <div className="form-grid two">
        <Field label="Apellidos y Nombres completos" required>
          <input
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            placeholder="Ej. Juan Pérez Quispe"
          />
        </Field>

        <Field label="Rol de acceso al sistema" required>
          <select value={form.role} onChange={e => changeRole(e.target.value)}>
            {PROFILES.map(p => (
              <option key={p.id} value={p.id}>
                {p.id === 'oficina' ? 'Oficina / Tesorería' : p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Usuario de inicio de sesión"
          required
          hint={isStudent ? 'Sugerencia oficial: usa el código de estudiante.' : 'Identificador único'}
        >
          <input
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder={isStudent ? '20241001' : 'usuario.sistema'}
          />
        </Field>

        <Field
          label="Contraseña"
          required
          hint={isStudent ? 'Sugerencia oficial: usa el número de DNI.' : 'Mínimo 6 caracteres'}
        >
          <input
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Contraseña de acceso"
          />
        </Field>

        <Field
          label="Correo electrónico institucional"
          hint="Vinculado al botón 'Continuar con Google'."
        >
          <input
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder={`${form.username || 'usuario'}@arib.edu.pe`}
          />
        </Field>

        {needsOffice && (
          <Field label="Dependencia / Oficina asignada" required hint="Al elegir una oficina con cobro se habilitan sus módulos de Tesorería.">
            <select value={form.office} onChange={e => changeOffice(e.target.value)}>
              <option value="" disabled>
                Selecciona oficina…
              </option>
              {routableOffices.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}{o.collectsPayment ? (o.id === 'tesoreria' ? ' · caja principal' : ' · subtesorería') : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        {isStudent && (
          <>
            <Field label="Número de DNI">
              <input
                value={form.dni}
                maxLength={8}
                onChange={e => setForm({ ...form, dni: e.target.value })}
                placeholder="8 dígitos"
              />
            </Field>

            <Field label="Código de estudiante">
              <input
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ej. 20241001"
              />
            </Field>

            <Field label="Año de ingreso">
              <input
                value={form.anioIngreso}
                onChange={e => setForm({ ...form, anioIngreso: e.target.value })}
                placeholder="2024"
              />
            </Field>

            <Field label="Programa de estudios (Carrera)">
              <select value={form.carrera} onChange={e => setForm({ ...form, carrera: e.target.value })}>
                {PROGRAMS.map(x => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>

      {needsOffice && form.office && (
        <div className="user-form-access">
          <div className="user-form-access-head">
            <div>
              <b>{isTreasuryOffice ? 'Módulos de Tesorería de esta cuenta' : 'Módulos de esta cuenta'}</b>
              <p>
                {isTreasuryOffice
                  ? `${assignedOffice.name} funciona como ${assignedOffice.id === 'tesoreria' ? 'caja principal' : 'subtesorería'}. Activa solo lo que esta persona debe administrar.`
                  : `La cuenta quedará vinculada a ${assignedOffice.name}.`}
              </p>
            </div>
            {isTreasuryOffice && <span className="user-form-treasury-badge"><Wallet size={13} /> {assignedOffice.id === 'tesoreria' ? 'Tesorería' : 'Subtesorería'}</span>}
          </div>

          <div className="user-form-module-grid">
            {availableModules.map(module => (
              <label key={module.id} className={`user-form-module ${form.moduleAccess?.includes(module.id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={form.moduleAccess?.includes(module.id) || false} onChange={() => toggleModule(module.id)} />
                <span>
                  <b>{module.label}</b>
                  <small>{module.description}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="user-form-access-foot">
            <span><CheckCircle2 size={14} /> {form.moduleAccess?.length || 0} módulo(s) activo(s)</span>
            {assignedUsers.length > 0 && <span>{assignedUsers.filter(item => item.active !== false).length} usuario(s) activo(s) más en esta dependencia</span>}
          </div>
        </div>
      )}

      <label className="user-form-active">
        <input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} />
        <span><b>Cuenta activa</b><small>Si la desactivas, no podrá iniciar sesión aunque conserve sus datos.</small></span>
      </label>
    </Modal>
  )
}
