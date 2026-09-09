import React,{useState} from 'react'
import { Plus, Pencil, Trash2, KeyRound, Power, Download, UploadCloud, Search } from 'lucide-react'
import { Panel, Badge, Modal } from '../components/ui'
import UserFormModal from '../components/UserFormModal'
import { officeName, roleLabel } from '../data/catalogs'
import { parseStudentsCsv, buildStudentsTemplateCsv, buildCredentialsCsv } from '../data/userImport'

function downloadText(filename,text){
  const a=document.createElement('a')
  a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}))
  a.download=filename
  a.click()
}

export default function UserAdminView({users,offices,onSaveUser,onDeleteUser,onResetPassword,onToggleActive,onImportStudents}){
  const [search,setSearch]=useState('')
  const [userModal,setUserModal]=useState(null)
  const [importOpen,setImportOpen]=useState(false)
  const [importFile,setImportFile]=useState(null)
  const [importResult,setImportResult]=useState(null)

  const rows=users.filter(u=>`${u.fullName} ${u.username} ${u.dni} ${u.codigo}`.toLowerCase().includes(search.toLowerCase()))

  const resetPassword=u=>{
    const next=prompt(`Nueva contraseña para ${u.fullName}:`,u.password)
    if(next&&next.trim())onResetPassword(u.id,next.trim())
  }
  const readFile=e=>{
    const file=e.target.files?.[0]
    if(!file)return
    const reader=new FileReader()
    reader.onload=()=>setImportFile({name:file.name,text:String(reader.result||'')})
    reader.readAsText(file)
  }
  const doImport=()=>{if(importFile)setImportResult(onImportStudents(importFile.text))}
  const closeImport=()=>{setImportOpen(false);setImportFile(null);setImportResult(null)}

  return <>
    <Panel title="Usuarios del sistema" subtitle="Cada usuario accede con su propio usuario y contraseña, según el rol y oficina que le asignes." actions={<div style={{display:'flex',gap:8,alignItems:'center'}}><div className="search-mini"><Search size={15}/><input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="btn soft" onClick={()=>setImportOpen(true)}><UploadCloud size={15}/> Importar estudiantes</button><button className="btn primary" onClick={()=>setUserModal({})}><Plus size={16}/> Nuevo usuario</button></div>}>
      <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Oficina</th><th>Estado</th><th></th></tr></thead><tbody>
        {rows.map(u=><tr key={u.id}>
          <td><b>{u.fullName}</b>{u.codigo?<><br/><span>{u.codigo}</span></>:null}</td>
          <td>{u.username}</td>
          <td>{roleLabel(u)}</td>
          <td>{u.office?officeName(u.office):'—'}</td>
          <td><Badge tone={u.active!==false?'success':'neutral'}>{u.active!==false?'Activo':'Inactivo'}</Badge></td>
          <td><div style={{display:'flex',gap:6}}>
            <button className="btn ghost" onClick={()=>setUserModal({...u})}><Pencil size={14}/></button>
            <button className="btn ghost" onClick={()=>resetPassword(u)}><KeyRound size={14}/></button>
            <button className="btn danger-soft" onClick={()=>onToggleActive(u.id)}><Power size={14}/></button>
            <button className="btn danger-soft" onClick={()=>onDeleteUser(u.id)}><Trash2 size={14}/></button>
          </div></td>
        </tr>)}
      </tbody></table></div>
    </Panel>

    {userModal&&<UserFormModal user={userModal} offices={offices} onClose={()=>setUserModal(null)} onSave={data=>{onSaveUser(data);setUserModal(null)}}/>}

    <Modal open={importOpen} onClose={closeImport} title="Importar estudiantes" subtitle="Carga masiva desde una plantilla CSV. El usuario será el código y la contraseña el DNI." size="lg" footer={<><button className="btn ghost" onClick={closeImport}>Cerrar</button>{!importResult&&<button className="btn primary" disabled={!importFile} onClick={doImport}><UploadCloud size={16}/> Importar</button>}</>}>
      {!importResult?<>
        <div className="form-note"><Download size={16}/> ¿No tienes la plantilla?<button className="btn soft" style={{marginLeft:8}} onClick={()=>downloadText('Plantilla_Estudiantes_ARIB.csv',buildStudentsTemplateCsv())}>Descargar plantilla CSV</button></div>
        <label className="dropzone"><UploadCloud size={24}/><b>{importFile?importFile.name:'Selecciona el archivo CSV'}</b><span>Nombre y Apellido, DNI, Código, Año de ingreso, Carrera</span><input type="file" accept=".csv" onChange={readFile}/></label>
      </>:<>
        <div className="rule-banner"><UploadCloud size={20}/><div><b>{importResult.created.length} estudiante(s) creado(s)</b><span>{importResult.skipped.length?`${importResult.skipped.length} fila(s) omitida(s).`:'Sin observaciones.'}</span></div></div>
        {importResult.skipped.length>0&&<div className="soft-box"><span>Observaciones</span><ul style={{margin:'6px 0 0',paddingLeft:18,fontSize:11}}>{importResult.skipped.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
        {importResult.created.length>0&&<button className="btn primary full" onClick={()=>downloadText('Credenciales_Estudiantes_ARIB.csv',buildCredentialsCsv(importResult.created))}><Download size={16}/> Descargar credenciales generadas</button>}
      </>}
    </Modal>
  </>
}
