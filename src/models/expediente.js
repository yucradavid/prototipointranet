export const STATUS_LABELS={SOLICITUD_VIRTUAL:'Solicitud virtual',EN_DIRECCION:'Pendiente de proveído',EN_OFICINA:'En atención',OBSERVADO:'Observado',RESPUESTA_MESA:'Respuesta en Mesa de Partes',FINALIZADO:'Finalizado'}
export const STATUS_TONES={SOLICITUD_VIRTUAL:'info',EN_DIRECCION:'warning',EN_OFICINA:'primary',OBSERVADO:'danger',RESPUESTA_MESA:'success',FINALIZADO:'neutral'}
export const statusLabel=s=>STATUS_LABELS[s]||s
export const statusTone=s=>STATUS_TONES[s]||'neutral'
