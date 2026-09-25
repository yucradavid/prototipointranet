import React,{useState} from 'react'
import { ShieldCheck, GraduationCap, UserRound, Inbox, Building2, Lock, RotateCcw } from 'lucide-react'
import { Panel, Badge } from '../components/ui'
import { PROFILES, VIEW_CATALOG, POSSIBLE_VIEWS_BY_ROLE, PERMISSIONS_CATALOG } from '../data/catalogs'

const roleIcons={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}

// Agrupa el catálogo plano de permisos en secciones con sentido para quien configura
// el sistema — más fácil de escanear que una sola grilla de ~20 casillas sin orden.
const PERMISSION_GROUPS=[
  {title:'Solicitudes del ciudadano', hint:'Lo que puede hacer un solicitante con su propio trámite.', keys:['request.create','request.view_own','request.correct']},
  {title:'Mesa de Partes y proveído', hint:'Registro del expediente, derivación por Dirección y cierre.', keys:['case.register','case.receive','case.close','book.view','case.proveido','route.choose','case.view']},
  {title:'Atención en oficina', hint:'Lo que puede hacer la oficina que atiende el paso asignado.', keys:['case.originate','case.attend','case.observe','case.forward']},
  {title:'Pagos', hint:'Registrar el pago del derecho de trámite en Tesorería y corregirlo si hace falta.', keys:['case.pay','case.pay_edit']},
  {title:'Administración del sistema', hint:'Configurar catálogos, usuarios, auditoría y reportes.', keys:['system.manage','workflow.manage','users.manage','audit.view','reports.view']},
]

export default function RolePermissionsView({rolePermissions,officePermissions={},offices=[],onSaveRolePermissions,onSaveOfficePermissions,onResetOfficePermissions}){
  const [mode,setMode]=useState('role') // 'role' | 'office'
  const [selectedRole,setSelectedRole]=useState(PROFILES[0].id)
  const [selectedOffice,setSelectedOffice]=useState(null)

  const routableOffices=offices.filter(o=>!['mesa_partes','direccion'].includes(o.id))
  const officeRoleDefault=rolePermissions.oficina||{views:[],permissions:[]}

  const selectRole=id=>{ setMode('role'); setSelectedRole(id) }
  const selectOffice=id=>{ setMode('office'); setSelectedOffice(id) }

  const isOfficeMode=mode==='office'&&!!selectedOffice
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
    <div className="role-permissions-grid">
      <div style={{display:'grid',gap:14}}>
        <Panel title="Roles del sistema" subtitle="Selecciona un rol para configurar su acceso.">
          <div className="procedure-list">
            {PROFILES.map(p=>{
              const Icon=roleIcons[p.id]||ShieldCheck
              const rp=rolePermissions[p.id]||{views:[],permissions:[]}
              return (
                <button key={p.id} className={!isOfficeMode&&selectedRole===p.id?'active':''} onClick={()=>selectRole(p.id)} style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-start'}}>
                  <Icon size={16}/>
                  <div>
                    <b>{p.label}</b>
                    <span>{rp.views.length} vista(s) · {rp.permissions.length} permiso(s)</span>
                  </div>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel title="Personalizar por oficina" subtitle='Ejemplo: si solo Tesorería debe ver "Caja y pagos", personalízala aquí en vez de dársela a las 10 oficinas.'>
          <div className="procedure-list">
            {routableOffices.map(o=>{
              const custom=!!officePermissions[o.id]
              const cfg=officePermissions[o.id]||officeRoleDefault
              return (
                <button key={o.id} className={isOfficeMode&&selectedOffice===o.id?'active':''} onClick={()=>selectOffice(o.id)}>
                  <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                    <Building2 size={16} style={{color:o.color,flexShrink:0}}/>
                    <div>
                      <b>{o.name}</b>
                      <span>{cfg.views.length} vista(s) · {cfg.permissions.length} permiso(s)</span>
                    </div>
                  </div>
                  {custom && <Badge tone="info">Personalizado</Badge>}
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <div style={{display:'grid',gap:18}}>
        <div className="rule-banner" style={{marginBottom:0}}>
          <ShieldCheck size={20} style={{color:'var(--arib-primary)'}}/>
          <div>
            <b>Cómo funciona esta pantalla</b>
            <span>
              Los <strong>roles</strong> (izquierda, arriba) son la configuración por defecto que comparten todas las cuentas de ese tipo — por ejemplo, todas las oficinas parten del rol "Oficina destino".
              Si una oficina puntual necesita algo distinto, personalízala en <strong>"Personalizar por oficina"</strong> (izquierda, abajo) sin afectar a las demás. Los cambios se guardan solos al marcar o desmarcar una casilla.
            </span>
          </div>
        </div>

        {isOfficeMode && (
          <div className="rule-banner" style={{marginBottom:0}}>
            <Building2 size={20} style={{color:selectedOfficeObj?.color||'var(--arib-primary)'}}/>
            <div style={{flex:1}}>
              <b>{isCustomized?`Permisos personalizados de ${selectedOfficeObj?.name}`:`${selectedOfficeObj?.name} hereda el rol Oficina`}</b>
              <span>
                {isCustomized
                  ? 'Cualquier cambio aquí aplica solo a esta oficina. El resto sigue usando los permisos del rol Oficina.'
                  : 'Aún no tiene personalización propia. Marca o desmarca una casilla para crearla, o edita el rol Oficina si el cambio debe aplicar a todas las oficinas.'}
              </span>
            </div>
            {isCustomized && (
              <button className="btn soft" onClick={()=>onResetOfficePermissions(selectedOffice)}>
                <RotateCcw size={14}/> Restablecer al rol Oficina
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
  )
}
