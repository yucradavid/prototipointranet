const now = new Date()
const date = new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now)

export const seedWorkflowConfigs = {
  const_biblioteca:{version:2,status:'PUBLICADO',route:['biblioteca'],updatedAt:'Hoy 09:12'},
  iefsrt_egresado:{version:3,status:'PUBLICADO',route:['efsrt','jefatura_academica'],updatedAt:'Ayer 16:40'},
  cert_modular:{version:4,status:'PUBLICADO',route:['secretaria_academica','jefatura_academica'],updatedAt:'Hoy 08:55'},
  examen_suficiencia:{version:1,status:'PUBLICADO',route:['jefatura_academica','unidad_academica'],updatedAt:'02/09/2026'},
  plan_tutoria:{version:1,status:'PUBLICADO',route:['unidad_academica','jefatura_academica'],updatedAt:'02/09/2026'},
  diploma_egresado:{version:2,status:'PUBLICADO',route:['secretaria_academica','tesoreria','jefatura_academica'],updatedAt:'05/09/2026'},
  tecnico_pedagogico:{version:1,status:'PUBLICADO',route:['jefatura_academica'],updatedAt:'05/09/2026'},
  const_egresado:{version:1,status:'PUBLICADO',route:['secretaria_academica'],updatedAt:'05/09/2026'},
}

export const seedUsers = [
  {id:'u-admin1',username:'admin',password:'admin123',fullName:'Administrador ARIB',role:'admin',office:'mesa_partes',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-sec1',username:'secretaria',password:'secretaria123',fullName:'Secretaría ARIB',role:'secretaria',office:'mesa_partes',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-dir1',username:'direccion',password:'direccion123',fullName:'Dirección ARIB',role:'direccion',office:'direccion',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-bib1',username:'biblioteca',password:'biblioteca123',fullName:'Encargado de Biblioteca',role:'oficina',office:'biblioteca',dni:'',codigo:'',anioIngreso:'',carrera:'',active:true},
  {id:'u-est1',username:'2023100045',password:'70223344',fullName:'Juan Carlos Mamani',role:'estudiante',office:null,dni:'70223344',codigo:'2023100045',anioIngreso:'2023',carrera:'Arquitectura de Plataformas y Servicios de TI',active:true},
  {id:'u-doc1',username:'docente.rosa',password:'73445566',fullName:'Rosa Yana Condori',role:'docente',office:null,dni:'73445566',codigo:'',anioIngreso:'',carrera:'Contabilidad',active:true},
]

export const seedExpedientes = [
  {
    id:'exp-5223',numero:5223,tracking:'ARIB-5223',ownerProfile:'estudiante',canal:'Físico',fecha:date,hora:'10:05',tipoDocumento:'FUT',procedureId:'const_biblioteca',
    solicitante:'María Quispe Mamani',condicion:'Egresado',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'74125896',celular:'987654321',correo:'maria.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Constancia de biblioteca',fundamento:'Solicito constancia para completar mi expediente de egreso.',adjuntos:[{name:'FUT_fisico.pdf',size:'320 KB'}],numeroFolios:2,
    estado:'FINALIZADO',oficinaActual:'mesa_partes',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',proveido:'PASE A BIBLIOTECA PARA ATENCIÓN Y EMISIÓN DE CONSTANCIA.',
    routePlan:['biblioteca'],routeIndex:1,routeVersion:2,respuesta:'Constancia de biblioteca emitida y entregada.',documentoRespuesta:'Constancia_Biblioteca_5223.pdf',observation:null,
    historial:[
      {time:'10:05',actor:'Secretaría',action:'Registro',text:'Registró el expediente N.° 5223 y lo remitió a Dirección.'},
      {time:'10:26',actor:'Dirección',action:'Proveído',text:'Emitió V°B° y proveído. Ruta activada: Biblioteca.'},
      {time:'11:10',actor:'Biblioteca',action:'Atención',text:'Atendió el paso y devolvió el expediente a Mesa de Partes.'},
      {time:'11:25',actor:'Secretaría',action:'Cierre',text:'Registró entrega de respuesta y finalizó el expediente.'},
    ]
  },
  {
    id:'exp-5224',numero:5224,tracking:'ARIB-5224',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'12:39',tipoDocumento:'FUT',procedureId:'cert_modular',
    solicitante:'Juan Carlos Mamani',condicion:'Estudiante',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'70223344',celular:'965432100',correo:'juan.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Certificado modular',fundamento:'Solicito certificado modular para fines laborales.',adjuntos:[{name:'FUT_ARIB.pdf',size:'280 KB'},{name:'DNI.pdf',size:'190 KB'}],numeroFolios:3,
    estado:'EN_DIRECCION',oficinaActual:'direccion',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,
    historial:[
      {time:'12:34',actor:'Solicitante',action:'Envío virtual',text:'Envió FUT virtual y adjuntos.'},
      {time:'12:39',actor:'Secretaría',action:'Registro',text:'Generó expediente N.° 5224 y lo remitió obligatoriamente a Dirección.'},
    ]
  },
  {
    id:'exp-5225',numero:5225,tracking:'ARIB-5225',ownerProfile:'docente',canal:'Físico',fecha:date,hora:'13:00',tipoDocumento:'FUT',procedureId:'iefsrt_egresado',
    solicitante:'Rosa Yana Condori',condicion:'Docente',programa:'Contabilidad',dni:'73445566',celular:'978451236',correo:'rosa.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'IEFSRT del egresado',fundamento:'Solicito revisión de documentación IEFSRT.',adjuntos:[{name:'FUT.pdf',size:'210 KB'},{name:'Anexos.pdf',size:'1.4 MB'}],numeroFolios:5,
    estado:'EN_OFICINA',oficinaActual:'efsrt',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',proveido:'PASE A EFSRT Y CONTINÚE SEGÚN RUTA DE ATENCIÓN.',routePlan:['efsrt','jefatura_academica'],routeIndex:0,routeVersion:3,respuesta:'',documentoRespuesta:'',observation:null,
    historial:[
      {time:'13:00',actor:'Secretaría',action:'Registro',text:'Registró expediente N.° 5225 y remitió a Dirección.'},
      {time:'13:14',actor:'Dirección',action:'Proveído',text:'Emitió proveído. Ruta: EFSRT → Jefatura Académica.'},
    ]
  },
  {
    id:'exp-5226',numero:5226,tracking:'ARIB-5226',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'14:08',tipoDocumento:'FUT',procedureId:'diploma_egresado',
    solicitante:'Luis Choque Apaza',condicion:'Egresado',programa:'Enfermería Técnica',dni:'76889900',celular:'956741852',correo:'luis.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Diploma de egresado',fundamento:'Solicito diploma de egresado.',adjuntos:[{name:'FUT_ARIB.pdf',size:'240 KB'},{name:'Requisitos_Egreso.pdf',size:'2.1 MB'}],numeroFolios:6,
    estado:'OBSERVADO',oficinaActual:'tesoreria',firmaSecretaria:'Secretaría · recepción conforme',vistoBuenoDireccion:'Dirección · V°B° registrado',proveido:'PASE SEGÚN RUTA PARA VALIDACIÓN DE REQUISITOS.',routePlan:['secretaria_academica','tesoreria','jefatura_academica'],routeIndex:1,routeVersion:2,respuesta:'',documentoRespuesta:'',observation:{office:'tesoreria',text:'Adjuntar comprobante de pago legible.',createdAt:'14:44'},
    historial:[
      {time:'14:08',actor:'Secretaría',action:'Registro',text:'Registró expediente N.° 5226.'},
      {time:'14:16',actor:'Dirección',action:'Proveído',text:'Activó ruta Secretaría Académica → Tesorería → Jefatura Académica.'},
      {time:'14:32',actor:'Secretaría Académica',action:'Paso completado',text:'Validó condición de egresado y derivó a Tesorería.'},
      {time:'14:44',actor:'Tesorería',action:'Observación',text:'Solicitó comprobante de pago legible al interesado.'},
    ]
  },
  {
    id:'sol-001',numero:null,tracking:'SOL-ARIB-001',ownerProfile:'estudiante',canal:'Virtual',fecha:date,hora:'15:18',tipoDocumento:'FUT',procedureId:'const_egresado',
    solicitante:'Ana Torres Flores',condicion:'Estudiante',programa:'Arquitectura de Plataformas y Servicios de TI',dni:'76112233',celular:'958741236',correo:'ana.demo@correo.pe',direccion:'Ichuña, Moquegua',
    asunto:'Constancia de egresado',fundamento:'Solicito constancia para trámite personal.',adjuntos:[{name:'FUT_ARIB.pdf',size:'310 KB'},{name:'DNI.pdf',size:'180 KB'}],numeroFolios:2,
    estado:'SOLICITUD_VIRTUAL',oficinaActual:'mesa_partes',firmaSecretaria:'',vistoBuenoDireccion:'',proveido:'',routePlan:[],routeIndex:-1,routeVersion:null,respuesta:'',documentoRespuesta:'',observation:null,
    historial:[{time:'15:18',actor:'Solicitante',action:'Envío virtual',text:'Envió FUT virtual. Pendiente de validación en Mesa de Partes.'}]
  }
]
