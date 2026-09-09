import React,{useEffect,useState} from 'react'
import { Plus, X } from 'lucide-react'
import { Modal, Field } from './ui'
import { officeName } from '../data/catalogs'

const emptyForm={name:'',category:'',requires:'',sla:3}

export default function ProcedureFormModal({procedure,offices,onClose,onSave}){
  const [form,setForm]=useState({...emptyForm,...procedure})
  const [routeDraft,setRouteDraft]=useState(procedure?.route?[...procedure.route]:[])
  useEffect(()=>{setForm({...emptyForm,...procedure});setRouteDraft(procedure?.route?[...procedure.route]:[])},[procedure])
  const isEdit=!!procedure?.id
  const routableOffices=offices.filter(o=>!['mesa_partes','direccion'].includes(o.id))
  const addRouteOffice=id=>{if(id&&!routeDraft.includes(id))setRouteDraft([...routeDraft,id])}
  const moveRoute=(idx,dir)=>{const n=[...routeDraft],j=idx+dir;if(j<0||j>=n.length)return;[n[idx],n[j]]=[n[j],n[idx]];setRouteDraft(n)}
  const save=()=>{if(!form.name.trim())return;const route=isEdit?form.route:routeDraft;onSave({...form,route,sla:Number(form.sla)||1})}
  return <Modal open={!!procedure} onClose={onClose} title={isEdit?'Editar trámite':'Nuevo trámite'} size="lg" footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!isEdit&&!routeDraft.length} onClick={save}>Guardar</button></>}>
    <div className="form-grid two">
      <Field label="Nombre" required><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Categoría"><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></Field>
      <Field label="Requisitos referenciales"><input value={form.requires} onChange={e=>setForm({...form,requires:e.target.value})}/></Field>
      <Field label="SLA (días)"><input type="number" min="1" value={form.sla} onChange={e=>setForm({...form,sla:e.target.value})}/></Field>
    </div>
    {isEdit?
      <Field label="Ruta publicada" hint="Para cambiar el orden de oficinas usa el diseñador de rutas."><div className="soft-box">{(form.route||[]).map(officeName).join(' → ')||'Sin ruta configurada'}</div></Field>
    :<>
      <Field label="Ruta de oficinas después de Dirección" required>
        <div className="route-edit-list">{routeDraft.map((id,i)=><div className="route-edit-card" key={id}><b>{officeName(id)}</b><div><button onClick={()=>moveRoute(i,-1)}>↑</button><button onClick={()=>moveRoute(i,1)}>↓</button><button onClick={()=>setRouteDraft(routeDraft.filter(x=>x!==id))}><X size={14}/></button></div></div>)}</div>
      </Field>
      <div className="add-office-row"><Plus size={16}/><select defaultValue="" onChange={e=>{addRouteOffice(e.target.value);e.target.value=''}}><option value="" disabled>Agregar oficina a la ruta…</option>{routableOffices.filter(o=>!routeDraft.includes(o.id)).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
    </>}
  </Modal>
}
