import React from 'react'
import { Printer, X, ShieldCheck } from 'lucide-react'
import { procedureById } from '../data/catalogs'

export default function ReciboPagoModal({ exp, onClose }) {
  if (!exp?.pago) return null
  const proc = procedureById(exp.procedureId)
  const pago = exp.pago

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal lg">
        <div className="modal-head no-print">
          <div>
            <h3>Recibo de Caja — Tesorería</h3>
            <p>Comprobante oficial del pago registrado para este expediente. Puedes imprimirlo o guardarlo como PDF.</p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar ventana">
            <X size={18} />
          </button>
        </div>

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
                  RECIBO DE CAJA — TESORERÍA
                </h4>
                <em style={{ fontSize: 11, color: '#059669', fontStyle: 'normal', fontWeight: 700 }}>
                  CONSTANCIA DE PAGO POR DERECHO DE TRÁMITE
                </em>
              </div>

              <div
                className="cargo-stamp"
                style={{
                  border: '2px dashed #22c55e',
                  background: '#f0fdf4',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textAlign: 'center',
                  minWidth: 170
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                  <ShieldCheck size={14} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                    PAGO CONFORME
                  </span>
                </div>
                <b style={{ fontSize: 15, color: '#091a2b', display: 'block', margin: '2px 0' }}>
                  EXP. N.° {exp.numero}
                </b>
                <small style={{ fontSize: 11, color: '#334155', display: 'block' }}>
                  {pago.fecha || exp.fecha}
                </small>
                <small style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 2 }}>
                  Tesorería · IESTP ARIB
                </small>
              </div>
            </div>

            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                I. Concepto del pago
              </b>
              <p style={{ margin: 0, fontSize: 13, color: '#1e293b', fontWeight: 600 }}>
                Derecho de trámite: {proc?.name || exp.asunto}
              </p>
            </div>

            <div className="cargo-fut-section" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                II. Datos del pagador
              </b>
              <div
                className="cargo-fut-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', fontSize: 12 }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Apellidos y Nombres:</span>
                  <b style={{ color: '#091a2b' }}>{exp.solicitante}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>N.° Documento (DNI):</span>
                  <b style={{ color: '#091a2b' }}>{exp.dni || '—'}</b>
                </div>
              </div>
            </div>

            <div className="cargo-fut-section" style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              <b style={{ fontSize: 12, color: '#091a2b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                III. Detalle del pago
              </b>
              <div
                className="cargo-fut-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', fontSize: 12 }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Monto pagado:</span>
                  <b style={{ color: '#16a34a', fontSize: 15 }}>S/ {Number(pago.monto).toFixed(2)}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Método de pago:</span>
                  <b style={{ color: '#091a2b' }}>{pago.metodo}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>N.° de operación / voucher:</span>
                  <b style={{ color: '#091a2b' }}>{pago.voucher}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Fecha de pago:</span>
                  <b style={{ color: '#091a2b' }}>{pago.fecha || '—'}</b>
                </div>
                {pago.comprobante && (
                  <div className="span2" style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Evidencia adjunta:</span>
                    <a href={pago.comprobante} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700 }}>
                      Ver captura / voucher escaneado
                    </a>
                  </div>
                )}
              </div>
            </div>

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
                <b style={{ fontSize: 12, color: '#091a2b', display: 'block' }}>Ichuña, {pago.fecha || exp.fecha}</b>
                <span style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #94a3b8', display: 'block', marginTop: 30, paddingTop: 4 }}>
                  Lugar y fecha de pago
                </span>
              </div>
              <div>
                <b style={{ fontSize: 12, color: '#091a2b', display: 'block' }}>Tesorería · IESTP ARIB</b>
                <span style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #94a3b8', display: 'block', marginTop: 30, paddingTop: 4 }}>
                  Firma y sello del cajero
                </span>
              </div>
            </div>

            <p className="cargo-footnote" style={{ fontSize: 11, color: '#64748b', textAlign: 'center', margin: '20px 0 4px', fontStyle: 'italic' }}>
              Este recibo acredita el pago del derecho de trámite ante la Tesorería del IESTP ARIB. Consérvelo como constancia.
            </p>
          </div>
        </div>

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
