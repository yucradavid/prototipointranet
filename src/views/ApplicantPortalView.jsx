import React,{useEffect,useMemo,useState} from 'react'
import { Plus, Search, FileText, UploadCloud, Send, AlertTriangle, Download, CheckCircle2, Paperclip, X } from 'lucide-react'
import { Panel, Badge, StatusBadge, SlaBadge, Modal, Field, Empty, RouteStrip, Timeline, FileList } from '../components/ui'
import CargoModal from '../components/CargoModal'
import { PROGRAMS, CONDITIONS, procedureById } from '../data/catalogs'

const MAX_ATTACHMENTS=10
const defaultForm={procedureId:'const_biblioteca',solicitante:'Juan Carlos Mamani',condicion:'Estudiante',programa:PROGRAMS[0],dni:'70223344',celular:'965432100',correo:'juan.demo@correo.pe',direccion:'Ichuña, Moquegua',fundamento:'',numeroFolios:1,adjuntos:[]}
const requirementLabels=procedureId=>(procedureById(procedureId)?.requires||'').split('+').map(s=>s.trim()).filter(Boolean)

export default function ApplicantPortalView({profileId,items,procedures,currentUser,onCreateVirtual,onCorrect}){
  const initialForm=()=>({...defaultForm,condicion:profileId==='docente'?'Docente':'Estudiante',solicitante:currentUser?.fullName||(profileId==='docente'?'Rosa Yana Condori':'Juan Carlos Mamani'),dni:currentUser?.dni||defaultForm.dni,programa:currentUser?.carrera||defaultForm.programa})
  const [open,setOpen]=useState(false),[selectedId,setSelectedId]=useState(null),[search,setSearch]=useState(''),[form,setForm]=useState(initialForm)
  const [checklist,setChecklist]=useState([]),[extraLinks,setExtraLinks]=useState([]),[formError,setFormError]=useState(''),[cargoExp,setCargoExp]=useState(null)
  useEffect(()=>{setChecklist(requirementLabels(form.procedureId).map(label=>({label,checked:false,url:''})))},[form.procedureId,open])
  const mine=useMemo(()=>items.filter(x=>currentUser?x.ownerUserId===currentUser.id:x.ownerProfile===profileId).filter(x=>`${x.numero||x.tracking} ${x.asunto} ${x.estado}`.toLowerCase().includes(search.toLowerCase())),[items,profileId,currentUser,search])
  const selected=items.find(x=>x.id===selectedId)||mine[0]
  const obs=mine.filter(x=>x.estado==='OBSERVADO').length,finalized=mine.filter(x=>x.estado==='FINALIZADO').length
  const totalPlanned=form.adjuntos.length+checklist.filter(c=>c.checked&&c.url.trim()).length+extraLinks.filter(l=>l.url.trim()).length
  const chooseFiles=e=>{const room=Math.max(0,MAX_ATTACHMENTS-totalPlanned);const picked=[...e.target.files].slice(0,room).map(x=>({name:x.name,size:`${Math.max(1,Math.round(x.size/1024))} KB`}));setForm(f=>({...f,adjuntos:[...f.adjuntos,...picked]}))}
  const submit=()=>{
    const p=procedureById(form.procedureId)
    if(!form.fundamento.trim()){setFormError('Completa el fundamento de tu solicitud.');return}
    if(!checklist.every(c=>c.checked&&c.url.trim())){setFormError('Marca y adjunta el enlace de Drive de todos los requisitos del trámite.');return}
    const driveItems=[...checklist.map(c=>({name:c.label,size:'Google Drive',url:c.url.trim()})),...extraLinks.filter(l=>l.url.trim()).map(l=>({name:l.label.trim()||'Documento adicional',size:'Google Drive',url:l.url.trim()}))]
    const exp=onCreateVirtual({...form,asunto:p.name,adjuntos:[...form.adjuntos,...driveItems],ownerProfile:profileId,ownerUserId:currentUser?.id||null})
    setOpen(false);setForm(initialForm());setExtraLinks([]);setFormError('')
    if(exp)setCargoExp(exp)
  }
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
      <div className="form-grid two"><Field label="Trámite" required><select value={form.procedureId} onChange={e=>{setForm({...form,procedureId:e.target.value});setFormError('')}}>{procedures.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Condición"><select value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})}>{CONDITIONS.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Nombres y apellidos / Razón social" required><input value={form.solicitante} onChange={e=>setForm({...form,solicitante:e.target.value})}/></Field><Field label="DNI / RUC" required><input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})}/></Field><Field label="Programa de estudios"><select value={form.programa} onChange={e=>setForm({...form,programa:e.target.value})}>{PROGRAMS.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Celular"><input value={form.celular} onChange={e=>setForm({...form,celular:e.target.value})}/></Field><Field label="Correo"><input value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})}/></Field><Field label="N.° folios"><input type="number" min="1" value={form.numeroFolios} onChange={e=>setForm({...form,numeroFolios:Number(e.target.value)})}/></Field></div>
      <Field label="Fundamento / detalle de la solicitud" required><textarea rows="4" value={form.fundamento} onChange={e=>{setForm({...form,fundamento:e.target.value});setFormError('')}} placeholder="Describa brevemente su solicitud…"/></Field>

      {checklist.length>0&&<div className="requirement-checklist">
        <h4>Requisitos del trámite — marca y adjunta el enlace de Drive de cada uno</h4>
        {checklist.map((c,i)=><div className="requirement-row" key={`${c.label}-${i}`}>
          <label className="requirement-check"><input type="checkbox" checked={c.checked} onChange={e=>{setChecklist(cs=>cs.map((x,xi)=>xi===i?{...x,checked:e.target.checked}:x));setFormError('')}}/><span>{c.label}</span></label>
          <input placeholder="Link de Google Drive (compartir: cualquiera con el enlace)" value={c.url} onChange={e=>{setChecklist(cs=>cs.map((x,xi)=>xi===i?{...x,url:e.target.value}:x));setFormError('')}}/>
        </div>)}
      </div>}

      {extraLinks.map((l,i)=><div className="requirement-row extra" key={`extra-${i}`}>
        <input placeholder="Nombre del documento" value={l.label} onChange={e=>setExtraLinks(ls=>ls.map((x,xi)=>xi===i?{...x,label:e.target.value}:x))}/>
        <input placeholder="Link de Google Drive" value={l.url} onChange={e=>setExtraLinks(ls=>ls.map((x,xi)=>xi===i?{...x,url:e.target.value}:x))}/>
        <button type="button" className="btn ghost" onClick={()=>setExtraLinks(ls=>ls.filter((_,xi)=>xi!==i))}><X size={14}/></button>
      </div>)}
      <button type="button" className="btn soft" disabled={totalPlanned>=MAX_ATTACHMENTS} onClick={()=>setExtraLinks(ls=>[...ls,{label:'',url:''}])}><Plus size={14}/> Agregar otro documento de Drive ({totalPlanned}/{MAX_ATTACHMENTS})</button>

      <label className="dropzone"><UploadCloud size={24}/><b>Adjuntar FUT y documentos (opcional)</b><span>PDF, JPG o PNG · máximo {MAX_ATTACHMENTS} adjuntos en total</span><input type="file" multiple disabled={totalPlanned>=MAX_ATTACHMENTS} onChange={chooseFiles}/></label>
      {form.adjuntos.length>0&&<FileList files={form.adjuntos}/>}
      {formError&&<div className="login-error">{formError}</div>}
      <div className="form-note"><Paperclip size={16}/> Requisito referencial del trámite: <b>{procedureById(form.procedureId)?.requires}</b></div>
    </Modal>
    <CargoModal exp={cargoExp} onClose={()=>setCargoExp(null)}/>
  </div>
}
