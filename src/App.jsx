import React,{useEffect,useMemo,useState} from 'react'
import AppShell from './components/AppShell'
import { Toast } from './components/ui'
import ApplicantPortalView from './views/ApplicantPortalView'
import SecretariaWorkbenchView from './views/SecretariaWorkbenchView'
import DireccionWorkbenchView from './views/DireccionWorkbenchView'
import OfficeWorkbenchView from './views/OfficeWorkbenchView'
import AdminControlView from './views/AdminControlView'
import WorkflowAdminView from './views/WorkflowAdminView'
import CatalogAdminView from './views/CatalogAdminView'
import BookAuditView from './views/BookAuditView'
import TrackingView from './views/TrackingView'
import LoginView from './views/LoginView'
import { slugify, setOfficesCatalog, setProceduresCatalog, officeName } from './data/catalogs'
import { loadExpedientes,saveExpedientes,loadWorkflows,saveWorkflows,loadOffices,saveOffices,loadProcedures,saveProcedures,resetAll,nextNumero } from './repositories/prototypeRepository'
import { createVirtual,registerVirtual,createPhysical,issueProveido,observeAtOffice,correctObservation,completeOfficeStep,finalizeCase,validateWorkflowRoute,slaInfo,canDeleteOffice,canDeleteProcedure } from './workflowEngine'

const today=()=>new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())
const time=()=>new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false})

export default function App(){
  const [loggedIn,setLoggedIn]=useState(false)
  const [profileId,setProfileId]=useState('admin'),[officeId,setOfficeId]=useState('biblioteca'),[activeView,setActiveView]=useState('control')
  const [items,setItems]=useState(()=>loadExpedientes()),[workflows,setWorkflows]=useState(()=>loadWorkflows()),[toast,setToast]=useState({message:'',type:'success'})
  const [offices,setOffices]=useState(()=>loadOffices()),[procedures,setProcedures]=useState(()=>loadProcedures())
  useEffect(()=>saveExpedientes(items),[items]);useEffect(()=>saveWorkflows(workflows),[workflows])
  useEffect(()=>{saveOffices(offices);setOfficesCatalog(offices)},[offices])
  useEffect(()=>{saveProcedures(procedures);setProceduresCatalog(procedures)},[procedures])
  const notify=(message,type='success')=>{setToast({message,type});clearTimeout(window.__aribToast);window.__aribToast=setTimeout(()=>setToast({message:'',type}),2600)}
  const update=(id,fn)=>{let result;setItems(curr=>curr.map(x=>{if(x.id!==id)return x;try{result=fn(x);return result}catch(err){notify(err.message,'error');return x}}));return result}
  const onCreateVirtual=data=>{const tracking=`SOL-ARIB-${String(Date.now()).slice(-5)}`;const exp=createVirtual({...data,fecha:today(),hora:time()},tracking,time());setItems(c=>[exp,...c]);notify(`Solicitud enviada con código ${tracking}`);return exp}
  const onRegisterVirtual=exp=>{const n=nextNumero(items);update(exp.id,x=>registerVirtual(x,n,time()));notify(`Expediente ${n} registrado y enviado a Dirección`)}
  const onCreatePhysical=data=>{const n=nextNumero(items);try{const exp=createPhysical({...data,fecha:today(),hora:time()},n,time());setItems(c=>[exp,...c]);notify(`Expediente físico ${n} registrado y remitido a Dirección`)}catch(err){notify(err.message,'error')}}
  const onProveido=(exp,payload)=>{update(exp.id,x=>issueProveido(x,payload,time()));notify(`Proveído emitido. Ruta activada para EXP ${exp.numero}`)}
  const onObserve=(exp,payload)=>{update(exp.id,x=>observeAtOffice(x,payload,time()));notify(`Observación enviada al solicitante`)}
  const onCorrect=(exp,payload)=>{update(exp.id,x=>correctObservation(x,payload,time()));notify(`Subsanación registrada y devuelta a la oficina observadora`)}
  const onComplete=(exp,payload)=>{const result=update(exp.id,x=>completeOfficeStep(x,payload,time()));if(result)notify(result.estado==='RESPUESTA_MESA'?'Ruta completada; expediente devuelto a Mesa de Partes':`Paso completado; expediente enviado al siguiente punto`)}
  const onFinalize=exp=>{update(exp.id,x=>finalizeCase(x,time()));notify(`EXP ${exp.numero} finalizado`)}
  const onPublishWorkflow=(procedureId,route)=>{setWorkflows(w=>({...w,[procedureId]:{...(w[procedureId]||{}),route:[...route],version:(w[procedureId]?.version||0)+1,status:'PUBLICADO',updatedAt:'Ahora'}}));notify('Nueva versión de ruta publicada')}

  const onSaveOffice=data=>{
    const isNew=!data.id
    const id=data.id||slugify(data.name)
    if(isNew&&offices.some(o=>o.id===id)){notify('Ya existe una oficina con un nombre muy similar.','error');return}
    const office={id,name:data.name.trim(),short:(data.short||'').trim().toUpperCase()||id.slice(0,3).toUpperCase(),color:data.color||'#0788d1'}
    setOffices(curr=>isNew?[...curr,office]:curr.map(o=>o.id===id?office:o))
    notify(isNew?'Oficina creada':'Oficina actualizada')
  }
  const onDeleteOffice=id=>{
    const err=canDeleteOffice(id,{items,workflows})
    if(err){notify(err,'error');return}
    if(!confirm('¿Eliminar esta oficina?'))return
    setOffices(curr=>curr.filter(o=>o.id!==id))
    notify('Oficina eliminada')
  }
  const onSaveProcedure=data=>{
    const isNew=!data.id
    const id=data.id||slugify(data.name)
    if(isNew){
      const errs=validateWorkflowRoute(data.route)
      if(errs.length){notify(errs[0],'error');return null}
      if(procedures.some(p=>p.id===id)){notify('Ya existe un trámite con un nombre muy similar.','error');return null}
    }
    const proc={id,name:data.name.trim(),category:data.category?.trim()||'General',requires:data.requires?.trim()||'—',sla:data.sla,route:data.route}
    setProcedures(curr=>isNew?[...curr,proc]:curr.map(p=>p.id===id?proc:p))
    if(isNew)setWorkflows(w=>({...w,[id]:{version:1,status:'PUBLICADO',route:[...data.route],updatedAt:'Ahora'}}))
    notify(isNew?'Trámite creado':'Trámite actualizado')
    return id
  }
  const onDeleteProcedure=id=>{
    const err=canDeleteProcedure(id,{items})
    if(err){notify(err,'error');return false}
    if(!confirm('¿Eliminar este trámite?'))return false
    setProcedures(curr=>curr.filter(p=>p.id!==id))
    setWorkflows(w=>{const n={...w};delete n[id];return n})
    notify('Trámite eliminado')
    return true
  }

  const reset=()=>{if(!confirm('¿Restaurar todos los datos del prototipo?'))return;const r=resetAll();setItems(r.expedientes);setWorkflows(r.workflows);setOffices(r.offices);setProcedures(r.procedures);setProfileId('admin');setActiveView('control');notify('Prototipo restaurado')}

  const alerts=useMemo(()=>{
    if(profileId==='admin') return [
      ...items.filter(x=>slaInfo(x)?.overdue).map(x=>`EXP ${x.numero} vencido según SLA · en ${officeName(x.oficinaActual)}`),
      ...items.filter(x=>x.estado==='OBSERVADO').map(x=>`EXP ${x.numero} observado, esperando subsanación`),
    ]
    if(profileId==='secretaria') return [
      ...items.filter(x=>x.estado==='SOLICITUD_VIRTUAL').map(x=>`${x.tracking} pendiente de registro`),
      ...items.filter(x=>x.estado==='RESPUESTA_MESA').map(x=>`EXP ${x.numero} listo para entrega/cierre`),
    ]
    if(profileId==='direccion') return items.filter(x=>x.estado==='EN_DIRECCION').map(x=>`EXP ${x.numero} pendiente de proveído`)
    if(profileId==='oficina') return items.filter(x=>['EN_OFICINA','OBSERVADO'].includes(x.estado)&&x.oficinaActual===officeId).map(x=>`EXP ${x.numero} en bandeja de ${officeName(officeId)}`)
    if(profileId==='estudiante'||profileId==='docente') return items.filter(x=>x.ownerProfile===profileId&&x.estado==='OBSERVADO').map(x=>`${x.numero?`EXP ${x.numero}`:x.tracking} requiere subsanación`)
    return []
  },[items,profileId,officeId])

  let content
  if(profileId==='estudiante'||profileId==='docente') content=activeView==='tracking'?<TrackingView items={items}/>:<ApplicantPortalView profileId={profileId} items={items} procedures={procedures} onCreateVirtual={onCreateVirtual} onCorrect={onCorrect}/>
  else if(profileId==='secretaria') content=activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<SecretariaWorkbenchView items={items} procedures={procedures} onRegisterVirtual={onRegisterVirtual} onCreatePhysical={onCreatePhysical} onFinalize={onFinalize}/>
  else if(profileId==='direccion') content=activeView==='tracking'?<TrackingView items={items}/>:<DireccionWorkbenchView items={items} workflows={workflows} offices={offices} onProveido={onProveido}/>
  else if(profileId==='oficina') content=activeView==='tracking'?<TrackingView items={items}/>:<OfficeWorkbenchView officeId={officeId} items={items} onObserve={onObserve} onComplete={onComplete}/>
  else content=activeView==='workflow'?<WorkflowAdminView workflows={workflows} offices={offices} procedures={procedures} onPublish={onPublishWorkflow} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure}/>:activeView==='catalog'?<CatalogAdminView offices={offices} procedures={procedures} onSaveOffice={onSaveOffice} onDeleteOffice={onDeleteOffice} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure}/>:activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<AdminControlView items={items} offices={offices} setActiveView={setActiveView}/>
  const login=(id)=>{setProfileId(id);setActiveView(id==='admin'?'control':id==='estudiante'||id==='docente'?'portal':'work');setLoggedIn(true)}
  if(!loggedIn)return <LoginView onLogin={login}/>
  return <><AppShell profileId={profileId} setProfileId={setProfileId} officeId={officeId} setOfficeId={setOfficeId} offices={offices} activeView={activeView} setActiveView={setActiveView} alerts={alerts} onReset={reset} onLogout={()=>setLoggedIn(false)}>{content}</AppShell><Toast message={toast.message} type={toast.type}/></>
}
