import React from 'react'
import { Building2, GraduationCap, UserRound, Inbox, ShieldCheck, Workflow, LayoutGrid, BookOpen, Search, RotateCcw, ChevronDown, Bell, Menu, X } from 'lucide-react'
import { PROFILES, officeName, roleLabel } from '../data/catalogs'

const iconMap={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}

export default function AppShell({profileId,setProfileId,officeId,setOfficeId,offices,currentUser,activeView,setActiveView,alerts=[],onReset,onLogout,children}){
  const [mobile,setMobile]=React.useState(false)
  const [notifOpen,setNotifOpen]=React.useState(false)
  const profile=PROFILES.find(x=>x.id===profileId)||PROFILES[0]
  const nav=profileId==='admin'?[['control','Centro de control',ShieldCheck],['workflow','Trámites y rutas',Workflow],['catalog','Usuarios y catálogos',LayoutGrid],['book','Libro y auditoría',BookOpen],['tracking','Seguimiento global',Search]]
    : profileId==='secretaria'?[['work','Mesa de Partes',Inbox],['book','Libro digital',BookOpen],['tracking','Seguimiento',Search]]
    : profileId==='direccion'?[['work','Bandeja de Dirección',Building2],['tracking','Seguimiento',Search]]
    : profileId==='oficina'?[['work','Bandeja de oficina',Building2],['tracking','Seguimiento',Search]]
    : [['portal','Mi Mesa de Partes',GraduationCap],['tracking','Seguimiento',Search]]
  const Icon=iconMap[profileId]||UserRound
  const officeOptions=(offices||[]).filter(o=>!['mesa_partes','direccion'].includes(o.id))
  const showManualOfficeSelect=profileId==='oficina'&&!currentUser
  React.useEffect(()=>{setNotifOpen(false)},[profileId,activeView])
  return <div className="app-shell">
    <aside className={`sidebar ${mobile?'open':''}`}>
      <div className="brand"><div className="brand-mark">A</div><div><b>IESTP ARIB</b><span>Mesa de Partes</span></div><button className="mobile-close" onClick={()=>setMobile(false)}><X size={18}/></button></div>
      <div className="nav-label">MI ESPACIO</div>
      <nav>{nav.map(([id,label,NIcon])=><button key={id} className={activeView===id?'active':''} onClick={()=>{setActiveView(id);setMobile(false)}}><NIcon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><button onClick={onReset}><RotateCcw size={17}/><span>Restaurar demo</span></button><button onClick={onLogout}><UserRound size={17}/><span>Cerrar sesión</span></button><div className="system-tag"><span className="pulse"></span> Prototipo maestro · Producción objetivo</div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="hamb" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="topbar-context"><span>{currentUser?'Sesión':'Perfil de demostración'}</span><b>{currentUser?currentUser.fullName:profile.label}{(currentUser?.office||profile.office)?` · ${officeName(currentUser?.office||profile.office)}`:''}</b></div><div className="topbar-right">
        <div className="notif-wrap">
          <button className="icon-btn" onClick={()=>setNotifOpen(v=>!v)}><Bell size={18}/>{alerts.length>0&&<i>{alerts.length>9?'9+':alerts.length}</i>}</button>
          {notifOpen&&<div className="notif-panel">
            <div className="notif-panel-head"><b>Notificaciones</b><span>{alerts.length} pendiente{alerts.length===1?'':'s'}</span></div>
            <div className="notif-panel-list">{alerts.length?alerts.slice(0,8).map((a,i)=><div className="notif-row" key={i}>{a}</div>):<div className="notif-empty">Sin alertas pendientes.</div>}</div>
          </div>}
        </div>
        {currentUser?<div className="profile-switch locked"><Icon size={18}/><span>{roleLabel(currentUser)}</span></div>
        :<div className="profile-switch"><Icon size={18}/><select value={profileId} onChange={e=>{setProfileId(e.target.value);setActiveView(e.target.value==='admin'?'control':e.target.value==='estudiante'||e.target.value==='docente'?'portal':'work')}}>{PROFILES.map(p=><option value={p.id} key={p.id}>{p.label}</option>)}</select><ChevronDown size={15}/></div>}
      </div></header>
      {showManualOfficeSelect&&<div className="office-context"><span>Oficina operativa para la demo:</span><select value={officeId} onChange={e=>setOfficeId(e.target.value)}>{officeOptions.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select><small>En producción se obtiene del usuario autenticado; no se selecciona manualmente.</small></div>}
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
