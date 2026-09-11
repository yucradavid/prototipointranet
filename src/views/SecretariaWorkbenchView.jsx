import React,{useMemo,useState} from 'react'
import { Inbox, Search, Plus, ArrowRight, CheckCircle2, FileText, Clock3, ExternalLink, Send, ShieldAlert, ArrowUpRight, CheckCheck } from 'lucide-react'
import { Panel, StatusBadge, SlaBadge, Badge, Empty, RouteStrip, Timeline, FileList, Modal, Field } from '../components/ui'
import CargoModal from '../components/CargoModal'
import { PROGRAMS, CONDITIONS, procedureById } from '../data/catalogs'

const physicalBase={
  procedureId:'const_biblioteca',
  solicitante:'',
  condicion:'Estudiante',
  programa:PROGRAMS[0],
  dni:'',
  celular:'',
  correo:'',
  direccion:'Ichuña, Moquegua',
  fundamento:'',
  numeroFolios:1,
  adjuntos:[]
}

export default function SecretariaWorkbenchView({items,procedures,permissions=[],onRegisterVirtual,onCreatePhysical,onFinalize}){
  const can=perm=>permissions.includes(perm)
  const [tab,setTab]=useState('entrada')
  const [selectedId,setSelectedId]=useState(null)
  const [search,setSearch]=useState('')
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState(physicalBase)
  const [cargoExp,setCargoExp]=useState(null)

  const source=useMemo(()=>
    items
      .filter(x=>tab==='entrada'?x.estado==='SOLICITUD_VIRTUAL':tab==='cierre'?x.estado==='RESPUESTA_MESA':x.numero&&x.estado!=='SOLICITUD_VIRTUAL')
      .filter(x=>`${x.numero||x.tracking} ${x.solicitante} ${x.asunto}`.toLowerCase().includes(search.toLowerCase())),
    [items,tab,search]
  )

  const selected=items.find(x=>x.id===selectedId)||source[0]

  const registerVirtual=exp=>{
    const r=onRegisterVirtual(exp)
    if(r) setCargoExp(r)
  }

  const submitPhysical=()=>{
    const p=procedureById(form.procedureId)
    if(!form.solicitante.trim()) return
    const exp=onCreatePhysical({
      ...form,
      asunto:p.name,
      ownerProfile:form.condicion==='Docente'?'docente':'estudiante'
    })
    setModal(false)
    setForm(physicalBase)
    if(exp) setCargoExp(exp)
  }

  const countVirtual = items.filter(x=>x.estado==='SOLICITUD_VIRTUAL').length
  const countCierre = items.filter(x=>x.estado==='RESPUESTA_MESA').length
  const countRegistrados = items.filter(x=>x.numero&&x.estado!=='SOLICITUD_VIRTUAL').length

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">SECRETARÍA GENERAL · MESA DE PARTES</span>
          <h1>Centro de Recepción, Registro y Cierre</h1>
          <p>
            Valida los FUT virtuales recibidos, registra ingresos físicos en el libro institucional y 
            realiza la entrega formal con cierre de expediente.
          </p>
        </div>
        {can('case.register') && (
          <button className="btn primary big" onClick={()=>setModal(true)}>
            <Plus size={18}/>
            <span>Registrar ingreso físico</span>
          </button>
        )}
      </div>

      {/* Regla Crítica Banner */}
      <div className="rule-banner">
        <CheckCircle2 size={22} style={{flex:'none'}}/>
        <div>
          <b>Regla institucional obligatoria</b>
          <span>
            Secretaría no elige la oficina de atención. Todo expediente registrado se remite automáticamente 
            a <strong>Dirección General para emisión obligatoria de Proveído y V°B°</strong>.
          </span>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="segmented">
        <button className={tab==='entrada'?'active':''} onClick={()=>setTab('entrada')}>
          <Inbox size={15} style={{display:'inline',verticalAlign:'text-bottom',marginRight:4}}/>
          <span>Entrada virtual</span>
          <i>{countVirtual}</i>
        </button>
        <button className={tab==='cierre'?'active':''} onClick={()=>setTab('cierre')}>
          <CheckCheck size={15} style={{display:'inline',verticalAlign:'text-bottom',marginRight:4}}/>
          <span>Por entregar y cerrar</span>
          <i>{countCierre}</i>
        </button>
        <button className={tab==='todos'?'active':''} onClick={()=>setTab('todos')}>
          <FileText size={15} style={{display:'inline',verticalAlign:'text-bottom',marginRight:4}}/>
          <span>Libro digital reciente</span>
          <i>{countRegistrados}</i>
        </button>
      </div>

      {/* Master Detail Layout */}
      <div className="master-detail-grid">
        <Panel 
          title={tab==='entrada'?'Solicitudes virtuales por validar':tab==='cierre'?'Respuestas listas para entrega':'Expedientes registrados en libro'} 
          subtitle="Haz clic en un registro para gestionarlo o ver su trazabilidad."
          actions={
            <div className="search-mini">
              <Search size={15} color="#64748b"/>
              <input placeholder="Buscar por número o solicitante…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          }
        >
          <div className="case-list">
            {source.length ? (
              source.map(x=>(
                <button 
                  key={x.id} 
                  className={`case-item ${selected?.id===x.id?'active':''}`} 
                  onClick={()=>setSelectedId(x.id)}
                >
                  <div className="case-icon">
                    <Inbox size={18}/>
                  </div>
                  <div className="case-main">
                    <div>
                      <b>{x.numero ? `EXP ${x.numero}` : x.tracking}</b>
                      <StatusBadge status={x.estado}/>
                    </div>
                    <strong>{x.asunto}</strong>
                    <span>{x.solicitante} · {x.numeroFolios} folio(s) · {x.fecha}</span>
                  </div>
                </button>
              ))
            ) : (
              <Empty 
                title="Bandeja al día" 
                text="No hay registros pendientes de atención en esta vista."
              />
            )}
          </div>
        </Panel>

        <Panel 
          title={selected ? `${selected.numero ? `EXP ${selected.numero}` : selected.tracking} — ${selected.asunto}` : 'Detalle del expediente'} 
          subtitle={selected ? `${selected.solicitante} · Modalidad: ${selected.canal}` : 'Selecciona un expediente del listado.'}
        >
          {selected ? (
            <div className="case-detail">
              {/* Primary Action Hero Box */}
              {selected.estado==='SOLICITUD_VIRTUAL' && (
                <div style={{background:'#f0f9ff',border:'1.5px solid #7dd3fc',borderRadius:12,padding:16,display:'grid',gap:10}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <Inbox size={20} color="#0284c7"/>
                    <div>
                      <b style={{fontSize:13,color:'#0369a1'}}>Solicitud Virtual Recibida — Pendiente de Validación</b>
                      <p style={{margin:'2px 0 0',fontSize:12,color:'#0c4a6e'}}>
                        Al validar, el expediente quedará formalmente asentado y se derivará directamente a Dirección.
                      </p>
                    </div>
                  </div>
                  {can('case.register') && (
                    <button className="btn primary full" onClick={()=>registerVirtual(selected)}>
                      <ArrowRight size={17}/>
                      <span>Validar, emitir cargo formal y remitir a Dirección</span>
                    </button>
                  )}
                </div>
              )}

              {selected.estado==='RESPUESTA_MESA' && (
                <div style={{background:'#ecfdf5',border:'1.5px solid #a7f3d0',borderRadius:12,padding:16,display:'grid',gap:10}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <CheckCircle2 size={20} color="#059669"/>
                    <div>
                      <b style={{fontSize:13,color:'#065f46'}}>Ruta de Oficinas Completada — Listo para Entrega</b>
                      <p style={{margin:'2px 0 0',fontSize:12,color:'#047857'}}>
                        Respuesta: {selected.respuesta}
                      </p>
                    </div>
                  </div>
                  {can('case.close') && (
                    <button className="btn primary full" onClick={()=>onFinalize(selected)}>
                      <Send size={17}/>
                      <span>Registrar entrega al solicitante y cerrar expediente</span>
                    </button>
                  )}
                </div>
              )}

              {selected.estado==='EN_DIRECCION' && (
                <div className="smart-info">
                  <Clock3 size={18} style={{flex:'none'}}/>
                  <span>
                    El expediente se encuentra en <strong>Dirección General</strong> a la espera de proveído y visto bueno.
                  </span>
                </div>
              )}

              {/* Status Badges */}
              <div className="detail-top">
                <StatusBadge status={selected.estado}/>
                <SlaBadge exp={selected}/>
                <Badge tone="neutral">{selected.tipoDocumento}</Badge>
                <Badge tone="info">{selected.numeroFolios} folio(s)</Badge>
                <Badge tone="neutral">{selected.canal}</Badge>
              </div>

              {/* Recorrido */}
              {selected.numero && (
                <>
                  <h4>Recorrido y trazabilidad</h4>
                  <RouteStrip exp={selected}/>
                </>
              )}

              {/* Grid de Metadatos */}
              <div className="detail-cols">
                <div>
                  <span>DNI / RUC</span>
                  <b>{selected.dni}</b>
                </div>
                <div>
                  <span>Programa / Carrera</span>
                  <b>{selected.programa}</b>
                </div>
                <div>
                  <span>Fecha y Hora</span>
                  <b>{selected.fecha} · {selected.hora}</b>
                </div>
                <div>
                  <span>Firma de Recepción</span>
                  <b>{selected.firmaSecretaria ? 'Registrada ✓' : 'Pendiente'}</b>
                </div>
              </div>

              {/* Asunto y Fundamento */}
              <h4>Asunto y Fundamento del pedido</h4>
              <div className="soft-box">
                <b style={{color:'#0f172a',fontSize:13}}>{selected.asunto}</b>
                <p>{selected.fundamento || 'Sin fundamento registrado.'}</p>
              </div>

              {/* Archivos y Documentos */}
              <h4>Documentos presentados y folios</h4>
              <FileList files={selected.adjuntos}/>

              {/* Historial */}
              <h4>Historial de movimientos del expediente</h4>
              <Timeline items={selected.historial}/>
            </div>
          ) : (
            <Empty title="Ningún expediente seleccionado" text="Selecciona un registro de la lista lateral para visualizar su detalle."/>
          )}
        </Panel>
      </div>

      {/* Modal Registro Físico */}
      <Modal 
        open={modal} 
        onClose={()=>setModal(false)} 
        title="Registrar documento físico en Mesa de Partes" 
        subtitle="Replica los campos del libro de registro físico y genera automáticamente el expediente oficial." 
        size="lg" 
        footer={
          <>
            <button className="btn ghost" onClick={()=>setModal(false)}>Cancelar</button>
            <button className="btn primary" disabled={!form.solicitante.trim()} onClick={submitPhysical}>
              <FileText size={16}/>
              <span>Registrar y remitir a Dirección</span>
            </button>
          </>
        }
      >
        <div className="form-grid two">
          <Field label="Tipo de trámite / Asunto" required>
            <select value={form.procedureId} onChange={e=>setForm({...form,procedureId:e.target.value})}>
              {procedures.map(p=><option value={p.id} key={p.id}>{p.name} (SLA: {p.sla} días)</option>)}
            </select>
          </Field>

          <Field label="Número de folios" required>
            <input type="number" min="1" value={form.numeroFolios} onChange={e=>setForm({...form,numeroFolios:Number(e.target.value)})}/>
          </Field>

          <Field label="Apellidos y nombres / Razón social" required>
            <input value={form.solicitante} onChange={e=>setForm({...form,solicitante:e.target.value})} placeholder="Nombre completo del solicitante"/>
          </Field>

          <Field label="DNI / RUC">
            <input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})} placeholder="Número de documento"/>
          </Field>

          <Field label="Condición institucional">
            <select value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})}>
              {CONDITIONS.map(x=><option key={x}>{x}</option>)}
            </select>
          </Field>

          <Field label="Programa de estudios">
            <select value={form.programa} onChange={e=>setForm({...form,programa:e.target.value})}>
              {PROGRAMS.map(x=><option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Fundamento / Resumen del pedido">
          <textarea rows="4" value={form.fundamento} onChange={e=>setForm({...form,fundamento:e.target.value})} placeholder="Resumen del documento ingresado por ventanilla…"/>
        </Field>

        <div className="form-note">
          <CheckCircle2 size={16} color="#10b981"/> 
          <span>El número correlativo de expediente, fecha, hora y firma de recepción se generarán automáticamente al registrar.</span>
        </div>
      </Modal>

      <CargoModal exp={cargoExp} onClose={()=>setCargoExp(null)}/>
    </div>
  )
}

