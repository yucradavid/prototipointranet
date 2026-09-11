import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './ui'

export default function ConfirmModal({open,title='Confirmar acción',message,confirmLabel='Confirmar',danger=true,onConfirm,onCancel}){
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button className={danger?'btn danger':'btn primary'} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <AlertTriangle size={22} color={danger?'#ef4444':'#0284c7'} style={{flexShrink:0,marginTop:2}}/>
        <p style={{margin:0,fontSize:13,lineHeight:1.55,color:'var(--text)'}}>{message}</p>
      </div>
    </Modal>
  )
}
