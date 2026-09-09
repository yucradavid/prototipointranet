import React,{useState} from 'react'
import { Plus, Pencil, Trash2, LockKeyhole } from 'lucide-react'
import { Panel, Badge, Modal, Field } from '../components/ui'
import ProcedureFormModal from '../components/ProcedureFormModal'
import { officeName } from '../data/catalogs'

const emptyOffice={name:'',short:'',color:'#0788d1'}

export default function CatalogAdminView({offices,procedures,onSaveOffice,onDeleteOffice,onSaveProcedure,onDeleteProcedure}){
  const [tab,setTab]=useState('oficinas')
  const [officeModal,setOfficeModal]=useState(null)
  const [procModal,setProcModal]=useState(null)

  const saveOffice=()=>{if(!officeModal.name.trim())return;onSaveOffice(officeModal);setOfficeModal(null)}
  const saveProcedure=data=>{onSaveProcedure(data);setProcModal(null)}

  return <div className="role-page">
    <div className="hero-row"><div><span className="eyebrow">ADMINISTRACIÓN DE CATÁLOGOS</span><h1>Trámites y oficinas maestras</h1><p>Crea, edita o elimina oficinas y tipos de trámite disponibles en todo el sistema, sin tocar código.</p></div></div>
    <div className="segmented"><button className={tab==='oficinas'?'active':''} onClick={()=>setTab('oficinas')}>Oficinas <i>{offices.length}</i></button><button className={tab==='tramites'?'active':''} onClick={()=>setTab('tramites')}>Trámites <i>{procedures.length}</i></button></div>

    {tab==='oficinas'?
      <Panel title="Oficinas registradas" subtitle="Mesa de Partes y Dirección son fijas por regla institucional; no se pueden editar ni eliminar." actions={<button className="btn primary" onClick={()=>setOfficeModal({...emptyOffice})}><Plus size={16}/> Nueva oficina</button>}>
        <div className="table-wrap"><table><thead><tr><th>Oficina</th><th>Código</th><th>Color</th><th></th></tr></thead><tbody>
          {offices.map(o=>{const locked=['mesa_partes','direccion'].includes(o.id);return <tr key={o.id}>
            <td><b>{o.name}</b></td><td>{o.short}</td><td><span className="office-color" style={{background:o.color,display:'inline-block',width:14,height:14,borderRadius:4}}></span></td>
            <td>{locked?<Badge tone="neutral"><LockKeyhole size={11}/> Fija</Badge>:<div style={{display:'flex',gap:6}}><button className="btn ghost" onClick={()=>setOfficeModal({...o})}><Pencil size={14}/></button><button className="btn danger-soft" onClick={()=>onDeleteOffice(o.id)}><Trash2 size={14}/></button></div>}</td>
          </tr>})}
        </tbody></table></div>
      </Panel>
    :
      <Panel title="Tipos de trámite" subtitle="Cada trámite define su ruta inicial de oficinas; Dirección puede ajustarla al emitir el proveído y el Diseñador de flujo puede versionarla después." actions={<button className="btn primary" onClick={()=>setProcModal({})}><Plus size={16}/> Nuevo trámite</button>}>
        <div className="table-wrap"><table><thead><tr><th>Trámite</th><th>Categoría</th><th>Requisitos</th><th>SLA</th><th>Ruta inicial</th><th></th></tr></thead><tbody>
          {procedures.map(p=><tr key={p.id}>
            <td><b>{p.name}</b></td><td>{p.category}</td><td>{p.requires}</td><td>{p.sla}d</td><td>{(p.route||[]).map(officeName).join(' → ')}</td>
            <td><div style={{display:'flex',gap:6}}><button className="btn ghost" onClick={()=>setProcModal({...p})}><Pencil size={14}/></button><button className="btn danger-soft" onClick={()=>onDeleteProcedure(p.id)}><Trash2 size={14}/></button></div></td>
          </tr>)}
        </tbody></table></div>
      </Panel>
    }

    <Modal open={!!officeModal} onClose={()=>setOfficeModal(null)} title={officeModal?.id?'Editar oficina':'Nueva oficina'} footer={<><button className="btn ghost" onClick={()=>setOfficeModal(null)}>Cancelar</button><button className="btn primary" onClick={saveOffice}>Guardar</button></>}>
      {officeModal&&<div className="form-grid two">
        <Field label="Nombre" required><input value={officeModal.name} onChange={e=>setOfficeModal({...officeModal,name:e.target.value})}/></Field>
        <Field label="Código corto"><input value={officeModal.short} maxLength={6} onChange={e=>setOfficeModal({...officeModal,short:e.target.value.toUpperCase()})}/></Field>
        <Field label="Color"><input type="color" value={officeModal.color} onChange={e=>setOfficeModal({...officeModal,color:e.target.value})}/></Field>
      </div>}
    </Modal>

    {procModal&&<ProcedureFormModal procedure={procModal} offices={offices} onClose={()=>setProcModal(null)} onSave={saveProcedure}/>}
  </div>
}
