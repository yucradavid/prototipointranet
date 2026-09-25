// `roleTitle`: cargo jerárquico real de quien atiende esa oficina, tal como se le llama en la
// institución (ej. Tesorería la maneja alguien con cargo de "Jefe de Unidad Administrativa" —
// un cargo distinto del rol "Administrador" del sistema, aunque compartan la palabra). Se usa
// para mostrar "Jefe de Unidad Administrativa de Tesorería" en vez de un genérico "Encargado
// de Tesorería" — el Administrador del sistema puede ajustarlo por oficina en
// "Usuarios y catálogos → Oficinas".
export const DEFAULT_OFFICES = [
  // ── Oficinas estructurales (fijas, no eliminables) ────────────────────────
  {id:'mesa_partes',    name:'Mesa de Partes / Secretaría',  short:'MP',    color:'#0788d1', roleTitle:'Encargado',
   note:'Recibe todos los expedientes (físicos y virtuales) y emite el cierre/entrega final.'},
  {id:'direccion',      name:'Dirección',                    short:'DIR',   color:'#111827', roleTitle:'Encargado',
   note:'Emite proveído institucional obligatorio en cada expediente antes de activar la ruta.'},

  // ── Oficinas operativas confirmadas ───────────────────────────────────────
  // Presentes en las rutas actuales del prototipo y en el TUSNE 2026.
  {id:'jefatura_academica',   name:'Jefatura Académica',    short:'JA',    color:'#f59e0b', roleTitle:'Encargado',
   note:'TUSNE: "Jefe de Unidad Académica / Jefatura Académica". Aprueba o firma en múltiples trámites.'},
  {id:'tesoreria',            name:'Tesorería',              short:'TES',   color:'#22c55e', roleTitle:'Jefe de Unidad Administrativa',
   note:'TUSNE: "Caja de Unidad Administrativa". Valida y registra el pago del derecho de trámite.'},
  {id:'biblioteca',           name:'Biblioteca',             short:'BIB',   color:'#d946ef', roleTitle:'Encargado',
   note:'TUSNE: "Área de Biblioteca". Atiende constancias de biblioteca.'},
  {id:'efsrt',                name:'EFSRT',                  short:'EFSRT', color:'#fb7185', roleTitle:'Encargado',
   note:'Unidad de Experiencia Formativa en Situación Real de Trabajo. Atiende IEFSRT y convalidaciones.'},
  {id:'unidad_academica',     name:'Unidad Académica',       short:'UA',    color:'#8b5cf6', roleTitle:'Encargado',
   note:'TUSNE: "Unidad Académica / Coordinación de Área Académica". Confirmar si es la misma oficina.'},
  {id:'secretaria_academica', name:'Secretaría Académica',   short:'SA',    color:'#06b6d4', roleTitle:'Encargado',
   note:'TUSNE: "Secretaría Académica". Aprueba y emite constancias, certificados y trámites de egreso.'},

  // ── Oficinas confirmadas por la institución (2026-09-24) ───────────────────
  // Aparecían en el TUSNE 2026 sin confirmar si eran oficinas separadas o cargos
  // dentro de otra dependencia. El Líder Técnico confirmó las 4 como oficinas
  // reales con bandeja propia; quedan sin `provisional` desde esa fecha.
  {id:'fedatario',            name:'Fedatario de Unidad Administrativa', short:'FED',  color:'#94a3b8', roleTitle:'Fedatario',
   note:'TUSNE fila 105: atiende autenticación de documentos.'},
  {id:'coordinacion_academica', name:'Coordinación de Área Académica',  short:'CAA',  color:'#a78bfa', roleTitle:'Coordinador',
   note:'TUSNE filas 129/131: término de recuperación y evaluación extraordinaria.'},
  {id:'formacion_continua',   name:'Unidad de Formación Continua',      short:'UFC',  color:'#f97316', roleTitle:'Jefe de Unidad',
   note:'TUSNE filas 184–190: inicio de cursos virtuales, presenciales y de actualización.'},
  {id:'comision_admision',    name:'Comisión de Admisión',              short:'ADM',  color:'#64748b', roleTitle:'Presidente de Comisión',
   note:'TUSNE filas 9/17: aprueba inscripciones para examen de admisión.'},
]

// ─── Catálogo de trámites ────────────────────────────────────────────────────
// requirementsList: array estructurado de requisitos (type: form | document | payment | condition).
// requires: texto legacy, se conserva para compatibilidad con expedientes guardados.
// Trámites del grupo 1 (TUSNE confirmados) tienen source y tariffStatus; los heredados
// del prototipo inicial conservan sus valores sin alterar expedientes existentes.
// PENDIENTE DE INGENIERÍA: confirmar vigencia normativa, ruta de cada trámite y
// momento de verificación del pago antes de activar tariffStatus='fixed' en producción.
export const DEFAULT_PROCEDURES = [
  // ── Trámites del TUSNE 2026 (grupos 1–4) ──────────────────────────────────
  // Todos con source confirmado. Los heredados del prototipo sin respaldo en el
  // Excel han sido eliminados. Rutas propuestas pendientes de validación institucional.
  {
    id:'const_biblioteca',
    name:'Constancia de biblioteca',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Constancia de Biblioteca"', type:'payment', required:true},
    ],
    sla:2,
    route:['biblioteca'],
    monto:25,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · fila 89',
    validFrom:'',
    verificationStatus:'pending',
  },
  {
    id:'cert_modular',
    name:'Certificado modular',
    category:'Certificados',
    requires:'FUT + Foto + Constancia de EFSRT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Una (01) foto tamaño carnet a color o blanco y negro', type:'document', required:true},
      {label:'Constancia de EFSRT', type:'document', required:true},
      {label:'Recibo de pago por "Certificado Modular"', type:'payment', required:true},
    ],
    sla:3,
    route:['tesoreria','secretaria_academica','jefatura_academica'],
    monto:40,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · fila 113',
    validFrom:'',
    verificationStatus:'pending',
  },
  {
    id:'examen_suficiencia',
    name:'Examen de suficiencia profesional',
    category:'Titulación',
    requires:'FUT + Certificado de estudios + Constancia de EFSRT + Constancia de no adeudo + Constancia de Biblioteca + Constancia de Egresado + Certificado de idiomas + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Certificado de estudios original', type:'document', required:true},
      {label:'Constancia de EFSRT original', type:'document', required:true},
      {label:'Constancia de no adeudo original', type:'document', required:true},
      {label:'Constancia de Biblioteca original', type:'document', required:true},
      {label:'Constancia de Egresado original', type:'document', required:true},
      {label:'Certificado de idiomas', type:'document', required:true},
      {label:'Pago por medalla de titulación (S/ 30)', type:'payment', required:true, note:'Concepto separado del derecho de trámite'},
      {label:'Pago por alquiler de equipos (opcional)', type:'payment', required:false, note:'Solo si el estudiante lo requiere'},
      {label:'Recibo de pago por "Examen de Suficiencia Profesional"', type:'payment', required:true},
    ],
    sla:5,
    route:['tesoreria','jefatura_academica','unidad_academica'],
    monto:200,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · filas 134–143',
    validFrom:'',
    verificationStatus:'pending',
  },
  {
    id:'const_egresado',
    name:'Constancia de egresado',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Constancia de Egresado"', type:'payment', required:true},
    ],
    sla:2,
    route:['tesoreria','secretaria_academica'],
    monto:25,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · fila 81',
    validFrom:'',
    verificationStatus:'pending',
  },
  // ── Grupo 1 (TUSNE 2026): constancias y certificados ──────────────────────
  // Tarifa, SLA y requisitos tomados literalmente del Excel.
  // Ruta propuesta en PLAN_ADECUACION; pendiente de validación institucional.
  // No activar en producción hasta confirmar vigencia y ruta con la institución.
  {
    id:'const_estudios',
    name:'Constancia de estudios',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Constancia de Estudios"', type:'payment', required:true},
    ],
    sla:2,
    route:['tesoreria','secretaria_academica'],
    monto:25,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · fila 83',
    validFrom:'',
    verificationStatus:'pending',
  },
  {
    id:'const_matricula',
    name:'Constancia de matrícula',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Constancia de Matrícula"', type:'payment', required:true},
    ],
    sla:2,
    route:['tesoreria','secretaria_academica'],
    monto:25,
    tariffStatus:'fixed',
    active:true,
    source:'TUSNE 2026 · fila 85',
    validFrom:'',
    verificationStatus:'pending',
  },
  {
    id:'cert_estudios',
    name:'Certificado de estudios',
    category:'Certificados',
    requires:'FUT + Foto tamaño carnet + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Una (01) foto tamaño carnet a color o blanco y negro', type:'document', required:true},
      // PENDIENTE: C112 menciona "Recibo de pago por autenticación de documentos" — confirmar concepto exacto.
      {label:'Recibo de pago (concepto por confirmar con la institución)', type:'payment', required:true, note:'TUSNE C112 menciona autenticación; verificar si corresponde al certificado o a un trámite adicional'},
    ],
    sla:3,
    route:['tesoreria','secretaria_academica'],
    monto:120,
    tariffStatus:'fixed',
    active:false,
    source:'TUSNE 2026 · filas 110–112',
    validFrom:'',
    verificationStatus:'pending',
  },

  // ── Grupo 2 (TUSNE 2026): documentos y constancias restantes ─────────────
  // Todos activos con tarifa fija según el Excel. Rutas propuestas; pendientes
  // de validación institucional antes de usar en producción.
  {
    id:'const_no_adeudar',
    name:'Constancia de no adeudar (Título / Traslado)',
    category:'Constancias',
    requires:'FUT + Ficha de no adeudar + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Ficha de no adeudar firmada y sellada', type:'document', required:true},
      {label:'Recibo de pago por "Constancia de No Adeudar"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 78–80', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'const_disponibilidad_vacante',
    name:'Constancia de disponibilidad de vacante',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Const. de Disponibilidad de Vacante"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 87–88', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'const_tercio_quinto',
    name:'Constancia de tercio y/o quinto superior',
    category:'Constancias',
    requires:'FUT + Foto tamaño carnet + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Una (01) foto tamaño carnet a color o blanco y negro', type:'document', required:true},
      {label:'Recibo de pago por "Constancia de Tercio - Quinto Superior"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 91–93', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'const_primera_matricula',
    name:'Constancia de primera matrícula',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Constancia de Primera Matrícula"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 94–95', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'otras_constancias',
    name:'Otras constancias',
    category:'Constancias',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Otras Constancias"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 96–97', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'copia_expediente_estudiante',
    name:'Copia del expediente del estudiante',
    category:'Copias y documentos',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Copia de Expediente del Estudiante"', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','secretaria_academica'], monto:5, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 99–100', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'record_academico',
    name:'Récord académico',
    category:'Copias y documentos',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Récord Académico"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:10, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 102–103', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'autenticacion_documentos',
    name:'Autenticación de documentos',
    category:'Copias y documentos',
    requires:'FUT + Documento original + Copia del documento + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Documento original', type:'document', required:true},
      {label:'Copia del documento original', type:'document', required:true},
      {label:'Recibo de pago por "Autenticación de Documentos"', type:'payment', required:true},
      {label:'Presentación ante Fedatario de Unidad Administrativa', type:'condition', required:true},
    ],
    sla:1, route:['tesoreria','fedatario'], monto:5, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 105–108', validFrom:'', verificationStatus:'confirmed',
  },
  {
    id:'cambio_nombre_apellido',    name:'Cambio de nombre y apellido',
    category:'Copias y documentos',
    requires:'FUT + Copia fedateada de partida de nacimiento (rectificada) + Copia legalizada del nuevo DNI + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Copia fedateada de partida de nacimiento (rectificada)', type:'document', required:true},
      {label:'Copia legalizada del nuevo Documento Nacional de Identidad', type:'document', required:true},
      {label:'Recibo de pago por "Cambio de Nombre y Apellido"', type:'payment', required:true},
    ],
    sla:15, route:['tesoreria','secretaria_academica'], monto:150, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 118–121', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'ficha_evaluacion_efsrt',
    name:'Ficha de evaluación de EFSRT',
    category:'EFSRT',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Ficha de Evaluación de EFSRT"', type:'payment', required:true},
      {label:'Revisión por Secretaría de Dirección (no confundir con IEFSRT del egresado)', type:'condition', required:true,
       note:'TUSNE: termina en Dirección General. Confirmar si aplica la misma ruta que otros trámites.'},
    ],
    sla:1, route:['tesoreria','secretaria_academica'], monto:5, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 123–124', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'copia_recibo_ingresos',
    name:'Copia de recibo de ingresos',
    category:'Copias y documentos',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Copia de Recibo de Ingresos"', type:'payment', required:true},
    ],
    sla:1, route:['tesoreria','secretaria_academica'], monto:5, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 182–183', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'copia_silabos',
    name:'Copia de sílabos (por unidad didáctica)',
    category:'Copias y documentos',
    requires:'Solicitud dirigida al Director + Recibo de pago',
    requirementsList:[
      {label:'Solicitud dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por sílabo (S/ 5.00 por unidad didáctica)', type:'payment', required:true,
       note:'TUSNE: cobro por unidad. Confirmar unidad mínima y si el FUT aplica en este caso.'},
    ],
    sla:null, route:['tesoreria','unidad_academica'], monto:5, tariffStatus:'fixed', active:false,
    source:'TUSNE 2026 · filas 192–193', validFrom:'', verificationStatus:'pending',
  },

  // ── Grupo 3 (TUSNE 2026): gestiones académicas ────────────────────────────
  {
    id:'reserva_matricula',
    name:'Reserva de matrícula',
    category:'Gestiones académicas',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Reserva de Matrícula"', type:'payment', required:true},
    ],
    sla:3, route:['tesoreria','secretaria_academica'], monto:60, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 35–36', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'licencia_estudios',
    name:'Licencia de estudios',
    category:'Gestiones académicas',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Licencia de Estudios"', type:'payment', required:true},
    ],
    sla:3, route:['tesoreria','secretaria_academica'], monto:60, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 61–62', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'reincorporacion_estudios',
    name:'Reincorporación de estudios',
    category:'Gestiones académicas',
    requires:'FUT + Copia de R.D. de reserva o licencia + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Copia de R.D. de reserva de matrícula o licencia de estudios', type:'document', required:true},
      {label:'Recibo de pago por "Reincorporación de Estudios"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:30, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 40–42', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'traslado_ingreso',
    name:'Traslado de ingreso',
    category:'Traslados',
    requires:'FUT + Certificado de estudios + Constancia de no separación + Partida de nacimiento + DNI + Foto + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Haber aprobado mínimo todas las U.D. con nota ≥ 13 en institución de procedencia', type:'condition', required:true},
      {label:'Certificado de estudios originales del instituto de procedencia', type:'document', required:true},
      {label:'Constancia de no haber sido separado de la institución de procedencia', type:'document', required:true},
      {label:'Partida de nacimiento original y/o copia fedateada', type:'document', required:true},
      {label:'Copia de Documento Nacional de Identidad (DNI)', type:'document', required:true},
      {label:'Una (01) foto tamaño carnet a color o blanco y negro', type:'document', required:true},
      {label:'Recibo de pago por "Traslado de Ingreso"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:50, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 44–51', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'traslado_salida',
    name:'Traslado de salida',
    category:'Traslados',
    requires:'FUT + Constancia de vacante + Copia de no adeudo + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Constancia de vacante de la institución donde continuará estudios', type:'document', required:true},
      {label:'Copia de constancia de no adeudo', type:'document', required:true},
      {label:'Recibo de pago por "Traslado de Salida"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:280, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 52–55', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'traslado_interno',
    name:'Traslado interno',
    category:'Traslados',
    requires:'FUT + Récord académico + Constancia de disponibilidad de vacante + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Récord académico original del programa de estudios de procedencia', type:'document', required:true},
      {label:'Constancia de disponibilidad de vacante', type:'document', required:true},
      {label:'Recibo de pago por "Traslado Interno"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:30, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 56–59', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'convalidacion_unidad',
    name:'Convalidación por unidad didáctica',
    category:'Convalidaciones',
    requires:'FUT + Boleta/récord de notas + Copia de sílabos fedateados + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Boleta de notas y/o récord de notas (firmado)', type:'document', required:true},
      {label:'Copia de sílabos firmados y sellados (fedateados)', type:'document', required:true},
      {label:'Recibo de pago por "Convalidación por Und. Competencia"', type:'payment', required:true,
       note:'Confirmar unidad de cobro: ¿por unidad didáctica o por proceso completo?'},
    ],
    sla:5, route:['tesoreria','jefatura_academica','secretaria_academica'], monto:40, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 64–67', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'convalidacion_externa',
    name:'Convalidación externa por unidad didáctica',
    category:'Convalidaciones',
    requires:'FUT + Certificado de estudio original + Copia de sílabos fedateados + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Certificado de estudio original', type:'document', required:true},
      {label:'Copia de sílabos firmados y sellados (fedateados)', type:'document', required:true},
      {label:'Recibo de pago por "Convalidación de Planes de Estudio"', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','jefatura_academica','secretaria_academica'], monto:40, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 68–71', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'convalidacion_efsrt',
    name:'Convalidación de EFSRT',
    category:'Convalidaciones',
    requires:'FUT + 3 últimas boletas de pago + Certificado de trabajo autenticado + Declaración jurada + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Copia de 03 últimas boletas de pago', type:'document', required:true},
      {label:'Copia autenticada de certificado de trabajo', type:'document', required:true},
      {label:'Declaración jurada descriptiva sobre el desarrollo de la actividad laboral', type:'document', required:true},
      {label:'Recibo de pago por "Convalidación de EFSRT"', type:'payment', required:true,
       note:'No equiparar con IEFSRT del egresado ni con ficha de evaluación EFSRT.'},
    ],
    sla:5, route:['tesoreria','jefatura_academica'], monto:120, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 72–76', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'regularizacion_tramite',
    name:'Regularización de trámite',
    category:'Gestiones académicas',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Regularización de ..."', type:'payment', required:true,
       note:'TUSNE A214 menciona Directiva y Reglamento Interno. Confirmar si existen antes de activar.'},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:150, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 126–127', validFrom:'', verificationStatus:'pending',
  },

  // ── Grupo 4 (TUSNE 2026): evaluaciones, titulación y duplicados ───────────
  {
    id:'recuperacion_unidades',
    name:'Recuperación de unidades didácticas desaprobadas',
    category:'Evaluaciones',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Recuperación de U.D."', type:'payment', required:true},
    ],
    sla:2, route:['tesoreria','unidad_academica'], monto:25, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 129–130', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'evaluacion_extraordinaria',
    name:'Evaluación extraordinaria (egresado)',
    category:'Evaluaciones',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por "Evaluación Extraordinaria"', type:'payment', required:true},
    ],
    sla:15, route:['tesoreria','unidad_academica'], monto:80, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 131–132', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'trabajo_aplicacion',
    name:'Trabajo de aplicación profesional',
    category:'Titulación',
    requires:'FUT + Certificado de estudios + Constancia EFSRT + No adeudo + Biblioteca + Egresado + Idiomas + Medalla + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Certificado de estudios original', type:'document', required:true},
      {label:'Constancia de EFSRT original', type:'document', required:true},
      {label:'Constancia de no adeudo original', type:'document', required:true},
      {label:'Constancia de Biblioteca original', type:'document', required:true},
      {label:'Constancia de Egresado original', type:'document', required:true},
      {label:'Certificado de idiomas', type:'document', required:true},
      {label:'Pago por medalla de titulación (S/ 30)', type:'payment', required:true, note:'Concepto separado del derecho de trámite'},
      {label:'Pago por alquiler de equipos (opcional)', type:'payment', required:false, note:'Solo si el estudiante lo requiere'},
      {label:'Recibo de pago por "Trabajo de Aplicación Profesional"', type:'payment', required:true},
      {label:'Constancia de Biblioteca de presentación del TAP (solo modalidad TAP)', type:'document', required:'conditional',
       note:'TUSNE C170: solo para modalidad Trabajo de Aplicación Profesional.'},
      {label:'R.D. de licencia y reincorporación si estudios > 3 años o 6 periodos', type:'document', required:'conditional',
       note:'TUSNE C171: aplica si el egresado culminó más de 3 años o 6 periodos académicos.'},
    ],
    sla:5, route:['tesoreria','jefatura_academica','unidad_academica'], monto:200, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 144–153', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'tramite_titulo',
    name:'Trámite de título profesional técnico',
    category:'Titulación',
    requires:'FUT + Partida de nacimiento + DNI legalizado + Certificado de estudios + Cert. modulares + Constancias + Idiomas + Fotos + Acta + Recibos de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Partida de nacimiento original o copia fedateada', type:'document', required:true},
      {label:'Copia legalizada del DNI', type:'document', required:true},
      {label:'Certificado de estudios de educación superior tecnológica original', type:'document', required:true},
      {label:'Copia fedatada de certificados modulares', type:'document', required:true},
      {label:'Constancia de egresado original', type:'document', required:true},
      {label:'Constancia de no adeudo original', type:'document', required:true},
      {label:'Copia fedatada de certificado de idiomas', type:'document', required:true},
      {label:'Cuatro (02) fotografías tamaño pasaporte a blanco y negro', type:'document', required:true,
       note:'TUSNE C165: dice CUATRO (02) — confirmar cantidad exacta con institución.'},
      {label:'Acta de titulación original (examen de suficiencia o TAP)', type:'document', required:true},
      {label:'Recibo de pago por trámite de título', type:'payment', required:true},
      {label:'Recibo de pago por rotulado', type:'payment', required:true},
      {label:'Recibo de pago por porta-título', type:'payment', required:true},
      {label:'Constancia de Biblioteca de presentación de TAP (solo modalidad TAP)', type:'document', required:'conditional',
       note:'TUSNE C170: solo para modalidad Trabajo de Aplicación Profesional.'},
      {label:'R.D. de licencia y reincorporación si estudios > 3 años o 6 periodos', type:'document', required:'conditional',
       note:'TUSNE C171.'},
    ],
    sla:45, route:['tesoreria','secretaria_academica'], monto:150, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 157–171', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'duplicado_diploma_titulo',
    name:'Duplicado de diploma de título',
    category:'Titulación',
    requires:'FUT + Fotos + Certificado de denuncia (pérdida) o diploma deteriorado + Copia fedateada de R.D. + Recibo por rotulado + Recibo por duplicado',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Dos (02) fotografías tamaño pasaporte a blanco y negro', type:'document', required:true},
      {label:'Certificado original de denuncia de pérdida del título', type:'document', required:'conditional',
       note:'Solo si el título fue perdido.'},
      {label:'Diploma de título deteriorado (si fuera el caso)', type:'document', required:'conditional',
       note:'Solo si el título está deteriorado con firmas y sellos no visibles.'},
      {label:'Copia fedateada de la R.D. que otorga el título profesional técnico', type:'document', required:true},
      {label:'Recibo de pago por rotulado', type:'payment', required:true},
      {label:'Recibo de pago por derecho de duplicado de título', type:'payment', required:true},
    ],
    sla:45, route:['tesoreria','secretaria_academica'], monto:250, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 172–178', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'duplicado_acta_titulacion',
    name:'Duplicado de acta de titulación',
    category:'Titulación',
    requires:'FUT + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por duplicado de acta de titulación', type:'payment', required:true},
    ],
    sla:1, route:['tesoreria','secretaria_academica'], monto:10, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 180–181', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'examen_suficiencia_idiomas',
    name:'Examen de suficiencia de idiomas',
    category:'Evaluaciones',
    requires:'Solicitud dirigida al Director + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por examen de suficiencia de idiomas', type:'payment', required:true,
       note:'No confundir con examen de suficiencia profesional (ARIB-SRV-037).'},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:150, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 194–195 (N.° 50 duplicado)', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'cert_idiomas_duplicado',
    name:'Certificado de idiomas (duplicado)',
    category:'Evaluaciones',
    requires:'Solicitud dirigida al Director + Acta de aprobación del examen + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Acta de aprobación del examen de suficiencia de idiomas', type:'document', required:true},
      {label:'Recibo de pago por certificado de idiomas (duplicado)', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:20, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 196–198 (N.° 50 duplicado en fuente)', validFrom:'', verificationStatus:'pending',
  },
  {
    id:'copia_acta_sustentacion',
    name:'Copia de acta de sustentación de título (fedatada)',
    category:'Titulación',
    requires:'Solicitud dirigida al Director + Recibo de pago',
    requirementsList:[
      {label:'Solicitud FUT dirigida al Director', type:'form', required:true},
      {label:'Recibo de pago por copia de acta de sustentación', type:'payment', required:true},
    ],
    sla:5, route:['tesoreria','secretaria_academica'], monto:10, tariffStatus:'fixed', active:true,
    source:'TUSNE 2026 · filas 199–200 (N.° 51)', validFrom:'', verificationStatus:'pending',
  },
]

// Datos de pago institucional (dónde debe pagar el solicitante el derecho de trámite):
// un solo destino compartido por todos los trámites con costo. El Administrador lo
// edita en "Usuarios y catálogos → Trámites" antes de salir a producción; estos son
// valores de ejemplo para el prototipo, NO datos reales de la institución.
export const DEFAULT_PAYMENT_INFO = {
  yape: '958 000 000',
  titular: 'IESTP Alianza Renovada Ichuña Bélgica',
  banco: 'Banco de la Nación',
  cuenta: '00-000-000000',
  cci: '018-000-000000000000-00',
}
export let PAYMENT_INFO = { ...DEFAULT_PAYMENT_INFO }
export function setPaymentInfoCatalog(v){ PAYMENT_INFO = v }

// Mutable catalogs: el prototipo permite a Administrador crear/editar/eliminar
// oficinas y trámites en tiempo real (ver CatalogAdminView). App.jsx sincroniza
// estos arrays con localStorage a través de setOfficesCatalog/setProceduresCatalog.
export let OFFICES = DEFAULT_OFFICES.map(x=>({...x}))
export let PROCEDURES = DEFAULT_PROCEDURES.map(x=>({...x}))
export function setOfficesCatalog(list){ OFFICES = list }
export function setProceduresCatalog(list){ PROCEDURES = list }

export const PROFILES = [
  {id:'estudiante', label:'Estudiante', role:'ESTUDIANTE', office:null, permissions:['request.create','request.view_own','request.correct'], description:'Presenta FUT, subsana y hace seguimiento.'},
  {id:'docente', label:'Docente', role:'DOCENTE', office:null, permissions:['request.create','request.view_own','request.correct'], description:'Presenta solicitudes internas y hace seguimiento.'},
  {id:'secretaria', label:'Secretaría', role:'SECRETARIA', office:'mesa_partes', permissions:['case.register','case.receive','case.close','book.view'], description:'Registra el libro digital y remite todo a Dirección.'},
  {id:'direccion', label:'Dirección', role:'ADMIN', office:'direccion', permissions:['case.proveido','route.choose','case.view'], description:'Emite proveído obligatorio y activa la ruta de oficinas.'},
  {id:'oficina', label:'Oficina destino', role:'ADMIN', office:'biblioteca', permissions:['case.attend','case.observe','case.forward'], description:'Atiende el paso asignado y deriva automáticamente al siguiente.'},
  {id:'admin', label:'Administrador', role:'ADMIN', office:'mesa_partes', permissions:['system.manage','workflow.manage','users.manage','audit.view','reports.view'], description:'Configura trámites, rutas, oficinas, usuarios y monitorea el sistema.'},
]

export const PROGRAMS = ['Arquitectura de Plataformas y Servicios de TI','Contabilidad','Enfermería Técnica','Otro programa']
export const CONDITIONS = ['Estudiante','Egresado','Docente','Administrativo','Persona externa']

// Catálogo de vistas del sistema (id interno usado por activeView) y de qué roles
// podrían razonablemente necesitarla, para poblar el panel de "Roles y permisos".
export const VIEW_CATALOG = [
  {id:'control', label:'Centro de control'},
  {id:'workflow', label:'Trámites y rutas'},
  {id:'catalog', label:'Usuarios y catálogos'},
  {id:'work', label:'Mesa de trabajo (bandeja del rol)'},
  {id:'book', label:'Libro y auditoría'},
  {id:'caja', label:'Caja y pagos'},
  {id:'oficinas', label:'Operar oficinas (superusuario)'},
  {id:'portal', label:'Mi Mesa de Partes'},
  {id:'tracking', label:'Seguimiento'},
]
export const POSSIBLE_VIEWS_BY_ROLE = {
  estudiante:['portal','tracking'],
  docente:['portal','tracking'],
  secretaria:['work','book','tracking'],
  direccion:['work','book','tracking'],
  oficina:['work','book','tracking'],
  admin:['control','workflow','catalog','book','caja','oficinas','tracking'],
}

// Catálogo de permisos granulares (acciones concretas) que puede tener un rol.
export const PERMISSIONS_CATALOG = [
  {key:'request.create', label:'Crear solicitudes (FUT)'},
  {key:'request.view_own', label:'Ver sus propias solicitudes'},
  {key:'request.correct', label:'Subsanar observaciones'},
  {key:'case.register', label:'Registrar expedientes físicos/virtuales'},
  {key:'case.receive', label:'Recibir expedientes'},
  {key:'case.close', label:'Cerrar y entregar expedientes'},
  {key:'book.view', label:'Ver libro digital'},
  {key:'case.proveido', label:'Emitir proveído'},
  {key:'route.choose', label:'Definir ruta de oficinas'},
  {key:'case.view', label:'Ver detalle de expedientes'},
  {key:'case.originate', label:'Iniciar expedientes directamente desde la oficina'},
  {key:'case.attend', label:'Atender y completar pasos en oficina'},
  {key:'case.observe', label:'Observar expedientes'},
  {key:'case.forward', label:'Redirigir a otra oficina'},
  {key:'case.pay', label:'Registrar pagos en Tesorería'},
  {key:'case.pay_edit', label:'Corregir el monto de un pago ya registrado'},
  {key:'system.manage', label:'Administrar el sistema'},
  {key:'workflow.manage', label:'Administrar trámites y rutas'},
  {key:'users.manage', label:'Administrar usuarios'},
  {key:'audit.view', label:'Ver auditoría'},
  {key:'reports.view', label:'Ver reportes'},
]

export const DEFAULT_ROLE_PERMISSIONS = {
  estudiante:{views:['portal','tracking'], permissions:['request.create','request.view_own','request.correct']},
  docente:{views:['portal','tracking'], permissions:['request.create','request.view_own','request.correct']},
  secretaria:{views:['work','book','tracking'], permissions:['case.register','case.receive','case.close','book.view']},
  direccion:{views:['work','tracking'], permissions:['case.proveido','route.choose','case.view']},
  oficina:{views:['work','tracking'], permissions:['case.attend','case.observe','case.forward','case.pay','case.originate']},
  admin:{views:['control','workflow','catalog','book','caja','oficinas','tracking'], permissions:['system.manage','workflow.manage','users.manage','audit.view','reports.view','case.attend','case.observe','case.forward','case.pay','case.pay_edit','case.originate']},
}

// Igual que OFFICES/PROCEDURES: el prototipo permite a Administrador reconfigurar
// en vivo qué vistas ve cada rol y qué permisos tiene. App.jsx sincroniza esto con
// localStorage a través de setRolePermissionsCatalog.
export let ROLE_PERMISSIONS = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS))
export function setRolePermissionsCatalog(v){ ROLE_PERMISSIONS = v }
export const roleViews = role => ROLE_PERMISSIONS[role]?.views || []
export const rolePerms = role => ROLE_PERMISSIONS[role]?.permissions || []
export const hasPermission = (role,perm) => rolePerms(role).includes(perm)

// ─── Permisos por oficina (decisión 2026-09-24) ───────────────────────────────
// Todas las oficinas comparten el rol 'oficina' y, por defecto, sus mismos permisos
// y vistas. El Administrador puede además personalizar una oficina específica (ej.
// que solo Tesorería vea "Caja y pagos" y registre pagos, o que solo Comisión de
// Admisión pueda iniciar expedientes). DEFAULT_OFFICE_PERMISSIONS vacío = ninguna
// oficina tiene override; todas heredan el rol 'oficina' hasta que el admin
// personalice una explícitamente.
export const DEFAULT_OFFICE_PERMISSIONS = {}
export let OFFICE_PERMISSIONS = JSON.parse(JSON.stringify(DEFAULT_OFFICE_PERMISSIONS))
export function setOfficePermissionsCatalog(v){ OFFICE_PERMISSIONS = v }
// true si el admin personalizó esta oficina; false si hereda el rol 'oficina' completo.
export const officeHasCustomPermissions = officeId => !!OFFICE_PERMISSIONS[officeId]
export const officeViews = officeId => OFFICE_PERMISSIONS[officeId]?.views || roleViews('oficina')
export const officePerms = officeId => OFFICE_PERMISSIONS[officeId]?.permissions || rolePerms('oficina')

// ─── Feriados y días hábiles ─────────────────────────────────────────────────
// Lista de feriados nacionales del Perú 2026 más los días de cierre institucional.
// El Administrador puede editarla desde "Usuarios y catálogos → Feriados".
// Formato: 'YYYY-MM-DD'. No incluir fines de semana aquí (ya se excluyen en slaInfo).
export const DEFAULT_HOLIDAYS = [
  // Feriados nacionales Perú 2026
  {date:'2026-01-01', name:'Año Nuevo'},
  {date:'2026-04-02', name:'Jueves Santo'},
  {date:'2026-04-03', name:'Viernes Santo'},
  {date:'2026-05-01', name:'Día del Trabajo'},
  {date:'2026-06-29', name:'San Pedro y San Pablo'},
  {date:'2026-07-28', name:'Fiestas Patrias (1)'},
  {date:'2026-07-29', name:'Fiestas Patrias (2)'},
  {date:'2026-08-30', name:'Santa Rosa de Lima'},
  {date:'2026-10-08', name:'Combate de Angamos'},
  {date:'2026-11-01', name:'Todos los Santos'},
  {date:'2026-12-08', name:'Inmaculada Concepción'},
  {date:'2026-12-09', name:'Batalla de Ayacucho'},
  {date:'2026-12-25', name:'Navidad'},
]

export let HOLIDAYS = DEFAULT_HOLIDAYS.map(x=>({...x}))
export function setHolidaysCatalog(list){ HOLIDAYS = list }

export const officeById = id => OFFICES.find(x=>x.id===id)
export const procedureById = id => PROCEDURES.find(x=>x.id===id)
export const procedureForExpediente = exp => exp?.procedureSnapshot || procedureById(exp?.procedureId)
export const officeName = id => officeById(id)?.name || id || '—'
export const roleLabel = user => user?.role==='oficina'&&user?.office ? `${officeById(user.office)?.roleTitle || 'Encargado'} de ${officeName(user.office)}` : (PROFILES.find(p=>p.id===user?.role)?.label || user?.role || '—')
export const slugify = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || `item_${Date.now()}`
