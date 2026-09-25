# Traspaso a producción — Frontend

Este documento es para el desarrollador de **Frontend** que construirá la versión real (mismo comportamiento visual y funcional de este prototipo, pero conectado a una API real en vez de `localStorage`). Hay una versión hermana para Backend en [`HANDOFF_BACKEND.md`](HANDOFF_BACKEND.md) — el **contrato de API** (sección 5) es el punto de contacto entre ambos documentos y debe mantenerse igual en los dos. Este documento cubre **Sprint 1** (verificación de pago manual, tal como está hoy el prototipo); la verificación **automática** contra una pasarela real (tarjeta/Yape en línea con confirmación por webhook) es **Sprint 2**, documentado aparte en [`SPRINT2_PASARELA_PAGOS.md`](SPRINT2_PASARELA_PAGOS.md).

> Este repositorio (React + `localStorage`, sin backend) no es el Sprint 1 recortado: es la **referencia visual y funcional ya validada** con el cliente. La UI, el flujo de pantallas y las reglas de qué botón se habilita cuándo ya están decididas — no las rediseñen, pórtenlas y reemplacen la capa de datos.

---

## 1. Regla institucional del dominio (contexto para las pantallas)

```
Solicitante → Mesa de Partes → Dirección (proveído obligatorio) → Oficina(s) según ruta → Mesa de Partes (cierre)
```

- Mesa de Partes y Dirección son pasos fijos: la UI nunca debe permitir configurarlos ni saltearlos (compárenlo con `WorkflowAdminView.jsx`, donde esos dos nodos aparecen bloqueados en el diseñador de rutas).
- Ninguna oficina debe mostrar un expediente en su bandeja si Dirección no emitió antes su proveído.
- El componente `RouteStrip` (en `src/components/ui.jsx`) es el que dibuja visualmente el recorrido — pórtenlo tal cual, ya resuelve los casos de ruta parcial/completa/observada.
- Algunas oficinas del catálogo son **provisionales** (`office.provisional === true`: Fedatario, Coordinación Académica, Formación Continua, Comisión de Admisión — aún no confirmadas por la institución). Se marcan con badge ⚠ en la paleta del diseñador de rutas (`WorkflowAdminView.jsx`) y, si Dirección intenta emitir un proveído cuya ruta incluye una de estas oficinas, debe ver una advertencia explícita antes de firmar (`validateWorkflowRoute`). No las traten como oficinas normales en el selector.

## 2. Estados del expediente y qué debe verse en cada uno

| Estado | Label visible (`STATUS_LABELS` en `src/models/expediente.js`) | Qué debe mostrar la UI |
|---|---|---|
| `SOLICITUD_VIRTUAL` | "Solicitud virtual" | Solo visible para el solicitante y Secretaría; aún no aparece en bandejas de oficina |
| `EN_DIRECCION` | "Pendiente de proveído" | Visible en la bandeja de Dirección |
| `EN_OFICINA` | "En atención" | Visible en la bandeja de la oficina actual (`oficinaActual`) |
| `OBSERVADO` | "Observado" | Tarjeta de alerta con el motivo; el solicitante ve un botón "Subsanar ahora"; la oficina ve el motivo pero no puede completar el paso |
| `RESPUESTA_MESA` | "Respuesta en Mesa de Partes" | Visible en la bandeja de cierre de Secretaría |
| `FINALIZADO` | "Finalizado" | Tarjeta de éxito con botón de descarga de la respuesta |

`StatusBadge`, `SlaBadge` y `Timeline` (todos en `src/components/ui.jsx`) ya resuelven cómo pintar cada estado — reutilícenlos o pórtenlos tal cual a su nueva base de componentes.

## 3. Vistas por rol (cómo está organizado hoy el SPA)

Hoy todo vive en un único `App.jsx` que decide qué vista renderizar según `profileId` (rol simulado) y `activeView`. En producción, cada usuario inicia sesión de verdad y el rol/vistas permitidas deben venir del backend en la respuesta de login — no seguir hardcodeados en el cliente.

| Rol | Vistas | Componente de referencia |
|---|---|---|
| Estudiante / Docente | Mi Mesa de Partes, Seguimiento | `ApplicantPortalView.jsx` |
| Secretaría | Mesa de Partes, Libro digital, Seguimiento | `SecretariaWorkbenchView.jsx` |
| Dirección | Bandeja de Dirección, Libro, Seguimiento | `DireccionWorkbenchView.jsx` |
| Oficina (una cuenta por cada una de las 6 oficinas reales) | Bandeja de oficina, Libro, Seguimiento | `OfficeWorkbenchView.jsx` |
| Administrador | Centro de control, Trámites y rutas, Usuarios y catálogos, Libro, **Caja y pagos**, Seguimiento | `AdminControlView.jsx`, `WorkflowAdminView.jsx`, `CatalogAdminView.jsx`, `CashReportView.jsx` |

El menú lateral (`AppShell.jsx`, objeto `NAV_BY_ROLE`) filtra qué opciones mostrar según las vistas permitidas del usuario (`myViews`). En producción, `myViews`/`myPermissions` deben llegar del backend (endpoint `/api/role-permissions` o embebidos en la respuesta de login) — el arreglo `VIEW_CATALOG`/`POSSIBLE_VIEWS_BY_ROLE` en `src/data/catalogs.js` es la referencia de qué IDs de vista existen.

## 4. Módulo de pagos — qué pantallas construir

Esto es lo más nuevo y lo que más depende de que el backend ya tenga listo su endpoint de pagos.

- **Bandeja de Tesorería** (`OfficeWorkbenchView.jsx`): cuando el trámite del expediente seleccionado tiene `monto > 0` y la oficina actual es Tesorería, mostrar la tarjeta de estado de pago (pendiente/pagado) y el botón "Registrar pago" que abre un modal con: monto (prefilado con la tarifa), método (Yape/Plin, Tarjeta/POS, Depósito, Transferencia, Efectivo), N.° de operación/voucher, fecha, y un campo opcional de evidencia (hoy un link; en producción debería ser una subida real de archivo — coordinen con Backend qué endpoint/campo usar). El botón "Completar y derivar" debe quedar **deshabilitado** mientras el pago no esté confirmado — no solo ocultarlo, deshabilitarlo con una explicación (`title`) de por qué.
- **Recibo de caja** (`ReciboPagoModal.jsx`): comprobante imprimible que se muestra automáticamente al registrar el pago. Reutilícenlo tal cual como plantilla visual.
- **Confirmación para el solicitante** (`PaymentStatusCard` en `src/components/ui.jsx`, usado en `ApplicantPortalView.jsx` y `TrackingView.jsx`): tarjeta ámbar si el pago está pendiente, verde con botón "Ver recibo" si ya se confirmó. No se muestra nada si el trámite es gratuito.
- **Reporte de Caja para el Administrador** (`CashReportView.jsx`): KPIs (total recaudado, N.° de pagos, pendiente de cobro, trámites de pago), historial filtrable, desglose por trámite, exportar CSV, y acceso al recibo de cualquier pago.

Punto honesto que también les toca a ustedes en la UI: **hoy no hay verificación automática del pago**, así que el copy de las pantallas (ya escrito en `OfficeWorkbenchView.jsx` y `PaymentStatusCard`) es deliberadamente claro sobre eso ("Aún no se ha registrado tu pago en Tesorería..."). Si el backend más adelante suma verificación automática vía pasarela, ese copy y ese flujo van a cambiar (probablemente a un estado intermedio tipo "pago en verificación").

## 4b. Requisitos estructurados del trámite (`RequirementsBlock`)

Los ~38 trámites del catálogo (TUSNE 2026, grupos 1–4) ya no describen sus requisitos como un texto libre — cada uno trae `requirementsList: [{ label, type, required, note? }]` (ver `src/models/procedure.js`). El componente que pinta esto, usado en el portal del solicitante, Secretaría y las oficinas, distingue:

- `type: 'form'` — dato que ya viene en el FUT (solo checkbox, sin adjunto).
- `type: 'document'` — exige checkbox + campo de enlace (hoy Google Drive; en producción, subida real).
- `type: 'payment'` — el comprobante de pago, con su propio bloque separado al final del formulario.
- `type: 'condition'` — una condición que evalúa la oficina, no el solicitante.
- `required: 'conditional'` — obliga a un choice explícito "aplica / no aplica" antes de permitir el envío (`requirementSatisfied` en `src/models/procedure.js` es la fuente de verdad de cuándo un requisito está satisfecho).

Pórtenlo tal cual: la validación de "puedo enviar" no es solo "hay algo en el input", es la función `requirementSatisfied`/`requirementIncluded` de `src/models/procedure.js`, y debe ejecutarse igual en el cliente (UX) y en el backend (autoridad real).

También hay trámites con `active: false` (ej. `copia_silabos`) — deben desaparecer del selector del portal (`canRequestProcedure`) pero seguir siendo visibles/editables en `CatalogAdminView.jsx` para el administrador.

## 4c. Quién puede iniciar cada trámite (`allowedCreators`)

Decisión del 2026-09-24: además de tarifa/requisitos, cada trámite declara en `allowedCreators` qué orígenes pueden generar su expediente — un subconjunto de `'applicant'` (portal), `'secretaria'` (ingreso físico) y `'office'` (la propia oficina especializada de la ruta, ej. Comisión de Admisión para trámites de admisión). Por defecto es `['applicant','secretaria']`, igual que el comportamiento histórico.

- `canRequestProcedure(procedure, origin)` en `src/models/procedure.js` ahora acepta un segundo parámetro opcional: sin él, solo valida que el trámite esté activo y con tarifa definida; con él, exige además que ese origen esté en `allowedCreators`. El portal filtra con `'applicant'`, Secretaría con `'secretaria'`.
- `ProcedureFormModal.jsx` tiene un nuevo bloque de checkboxes ("¿Quién puede iniciar este trámite?") para que el administrador configure `allowedCreators` por trámite.
- `OfficeWorkbenchView.jsx` agrega un botón "Nueva solicitud" (permiso `case.originate`), visible solo si existe al menos un trámite con `'office'` en `allowedCreators` **y** cuya ruta publicada incluya a esa oficina — una oficina no debe poder iniciar el trámite de otra. Reutiliza el mismo formulario tipo FUT que ya existe en `SecretariaWorkbenchView.jsx`, y llama a `onCreatePhysical(data, 'office')` en vez de con el origen por defecto.
- Hoy ningún trámite del catálogo tiene `'office'` habilitado — la capacidad está lista para cuando se agreguen los trámites de admisión/matrícula/cursos (Grupo 5, aún pendiente de datos de SLA/tarifa).

## 4d. Permisos por oficina específica (decisión 2026-09-24)

Antes, las 12 oficinas reales compartían un único rol `oficina` con los mismos permisos y vistas. Ahora el Administrador puede además personalizar una oficina puntual (ej. que solo Tesorería vea "Caja y pagos", o que Biblioteca no pueda redirigir expedientes) sin afectar a las demás.

- `RolePermissionsView.jsx` (dentro de "Usuarios y catálogos" → pestaña "Roles y Permisos") ahora tiene dos paneles en la columna izquierda: "Roles del sistema" (como antes) y un nuevo "Personalizar por oficina" que lista las oficinas operativas. Seleccionar una oficina muestra sus vistas/permisos efectivos — heredados del rol `oficina`, o su propio override si ya fue personalizada (badge "Personalizado").
- Marcar o desmarcar cualquier casilla sobre una oficina sin personalizar la personaliza automáticamente (no hace falta un paso previo de "activar personalización"); un botón "Restablecer al rol Oficina" la vuelve a hacer heredar del rol compartido.
- `src/data/catalogs.js`: `officeViews(officeId)` / `officePerms(officeId)` resuelven el efectivo (override si existe, si no el rol `oficina`) — úsenlas en vez de leer `role_permissions` directo para cualquier cuenta de oficina. `officeHasCustomPermissions(officeId)` dice si tiene override propio.
- `App.jsx`: `myViews`/`myPermissions` ya usan `officeViews(officeId)`/`officePerms(officeId)` en vez del rol cuando `profileId === 'oficina'` — repliquen esa misma resolución (override de oficina antes que rol) al calcular qué puede ver/hacer el usuario autenticado.
- Verificado en navegador: personalizar Tesorería para quitarle "Redirigir a otra oficina" hace que ese botón desaparezca de su propia bandeja real (`OfficeWorkbenchView.jsx`) sin afectar a otras oficinas, y "Restablecer al rol Oficina" revierte el cambio.

## 5. Contrato de API a consumir

Debe coincidir con lo que expone Backend (ver su documento). Si el backend cambia algo acá, tienen que avisarles a ustedes.

```
POST   /api/auth/login                    { username, password } -> { token, user }
POST   /api/auth/login-google             { email }              -> { token, user }
POST   /api/auth/logout

GET    /api/offices
POST   /api/offices                       (admin)
PUT    /api/offices/{id}                  (admin)
DELETE /api/offices/{id}                  (admin)

GET    /api/procedures
POST   /api/procedures                    (admin)  { name, category, requirementsList[], sla, tariffStatus, monto, active, source, validFrom, route[] }
PUT    /api/procedures/{id}
DELETE /api/procedures/{id}               (admin)
POST   /api/procedures/{id}/publish-route (admin/direccion)  { route[] }

GET    /api/users
POST   /api/users                         (admin)
PUT    /api/users/{id}
POST   /api/users/{id}/reset-password     (admin)
POST   /api/users/{id}/toggle-active      (admin)
POST   /api/users/import-csv              (admin)

GET    /api/role-permissions
PUT    /api/role-permissions/{role}       (admin)  { views[], permissions[] }
GET    /api/office-permissions            devuelve solo las oficinas con override propio
PUT    /api/office-permissions/{officeId} (admin)  { views[], permissions[] } — crea o reemplaza el override
DELETE /api/office-permissions/{officeId} (admin)  quita el override; la oficina vuelve a heredar el rol Oficina

GET    /api/expedientes                   ?estado=&oficina=&search=
GET    /api/expedientes/{id}
POST   /api/expedientes/virtual           (estudiante/docente)
POST   /api/expedientes/fisico            (secretaria)
POST   /api/expedientes/oficina           (oficina, con permiso "Iniciar expedientes directamente desde la oficina")
POST   /api/expedientes/{id}/registrar-virtual  (secretaria)
POST   /api/expedientes/{id}/proveido           (direccion)     { proveido, routePlan[] }
POST   /api/expedientes/{id}/observar           (oficina)       { text }
POST   /api/expedientes/{id}/subsanar           (solicitante)   { adjuntos[] }
POST   /api/expedientes/{id}/completar          (oficina)       { note, document }
POST   /api/expedientes/{id}/redirigir          (oficina)       { officeId, note }
POST   /api/expedientes/{id}/finalizar          (secretaria)
POST   /api/expedientes/{id}/pago               (oficina=tesoreria)  { monto, metodo, voucher, fecha, comprobante }

GET    /api/reportes/caja                 ?desde=&hasta=&procedure_id=  (admin)
GET    /api/reportes/caja/export.csv      (admin)
```

Cada acción devuelve el expediente actualizado (o un error 4xx con un mensaje legible — ver sección 6). Después de cada acción exitosa, refresquen el expediente seleccionado con la respuesta del propio endpoint en vez de volver a pedir la lista completa — así evitan parpadeos y llamadas innecesarias.

## 6. Manejo de errores de negocio

El backend va a devolver los mismos mensajes que hoy lanza `src/workflowEngine.js` (ej. "El expediente no está pendiente en Dirección", "Debe registrar el pago del trámite antes de completar este paso"). Muéstrenlos tal cual en el toast de error — ya están redactados para el usuario final, no hace falta traducirlos ni genéricos tipo "Ocurrió un error".

## 7. Autenticación desde el cliente

- Login por usuario/contraseña y "Google institucional" (simulado en el prototipo; en producción puede ser un SSO real o seguir siendo un login por correo institucional validado contra la base de datos).
- Guardar el token (Sanctum) y adjuntarlo a cada request.
- **El rol y las vistas/permisos deben venir del backend en el login**, no seguir siendo un array hardcodeado en el cliente como hoy (`DEFAULT_ROLE_PERMISSIONS` en `src/data/catalogs.js`). Usen esa constante solo como referencia de qué forma debe tener la respuesta. Para una cuenta de oficina, la respuesta de login debe traer ya el efectivo resuelto (override de `office_permissions` si existe, si no el rol `oficina`) — el cliente no debe tener que combinar ambos.
- Persistencia de sesión: el prototipo guarda la sesión en `localStorage` (`loadSession`/`saveSession` en `src/repositories/prototypeRepository.js`) para no perder el login al refrescar la página — repliquen esa misma UX (por ejemplo, guardando el token y revalidándolo al cargar).
- El login por oficina ("acceso directo por oficina" en la pantalla de login) debe seguir siendo cuentas reales, una por oficina — no un selector genérico. Ver `LoginView.jsx` para la UI ya resuelta.

## 8. Mapeo prototipo → producción (lo que a ustedes les toca)

| En el prototipo (hoy) | En producción |
|---|---|
| Funciones de `src/repositories/prototypeRepository.js` (`load*`/`save*` contra `localStorage`) | Llamadas HTTP a la API (fetch/axios, opcionalmente con React Query o SWR para cache e invalidación) |
| `src/data/catalogs.js` (arrays mutables en memoria, sincronizados a mano desde `App.jsx`) | Estado del servidor consultado vía API — ya no hace falta sincronizar nada manualmente, el backend es la fuente de verdad |
| `profileId` elegido con un selector de demo | Rol real que viene del usuario autenticado |
| Enlaces de Google Drive pegados a mano como "adjuntos" | Componente real de subida de archivos, conectado al endpoint de Backend |
| RBAC hardcodeado en `App.jsx` (`myViews`, `myPermissions`) | Debe llegar del backend; el cliente solo lo usa para decidir qué mostrar, nunca es la única barrera (el backend igual debe rechazar acciones no autorizadas) |
| Toasts/errores generados localmente por cada acción | Mensajes de error que vienen de la respuesta de la API |

## 9. Dónde mirar en el código de este prototipo

| Archivo | Para qué sirve mirarlo |
|---|---|
| `src/App.jsx` | Orquestación general: qué vista se renderiza por rol, cómo se manejan toasts/confirmaciones/sesión |
| `src/models/procedure.js` | Requisitos estructurados, `canRequestProcedure`, `requirementSatisfied`/`requirementIncluded` — la lógica detrás de `RequirementsBlock` (sección 4b) |
| `src/components/ui.jsx` | Componentes compartidos ya resueltos: `Panel`, `Badge`, `StatusBadge`, `SlaBadge`, `PaymentStatusCard`, `Modal`, `Field`, `FileList`, `Timeline`, `Kpi` |
| `src/views/*.jsx` | Una vista por rol/pantalla — cada una ya tiene resuelta su UX (filtros, plantillas rápidas, validaciones de formulario con `disabled`) |
| `src/components/CargoModal.jsx`, `ReciboPagoModal.jsx` | Comprobantes imprimibles (FUT y recibo de caja) — mismo layout, dos usos distintos |
| `src/styles.css` | Todo el sistema visual (colores, tarjetas de estado, badges, grillas responsivas) |
| `docs/GUIA_DEMO_MAESTRA.md` | Guion de demo paso a paso — útil para escribir tests E2E de aceptación |

## 10. Fuera de alcance de este prototipo (que ustedes sí deben resolver)

- Consumo real de API en vez de `localStorage` (obviamente, es el objetivo de este traspaso).
- Subida real de archivos (hoy son links de Google Drive pegados a mano).
- Notificaciones (correo/push) al solicitante cuando cambia el estado de su expediente.
- Manejo de sesión expirada/token inválido (redirigir a login, refrescar token, etc.).
- Estados de carga y reintentos de red (el prototipo no los necesita porque todo es síncrono en memoria).
