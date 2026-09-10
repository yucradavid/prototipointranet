import React,{useState} from 'react'
import { LockKeyhole, Mail, ArrowRight, ShieldCheck, GraduationCap, Inbox, Building2, UserRound } from 'lucide-react'
import { PROFILES } from '../data/catalogs'
const icons={estudiante:GraduationCap,docente:UserRound,secretaria:Inbox,direccion:Building2,oficina:Building2,admin:ShieldCheck}
const GoogleIcon=({size=18})=><svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.1 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.6 0 5 .9 6.9 2.5l6-6C33.5 6.5 29 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.6-.2-3.1-.4-4.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.3 18.9 12.5 24 12.5c2.6 0 5 .9 6.9 2.5l6-6C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/><path fill="#4CAF50" d="M24 45.5c5.3 0 10.1-1.8 13.8-4.9l-6.4-5.4C29.3 36.7 26.8 37.5 24 37.5c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.6 41 16.2 45.5 24 45.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.6-2.6 4.8-4.9 6.2l6.4 5.4C39.9 37 44.5 31.8 44.5 25c0-1.6-.2-3.1-.4-4.5z"/></svg>
export default function LoginView({onLogin,onCredentialLogin,onGoogleLogin}){
 const [username,setUsername]=useState('admin'),[password,setPassword]=useState('admin123'),[error,setError]=useState('')
 const [googleOpen,setGoogleOpen]=useState(false),[googleEmail,setGoogleEmail]=useState(''),[googleError,setGoogleError]=useState('')
 const submit=e=>{
  e.preventDefault()
  if(!username.trim()||!password){setError('Ingresa usuario y contraseña.');return}
  if(!onCredentialLogin(username.trim(),password))setError('Usuario o contraseña incorrectos, o la cuenta está inactiva.')
 }
 const submitGoogle=e=>{
  e.preventDefault()
  if(!googleEmail.trim()){setGoogleError('Ingresa tu correo institucional.');return}
  if(!onGoogleLogin(googleEmail.trim()))setGoogleError('No existe una cuenta con ese correo institucional.')
 }
 return <div className="login-page"><div className="login-brand"><div className="login-logo">A</div><div><span>IESTP ARIB</span><h1>Mesa de Partes Digital</h1><p>Recepción, proveído, recorrido por oficinas y trazabilidad de expedientes.</p></div><div className="login-flow"><b>Flujo institucional</b><div><span>Mesa de Partes</span><i>→</i><span>Dirección</span><i>→</i><span>Oficinas</span><i>→</i><span>Cierre</span></div></div></div><div className="login-card"><span className="eyebrow">ACCESO AL SISTEMA</span><h2>Bienvenido</h2><p>Ingresa con tu correo institucional de Google o con tu usuario y contraseña.</p>
  {!googleOpen?<button type="button" className="btn google full" onClick={()=>setGoogleOpen(true)}><GoogleIcon/> Continuar con Google</button>
  :<form onSubmit={submitGoogle} className="google-inline"><label><span>Correo institucional</span><div><Mail size={17}/><input autoFocus placeholder="nombre@arib.edu.pe" value={googleEmail} onChange={e=>{setGoogleEmail(e.target.value);setGoogleError('')}}/></div></label>{googleError&&<div className="login-error">{googleError}</div>}<div className="google-inline-actions"><button type="button" className="btn ghost" onClick={()=>{setGoogleOpen(false);setGoogleError('')}}>Cancelar</button><button type="submit" className="btn google full"><GoogleIcon/> Continuar</button></div></form>}
  <div className="demo-divider"><span>O CON TU USUARIO</span></div>
  <form onSubmit={submit}><label><span>Usuario</span><div><Mail size={17}/><input value={username} onChange={e=>{setUsername(e.target.value);setError('')}}/></div></label><label><span>Contraseña</span><div><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}}/></div></label>{error&&<div className="login-error">{error}</div>}<button type="submit" className="btn primary full"><ArrowRight size={17}/> Ingresar</button></form>
  <div className="demo-divider"><span>ACCESOS RÁPIDOS PARA LA DEMO</span></div><div className="demo-profiles">{PROFILES.map(p=>{const Icon=icons[p.id];return <button key={p.id} onClick={()=>onLogin(p.id)}><Icon size={16}/><div><b>{p.label}</b><span>{p.description}</span></div></button>})}</div></div></div>
}
