import React from 'react'
import { X, CheckCircle2, AlertTriangle, Info, Clock3, FileText, ChevronRight, Circle, ExternalLink, HardDrive } from 'lucide-react'
import { statusLabel, statusTone } from '../models/expediente'
import { officeName } from '../data/catalogs'
import { routeProgress, slaInfo } from '../workflowEngine'

export function Badge({children,tone='neutral'}){
  return <span className={`badge ${tone}`}>{children}</span>
}

export function StatusBadge({status}){
  const tone = statusTone(status)
  return <Badge tone={tone}>{statusLabel(status)}</Badge>
}

export function SlaBadge({exp}){
  const info=exp&&slaInfo(exp)
  if(!info||info.closed) return null
  if(info.overdue) return <Badge tone="danger"><Clock3 size={12}/> Vencido {Math.abs(info.daysLeft)}d</Badge>
  if(info.daysLeft<=1) return <Badge tone="warning"><Clock3 size={12}/> Vence hoy</Badge>
  return <Badge tone="neutral"><Clock3 size={12}/> Vence en {info.daysLeft}d</Badge>
}

export function Panel({title,subtitle,actions,children,className=''}){
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle&&<p>{subtitle}</p>}
        </div>
        {actions&&<div className="panel-actions">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

export function Empty({title='No hay elementos',text='No existen registros para mostrar.'}){
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText size={24}/>
      </div>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  )
}

export function Modal({open,title,subtitle,onClose,children,footer,size='md'}){
  if(!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
      <div className={`modal ${size}`}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle&&<p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar ventana">
            <X size={18}/>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer&&<div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({label,children,hint,required}){
  return (
    <label className="field">
      <span>{label}{required&&<b className="required"> *</b>}</span>
      {children}
      {hint&&<small>{hint}</small>}
    </label>
  )
}

export function Toast({message,type='success'}){
  if(!message) return null
  return (
    <div className={`toast ${type}`}>
      {type==='success'?<CheckCircle2 size={18}/>:type==='error'?<AlertTriangle size={18}/>:<Info size={18}/>}
      <span>{message}</span>
    </div>
  )
}

export function Kpi({label,value,helper,icon:Icon,tone='blue'}){
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-icon">
        {Icon&&<Icon size={22}/>}
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper&&<small>{helper}</small>}
      </div>
    </div>
  )
}

export function Timeline({items=[]}){
  return (
    <div className="timeline">
      {[...items].reverse().map((e,i)=>(
        <div className="timeline-item" key={`${e.time}-${i}`}>
          <span className="timeline-dot"></span>
          <div>
            <div className="timeline-meta">
              <b>{e.actor}</b>
              <span>{e.time}</span>
            </div>
            <strong>{e.action}</strong>
            <p>{e.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function RouteStrip({exp,compact=false}){
  const route=exp?.routePlan||[]
  const steps=[
    {id:'mesa_partes',label:'Mesa de Partes'},
    {id:'direccion',label:'Dirección'},
    ...route.map(id=>({id,label:officeName(id)})),
    {id:'mesa_partes_cierre',label:'Cierre'}
  ]
  const active=exp?routeProgress(exp).completed:-1
  return (
    <div className={`route-strip ${compact?'compact':''}`}>
      {steps.map((s,i)=>{
        const done=exp?.estado==='FINALIZADO'||i<active
        const current=i===active
        return (
          <React.Fragment key={`${s.id}-${i}`}>
            <div className={`route-step ${done?'done':''} ${current?'current':''}`}>
              <span>
                {done ? <CheckCircle2 size={15}/> : current ? <Clock3 size={15}/> : <Circle size={13}/>}
              </span>
              <b>{s.label}</b>
            </div>
            {i<steps.length-1 && <ChevronRight className="route-arrow" size={15}/>}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function FileList({files=[]}){
  return (
    <div className="file-list">
      {files.length ? (
        files.map((f,i)=>{
          const isDrive = !!f.url || (f.size && f.size.includes('Drive'))
          return (
            <div className="file-row" key={`${f.name}-${i}`}>
              {isDrive ? <HardDrive size={18} color="#0284c7"/> : <FileText size={18} color="#64748b"/>}
              <div>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4}}>
                    <b>{f.name}</b>
                    <ExternalLink size={12}/>
                  </a>
                ) : (
                  <b>{f.name}</b>
                )}
                <span>{f.size||(f.url?'Google Drive':'Archivo adjunto')}</span>
              </div>
            </div>
          )
        })
      ) : (
        <span className="muted" style={{fontSize:12,fontStyle:'italic',padding:'4px 0'}}>Sin archivos adjuntos</span>
      )}
    </div>
  )
}

