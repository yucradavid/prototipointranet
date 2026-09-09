import React,{useMemo,useState} from 'react'
import { Building2, Search, CheckCircle2, AlertTriangle, ArrowRight, UploadCloud, Clock3 } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList, Modal, Field } from '../components/ui'
import { officeName } from '../data/catalogs'

export default function OfficeWorkbenchView({officeId,items,onObserve,onComplete}){
  const [selectedId,setSelectedId]=useState(null),[search,setSearch]=useState(''),[observeOpen,setObserveOpen]=useState(false),[observeText,setObserveText]=useState(''),[note,setNote]=useState('Atención conforme.'),[doc,setDoc]=useState('')
  const queue=useMemo(()=>items.filter(x=>['EN_OFICINA','OBSERVADO'].includes(x.estado)&&x.oficinaActual===officeId).filter(x=>`${x.numero} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase())),[items,officeId,search])
  const selected=items.find(x=>x.id===selectedId)||queue[0]
  React.useEffect(()=>{setNote('Atención conforme.');setDoc('')},[selected?.id,officeId])
  const next=selected?.routePlan?.[selected.routeIndex+1]
  const submitObs=()=>{if(!observeText.trim())return;onObserve(selected,{text:observeText});setObserveOpen(false);setObserveText('')}
  const complete=()=>selected&&onComplete(selected,{note,document:doc||`Respuesta_${selected.numero}_${officeId}.pdf`})
  return <div className="role-page">
    <div className="hero-row"><div><span className="eyebrow">OFICINA OPERATIVA</span><h1>{officeName(officeId)}</h1><p>Visualiza únicamente los expedientes cuyo paso actual corresponde a esta oficina.</p></div><div className="hero-count office"><Building2 size={20}/><b>{queue.length}</b><span>en bandeja</span></div></div>
    <div className="master-detail-grid">
      <Panel title="Cola de atención" subtitle="El sistema respeta el orden de la ruta configurada." actions={<div className="search-mini"><Search size={15}/><input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div>}>
        <div className="case-list">{queue.length?queue.map(x=><button key={x.id} className={`case-item ${selected?.id===x.id?'active':''}`} onClick={()=>setSelectedId(x.id)}><div className="case-icon office"><Building2 size={17}/></div><div className="case-main"><div><b>EXP {x.numero}</b><StatusBadge status={x.estado}/></div><strong>{x.asunto}</strong><span>{x.solicitante} · Paso {x.routeIndex+1}/{x.routePlan.length}</span></div></button>):<Empty title="Bandeja al día" text={`No hay expedientes asignados a ${officeName(officeId)}.`}/>}</div>
      </Panel>
      <Panel title={selected?`EXP ${selected.numero} · ${selected.asunto}`:'Detalle de atención'} subtitle={selected?`Proveído: ${selected.proveido}`:'Selecciona un expediente.'}>
        {selected?<div className="case-detail"><div className="detail-top"><StatusBadge status={selected.estado}/><SlaBadge exp={selected}/><Badge tone="info">Paso {selected.routeIndex+1}/{selected.routePlan.length}</Badge><Badge tone="neutral">Ruta v{selected.routeVersion}</Badge></div>
          <h4>Recorrido completo</h4><RouteStrip exp={selected}/>
          {selected.estado==='OBSERVADO'?<div className="observation-card"><AlertTriangle size={20}/><div><b>Esperando subsanación del solicitante</b><p>{selected.observation?.text}</p><span>Mientras esté observado, la oficina no puede completar el paso.</span></div></div>:<>
          <div className="soft-box"><span>Fundamento</span><p>{selected.fundamento}</p></div><h4>Archivos recibidos</h4><FileList files={selected.adjuntos}/>
          <div className="office-action-card"><div><CheckCircle2 size={20}/><div><b>Acción recomendada</b><span>{next?`Completar y derivar automáticamente a ${officeName(next)}.`:'Completar último paso y devolver a Mesa de Partes.'}</span></div></div><Field label="Resultado / comentario"><textarea rows="3" value={note} onChange={e=>setNote(e.target.value)}/></Field><Field label="Documento de respuesta (nombre demo)"><input placeholder="Ej. Informe_5225.pdf" value={doc} onChange={e=>setDoc(e.target.value)}/></Field><div className="action-row"><button className="btn danger-soft" onClick={()=>setObserveOpen(true)}><AlertTriangle size={16}/> Observar</button><button className="btn primary" onClick={complete}><ArrowRight size={16}/> {next?'Completar y continuar':'Completar ruta'}</button></div></div></>}
          <h4>Historial</h4><Timeline items={selected.historial}/></div>:<Empty/>}
      </Panel>
    </div>
    <Modal open={observeOpen} onClose={()=>setObserveOpen(false)} title="Observar expediente" subtitle="El solicitante recibirá la observación y, al subsanar, el expediente regresará automáticamente a esta oficina." footer={<><button className="btn ghost" onClick={()=>setObserveOpen(false)}>Cancelar</button><button className="btn danger" onClick={submitObs}><AlertTriangle size={16}/> Enviar observación</button></>}><Field label="Motivo de observación" required><textarea rows="5" value={observeText} onChange={e=>setObserveText(e.target.value)} placeholder="Ej. Adjuntar comprobante legible…"/></Field></Modal>
  </div>
}
