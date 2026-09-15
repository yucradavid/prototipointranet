import React from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import OfficeWorkbenchView from './OfficeWorkbenchView'

export default function AdminOfficeOperationsView({ offices, officeId, setOfficeId, ...officeProps }) {
  const routableOffices = (offices || []).filter(o => !['mesa_partes', 'direccion'].includes(o.id))
  const current = routableOffices.find(o => o.id === officeId) || routableOffices[0]

  return (
    <div>
      <div className="office-switcher">
        <ShieldCheck size={18} style={{ color: current?.color || '#0284c7', flex: 'none' }} />
        <span>Administrador operando como superusuario en:</span>
        <div className="office-switcher-select">
          <select value={current?.id || ''} onChange={e => setOfficeId(e.target.value)}>
            {routableOffices.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      {/* key=officeId fuerza a reiniciar el estado interno (caso seleccionado, filtros)
          al cambiar de oficina, para no arrastrar la selección de una oficina a otra. */}
      <OfficeWorkbenchView key={current?.id} officeId={current?.id} offices={offices} {...officeProps} />
    </div>
  )
}
