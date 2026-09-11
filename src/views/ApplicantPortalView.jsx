import React,{useEffect,useMemo,useState} from 'react'
import { Plus, Search, FileText, UploadCloud, Send, AlertTriangle, Download, CheckCircle2, Paperclip, X, Clock3, Filter, Sparkles, HelpCircle, HardDrive, Check } from 'lucide-react'
import { Panel, Badge, StatusBadge, SlaBadge, Modal, Field, Empty, RouteStrip, Timeline, FileList } from '../components/ui'
import CargoModal from '../components/CargoModal'
import { PROGRAMS, CONDITIONS, procedureById, officeName } from '../data/catalogs'

const MAX_ATTACHMENTS=10
const defaultForm={
  procedureId:'const_biblioteca',
  solicitante:'Juan Carlos Mamani',
  condicion:'Estudiante',
  programa:PROGRAMS[0],
  dni:'70223344',
  celular:'965432100',
  correo:'juan.demo@correo.pe',
  direccion:'Ichuña, Moquegua',
  fundamento:'',
  numeroFolios:1,
  adjuntos:[]
}

const requirementLabels=procedureId=>(procedureById(procedureId)?.requires||'').split('+').map(s=>s.trim()).filter(Boolean)

export default function ApplicantPortalView({profileId,items,procedures,currentUser,permissions=[],onCreateVirtual,onCorrect}){
  const can=perm=>permissions.includes(perm)
  const initialForm=()=>({
    ...defaultForm,
    condicion:profileId==='docente'?'Docente':'Estudiante',
    solicitante:currentUser?.fullName||(profileId==='docente'?'Rosa Yana Condori':'Juan Carlos Mamani'),
    dni:currentUser?.dni||defaultForm.dni,
    programa:currentUser?.carrera||defaultForm.programa
  })

  const [open,setOpen]=useState(false)
  const [selectedId,setSelectedId]=useState(null)
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('todos') // 'todos' | 'proceso' | 'observados' | 'finalizados'
  const [form,setForm]=useState(initialForm)
  const [checklist,setChecklist]=useState([])
  const [extraLinks,setExtraLinks]=useState([])
  const [formError,setFormError]=useState('')
  const [cargoExp,setCargoExp]=useState(null)

  useEffect(()=>{
    setChecklist(requirementLabels(form.procedureId).map(label=>({label,checked:false,url:''})))
  },[form.procedureId,open])

  const allMine=useMemo(()=>
    items.filter(x=>currentUser ? x.ownerUserId===currentUser.id : x.ownerProfile===profileId),
    [items,profileId,currentUser]
  )

  const mine=useMemo(()=>{
    return allMine
      .filter(x=>{
        if(filter==='proceso') return !['FINALIZADO','OBSERVADO'].includes(x.estado)
        if(filter==='observados') return x.estado==='OBSERVADO'
        if(filter==='finalizados') return x.estado==='FINALIZADO'
        return true
      })
      .filter(x=>`${x.numero||x.tracking} ${x.asunto} ${x.estado}`.toLowerCase().includes(search.toLowerCase()))
  },[allMine,filter,search])

  const selected=items.find(x=>x.id===selectedId)||mine[0]
  const obsCount=allMine.filter(x=>x.estado==='OBSERVADO').length
  const procCount=allMine.filter(x=>!['FINALIZADO','OBSERVADO'].includes(x.estado)).length
  const finalCount=allMine.filter(x=>x.estado==='FINALIZADO').length

  const totalPlanned=form.adjuntos.length+checklist.filter(c=>c.checked&&c.url.trim()).length+extraLinks.filter(l=>l.url.trim()).length

  const chooseFiles=e=>{
    const room=Math.max(0,MAX_ATTACHMENTS-totalPlanned)
    const picked=[...e.target.files].slice(0,room).map(x=>({
      name:x.name,
      size:`${Math.max(1,Math.round(x.size/1024))} KB`
    }))
    setForm(f=>({...f,adjuntos:[...f.adjuntos,...picked]}))
  }

  const submit=()=>{
    const p=procedureById(form.procedureId)
    if(!form.fundamento.trim()){
      setFormError('Completa el fundamento o motivo de tu solicitud.')
      return
    }
    if(!checklist.every(c=>c.checked&&c.url.trim())){
      setFormError('Marca y adjunta el enlace de Google Drive de todos los requisitos requeridos para este trámite.')
      return
    }
    const driveItems=[
      ...checklist.map(c=>({name:c.label,size:'Google Drive',url:c.url.trim()})),
      ...extraLinks.filter(l=>l.url.trim()).map(l=>({name:l.label.trim()||'Documento adicional',size:'Google Drive',url:l.url.trim()}))
    ]
    const exp=onCreateVirtual({
      ...form,
      asunto:p.name,
      adjuntos:[...form.adjuntos,...driveItems],
      ownerProfile:profileId,
      ownerUserId:currentUser?.id||null
    })
    setOpen(false)
    setForm(initialForm())
    setExtraLinks([])
    setFormError('')
    if(exp) setCargoExp(exp)
  }

  const correct=(exp)=>{
    const file={name:'Subsanacion_Documento.pdf',size:'420 KB'}
    onCorrect(exp,{files:[file]})
  }

  const downloadRespuesta=(exp)=>{
    const content=`IESTP ALIANZA RENOVADA ICHUÑA BÉLGICA\r\nRESPUESTA OFICIAL DE TRÁMITE\r\n\r\nExpediente: ${exp.numero}\r\nCódigo: ${exp.tracking}\r\nTrámite: ${exp.asunto}\r\nSolicitante: ${exp.solicitante}\r\nDNI: ${exp.dni}\r\nFecha de emisión: ${exp.fecha}\r\n\r\nDETALLE DE RESOLUCIÓN:\r\n${exp.respuesta}\r\n\r\nDocumento emitido conforme a los reglamentos del IESTP ARIB.`
    const blob=new Blob([content],{type:'text/plain;charset=utf-8'})
    const a=document.createElement('a')
    a.href=URL.createObjectURL(blob)
    a.download=exp.documentoRespuesta||`Respuesta_EXP_${exp.numero}.txt`
    a.click()
  }

  return (
    <div className="role-page">
      {/* Hero Header */}
      <div className="hero-row">
        <div>
          <span className="eyebrow">PORTAL DIGITAL DEL {profileId==='docente'?'DOCENTE':'ESTUDIANTE'}</span>
          <h1>Mis Solicitudes y Trámites</h1>
          <p>
            Presenta tu Formulario Único de Trámite (FUT), consulta el estado en tiempo real y descarga 
            tus resoluciones o constancias sin desplazarte de oficina en oficina.
          </p>
        </div>
        {can('request.create') && (
          <button className="btn primary big" onClick={()=>setOpen(true)}>
            <Plus size={18}/>
            <span>Nueva solicitud (FUT)</span>
          </button>
        )}
      </div>

      {/* Mini Stats Summary */}
      <div className="mini-stats">
        <div style={{cursor:'pointer'}} onClick={()=>setFilter('proceso')}>
          <span>En proceso de atención</span>
          <b>{procCount}</b>
        </div>
        <div className={obsCount>0?'attention':''} style={{cursor:'pointer'}} onClick={()=>setFilter('observados')}>
          <span>Con observación pendiente</span>
          <b>{obsCount}</b>
        </div>
        <div style={{cursor:'pointer'}} onClick={()=>setFilter('finalizados')}>
          <span>Trámites finalizados</span>
          <b>{finalCount}</b>
        </div>
      </div>

      {/* Critical Alert if has Observations */}
      {obsCount > 0 && (
        <div className="smart-alert">
          <AlertTriangle size={22} style={{flex:'none'}}/>
          <div>
            <b>Tienes {obsCount} expediente{obsCount>1?'s':''} con observación pendiente</b>
            <span>
              La oficina correspondiente requiere que subsanes la documentación. Al presionar "Subsanar ahora", 
              el expediente regresará automáticamente a la misma oficina para su atención inmediata.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-pills">
        <button 
          className={`filter-pill ${filter==='todos'?'active':''}`} 
          onClick={()=>setFilter('todos')}
        >
          <span>Todos los expedientes</span>
          <i>{allMine.length}</i>
        </button>
        <button 
          className={`filter-pill ${filter==='proceso'?'active':''}`} 
          onClick={()=>setFilter('proceso')}
        >
          <span>En proceso</span>
          <i>{procCount}</i>
        </button>
        <button 
          className={`filter-pill ${filter==='observados'?'active':''}`} 
          onClick={()=>setFilter('observados')}
        >
          <span>Por subsanar</span>
          <i>{obsCount}</i>
        </button>
        <button 
          className={`filter-pill ${filter==='finalizados'?'active':''}`} 
          onClick={()=>setFilter('finalizados')}
        >
          <span>Finalizados</span>
          <i>{finalCount}</i>
        </button>
      </div>

      {/* Master Detail Grid */}
      <div className="master-detail-grid">
        <Panel 
          title="Mis expedientes registrados" 
          subtitle="Haz clic en cualquier solicitud para revisar su trazabilidad completa."
          actions={
            <div className="search-mini">
              <Search size={15} color="#64748b"/>
              <input placeholder="Buscar por número o asunto…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          }
        >
          <div className="case-list">
            {mine.length ? (
              mine.map(x=>(
                <button 
                  key={x.id} 
                  className={`case-item ${selected?.id===x.id?'active':''}`} 
                  onClick={()=>setSelectedId(x.id)}
                >
                  <div className="case-icon">
                    <FileText size={18}/>
                  </div>
                  <div className="case-main">
                    <div>
                      <b>{x.numero ? `EXP ${x.numero}` : x.tracking}</b>
                      <StatusBadge status={x.estado}/>
                    </div>
                    <strong>{x.asunto}</strong>
                    <span>{x.fecha} · {x.hora} · {x.numeroFolios} folio(s)</span>
                  </div>
                </button>
              ))
            ) : (
              <Empty 
                title="Sin solicitudes en esta sección" 
                text="No hay solicitudes que coincidan con el filtro seleccionado. Utiliza el botón 'Nueva solicitud' para presentar un FUT."
              />
            )}
          </div>
        </Panel>

        <Panel 
          title={selected ? `${selected.numero ? `EXP ${selected.numero}` : selected.tracking} — ${selected.asunto}` : 'Detalle de la solicitud'} 
          subtitle={selected ? 'Seguimiento institucional y estado en vivo del expediente.' : 'Selecciona una solicitud del listado.'}
        >
          {selected ? (
            <div className="case-detail">
              {/* Top Status Indicators */}
              <div className="detail-top">
                <StatusBadge status={selected.estado}/>
                <SlaBadge exp={selected}/>
                <Badge tone="neutral">{selected.canal}</Badge>
                {selected.routeVersion && <Badge tone="info">Ruta v{selected.routeVersion}</Badge>}
              </div>

              {/* Priority State Banners */}
              {selected.estado==='OBSERVADO' && (
                <div className="observation-card">
                  <AlertTriangle size={22} style={{flex:'none'}}/>
                  <div>
                    <b>Observación de la oficina: {officeName(selected.observation?.office)}</b>
                    <p>{selected.observation?.text}</p>
                    {can('request.correct') && (
                      <div style={{marginTop:4}}>
                        <button className="btn primary" onClick={()=>correct(selected)}>
                          <UploadCloud size={16}/>
                          <span>Subsanar documentación ahora</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selected.estado==='FINALIZADO' && (
                <div className="final-response">
                  <CheckCircle2 size={24} style={{flex:'none'}}/>
                  <div>
                    <b>Trámite concluido satisfactoriamente</b>
                    <span>{selected.respuesta}</span>
                  </div>
                  <button className="btn soft" onClick={()=>downloadRespuesta(selected)}>
                    <Download size={16}/> 
                    <span>{selected.documentoRespuesta||'Descargar respuesta oficial'}</span>
                  </button>
                </div>
              )}

              {/* Recorrido / Stepper */}
              <h4>Recorrido del expediente en las dependencias</h4>
              <RouteStrip exp={selected}/>

              {/* Grid Metadata */}
              <div className="detail-cols">
                <div>
                  <span>Solicitante</span>
                  <b>{selected.solicitante}</b>
                </div>
                <div>
                  <span>DNI / RUC</span>
                  <b>{selected.dni}</b>
                </div>
                <div>
                  <span>Programa / Carrera</span>
                  <b>{selected.programa}</b>
                </div>
                <div>
                  <span>Folios presentados</span>
                  <b>{selected.numeroFolios} folio(s)</b>
                </div>
                <div>
                  <span>Canal de ingreso</span>
                  <b>{selected.canal}</b>
                </div>
                <div>
                  <span>Fecha de presentación</span>
                  <b>{selected.fecha} a las {selected.hora}</b>
                </div>
              </div>

              {/* Fundamento */}
              <h4>Fundamento de la solicitud</h4>
              <div className="soft-box">
                <p>{selected.fundamento || 'Sin fundamento registrado.'}</p>
              </div>

              {/* Archivos y Requisitos */}
              <h4>Documentos y enlaces adjuntos</h4>
              <FileList files={selected.adjuntos}/>

              {/* Historial de Trazabilidad */}
              <h4>Historial de movimientos y auditoría</h4>
              <Timeline items={selected.historial}/>
            </div>
          ) : (
            <Empty title="Ningún expediente seleccionado" text="Selecciona un expediente de la lista lateral para visualizar su detalle."/>
          )}
        </Panel>
      </div>

      {/* Modal Nuevo FUT Virtual */}
      <Modal 
        open={open} 
        onClose={()=>setOpen(false)} 
        title="Nuevo Formulario Único de Trámite (FUT)" 
        subtitle="Completa los datos de tu solicitud. El sistema generará tu N.° de expediente definitivo al enviar."
        size="lg" 
        footer={
          <>
            <button className="btn ghost" onClick={()=>setOpen(false)}>Cancelar</button>
            <button className="btn primary" onClick={submit}>
              <Send size={16}/> 
              <span>Enviar solicitud a Mesa de Partes</span>
            </button>
          </>
        }
      >
        {/* Bloque 1: Datos del trámite */}
        <div style={{fontWeight:800,fontSize:13,color:'#0284c7',display:'flex',gap:6,alignItems:'center'}}>
          <span>1. Información del trámite y solicitante</span>
        </div>

        <div className="form-grid two">
          <Field label="Tipo de trámite requerido" required>
            <select value={form.procedureId} onChange={e=>{setForm({...form,procedureId:e.target.value});setFormError('')}}>
              {procedures.map(p=><option key={p.id} value={p.id}>{p.name} (SLA: {p.sla} días)</option>)}
            </select>
          </Field>
          
          <Field label="Condición institucional">
            <select value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})}>
              {CONDITIONS.map(x=><option key={x}>{x}</option>)}
            </select>
          </Field>

          <Field label="Apellidos y nombres completos" required>
            <input value={form.solicitante} onChange={e=>setForm({...form,solicitante:e.target.value})}/>
          </Field>

          <Field label="Documento de Identidad (DNI / CE)" required>
            <input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})}/>
          </Field>

          <Field label="Programa de estudios">
            <select value={form.programa} onChange={e=>setForm({...form,programa:e.target.value})}>
              {PROGRAMS.map(x=><option key={x}>{x}</option>)}
            </select>
          </Field>

          <Field label="Teléfono / Celular de contacto">
            <input value={form.celular} onChange={e=>setForm({...form,celular:e.target.value})}/>
          </Field>

          <Field label="Correo electrónico">
            <input value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})}/>
          </Field>

          <Field label="Número de folios">
            <input type="number" min="1" value={form.numeroFolios} onChange={e=>setForm({...form,numeroFolios:Number(e.target.value)})}/>
          </Field>
        </div>

        {/* Bloque 2: Fundamento */}
        <div style={{fontWeight:800,fontSize:13,color:'#0284c7',display:'flex',gap:6,alignItems:'center',marginTop:6}}>
          <span>2. Fundamento y detalle del pedido</span>
        </div>

        <Field label="Fundamento de la solicitud (FUT)" required hint="Explique con claridad el motivo y sustento de su trámite institucional.">
          <textarea rows="4" value={form.fundamento} onChange={e=>{setForm({...form,fundamento:e.target.value});setFormError('')}} placeholder="Describa los motivos de su solicitud…"/>
        </Field>

        {/* Bloque 3: Requisitos y Enlaces Drive */}
        <div style={{fontWeight:800,fontSize:13,color:'#0284c7',display:'flex',gap:6,alignItems:'center',marginTop:6}}>
          <span>3. Requisitos del trámite y archivos de sustento</span>
        </div>

        {checklist.length > 0 && (
          <div className="requirement-checklist">
            <h4>Requisitos obligatorios — marca cada casilla y pega el enlace compartido de Google Drive:</h4>
            {checklist.map((c,i)=>(
              <div className="requirement-row" key={`${c.label}-${i}`}>
                <label className="requirement-check">
                  <input 
                    type="checkbox" 
                    checked={c.checked} 
                    onChange={e=>{
                      setChecklist(cs=>cs.map((x,xi)=>xi===i?{...x,checked:e.target.checked}:x))
                      setFormError('')
                    }}
                  />
                  <span>{c.label}</span>
                </label>
                <input 
                  placeholder="Enlace de Google Drive (acceso: cualquier persona con el enlace)" 
                  value={c.url} 
                  onChange={e=>{
                    setChecklist(cs=>cs.map((x,xi)=>xi===i?{...x,url:e.target.value}:x))
                    setFormError('')
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {extraLinks.map((l,i)=>(
          <div className="requirement-row extra" key={`extra-${i}`}>
            <input 
              placeholder="Nombre del documento complementario" 
              value={l.label} 
              onChange={e=>setExtraLinks(ls=>ls.map((x,xi)=>xi===i?{...x,label:e.target.value}:x))}
            />
            <input 
              placeholder="Enlace de Google Drive" 
              value={l.url} 
              onChange={e=>setExtraLinks(ls=>ls.map((x,xi)=>xi===i?{...x,url:e.target.value}:x))}
            />
            <button type="button" className="btn ghost" onClick={()=>setExtraLinks(ls=>ls.filter((_,xi)=>xi!==i))} title="Quitar enlace">
              <X size={14}/>
            </button>
          </div>
        ))}

        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <button 
            type="button" 
            className="btn soft" 
            disabled={totalPlanned>=MAX_ATTACHMENTS} 
            onClick={()=>setExtraLinks(ls=>[...ls,{label:'',url:''}])}
          >
            <Plus size={14}/> 
            <span>Agregar otro enlace de Google Drive ({totalPlanned}/{MAX_ATTACHMENTS})</span>
          </button>
        </div>

        <label className="dropzone">
          <UploadCloud size={28}/>
          <b>Adjuntar FUT firmado o archivos PDF adicionales (opcional)</b>
          <span>Formatos permitidos: PDF, JPG o PNG · Máximo {MAX_ATTACHMENTS} archivos en total</span>
          <input type="file" multiple disabled={totalPlanned>=MAX_ATTACHMENTS} onChange={chooseFiles}/>
        </label>

        {form.adjuntos.length>0 && <FileList files={form.adjuntos}/>}
        {formError && <div className="login-error">{formError}</div>}

        <div className="form-note">
          <Paperclip size={16} color="#0284c7"/> 
          <span>Requisito normativo para este trámite: <b>{procedureById(form.procedureId)?.requires}</b></span>
        </div>
      </Modal>

      <CargoModal exp={cargoExp} onClose={()=>setCargoExp(null)}/>
    </div>
  )
}

