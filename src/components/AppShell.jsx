import React from 'react'
import { Building2, GraduationCap, UserRound, Inbox, ShieldCheck, Workflow, LayoutGrid, BookOpen, Search, RotateCcw, ChevronDown, Bell, Menu, X, LogOut, CheckCircle2 } from 'lucide-react'
import { PROFILES, officeName, roleLabel } from '../data/catalogs'

const iconMap={
  estudiante: GraduationCap,
  docente: UserRound,
  secretaria: Inbox,
  direccion: Building2,
  oficina: Building2,
  admin: ShieldCheck
}

const NAV_BY_ROLE={
  admin:[
    ['control','Centro de control',ShieldCheck],
    ['workflow','Trámites y rutas',Workflow],
    ['catalog','Usuarios y catálogos',LayoutGrid],
    ['book','Libro y auditoría',BookOpen],
    ['tracking','Seguimiento global',Search]
  ],
  secretaria:[
    ['work','Mesa de Partes',Inbox],
    ['book','Libro digital',BookOpen],
    ['tracking','Seguimiento',Search]
  ],
  direccion:[
    ['work','Bandeja de Dirección',Building2],
    ['book','Libro y auditoría',BookOpen],
    ['tracking','Seguimiento',Search]
  ],
  oficina:[
    ['work','Bandeja de oficina',Building2],
    ['book','Libro y auditoría',BookOpen],
    ['tracking','Seguimiento',Search]
  ],
  estudiante:[
    ['portal','Mi Mesa de Partes',GraduationCap],
    ['tracking','Seguimiento',Search]
  ],
  docente:[
    ['portal','Mi Mesa de Partes',GraduationCap],
    ['tracking','Seguimiento',Search]
  ]
}

export default function AppShell({profileId,setProfileId,currentUser,activeView,setActiveView,alerts=[],myViews,onReset,onLogout,children}){
  const [mobile,setMobile]=React.useState(false)
  const [notifOpen,setNotifOpen]=React.useState(false)
  const profile=PROFILES.find(x=>x.id===profileId)||PROFILES[0]

  const allowedViews=myViews||[]
  const nav=(NAV_BY_ROLE[profileId]||[]).filter(([id])=>allowedViews.includes(id))

  const Icon=iconMap[profileId]||UserRound
  const demoProfiles=PROFILES.filter(p=>p.id!=='oficina')

  React.useEffect(()=>{setNotifOpen(false)},[profileId,activeView])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile?'open':''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={22}/>
          </div>
          <div>
            <b>IESTP ARIB</b>
            <span>Mesa de Partes Digital</span>
          </div>
          <button className="mobile-close" onClick={()=>setMobile(false)} title="Cerrar menú">
            <X size={20}/>
          </button>
        </div>

        <div className="nav-label">MÓDULOS DEL SISTEMA</div>
        <nav>
          {nav.map(([id,label,NIcon])=>(
            <button 
              key={id} 
              className={activeView===id?'active':''} 
              onClick={()=>{setActiveView(id);setMobile(false)}}
            >
              <NIcon size={18}/>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={onReset} title="Restaurar datos iniciales de la demo">
            <RotateCcw size={16}/>
            <span>Restaurar demo</span>
          </button>
          <button onClick={onLogout} title="Cerrar sesión actual">
            <LogOut size={16}/>
            <span>Cerrar sesión</span>
          </button>
          <div className="system-tag">
            <span className="pulse"></span>
            <span>Sistema en línea · Producción IESTP ARIB</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="hamb" onClick={()=>setMobile(true)} title="Abrir menú">
            <Menu size={22}/>
          </button>
          
          <div className="topbar-context">
            <span>{currentUser?'Usuario autenticado':'Perfil demostrativo'}</span>
            <b>
              {currentUser?currentUser.fullName:profile.label}
              {(currentUser?.office||profile.office)?` · ${officeName(currentUser?.office||profile.office)}`:''}
            </b>
          </div>

          <div className="topbar-right">
            <div className="notif-wrap">
              <button 
                className="icon-btn" 
                onClick={()=>setNotifOpen(v=>!v)} 
                title="Ver notificaciones y alertas"
              >
                <Bell size={18}/>
                {alerts.length>0&&<i>{alerts.length>9?'9+':alerts.length}</i>}
              </button>
              
              {notifOpen&&(
                <div className="notif-panel">
                  <div className="notif-panel-head">
                    <b>Alertas del sistema</b>
                    <span>{alerts.length} pendiente{alerts.length===1?'':'s'}</span>
                  </div>
                  <div className="notif-panel-list">
                    {alerts.length ? (
                      alerts.slice(0,8).map((a,i)=>(
                        <div className="notif-row" key={i}>
                          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                            <span style={{color:'#0284c7',marginTop:2}}>•</span>
                            <span>{a}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notif-empty">
                        <CheckCircle2 size={24} color="#10b981" style={{margin:'0 auto 6px',display:'block'}}/>
                        Sin alertas pendientes en tu bandeja.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {currentUser ? (
              <div className="profile-switch locked" title="Sesión activa">
                <Icon size={18} color="#0284c7"/>
                <span>{roleLabel(currentUser)}</span>
              </div>
            ) : (
              <div className="profile-switch" title="Cambiar perfil para la demostración">
                <Icon size={18} color="#0284c7"/>
                <select 
                  value={profileId} 
                  onChange={e=>{
                    setProfileId(e.target.value)
                    setActiveView(e.target.value==='admin'?'control':e.target.value==='estudiante'||e.target.value==='docente'?'portal':'work')
                  }}
                >
                  {demoProfiles.map(p=>(
                    <option value={p.id} key={p.id}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#64748b"/>
              </div>
            )}
          </div>
        </header>

        <div className="page-wrap">
          {children}
        </div>
      </main>
    </div>
  )
}

