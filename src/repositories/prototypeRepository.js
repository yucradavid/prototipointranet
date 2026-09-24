import { seedExpedientes, seedWorkflowConfigs, seedUsers } from '../data/seed.js'
import { DEFAULT_OFFICES, DEFAULT_PROCEDURES, DEFAULT_ROLE_PERMISSIONS, DEFAULT_PAYMENT_INFO, DEFAULT_HOLIDAYS } from '../data/catalogs.js'
import { normalizeProcedure, preserveProcedureTerms } from '../models/procedure.js'
const K_EXP='arib-master-expedientes-v1'
const K_WF='arib-master-workflows-v1'
const K_OFFICES='arib-master-offices-v1'
const K_PROCEDURES='arib-master-procedures-v1'
const K_USERS='arib-master-users-v1'
const K_ROLE_PERMISSIONS='arib-master-role-permissions-v1'
const K_PAYMENT_INFO='arib-master-payment-info-v1'
const K_AUDIT_LOG='arib-master-audit-log-v1'
const K_SESSION='arib-master-session-v1'
const K_HOLIDAYS='arib-master-holidays-v1'
const MAX_AUDIT_LOG=200
const clone=x=>JSON.parse(JSON.stringify(x))
export function loadExpedientes(){
  let items
  try{items=JSON.parse(localStorage.getItem(K_EXP))||clone(seedExpedientes)}catch{items=clone(seedExpedientes)}
  let original
  try{original=JSON.parse(localStorage.getItem(K_PROCEDURES))}catch{}
  return preserveProcedureTerms(items,original || DEFAULT_PROCEDURES)
}
export function saveExpedientes(v){try{localStorage.setItem(K_EXP,JSON.stringify(v))}catch{}}
export function loadWorkflows(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_WF))
    if(!stored) return clone(seedWorkflowConfigs)
    // A saved route and its version are one unit. Never relabel an old route
    // with the version or institutional note of a different seed route.
    const merged={...clone(seedWorkflowConfigs),...stored}
    return merged
  }catch{return clone(seedWorkflowConfigs)}
}
export function saveWorkflows(v){try{localStorage.setItem(K_WF,JSON.stringify(v))}catch{}}
export function loadOffices(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_OFFICES))
    if(!stored)return clone(DEFAULT_OFFICES)
    // Migración 1: agregar roleTitle si no existía (pre-v1).
    // Migración 2: corregir "Administrador" intermedio en Tesorería.
    // Migración 3: agregar campo note y flag provisional a oficinas existentes.
    // Migración 4: incorporar oficinas provisionales nuevas (fedatario, coordinacion_academica,
    //              formacion_continua, comision_admision) sin borrar personalizaciones del admin.
    const storedById=Object.fromEntries(stored.map(o=>[o.id,o]))
    const merged=DEFAULT_OFFICES.map(def=>{
      const prev=storedById[def.id]
      if(!prev){
        // Oficina nueva en DEFAULT_OFFICES: incorporar
        return clone(def)
      }
      // Migrar campos nuevos que no existían, conservar personalizaciones del admin
      const withDefault={
        roleTitle: DEFAULT_OFFICES.find(d=>d.id===def.id)?.roleTitle||'Encargado',
        ...prev,
        // note y provisional: si el admin no los tenía, tomar del código
        note: prev.note || def.note || '',
        provisional: prev.provisional !== undefined ? prev.provisional : (def.provisional || false),
      }
      if(withDefault.id==='tesoreria'&&withDefault.roleTitle==='Administrador')
        withDefault.roleTitle='Jefe de Unidad Administrativa'
      return withDefault
    })
    // Conservar oficinas extra creadas por el admin que no están en DEFAULT_OFFICES
    const defaultIds=new Set(DEFAULT_OFFICES.map(d=>d.id))
    const extras=stored.filter(o=>!defaultIds.has(o.id))
    return [...merged,...extras]
  }catch{return clone(DEFAULT_OFFICES)}
}
export function saveOffices(v){try{localStorage.setItem(K_OFFICES,JSON.stringify(v))}catch{}}
export function loadProcedures(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_PROCEDURES))
    if(!stored)return clone(DEFAULT_PROCEDURES).map(normalizeProcedure)
    // Preserve complete saved records, including legacy text requirements.
    // New defaults are additions, not implicit replacements of local decisions.
    const ids=new Set(stored.map(p=>p.id))
    return [...stored.map(p=>{
      // Retire the known unverified default without rewriting custom variants.
      if(p.id==='copia_silabos' && p.sla===1 && p.monto===5 &&
        p.source==='TUSNE 2026 · filas 192–193' && p.verificationStatus==='pending' &&
        JSON.stringify(p.route)===JSON.stringify(['tesoreria','unidad_academica'])){
        return normalizeProcedure({...p,active:false,sla:null})
      }
      return normalizeProcedure(p)
    }),...clone(DEFAULT_PROCEDURES).filter(p=>!ids.has(p.id)).map(normalizeProcedure)]

  }catch{return clone(DEFAULT_PROCEDURES).map(normalizeProcedure)}
}
export function saveProcedures(v){try{localStorage.setItem(K_PROCEDURES,JSON.stringify(v))}catch{}}
export function loadUsers(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_USERS))
    if(!stored)return clone(seedUsers)
    // Migración: navegadores con el usuario demo de Tesorería guardado antes de fijar su
    // cargo real ("Jefe de Unidad Administrativa") seguirían mostrando un nombre viejo
    // ("Encargado de Tesorería" o el intermedio "Administrador de Tesorería"). Solo se
    // corrige si nadie le puso ya un nombre real a esa cuenta.
    const OLD_TESORERIA_NAMES=['Encargado de Tesorería','Administrador de Tesorería']
    return stored.map(u=>u.id==='u-tes1'&&OLD_TESORERIA_NAMES.includes(u.fullName)?{...u,fullName:'Jefe de Unidad Administrativa de Tesorería'}:u)
  }catch{return clone(seedUsers)}
}
export function saveUsers(v){try{localStorage.setItem(K_USERS,JSON.stringify(v))}catch{}}
export function loadRolePermissions(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_ROLE_PERMISSIONS))
    if(!stored)return clone(DEFAULT_ROLE_PERMISSIONS)
    // Migración: navegadores con datos guardados antes de agregar la vista "Caja y pagos"
    // no la tendrían en su configuración de admin ya persistida; se incorpora aquí una sola vez.
    if(stored.admin&&!stored.admin.views.includes('caja'))stored.admin.views=[...stored.admin.views,'caja']
    // Migración: navegadores con datos guardados antes de separar "Registrar pagos" como
    // permiso propio no lo tendrían en el rol de oficina; sin esto, Tesorería perdería
    // de golpe la capacidad de registrar pagos que ya tenía.
    if(stored.oficina&&!stored.oficina.permissions.includes('case.pay'))stored.oficina.permissions=[...stored.oficina.permissions,'case.pay']
    // Migración: navegadores con datos guardados antes de que Administrador pudiera operar
    // oficinas como superusuario desde su propio panel no tendrían ni la vista ni los
    // permisos de oficina. También limpia "tesoreria", el id de vista intermedio que tuvo
    // esta capacidad brevemente cuando solo alcanzaba a esa oficina.
    if(stored.admin){
      stored.admin.views=stored.admin.views.filter(v=>v!=='tesoreria')
      if(!stored.admin.views.includes('oficinas'))stored.admin.views=[...stored.admin.views,'oficinas']
      const officePerms=['case.attend','case.observe','case.forward','case.pay']
      const missing=officePerms.filter(p=>!stored.admin.permissions.includes(p))
      if(missing.length)stored.admin.permissions=[...stored.admin.permissions,...missing]
    }
    // Migración: como control adicional, solo Administrador puede corregir el monto de un
    // pago ya registrado. Se agrega exclusivamente a admin; oficina (Tesorería) nunca lo recibe.
    if(stored.admin&&!stored.admin.permissions.includes('case.pay_edit'))stored.admin.permissions=[...stored.admin.permissions,'case.pay_edit']
    return stored
  }catch{return clone(DEFAULT_ROLE_PERMISSIONS)}
}
export function saveRolePermissions(v){try{localStorage.setItem(K_ROLE_PERMISSIONS,JSON.stringify(v))}catch{}}
export function loadPaymentInfo(){try{return JSON.parse(localStorage.getItem(K_PAYMENT_INFO))||clone(DEFAULT_PAYMENT_INFO)}catch{return clone(DEFAULT_PAYMENT_INFO)}}
export function savePaymentInfo(v){try{localStorage.setItem(K_PAYMENT_INFO,JSON.stringify(v))}catch{}}
export function loadHolidays(){
  try{
    const stored=JSON.parse(localStorage.getItem(K_HOLIDAYS))
    if(!stored) return clone(DEFAULT_HOLIDAYS)
    return stored.sort((a,b)=>a.date.localeCompare(b.date))
  }catch{return clone(DEFAULT_HOLIDAYS)}
}
export function saveHolidays(v){try{localStorage.setItem(K_HOLIDAYS,JSON.stringify(v))}catch{}}
export function loadAuditLog(){try{return JSON.parse(localStorage.getItem(K_AUDIT_LOG))||[]}catch{return []}}
export function saveAuditLog(v){try{localStorage.setItem(K_AUDIT_LOG,JSON.stringify(v.slice(0,MAX_AUDIT_LOG)))}catch{}}
export function resetAll(){try{localStorage.removeItem(K_EXP);localStorage.removeItem(K_WF);localStorage.removeItem(K_OFFICES);localStorage.removeItem(K_PROCEDURES);localStorage.removeItem(K_USERS);localStorage.removeItem(K_ROLE_PERMISSIONS);localStorage.removeItem(K_PAYMENT_INFO);localStorage.removeItem(K_AUDIT_LOG);localStorage.removeItem(K_HOLIDAYS)}catch{};return {expedientes:preserveProcedureTerms(clone(seedExpedientes),DEFAULT_PROCEDURES),workflows:clone(seedWorkflowConfigs),offices:clone(DEFAULT_OFFICES),procedures:clone(DEFAULT_PROCEDURES).map(normalizeProcedure),users:clone(seedUsers),rolePermissions:clone(DEFAULT_ROLE_PERMISSIONS),paymentInfo:clone(DEFAULT_PAYMENT_INFO),holidays:clone(DEFAULT_HOLIDAYS),auditLog:[]}}
export function loadSession(){try{return JSON.parse(localStorage.getItem(K_SESSION))||null}catch{return null}}
export function saveSession(v){try{localStorage.setItem(K_SESSION,JSON.stringify(v))}catch{}}
export function clearSession(){try{localStorage.removeItem(K_SESSION)}catch{}}
export function nextNumero(items){return Math.max(5222,...items.map(x=>Number(x.numero)||0))+1}
