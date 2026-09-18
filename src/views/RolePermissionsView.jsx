import React,{useState} from 'react'
import { ShieldCheck, GraduationCap, UserRound, Inbox, Building2, Lock } from 'lucide-react'
import { Panel, Badge } from '../components/ui'
import { PROFILES, VIEW_CATALOG, POSSIBLE_VIEWS_BY_ROLE, PERMISSIONS_CATALOG } from '../data/catalogs'

const roleIcons={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}

export default function RolePermissionsView({rolePermissions,onSaveRolePermissions}){
  const [selectedRole,setSelectedRole]=useState(PROFILES[0].id)
  const config=rolePermissions[selectedRole]||{views:[],permissions:[]}
  const possibleViews=VIEW_CATALOG.filter(v=>(POSSIBLE_VIEWS_BY_ROLE[selectedRole]||[]).includes(v.id))
  const selectedProfile=PROFILES.find(p=>p.id===selectedRole)

  // Bloquea en la UI, antes de intentar guardar, las dos formas de que el Administrador
  // se quede sin manera de volver a esta pantalla: quitarse la vista "Usuarios y catálogos"
  // (que contiene esta configuración) o quedarse sin ninguna vista. validateRolePermissions
  // en workflowEngine.js rechaza igualmente el guardado si se llega a intentar por otra vía.
  const lockReason=id=>{
    if(selectedRole==='admin'&&id==='catalog'&&config.views.includes('catalog'))
      return 'Es la única vista que da acceso a esta pantalla de permisos. Si la quitas, el Administrador queda sin forma de revertir cambios.'
    if(config.views.length===1&&config.views.includes(id))
      return 'El rol debe conservar acceso a al menos una vista.'
    return null
  }

  const toggleView=id=>{
    if(lockReason(id))return
    const views=config.views.includes(id)?config.views.filter(x=>x!==id):[...config.views,id]
    onSaveRolePermissions(selectedRole,{...config,views})
  }
  const togglePermission=key=>{
    const permissions=config.permissions.includes(key)?config.permissions.filter(x=>x!==key):[...config.permissions,key]
    onSaveRolePermissions(selectedRole,{...config,permissions})
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:18,alignItems:'start'}}>
      <Panel title="Roles del sistema" subtitle="Selecciona un rol para configurar su acceso.">
        <div className="procedure-list">
          {PROFILES.map(p=>{
            const Icon=roleIcons[p.id]||ShieldCheck
            const rp=rolePermissions[p.id]||{views:[],permissions:[]}
            return (
              <button key={p.id} className={selectedRole===p.id?'active':''} onClick={()=>setSelectedRole(p.id)} style={{display:'flex',alignItems:'center',gap:8}}>
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

      <div style={{display:'grid',gap:18}}>
        <Panel title={`Vistas visibles para ${selectedProfile?.label||selectedRole}`} subtitle="Controla qué módulos aparecen en el menú lateral de este rol.">
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

        <Panel title="Permisos habilitados" subtitle="Controla qué acciones concretas puede realizar este rol dentro de sus vistas. Los botones correspondientes se ocultan si el permiso está deshabilitado.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10,padding:'14px 16px'}}>
            {PERMISSIONS_CATALOG.map(perm=>(
              <label key={perm.key} className="requirement-check" style={{border:'1px solid var(--line)',borderRadius:10,padding:'9px 12px'}}>
                <input type="checkbox" checked={config.permissions.includes(perm.key)} onChange={()=>togglePermission(perm.key)}/>
                <span>{perm.label}</span>
              </label>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
