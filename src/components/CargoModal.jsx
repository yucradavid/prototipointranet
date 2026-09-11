import React from 'react'
import { Printer, X, ShieldCheck, Download, CheckCircle2 } from 'lucide-react'

export default function CargoModal({ exp, onClose }) {
  if (!exp) return null

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal lg">
        {/* Modal Header (hidden during print) */}
        <div className="modal-head no-print">
          <div>
            <h3>Cargo Oficial de Recepción — FUT Digital</h3>
            <p>Comprobante oficial sellado de tu Formulario Único de Trámite. Puedes imprimirlo o guardarlo como PDF.</p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar ventana">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: The FUT Print Document */}
        <div className="modal-body cargo-print" style={{ padding: '24px 20px', background: '#f8fafc' }}>
          <div
            className="cargo-fut"
            style={{
              background: '#ffffff',
              border: '2px solid #091a2b',
              borderRadius: 6,
              padding: '24px 28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            {/* Header: Institution + Official Stamp */}
            <div
              className="cargo-fut-head"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #091a2b',
                paddingBottom: 16,
                marginBottom: 16,
                gap: 16
              }}
            >
              <div className="cargo-fut-title" style={{ flex: 1 }}>
                <b style={{ fontSize: 13, textTransform: 'uppercase', color: '#091a2b', display: 'block', letterSpacing: '0.02em' }}>
                  Instituto de Educación Superior Tecnológico Público
                </b>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0284c7', display: 'block', marginTop: 2 }}>
                  "ALIANZA RENOVADA ICHUÑA BÉLGICA"
                </span>
                <small style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 2 }}>
                  Revalidado con RM N.° 0353-2004-ED · Ichuña, Moquegua
                </small>
                <h4 style={{ margin: '10px 0 2px', fontSize: 15, fontWeight: 800, color: '#091a2b', letterSpacing: '0.04em' }}>
                  FORMULARIO ÚNICO DE TRÁMITE (FUT)
                </h4>
                <em style={{ fontSize: 11, color: '#059669', fontStyle: 'normal', fontWeight: 700 }}>
                  DISTRIBUCIÓN GRATUITA · MESA DE PARTES DIGITAL
                </em>
              </div>

              {/* Official Receipt Stamp */}
              <div
                className="cargo-stamp"
                style={{
                  border: '2px dashed #0284c7',
                  background: '#f0f9ff',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textAlign: 'center',
                  minWidth: 170
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                  <ShieldCheck size={14} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                    RECIBIDO OFICIAL
                  </span>
                </div>
                <b style={{ fontSize: 15, color: '#091a2b', display: 'block', margin: '2px 0' }}>
                  EXP. N.° {exp.numero || exp.tracking}
                </b>
                <small style={{ fontSize: 11, color: '#334155', display: 'block' }}>
                  {exp.fecha} · {exp.hora}
                </small>
                <small style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 2 }}>
                  Mesa de Partes · IESTP ARIB
                </small>
              </div>
            </div>

            {/* Section I */}
            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                I. Resumen de su pedido
              </b>
              <p style={{ margin: 0, fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{exp.asunto}</p>
            </div>

            {/* Section II */}
            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                II. Dependencia o autoridad a quien se dirige
              </b>
              <p style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>Dirección General — IESTP Alianza Renovada Ichuña Bélgica</p>
            </div>

            {/* Section III */}
            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                III. Datos del solicitante
              </b>
              <div
                className="cargo-fut-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px 16px',
                  fontSize: 12
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Apellidos y Nombres:</span>
                  <b style={{ color: '#091a2b' }}>{exp.solicitante}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Condición:</span>
                  <b style={{ color: '#091a2b' }}>{exp.condicion || 'Estudiante'}</b>
                </div>
                <div className="span2" style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Programa de Estudios:</span>
                  <b style={{ color: '#091a2b' }}>{exp.programa || '—'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>N.° Documento (DNI):</span>
                  <b style={{ color: '#091a2b' }}>{exp.dni || '—'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Teléfono / Celular:</span>
                  <b style={{ color: '#091a2b' }}>{exp.celular || '—'}</b>
                </div>
                <div className="span2" style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Correo Electrónico:</span>
                  <b style={{ color: '#091a2b' }}>{exp.correo || '—'}</b>
                </div>
                <div className="span2" style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Dirección domiciliaria:</span>
                  <b style={{ color: '#091a2b' }}>{exp.direccion || '—'}</b>
                </div>
              </div>
            </div>

            {/* Section IV */}
            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                IV. Fundamento del pedido
              </b>
              <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                {exp.fundamento || 'Sin fundamento registrado.'}
              </p>
            </div>

            {/* Section V */}
            <div className="cargo-fut-section" style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                V. Documentos que se adjuntan
              </b>
              {exp.adjuntos?.length ? (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: '#334155' }}>
                  {exp.adjuntos.map((a, i) => (
                    <li key={i}>
                      {a.name} {a.url ? <span style={{ color: '#0284c7' }}>(Google Drive vinculado)</span> : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>Ningún archivo adjunto.</p>
              )}
            </div>

            {/* Signatures and Date */}
            <div
              className="cargo-fut-footer"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 20,
                marginTop: 24,
                paddingTop: 16,
                textAlign: 'center'
              }}
            >
              <div>
                <b style={{ fontSize: 12, color: '#091a2b', display: 'block' }}>Ichuña, {exp.fecha}</b>
                <span style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #94a3b8', display: 'block', marginTop: 30, paddingTop: 4 }}>
                  Lugar y fecha de presentación
                </span>
              </div>
              <div>
                <b style={{ fontSize: 12, color: '#091a2b', display: 'block' }}>{exp.solicitante}</b>
                <span style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #94a3b8', display: 'block', marginTop: 30, paddingTop: 4 }}>
                  Firma del Usuario / Solicitante
                </span>
              </div>
            </div>

            {/* Footnotes */}
            <p className="cargo-footnote" style={{ fontSize: 11, color: '#64748b', textAlign: 'center', margin: '20px 0 4px', fontStyle: 'italic' }}>
              "Declaro bajo juramento que los datos y documentos consignados en el presente formulario son auténticos y veraces."
            </p>
            {exp.estado === 'SOLICITUD_VIRTUAL' && (
              <p className="cargo-footnote" style={{ fontSize: 11, color: '#0284c7', textAlign: 'center', margin: 0, fontWeight: 600 }}>
                Este es su número definitivo de expediente desde el momento del registro. Mesa de Partes validará los requisitos y lo derivará a Dirección General.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="modal-footer no-print">
          <button className="btn ghost" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn primary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir / Guardar como PDF
          </button>
        </div>
      </div>
    </div>
  )
}

