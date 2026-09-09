import React,{useState} from 'react'
import { LockKeyhole, Mail, ArrowRight, ShieldCheck, GraduationCap, Inbox, Building2, UserRound } from 'lucide-react'
import { PROFILES } from '../data/catalogs'
const icons={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}
export default function LoginView({onLogin,onCredentialLogin}){
 const [username,setUsername]=useState('admin'),[password,setPassword]=useState('admin123'),[error,setError]=useState('')
 const submit=e=>{
  e.preventDefault()
  if(!username.trim()||!password){setError('Ingresa usuario y contraseña.');return}
  if(!onCredentialLogin(username.trim(),password))setError('Usuario o contraseña incorrectos, o la cuenta está inactiva.')
 }
 return <div className="login-page"><div className="login-brand"><div className="login-logo">A</div><div><span>IESTP ARIB</span><h1>Mesa de Partes Digital</h1><p>Recepción, proveído, recorrido por oficinas y trazabilidad de expedientes.</p></div><div className="login-flow"><b>Flujo institucional</b><div><span>Mesa de Partes</span><i>→</i><span>Dirección</span><i>→</i><span>Oficinas</span><i>→</i><span>Cierre</span></div></div></div><div className="login-card"><span className="eyebrow">ACCESO AL SISTEMA</span><h2>Bienvenido</h2><p>Ingresa con el usuario y contraseña asignados por el administrador.</p><form onSubmit={submit}><label><span>Usuario</span><div><Mail size={17}/><input value={username} onChange={e=>{setUsername(e.target.value);setError('')}}/></div></label><label><span>Contraseña</span><div><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}}/></div></label>{error&&<div className="login-error">{error}</div>}<button type="submit" className="btn primary full"><ArrowRight size={17}/> Ingresar</button></form><div className="demo-divider"><span>ACCESOS RÁPIDOS PARA LA DEMO</span></div><div className="demo-profiles">{PROFILES.map(p=>{const Icon=icons[p.id];return <button key={p.id} onClick={()=>onLogin(p.id)}><Icon size={16}/><div><b>{p.label}</b><span>{p.description}</span></div></button>})}</div></div></div>
}
