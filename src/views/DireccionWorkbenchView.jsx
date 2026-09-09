import React,{useMemo,useState} from 'react'
import { Search, Stamp, Route, Plus, X, GripVertical, ArrowRight, ShieldCheck, Clock3 } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList } from '../components/ui'
import { officeName, procedureById } from '../data/catalogs'

export default function DireccionWorkbenchView({items,workflows,offices,onProveido}){
  const pending=items.filter(x=>x.estado==='EN_DIRECCION')
  const [selectedId,setSelectedId]=useState(null),[search,setSearch]=useState(''),[proveido,setProveido]=useState(''),[customRoute,setCustomRoute]=useState([])
  const list=useMemo(()=>pending.filter(x=>`${x.numero} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase())),[pending,search])
  const selected=items.find(x=>x.id===selectedId)||list[0]
  React.useEffect(()=>{if(selected){const cfg=workflows[selected.procedureId];setCustomRoute([...(cfg?.route||procedureById(selected.procedureId)?.route||[])]);setProveido(`PASE A ${officeName((cfg?.route||[])[0]).toUpperCase()} Y CONTINÚE SEGÚN RUTA PARA ATENCIÓN.`)}},[selected?.id,workflows])
  const addOffice=id=>{if(id&&!customRoute.includes(id))setCustomRoute([...customRoute,id])}
  const move=(idx,dir)=>{const n=[...customRoute],j=idx+dir;if(j<0||j>=n.length)return;[n[idx],n[j]]=[n[j],n[idx]];setCustomRoute(n)}
  const submit=()=>selected&&onProveido(selected,{proveido,routePlan:customRoute,routeVersion:workflows[selected.procedureId]?.version||1})
  return <div className="role-page">
    <div className="hero-row"><div><span className="eyebrow">DIRECCIÓN</span><h1>Bandeja de proveídos</h1><p>Todo expediente registrado llega aquí. Dirección valida el asunto, emite proveído y activa la ruta de oficinas.</p></div><div className="hero-count"><Stamp size={20}/><b>{pending.length}</b><span>pendientes</span></div></div>
    <div className="rule-banner dark"><ShieldCheck size={20}/><div><b>Dirección es un paso obligatorio e ineludible</b><span>Ninguna oficina puede recibir el expediente hasta registrar V°B°, proveído y ruta.</span></div></div>
    <div className="master-detail-grid">
      <Panel title="Pendientes de proveído" actions={<div className="search-mini"><Search size={15}/><input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div>}>
        <div className="case-list">{list.length?list.map(x=><button key={x.id} className={`case-item ${selected?.id===x.id?'active':''}`} onClick={()=>setSelectedId(x.id)}><div className="case-icon dark"><Stamp size={17}/></div><div className="case-main"><div><b>EXP {x.numero}</b><StatusBadge status={x.estado}/></div><strong>{x.asunto}</strong><span>{x.solicitante} · {x.numeroFolios} folios</span></div></button>):<Empty title="Sin pendientes" text="No hay expedientes esperando proveído."/>}</div>
      </Panel>
      <Panel title={selected?`EXP ${selected.numero} · ${selected.asunto}`:'Detalle de Dirección'} subtitle={selected?'Revisa y activa el recorrido de atención.':'Selecciona un expediente.'}>
        {selected?<div className="case-detail"><div className="detail-top"><StatusBadge status={selected.estado}/><SlaBadge exp={selected}/><Badge tone="neutral">{selected.canal}</Badge><Badge tone="info">{selected.numeroFolios} folios</Badge></div>
          <div className="soft-box"><span>Fundamento</span><p>{selected.fundamento}</p></div><h4>Documentos recibidos</h4><FileList files={selected.adjuntos}/>
          <div className="route-builder-head"><div><h4>Ruta posterior a Dirección</h4><span>Basada en la plantilla publicada para este tipo de trámite. Dirección puede ajustarla antes del proveído.</span></div><Badge tone="info">Plantilla v{workflows[selected.procedureId]?.version||1}</Badge></div>
          <div className="mandatory-route"><div className="mandatory-node">Mesa de Partes <span>bloqueado</span></div><ArrowRight size={18}/><div className="mandatory-node dark">Dirección <span>usted está aquí</span></div><ArrowRight size={18}/><div className="route-edit-list">{customRoute.map((id,i)=><div className="route-edit-card" key={id}><GripVertical size={16}/><b>{officeName(id)}</b><div><button onClick={()=>move(i,-1)}>↑</button><button onClick={()=>move(i,1)}>↓</button><button onClick={()=>setCustomRoute(customRoute.filter(x=>x!==id))}><X size={14}/></button></div></div>)}</div></div>
          <div className="add-office-row"><Plus size={16}/><select defaultValue="" onChange={e=>{addOffice(e.target.value);e.target.value=''}}><option value="" disabled>Agregar oficina a la ruta…</option>{offices.filter(x=>!['mesa_partes','direccion'].includes(x.id)&&!customRoute.includes(x.id)).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
          <label className="field"><span>Proveído</span><textarea rows="4" value={proveido} onChange={e=>setProveido(e.target.value)}/></label>
          <button className="btn primary full" disabled={!customRoute.length||!proveido.trim()} onClick={submit}><Stamp size={17}/> Firmar V°B°, emitir proveído y activar ruta</button>
          <h4>Historial</h4><Timeline items={selected.historial}/></div>:<Empty/>}
      </Panel>
    </div>
  </div>
}
