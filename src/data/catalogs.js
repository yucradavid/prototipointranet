export const DEFAULT_OFFICES = [
  {id:'mesa_partes', name:'Mesa de Partes / Secretaría', short:'MP', color:'#0788d1'},
  {id:'direccion', name:'Dirección', short:'DIR', color:'#111827'},
  {id:'jefatura_academica', name:'Jefatura Académica', short:'JA', color:'#f59e0b'},
  {id:'tesoreria', name:'Tesorería', short:'TES', color:'#22c55e'},
  {id:'biblioteca', name:'Biblioteca', short:'BIB', color:'#d946ef'},
  {id:'efsrt', name:'EFSRT', short:'EFSRT', color:'#fb7185'},
  {id:'unidad_academica', name:'Unidad Académica', short:'UA', color:'#8b5cf6'},
  {id:'secretaria_academica', name:'Secretaría Académica', short:'SA', color:'#06b6d4'},
]

export const DEFAULT_PROCEDURES = [
  {id:'const_biblioteca', name:'Constancia de biblioteca', category:'Constancias', requires:'FUT + DNI', sla:2, route:['biblioteca']},
  {id:'iefsrt_egresado', name:'IEFSRT del egresado', category:'EFSRT', requires:'FUT + anexos', sla:4, route:['efsrt','jefatura_academica']},
  {id:'cert_modular', name:'Certificado modular', category:'Certificados', requires:'FUT + DNI', sla:5, route:['secretaria_academica','jefatura_academica']},
  {id:'examen_suficiencia', name:'Examen de suficiencia', category:'Académico', requires:'FUT + sustento', sla:5, route:['jefatura_academica','unidad_academica']},
  {id:'plan_tutoria', name:'Plan de consejería y tutoría', category:'Académico', requires:'FUT + plan', sla:4, route:['unidad_academica','jefatura_academica']},
  {id:'diploma_egresado', name:'Diploma de egresado', category:'Egreso', requires:'FUT + requisitos de egreso', sla:7, route:['secretaria_academica','tesoreria','jefatura_academica']},
  {id:'tecnico_pedagogico', name:'Técnico pedagógico', category:'Académico', requires:'FUT + sustento', sla:5, route:['jefatura_academica']},
  {id:'const_egresado', name:'Constancia de egresado', category:'Constancias', requires:'FUT + DNI', sla:3, route:['secretaria_academica']},
]

// Mutable catalogs: el prototipo permite a Administrador crear/editar/eliminar
// oficinas y trámites en tiempo real (ver CatalogAdminView). App.jsx sincroniza
// estos arrays con localStorage a través de setOfficesCatalog/setProceduresCatalog.
export let OFFICES = DEFAULT_OFFICES.map(x=>({...x}))
export let PROCEDURES = DEFAULT_PROCEDURES.map(x=>({...x}))
export function setOfficesCatalog(list){ OFFICES = list }
export function setProceduresCatalog(list){ PROCEDURES = list }

export const PROFILES = [
  {id:'estudiante', label:'Estudiante', role:'ESTUDIANTE', office:null, permissions:['request.create','request.view_own','request.correct'], description:'Presenta FUT, subsana y hace seguimiento.'},
  {id:'docente', label:'Docente', role:'DOCENTE', office:null, permissions:['request.create','request.view_own','request.correct'], description:'Presenta solicitudes internas y hace seguimiento.'},
  {id:'secretaria', label:'Secretaría', role:'SECRETARIA', office:'mesa_partes', permissions:['case.register','case.receive','case.close','book.view'], description:'Registra el libro digital y remite todo a Dirección.'},
  {id:'direccion', label:'Dirección', role:'ADMIN', office:'direccion', permissions:['case.proveido','route.choose','case.view'], description:'Emite proveído obligatorio y activa la ruta de oficinas.'},
  {id:'oficina', label:'Oficina destino', role:'ADMIN', office:'biblioteca', permissions:['case.attend','case.observe','case.forward'], description:'Atiende el paso asignado y deriva automáticamente al siguiente.'},
  {id:'admin', label:'Administrador', role:'ADMIN', office:'mesa_partes', permissions:['system.manage','workflow.manage','users.manage','audit.view','reports.view'], description:'Configura trámites, rutas, oficinas, usuarios y monitorea el sistema.'},
]

export const PROGRAMS = ['Arquitectura de Plataformas y Servicios de TI','Contabilidad','Enfermería Técnica','Otro programa']
export const CONDITIONS = ['Estudiante','Egresado','Docente','Administrativo','Persona externa']

export const officeById = id => OFFICES.find(x=>x.id===id)
export const procedureById = id => PROCEDURES.find(x=>x.id===id)
export const officeName = id => officeById(id)?.name || id || '—'
export const slugify = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || `item_${Date.now()}`
