import test from 'node:test'
import assert from 'node:assert/strict'
import { createVirtual,registerVirtual,issueProveido,observeAtOffice,correctObservation,completeOfficeStep,finalizeCase,validateWorkflowRoute,slaInfo,canDeleteOffice,canDeleteProcedure,authenticate,authenticateByEmail,redirectToOffice,routeProgress,validateRolePermissions,registerPayment,requiresPayment,editPayment } from '../src/workflowEngine.js'
import { procedureById } from '../src/data/catalogs.js'

const base={procedureId:'const_biblioteca',ownerProfile:'estudiante',solicitante:'Demo',asunto:'Constancia',adjuntos:[],numeroFolios:1,fecha:'01/01/2026',hora:'08:00'}

test('todo registro pasa primero a Dirección',()=>{
 const v=createVirtual(base,6001,'08:00')
 assert.equal(v.numero,6001);assert.equal(v.tracking,'ARIB-6001')
 const r=registerVirtual(v,'08:05')
 assert.equal(r.numero,6001);assert.equal(r.estado,'EN_DIRECCION');assert.equal(r.oficinaActual,'direccion');assert.equal(r.vistoBuenoDireccion,'')
})

test('Dirección no puede emitir proveído sin ruta',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 assert.throws(()=>issueProveido(r,{proveido:'PASE',routePlan:[]},'08:10'))
})

test('Dirección activa una ruta con varias oficinas',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE SEGÚN RUTA',routePlan:['biblioteca','jefatura_academica'],routeVersion:2},'08:10')
 assert.equal(p.oficinaActual,'biblioteca');assert.equal(p.routeIndex,0);assert.equal(p.routePlan.length,2)
 const n=completeOfficeStep(p,{note:'Conforme'},'08:20')
 assert.equal(n.oficinaActual,'jefatura_academica');assert.equal(n.routeIndex,1)
})

test('observación vuelve al solicitante y subsanación retorna a la misma oficina',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10')
 const o=observeAtOffice(p,{text:'Adjunte voucher'},'08:20')
 assert.equal(o.estado,'OBSERVADO');assert.equal(o.observation.office,'tesoreria')
 const c=correctObservation(o,{files:[{name:'voucher.pdf'}]},'08:30')
 assert.equal(c.estado,'EN_OFICINA');assert.equal(c.oficinaActual,'tesoreria')
})

test('última oficina devuelve a Mesa de Partes y Secretaría finaliza',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 const a=completeOfficeStep(p,{note:'Constancia emitida',document:'constancia.pdf'},'08:20')
 assert.equal(a.estado,'RESPUESTA_MESA');assert.equal(a.oficinaActual,'mesa_partes')
 const f=finalizeCase(a,'08:30');assert.equal(f.estado,'FINALIZADO')
})

test('rutas configurables protegen los pasos obligatorios',()=>{
 assert.deepEqual(validateWorkflowRoute(['biblioteca','jefatura_academica']),[])
 assert.ok(validateWorkflowRoute(['direccion','biblioteca']).length>0)
 assert.ok(validateWorkflowRoute(['biblioteca','biblioteca']).length>0)
})

test('slaInfo calcula vencimiento a partir del SLA del trámite',()=>{
 const sla=procedureById('const_biblioteca').sla
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const info=slaInfo(r,new Date(2026,0,1))
 assert.equal(info.overdue,false)
 const overdueInfo=slaInfo(r,new Date(2026,0,1+sla+5))
 assert.equal(overdueInfo.overdue,true)
 const p=issueProveido(r,{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 const a=completeOfficeStep(p,{note:'Conforme'},'08:20')
 const f=finalizeCase(a,'08:30')
 assert.equal(slaInfo(f,new Date(2026,0,1+sla+5)).overdue,false)
})

test('no se puede eliminar una oficina u trámite en uso',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 assert.ok(canDeleteOffice('biblioteca',{items:[p],workflows:{}}))
 assert.equal(canDeleteOffice('tesoreria',{items:[p],workflows:{}}),null)
 assert.ok(canDeleteProcedure('const_biblioteca',{items:[p]}))
 assert.equal(canDeleteProcedure('cert_modular',{items:[p]}),null)
})

test('authenticate valida usuario, contraseña y estado activo',()=>{
 const users=[
   {id:'u1',username:'2023100045',password:'70223344',active:true,role:'estudiante'},
   {id:'u2',username:'inactivo',password:'123',active:false,role:'estudiante'},
 ]
 assert.equal(authenticate(users,'2023100045','70223344')?.id,'u1')
 assert.equal(authenticate(users,'2023100045','clave-mala'),null)
 assert.equal(authenticate(users,'inactivo','123'),null)
 assert.equal(authenticate(users,'no-existe','x'),null)
})

test('authenticateByEmail simula el login de Google por correo institucional',()=>{
 const users=[
   {id:'u1',email:'Maria.QA@arib.edu.pe',active:true},
   {id:'u2',email:'inactivo@arib.edu.pe',active:false},
 ]
 assert.equal(authenticateByEmail(users,'maria.qa@arib.edu.pe')?.id,'u1')
 assert.equal(authenticateByEmail(users,'inactivo@arib.edu.pe'),null)
 assert.equal(authenticateByEmail(users,'no-existe@arib.edu.pe'),null)
 assert.equal(authenticateByEmail(users,''),null)
})

test('redirectToOffice inserta una oficina fuera de ruta y conserva el resto',()=>{
 const r=registerVirtual(createVirtual(base,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['biblioteca','jefatura_academica'],routeVersion:1},'08:10')
 const red=redirectToOffice(p,{officeId:'tesoreria',note:'Requiere validar pago'},'08:15')
 assert.equal(red.oficinaActual,'tesoreria')
 assert.deepEqual(red.routePlan,['biblioteca','tesoreria','jefatura_academica'])
 assert.equal(red.routeIndex,1)
 const done=completeOfficeStep(red,{note:'Conforme'},'08:20')
 assert.equal(done.oficinaActual,'jefatura_academica')
 assert.throws(()=>redirectToOffice(p,{officeId:'biblioteca'},'08:15'))
})

test('el N.° de expediente se asigna desde el envío virtual, no al registrar',()=>{
 const v=createVirtual(base,7001,'08:00')
 assert.equal(v.numero,7001);assert.equal(v.estado,'SOLICITUD_VIRTUAL')
 assert.equal(routeProgress(v).completed,0,'Mesa de Partes no debe marcarse como completado antes de la validación de Secretaría')
 const r=registerVirtual(v,'08:05')
 assert.equal(r.numero,7001,'el número no cambia al registrar')
 assert.equal(routeProgress(r).completed,1,'tras el registro, el paso Mesa de Partes ya está completado')
})

test('Tesorería no puede completar un trámite pagado sin registrar el pago',()=>{
 const paidBase={...base,procedureId:'cert_modular'}
 const r=registerVirtual(createVirtual(paidBase,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria','jefatura_academica'],routeVersion:1},'08:10')
 assert.equal(requiresPayment(p),true)
 assert.throws(()=>completeOfficeStep(p,{note:'Conforme'},'08:20'),/pago/i)
 assert.throws(()=>registerPayment(p,{monto:0,voucher:'X'},'08:15'))
 assert.throws(()=>registerPayment(p,{monto:25,voucher:''},'08:15'))
 const paid=registerPayment(p,{monto:25,metodo:'Depósito bancario',voucher:'OP-001',fecha:'01/01/2026'},'08:15')
 assert.equal(paid.pago.estado,'PAGADO');assert.equal(paid.pago.monto,25)
 assert.equal(requiresPayment(paid),true,'el trámite sigue siendo de pago, pero ya está saldado')
 const done=completeOfficeStep(paid,{note:'Conforme'},'08:20')
 assert.equal(done.oficinaActual,'jefatura_academica')
})

test('el historial registra quién realmente hizo la acción, no solo el nombre genérico de la oficina',()=>{
 const paidBase={...base,procedureId:'cert_modular'}
 const r=registerVirtual(createVirtual(paidBase,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10','Dirección ARIB (Dirección)')
 assert.equal(p.historial.at(-1).actor,'Dirección ARIB (Dirección)')
 // Si el propio Administrador opera Tesorería como superusuario, el historial debe decir
 // que fue el Administrador, no el genérico "Tesorería".
 const paid=registerPayment(p,{monto:25,voucher:'OP-777'},'08:15','Administrador ARIB (Administrador)')
 assert.equal(paid.historial.at(-1).actor,'Administrador ARIB (Administrador)')
 assert.equal(paid.pago.registradoPor,'Administrador ARIB (Administrador)')
 // Sin actor explícito, se mantiene el comportamiento genérico de siempre (compatibilidad).
 const p2=issueProveido(registerVirtual(createVirtual(base,6002,'08:00'),'08:05'),{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 assert.equal(p2.historial.at(-1).actor,'Dirección')
})

test('editPayment permite corregir el monto de un pago ya registrado, como control adicional exclusivo del Administrador',()=>{
 const paidBase={...base,procedureId:'cert_modular'}
 const r=registerVirtual(createVirtual(paidBase,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10')
 const paid=registerPayment(p,{monto:25,voucher:'OP-999'},'08:15','Jefe de Unidad Administrativa de Tesorería (Jefe de Unidad Administrativa de Tesorería)')
 // No se puede corregir un pago que no existe.
 const sinPago=issueProveido(registerVirtual(createVirtual(base,6002,'08:00'),'08:05'),{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 assert.throws(()=>editPayment(sinPago,{monto:10},'08:20','Administrador ARIB (Administrador)'),/pago registrado/)
 // Debe rechazar montos inválidos o iguales al ya registrado.
 assert.throws(()=>editPayment(paid,{monto:0},'08:20','Administrador ARIB (Administrador)'))
 assert.throws(()=>editPayment(paid,{monto:25},'08:20','Administrador ARIB (Administrador)'),/distinto/)
 // Corrección válida: actualiza el monto, conserva quién registró el pago originalmente,
 // y deja constancia en el historial de quién corrigió y cuándo.
 const corregido=editPayment(paid,{monto:30},'08:25','Administrador ARIB (Administrador)')
 assert.equal(corregido.pago.monto,30)
 assert.equal(corregido.pago.registradoPor,'Jefe de Unidad Administrativa de Tesorería (Jefe de Unidad Administrativa de Tesorería)')
 assert.equal(corregido.pago.editadoPor,'Administrador ARIB (Administrador)')
 assert.equal(corregido.pago.editadoAt,'08:25')
 assert.equal(corregido.historial.at(-1).actor,'Administrador ARIB (Administrador)')
 assert.equal(corregido.historial.at(-1).action,'Pago corregido')
 assert.match(corregido.historial.at(-1).text,/S\/ 25\.00 a S\/ 30\.00/)
})

test('registerPayment solo se registra en Tesorería y con el expediente en atención',()=>{
 const paidBase={...base,procedureId:'cert_modular'}
 const r=registerVirtual(createVirtual(paidBase,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria','jefatura_academica'],routeVersion:1},'08:10')
 const moved=completeOfficeStep(registerPayment(p,{monto:25,voucher:'OP-002'},'08:15'),{note:'Conforme'},'08:20')
 assert.throws(()=>registerPayment(moved,{monto:25,voucher:'OP-003'},'08:25'),/Tesorería/)
 const o=observeAtOffice(issueProveido(registerVirtual(createVirtual(paidBase,6002,'08:00'),'08:05'),{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10'),{text:'Falta comprobante'},'08:20')
 assert.throws(()=>registerPayment(o,{monto:25,voucher:'OP-004'},'08:25'))
})

test('el SLA se pausa mientras hay observación o pago pendiente, y se reanuda al resolverse',()=>{
 const paidBase={...base,procedureId:'cert_modular'}
 const r=registerVirtual(createVirtual(paidBase,6001,'08:00'),'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10')
 assert.ok(p.pauseStartedAt!=null,'debe pausar el reloj al llegar a Tesorería sin pagar')
 assert.equal(slaInfo(p).paused,true)
 const paid=registerPayment(p,{monto:25,voucher:'OP-1'},'08:15')
 assert.equal(paid.pauseStartedAt,null,'debe reanudar el reloj al registrar el pago')
 assert.ok(paid.slaPausedMs>=0)
 assert.equal(slaInfo(paid).paused,false)

 const p2=issueProveido(registerVirtual(createVirtual(base,6002,'08:00'),'08:05'),{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 const o=observeAtOffice(p2,{text:'Falta firma'},'08:20')
 assert.ok(o.pauseStartedAt!=null,'debe pausar el reloj mientras está observado')
 const c=correctObservation(o,{files:[]},'08:30')
 assert.equal(c.pauseStartedAt,null,'debe reanudar el reloj tras subsanar')
})

test('validateRolePermissions exige al menos una vista y protege el acceso del admin a catálogos',()=>{
 assert.deepEqual(validateRolePermissions('secretaria',{views:['work','book'],permissions:[]}),[])
 assert.ok(validateRolePermissions('secretaria',{views:[],permissions:[]}).length>0)
 assert.ok(validateRolePermissions('admin',{views:['control','workflow'],permissions:[]}).length>0)
 assert.deepEqual(validateRolePermissions('admin',{views:['control','catalog'],permissions:[]}),[])
})
