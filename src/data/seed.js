const now = new Date()
const date = new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now)

export const seedWorkflowConfigs = {
  // ── Trámites del TUSNE 2026 (grupos 1–4) ──────────────────────────────────
  // Eliminados los trámites sin respaldo en el Excel (iefsrt_egresado, plan_tutoria,
  // diploma_egresado, tecnico_pedagogico). Solo quedan trámites con source TUSNE.
  const_biblioteca:    {version:2, status:'PUBLICADO', route:['tesoreria','biblioteca'],              updatedAt:'Hoy 09:12',
    note:'Ruta propuesta: Tesorería valida pago S/ 25 → Biblioteca emite constancia. Pendiente de validación institucional.'},
  cert_modular:        {version:4, status:'PUBLICADO', route:['tesoreria','secretaria_academica'],     updatedAt:'Hoy 08:55',
    note:'Ruta simplificada según TUSNE (Secretaría Académica como aprobación/término). Confirmar con institución antes de usar en producción.'},
  examen_suficiencia:  {version:2, status:'PUBLICADO', route:['tesoreria','jefatura_academica','unidad_academica'], updatedAt:'21/09/2026',
    note:'Ruta propuesta. TUSNE: aprueba Jefe de Unidad Académica / Secretaría Académica. Confirmar si Unidad Académica y Jefatura son la misma dependencia.'},
  const_egresado:      {version:2, status:'PUBLICADO', route:['tesoreria','secretaria_academica'],    updatedAt:'21/09/2026',
    note:'Ruta propuesta según TUSNE fila 81: Secretaría Académica aprueba y emite. Tesorería valida pago S/ 25.'},

  // ── Grupo 1: constancias y certificados nuevos ────────────────────────────
  // Rutas propuestas compatibles con el prototipo. Pendientes de validación
  // institucional antes de activar en producción.
  const_estudios:      {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'],    updatedAt:'21/09/2026',
    note:'Ruta propuesta según TUSNE fila 83. Espejo de const_egresado (misma dependencia, mismo monto S/ 25, mismo SLA 2 días).'},
  const_matricula:     {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'],    updatedAt:'21/09/2026',
    note:'Ruta propuesta según TUSNE fila 85. Espejo de const_egresado (misma dependencia, mismo monto S/ 25, mismo SLA 2 días).'},
  cert_estudios:       {version:1, status:'BORRADOR',  route:['tesoreria','secretaria_academica'],    updatedAt:'21/09/2026',
    note:'INACTIVO: pendiente de aclarar concepto del recibo (TUSNE C112 menciona autenticación). Activar solo después de confirmar con institución.'},

  // ── Grupo 2: documentos y constancias restantes ───────────────────────────
  // Rutas propuestas compatibles con el prototipo. Pendientes de validación institucional.
  const_no_adeudar:           {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 78–80. Ruta espejo del grupo 1. Incluye ficha de no adeudar firmada.'},
  const_disponibilidad_vacante:{version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 87–88. Ruta espejo del grupo 1.'},
  const_tercio_quinto:        {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 91–93. Requiere foto carnet adicional.'},
  const_primera_matricula:    {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 94–95. Ruta espejo del grupo 1.'},
  otras_constancias:          {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 96–97. Confirmar qué tipos de constancias aplican.'},
  copia_expediente_estudiante:{version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 99–100. Monto S/ 5 por copia.'},
  record_academico:           {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 102–103. SLA 5 días. Monto S/ 10.'},
  autenticacion_documentos:   {version:1, status:'BORRADOR',  route:['tesoreria','fedatario'],            updatedAt:'21/09/2026',
    note:'INACTIVO: ruta incluye oficina provisional "Fedatario". Confirmar dependencia antes de activar.'},
  cambio_nombre_apellido:     {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 118–121. SLA 15 días. Requiere documentos legalizados.'},
  ficha_evaluacion_efsrt:     {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 123–124. No confundir con IEFSRT del egresado.'},
  copia_recibo_ingresos:      {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 182–183. Monto S/ 5.'},
  copia_silabos:              {version:1, status:'PUBLICADO', route:['tesoreria','unidad_academica'],     updatedAt:'21/09/2026',
    note:'TUSNE filas 192–193. Cobro por unidad didáctica (S/ 5 c/u). Confirmar si el FUT aplica.'},

  // ── Grupo 3: gestiones académicas ─────────────────────────────────────────
  reserva_matricula:          {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 35–36. SLA 3 días. Requiere FUT + recibo. Dirección aprueba.'},
  licencia_estudios:          {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 61–62. SLA 3 días. Dirección aprueba, Secretaría Académica emite.'},
  reincorporacion_estudios:   {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 40–42. SLA 5 días. Requiere copia de R.D. de reserva o licencia anterior.'},
  traslado_ingreso:           {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 44–51. SLA 5 días. Múltiples requisitos; Dirección aprueba.'},
  traslado_salida:            {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 52–55. SLA 5 días. Monto S/ 280. Requiere constancia de no adeudo y vacante.'},
  traslado_interno:           {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 56–59. SLA 5 días. Requiere récord académico y constancia de vacante.'},
  convalidacion_unidad:       {version:1, status:'PUBLICADO', route:['tesoreria','jefatura_academica','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 64–67. SLA 5 días. Aprueba Jefe Unidad Académica y Jefatura Académica.'},
  convalidacion_externa:      {version:1, status:'PUBLICADO', route:['tesoreria','jefatura_academica','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 68–71. SLA 5 días. Requiere certificado y sílabos de institución de origen.'},
  convalidacion_efsrt:        {version:1, status:'PUBLICADO', route:['tesoreria','jefatura_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 72–76. SLA 5 días. Monto S/ 120. No equiparar con IEFSRT del egresado.'},
  regularizacion_tramite:     {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 126–127. SLA 5 días. Monto S/ 150. Confirmar existencia de Directiva institucional.'},

  // ── Grupo 4: evaluaciones, titulación y duplicados ────────────────────────
  recuperacion_unidades:      {version:1, status:'PUBLICADO', route:['tesoreria','unidad_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 129–130. SLA 2 días. Monto S/ 25. Término en Coordinación de Área Académica (provisional).'},
  evaluacion_extraordinaria:  {version:1, status:'PUBLICADO', route:['tesoreria','unidad_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 131–132. SLA 15 días. Monto S/ 80. Término en Coordinación / Secretaría Académica.'},
  trabajo_aplicacion:         {version:1, status:'PUBLICADO', route:['tesoreria','jefatura_academica','unidad_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 144–153. SLA 5 días. Monto S/ 200. Pagos adicionales por medalla y alquiler opcional.'},
  tramite_titulo:             {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 157–171. SLA 45 días. Monto S/ 150. Múltiples requisitos; nota condicional C171.'},
  duplicado_diploma_titulo:   {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 172–178. SLA 45 días. Monto S/ 250. Por pérdida o deterioro.'},
  duplicado_acta_titulacion:  {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 180–181. SLA 1 día. Monto S/ 10.'},
  examen_suficiencia_idiomas: {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 194–195 (N.° 50). SLA 5 días. Monto S/ 150. No confundir con examen profesional.'},
  cert_idiomas_duplicado:     {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 196–198 (N.° 50 duplicado). SLA 5 días. Monto S/ 20.'},
  copia_acta_sustentacion:    {version:1, status:'PUBLICADO', route:['tesoreria','secretaria_academica'], updatedAt:'21/09/2026',
    note:'TUSNE filas 199–200 (N.° 51). SLA 5 días. Monto S/ 10.'},
}

export const seedUsers = [
  {id:'u-admin1',username:'admin',password:'admin123',email:'admin@arib.edu.pe',fullName:'Administrador ARIB',role:'admin',office:'mesa_partes',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-sec1',username:'secretaria',password:'secretaria123',email:'secretaria@arib.edu.pe',fullName:'Secretaría ARIB',role:'secretaria',office:'mesa_partes',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-dir1',username:'direccion',password:'direccion123',email:'direccion@arib.edu.pe',fullName:'Dirección ARIB',role:'direccion',office:'direccion',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-bib1',username:'biblioteca',password:'biblioteca123',email:'biblioteca@arib.edu.pe',fullName:'Encargado de Biblioteca',role:'oficina',office:'biblioteca',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-ja1',username:'jefatura_academica',password:'jefatura123',email:'jefatura_academica@arib.edu.pe',fullName:'Encargado de Jefatura Académica',role:'oficina',office:'jefatura_academica',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-tes1',username:'tesoreria',password:'tesoreria123',email:'tesoreria@arib.edu.pe',fullName:'Jefe de Unidad Administrativa de Tesorería',role:'oficina',office:'tesoreria',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-efsrt1',username:'efsrt',password:'efsrt123',email:'efsrt@arib.edu.pe',fullName:'Encargado de EFSRT',role:'oficina',office:'efsrt',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-ua1',username:'unidad_academica',password:'unidad123',email:'unidad_academica@arib.edu.pe',fullName:'Encargado de Unidad Académica',role:'oficina',office:'unidad_academica',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-sa1',username:'secretaria_academica',password:'secacad123',email:'secretaria_academica@arib.edu.pe',fullName:'Encargado de Secretaría Académica',role:'oficina',office:'secretaria_academica',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-est1',username:'2023100045',password:'70223344',email:'2023100045@arib.edu.pe',fullName:'Juan Carlos Mamani',role:'estudiante',office:null,dni:'70223344',codigo:'2023100045',anioIngreso:'2023',carrera:'Arquitectura de Plataformas y Servicios de TI',active:true},
  {id:'u-doc1',username:'docente.rosa',password:'73445566',email:'docente.rosa@arib.edu.pe',fullName:'Rosa Yana Condori',role:'docente',office:null,dni:'73445566',codigo:'',anioIngreso:'',carrera:'Contabilidad',active:true},
]

export const seedExpedientes = [
  {
    id:'exp-5223',numero:5223,tracking:'ARIB-5223',ownerProfile:'estudiante',canal:'Físico',fecha:date,hora:'10:05',tipoDocumento:'FUT',procedureId:'const_biblioteca',
    solicitante:'María Quispe Mamani',condicion:'Egresado',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'74125896',celular:'987654321',correo:'maria.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Constancia de biblioteca',fundamento:'Solicito constancia para completar mi expediente de egreso.',
    adjuntos:[
      {name:'FUT_fisico.pdf',size:'320 KB'},
      {name:'Comprobante de pago',size:'Yape S/ 25.00',url:''},
    ],
    numeroFolios:2,
    // Snapshot congelado al momento del registro: tarifa S/ 25 (TUSNE 2026, fila 89)
    procedureSnapshot:{
      id:'const_biblioteca',name:'Constancia de biblioteca',category:'Constancias',
      monto:25,sla:2,tariffStatus:'fixed',
      requirementsList:[
        {label:'Solicitud FUT dirigida al Director',type:'form',required:true},
        {label:'Recibo de pago por "Constancia de Biblioteca"',type:'payment',required:true},
      ],
      requires:'FUT + Recibo de pago',route:['tesoreria','biblioteca'],
      source:'TUSNE 2026 · fila 89',verificationStatus:'pending',active:true,snapshotOrigin:'registration',
    },
    estado:'FINALIZADO',oficinaActual:'mesa_partes',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',
    proveido:'PASE A TESORERÍA PARA VALIDACIÓN DE PAGO Y LUEGO A BIBLIOTECA PARA EMISIÓN DE CONSTANCIA.',
    routePlan:['tesoreria','biblioteca'],routeIndex:2,routeVersion:2,
    respuesta:'Pago S/ 25 validado. Constancia de biblioteca emitida y entregada.',
    documentoRespuesta:'Constancia_Biblioteca_5223.pdf',observation:null,
    pago:{estado:'PAGADO',monto:25,metodo:'Yape / Plin',voucher:'YP-123456',fecha:date,comprobante:'',registradoAt:'10:38',registradoPor:'Tesorería'},
    historial:[
      {time:'10:05',actor:'Secretaría',action:'Registro',text:'Registró el expediente N.° 5223 y lo remitió a Dirección.'},
      {time:'10:26',actor:'Dirección',action:'Proveído',text:'Emitió V°B° y proveído. Ruta activada: Tesorería → Biblioteca.'},
      {time:'10:38',actor:'Tesorería',action:'Pago registrado',text:'Registró pago de S/ 25.00 (Yape / Plin, Voucher YP-123456).'},
      {time:'10:42',actor:'Tesorería',action:'Paso completado',text:'Pago conforme. Derivado automáticamente a Biblioteca.'},
      {time:'11:10',actor:'Biblioteca',action:'Paso completado',text:'Constancia emitida y firmada. Devuelto a Mesa de Partes.'},
      {time:'11:25',actor:'Secretaría',action:'Cierre',text:'Registró entrega de respuesta y finalizó el expediente.'},
    ]
  },
  {
    id:'exp-5224',numero:5224,tracking:'ARIB-5224',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'12:39',tipoDocumento:'FUT',procedureId:'cert_modular',
    solicitante:'Juan Carlos Mamani',condicion:'Estudiante',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'70223344',celular:'965432100',correo:'juan.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Certificado modular',fundamento:'Solicito certificado modular para fines laborales.',
    adjuntos:[
      {name:'FUT_ARIB.pdf',size:'280 KB'},
      {name:'Foto tamaño carnet',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Constancia de EFSRT',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Comprobante de pago',size:'Google Drive',url:'https://drive.google.com'},
    ],
    numeroFolios:3,
    procedureSnapshot:{
      id:'cert_modular',name:'Certificado modular',category:'Certificados',
      monto:40,sla:3,tariffStatus:'fixed',
      requirementsList:[
        {label:'Solicitud FUT dirigida al Director',type:'form',required:true},
        {label:'Una (01) foto tamaño carnet a color o blanco y negro',type:'document',required:true},
        {label:'Constancia de EFSRT',type:'document',required:true},
        {label:'Recibo de pago por "Certificado Modular"',type:'payment',required:true},
      ],
      requires:'FUT + Foto + Constancia de EFSRT + Recibo de pago',route:['tesoreria','secretaria_academica'],
      source:'TUSNE 2026 · fila 113',verificationStatus:'pending',active:true,snapshotOrigin:'registration',
    },
    estado:'EN_DIRECCION',oficinaActual:'direccion',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,pago:null,
    historial:[
      {time:'12:34',actor:'Solicitante',action:'Envío virtual',text:'Envió FUT virtual y adjuntos.'},
      {time:'12:39',actor:'Secretaría',action:'Registro',text:'Generó expediente N.° 5224 y lo remitió obligatoriamente a Dirección.'},
    ]
  },
  {
    id:'exp-5225',numero:5225,tracking:'ARIB-5225',ownerProfile:'estudiante',canal:'Físico',fecha:date,hora:'13:00',tipoDocumento:'FUT',procedureId:'convalidacion_efsrt',
    solicitante:'Rosa Yana Condori',condicion:'Egresado',programa:'Contabilidad',dni:'73445566',celular:'978451236',correo:'rosa.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Convalidación de EFSRT',fundamento:'Solicito convalidación de EFSRT por experiencia laboral acreditada.',
    adjuntos:[
      {name:'FUT.pdf',size:'210 KB'},
      {name:'Copia de 03 últimas boletas de pago',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Copia autenticada de certificado de trabajo',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Comprobante de pago',size:'Google Drive',url:'https://drive.google.com'},
    ],
    numeroFolios:5,
    procedureSnapshot:{
      id:'convalidacion_efsrt',name:'Convalidación de EFSRT',category:'Convalidaciones',
      monto:120,sla:5,tariffStatus:'fixed',
      requirementsList:[
        {label:'Solicitud FUT dirigida al Director',type:'form',required:true},
        {label:'Copia de 03 últimas boletas de pago',type:'document',required:true},
        {label:'Copia autenticada de certificado de trabajo',type:'document',required:true},
        {label:'Declaración jurada descriptiva sobre el desarrollo de la actividad laboral',type:'document',required:true},
        {label:'Recibo de pago por "Convalidación de EFSRT"',type:'payment',required:true,note:'No equiparar con IEFSRT del egresado ni con ficha de evaluación EFSRT.'},
      ],
      requires:'FUT + 3 últimas boletas + Certificado de trabajo + Declaración jurada + Recibo de pago',
      route:['tesoreria','jefatura_academica'],
      source:'TUSNE 2026 · filas 72–76',verificationStatus:'pending',active:true,snapshotOrigin:'registration',
    },
    estado:'EN_OFICINA',oficinaActual:'tesoreria',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',
    proveido:'PASE A TESORERÍA PARA VALIDACIÓN DE PAGO Y LUEGO A JEFATURA ACADÉMICA PARA CONVALIDACIÓN.',
    routePlan:['tesoreria','jefatura_academica'],routeIndex:0,routeVersion:1,respuesta:'',documentoRespuesta:'',observation:null,pago:null,
    historial:[
      {time:'13:00',actor:'Secretaría',action:'Registro',text:'Registró expediente N.° 5225 y remitió a Dirección.'},
      {time:'13:14',actor:'Dirección',action:'Proveído',text:'Emitió proveído. Ruta: Tesorería → Jefatura Académica.'},
    ]
  },
  {
    id:'exp-5226',numero:5226,tracking:'ARIB-5226',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'14:08',tipoDocumento:'FUT',procedureId:'tramite_titulo',
    solicitante:'Luis Choque Apaza',condicion:'Egresado',programa:'Enfermería Técnica',dni:'76889900',celular:'956741852',correo:'luis.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Trámite de título profesional técnico',fundamento:'Solicito inicio del trámite de obtención de título profesional técnico.',
    adjuntos:[
      {name:'FUT_ARIB.pdf',size:'240 KB'},
      {name:'Certificado de estudios original',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Constancia de egresado original',size:'Google Drive',url:'https://drive.google.com'},
      {name:'Comprobante de pago',size:'Google Drive',url:'https://drive.google.com'},
    ],
    numeroFolios:6,
    procedureSnapshot:{
      id:'tramite_titulo',name:'Trámite de título profesional técnico',category:'Titulación',
      monto:150,sla:45,tariffStatus:'fixed',
      requirementsList:[
        {label:'Solicitud FUT dirigida al Director',type:'form',required:true},
        {label:'Partida de nacimiento original o copia fedateada',type:'document',required:true},
        {label:'Copia legalizada del DNI',type:'document',required:true},
        {label:'Certificado de estudios de educación superior tecnológica original',type:'document',required:true},
        {label:'Copia fedatada de certificados modulares',type:'document',required:true},
        {label:'Constancia de egresado original',type:'document',required:true},
        {label:'Constancia de no adeudo original',type:'document',required:true},
        {label:'Copia fedatada de certificado de idiomas',type:'document',required:true},
        {label:'Cuatro (02) fotografías tamaño pasaporte a blanco y negro',type:'document',required:true,note:'TUSNE C165: dice CUATRO (02) — confirmar cantidad exacta con institución.'},
        {label:'Acta de titulación original (examen de suficiencia o TAP)',type:'document',required:true},
        {label:'Recibo de pago por trámite de título',type:'payment',required:true},
        {label:'Recibo de pago por rotulado',type:'payment',required:true},
        {label:'Recibo de pago por porta-título',type:'payment',required:true},
      ],
      requires:'FUT + documentos completos de titulación + Recibos de pago',
      route:['tesoreria','secretaria_academica'],
      source:'TUSNE 2026 · filas 157–171',verificationStatus:'pending',active:true,snapshotOrigin:'registration',
    },
    estado:'OBSERVADO',oficinaActual:'tesoreria',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',
    proveido:'PASE SEGÚN RUTA PARA VALIDACIÓN DE PAGO Y DOCUMENTACIÓN DE TITULACIÓN.',
    routePlan:['tesoreria','secretaria_academica'],routeIndex:0,routeVersion:1,respuesta:'',documentoRespuesta:'',
    observation:{office:'tesoreria',text:'Adjuntar comprobante de pago legible y copia fedatada de certificados modulares.',createdAt:'14:44'},pago:null,
    historial:[
      {time:'14:08',actor:'Secretaría',action:'Registro',text:'Registró expediente N.° 5226.'},
      {time:'14:16',actor:'Dirección',action:'Proveído',text:'Activó ruta Tesorería → Secretaría Académica.'},
      {time:'14:44',actor:'Tesorería',action:'Observación',text:'Solicitó comprobante de pago legible y copia fedatada de certificados modulares.'},
    ]
  },
  {
    id:'sol-001',numero:5227,tracking:'ARIB-5227',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'15:18',tipoDocumento:'FUT',procedureId:'const_egresado',
    solicitante:'Ana Torres Flores',condicion:'Estudiante',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'76112233',celular:'958741236',correo:'ana.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Constancia de egresado',fundamento:'Solicito constancia para trámite personal.',
    adjuntos:[
      {name:'FUT_ARIB.pdf',size:'310 KB'},
      {name:'Comprobante de pago',size:'Google Drive',url:'https://drive.google.com'},
    ],
    numeroFolios:2,
    procedureSnapshot:{
      id:'const_egresado',name:'Constancia de egresado',category:'Constancias',
      monto:25,sla:2,tariffStatus:'fixed',
      requirementsList:[
        {label:'Solicitud FUT dirigida al Director',type:'form',required:true},
        {label:'Recibo de pago por "Constancia de Egresado"',type:'payment',required:true},
      ],
      requires:'FUT + Recibo de pago',route:['tesoreria','secretaria_academica'],
      source:'TUSNE 2026 · fila 81',verificationStatus:'pending',active:true,snapshotOrigin:'registration',
    },
    estado:'SOLICITUD_VIRTUAL',oficinaActual:'mesa_partes',firmaSecretaria:'',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,pago:null,
    historial:[{time:'15:18',actor:'Solicitante',action:'Envío virtual',text:'Envió FUT virtual. N.° de expediente 5227 asignado. Pendiente de validación en Mesa de Partes.'}]
  }
]
