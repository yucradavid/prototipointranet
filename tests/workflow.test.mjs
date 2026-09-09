import test from 'node:test'
import assert from 'node:assert/strict'
import { createVirtual,registerVirtual,issueProveido,observeAtOffice,correctObservation,completeOfficeStep,finalizeCase,validateWorkflowRoute,slaInfo,canDeleteOffice,canDeleteProcedure } from '../src/workflowEngine.js'
import { procedureById } from '../src/data/catalogs.js'

const base={procedureId:'const_biblioteca',ownerProfile:'estudiante',solicitante:'Demo',asunto:'Constancia',adjuntos:[],numeroFolios:1,fecha:'01/01/2026',hora:'08:00'}

test('todo registro pasa primero a Dirección',()=>{
 const v=createVirtual(base,'SOL-1','08:00')
 const r=registerVirtual(v,6001,'08:05')
 assert.equal(r.estado,'EN_DIRECCION');assert.equal(r.oficinaActual,'direccion');assert.equal(r.vistoBuenoDireccion,'')
})

test('Dirección no puede emitir proveído sin ruta',()=>{
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
 assert.throws(()=>issueProveido(r,{proveido:'PASE',routePlan:[]},'08:10'))
})

test('Dirección activa una ruta con varias oficinas',()=>{
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
 const p=issueProveido(r,{proveido:'PASE SEGÚN RUTA',routePlan:['biblioteca','jefatura_academica'],routeVersion:2},'08:10')
 assert.equal(p.oficinaActual,'biblioteca');assert.equal(p.routeIndex,0);assert.equal(p.routePlan.length,2)
 const n=completeOfficeStep(p,{note:'Conforme'},'08:20')
 assert.equal(n.oficinaActual,'jefatura_academica');assert.equal(n.routeIndex,1)
})

test('observación vuelve al solicitante y subsanación retorna a la misma oficina',()=>{
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['tesoreria'],routeVersion:1},'08:10')
 const o=observeAtOffice(p,{text:'Adjunte voucher'},'08:20')
 assert.equal(o.estado,'OBSERVADO');assert.equal(o.observation.office,'tesoreria')
 const c=correctObservation(o,{files:[{name:'voucher.pdf'}]},'08:30')
 assert.equal(c.estado,'EN_OFICINA');assert.equal(c.oficinaActual,'tesoreria')
})

test('última oficina devuelve a Mesa de Partes y Secretaría finaliza',()=>{
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
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
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
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
 const r=registerVirtual(createVirtual(base,'SOL-1','08:00'),6001,'08:05')
 const p=issueProveido(r,{proveido:'PASE',routePlan:['biblioteca'],routeVersion:1},'08:10')
 assert.ok(canDeleteOffice('biblioteca',{items:[p],workflows:{}}))
 assert.equal(canDeleteOffice('tesoreria',{items:[p],workflows:{}}),null)
 assert.ok(canDeleteProcedure('const_biblioteca',{items:[p]}))
 assert.equal(canDeleteProcedure('cert_modular',{items:[p]}),null)
})
