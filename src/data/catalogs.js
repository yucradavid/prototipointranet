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

// Catálogo de vistas del sistema (id interno usado por activeView) y de qué roles
// podrían razonablemente necesitarla, para poblar el panel de "Roles y permisos".
export const VIEW_CATALOG = [
  {id:'control', label:'Centro de control'},
  {id:'workflow', label:'Trámites y rutas'},
  {id:'catalog', label:'Usuarios y catálogos'},
  {id:'work', label:'Mesa de trabajo (bandeja del rol)'},
  {id:'book', label:'Libro y auditoría'},
  {id:'portal', label:'Mi Mesa de Partes'},
  {id:'tracking', label:'Seguimiento'},
]
export const POSSIBLE_VIEWS_BY_ROLE = {
  estudiante:['portal','tracking'],
  docente:['portal','tracking'],
  secretaria:['work','book','tracking'],
  direccion:['work','book','tracking'],
  oficina:['work','book','tracking'],
  admin:['control','workflow','catalog','book','tracking'],
}

// Catálogo de permisos granulares (acciones concretas) que puede tener un rol.
export const PERMISSIONS_CATALOG = [
  {key:'request.create', label:'Crear solicitudes (FUT)'},
  {key:'request.view_own', label:'Ver sus propias solicitudes'},
  {key:'request.correct', label:'Subsanar observaciones'},
  {key:'case.register', label:'Registrar expedientes físicos/virtuales'},
  {key:'case.receive', label:'Recibir expedientes'},
  {key:'case.close', label:'Cerrar y entregar expedientes'},
  {key:'book.view', label:'Ver libro digital'},
  {key:'case.proveido', label:'Emitir proveído'},
  {key:'route.choose', label:'Definir ruta de oficinas'},
  {key:'case.view', label:'Ver detalle de expedientes'},
  {key:'case.attend', label:'Atender y completar pasos en oficina'},
  {key:'case.observe', label:'Observar expedientes'},
  {key:'case.forward', label:'Redirigir a otra oficina'},
  {key:'system.manage', label:'Administrar el sistema'},
  {key:'workflow.manage', label:'Administrar trámites y rutas'},
  {key:'users.manage', label:'Administrar usuarios'},
  {key:'audit.view', label:'Ver auditoría'},
  {key:'reports.view', label:'Ver reportes'},
]

export const DEFAULT_ROLE_PERMISSIONS = {
  estudiante:{views:['portal','tracking'], permissions:['request.create','request.view_own','request.correct']},
  docente:{views:['portal','tracking'], permissions:['request.create','request.view_own','request.correct']},
  secretaria:{views:['work','book','tracking'], permissions:['case.register','case.receive','case.close','book.view']},
  direccion:{views:['work','tracking'], permissions:['case.proveido','route.choose','case.view']},
  oficina:{views:['work','tracking'], permissions:['case.attend','case.observe','case.forward']},
  admin:{views:['control','workflow','catalog','book','tracking'], permissions:['system.manage','workflow.manage','users.manage','audit.view','reports.view']},
}

// Igual que OFFICES/PROCEDURES: el prototipo permite a Administrador reconfigurar
// en vivo qué vistas ve cada rol y qué permisos tiene. App.jsx sincroniza esto con
// localStorage a través de setRolePermissionsCatalog.
export let ROLE_PERMISSIONS = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))
export function setRolePermissionsCatalog(v){ ROLE_PERMISSIONS = v }
export const roleViews = role => ROLE_PERMISSIONS[role]?.views || []
export const rolePerms = role => ROLE_PERMISSIONS[role]?.permissions || []
export const hasPermission = (role,perm) => rolePerms(role).includes(perm)

export const officeById = id => OFFICES.find(x=>x.id===id)
export const procedureById = id => PROCEDURES.find(x=>x.id===id)
export const officeName = id => officeById(id)?.name || id || '—'
// Rol legible para mostrar en UI: para 'oficina' usa la oficina asignada
// (ej. "Encargado de Tesorería") en vez del genérico "Oficina destino",
// para que cada oficina se sienta como un rol propio sin crear un PROFILES nuevo por oficina.
export const roleLabel = user => user?.role==='oficina'&&user?.office ? `Encargado de ${officeName(user.office)}` : (PROFILES.find(p=>p.id===user?.role)?.label || user?.role || '—')
export const slugify = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || `item_${Date.now()}`
