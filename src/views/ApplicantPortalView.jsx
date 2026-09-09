import React,{useMemo,useState} from 'react'
import { Plus, Search, FileText, UploadCloud, Send, AlertTriangle, Download, Clock3, CheckCircle2, Paperclip } from 'lucide-react'
import { Panel, Badge, StatusBadge, SlaBadge, Modal, Field, Empty, RouteStrip, Timeline, FileList } from '../components/ui'
import { PROGRAMS, CONDITIONS, procedureById } from '../data/catalogs'

const defaultForm={procedureId:'const_biblioteca',solicitante:'Juan Carlos Mamani',condicion:'Estudiante',programa:PROGRAMS[0],dni:'70223344',celular:'965432100',correo:'juan.demo@correo.pe',direccion:'Ichuña, Moquegua',fundamento:'',numeroFolios:1,adjuntos:[]}

export default function ApplicantPortalView({profileId,items,procedures,currentUser,onCreateVirtual,onCorrect}){
  const initialForm=()=>({...defaultForm,condicion:profileId==='docente'?'Docente':'Estudiante',solicitante:currentUser?.fullName||(profileId==='docente'?'Rosa Yana Condori':'Juan Carlos Mamani'),dni:currentUser?.dni||defaultForm.dni,programa:currentUser?.carrera||defaultForm.programa})
  const [open,setOpen]=useState(false),[selectedId,setSelectedId]=useState(null),[search,setSearch]=useState(''),[form,setForm]=useState(initialForm)
  const mine=useMemo(()=>items.filter(x=>currentUser?x.ownerUserId===currentUser.id:x.ownerProfile===profileId).filter(x=>`${x.numero||x.tracking} ${x.asunto} ${x.estado}`.toLowerCase().includes(search.toLowerCase())),[items,profileId,currentUser,search])
  const selected=items.find(x=>x.id===selectedId)||mine[0]
  const obs=mine.filter(x=>x.estado==='OBSERVADO').length,finalized=mine.filter(x=>x.estado==='FINALIZADO').length
  const chooseFiles=e=>setForm(f=>({...f,adjuntos:[...f.adjuntos,...[...e.target.files].map(x=>({name:x.name,size:`${Math.max(1,Math.round(x.size/1024))} KB`}))]}))
  const submit=()=>{const p=procedureById(form.procedureId);if(!form.fundamento.trim())return;onCreateVirtual({...form,asunto:p.name,ownerProfile:profileId,ownerUserId:currentUser?.id||null});setOpen(false);setForm(initialForm())}
  const correct=(exp)=>{const file={name:'Subsanacion.pdf',size:'420 KB'};onCorrect(exp,{files:[file]})}
  const downloadRespuesta=(exp)=>{const blob=new Blob([`Respuesta oficial\r\nExpediente: ${exp.numero}\r\nAsunto: ${exp.asunto}\r\nSolicitante: ${exp.solicitante}\r\nFecha: ${exp.fecha}\r\n\r\n${exp.respuesta}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=exp.documentoRespuesta||`Respuesta_${exp.numero}.txt`;a.click()}
  return <div className="role-page">
    <div className="hero-row"><div><span className="eyebrow">PORTAL DEL {profileId==='docente'?'DOCENTE':'ESTUDIANTE'}</span><h1>Mi Mesa de Partes</h1><p>Presenta tu FUT, revisa observaciones y sigue el recorrido sin ir de oficina en oficina.</p></div><button className="btn primary big" onClick={()=>setOpen(true)}><Plus size={18}/> Nueva solicitud</button></div>
    <div className="mini-stats"><div><span>En proceso</span><b>{mine.filter(x=>!['FINALIZADO','OBSERVADO'].includes(x.estado)).length}</b></div><div className={obs?'attention':''}><span>Por subsanar</span><b>{obs}</b></div><div><span>Finalizados</span><b>{finalized}</b></div></div>
    {obs>0&&<div className="smart-alert"><AlertTriangle size={20}/><div><b>Tienes {obs} expediente{obs>1?'s':''} con observación</b><span>Subsanar es la acción prioritaria. El sistema devolverá automáticamente el expediente a la oficina que observó.</span></div></div>}
    <div className="master-detail-grid">
      <Panel title="Mis solicitudes" subtitle="Selecciona un expediente para ver todo su detalle." actions={<div className="search-mini"><Search size={15}/><input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div>}>
        <div className="case-list">{mine.length?mine.map(x=><button key={x.id} className={`case-item ${selected?.id===x.id?'active':''}`} onClick={()=>setSelectedId(x.id)}><div className="case-icon"><FileText size={18}/></div><div className="case-main"><div><b>{x.numero?`EXP ${x.numero}`:x.tracking}</b><StatusBadge status={x.estado}/></div><strong>{x.asunto}</strong><span>{x.fecha} · {x.hora}</span></div></button>):<Empty title="Aún no tienes solicitudes" text="Usa Nueva solicitud para registrar tu primer FUT."/>}</div>
      </Panel>
      <Panel title={selected?`${selected.numero?`EXP ${selected.numero}`:selected.tracking} · ${selected.asunto}`:'Detalle'} subtitle={selected?'Estado y recorrido actualizado del expediente.':'Selecciona un expediente.'}>
        {selected?<div className="case-detail">
          <div className="detail-top"><StatusBadge status={selected.estado}/><SlaBadge exp={selected}/><Badge tone="neutral">{selected.canal}</Badge>{selected.routeVersion&&<Badge tone="info">Ruta v{selected.routeVersion}</Badge>}</div>
          {selected.estado==='OBSERVADO'&&<div className="observation-card"><AlertTriangle size={20}/><div><b>Observación pendiente</b><p>{selected.observation?.text}</p><button className="btn primary" onClick={()=>correct(selected)}><UploadCloud size={16}/> Subsanar ahora</button></div></div>}
          <h4>Recorrido</h4><RouteStrip exp={selected}/>
          <div className="detail-cols"><div><span>Solicitante</span><b>{selected.solicitante}</b></div><div><span>Tipo</span><b>{selected.tipoDocumento}</b></div><div><span>Folios</span><b>{selected.numeroFolios}</b></div><div><span>Canal</span><b>{selected.canal}</b></div></div>
          <h4>Archivos</h4><FileList files={selected.adjuntos}/>
          {selected.estado==='FINALIZADO'&&<div className="final-response"><CheckCircle2 size={20}/><div><b>Trámite finalizado</b><span>{selected.respuesta}</span></div><button className="btn soft" onClick={()=>downloadRespuesta(selected)}><Download size={16}/> {selected.documentoRespuesta||'Descargar respuesta'}</button></div>}
          <h4>Historial</h4><Timeline items={selected.historial}/>
        </div>:<Empty/>}
      </Panel>
    </div>

    <Modal open={open} onClose={()=>setOpen(false)} title="Nuevo FUT virtual" subtitle="El sistema genera un código de seguimiento; Secretaría asignará el N.° de expediente." size="lg" footer={<><button className="btn ghost" onClick={()=>setOpen(false)}>Cancelar</button><button className="btn primary" onClick={submit}><Send size={16}/> Enviar a Mesa de Partes</button></>}>
      <div className="form-grid two"><Field label="Trámite" required><select value={form.procedureId} onChange={e=>setForm({...form,procedureId:e.target.value})}>{procedures.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Condición"><select value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})}>{CONDITIONS.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Nombres y apellidos / Razón social" required><input value={form.solicitante} onChange={e=>setForm({...form,solicitante:e.target.value})}/></Field><Field label="DNI / RUC" required><input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})}/></Field><Field label="Programa de estudios"><select value={form.programa} onChange={e=>setForm({...form,programa:e.target.value})}>{PROGRAMS.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Celular"><input value={form.celular} onChange={e=>setForm({...form,celular:e.target.value})}/></Field><Field label="Correo"><input value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})}/></Field><Field label="N.° folios"><input type="number" min="1" value={form.numeroFolios} onChange={e=>setForm({...form,numeroFolios:Number(e.target.value)})}/></Field></div>
      <Field label="Fundamento / detalle de la solicitud" required><textarea rows="4" value={form.fundamento} onChange={e=>setForm({...form,fundamento:e.target.value})} placeholder="Describa brevemente su solicitud…"/></Field>
      <label className="dropzone"><UploadCloud size={24}/><b>Adjuntar FUT y documentos</b><span>PDF, JPG o PNG · múltiples archivos</span><input type="file" multiple onChange={chooseFiles}/></label>
      {form.adjuntos.length>0&&<FileList files={form.adjuntos}/>}<div className="form-note"><Paperclip size={16}/> Requisito referencial del trámite: <b>{procedureById(form.procedureId)?.requires}</b></div>
    </Modal>
  </div>
}
