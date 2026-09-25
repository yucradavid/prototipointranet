import React from 'react'
import { X, CheckCircle2, AlertTriangle, Info, Clock3, FileText, ChevronRight, Circle, ExternalLink, HardDrive, Wallet, Receipt, ShieldCheck, FileCheck, FormInput, Lock } from 'lucide-react'
import { statusLabel, statusTone } from '../models/expediente'
import { officeName, procedureById, procedureForExpediente, PAYMENT_INFO } from '../data/catalogs'
import { routeProgress, slaInfo, requiresPayment } from '../workflowEngine'
import { getRequirementsArray } from '../models/procedure.js'

// ─── RequirementsBlock ────────────────────────────────────────────────────────
// Muestra los requisitos estructurados del trámite junto a los adjuntos reales
// del expediente para que la oficina pueda verificar cada uno.
export function RequirementsBlock({ exp }) {
  const proc = exp && procedureForExpediente(exp)
  const reqs = proc ? getRequirementsArray(proc) : []
  if (!reqs.length) return null

  const adjuntos = exp?.adjuntos || []

  // Intenta emparejar un requisito con un adjunto por similaridad de nombre
  const findAttachment = label => {
    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const key = norm(label)
    return adjuntos.find(a => {
      const aName = norm(a.name)
      // Coincidencia directa o si la clave está contenida en el nombre del adjunto
      return aName.includes(key.slice(0, 12)) || key.includes(aName.slice(0, 12))
    })
  }

  const typeIcon = type => {
    if (type === 'form')      return <FormInput size={13} style={{ color: '#0369a1' }} />
    if (type === 'payment')   return <Wallet size={13} style={{ color: '#b45309' }} />
    if (type === 'condition') return <Lock size={13} style={{ color: '#7c3aed' }} />
    return <FileText size={13} style={{ color: '#15803d' }} />
  }

  const typeLabel = type => {
    if (type === 'form')      return 'Formulario'
    if (type === 'payment')   return 'Pago'
    if (type === 'condition') return 'Condición interna'
    return 'Documento'
  }

  const typeColor = type => {
    if (type === 'form')      return '#e0f2fe'
    if (type === 'payment')   return '#fef3c7'
    if (type === 'condition') return '#ede9fe'
    return '#f0fdf4'
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--arib-navy-light)', marginBottom: 8 }}>
        Requisitos del trámite
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {reqs.map((r, i) => {
          const att = r.type !== 'form' && r.type !== 'condition' ? findAttachment(r.label) : null
          const isConditional = r.required === 'conditional'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'var(--arib-surface-subtle)', border: '1px solid var(--arib-border)',
              borderRadius: 8, padding: '7px 10px',
              opacity: isConditional ? 0.8 : 1
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: typeColor(r.type), flexShrink: 0, marginTop: 1
              }}>
                {typeIcon(r.type)}
                {typeLabel(r.type)}
                {isConditional && ' ·  Condicional'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--arib-navy)', fontWeight: 600 }}>{r.label}</span>
                {r.note && <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{r.note}</span>}
                {isConditional && <small style={{display:'block'}}>{exp.requirementResponses?.find(x=>x.label===r.label)?.applies===false ? 'El solicitante declaró que no aplica a su caso.' : exp.requirementResponses?.find(x=>x.label===r.label)?.applies===true ? 'El solicitante declaró que sí aplica a su caso.' : 'Aplicabilidad pendiente de revisión.'}</small>}
                {att && (
                  <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={11} style={{ color: '#16a34a', flexShrink: 0 }} />
                    {att.url ? (
                      <a href={att.url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {att.name} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: '#16a34a' }}>{att.name}</span>
                    )}
                  </div>
                )}
                {!att && r.type === 'document' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                    <AlertTriangle size={10} /> Sin adjunto identificado
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  if(info.paused) return <Badge tone="info"><Clock3 size={12}/> SLA pausado</Badge>
  if(info.overdue) return <Badge tone="danger"><Clock3 size={12}/> Vencido {Math.abs(info.daysLeft)>0 ? `${Math.abs(info.daysLeft)}d` : '(plazo cumplido)'}</Badge>
  if(info.daysLeft===0) return <Badge tone="warning"><Clock3 size={12}/> Vence hoy</Badge>
  return <Badge tone="neutral"><Clock3 size={12}/> Vence en {info.daysLeft}d</Badge>
}

export function PaymentStatusCard({exp,onViewReceipt}){
  const proc=exp&&procedureForExpediente(exp)
  // Tarifa pendiente: mostrar aviso informativo sin asumir gratuidad
  if(proc?.tariffStatus==='pending') return (
    <div className="payment-status-card pending" style={{background:'#fef9c3',borderColor:'#fde047'}}>
      <AlertTriangle size={22} style={{flex:'none',color:'#b45309'}}/>
      <div>
        <b style={{color:'#92400e'}}>Tarifa pendiente de definición</b>
        <p style={{color:'#78350f'}}>
          No se ha confirmado el costo de este trámite. No significa que sea gratuito.
          El Administrador debe configurar la tarifa antes de que nuevas solicitudes puedan procesarse.
        </p>
      </div>
    </div>
  )
  if(!proc?.monto&&proc?.tariffStatus!=='fixed') return null
  if((proc?.monto||0)===0) return (
    <div className="payment-status-card free" style={{background:'#f0fdf4',borderColor:'#86efac'}}>
      <ShieldCheck size={22} style={{flex:'none',color:'#16a34a'}}/>
      <div>
        <b style={{color:'#166534'}}>Trámite sin costo</b>
        <p style={{color:'#15803d'}}>Este trámite es gratuito, no requiere comprobante de pago.</p>
      </div>
    </div>
  )
  const isPaid=exp.pago?.estado==='PAGADO'
  return (
    <div className={`payment-status-card ${isPaid?'paid':'pending'}`}>
      {isPaid ? <ShieldCheck size={22} style={{flex:'none'}}/> : <Wallet size={22} style={{flex:'none'}}/>}
      <div>
        {isPaid ? (
          <>
            <b>Pago confirmado por Tesorería</b>
            <p>
              Se registró tu pago de <strong>S/ {Number(exp.pago.monto).toFixed(2)}</strong> el {exp.pago.fecha} mediante {exp.pago.metodo}.
              Tu trámite continúa su proceso con normalidad.
            </p>
          </>
        ) : (
          <>
            <b>Este trámite requiere un pago de S/ {Number(proc.monto).toFixed(2)}</b>
            <p>
              Aún no se ha registrado tu pago en Tesorería. Puedes pagar por Yape al <strong>{PAYMENT_INFO.yape}</strong> o
              por depósito/transferencia a la cuenta <strong>{PAYMENT_INFO.cuenta}</strong> ({PAYMENT_INFO.banco}) a nombre
              de {PAYMENT_INFO.titular}, y presentar tu comprobante cuando tu expediente llegue a esa oficina.
            </p>
          </>
        )}
      </div>
      {isPaid && onViewReceipt && (
        <button className="btn soft" onClick={onViewReceipt}>
          <Receipt size={15}/> Ver recibo
        </button>
      )}
    </div>
  )
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
  const stripRef=React.useRef(null)
  const [overflowing,setOverflowing]=React.useState(false)
  const route=exp?.routePlan||[]
  const steps=[
    {id:'mesa_partes',label:'Mesa de Partes'},
    {id:'direccion',label:'Dirección'},
    ...route.map(id=>({id,label:officeName(id)})),
    {id:'mesa_partes_cierre',label:'Cierre'}
  ]
  const active=exp?routeProgress(exp).completed:-1
  // Por qué el expediente está detenido en el paso actual: dato real (estado, pago), no
  // una distinción "en cola / en revisión" que el modelo de datos no puede sustentar.
  const currentNote=exp?.estado==='OBSERVADO'
    ? 'Esperando tu subsanación'
    : exp&&requiresPayment(exp)
      ? 'Esperando el pago del derecho de trámite'
      : exp?.estado==='EN_OFICINA'
        ? 'En atención'
        : ''
  // Con rutas largas (4+ oficinas) la tira no entra en pantalla y se corta en silencio.
  // El desvanecido a la derecha (.has-overflow) avisa que hay más pasos con scroll horizontal.
  React.useEffect(()=>{
    const el=stripRef.current
    if(!el)return
    const check=()=>setOverflowing(el.scrollWidth>el.clientWidth+2)
    check()
    window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[steps.length,compact])
  return (
    <>
      <div className={`route-strip-wrap ${overflowing?'has-overflow':''} ${compact?'compact':''}`}>
        <div ref={stripRef} className={`route-strip ${compact?'compact':''}`}>
        {steps.map((s,i)=>{
          const done=exp?.estado==='FINALIZADO'||i<active
          const current=i===active
          return (
            <React.Fragment key={`${s.id}-${i}`}>
              <div className={`route-step ${done?'done':''} ${current?'current':''}`} title={current&&currentNote?currentNote:undefined}>
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
      </div>
      {!compact&&currentNote&&(
        <p style={{margin:'6px 0 0',fontSize:12,color:'var(--arib-navy-light)',display:'flex',alignItems:'center',gap:5}}>
          <Clock3 size={12}/> {currentNote}
        </p>
      )}
    </>
  )
}

export function FileList({files=[]}){
  const getIcon = f => {
    const name = String(f.name || '').toLowerCase()
    if (/pago|comprobante|voucher|recibo|yape|plin/i.test(name)) return <Wallet size={18} color="#b45309"/>
    if (/fut|formulario/i.test(name)) return <FileCheck size={18} color="#0369a1"/>
    const isDrive = !!f.url || (f.size && f.size.includes('Drive'))
    return isDrive ? <HardDrive size={18} color="#0284c7"/> : <FileText size={18} color="#64748b"/>
  }
  return (
    <div className="file-list">
      {files.length ? (
        files.map((f,i)=>{
          return (
            <div className="file-row" key={`${f.name}-${i}`}>
              {getIcon(f)}
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

