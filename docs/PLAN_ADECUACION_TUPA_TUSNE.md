# Plan de adecuación del prototipo al Excel

Fecha del análisis inicial: 2026-09-21. Este documento incluye ahora seguimiento de implementación.

## Decisiones confirmadas (2026-09-24)

Respondidas directamente por el Líder Técnico (David Yucra Mamani), no aún por documento formal de la institución — quedan como decisión de proyecto para destrabar el prototipo:

- **TUSNE vigente**: confirmado como catálogo de tarifas aplicable a ARIB para 2026.
- **Oficinas provisionales**: las 4 quedaron confirmadas como oficinas reales con bandeja propia — Fedatario de Unidad Administrativa, Coordinación de Área Académica, Unidad de Formación Continua, Comisión de Admisión. Ya no llevan el flag `provisional` en `src/data/catalogs.js`. Como consecuencia, `autenticacion_documentos` quedó activo (dependía de Fedatario).
- **Certificado modular**: confirma ruta por Jefatura Académica (se mantiene como estaba).
- **Grupo 5 (admisión, matrícula, cursos)**: SÍ deben generar expediente en Mesa de Partes. Aún no se incorporan al catálogo porque el Excel tiene SLA en rango o vacío (30–50 días; F184–F192 vacíos) y tarifas variables por tipo de solicitante/cantidad — falta esa data puntual, no la decisión de alcance.
- **Pagos**: la validación final la controla la parte administrativa (rol Admin, permiso `case.pay_edit`), no se escala a la institución — ya coincide con el modelo construido.
- **Nueva capacidad — origen del registro**: se agregó `allowedCreators` por trámite (quién puede iniciar el expediente: solicitante, Secretaría, y/o la oficina especializada de su ruta). Ver `docs/HANDOFF_FRONTEND.md` §4c y `docs/HANDOFF_BACKEND.md` §3.9. Ningún trámite tiene hoy `'office'` habilitado — la capacidad queda lista para cuando se incorpore el Grupo 5.

## Estado después de la revisión técnica

Esta sección prevalece sobre las marcas históricas de la lista inferior. La revisión corrigió la migración que eliminaba trámites y mezclaba requisitos, la exigencia de documentos opcionales/condicionales, el cálculo de vencimiento al inicio del último día y la reaparición de feriados borrados. Las rutas guardadas conservan su versión y nota originales.

Las condiciones de expedientes antiguos sin snapshot se recuperan del catálogo guardado antes de migrarlo. No se pueden reconstruir automáticamente datos que una versión anterior ya haya eliminado del navegador; en ese caso se necesita respaldo o revisión manual, sin inventar tarifas históricas.

Copia de sílabos queda inactiva y sin plazo predeterminado. La migración retira también su configuración anterior conocida de 1 día/S/ 5 cuando su fuente sigue pendiente; preserva variantes personalizadas y las condiciones de expedientes anteriores. Falta confirmar plazo y cobro por cantidad antes de habilitarla.

Validación: 26 pruebas automatizadas correctas (incluidas 8 regresiones nuevas) y compilación correcta. No se ha validado en navegador el flujo completo por roles. Los ejemplos demo no sustituyen esa comprobación. Las confirmaciones institucionales y las reglas de suspensión siguen pendientes de evidencia; el calendario implementa una convención de prototipo, no una certificación normativa. Los documentos HANDOFF de frontend/backend aún deben actualizarse con el contrato final. Grupo 5 y tarifas variables continúan pendientes.

La [matriz completa](MATRIZ_SERVICIOS_TUPA_TUSNE.md) contiene los 58 servicios de la hoja TUSNE y mantiene separados los 5 registros TUPA de otra institución. Los valores son los del archivo recibido, pendientes de confirmar como vigentes. Los códigos propuestos no sustituyen los identificadores de expedientes existentes.

## Prioridad 0: decisiones institucionales

Resueltas directamente con el Líder Técnico el 2026-09-24 (ver sección anterior): vigencia del TUSNE, las 4 oficinas provisionales, ruta del certificado modular, alcance del Grupo 5, y validación de pagos. Quedan como decisión de proyecto, no como confirmación documental formal de la institución — pendiente aún obtener resolución/fecha de aprobación por escrito si se requiere para auditoría.

Preguntas normativas que siguen sin respuesta, listas para plantear directamente:

| Prioridad | Pregunta concreta | Evidencia y efecto |
|---|---|---|
| Antes de publicar tarifas | ¿Los importes en soles son los aplicables a 2026, o hay que actualizarlos? | Ambas hojas indican UIT de 2025; no recalcular precios automáticamente por UIT. |
| Primer grupo | ¿Desde cuándo se cuentan los días hábiles y qué circunstancias suspenden el plazo? | El motor actual suma días hábiles y contempla pausas; falta confirmar reglas institucionales exactas. |
| Certificado de estudios | ¿Cuál es el concepto correcto de su recibo? | TUSNE!C112 menciona autenticación de documentos. |
| Matrícula | ¿Cómo se aplican S/ 0, S/ 30 y S/ 45 en matrícula de primeros puestos? | TUSNE!C30:I32; no interpretar todo el servicio como gratuito. |
| Admisión y otros | ¿Qué significa 30–50 días y qué plazos corresponden a cursos y copia de sílabos? | F9/F17 contienen rango; F184/F187/F190/F192 están vacíos. Bloquea incorporar el Grupo 5 al catálogo aunque el alcance ya esté confirmado. |
| Titulación | ¿Se requieren dos o cuatro fotografías? ¿Cómo se acreditan pagos asociados y requisitos condicionales? | C165 dice CUATRO (02); C167:C171 contiene conceptos y condiciones diferentes. |
| Regularización | ¿Existe ya la Directiva indicada para el ítem 34? | A214 es una nota de la fuente; no demuestra que esa disposición esté aprobada. |

## Prioridad 1: primer grupo de configuración

Propuesta para revisión; no son trámites activados ni rutas aprobadas.

| Servicio | Acción en catálogo | S/ según Excel | Días hábiles | Requisitos de la fuente | Referencia |
|---|---|---|---|---|---|
| Constancia de egresado | Actualizar `const_egresado`, conservando ID | 25 | 2 | FUT y recibo | TUSNE!A81:I82 |
| Constancia de estudios | Crear | 25 | 2 | FUT y recibo | TUSNE!A83:I84 |
| Constancia de matrícula | Crear | 25 | 2 | FUT y recibo | TUSNE!A85:I86 |
| Constancia de biblioteca | Actualizar `const_biblioteca`, conservando ID | 25 | 2 | FUT y recibo | TUSNE!A89:I90 |
| Certificado modular | Actualizar `cert_modular`, conservando ID | 40 | 3 | FUT, foto, constancia de EFSRT y recibo | TUSNE!A113:I116 |
| Certificado de estudios | Preparar, pendiente de aclaración del recibo | 120 | 3 | FUT, foto y recibo con concepto por confirmar | TUSNE!A110:I112 |

Ruta propuesta para constancias: solicitante → Mesa de Partes → Dirección → validación en Tesorería → Secretaría Académica (Biblioteca para su constancia) → Mesa de Partes → entrega/cierre. Es una propuesta compatible con el prototipo, no una secuencia extraída literalmente del Excel. Para certificado modular, resolver antes la participación de Jefatura Académica. No retirar oficinas de rutas existentes por inferencia.

El FUT ya completado debe satisfacer el requisito FUT; el comprobante debe adjuntarse una sola vez y vincularse al pago. No agregar DNI como requisito documental por defecto cuando la fuente no lo exige; los datos de identificación del formulario son una cuestión distinta.

## Lista de implementación y condiciones de término

- [x] Confirmar vigencia, alcance y decisiones del primer grupo con la institución (ver Prioridad 0).
- [x] Ampliar catálogo: fuente, vigencia, estado activo/inactivo y tarifa pendiente distinta de gratuita (`source`, `validFrom`, `verificationStatus`, `tariffStatus` en modelo y modal).
- [x] Estructurar requisitos: `requirementsList` con type (form/document/payment/condition) y required (true/false/conditional). El portal diferencia qué requiere adjunto y qué es solo confirmación. Migración automática desde texto legacy sin pérdida de datos.
- [x] Preservar por expediente una copia de tarifa, requisitos y plazo al registrar (`captureProcedure`, `preserveProcedureTerms`). Cambiar el catálogo no altera expedientes previos.
- [x] Definir migración explícita en `loadProcedures` y `loadWorkflows`: incorpora trámites y rutas nuevos, actualiza campos no personalizables y conserva personalizaciones del Administrador.
- [x] Incorporar grupo 1: `const_estudios`, `const_matricula` (nuevos); actualizar `const_egresado`, `const_biblioteca`, `cert_modular` con montos y SLA del TUSNE; agregar `cert_estudios` (inactivo, pendiente aclaración de recibo); actualizar `examen_suficiencia` con requisitos completos y monto real (S/ 200).
- [x] Organizar oficinas: comparar TUSNE con catálogo; agregar Fedatario, Coordinación Académica, Formación Continua y Comisión de Admisión como provisionales con notas de correspondencia. Migración que no borra personalizaciones del admin.
- [x] Definir rutas de atención del grupo 1: rutas seed publicadas para const_estudios, const_matricula, cert_estudios (BORRADOR). Notas de validación pendiente en cada workflow. `validateWorkflowRoute` advierte cuando la ruta incluye una oficina provisional. Dirección ve el aviso antes de firmar el proveído.
- [x] Resolver calendario de días hábiles, inicio, feriados configurables y pausas conforme a las decisiones institucionales.
  - `addWorkdays` y `countWorkdays` en `workflowEngine.js`: excluyen sábados, domingos y feriados del catálogo.
  - Plazo inicia el día hábil siguiente al registro (DS 006-2017-PCM).
  - `HOLIDAYS` configurable en `CatalogAdminView` → pestaña **Feriados**: agregar, ver día de semana y eliminar. Cargado/guardado con migración que incorpora feriados nuevos del año sin borrar los del admin.
  - SLA se pausa durante OBSERVADO y pago pendiente en Tesorería (sin cambios, ya estaba correcto).
- [x] Mejorar requisitos del FUT — `requirementsList` estructurado; `RequirementsBlock` en portal, secretaría y oficinas con emparejamiento de adjuntos y badges por tipo. `FileList` diferencia comprobante/FUT/documento visualmente.
- [x] Ajustar costos y validación de pagos — montos de los 8 trámites iniciales actualizados al TUSNE; `PaymentStatusCard` diferencia pending/free/paid claramente; expedientes demo con `procedureSnapshot` correcto; ruta `const_biblioteca` ahora incluye Tesorería.
- [x] Verificar envío, recepción, proveído, pago, atención, observación/subsanación, respuesta y cierre por rol con los trámites del grupo 1.
  - Expedientes demo actualizados: EXP-5223 (const_biblioteca) ahora pasa por Tesorería con pago S/ 25 registrado; EXP-5224 (cert_modular) con snapshot correcto y adjuntos tipados; EXP-5226 (diploma) con snapshot S/ 150; EXP-5227 (const_egresado) con comprobante y monto S/ 25.
  - `RequirementsBlock` en portal, secretaría y oficinas: muestra requisitos del snapshot con emparejamiento de adjuntos, diferenciando tipo form / document / payment / condition.
- [x] Incorporar grupo 2: `const_no_adeudar`, `const_disponibilidad_vacante`, `const_tercio_quinto`, `const_primera_matricula`, `otras_constancias`, `copia_expediente_estudiante`, `record_academico`, `autenticacion_documentos` (inactivo — Fedatario provisional), `cambio_nombre_apellido`, `ficha_evaluacion_efsrt`, `copia_recibo_ingresos`, `copia_silabos`. Rutas seed publicadas.
- [x] Incorporar grupo 3: `reserva_matricula`, `licencia_estudios`, `reincorporacion_estudios`, `traslado_ingreso`, `traslado_salida`, `traslado_interno`, `convalidacion_unidad`, `convalidacion_externa`, `convalidacion_efsrt`, `regularizacion_tramite`. Rutas seed publicadas con notas de validación.
- [x] Incorporar grupo 4: `recuperacion_unidades`, `evaluacion_extraordinaria`, `trabajo_aplicacion`, `tramite_titulo`, `duplicado_diploma_titulo`, `duplicado_acta_titulacion`, `examen_suficiencia_idiomas`, `cert_idiomas_duplicado`, `copia_acta_sustentacion`. Requisitos condicionales modelados con `required:'conditional'` y `note`.
- [ ] Incorporar grupo 5: alcance confirmado el 2026-09-24 (admisión, matrícula y cursos SÍ generan expediente). Falta solo la data puntual de SLA/tarifas del Excel para poder cargarlo (ver ítem siguiente); ya existe la capacidad de origen por oficina (`allowedCreators`) para cuando se agregue.
- [ ] Resolver plazos vacíos o en rango antes de cargar el catálogo del grupo 5 (TUSNE F9/F17 con rango 30–50 días; F184–F192 vacíos).
- [x] Confirmar oficinas provisionales con la institución — 2026-09-24: las 4 confirmadas como oficinas reales. `autenticacion_documentos` activado.
- [ ] Agregar tarifas por beneficiario y cantidad (cursos virtuales/presenciales con 3 precios, matrícula de primeros puestos con 3 montos, copia de sílabos por unidad).
- [x] Actualizar guía de demostración y documentos de frontend/backend conforme al comportamiento actual.
- [x] Agregar `allowedCreators` por trámite (quién puede iniciar el expediente: solicitante, Secretaría, oficina especializada) — decisión 2026-09-24, ver `ProcedureFormModal.jsx` y `OfficeWorkbenchView.jsx`.

## Oficinas — resuelto

El catálogo contiene Mesa de Partes, Dirección, Tesorería, Biblioteca, EFSRT, Jefatura Académica, Unidad Académica y Secretaría Académica, más las 4 confirmadas el 2026-09-24: Comisión de Admisión, Fedatario de Unidad Administrativa, Coordinación de Área Académica y Unidad de Formación Continua. Ninguna lleva ya el flag `provisional`. Sigue pendiente solo la correspondencia explícita de "Unidad Administrativa" y "Caja" con Tesorería si el Excel las vuelve a mencionar en el Grupo 5.

## Validación proporcional

Para esta entrega documental: verificar cobertura 58 + 5, referencias, requisitos, variantes y correspondencias; no se necesita compilar por añadir Markdown. Para futuras modificaciones funcionales: ejecutar las pruebas del motor y la compilación; completar además pruebas de interfaz con expedientes nuevos y existentes. Un build correcto no demuestra el flujo por roles.

Casos necesarios: requisito opcional ausente, requisito condicional aplicable/no aplicable, importe gratuito/pendiente/con costo, comprobante observado, fin de semana y feriado, pausa y reanudación, cambio de catálogo sin alterar expediente anterior, actualización sin borrar personalizaciones y oficina sin permiso. Los resultados deben registrarse como comprobados o pendientes, sin presentar una ruta propuesta como validada.

## Fuentes locales revisadas

- `src/data/catalogs.js`: trámites y oficinas iniciales.
- `src/components/ProcedureFormModal.jsx`: monto único, requisitos como texto y plazo numérico.
- `src/views/ApplicantPortalView.jsx`: checklist por texto y comprobante antes del envío.
- `src/workflowEngine.js`: pago en Tesorería, rutas y cálculo de plazos.
- `README.md`: paso obligatorio por Dirección y alcance del prototipo con localStorage.

No se ha verificado el catálogo de una sesión de navegador ni la vigencia normativa del archivo. Esta entrega no modifica el Excel ni el comportamiento de la aplicación.
