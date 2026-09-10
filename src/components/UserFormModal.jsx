import React,{useEffect,useState} from 'react'
import { Modal, Field } from './ui'
import { PROFILES, PROGRAMS } from '../data/catalogs'

const emptyForm={username:'',password:'',email:'',fullName:'',role:'estudiante',office:'',dni:'',codigo:'',anioIngreso:'',carrera:PROGRAMS[0],active:true}

export default function UserFormModal({user,offices,onClose,onSave}){
  const [form,setForm]=useState({...emptyForm,...user})
  useEffect(()=>setForm({...emptyForm,...user}),[user])
  const isEdit=!!user?.id
  const needsOffice=form.role==='oficina'
  const isStudent=form.role==='estudiante'
  const routableOffices=offices.filter(o=>!['mesa_partes','direccion'].includes(o.id))
  const save=()=>{
    if(!form.fullName.trim()||!form.username.trim()||!form.password)return
    if(needsOffice&&!form.office)return
    const office=needsOffice?form.office:(PROFILES.find(p=>p.id===form.role)?.office||null)
    onSave({...form,office})
  }
  return <Modal open={!!user} onClose={onClose} title={isEdit?'Editar usuario':'Nuevo usuario'} size="lg" footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Guardar</button></>}>
    <div className="form-grid two">
      <Field label="Nombre completo" required><input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></Field>
      <Field label="Rol" required><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{PROFILES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
      <Field label="Usuario (login)" required hint={isStudent?'Sugerencia: usa el código de estudiante.':''}><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></Field>
      <Field label="Contraseña" required hint={isStudent?'Sugerencia: usa el DNI.':''}><input value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></Field>
      <Field label="Correo institucional" hint="Se usa para 'Continuar con Google'. Si lo dejas vacío, se genera como usuario@arib.edu.pe."><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder={`${form.username||'usuario'}@arib.edu.pe`}/></Field>
      {needsOffice&&<Field label="Oficina asignada" required><select value={form.office} onChange={e=>setForm({...form,office:e.target.value})}><option value="" disabled>Selecciona oficina…</option>{routableOffices.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>}
      {isStudent&&<>
        <Field label="DNI"><input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})}/></Field>
        <Field label="Código"><input value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})}/></Field>
        <Field label="Año de ingreso"><input value={form.anioIngreso} onChange={e=>setForm({...form,anioIngreso:e.target.value})}/></Field>
        <Field label="Carrera"><select value={form.carrera} onChange={e=>setForm({...form,carrera:e.target.value})}>{PROGRAMS.map(x=><option key={x}>{x}</option>)}</select></Field>
      </>}
    </div>
  </Modal>
}
