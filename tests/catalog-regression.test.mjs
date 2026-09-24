import test from 'node:test'
import assert from 'node:assert/strict'
import { loadProcedures, loadExpedientes, loadWorkflows, loadHolidays, saveHolidays } from '../src/repositories/prototypeRepository.js'
import { requirementSatisfied, requirementIncluded, captureProcedure } from '../src/models/procedure.js'
import { DEFAULT_PROCEDURES, HOLIDAYS, setHolidaysCatalog } from '../src/data/catalogs.js'
import { slaInfo, addWorkdays, countWorkdays } from '../src/workflowEngine.js'

function storage(values={}){
  const data=new Map(Object.entries(values).map(([k,v])=>[k,JSON.stringify(v)]))
  globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}
}

test('migration preserves legacy procedures, custom requirements and historical terms',()=>{
  const old=[{id:'diploma_egresado',name:'Mi diploma',monto:150,sla:7,requires:'Mi documento',route:['biblioteca']},
    {id:'const_biblioteca',monto:0,sla:4,requires:'FUT + Documento personalizado',route:['biblioteca']}]
  storage({'arib-master-procedures-v1':old,'arib-master-expedientes-v1':[{procedureId:'diploma_egresado'}]})
  const catalog=loadProcedures()
  assert.equal(catalog.find(p=>p.id==='diploma_egresado').monto,150)
  const library=catalog.find(p=>p.id==='const_biblioteca')
  assert.equal(library.tariffStatus,'free')
  assert.equal(library.source,'')
  assert.equal(library.requirementsList[1].label,'Documento personalizado')
  assert.deepEqual(library.route,['biblioteca'])
  const exp=loadExpedientes()[0]
  assert.equal(exp.procedureSnapshot.monto,150)
  assert.equal(exp.procedureSnapshot.sla,7)
  catalog[0].monto=900
  assert.equal(exp.procedureSnapshot.monto,150)
  storage({'arib-master-procedures-v1':catalog})
  assert.deepEqual(loadProcedures(),catalog)
})

test('migration preserves saved route versions, notes and legacy workflows',()=>{
  const wf={const_biblioteca:{version:1,route:['biblioteca'],note:'Personalizada'},diploma_egresado:{version:8,route:['biblioteca']}}
  storage({'arib-master-workflows-v1':wf})
  const result=loadWorkflows()
  assert.deepEqual(result.const_biblioteca,wf.const_biblioteca)
  assert.deepEqual(result.diploma_egresado,wf.diploma_egresado)
})

test('existing snapshots are never overwritten',()=>{
  const snapshot={id:'const_biblioteca',monto:17,sla:9,requires:'Original'}
  storage({'arib-master-expedientes-v1':[{procedureId:'const_biblioteca',procedureSnapshot:snapshot}]})
  assert.deepEqual(loadExpedientes()[0].procedureSnapshot,snapshot)
})

test('optional and conditional documents respect applicability and exclude empty attachments',()=>{
  const req={type:'document',checked:false,url:''}
  assert.equal(requirementSatisfied({...req,required:true}),false)
  assert.equal(requirementSatisfied({...req,required:false}),true)
  assert.equal(requirementSatisfied({...req,required:'conditional',applies:null}),false)
  assert.equal(requirementSatisfied({...req,required:'conditional',applies:false}),true)
  assert.equal(requirementSatisfied({...req,required:'conditional',applies:true}),false)
  const submitted={...req,required:'conditional',applies:true,checked:true,url:'https://example.test/file'}
  assert.equal(requirementSatisfied(submitted),true)
  assert.equal(requirementIncluded(submitted),true)
  assert.equal(requirementIncluded({...submitted,applies:false}),false)
  assert.equal(requirementIncluded({...req,required:false}),false)
  assert.equal(requirementSatisfied({...req,type:'form',required:true,checked:true}),true)
})

test('deadline is the end of the last workday and remaining days ignore time of day',()=>{
  const exp={fecha:'21/09/2026',procedureSnapshot:{sla:2},estado:'EN_DIRECCION'}
  assert.equal(slaInfo(exp,new Date(2026,8,21,12)).daysLeft,2)
  assert.equal(slaInfo(exp,new Date(2026,8,22,12)).daysLeft,1)
  const last=slaInfo(exp,new Date(2026,8,23,23,59))
  assert.equal(last.daysLeft,0)
  assert.equal(last.overdue,false)
  assert.equal(slaInfo(exp,new Date(2026,8,24,0)).overdue,true)
  assert.equal(countWorkdays(new Date(2026,8,22,18),new Date(2026,8,23,8)),1)
})

test('calendar skips weekends and configured holidays',()=>{
  const previous=HOLIDAYS
  try{
    setHolidaysCatalog([{date:'2026-09-28',name:'Prueba'}])
    assert.equal(addWorkdays(new Date(2026,8,25),1).getDate(),29)
    assert.equal(addWorkdays(new Date(2026,8,25),0).getDate(),25)
  }finally{setHolidaysCatalog(previous)}
})

test('deleted holidays remain deleted after saving and reloading',()=>{
  storage()
  assert.ok(loadHolidays().length>0)
  saveHolidays([])
  assert.deepEqual(loadHolidays(),[])
  saveHolidays([{date:'2026-09-21',name:'Local'}])
  assert.deepEqual(loadHolidays(),[{date:'2026-09-21',name:'Local'}])
})

test('unconfirmed syllabi default is disabled without changing old case terms',()=>{
  const def=DEFAULT_PROCEDURES.find(p=>p.id==='copia_silabos')
  assert.equal(def.active,false)
  assert.equal(def.sla,null)
  const old={...def,active:true,sla:1}
  storage({'arib-master-procedures-v1':[old],'arib-master-expedientes-v1':[{procedureId:old.id}]})
  assert.equal(loadProcedures().find(p=>p.id===old.id).active,false)
  assert.equal(loadExpedientes()[0].procedureSnapshot.sla,1)
  const custom={...old,sla:6,verificationStatus:'confirmed'}
  storage({'arib-master-procedures-v1':[custom]})
  assert.equal(loadProcedures().find(p=>p.id===old.id).sla,6)
  const snap=captureProcedure(custom)
  custom.requires='Changed'
  assert.notEqual(snap.requires,custom.requires)
})
