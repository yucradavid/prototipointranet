import React,{useState} from 'react'
import { ShieldCheck, GraduationCap, UserRound, Inbox, Building2, Lock, RotateCcw, Users } from 'lucide-react'
import { Panel, Badge } from '../components/ui'
import { PROFILES, VIEW_CATALOG, POSSIBLE_VIEWS_BY_ROLE, PERMISSIONS_CATALOG } from '../data/catalogs'
import './RolePermissionsView.css'

const roleIcons={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}

// Agrupa el catálogo plano de permisos en secciones con sentido para quien configura
// el sistema — más fácil de escanear que una sola grilla de ~20 casillas sin orden.
const PERMISSION_GROUPS=[
  {title:'Solicitudes del ciudadano', hint:'Lo que puede hacer un solicitante con su propio trámite.', keys:['request.create','request.view_own','request.correct']},
  {title:'Mesa de Partes y proveído', hint:'Registro del expediente, derivación por Dirección y cierre.', keys:['case.register','case.receive','case.close','book.view','case.proveido','route.choose','case.view']},
  {title:'Atención en oficina', hint:'Lo que puede hacer la oficina que atiende el paso asignado.', keys:['case.originate','case.attend','case.observe','case.forward']},
  {title:'Pagos', hint:'Registrar el pago del derecho de trámite (Tesorería o una sub-tesorería) y corregirlo si hace falta.', keys:['case.pay','case.pay_edit']},
  {title:'Administración del sistema', hint:'Configurar catálogos, usuarios, auditoría y reportes.', keys:['system.manage','workflow.manage','users.manage','audit.view','reports.view']},
]

export default function RolePermissionsView({rolePermissions,officePermissions={},offices=[],onSaveRolePermissions,onSaveOfficePermissions,onResetOfficePermissions,onOpenUsers}){
  // 'roles': plantillas reutilizables de permisos (lo que un rol PUEDE hacer).
  // 'offices': asignación — qué oficina usa qué rol, y su excepción si tiene una.
  // Dos pestañas separadas en vez de dos listas iguales una debajo de la otra: así se
  // ve de entrada que son dos cosas distintas, no dos formas de hacer lo mismo.
  const [tab,setTab]=useState('roles')
  const [selectedRole,setSelectedRole]=useState(PROFILES[0].id)
  const [selectedOffice,setSelectedOffice]=useState(null)

  const routableOffices=offices.filter(o=>!['mesa_partes','direccion'].includes(o.id))
  const officeRoleDefault=rolePermissions.oficina||{views:[],permissions:[]}
  const customizedCount=routableOffices.filter(o=>!!officePermissions[o.id]).length

  const selectRole=id=>{ setTab('roles'); setSelectedRole(id) }
  const selectOffice=id=>{ setTab('offices'); setSelectedOffice(id) }

  const isOfficeMode=tab==='offices'&&!!selectedOffice
  const officeOverride=isOfficeMode?officePermissions[selectedOffice]:null
  const isCustomized=!!officeOverride
  // Sin personalizar, la oficina hereda tal cual la configuración del rol 'oficina'.
  const config=isOfficeMode?(officeOverride||officeRoleDefault):(rolePermissions[selectedRole]||{views:[],permissions:[]})
  const possibleViews=VIEW_CATALOG.filter(v=>(POSSIBLE_VIEWS_BY_ROLE[isOfficeMode?'oficina':selectedRole]||[]).includes(v.id))
  const selectedProfile=PROFILES.find(p=>p.id===selectedRole)
  const selectedOfficeObj=routableOffices.find(o=>o.id===selectedOffice)

  // Bloquea en la UI, antes de intentar guardar, las dos formas de que el Administrador
  // se quede sin manera de volver a esta pantalla: quitarse la vista "Usuarios y catálogos"
  // (que contiene esta configuración) o quedarse sin ninguna vista. validateRolePermissions
  // en workflowEngine.js rechaza igualmente el guardado si se llega a intentar por otra vía.
  // Para una oficina individual no aplica el bloqueo de "catalog" (no es el rol admin), pero
  // sí se exige conservar al menos una vista (validateOfficePermissions).
  const lockReason=id=>{
    if(!isOfficeMode&&selectedRole==='admin'&&id==='catalog'&&config.views.includes('catalog'))
      return 'Es la única vista que da acceso a esta pantalla de permisos. Si la quitas, el Administrador queda sin forma de revertir cambios.'
    if(config.views.length===1&&config.views.includes(id))
      return isOfficeMode?'La oficina debe conservar acceso a al menos una vista.':'El rol debe conservar acceso a al menos una vista.'
    return null
  }

  const toggleView=id=>{
    if(lockReason(id))return
    const views=config.views.includes(id)?config.views.filter(x=>x!==id):[...config.views,id]
    if(isOfficeMode) onSaveOfficePermissions(selectedOffice,{...config,views})
    else onSaveRolePermissions(selectedRole,{...config,views})
  }
  const togglePermission=key=>{
    const permissions=config.permissions.includes(key)?config.permissions.filter(x=>x!==key):[...config.permissions,key]
    if(isOfficeMode) onSaveOfficePermissions(selectedOffice,{...config,permissions})
    else onSaveRolePermissions(selectedRole,{...config,permissions})
  }

  return (
    <>
    <div className="role-permissions-grid">
      <Panel
        title={tab==='roles'?'Roles del sistema':'Oficinas — asignación de rol'}
        subtitle={tab==='roles'?'Plantillas de permisos reutilizables. Editar un rol afecta a todas las cuentas que lo tienen.':'Toda oficina usa el rol "Oficina destino" salvo que tenga una excepción propia.'}
      >
        <div className="segmented" style={{marginBottom:14}}>
          <button className={tab==='roles'?'active':''} onClick={()=>setTab('roles')}>
            <ShieldCheck size={14} style={{display:'inline',verticalAlign:'text-bottom',marginRight:4}}/>
            <span>Roles</span>
            <i>{PROFILES.length}</i>
          </button>
          <button className={tab==='offices'?'active':''} onClick={()=>setTab('offices')}>
            <Users size={14} style={{display:'inline',verticalAlign:'text-bottom',marginRight:4}}/>
            <span>Oficinas</span>
            <i>{routableOffices.length}</i>
          </button>
        </div>

        {tab==='roles' ? (
          <div className="rp-cards">
            {PROFILES.map(p=>{
              const Icon=roleIcons[p.id]||ShieldCheck
              const rp=rolePermissions[p.id]||{views:[],permissions:[]}
              return (
                <button type="button" key={p.id} className={`rp-card ${selectedRole===p.id?'active':''}`} onClick={()=>selectRole(p.id)}>
                  <span className="rp-card-icon"><Icon size={17}/></span>
                  <div className="rp-card-body">
                    <b>{p.label}</b>
                    <span>{rp.views.length} vista(s) · {rp.permissions.length} permiso(s)</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rp-cards">
            {routableOffices.map(o=>{
              const custom=!!officePermissions[o.id]
              const cfg=officePermissions[o.id]||officeRoleDefault
              return (
                <button type="button" key={o.id} className={`rp-card ${selectedOffice===o.id?'active':''}`} onClick={()=>selectOffice(o.id)}>
                  <span className="rp-card-icon" style={{color:o.color}}><Building2 size={17}/></span>
                  <div className="rp-card-body">
                    <b>{o.name}</b>
                    <span>Rol base: Oficina destino · {cfg.views.length} vista(s) · {cfg.permissions.length} permiso(s)</span>
                  </div>
                  {custom && <Badge tone="info">Personalizado</Badge>}
                </button>
              )
            })}
          </div>
        )}

        {tab==='offices' && (
          <p style={{margin:'10px 2px 0',fontSize:11,color:'var(--arib-navy-light)'}}>
            {customizedCount>0 ? `${customizedCount} de ${routableOffices.length} oficina(s) con excepción propia.` : 'Ninguna oficina tiene una excepción propia todavía.'} Haz clic en una fila para ver o cambiar sus permisos.
          </p>
        )}
      </Panel>

      <div style={{display:'grid',gap:18}}>
        {isOfficeMode && (
          <div className="rule-banner" style={{marginBottom:0}}>
            <Building2 size={20} style={{color:selectedOfficeObj?.color||'var(--arib-primary)'}}/>
            <div style={{flex:1}}>
              <b>{isCustomized?`Permisos personalizados de ${selectedOfficeObj?.name}`:`${selectedOfficeObj?.name} hereda el rol "Oficina destino"`}</b>
              <span>
                {isCustomized
                  ? 'Esta es una excepción: los cambios de abajo aplican solo a esta oficina. El resto sigue usando el rol "Oficina destino".'
                  : 'Aún usa el rol compartido tal cual. Marca o desmarca una casilla para crear una excepción solo para esta oficina, o edita el rol "Oficina destino" (pestaña Roles) si el cambio debe aplicar a todas.'}
              </span>
            </div>
            {isCustomized && (
              <button className="btn soft" onClick={()=>onResetOfficePermissions(selectedOffice)}>
                <RotateCcw size={14}/> Quitar excepción, volver al rol
              </button>
            )}
          </div>
        )}

        <Panel title={`Vistas visibles para ${isOfficeMode?selectedOfficeObj?.name:(selectedProfile?.label||selectedRole)}`} subtitle="Controla qué módulos aparecen en el menú lateral.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10,padding:'14px 16px'}}>
            {possibleViews.map(v=>{
              const reason=lockReason(v.id)
              return (
                <label key={v.id} className="requirement-check" title={reason||undefined} style={{border:'1px solid var(--line)',borderRadius:10,padding:'9px 12px',opacity:reason?0.75:1,cursor:reason?'not-allowed':'pointer'}}>
                  <input type="checkbox" checked={config.views.includes(v.id)} disabled={!!reason} onChange={()=>toggleView(v.id)}/>
                  <span>{v.label}</span>
                  {reason&&<Lock size={12} style={{marginLeft:'auto',color:'var(--arib-navy-light)',flexShrink:0}}/>}
                </label>
              )
            })}
          </div>
        </Panel>

        <Panel title="Permisos habilitados" subtitle="Controla qué acciones concretas puede realizar dentro de sus vistas. Los botones correspondientes se ocultan si el permiso está deshabilitado.">
          <div style={{display:'grid',gap:16,padding:'14px 16px'}}>
            {PERMISSION_GROUPS.map(group=>{
              const perms=PERMISSIONS_CATALOG.filter(p=>group.keys.includes(p.key))
              if(!perms.length) return null
              return (
                <div key={group.title}>
                  <div style={{marginBottom:8}}>
                    <b style={{fontSize:13,color:'var(--arib-navy)'}}>{group.title}</b>
                    <p style={{margin:'2px 0 0',fontSize:12,color:'var(--muted)'}}>{group.hint}</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
                    {perms.map(perm=>(
                      <label key={perm.key} className="requirement-check" style={{border:'1px solid var(--line)',borderRadius:10,padding:'9px 12px'}}>
                        <input type="checkbox" checked={config.permissions.includes(perm.key)} onChange={()=>togglePermission(perm.key)}/>
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
    <div className="rp-help">
      <div><b>¿No encuentras el permiso que necesitas?</b><p>Revisa Usuarios y Accesos para confirmar el rol y la oficina asignada a la cuenta — los permisos de arriba dependen de eso.</p></div>
      <button className="btn ghost" onClick={onOpenUsers}><Users size={15}/> Usuarios y Accesos</button>
    </div>
    </>
  )
}
