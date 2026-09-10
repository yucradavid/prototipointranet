import React,{useMemo,useState} from 'react'
import { Inbox, Search, Plus, ArrowRight, CheckCircle2, FileText, Clock3, ExternalLink, Send } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList, Modal, Field } from '../components/ui'
import CargoModal from '../components/CargoModal'
import { PROGRAMS, CONDITIONS, procedureById } from '../data/catalogs'

const physicalBase={procedureId:'const_biblioteca',solicitante:'',condicion:'Estudiante',programa:PROGRAMS[0],dni:'',celular:'',correo:'',direccion:'Ichuña, Moquegua',fundamento:'',numeroFolios:1,adjuntos:[]}
export default function SecretariaWorkbenchView({items,procedures,onRegisterVirtual,onCreatePhysical,onFinalize}){
  const [tab,setTab]=useState('entrada'),[selectedId,setSelectedId]=useState(null),[search,setSearch]=useState(''),[modal,setModal]=useState(false),[form,setForm]=useState(physicalBase),[cargoExp,setCargoExp]=useState(null)
  const source=useMemo(()=>items.filter(x=>tab==='entrada'?x.estado==='SOLICITUD_VIRTUAL':tab==='cierre'?x.estado==='RESPUESTA_MESA':x.numero).filter(x=>`${x.numero||x.tracking} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase())),[items,tab,search])
  const selected=items.find(x=>x.id===selectedId)||source[0]
  const registerVirtual=exp=>{const r=onRegisterVirtual(exp);if(r)setCargoExp(r)}
  const submitPhysical=()=>{const p=procedureById(form.procedureId);if(!form.solicitante.trim())return;const exp=onCreatePhysical({...form,asunto:p.name,ownerProfile:form.condicion==='Docente'?'docente':'estudiante'});setModal(false);setForm(physicalBase);if(exp)setCargoExp(exp)}
  return <div className="role-page">
    <div className="hero-row"><div><span className="eyebrow">SECRETARÍA · MESA DE PARTES</span><h1>Centro de recepción y cierre</h1><p>Registra el libro digital. Todo expediente registrado se remite automáticamente a Dirección.</p></div><button className="btn primary big" onClick={()=>setModal(true)}><Plus size={18}/> Registrar ingreso físico</button></div>
    <div className="rule-banner"><CheckCircle2 size={20}/><div><b>Regla crítica activa</b><span>Secretaría no selecciona la oficina destino. Al registrar, el sistema coloca el expediente en <strong>Dirección · Pendiente de proveído</strong>.</span></div></div>
    <div className="segmented"><button className={tab==='entrada'?'active':''} onClick={()=>setTab('entrada')}>Entrada virtual <i>{items.filter(x=>x.estado==='SOLICITUD_VIRTUAL').length}</i></button><button className={tab==='cierre'?'active':''} onClick={()=>setTab('cierre')}>Por entregar/cerrar <i>{items.filter(x=>x.estado==='RESPUESTA_MESA').length}</i></button><button className={tab==='todos'?'active':''} onClick={()=>setTab('todos')}>Libro reciente</button></div>
    <div className="master-detail-grid">
      <Panel title={tab==='entrada'?'Solicitudes pendientes de registro':tab==='cierre'?'Respuestas listas para entrega':'Expedientes registrados'} actions={<div className="search-mini"><Search size={15}/><input placeholder="Buscar expediente…" value={search} onChange={e=>setSearch(e.target.value)}/></div>}>
        <div className="case-list">{source.length?source.map(x=><button key={x.id} className={`case-item ${selected?.id===x.id?'active':''}`} onClick={()=>setSelectedId(x.id)}><div className="case-icon"><Inbox size={18}/></div><div className="case-main"><div><b>{x.numero?`EXP ${x.numero}`:x.tracking}</b><StatusBadge status={x.estado}/></div><strong>{x.asunto}</strong><span>{x.solicitante} · {x.numeroFolios} folios</span></div></button>):<Empty title="Bandeja al día" text="No hay elementos pendientes en esta vista."/>}</div>
      </Panel>
      <Panel title={selected?`${selected.numero?`EXP ${selected.numero}`:selected.tracking} · ${selected.asunto}`:'Detalle'} subtitle={selected?`${selected.solicitante} · ${selected.canal}`:'Selecciona un registro.'}>
        {selected?<div className="case-detail">
          <div className="detail-top"><StatusBadge status={selected.estado}/><SlaBadge exp={selected}/><Badge tone="neutral">{selected.tipoDocumento}</Badge><Badge tone="info">{selected.numeroFolios} folios</Badge></div>
          <div className="detail-cols"><div><span>DNI / RUC</span><b>{selected.dni}</b></div><div><span>Programa</span><b>{selected.programa}</b></div><div><span>Fecha/Hora</span><b>{selected.fecha} · {selected.hora}</b></div><div><span>Canal</span><b>{selected.canal}</b></div></div>
          <h4>Asunto y fundamento</h4><div className="soft-box"><b>{selected.asunto}</b><p>{selected.fundamento}</p></div>
          <h4>Archivos / folios</h4><FileList files={selected.adjuntos}/>
          {selected.numero&&<><h4>Recorrido</h4><RouteStrip exp={selected}/></>}
          {selected.estado==='SOLICITUD_VIRTUAL'&&<button className="btn primary full" onClick={()=>registerVirtual(selected)}><ArrowRight size={17}/> Validar, generar N.° expediente y enviar a Dirección</button>}
          {selected.estado==='RESPUESTA_MESA'&&<div className="action-stack"><div className="final-response"><CheckCircle2 size={20}/><div><b>La ruta de oficinas terminó</b><span>{selected.respuesta}</span></div></div><button className="btn primary full" onClick={()=>onFinalize(selected)}><Send size={17}/> Registrar entrega y cerrar expediente</button></div>}
          {selected.estado==='EN_DIRECCION'&&<div className="smart-info"><Clock3 size={18}/><span>Ya fue remitido a Dirección. Secretaría solo puede hacer seguimiento hasta que la ruta retorne.</span></div>}
          <h4>Historial</h4><Timeline items={selected.historial}/>
        </div>:<Empty/>}
      </Panel>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title="Registrar documento físico" subtitle="Replica los campos del libro físico y genera el expediente." size="lg" footer={<><button className="btn ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn primary" onClick={submitPhysical}><FileText size={16}/> Registrar y remitir a Dirección</button></>}>
      <div className="form-grid two"><Field label="Tipo / trámite" required><select value={form.procedureId} onChange={e=>setForm({...form,procedureId:e.target.value})}>{procedures.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="N.° folios" required><input type="number" min="1" value={form.numeroFolios} onChange={e=>setForm({...form,numeroFolios:Number(e.target.value)})}/></Field><Field label="Nombres / Razón social" required><input value={form.solicitante} onChange={e=>setForm({...form,solicitante:e.target.value})}/></Field><Field label="DNI / RUC"><input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})}/></Field><Field label="Condición"><select value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})}>{CONDITIONS.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Programa"><select value={form.programa} onChange={e=>setForm({...form,programa:e.target.value})}>{PROGRAMS.map(x=><option key={x}>{x}</option>)}</select></Field></div><Field label="Fundamento"><textarea rows="4" value={form.fundamento} onChange={e=>setForm({...form,fundamento:e.target.value})}/></Field><div className="form-note"><CheckCircle2 size={16}/> El N.° de expediente, fecha, hora y firma de recepción se generan al registrar.</div>
    </Modal>
    <CargoModal exp={cargoExp} onClose={()=>setCargoExp(null)}/>
  </div>
}
