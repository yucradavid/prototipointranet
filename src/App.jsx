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
import { parseStudentsCsv } from './data/userImport'
import { loadExpedientes,saveExpedientes,loadWorkflows,saveWorkflows,loadOffices,saveOffices,loadProcedures,saveProcedures,loadUsers,saveUsers,resetAll,nextNumero } from './repositories/prototypeRepository'
import { createVirtual,registerVirtual,createPhysical,issueProveido,observeAtOffice,correctObservation,completeOfficeStep,finalizeCase,validateWorkflowRoute,slaInfo,canDeleteOffice,canDeleteProcedure,authenticate } from './workflowEngine'

const today=()=>new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())
const time=()=>new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false})

export default function App(){
  const [loggedIn,setLoggedIn]=useState(false)
  const [currentUser,setCurrentUser]=useState(null)
  const [profileId,setProfileId]=useState('admin'),[officeId,setOfficeId]=useState('biblioteca'),[activeView,setActiveView]=useState('control')
  const [items,setItems]=useState(()=>loadExpedientes()),[workflows,setWorkflows]=useState(()=>loadWorkflows()),[toast,setToast]=useState({message:'',type:'success'})
  const [offices,setOffices]=useState(()=>loadOffices()),[procedures,setProcedures]=useState(()=>loadProcedures()),[users,setUsers]=useState(()=>loadUsers())
  useEffect(()=>saveExpedientes(items),[items]);useEffect(()=>saveWorkflows(workflows),[workflows])
  useEffect(()=>{saveOffices(offices);setOfficesCatalog(offices)},[offices])
  useEffect(()=>{saveProcedures(procedures);setProceduresCatalog(procedures)},[procedures])
  useEffect(()=>saveUsers(users),[users])
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

  const onSaveUser=data=>{
    const isNew=!data.id
    if(isNew&&users.some(u=>u.username===data.username)){notify('Ya existe un usuario con ese nombre de usuario.','error');return null}
    const id=data.id||`user-${Date.now()}`
    const user={id,username:data.username.trim(),password:data.password,fullName:data.fullName.trim(),role:data.role,office:data.office||null,dni:data.dni||'',codigo:data.codigo||'',anioIngreso:data.anioIngreso||'',carrera:data.carrera||'',active:data.active!==false}
    setUsers(curr=>isNew?[...curr,user]:curr.map(u=>u.id===id?user:u))
    if(currentUser?.id===id)setCurrentUser(user)
    notify(isNew?'Usuario creado':'Usuario actualizado')
    return id
  }
  const onDeleteUser=id=>{
    if(!confirm('¿Eliminar este usuario?'))return
    setUsers(curr=>curr.filter(u=>u.id!==id))
    if(currentUser?.id===id)setCurrentUser(null)
    notify('Usuario eliminado')
  }
  const onResetPassword=(id,newPassword)=>{setUsers(curr=>curr.map(u=>u.id===id?{...u,password:newPassword}:u));notify('Contraseña actualizada')}
  const onToggleUserActive=id=>{setUsers(curr=>curr.map(u=>u.id===id?{...u,active:!(u.active!==false)}:u));notify('Estado del usuario actualizado')}
  const onImportStudents=text=>{
    const {rows,errors}=parseStudentsCsv(text)
    const skipped=[...errors]
    const created=[]
    const existingCodes=new Set(users.map(u=>u.username))
    rows.forEach(r=>{
      if(existingCodes.has(r.codigo)){skipped.push(`Código ${r.codigo} ya existe, se omitió.`);return}
      const user={id:`user-${r.codigo}-${Date.now()}`,username:r.codigo,password:r.dni,fullName:r.fullName,role:'estudiante',office:null,dni:r.dni,codigo:r.codigo,anioIngreso:r.anioIngreso,carrera:r.carrera,active:true}
      created.push(user);existingCodes.add(r.codigo)
    })
    if(created.length)setUsers(curr=>[...curr,...created])
    notify(created.length?`${created.length} estudiante(s) importados`:'No se importó ningún estudiante',created.length?'success':'error')
    return {created,skipped}
  }

  const reset=()=>{if(!confirm('¿Restaurar todos los datos del prototipo?'))return;const r=resetAll();setItems(r.expedientes);setWorkflows(r.workflows);setOffices(r.offices);setProcedures(r.procedures);setUsers(r.users);setCurrentUser(null);setProfileId('admin');setActiveView('control');notify('Prototipo restaurado')}

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
    if(profileId==='estudiante'||profileId==='docente') return items.filter(x=>(currentUser?x.ownerUserId===currentUser.id:x.ownerProfile===profileId)&&x.estado==='OBSERVADO').map(x=>`${x.numero?`EXP ${x.numero}`:x.tracking} requiere subsanación`)
    return []
  },[items,profileId,officeId,currentUser])

  let content
  if(profileId==='estudiante'||profileId==='docente') content=activeView==='tracking'?<TrackingView items={items}/>:<ApplicantPortalView profileId={profileId} items={items} procedures={procedures} currentUser={currentUser} onCreateVirtual={onCreateVirtual} onCorrect={onCorrect}/>
  else if(profileId==='secretaria') content=activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<SecretariaWorkbenchView items={items} procedures={procedures} onRegisterVirtual={onRegisterVirtual} onCreatePhysical={onCreatePhysical} onFinalize={onFinalize}/>
  else if(profileId==='direccion') content=activeView==='tracking'?<TrackingView items={items}/>:<DireccionWorkbenchView items={items} workflows={workflows} offices={offices} onProveido={onProveido}/>
  else if(profileId==='oficina') content=activeView==='tracking'?<TrackingView items={items}/>:<OfficeWorkbenchView officeId={officeId} items={items} onObserve={onObserve} onComplete={onComplete}/>
  else content=activeView==='workflow'?<WorkflowAdminView workflows={workflows} offices={offices} procedures={procedures} onPublish={onPublishWorkflow} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure}/>:activeView==='catalog'?<CatalogAdminView offices={offices} procedures={procedures} users={users} onSaveOffice={onSaveOffice} onDeleteOffice={onDeleteOffice} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure} onSaveUser={onSaveUser} onDeleteUser={onDeleteUser} onResetPassword={onResetPassword} onToggleUserActive={onToggleUserActive} onImportStudents={onImportStudents}/>:activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<AdminControlView items={items} offices={offices} setActiveView={setActiveView}/>

  const login=(id)=>{setCurrentUser(null);setProfileId(id);setActiveView(id==='admin'?'control':id==='estudiante'||id==='docente'?'portal':'work');setLoggedIn(true)}
  const onCredentialLogin=(username,password)=>{
    const user=authenticate(users,username,password)
    if(!user)return false
    setCurrentUser(user);setProfileId(user.role);if(user.office)setOfficeId(user.office)
    setActiveView(user.role==='admin'?'control':user.role==='estudiante'||user.role==='docente'?'portal':'work')
    setLoggedIn(true)
    return true
  }
  const onLogout=()=>{setLoggedIn(false);setCurrentUser(null)}
  if(!loggedIn)return <LoginView onLogin={login} onCredentialLogin={onCredentialLogin}/>
  return <><AppShell profileId={profileId} setProfileId={setProfileId} officeId={officeId} setOfficeId={setOfficeId} offices={offices} currentUser={currentUser} activeView={activeView} setActiveView={setActiveView} alerts={alerts} onReset={reset} onLogout={onLogout}>{content}</AppShell><Toast message={toast.message} type={toast.type}/></>
}
