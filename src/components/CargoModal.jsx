import React from 'react'
import { Printer, X } from 'lucide-react'

export default function CargoModal({exp,onClose}){
  if(!exp) return null
  const comprobante=exp.numero||exp.tracking
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
    <div className="modal lg">
      <div className="modal-head no-print"><div><h3>Cargo de recepción — FUT</h3><p>Copia sellada de tu Formulario Único de Trámite. Imprímela o guárdala como PDF.</p></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>
      <div className="modal-body cargo-print">
        <div className="cargo-fut">
          <div className="cargo-fut-head">
            <div className="cargo-fut-title">
              <b>Instituto de Educación Superior Tecnológico Público</b>
              <span>"ALIANZA RENOVADA ICHUÑA BÉLGICA"</span>
              <small>RM N.° 0353-2004-ED</small>
              <h4>FORMULARIO ÚNICO DE TRÁMITE (FUT)</h4>
              <em>DISTRIBUCIÓN GRATUITA</em>
            </div>
            <div className="cargo-stamp">
              <span>RECIBIDO</span>
              <b>{exp.numero?`EXP. N.° ${exp.numero}`:comprobante}</b>
              <small>{exp.fecha} · {exp.hora}</small>
              <small>Mesa de Partes · IESTP ARIB</small>
            </div>
          </div>

          <div className="cargo-fut-section"><b>I. Resumen de su pedido</b><p>{exp.asunto}</p></div>
          <div className="cargo-fut-section"><b>II. Dependencia o autoridad a quien se dirige</b><p>Dirección — IESTP ARIB</p></div>
          <div className="cargo-fut-section">
            <b>III. Datos del solicitante</b>
            <div className="cargo-fut-grid">
              <div><span>Apellidos y nombres</span><b>{exp.solicitante}</b></div>
              <div><span>Condición</span><b>{exp.condicion}</b></div>
              <div className="span2"><span>Programa de estudios</span><b>{exp.programa}</b></div>
              <div><span>DNI</span><b>{exp.dni}</b></div>
              <div><span>Celular</span><b>{exp.celular}</b></div>
              <div className="span2"><span>Correo electrónico</span><b>{exp.correo}</b></div>
              <div className="span2"><span>Dirección</span><b>{exp.direccion}</b></div>
            </div>
          </div>
          <div className="cargo-fut-section"><b>IV. Fundamento del pedido</b><p>{exp.fundamento}</p></div>
          <div className="cargo-fut-section"><b>V. Documentos que se adjuntan</b>
            {exp.adjuntos?.length?<ul>{exp.adjuntos.map((a,i)=><li key={i}>{a.name}{a.url?' (Google Drive)':''}</li>)}</ul>:<p>Ninguno</p>}
          </div>

          <div className="cargo-fut-footer">
            <div><b>Ichuña, {exp.fecha}</b><span>Lugar y fecha</span></div>
            <div><b>{exp.solicitante}</b><span>Firma del usuario</span></div>
          </div>
          <p className="cargo-footnote">Declaro que los datos presentados en el presente formulario los realizo con carácter de Declaración Jurada.</p>
          {!exp.numero&&<p className="cargo-footnote">Secretaría validará tu solicitud y te asignará el N.° de expediente definitivo. Usa el código {comprobante} para hacer seguimiento mientras tanto.</p>}
        </div>
      </div>
      <div className="modal-footer no-print"><button className="btn ghost" onClick={onClose}>Cerrar</button><button className="btn primary" onClick={()=>window.print()}><Printer size={16}/> Imprimir / Guardar como PDF</button></div>
    </div>
  </div>
}
