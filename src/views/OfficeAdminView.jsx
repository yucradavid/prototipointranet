import React, { useState } from 'react'
import { Building2, Wallet, Plus, Pencil, Trash2, Search, GitBranch, Users, LockKeyhole } from 'lucide-react'
import { Panel, Badge, Modal, Field } from '../components/ui'
import { fuzzyFilter } from '../utils/search.js'
import { slugify } from '../data/catalogs.js'
import './OfficeAdminView.css'

const emptyOffice = { name: '', short: '', color: '#0284c7', roleTitle: 'Encargado', note: '', provisional: false, collectsPayment: false }
const isFixed = office => ['mesa_partes', 'direccion'].includes(office.id)
const isSub = office => office.id !== 'tesoreria' && !!office.collectsPayment

export default function OfficeAdminView({ offices, procedures, users, onSaveOffice, onDeleteOffice, onOpenUsers, onOpenPermissions }) {
  const [section, setSection] = useState('treasury')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null)
  const [error, setError] = useState('')
  const [existingQuery, setExistingQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const treasury = offices.find(o => o.id === 'tesoreria')
  const subs = offices.filter(isSub)
  const otherOffices = offices.filter(o => o.id !== 'tesoreria' && !isSub(o))
  const candidates = otherOffices.filter(o => !isFixed(o))
  const shown = fuzzyFilter(section === 'treasury' ? subs : otherOffices, query, o => `${o.name} ${o.short} ${o.roleTitle || ''}`)
  const activeUsers = id => users.filter(u => u.office === id && u.role === 'oficina' && u.active !== false)
  const officeProcedures = id => procedures.filter(p => (p.route || []).includes(id))
  const openEditor = (draft, mode = 'edit') => { setEditor({ draft: { ...draft }, mode }); setError(''); setExistingQuery('') }
  const update = values => { setEditor(current => ({ ...current, draft: { ...current.draft, ...values } })); setError('') }
  const draft = editor?.draft
  const enabling = editor?.mode === 'existing'
  const original = draft?.id && offices.find(o => o.id === draft.id)
  const matches = fuzzyFilter(candidates, existingQuery, o => `${o.name} ${o.short}`)
  const save = async event => {
    event.preventDefault()
    if (saving) return
    if (enabling && !draft.id) { setError('Selecciona la comisión u oficina que deseas habilitar.'); return }
    if (!draft.name.trim()) { setError('Escribe el nombre de la oficina o comisión.'); return }
    if (offices.some(o => o.id !== draft.id && (o.id === slugify(draft.name) || slugify(o.name) === slugify(draft.name)))) {
      setError('Ya existe una oficina o comisión con ese nombre. Usa «Habilitar existente» para conservar sus datos.'); return
    }
    if (!/^#[\da-f]{6}$/i.test(draft.color)) { setError('El color debe tener el formato #0284c7.'); return }
    setSaving(true)
    try {
      const result = await onSaveOffice(draft)
      if (result === false) { setError('No se pudo guardar. Revisa el aviso e inténtalo de nuevo.'); return }
      setSection(draft.collectsPayment || draft.id === 'tesoreria' ? 'treasury' : 'offices')
      setQuery('')
      setEditor(null)
    } catch {
      setError('No se pudo guardar. Tus cambios siguen en el formulario para volver a intentarlo.')
    } finally { setSaving(false) }
  }

  return (
    <Panel title="Oficinas y Dependencias" subtitle="Organiza las oficinas de la institución y las comisiones que cobran a través de una subtesorería." className="office-admin">
      <div className="oa-body">
        <div className="oa-toolbar">
          <div className="oa-sections" aria-label="Grupos de oficinas">
            <button type="button" aria-pressed={section === 'treasury'} onClick={() => { setSection('treasury'); setQuery('') }}><Wallet size={17} /><span>Tesorería y subtesorerías</span><b>{subs.length + (treasury ? 1 : 0)}</b></button>
            <button type="button" aria-pressed={section === 'offices'} onClick={() => { setSection('offices'); setQuery('') }}><Building2 size={17} /><span>Otras oficinas</span><b>{otherOffices.length}</b></button>
          </div>
          <label className="search-mini oa-search"><Search size={16} /><input aria-label="Buscar oficina o comisión" placeholder="Buscar por nombre o siglas…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" className="btn ghost" onClick={() => setQuery('')}>Limpiar</button>}</label>
        </div>
        {section === 'treasury' ? <>
          <div className="oa-treasury">
            <div className="oa-treasury-icon"><Wallet size={27} /></div>
            <div className="oa-treasury-info"><Badge tone="success">Caja principal</Badge><h2>{treasury?.name || 'Tesorería no registrada'}</h2><p>{treasury?.roleTitle || 'Revisa el catálogo institucional.'}</p><p>Las comisiones habilitadas se organizan aquí como subtesorerías.</p></div>
            {treasury && <button className="btn ghost" onClick={() => openEditor(treasury)}><Pencil size={15} /> Editar Tesorería</button>}
          </div>
          <div className="oa-section-head">
            <div><h3><GitBranch size={19} /> Subtesorerías de comisiones <span>{subs.length}</span></h3><p>Crea una comisión nueva o habilita una que ya está registrada.</p></div>
            <div className="oa-actions"><button className="btn ghost" disabled={!treasury || !candidates.length} onClick={() => openEditor({ ...emptyOffice, collectsPayment: true }, 'existing')}><Building2 size={15} /> Habilitar existente</button><button className="btn primary" disabled={!treasury} onClick={() => openEditor({ ...emptyOffice, color: '#16a34a', collectsPayment: true }, 'new-sub')}><Plus size={16} /> Nueva subtesorería</button></div>
          </div>
          {shown.length ? <div className="oa-cards">{shown.map(o => <article className="oa-card" key={o.id}>
            <div className="oa-card-heading"><span className="oa-office-icon" style={{ borderColor: o.color }}><Wallet size={20} /></span><div><h4>{o.name}</h4><span>{o.short} · Subtesorería de {treasury?.name || 'Tesorería'}</span></div><Badge tone={o.provisional ? 'warning' : 'success'}>{o.provisional ? 'Provisional' : 'Habilitada'}</Badge></div>
            <p className="oa-role">{o.roleTitle || 'Encargado'}</p>
            <div className="oa-metrics"><span><Users size={14} /> {activeUsers(o.id).length} usuario(s) activo(s)</span><span><GitBranch size={14} /> {officeProcedures(o.id).length} trámite(s) en catálogo</span></div>
            {!activeUsers(o.id).length && <p className="oa-notice">Pendiente: asignar un usuario en Usuarios y Accesos.</p>}
            {!officeProcedures(o.id).length && <p className="oa-notice">Pendiente: incluir esta comisión en la ruta de sus trámites.</p>}
            {o.provisional && <p className="oa-notice">Confirma esta dependencia con la institución antes de usarla.</p>}
            {o.note && <details className="oa-details"><summary>Notas institucionales</summary><p>{o.note}</p></details>}
            <div className="oa-card-actions"><button className="btn ghost" onClick={() => openEditor(o)} aria-label={`Editar ${o.name}`}><Pencil size={14} /> Editar subtesorería</button><button className="btn danger-soft" onClick={() => onDeleteOffice(o.id)} aria-label={`Eliminar ${o.name}`} title={`Eliminar ${o.name}`}><Trash2 size={15} /></button></div>
          </article>)}</div> : <div className="oa-empty"><GitBranch size={30} /><h4>{query ? 'No hay subtesorerías que coincidan' : 'Aún no hay subtesorerías habilitadas'}</h4><p>{query ? 'Prueba otro nombre o limpia la búsqueda. Tesorería permanece visible como referencia.' : 'Si la comisión ya existe, usa «Habilitar existente». Sus usuarios y trámites se conservarán.'}</p></div>}
          <div className="oa-help"><div><b>Para que una subtesorería pueda operar</b><p>Asigna sus usuarios, revisa sus permisos de cobro e inclúyela en las rutas correspondientes. Habilitarla aquí no modifica los permisos ni las rutas.</p></div><div className="oa-actions"><button className="btn ghost" onClick={onOpenUsers}>Usuarios y Accesos</button><button className="btn ghost" onClick={onOpenPermissions}>Roles y Permisos</button></div></div>
        </> : <>
          <div className="oa-section-head"><div><h3>Oficinas institucionales</h3><p>Mesa de Partes y Dirección son dependencias protegidas.</p></div><button className="btn primary" onClick={() => openEditor(emptyOffice, 'new-office')}><Plus size={16} /> Nueva oficina</button></div>
          <div className="table-wrap"><table><thead><tr><th>Oficina / Dependencia</th><th>Siglas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            {!shown.length && <tr><td colSpan={4}>Sin oficinas que coincidan con la búsqueda.</td></tr>}
            {shown.map(o => <tr key={o.id}><td><div className="oa-office-name"><span className="oa-color" style={{ background: o.color }} /><div><b>{o.name}</b><small>{o.roleTitle || 'Encargado'}</small></div></div></td><td>{o.short}</td><td><Badge tone={isFixed(o) ? 'neutral' : o.provisional ? 'warning' : 'info'}>{isFixed(o) ? 'Protegida' : o.provisional ? 'Provisional' : 'Operativa'}</Badge></td><td>{isFixed(o) ? <span className="oa-protected"><LockKeyhole size={14} /> Fija</span> : <div className="oa-actions"><button className="btn ghost" aria-label={`Editar ${o.name}`} onClick={() => openEditor(o)}><Pencil size={14} /> Editar</button><button className="btn danger-soft" aria-label={`Eliminar ${o.name}`} title={`Eliminar ${o.name}`} onClick={() => onDeleteOffice(o.id)}><Trash2 size={14} /></button></div>}</td></tr>)}
          </tbody></table></div>
        </>}
      </div>
      <Modal open={!!editor} onClose={() => { if (!saving) setEditor(null) }} size="md"
        title={enabling ? 'Habilitar una comisión existente' : draft?.id === 'tesoreria' ? 'Editar Tesorería' : draft?.id ? (isSub(draft) ? 'Editar subtesorería' : 'Editar oficina') : draft?.collectsPayment ? 'Nueva subtesorería' : 'Nueva oficina'}
        subtitle={enabling ? 'Selecciona su registro actual para conservar usuarios, trámites e historial.' : draft?.collectsPayment ? 'Configura la comisión que cobrará y validará pagos de sus trámites.' : 'Registra los datos de la dependencia institucional.'}
        footer={<><button className="btn ghost" disabled={saving} onClick={() => setEditor(null)}>Cancelar</button><button className="btn primary" type="submit" form="office-editor" disabled={saving || !draft?.name?.trim() || (enabling && !draft?.id)}>{saving ? 'Guardando…' : enabling ? 'Habilitar subtesorería' : 'Guardar cambios'}</button></>}>
        {editor && <form id="office-editor" onSubmit={save} className="oa-form">
          {enabling && <div className="oa-existing-picker"><Field label="Buscar comisión u oficina"><input value={existingQuery} onChange={e => setExistingQuery(e.target.value)} placeholder="Ej. Admisión o Formación Continua" /></Field><Field label="Comisión u oficina existente" required><select value={draft.id || ''} onChange={e => { const selected = candidates.find(o => o.id === e.target.value); setEditor({ mode: 'existing', draft: selected ? { ...selected, collectsPayment: true } : { ...emptyOffice, collectsPayment: true } }); setError('') }}><option value="">Selecciona una dependencia…</option>{candidates.filter(o => o.id === draft.id || matches.includes(o)).map(o => <option key={o.id} value={o.id}>{o.name} ({o.short})</option>)}</select></Field></div>}
          {(!enabling || draft.id) && <>
            {draft.id === 'tesoreria' ? <div className="oa-form-context"><Wallet size={19} /><div><b>Caja principal de la institución</b><p>Las subtesorerías se administran desde la sección de comisiones.</p></div></div> : enabling || editor.mode === 'new-sub' ? <div className="oa-form-context"><GitBranch size={19} /><div><b>Subtesorería de {treasury?.name || 'Tesorería'}</b><p>La comisión podrá cobrar y validar pagos en sus trámites.</p></div></div> : <Field label="Función de esta dependencia" hint="Una subtesorería cobra y valida pagos de los trámites que pasan por ella."><select value={draft.collectsPayment ? 'sub' : 'office'} onChange={e => update({ collectsPayment: e.target.value === 'sub' })}><option value="office">Oficina sin cobro de pagos</option><option value="sub" disabled={!treasury}>Subtesorería de Tesorería (comisión con cobro)</option></select></Field>}
            {original?.collectsPayment && !draft.collectsPayment && <p className="oa-notice">Al guardar dejará de cobrar y aparecerá en Otras oficinas. Revisa sus trámites pendientes antes de deshabilitar el cobro.</p>}
            <div className="form-grid two">
              <Field label={draft.collectsPayment && draft.id !== 'tesoreria' ? 'Nombre de la comisión o dependencia' : 'Nombre oficial'} required><input autoFocus={!enabling} value={draft.name} onChange={e => update({ name: e.target.value })} placeholder={draft.collectsPayment ? 'Ej. Comisión de Admisión' : 'Ej. Unidad de Bienestar'} required /></Field>
              <Field label="Siglas" hint="Si las dejas vacías, se generan al guardar."><input value={draft.short || ''} maxLength={8} onChange={e => update({ short: e.target.value.toUpperCase() })} placeholder="Ej. ADM" /></Field>
              <Field label="Cargo del responsable" hint="El usuario responsable se asigna en Usuarios y Accesos."><input value={draft.roleTitle || ''} onChange={e => update({ roleTitle: e.target.value })} placeholder="Ej. Presidente de Comisión" /></Field>
              <Field label="Estado institucional"><select value={draft.provisional ? 'provisional' : 'confirmed'} onChange={e => update({ provisional: e.target.value === 'provisional' })}><option value="confirmed">Confirmada</option><option value="provisional">Provisional · pendiente de validar</option></select></Field>
            </div>
            <details className="oa-details"><summary>Color y notas institucionales</summary><div className="oa-secondary-fields"><Field label="Color representativo"><input type="color" value={draft.color} onChange={e => update({ color: e.target.value })} /></Field><Field label="Notas institucionales"><textarea rows={3} value={draft.note || ''} onChange={e => update({ note: e.target.value })} placeholder="Referencias o aclaraciones de esta dependencia" /></Field></div></details>
            {enabling && <p className="oa-preserve">Se actualizará «{original?.name}». Se conservarán sus {activeUsers(draft.id).length} usuario(s) activo(s) y sus {officeProcedures(draft.id).length} trámite(s) del catálogo, sin crear otra oficina.</p>}
          </>}
          {error && <p role="alert" className="oa-error">{error}</p>}
        </form>}
      </Modal>
    </Panel>
  )
}
