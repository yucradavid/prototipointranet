# Guía de demostración del prototipo maestro

Actualizado: 2026-09-24. Refleja el flujo completo con catálogo TUSNE 2026, días hábiles, requisitos estructurados, pagos, feriados configurables, los grupos 1–4 incorporados, las 12 oficinas confirmadas y el control de origen del registro (`allowedCreators`).

---

## 0. Pantalla de login

- Tres caminos: **Google institucional** (simulado), **usuario y contraseña**, y accesos directos para la demo.
- Accesos directos de oficina: Biblioteca, Jefatura Académica, Tesorería, EFSRT, Unidad Académica, Secretaría Académica — cada una con su propia cuenta real.
- En producción solo existiría Google/usuario-contraseña; los accesos directos son solo para agilizar la demo.

---

## 1. Administrador — panorama y configuración

Entrar como **admin / admin123**.

### 1a. Centro de control
- Expedientes activos con ubicación por oficina y carga de trabajo visual (barra por oficina).
- KPIs clickeables: filtrar por "Fuera de SLA", "Por vencer", "Observados".
- SLA ahora en **días hábiles** (excluye fines de semana y feriados del calendario).
- Matriz RBAC: permisos legibles por rol, incluyendo `case.pay` separado de `case.attend`.

### 1b. Trámites y diseñador de rutas
- El catálogo ahora tiene **~40 trámites** de los grupos 1–4 del TUSNE 2026, más los heredados del prototipo.
- Cada trámite muestra: fuente (ej. "TUSNE 2026 · fila 81"), estado de verificación, tarifa pendiente/gratuita/fija.
- Oficinas **provisionales** aparecen marcadas con ⚠ en la paleta y en la ruta publicada. Si se agregan a una ruta, se muestra una advertencia antes de publicar.
- Nota de la ruta visible debajo del preview de ruta en producción.

### 1c. Usuarios y catálogos — 6 pestañas
- **Oficinas**: 12 oficinas confirmadas (las 8 originales más Fedatario, Coordinación Académica, Formación Continua y Comisión de Admisión, confirmadas el 24/09/2026; ya no llevan badge "Provisional").
- **Trámites**: editor con requisitos estructurados (lista con tipo/obligatoriedad/nota + pestaña texto legacy), source, vigencia, tariffStatus, y desde el 24/09/2026 el bloque "¿Quién puede iniciar este trámite?" (solicitante / Secretaría / oficina especializada).
- **Usuarios y Accesos**: importación CSV, gestión individual, reseteo de contraseña.
- **Roles y Permisos**: permiso `case.pay` independiente. Desde el 24/09/2026 también permite **personalizar una oficina específica** (ej. que solo Tesorería vea "Caja y pagos"), sin tocar el rol Oficina compartido — panel "Personalizar por oficina" con badge "Personalizado" y botón para restablecer.
- **Feriados**: calendario de días no hábiles para el cómputo de SLA. Los 13 feriados nacionales 2026 vienen cargados. Se pueden agregar días de cierre institucional.
- **Auditoría**: log cronológico de cambios administrativos.

---

## 2. Solicitante presenta un trámite CON costo

Entrar como **Estudiante** (2023100045 / 70223344 o acceso directo).

1. "Nueva solicitud (FUT)" → elegir **Constancia de estudios** (S/ 25.00, 2 días hábiles).
2. El checklist de requisitos ahora es **estructurado**: muestra badge de tipo por cada ítem.
   - Items tipo **Formulario** solo muestran checkbox (el dato ya está en el FUT).
   - Items tipo **Documento** muestran checkbox + campo de enlace de Google Drive.
   - El comprobante de pago tiene su propio bloque separado al final.
3. Adjuntar comprobante (captura de Yape/voucher). Es obligatorio para trámites con costo.
4. Enviar → cargo oficial generado.

Variante: elegir **Traslado de salida** (S/ 280) para mostrar un trámite de mayor complejidad con requisitos condicionales.

---

## 3. Secretaría → Dirección

1. **Secretaría** (secretaria/secretaria123): validar FUT virtual → número de expediente asignado → pasa a Dirección. El detalle del expediente muestra los **requisitos estructurados del trámite** con emparejamiento visual de adjuntos.
2. **Dirección** (direccion/direccion123):
   - La ruta sugerida ya incluye Tesorería para trámites con costo.
   - Si la ruta incluye una oficina provisional (ej. Fedatario), aparece aviso ⚠ antes de firmar.
   - Si se quita Tesorería de un trámite pagado, aparece aviso de pago sin validar.
   - Emitir el proveído.

---

## 4. Tesorería valida el pago

Pestaña **Tesorería** o tesoreria/tesoreria123.

1. Expediente muestra "Pago pendiente · S/ 25.00". El bloque de requisitos muestra el comprobante que adjuntó el solicitante con enlace directo.
2. Botón "Completar y derivar" **deshabilitado** hasta registrar el pago.
3. "Registrar pago": monto pre-cargado, método (Yape primera opción), N.° operación, fecha, evidencia pre-cargada del comprobante del estudiante.
4. Al guardar → recibo oficial generado → botón habilitado → derivar al siguiente paso.

---

## 5. Oficina operativa — observación, SLA y subsanación

1. Oficina **Secretaría Académica** (secacad123): completar su paso en un expediente.
2. Oficina **EFSRT** (efsrt123): observar un expediente con motivo claro.
3. Volver a Estudiante: subsanar desde el portal → el expediente regresa automáticamente a EFSRT.
4. Mostrar que durante la observación el badge de SLA dice "**SLA pausado**" — esos días no cuentan como demora de la institución. Lo mismo ocurre mientras Tesorería espera el pago.

---

## 6. Cierre y trazabilidad

1. Completar último paso → expediente en "Respuesta en Mesa de Partes".
2. **Secretaría** → registrar entrega y cerrar.
3. `Libro digital`:
   - Columna **Pago** (Pagado S/ X / Pendiente S/ X / Gratuito).
   - Columna **SLA** con badge vencido/por vencer/pausado.
   - Exportar CSV oficial.
4. `Seguimiento global`: buscar por número, DNI o nombre. El detalle muestra `PaymentStatusCard` con estado del pago y, si está pagado, botón "Ver recibo".

---

## 7. Caja y reportes financieros

**Administrador** → `Caja y pagos`:
- Total recaudado, pagos registrados, pendientes de cobro.
- Desglose por trámite y por fecha.
- Abrir recibo desde la tabla.
- Exportar CSV de caja.
- El admin puede corregir el monto de un pago mal digitado por Tesorería (permiso exclusivo `case.pay_edit`).

---

## 8. Demostrar cobertura del catálogo TUSNE

En `Trámites y diseñador de rutas` o `Catálogo de Trámites`:
- **Grupo 1 (activos)**: Constancias de estudios, matrícula, egresado, biblioteca; Certificado modular; Examen de suficiencia profesional.
- **Grupo 2 (activos)**: Constancia de no adeudar, disponibilidad de vacante, tercio/quinto, primera matrícula, otras constancias, copia de expediente, récord académico, cambio de nombre, ficha EFSRT, copia de recibo, copia de sílabos, autenticación de documentos (Fedatario confirmado el 24/09/2026).
- **Grupo 3 (activos)**: Reserva de matrícula, licencia, reincorporación, traslados (ingreso/salida/interno), convalidaciones (interna/externa/EFSRT), regularización.
- **Grupo 4 (activos)**: Recuperación de U.D., evaluación extraordinaria, trabajo de aplicación, trámite de título, duplicados, examen de idiomas, certificado de idiomas duplicado, copia de acta.
- **Pendiente (Grupo 5)**: Admisión, matrículas especiales, cursos, alquileres, copias/impresiones — alcance a confirmar con la institución.

---

## 9. Autogestión de cuenta

Cualquier cuenta real → "Cambiar mi contraseña" en el menú lateral — pide la contraseña actual.

---

## Mensaje clave para el ingeniero

El prototipo cubre el ciclo completo: **presentación de FUT → validación → proveído → pago en Tesorería → atención por oficinas → observación/subsanación → entrega → cierre**. El catálogo incluye los grupos 1–4 del TUSNE 2026 (≈ 40 trámites) con requisitos estructurados, SLA en días hábiles, feriados configurables y snapshots inmutables por expediente.

Decisiones ya resueltas con el Líder Técnico (24/09/2026): TUSNE vigente, las 4 oficinas antes provisionales, y que Grupo 5 (admisión/matrícula/cursos) sí genera expediente. Ver `docs/PLAN_ADECUACION_TUPA_TUSNE.md`.

Lo que aún falta antes de activar el Grupo 5 en producción:
- Plazos vacíos o en rango del Excel (admisión: 30–50 días; cursos: vacíos) — sin esto no se puede cargar su SLA.
- Tarifas por tipo de solicitante (cursos: 3 precios) y por cantidad (sílabos por unidad).
- Confirmación formal por escrito (resolución/fecha) de las decisiones ya tomadas, si se requiere para auditoría institucional.

Los documentos `HANDOFF_BACKEND.md`, `HANDOFF_FRONTEND.md` y `SPRINT2_PASARELA_PAGOS.md` detallan cómo el equipo de producción (Laravel 11 + PostgreSQL) debe reproducir este comportamiento con datos reales.
