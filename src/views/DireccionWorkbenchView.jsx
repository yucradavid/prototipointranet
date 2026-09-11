import React,{useMemo,useState} from 'react'
import { Search, Stamp, Route, Plus, X, GripVertical, ArrowRight, ShieldCheck, Clock3, Sparkles, CheckCircle2, ChevronRight, FileCheck } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList } from '../components/ui'
import { officeName, procedureById } from '../data/catalogs'

export default function DireccionWorkbenchView({items,workflows,offices,permissions=[],onProveido}){
  const can=perm=>permissions.includes(perm)
  const pending=items.filter(x=>x.estado==='EN_DIRECCION')
  const [selectedId,setSelectedId]=useState(null)
  const [search,setSearch]=useState('')
  const [proveido,setProveido]=useState('')
  const [customRoute,setCustomRoute]=useState([])

  const list=useMemo(()=>
    pending.filter(x=>`${x.numero} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase())),
    [pending,search]
  )

  const selected=items.find(x=>x.id===selectedId)||list[0]

  React.useEffect(()=>{
    if(selected){
      const cfg=workflows[selected.procedureId]
      const defaultRoute=[...(cfg?.route||procedureById(selected.procedureId)?.route||[])]
      setCustomRoute(defaultRoute)
      const firstOffice=defaultRoute[0] ? officeName(defaultRoute[0]).toUpperCase() : 'LA OFICINA CORRESPONDIENTE'
      setProveido(`PASE A ${firstOffice} Y CONTINÚE SEGÚN RUTA PARA SU ATENCIÓN Y TRÁMITE DE LEY.`)
    }
  },[selected?.id,workflows])

  const addOffice=id=>{
    if(id&&!customRoute.includes(id)){
      setCustomRoute([...customRoute,id])
    }
  }

  const move=(idx,dir)=>{
    const n=[...customRoute]
    const j=idx+dir
    if(j<0||j>=n.length) return
    [n[idx],n[j]]=[n[j],n[idx]]
    setCustomRoute(n)
  }

  const submit=()=>{
    if(selected){
      onProveido(selected,{
        proveido,
        routePlan:customRoute,
        routeVersion:workflows[selected.procedureId]?.version||1
      })
    }
  }

  const quickTemplates=[
    'PASE SEGÚN RUTA PARA ATENCIÓN Y EMISIÓN DE DOCUMENTO.',
    'CON CARÁCTER DE URGENTE PARA SU EVALUACIÓN INMEDIATA.',
    'PREVIA REVISIÓN DE ANTECEDENTES Y REQUISITOS ACADÉMICOS.',
    'PARA INFORME TÉCNICO Y PROYECTO DE RESOLUCIÓN.'
  ]

  return (
    <div className="role-page">
      {/* Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">DIRECCIÓN GENERAL · IESTP ARIB</span>
          <h1>Bandeja de Proveídos y Activación de Rutas</h1>
          <p>
            Revisa las solicitudes registradas por Mesa de Partes, evalúa el expediente, determina la ruta 
            de oficinas y firma el V°B° institucional para activar el recorrido.
          </p>
        </div>
        <div className="hero-count">
          <Stamp size={22}/>
          <b>{pending.length}</b>
          <span>expediente(s) pendiente(s)</span>
        </div>
      </div>

      {/* Regla Institucional */}
      <div className="rule-banner dark">
        <ShieldCheck size={22} color="#38bdf8" style={{flex:'none'}}/>
        <div>
          <b>Paso jerárquico obligatorio e ineludible</b>
          <span>
            Ninguna oficina u área operativa puede recibir ni atender el expediente hasta que Dirección General 
            asiente su <strong>Visto Bueno (V°B°), Proveído oficial y Ruta de atención</strong>.
          </span>
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="master-detail-grid">
        <Panel 
          title="Expedientes esperando proveído" 
          subtitle="Selecciona un expediente para redactar el proveído y activar la ruta."
          actions={
            <div className="search-mini">
              <Search size={15} color="#64748b"/>
              <input placeholder="Buscar expediente…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          }
        >
          <div className="case-list">
            {list.length ? (
              list.map(x=>(
                <button 
                  key={x.id} 
                  className={`case-item ${selected?.id===x.id?'active':''}`} 
                  onClick={()=>setSelectedId(x.id)}
                >
                  <div className="case-icon dark">
                    <Stamp size={18}/>
                  </div>
                  <div className="case-main">
                    <div>
                      <b>EXP {x.numero}</b>
                      <StatusBadge status={x.estado}/>
                    </div>
                    <strong>{x.asunto}</strong>
                    <span>{x.solicitante} · {x.numeroFolios} folio(s) · {x.fecha}</span>
                  </div>
                </button>
              ))
            ) : (
              <Empty 
                title="Sin expedientes pendientes" 
                text="Todos los expedientes registrados ya cuentan con proveído y se encuentran en recorrido."
              />
            )}
          </div>
        </Panel>

        <Panel 
          title={selected ? `EXP ${selected.numero} — ${selected.asunto}` : 'Detalle para Proveído'} 
          subtitle={selected ? `Solicitante: ${selected.solicitante} · ${selected.programa}` : 'Selecciona un expediente de la lista.'}
        >
          {selected ? (
            <div className="case-detail">
              {/* Top status badges */}
              <div className="detail-top">
                <StatusBadge status={selected.estado}/>
                <SlaBadge exp={selected}/>
                <Badge tone="neutral">{selected.canal}</Badge>
                <Badge tone="info">{selected.numeroFolios} folio(s)</Badge>
                <Badge tone="primary">Plantilla v{workflows[selected.procedureId]?.version||1}</Badge>
              </div>

              {/* Fundamento del pedido */}
              <h4>Fundamento y solicitud del usuario</h4>
              <div className="soft-box">
                <b style={{fontSize:13,color:'#0f172a'}}>{selected.asunto}</b>
                <p>{selected.fundamento || 'Sin fundamento registrado.'}</p>
              </div>

              {/* Archivos y anexos */}
              <h4>Documentos presentados / enlaces de Drive</h4>
              <FileList files={selected.adjuntos}/>

              {/* Visual Route Builder */}
              <div className="route-builder-head" style={{marginTop:8}}>
                <div>
                  <h4 style={{margin:0}}>Configurar ruta de oficinas para este expediente</h4>
                  <span>
                    El orden establecido aquí definirá la secuencia en la que cada oficina recibirá el expediente.
                  </span>
                </div>
              </div>

              <div className="mandatory-route">
                <div className="mandatory-node">
                  Mesa de Partes
                  <span>Paso 1 · Registro</span>
                </div>
                <ArrowRight size={18} color="#94a3b8" style={{flex:'none'}}/>
                <div className="mandatory-node dark">
                  Dirección General
                  <span>Paso 2 · Proveído (Aquí)</span>
                </div>
                <ArrowRight size={18} color="#94a3b8" style={{flex:'none'}}/>
                <div className="route-edit-list">
                  {customRoute.map((id,i)=>(
                    <div className="route-edit-card" key={`${id}-${i}`}>
                      <GripVertical size={16} color="#94a3b8"/>
                      <b>{officeName(id)}</b>
                      {can('route.choose') && (
                        <div>
                          <button type="button" onClick={()=>move(i,-1)} title="Mover antes">↑</button>
                          <button type="button" onClick={()=>move(i,1)} title="Mover después">↓</button>
                          <button type="button" onClick={()=>setCustomRoute(customRoute.filter((_,idx)=>idx!==i))} title="Quitar oficina">
                            <X size={13}/>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add office row */}
              {can('route.choose') && (
                <div className="add-office-row">
                  <Plus size={16} color="#0284c7"/>
                  <select
                    defaultValue=""
                    onChange={e=>{
                      addOffice(e.target.value)
                      e.target.value=''
                    }}
                  >
                    <option value="" disabled>+ Agregar oficina adicional al recorrido…</option>
                    {offices
                      .filter(x=>!['mesa_partes','direccion'].includes(x.id)&&!customRoute.includes(x.id))
                      .map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}

              {/* Proveído Editor */}
              <div style={{marginTop:6}}>
                <label className="field">
                  <span>Texto del Proveído oficial de Dirección</span>
                  <textarea 
                    rows="3" 
                    value={proveido} 
                    onChange={e=>setProveido(e.target.value)} 
                    placeholder="Escriba las instrucciones de atención para las oficinas…"
                  />
                </label>

                {/* Plantillas de texto rápido */}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#64748b',width:'100%',display:'flex',alignItems:'center',gap:4}}>
                    <Sparkles size={13} color="#0284c7"/> Plantillas de proveído sugeridas:
                  </span>
                  {quickTemplates.map((tpl,i)=>(
                    <button 
                      key={i} 
                      type="button" 
                      className="btn ghost" 
                      style={{fontSize:11,padding:'4px 10px',borderRadius:20}}
                      onClick={()=>setProveido(tpl)}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              {can('case.proveido') && (
                <button
                  className="btn primary full"
                  style={{marginTop:10,padding:14}}
                  disabled={!customRoute.length||!proveido.trim()}
                  onClick={submit}
                >
                  <Stamp size={18}/>
                  <span>Firmar V°B°, emitir proveído y activar recorrido de oficinas</span>
                </button>
              )}

              {/* Historial */}
              <h4>Historial de auditoría</h4>
              <Timeline items={selected.historial}/>
            </div>
          ) : (
            <Empty title="Ningún expediente seleccionado" text="Selecciona un expediente pendiente de proveído de la lista."/>
          )}
        </Panel>
      </div>
    </div>
  )
}

