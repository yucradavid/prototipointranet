import React, { useEffect, useState } from 'react'
import { Modal, Field } from './ui'
import { PROFILES, PROGRAMS } from '../data/catalogs'
import { UserRound, KeyRound, Mail, Building2, GraduationCap, ShieldCheck } from 'lucide-react'

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
  active: true
}

export default function UserFormModal({ user, offices, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...user })

  useEffect(() => {
    setForm({ ...emptyForm, ...user })
  }, [user])

  const isEdit = !!user?.id
  const needsOffice = form.role === 'oficina'
  const isStudent = form.role === 'estudiante'
  const routableOffices = offices.filter(o => !['mesa_partes', 'direccion'].includes(o.id))

  const save = () => {
    if (!form.fullName.trim() || !form.username.trim() || !form.password) return
    if (needsOffice && !form.office) return
    const office = needsOffice ? form.office : PROFILES.find(p => p.id === form.role)?.office || null
    onSave({ ...form, office })
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
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {PROFILES.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
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
          <Field label="Dependencia / Oficina asignada" required hint="La oficina donde despachará este usuario">
            <select value={form.office} onChange={e => setForm({ ...form, office: e.target.value })}>
              <option value="" disabled>
                Selecciona oficina…
              </option>
              {routableOffices.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
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
    </Modal>
  )
}

