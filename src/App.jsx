import React,{Suspense,lazy,useEffect,useMemo,useState} from 'react'
import AppShell from './components/AppShell'
import { Toast } from './components/ui'
import ConfirmModal from './components/ConfirmModal'
import ApplicantPortalView from './views/ApplicantPortalView'
import SecretariaWorkbenchView from './views/SecretariaWorkbenchView'
import DireccionWorkbenchView from './views/DireccionWorkbenchView'
import OfficeWorkbenchView from './views/OfficeWorkbenchView'
import TrackingView from './views/TrackingView'
import LoginView from './views/LoginView'
// Vistas de uso exclusivo o mayormente administrativo: se cargan bajo demanda para que un
// estudiante/docente/oficina no descargue nunca el panel admin ni el diseñador de rutas
// (que carga @xyflow/react, la dependencia más pesada del proyecto).
const AdminOfficeOperationsView=lazy(()=>import('./views/AdminOfficeOperationsView'))
const AdminControlView=lazy(()=>import('./views/AdminControlView'))
const WorkflowAdminView=lazy(()=>import('./views/WorkflowAdminView'))
const CatalogAdminView=lazy(()=>import('./views/CatalogAdminView'))
const BookAuditView=lazy(()=>import('./views/BookAuditView'))
const CashReportView=lazy(()=>import('./views/CashReportView'))
import { slugify, setOfficesCatalog, setProceduresCatalog, setRolePermissionsCatalog, setOfficePermissionsCatalog, setPaymentInfoCatalog, setHolidaysCatalog, officeName, procedureById, procedureForExpediente, roleViews, rolePerms, officeViews, officePerms, roleLabel, PROFILES } from './data/catalogs'
import { parseStudentsCsv } from './data/userImport'
import { loadExpedientes,saveExpedientes,loadWorkflows,saveWorkflows,loadOffices,saveOffices,loadProcedures,saveProcedures,loadUsers,saveUsers,loadRolePermissions,saveRolePermissions,loadOfficePermissions,saveOfficePermissions,loadPaymentInfo,savePaymentInfo,loadHolidays,saveHolidays,loadAuditLog,saveAuditLog,loadSession,saveSession,clearSession,resetAll,nextNumero } from './repositories/prototypeRepository'
import { createVirtual,registerVirtual,createPhysical,issueProveido,observeAtOffice,correctObservation,completeOfficeStep,finalizeCase,validateWorkflowRoute,validateRolePermissions,validateOfficePermissions,slaInfo,canDeleteOffice,canDeleteProcedure,authenticate,authenticateByEmail,redirectToOffice,registerPayment,editPayment } from './workflowEngine'

const today=()=>new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())
const time=()=>new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false})

export default function App(){
  const [items,setItems]=useState(()=>loadExpedientes()),[workflows,setWorkflows]=useState(()=>loadWorkflows()),[toast,setToast]=useState({message:'',type:'success'})
  const [offices,setOffices]=useState(()=>loadOffices()),[procedures,setProcedures]=useState(()=>loadProcedures()),[users,setUsers]=useState(()=>loadUsers())
  const [rolePermissions,setRolePermissions]=useState(()=>loadRolePermissions())
  const [officePermissions,setOfficePermissions]=useState(()=>loadOfficePermissions())
  const [paymentInfo,setPaymentInfo]=useState(()=>loadPaymentInfo())
  const [holidays,setHolidays]=useState(()=>loadHolidays())
  const [auditLog,setAuditLog]=useState(()=>loadAuditLog())
  const initialSession=loadSession()
  const [loggedIn,setLoggedIn]=useState(()=>!!initialSession?.loggedIn)
  const [currentUser,setCurrentUser]=useState(()=>{
    if(!initialSession?.currentUserId)return null
    return loadUsers().find(u=>u.id===initialSession.currentUserId)||null
  })
  const [profileId,setProfileId]=useState(()=>initialSession?.profileId||'admin')
  const [officeId,setOfficeId]=useState(()=>initialSession?.officeId||'biblioteca')
  const [activeView,setActiveView]=useState(()=>initialSession?.activeView||'control')
  const [confirmState,setConfirmState]=useState(null)
  useEffect(()=>saveExpedientes(items),[items]);useEffect(()=>saveWorkflows(workflows),[workflows])
  useEffect(()=>{saveOffices(offices);setOfficesCatalog(offices)},[offices])
  useEffect(()=>{saveProcedures(procedures);setProceduresCatalog(procedures)},[procedures])
  useEffect(()=>saveUsers(users),[users])
  useEffect(()=>{saveRolePermissions(rolePermissions);setRolePermissionsCatalog(rolePermissions)},[rolePermissions])
  useEffect(()=>{saveOfficePermissions(officePermissions);setOfficePermissionsCatalog(officePermissions)},[officePermissions])
  useEffect(()=>{savePaymentInfo(paymentInfo);setPaymentInfoCatalog(paymentInfo)},[paymentInfo])
  useEffect(()=>{saveHolidays(holidays);setHolidaysCatalog(holidays)},[holidays])
  useEffect(()=>saveAuditLog(auditLog),[auditLog])
  useEffect(()=>{
    if(loggedIn)saveSession({loggedIn:true,profileId,officeId,currentUserId:currentUser?.id||null,activeView})
    else clearSession()
  },[loggedIn,profileId,officeId,currentUser,activeView])
  const notify=(message,type='success')=>{setToast({message,type});clearTimeout(window.__aribToast);window.__aribToast=setTimeout(()=>setToast({message:'',type}),2600)}
  const askConfirm=(message,onConfirm,opts={})=>setConfirmState({message,onConfirm,confirmLabel:opts.confirmLabel||'Confirmar',danger:opts.danger!==false})
  const logAction=(action,detail)=>setAuditLog(curr=>[{time:`${today()} ${time()}`,actor:currentUser?.fullName||'Administrador',action,detail},...curr])
  // Quién realmente hizo la acción sobre un expediente, para el historial/trazabilidad:
  // nombre real + cargo si hay una cuenta real detrás, o el perfil de demostración si no.
  const actorLabel=()=>currentUser?`${currentUser.fullName} (${roleLabel(currentUser)})`:(PROFILES.find(p=>p.id===profileId)?.label||profileId)
  const update=(id,fn)=>{
    const target=items.find(x=>x.id===id)
    if(!target)return null
    let result
    try{result=fn(target)}catch(err){notify(err.message,'error');return null}
    setItems(curr=>curr.map(x=>x.id===id?result:x))
    return result
  }
  const onCreateVirtual=data=>{const n=nextNumero(items);try{const exp=createVirtual({...data,fecha:today(),hora:time()},n,time(),actorLabel());setItems(c=>[exp,...c]);notify(`Solicitud enviada. N.° de expediente ${n}`);return exp}catch(err){notify(err.message,'error');return null}}
  const onRegisterVirtual=exp=>{const result=update(exp.id,x=>registerVirtual(x,time(),actorLabel()));if(result)notify(`Expediente ${result.numero} validado y enviado a Dirección`);return result}
  const onCreatePhysical=(data,origin='secretaria')=>{const n=nextNumero(items);try{const exp=createPhysical({...data,fecha:today(),hora:time()},n,time(),actorLabel(),origin);setItems(c=>[exp,...c]);notify(origin==='office'?`Expediente ${n} iniciado por la oficina y remitido a Dirección`:`Expediente físico ${n} registrado y remitido a Dirección`);return exp}catch(err){notify(err.message,'error');return null}}
  const onProveido=(exp,payload)=>{update(exp.id,x=>issueProveido(x,payload,time(),actorLabel()));notify(`Proveído emitido. Ruta activada para EXP ${exp.numero}`)}
  const onObserve=(exp,payload)=>{update(exp.id,x=>observeAtOffice(x,payload,time(),actorLabel()));notify(`Observación enviada al solicitante`)}
  const onCorrect=(exp,payload)=>{update(exp.id,x=>correctObservation(x,payload,time(),actorLabel()));notify(`Subsanación registrada y devuelta a la oficina observadora`)}
  const onComplete=(exp,payload)=>{const result=update(exp.id,x=>completeOfficeStep(x,payload,time(),actorLabel()));if(result)notify(result.estado==='RESPUESTA_MESA'?'Ruta completada; expediente devuelto a Mesa de Partes':`Paso completado; expediente enviado al siguiente punto`)}
  const onFinalize=exp=>{update(exp.id,x=>finalizeCase(x,time(),actorLabel()));notify(`EXP ${exp.numero} finalizado`)}
  const onRedirect=(exp,payload)=>{update(exp.id,x=>redirectToOffice(x,payload,time(),actorLabel()));notify(`Expediente redirigido a otra oficina`)}
  const onRegisterPayment=(exp,payload)=>{const result=update(exp.id,x=>registerPayment(x,payload,time(),actorLabel()));if(result)notify(`Pago de S/ ${Number(payload.monto).toFixed(2)} registrado para EXP ${result.numero}`);return result}
  const onEditPayment=(exp,payload)=>{const montoAnterior=Number(exp.pago?.monto);const result=update(exp.id,x=>editPayment(x,payload,time(),actorLabel()));if(result){notify(`Monto corregido de S/ ${montoAnterior.toFixed(2)} a S/ ${Number(payload.monto).toFixed(2)} en EXP ${result.numero}`);logAction('Pago corregido',`EXP ${result.numero}: S/ ${montoAnterior.toFixed(2)} → S/ ${Number(payload.monto).toFixed(2)}`)}return result}
  const onPublishWorkflow=(procedureId,route)=>{
    const nextVersion=(workflows[procedureId]?.version||0)+1
    setWorkflows(w=>({...w,[procedureId]:{...(w[procedureId]||{}),route:[...route],version:nextVersion,status:'PUBLICADO',updatedAt:'Ahora'}}))
    notify(`Ruta v${nextVersion} de "${procedureById(procedureId)?.name||procedureId}" publicada correctamente`)
  }

  const onSaveOffice=data=>{
    const isNew=!data.id
    const id=data.id||slugify(data.name)
    if(isNew&&offices.some(o=>o.id===id)){notify('Ya existe una oficina con un nombre muy similar.','error');return}
    const office={id,name:data.name.trim(),short:(data.short||'').trim().toUpperCase()||id.slice(0,3).toUpperCase(),color:data.color||'#0788d1',roleTitle:(data.roleTitle||'').trim()||'Encargado',note:(data.note||'').trim(),provisional:!!data.provisional}
    setOffices(curr=>isNew?[...curr,office]:curr.map(o=>o.id===id?office:o))
    logAction(isNew?'Oficina creada':'Oficina actualizada',office.name)
    notify(isNew?'Oficina creada':'Oficina actualizada')
  }
  const onDeleteOffice=id=>{
    const err=canDeleteOffice(id,{items,workflows})
    if(err){notify(err,'error');return}
    const officeNameToDelete=offices.find(o=>o.id===id)?.name||id
    askConfirm('¿Eliminar esta oficina? Esta acción no se puede deshacer.',()=>{
      setOffices(curr=>curr.filter(o=>o.id!==id))
      logAction('Oficina eliminada',officeNameToDelete)
      notify('Oficina eliminada')
      setConfirmState(null)
    })
  }
  const onSaveProcedure=data=>{
    const isNew=!data.id
    const id=data.id||slugify(data.name)
    if(isNew){
      const errs=validateWorkflowRoute(data.route,offices)
      if(errs.length){notify(errs[0],'error');return null}
      if(procedures.some(p=>p.id===id)){notify('Ya existe un trámite con un nombre muy similar.','error');return null}
    }
    const proc={...procedures.find(p=>p.id===id),active:data.active!==false,source:data.source?.trim()||'',validFrom:data.validFrom||'',verificationStatus:data.verificationStatus||'pending',tariffStatus:data.tariffStatus||'fixed',id,name:data.name.trim(),category:data.category?.trim()||'General',requires:data.requires?.trim()||'—',sla:data.sla,route:data.route,monto:data.tariffStatus==='pending'?null:data.tariffStatus==='free'?0:Number(data.monto)}
    if(proc.tariffStatus!=='pending'&&(!Number.isFinite(proc.monto)||proc.monto<0||(proc.tariffStatus==='fixed'&&proc.monto<=0))){notify('Ingresa una tarifa válida.','error');return null}
    setProcedures(curr=>isNew?[...curr,proc]:curr.map(p=>p.id===id?proc:p))
    if(isNew)setWorkflows(w=>({...w,[id]:{version:1,status:'PUBLICADO',route:[...data.route],updatedAt:'Ahora'}}))
    logAction(isNew?'Trámite creado':'Trámite actualizado',proc.name)
    notify(isNew?'Trámite creado':'Trámite actualizado')
    return id
  }
  const onDeleteProcedure=(id,onSuccess)=>{
    const err=canDeleteProcedure(id,{items})
    if(err){notify(err,'error');return}
    const procedureNameToDelete=procedures.find(p=>p.id===id)?.name||id
    askConfirm('¿Eliminar este trámite? Esta acción no se puede deshacer.',()=>{
      setProcedures(curr=>curr.filter(p=>p.id!==id))
      setWorkflows(w=>{const n={...w};delete n[id];return n})
      logAction('Trámite eliminado',procedureNameToDelete)
      notify('Trámite eliminado')
      setConfirmState(null)
      onSuccess?.()
    })
  }

  const onSaveUser=data=>{
    const isNew=!data.id
    if(isNew&&users.some(u=>u.username===data.username)){notify('Ya existe un usuario con ese nombre de usuario.','error');return null}
    const id=data.id||`user-${Date.now()}`
    const user={id,username:data.username.trim(),password:data.password,email:(data.email||`${data.username}@arib.edu.pe`).trim(),fullName:data.fullName.trim(),role:data.role,office:data.office||null,dni:data.dni||'',codigo:data.codigo||'',anioIngreso:data.anioIngreso||'',carrera:data.carrera||'',active:data.active!==false}
    setUsers(curr=>isNew?[...curr,user]:curr.map(u=>u.id===id?user:u))
    if(currentUser?.id===id)setCurrentUser(user)
    logAction(isNew?'Usuario creado':'Usuario actualizado',`${user.fullName} (${user.username})`)
    notify(isNew?'Usuario creado':'Usuario actualizado')
    return id
  }
  const onDeleteUser=id=>{
    const userToDelete=users.find(u=>u.id===id)
    askConfirm('¿Eliminar este usuario? Perderá acceso al sistema de inmediato.',()=>{
      setUsers(curr=>curr.filter(u=>u.id!==id))
      if(currentUser?.id===id)setCurrentUser(null)
      logAction('Usuario eliminado',userToDelete?`${userToDelete.fullName} (${userToDelete.username})`:id)
      notify('Usuario eliminado')
      setConfirmState(null)
    })
  }
  const onResetPassword=(id,newPassword)=>{
    const target=users.find(u=>u.id===id)
    setUsers(curr=>curr.map(u=>u.id===id?{...u,password:newPassword}:u))
    logAction('Contraseña restablecida',target?`${target.fullName} (${target.username})`:id)
    notify('Contraseña actualizada')
  }
  const onChangeOwnPassword=(currentPassword,newPassword)=>{
    if(!currentUser||currentUser.password!==currentPassword)return false
    setUsers(curr=>curr.map(u=>u.id===currentUser.id?{...u,password:newPassword}:u))
    setCurrentUser(u=>({...u,password:newPassword}))
    notify('Tu contraseña se actualizó correctamente')
    return true
  }
  const onToggleUserActive=id=>{
    const target=users.find(u=>u.id===id)
    const willBeActive=!(target?.active!==false)
    setUsers(curr=>curr.map(u=>u.id===id?{...u,active:!(u.active!==false)}:u))
    logAction(willBeActive?'Usuario reactivado':'Usuario desactivado',target?`${target.fullName} (${target.username})`:id)
    notify('Estado del usuario actualizado')
  }
  const onBulkSetActive=(ids,active)=>{
    if(!ids?.length)return
    setUsers(curr=>curr.map(u=>ids.includes(u.id)?{...u,active}:u))
    logAction(active?'Usuarios reactivados (masivo)':'Usuarios desactivados (masivo)',`${ids.length} cuenta(s)`)
    notify(`${ids.length} usuario(s) ${active?'activado(s)':'desactivado(s)'}`)
  }
  const onImportStudents=text=>{
    const {rows,errors}=parseStudentsCsv(text)
    const skipped=[...errors]
    const created=[]
    const existingCodes=new Set(users.map(u=>u.username))
    rows.forEach(r=>{
      if(existingCodes.has(r.codigo)){skipped.push(`Código ${r.codigo} ya existe, se omitió.`);return}
      const user={id:`user-${r.codigo}-${Date.now()}`,username:r.codigo,password:r.dni,email:`${r.codigo}@arib.edu.pe`,fullName:r.fullName,role:'estudiante',office:null,dni:r.dni,codigo:r.codigo,anioIngreso:r.anioIngreso,carrera:r.carrera,active:true}
      created.push(user);existingCodes.add(r.codigo)
    })
    if(created.length){setUsers(curr=>[...curr,...created]);logAction('Estudiantes importados (CSV)',`${created.length} cuenta(s) creada(s)`)}
    notify(created.length?`${created.length} estudiante(s) importados`:'No se importó ningún estudiante',created.length?'success':'error')
    return {created,skipped}
  }

  const onSaveRolePermissions=(role,data)=>{
    const errs=validateRolePermissions(role,data)
    if(errs.length){notify(errs[0],'error');return false}
    setRolePermissions(curr=>({...curr,[role]:{views:[...data.views],permissions:[...data.permissions]}}))
    logAction('Permisos de rol actualizados',`${role}: ${data.views.length} vista(s), ${data.permissions.length} permiso(s)`)
    notify('Permisos del rol actualizados')
    return true
  }

  const onSaveOfficePermissions=(officeIdArg,data)=>{
    const errs=validateOfficePermissions(data)
    if(errs.length){notify(errs[0],'error');return false}
    setOfficePermissions(curr=>({...curr,[officeIdArg]:{views:[...data.views],permissions:[...data.permissions]}}))
    logAction('Permisos de oficina personalizados',`${officeName(officeIdArg)}: ${data.views.length} vista(s), ${data.permissions.length} permiso(s)`)
    notify(`Permisos de ${officeName(officeIdArg)} actualizados`)
    return true
  }
  const onResetOfficePermissions=officeIdArg=>{
    setOfficePermissions(curr=>{const next={...curr};delete next[officeIdArg];return next})
    logAction('Permisos de oficina restablecidos',`${officeName(officeIdArg)} vuelve a heredar el rol Oficina`)
    notify(`${officeName(officeIdArg)} vuelve a usar los permisos del rol Oficina`)
  }

  const onSavePaymentInfo=data=>{setPaymentInfo(data);logAction('Datos de pago institucional actualizados',data.yape||data.cuenta||'');notify('Datos de pago institucional actualizados')}
  const onSaveHolidays=list=>{setHolidays(list);logAction('Feriados actualizados',`${list.length} fecha(s)`);notify('Calendario de feriados actualizado')}

  const reset=()=>{
    askConfirm('¿Restaurar todos los datos del prototipo? Se perderá todo lo creado o modificado en esta demo.',()=>{
      const r=resetAll()
      setItems(r.expedientes);setWorkflows(r.workflows);setOffices(r.offices);setProcedures(r.procedures);setUsers(r.users);setRolePermissions(r.rolePermissions);setOfficePermissions(r.officePermissions);setPaymentInfo(r.paymentInfo);setHolidays(r.holidays);setAuditLog(r.auditLog)
      setCurrentUser(null);setProfileId('admin');setActiveView('control')
      setConfirmState(null)
      notify('Prototipo restaurado')
    },{confirmLabel:'Restaurar'})
  }

  const alerts=useMemo(()=>{
    if(profileId==='admin') return [
      ...items.filter(x=>slaInfo(x)?.overdue).map(x=>`EXP ${x.numero} vencido según SLA · en ${officeName(x.oficinaActual)}`),
      ...items.filter(x=>{const i=slaInfo(x);return i&&!i.closed&&!i.paused&&!i.overdue&&i.daysLeft<=2}).map(x=>`EXP ${x.numero} por vencer (${slaInfo(x).daysLeft}d) · en ${officeName(x.oficinaActual)}`),
      ...items.filter(x=>x.estado==='OBSERVADO').map(x=>`EXP ${x.numero} observado, esperando subsanación`),
      ...items.filter(x=>(procedureForExpediente(x)?.monto||0)>0&&x.pago?.estado!=='PAGADO'&&!['FINALIZADO','SOLICITUD_VIRTUAL'].includes(x.estado)).map(x=>`EXP ${x.numero} con pago pendiente (S/ ${Number(procedureForExpediente(x)?.monto).toFixed(2)})`),
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

  // Una oficina hereda las vistas/permisos del rol 'oficina' salvo que el Administrador
  // la haya personalizado explícitamente en officePermissions (ver catalogs.js §Permisos
  // por oficina). El resto de perfiles sigue usando el permiso por rol de siempre.
  const myViews=profileId==='oficina'?officeViews(officeId):roleViews(profileId)
  const myPermissions=profileId==='oficina'?officePerms(officeId):rolePerms(profileId)
  useEffect(()=>{
    if(!loggedIn||!myViews.length)return
    if(!myViews.includes(activeView))setActiveView(myViews[0])
  },[loggedIn,profileId,officeId,rolePermissions,officePermissions])

  let content
  if(profileId==='estudiante'||profileId==='docente') content=activeView==='tracking'?<TrackingView items={items} profileId={profileId} currentUser={currentUser}/>:<ApplicantPortalView profileId={profileId} items={items} procedures={procedures} currentUser={currentUser} permissions={myPermissions} onCreateVirtual={onCreateVirtual} onCorrect={onCorrect}/>
  else if(profileId==='secretaria') content=activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<SecretariaWorkbenchView items={items} procedures={procedures} permissions={myPermissions} onRegisterVirtual={onRegisterVirtual} onCreatePhysical={onCreatePhysical} onFinalize={onFinalize}/>
  else if(profileId==='direccion') content=activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<DireccionWorkbenchView items={items} workflows={workflows} offices={offices} permissions={myPermissions} onProveido={onProveido}/>
  else if(profileId==='oficina') content=activeView==='book'?<BookAuditView items={items}/>:activeView==='tracking'?<TrackingView items={items}/>:<OfficeWorkbenchView officeId={officeId} items={items} offices={offices} procedures={procedures} workflows={workflows} permissions={myPermissions} onObserve={onObserve} onComplete={onComplete} onRedirect={onRedirect} onRegisterPayment={onRegisterPayment} onCreatePhysical={onCreatePhysical}/>
  else content=activeView==='workflow'?<WorkflowAdminView workflows={workflows} offices={offices} procedures={procedures} onPublish={onPublishWorkflow} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure}/>:activeView==='catalog'?<CatalogAdminView offices={offices} procedures={procedures} users={users} rolePermissions={rolePermissions} officePermissions={officePermissions} paymentInfo={paymentInfo} holidays={holidays} auditLog={auditLog} onSaveOffice={onSaveOffice} onDeleteOffice={onDeleteOffice} onSaveProcedure={onSaveProcedure} onDeleteProcedure={onDeleteProcedure} onSaveUser={onSaveUser} onDeleteUser={onDeleteUser} onResetPassword={onResetPassword} onToggleUserActive={onToggleUserActive} onBulkSetActive={onBulkSetActive} onImportStudents={onImportStudents} onSaveRolePermissions={onSaveRolePermissions} onSaveOfficePermissions={onSaveOfficePermissions} onResetOfficePermissions={onResetOfficePermissions} onSavePaymentInfo={onSavePaymentInfo} onSaveHolidays={onSaveHolidays}/>:activeView==='book'?<BookAuditView items={items}/>:activeView==='caja'?<CashReportView items={items} permissions={myPermissions} onEditPayment={onEditPayment}/>:activeView==='oficinas'?<AdminOfficeOperationsView officeId={officeId} setOfficeId={setOfficeId} items={items} offices={offices} procedures={procedures} workflows={workflows} permissions={myPermissions} onObserve={onObserve} onComplete={onComplete} onRedirect={onRedirect} onRegisterPayment={onRegisterPayment} onCreatePhysical={onCreatePhysical}/>:activeView==='tracking'?<TrackingView items={items}/>:<AdminControlView items={items} offices={offices} setActiveView={setActiveView}/>

  const login=(id)=>{setCurrentUser(null);setProfileId(id);setActiveView(id==='admin'?'control':id==='estudiante'||id==='docente'?'portal':'work');setLoggedIn(true)}
  const loginAsUser=user=>{
    setCurrentUser(user);setProfileId(user.role);if(user.office)setOfficeId(user.office)
    setActiveView(user.role==='admin'?'control':user.role==='estudiante'||user.role==='docente'?'portal':'work')
    setLoggedIn(true)
  }
  const onCredentialLogin=(username,password)=>{
    const user=authenticate(users,username,password)
    if(!user)return false
    loginAsUser(user)
    return true
  }
  const onGoogleLogin=email=>{
    const user=authenticateByEmail(users,email)
    if(!user)return false
    loginAsUser(user)
    return true
  }
  const onOfficeQuickLogin=officeIdToEnter=>{
    const user=users.find(u=>u.role==='oficina'&&u.office===officeIdToEnter&&u.active!==false)
    if(!user)return false
    loginAsUser(user)
    return true
  }
  const onLogout=()=>{setLoggedIn(false);setCurrentUser(null)}
  if(!loggedIn)return <LoginView onLogin={login} onCredentialLogin={onCredentialLogin} onGoogleLogin={onGoogleLogin} offices={offices} onOfficeQuickLogin={onOfficeQuickLogin}/>
  return <><AppShell profileId={profileId} setProfileId={setProfileId} currentUser={currentUser} activeView={activeView} setActiveView={setActiveView} alerts={alerts} myViews={myViews} onReset={reset} onLogout={onLogout} onChangeOwnPassword={onChangeOwnPassword}><Suspense fallback={<div className="role-page"><p style={{color:'var(--arib-navy-light)',fontSize:13}}>Cargando módulo…</p></div>}>{content}</Suspense></AppShell><Toast message={toast.message} type={toast.type}/><ConfirmModal open={!!confirmState} message={confirmState?.message} confirmLabel={confirmState?.confirmLabel} danger={confirmState?.danger} onConfirm={confirmState?.onConfirm} onCancel={()=>setConfirmState(null)}/></>
}
