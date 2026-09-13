import { officeName, procedureById } from './data/catalogs.js'

const event=(actor,action,text,time)=>({time,actor,action,text})

export function createVirtual(data, numero, time){
  const tracking=`ARIB-${numero}`
  return {...data,id:`sol-${Date.now()}`,numero,tracking,canal:'Virtual',tipoDocumento:'FUT',estado:'SOLICITUD_VIRTUAL',oficinaActual:'mesa_partes',firmaSecretaria:'',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,pago:null,pauseStartedAt:null,slaPausedMs:0,historial:[event('Solicitante','Envío virtual',`Envió FUT virtual. N.° de expediente ${numero} asignado. Pendiente de validación en Mesa de Partes.`,time)]}
}

export function registerVirtual(exp,time){
  if(exp.estado!=='SOLICITUD_VIRTUAL') throw new Error('Solo se puede registrar una solicitud virtual pendiente.')
  return {...exp,estado:'EN_DIRECCION',oficinaActual:'direccion',firmaSecretaria:'Secretaría · recepción conforme',historial:[...exp.historial,event('Secretaría','Registro',`Validó el expediente N.° ${exp.numero}. Por regla crítica, fue remitido obligatoriamente a Dirección.`,time)]}
}

export function createPhysical(data,numero,time){
  return {...data,id:`exp-${numero}`,numero,tracking:`ARIB-${numero}`,canal:'Físico',tipoDocumento:'FUT',estado:'EN_DIRECCION',oficinaActual:'direccion',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,pago:null,pauseStartedAt:null,slaPausedMs:0,historial:[event('Secretaría','Registro',`Registró expediente físico N.° ${numero} y lo remitió obligatoriamente a Dirección.`,time)]}
}

export function issueProveido(exp,{proveido,routePlan,routeVersion},time){
  if(exp.estado!=='EN_DIRECCION') throw new Error('El expediente no está pendiente en Dirección.')
  if(!proveido?.trim()) throw new Error('El proveído es obligatorio.')
  if(!Array.isArray(routePlan)||routePlan.length===0) throw new Error('Dirección debe definir al menos una oficina de atención.')
  if(routePlan.some(x=>['mesa_partes','direccion'].includes(x))) throw new Error('La ruta posterior al proveído no debe repetir Mesa de Partes ni Dirección.')
  return syncPause({...exp,estado:'EN_OFICINA',oficinaActual:routePlan[0],vistoBuenoDireccion:'Dirección · V°B° registrado',proveido:proveido.trim(),routePlan:[...routePlan],routeIndex:0,routeVersion:routeVersion||1,observation:null,historial:[...exp.historial,event('Dirección','Proveído',`Emitió V°B° y proveído. Ruta activada: ${routePlan.map(officeName).join(' → ')}.`,time)]})
}

export function observeAtOffice(exp,{text},time){
  if(exp.estado!=='EN_OFICINA') throw new Error('Solo la oficina actual puede observar un expediente en atención.')
  if(!text?.trim()) throw new Error('Debe registrar el motivo de observación.')
  const office=exp.oficinaActual
  return syncPause({...exp,estado:'OBSERVADO',observation:{office,text:text.trim(),createdAt:time},historial:[...exp.historial,event(officeName(office),'Observación',text.trim(),time)]})
}

export function correctObservation(exp,{files=[]},time){
  if(exp.estado!=='OBSERVADO'||!exp.observation?.office) throw new Error('El expediente no tiene una observación pendiente de subsanación.')
  const office=exp.observation.office
  return syncPause({...exp,estado:'EN_OFICINA',oficinaActual:office,adjuntos:[...(exp.adjuntos||[]),...files],observation:null,historial:[...exp.historial,event('Solicitante','Subsanación',`Subsanó la observación. El expediente regresó a ${officeName(office)}.`,time)]})
}

export function requiresPayment(exp){
  const proc=procedureById(exp?.procedureId)
  return exp?.oficinaActual==='tesoreria'&&(proc?.monto||0)>0
}

// El SLA institucional mide cuánto tarda el TRÁMITE en resolverse, no cuánto tarda el
// solicitante en subsanar una observación o en pagar. Mientras el expediente está
// OBSERVADO, o esperando el pago de un trámite de costo en Tesorería, el motivo del
// retraso no depende de ninguna oficina, así que el reloj de SLA se pausa: ver slaInfo.
function isPausedState(exp){
  if(exp.estado==='OBSERVADO') return true
  if(exp.estado==='EN_OFICINA'&&requiresPayment(exp)&&exp.pago?.estado!=='PAGADO') return true
  return false
}

function syncPause(exp){
  const paused=isPausedState(exp)
  const now=Date.now()
  if(paused&&exp.pauseStartedAt==null) return {...exp,pauseStartedAt:now}
  if(!paused&&exp.pauseStartedAt!=null) return {...exp,pauseStartedAt:null,slaPausedMs:(exp.slaPausedMs||0)+Math.max(0,now-exp.pauseStartedAt)}
  return exp
}

export function registerPayment(exp,{monto,metodo,voucher,fecha,comprobante},time){
  if(exp.estado!=='EN_OFICINA') throw new Error('El expediente no está disponible para registrar un pago.')
  if(exp.oficinaActual!=='tesoreria') throw new Error('El pago solo se registra en Tesorería.')
  if(!(Number(monto)>0)) throw new Error('Ingresa el monto pagado.')
  if(!voucher?.trim()) throw new Error('Ingresa el N.° de operación o voucher.')
  const pago={estado:'PAGADO',monto:Number(monto),metodo:metodo||'Depósito bancario',voucher:voucher.trim(),fecha:fecha||'',comprobante:comprobante?.trim()||'',registradoAt:time}
  return syncPause({...exp,pago,historial:[...exp.historial,event('Tesorería','Pago registrado',`Registró pago de S/ ${Number(monto).toFixed(2)} (${metodo||'Depósito bancario'}, Voucher ${voucher.trim()}).`,time)]})
}

export function completeOfficeStep(exp,{note='',document=''},time){
  if(exp.estado!=='EN_OFICINA') throw new Error('El expediente no está disponible para atención en oficina.')
  const current=exp.oficinaActual
  if(exp.routePlan[exp.routeIndex]!==current) throw new Error('La oficina actual no coincide con el paso configurado de la ruta.')
  if(requiresPayment(exp)&&exp.pago?.estado!=='PAGADO') throw new Error('Debe registrar el pago del trámite antes de completar este paso.')
  const nextIndex=exp.routeIndex+1
  const hasNext=nextIndex<exp.routePlan.length
  if(hasNext){
    const next=exp.routePlan[nextIndex]
    return syncPause({...exp,estado:'EN_OFICINA',oficinaActual:next,routeIndex:nextIndex,historial:[...exp.historial,event(officeName(current),'Paso completado',`${note?.trim()||'Atención conforme.'} Derivado automáticamente a ${officeName(next)}.`,time)]})
  }
  return syncPause({...exp,estado:'RESPUESTA_MESA',oficinaActual:'mesa_partes',routeIndex:nextIndex,respuesta:note?.trim()||'Atención culminada según proveído.',documentoRespuesta:document||`Respuesta_${exp.numero}.pdf`,historial:[...exp.historial,event(officeName(current),'Ruta completada',`${note?.trim()||'Atención conforme.'} Se devolvió el expediente a Mesa de Partes para entrega/cierre.`,time)]})
}

export function finalizeCase(exp,time){
  if(exp.estado!=='RESPUESTA_MESA') throw new Error('Solo se puede cerrar un expediente cuya ruta ya terminó y volvió a Mesa de Partes.')
  return {...exp,estado:'FINALIZADO',oficinaActual:'mesa_partes',historial:[...exp.historial,event('Secretaría','Cierre','Registró la entrega/notificación de la respuesta y finalizó el expediente.',time)]}
}

export function routeProgress(exp){
  const prefix=['mesa_partes','direccion']
  const route=exp.routePlan||[]
  const all=[...prefix,...route,'mesa_partes_cierre']
  let completed=0
  if(exp.estado!=='SOLICITUD_VIRTUAL') completed=1
  if(exp.vistoBuenoDireccion) completed=2
  if(['EN_OFICINA','OBSERVADO','RESPUESTA_MESA','FINALIZADO'].includes(exp.estado)) completed=2+Math.max(0,exp.routeIndex)
  if(['RESPUESTA_MESA','FINALIZADO'].includes(exp.estado)) completed=2+route.length
  if(exp.estado==='FINALIZADO') completed=all.length
  return {all,completed,total:all.length}
}

export function validateWorkflowRoute(route){
  const errors=[]
  if(!Array.isArray(route)||route.length===0) errors.push('Debe existir al menos una oficina posterior a Dirección.')
  if(new Set(route).size!==route.length) errors.push('La ruta no debe repetir oficinas en esta versión del prototipo.')
  if(route.some(x=>['mesa_partes','direccion'].includes(x))) errors.push('Mesa de Partes y Dirección son pasos obligatorios bloqueados y no deben repetirse.')
  return errors
}

function parseFechaPE(fecha){
  const [d,m,y]=String(fecha||'').split('/').map(Number)
  if(!d||!m||!y) return null
  return new Date(y,m-1,d)
}

export function slaInfo(exp,now=new Date()){
  const proc=procedureById(exp?.procedureId)
  if(!proc?.sla) return null
  const start=parseFechaPE(exp.fecha)
  if(!start) return null
  const due=new Date(start)
  due.setDate(due.getDate()+proc.sla)
  const closed=exp.estado==='FINALIZADO'
  const nowMs=now.getTime()
  const ongoingPauseMs=exp?.pauseStartedAt!=null?Math.max(0,nowMs-exp.pauseStartedAt):0
  const pausedMs=(exp?.slaPausedMs||0)+ongoingPauseMs
  const effectiveNow=new Date(nowMs-pausedMs)
  const daysLeft=Math.ceil((due-effectiveNow)/86400000)
  return {due,daysLeft,overdue:!closed&&effectiveNow>due,closed,paused:exp?.pauseStartedAt!=null}
}

export function canDeleteOffice(officeId,{items=[],workflows={}}={}){
  if(Object.values(workflows).some(w=>(w.route||[]).includes(officeId))) return 'La oficina está en uso en la ruta publicada de al menos un trámite.'
  if(items.some(x=>x.oficinaActual===officeId||(x.routePlan||[]).includes(officeId))) return 'La oficina tiene expedientes activos o históricos asociados y no puede eliminarse.'
  return null
}

export function canDeleteProcedure(procedureId,{items=[]}={}){
  if(items.some(x=>x.procedureId===procedureId)) return 'El trámite tiene expedientes registrados y no puede eliminarse.'
  return null
}

export function validateRolePermissions(role,data){
  const errors=[]
  if(!Array.isArray(data?.views)||data.views.length===0) errors.push('El rol debe conservar acceso a al menos una vista.')
  if(role==='admin'&&!(data?.views||[]).includes('catalog')) errors.push('El rol Administrador no puede perder el acceso a "Usuarios y catálogos": es el único lugar para revertir cambios de permisos.')
  return errors
}

export function authenticate(users,username,password){
  const u=(users||[]).find(x=>x.username===username&&x.password===password)
  if(!u||u.active===false) return null
  return u
}

export function authenticateByEmail(users,email){
  const clean=String(email||'').trim().toLowerCase()
  if(!clean) return null
  const u=(users||[]).find(x=>String(x.email||'').toLowerCase()===clean)
  if(!u||u.active===false) return null
  return u
}

export function redirectToOffice(exp,{officeId,note},time){
  if(exp.estado!=='EN_OFICINA') throw new Error('Solo se puede redirigir un expediente en atención.')
  if(!officeId) throw new Error('Selecciona la oficina de destino.')
  const current=exp.oficinaActual
  if(officeId===current) throw new Error('Selecciona una oficina distinta a la actual.')
  const insertAt=exp.routeIndex+1
  const routePlan=[...exp.routePlan.slice(0,insertAt),officeId,...exp.routePlan.slice(insertAt)]
  return syncPause({...exp,oficinaActual:officeId,routePlan,routeIndex:insertAt,historial:[...exp.historial,event(officeName(current),'Redirección',`${note?.trim()||'Derivación manual fuera de la ruta programada.'} Redirigido a ${officeName(officeId)}.`,time)]})
}
