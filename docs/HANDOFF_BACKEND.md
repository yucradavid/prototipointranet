# Traspaso a producción — Backend (Laravel 11 + PostgreSQL)

Este documento es para el desarrollador de **Backend**. Hay una versión hermana para Frontend en [`HANDOFF_FRONTEND.md`](HANDOFF_FRONTEND.md) — el **contrato de API** (sección 6) es el punto de contacto entre ambos documentos y debe mantenerse igual en los dos. Este documento cubre **Sprint 1** (verificación de pago manual, tal como está hoy el prototipo); la verificación **automática** contra una pasarela real es **Sprint 2**, documentado aparte en [`SPRINT2_PASARELA_PAGOS.md`](SPRINT2_PASARELA_PAGOS.md).

> El prototipo de este repositorio (React + `localStorage`, sin backend) no es el Sprint 1 recortado: es la **especificación viva y ya probada** del comportamiento que ustedes deben reproducir con datos reales. No rediseñen las reglas de negocio desde cero — pórtenlas. Todo lo que hoy es una función en `src/workflowEngine.js` ya está pensado y probado (`tests/workflow.test.mjs` + `tests/catalog-regression.test.mjs`, 29 casos).

---

## 1. Regla institucional del dominio

```
Solicitante → Mesa de Partes → Dirección (proveído obligatorio) → Oficina(s) según ruta → Mesa de Partes (cierre)
```

- **Mesa de Partes** y **Dirección** son pasos fijos: nunca configurables, nunca salteables, nunca se repiten dentro de una ruta.
- Ninguna oficina puede recibir un expediente sin que Dirección haya emitido antes su **proveído** (V°B° + ruta activada).
- Cada trámite tiene una **ruta canónica versionada** (plantilla). Dirección puede ajustarla puntualmente al emitir el proveído sin alterar la plantilla publicada — el expediente guarda su propia copia (`route_plan`, `route_version`).
- Una oficina puede **observar** un expediente (regresa al solicitante), **completarlo** (avanza al siguiente paso de la ruta o cierra la ruta) o **redirigirlo** de forma extraordinaria a otra oficina fuera de la ruta (se reinserta y continúa el resto de la ruta original después).

## 2. Máquina de estados que el backend debe implementar

| Estado | Significado | Transición válida (función de referencia en `workflowEngine.js`) |
|---|---|---|
| `SOLICITUD_VIRTUAL` | El solicitante envió su FUT virtual; ya tiene N.° de expediente pero Secretaría no lo validó | → `EN_DIRECCION` vía `registerVirtual` |
| `EN_DIRECCION` | Registrado (físico o virtual validado), esperando proveído | → `EN_OFICINA` vía `issueProveido` |
| `EN_OFICINA` | En atención en la oficina actual, según `route_plan[route_index]` | → `EN_OFICINA` (siguiente paso), `OBSERVADO`, o `RESPUESTA_MESA` (si era el último paso) |
| `OBSERVADO` | La oficina actual pidió subsanación; expediente regresó al solicitante | → `EN_OFICINA` (misma oficina) vía `correctObservation` |
| `RESPUESTA_MESA` | La ruta terminó; expediente vuelve a Mesa de Partes para notificar/entregar | → `FINALIZADO` vía `finalizeCase` |
| `FINALIZADO` | Cerrado y entregado | Estado terminal |

**Importante:** el N.° de expediente (`numero`) se asigna una sola vez, en el momento de la creación (virtual o física) — nunca se reasigna ni se recalcula después. Antes el prototipo manejaba dos numeraciones distintas (código temporal vs. definitivo) y generaba confusión real a los usuarios; quedó corregido y **debe** mantenerse así (ver test `el N.° de expediente se asigna desde el envío virtual, no al registrar`). En una base de datos real, usen una secuencia/`bigserial` con el `INSERT` dentro de una transacción — no calculen el siguiente número en la aplicación leyendo un `MAX()` sin bloqueo, porque con usuarios concurrentes van a duplicar números.

Funciones puras de referencia (todas en `src/workflowEngine.js`, sin dependencias de UI, cada una lanza `Error` con un mensaje claro cuando la transición no es válida):

```
createVirtual · registerVirtual · createPhysical · issueProveido
observeAtOffice · correctObservation · completeOfficeStep · finalizeCase
redirectToOffice · registerPayment · requiresPayment
validateWorkflowRoute · slaInfo · canDeleteOffice · canDeleteProcedure
authenticate · authenticateByEmail · validateRolePermissions
```

Repliquen exactamente esos mensajes de error como respuestas de la API (código 422 con el mensaje), porque el frontend los mostrará tal cual al usuario — no hace falta inventar nuevos.

## 3. Invariantes que el backend debe validar sí o sí (nunca confiar en que el frontend ya lo validó)

1. `route_plan` nunca puede contener `mesa_partes` ni `direccion`, ni repetir una oficina (`validateWorkflowRoute`).
2. No se puede completar un paso en Tesorería si el trámite tiene `monto > 0` y no existe un pago con `estado = 'PAGADO'` para ese expediente (`completeOfficeStep` + `requiresPayment`).
3. El N.° de expediente se asigna una sola vez, nunca se reasigna.
4. No se puede eliminar una oficina o un trámite que tenga expedientes asociados o esté en una ruta publicada (`canDeleteOffice`, `canDeleteProcedure`).
5. El rol `admin` no puede perder acceso a la vista de catálogos (`validateRolePermissions`) — es la única forma de revertir un error de permisos; si se pierde, nadie puede arreglarlo sin acceso directo a la base de datos.
6. Login: verificar `password` (hasheada, `Hash::check`) y que `active = true`. Un usuario inactivo nunca autentica, aunque la contraseña sea correcta.
7. Cada transición de estado solo es válida desde estados específicos (tabla de la sección 2) — repliquen cada `if (exp.estado !== 'X') throw ...` como una regla de servicio o un `FormRequest`/Policy, y devuelvan 422/403 según corresponda si no se cumple.
8. Cada acción sobre un expediente (proveído, observar, completar, redirigir, pago, finalizar) debe verificarse contra el permiso del **usuario autenticado en el servidor** — el frontend solo oculta botones para UX, eso no es seguridad.
9. **Origen de registro (decisión 2026-09-24):** cada trámite declara en `allowed_creators` quién puede generarlo — el propio solicitante (`applicant`), Secretaría (`secretaria`), o la oficina especializada de su ruta (`office`). Al crear un expediente, validen que el origen de la petición esté en `allowed_creators` del trámite antes de insertar — si no, 422 con "Este trámite no admite ser iniciado desde este origen." Por defecto (catálogo migrado) es `['applicant','secretaria']`; ningún trámite hoy tiene `office` habilitado porque el catálogo del Grupo 5 (admisión/matrícula/cursos) aún no está cargado — esta validación ya está lista para cuando se agregue. Si el origen es `office`, verifiquen además que la oficina autenticada esté en el `route` publicado de ese trámite — una oficina no debe poder originar el trámite de otra.
10. **Permisos por oficina (decisión 2026-09-24):** el rol `oficina` da un permiso/vista por defecto a las 12 oficinas, pero el Administrador puede personalizar una oficina específica (ej. que solo Tesorería vea "Caja y pagos" y registre pagos, o que solo Comisión de Admisión pueda iniciar expedientes). Al autorizar una acción de un usuario con `role = 'oficina'`, resuelvan primero si existe un override en `office_permissions` para su `office_id`; si existe, usen exactamente esos `views`/`permissions` en vez de los del rol — no los combinen ni los unan. Sin override, la oficina usa el rol `oficina` tal cual. Esto es autorización real, no solo UI: el backend debe aplicar esta resolución en cada policy/middleware, igual que ya hace con el rol.

## 4. Módulo de pagos (Caja) — lo que más depende de ustedes

### 4.1 Qué existe hoy (simulado en el cliente, sin backend)

- Cada trámite tiene un campo `monto` (S/, catálogo de tarifas). `monto = 0` → trámite gratuito.
- Cuando un expediente con `monto > 0` llega a la oficina **Tesorería**, el sistema exige registrar el pago antes de dejar completar el paso.
- El registro de pago captura: `monto`, `metodo` (Yape/Plin, Tarjeta/POS, Depósito, Transferencia, Efectivo), `voucher` (N.° de operación escrito a mano por el cajero), `fecha`, y opcionalmente `comprobante` (hoy un enlace externo a una foto/captura, porque no hay backend para subir archivos).
- Al registrarse, se genera un recibo de caja imprimible.

### 4.2 Punto honesto que deben tener claro antes de presupuestar esto

**Hoy no hay ninguna verificación automática de que el dinero llegó.** Tesorería solo transcribe lo que ve en un comprobante físico o una captura de pantalla. Verificar de verdad un pago requiere una de estas dos rutas — son decisión de producto/alcance, coordínenlo con el cliente antes de fijar el modelo de datos definitivo:

1. **Conciliación manual con evidencia real** (recomendado para el primer release): igual al flujo de hoy, pero con subida real de archivos (Laravel `Storage`, disco local o S3) en vez de un link externo pegado a mano.
2. **Verificación automática** (Sprint 2 aparte, con su propio documento: [`SPRINT2_PASARELA_PAGOS.md`](SPRINT2_PASARELA_PAGOS.md)): integrar una pasarela de pagos (recomendado: Culqi) y procesar su webhook de confirmación contra el expediente. Esto exige que el pago se *inicie* desde el sistema (generar una orden de cobro), no solo que se registre después de hecho.

### 4.3 Modelo de datos del pago (mínimo viable, opción 1)

```sql
create table pagos (
  id                bigserial primary key,
  expediente_id     bigint not null references expedientes(id),
  monto             numeric(10,2) not null,
  metodo            varchar(40) not null,   -- 'yape_plin' | 'tarjeta_pos' | 'deposito' | 'transferencia' | 'efectivo'
  voucher           varchar(120) not null,
  fecha_pago        date not null,
  comprobante_path  varchar(255),           -- ruta real en storage
  estado            varchar(20) not null default 'PAGADO',
  registrado_por    bigint not null references users(id),
  created_at        timestamp not null default now()
);
```

Un expediente tiene como máximo un pago en el modelo actual (no se contemplan pagos parciales ni reintentos). Si el negocio pide eso a futuro, esta tabla ya está lista para admitirlo (basta con permitir varias filas por `expediente_id` y sumar).

## 5. Modelo de datos sugerido (PostgreSQL)

```sql
create table users (
  id bigserial primary key,
  username varchar(60) unique not null,
  email varchar(120) unique not null,
  password_hash varchar(255) not null,
  full_name varchar(150) not null,
  dni varchar(20), codigo varchar(30), anio_ingreso varchar(10), carrera varchar(150),
  role varchar(20) not null, -- 'estudiante'|'docente'|'secretaria'|'direccion'|'oficina'|'admin'
  office_id bigint references offices(id),
  active boolean not null default true,
  created_at timestamp, updated_at timestamp
);

create table offices (
  id bigserial primary key,
  name varchar(120) not null,
  short_code varchar(10) not null,
  color varchar(10),
  provisional boolean not null default false,  -- oficina aún no confirmada por la institución (ej. Fedatario)
  correspondence_note text,                     -- nota de correspondencia con el TUSNE mientras es provisional
  created_at timestamp, updated_at timestamp
);

create table procedures (
  id bigserial primary key,
  name varchar(150) not null,
  category varchar(80),
  requires_text varchar(255),                   -- legado: texto libre pre-migración, se conserva de solo lectura
  requirements_list jsonb not null default '[]', -- [{label, type: 'form'|'document'|'payment'|'condition', required: true|false|'conditional', note?}]
  sla_dias int not null,
  monto numeric(10,2),                           -- NULL cuando tariff_status = 'pending' (no confundir con gratuito)
  tariff_status varchar(20) not null default 'pending', -- 'pending' | 'free' | 'fixed'
  active boolean not null default true,          -- false = no acepta nuevas solicitudes, pero expedientes existentes siguen su curso
  source varchar(255),                           -- documento/fila de origen (ej. "TUSNE 2026 · fila 81")
  valid_from date,
  verification_status varchar(20) not null default 'pending', -- 'pending' | 'confirmed'
  allowed_creators jsonb not null default '["applicant","secretaria"]', -- subconjunto de 'applicant'|'secretaria'|'office'
  created_at timestamp, updated_at timestamp
);

create table workflow_configs (
  id bigserial primary key,
  procedure_id bigint not null references procedures(id),
  version int not null,
  route jsonb not null,        -- array ordenado de office_id
  status varchar(20) not null,
  updated_at timestamp
);

create table role_permissions (
  role varchar(20) primary key,
  views jsonb not null,
  permissions jsonb not null
);

-- Override opcional por oficina específica (decisión 2026-09-24), encima del rol
-- 'oficina' compartido. Una oficina sin fila aquí simplemente hereda role_permissions.oficina.
create table office_permissions (
  office_id bigint primary key references offices(id),
  views jsonb not null,
  permissions jsonb not null,
  updated_at timestamp
);
-- alternativa: spatie/laravel-permission si van a necesitar permisos por usuario individual a futuro

create table expedientes (
  id bigserial primary key,
  numero int unique not null,
  tracking varchar(30) not null,
  canal varchar(20) not null,             -- 'Virtual' | 'Físico'
  tipo_documento varchar(20) not null,
  procedure_id bigint not null references procedures(id),
  procedure_snapshot jsonb not null,      -- copia congelada de tarifa/requisitos/SLA al momento del registro (ver más abajo)
  solicitante varchar(150) not null, condicion varchar(40), programa varchar(150),
  dni varchar(20), celular varchar(20), correo varchar(120), direccion varchar(255),
  asunto varchar(255), fundamento text, numero_folios int default 1,
  estado varchar(20) not null,
  oficina_actual_id bigint references offices(id),
  firma_secretaria varchar(150), visto_bueno_direccion varchar(150), proveido text,
  route_plan jsonb not null default '[]',
  route_index int not null default -1,
  route_version int,
  respuesta text, documento_respuesta varchar(255),
  observation_office_id bigint references offices(id),
  observation_text text, observation_created_at timestamp,
  owner_user_id bigint references users(id),
  owner_profile varchar(20),
  fecha date, hora time,
  created_at timestamp, updated_at timestamp
);

create table expediente_historial (
  id bigserial primary key,
  expediente_id bigint not null references expedientes(id),
  hora varchar(10), actor varchar(80), action varchar(40), texto text,
  created_at timestamp not null default now()
);

create table expediente_adjuntos (
  id bigserial primary key,
  expediente_id bigint not null references expedientes(id),
  name varchar(150) not null,
  path_or_url varchar(255),
  size_label varchar(30),
  created_at timestamp
);

-- tabla `pagos`: ver sección 4.3
```

`route_plan` queda como `jsonb` (es solo una lista ordenada de IDs, no necesita tabla propia). `historial` y `adjuntos` sí conviene normalizarlos en tablas propias — en el prototipo viven embebidos como arrays porque todo es un blob de `localStorage`, pero en Postgres eso les impediría auditar/paginar sin reescribir un JSON gigante en cada evento.

**`procedure_snapshot` no es opcional.** Es la regla que garantiza que cambiar una tarifa o un requisito en el catálogo (`procedures`) **nunca** altera expedientes ya registrados — el expediente conserva su propia copia congelada de `{ monto, tariffStatus, requirementsList, sla_dias, name, source }` tomada al momento de `POST /api/expedientes/virtual` o `/fisico` (ver `captureProcedure` en `src/models/procedure.js`). Toda lectura posterior de tarifa/requisitos/SLA de un expediente (recibo, checklist, cómputo de SLA) debe leer `procedure_snapshot`, nunca hacer join en vivo contra `procedures`. Si el expediente es anterior a la existencia del snapshot (dato legado sin catálogo histórico), reconstruir uno con `snapshotOrigin: 'legacy_missing_catalog'` en vez de inventar una tarifa — no hay forma de recuperar automáticamente un dato que una versión anterior ya perdió.

## 6. Contrato de API a exponer

Este contrato debe coincidir con lo que consume Frontend (ver su documento). Si cambian algo acá, avísenles.

```
POST   /api/auth/login                    { username, password } -> { token, user }
POST   /api/auth/login-google             { email }              -> { token, user }
POST   /api/auth/logout

GET    /api/offices
POST   /api/offices                       (admin)
PUT    /api/offices/{id}                  (admin)
DELETE /api/offices/{id}                  (admin, valida canDeleteOffice)

GET    /api/procedures
POST   /api/procedures                    (admin)  { name, category, requirementsList[], sla, tariffStatus, monto, active, source, validFrom, route[] }
PUT    /api/procedures/{id}
DELETE /api/procedures/{id}               (admin, valida canDeleteProcedure)
POST   /api/procedures/{id}/publish-route (admin/direccion)  { route[] } -> nueva workflow_config version

GET    /api/users
POST   /api/users                         (admin)
PUT    /api/users/{id}
POST   /api/users/{id}/reset-password     (admin)
POST   /api/users/{id}/toggle-active      (admin)
POST   /api/users/import-csv              (admin)

GET    /api/role-permissions
PUT    /api/role-permissions/{role}       (admin)  { views[], permissions[] }

GET    /api/expedientes                   ?estado=&oficina=&search=  (filtrado según rol del usuario autenticado)
GET    /api/expedientes/{id}
POST   /api/expedientes/virtual           (estudiante/docente)  crea con estado SOLICITUD_VIRTUAL, valida allowed_creators='applicant'
POST   /api/expedientes/fisico            (secretaria)          crea con estado EN_DIRECCION, valida allowed_creators='secretaria'
POST   /api/expedientes/oficina           (oficina, permiso case.originate)  crea con estado EN_DIRECCION, valida allowed_creators='office' y que la oficina esté en route[]
POST   /api/expedientes/{id}/registrar-virtual  (secretaria)
POST   /api/expedientes/{id}/proveido           (direccion)     { proveido, routePlan[] }
POST   /api/expedientes/{id}/observar           (oficina)       { text }
POST   /api/expedientes/{id}/subsanar           (solicitante)   { adjuntos[] }
POST   /api/expedientes/{id}/completar          (oficina)       { note, document }
POST   /api/expedientes/{id}/redirigir          (oficina)       { officeId, note }
POST   /api/expedientes/{id}/finalizar          (secretaria)
POST   /api/expedientes/{id}/pago               (oficina=tesoreria)  { monto, metodo, voucher, fecha, comprobante(file) }

GET    /api/reportes/caja                 ?desde=&hasta=&procedure_id=  (admin) -> totales, desglose, historial paginado
GET    /api/reportes/caja/export.csv      (admin)
```

Cada endpoint de acción sobre expediente debe: verificar el permiso del usuario autenticado (policy/middleware), ejecutar la validación de dominio (sección 3), e insertar la fila correspondiente en `expediente_historial` — todo dentro de la misma transacción.

## 7. Autenticación y autorización

- **Sanctum** para sesiones SPA (el frontend real seguirá siendo una SPA en React consumiendo esta API).
- Contraseñas: **nunca** en texto plano (el prototipo las tiene así en `src/data/seed.js` porque no hay backend — no repliquen eso; usen `Hash::make`).
- Para roles/permisos, dos caminos válidos:
  - Replicar el modelo actual tal cual: una fila por rol con dos arrays (`views`, `permissions`) — simple, ya probado, suficiente si los permisos siguen siendo por-rol y no por-usuario individual.
  - Usar `spatie/laravel-permission` si prevén necesitar permisos por usuario individual o multi-rol por usuario a futuro.
- **Resuelto (decisión 2026-09-24):** las 12 oficinas reales inician sesión con cuentas distintas y comparten el rol `oficina` por defecto, pero el Administrador ya puede darle a una oficina específica (ej. Tesorería) permisos o vistas distintos a las demás, sin tocar el rol compartido. Repliquen esto con la tabla `office_permissions` de la sección 5 y la regla de resolución de la sección 3.10 — no lo simplifiquen de vuelta a "todo por rol".

## 8. Mapeo prototipo → producción (lo que a ustedes les toca)

| En el prototipo (hoy) | En producción |
|---|---|
| `localStorage` (`src/repositories/prototypeRepository.js`) | Tablas PostgreSQL + Eloquent models |
| `src/workflowEngine.js` (funciones puras) | Servicios/Actions de Laravel — mismo comportamiento, dentro de transacciones DB |
| `src/data/catalogs.js` (arrays mutables en memoria de React) | Tablas `offices`, `procedures`, `role_permissions`, `office_permissions` |
| Contraseñas en texto plano | Hasheadas (`Hash::make`) |
| Enlaces de Google Drive como "adjuntos" y "comprobante de pago" | Subida real de archivos (Laravel `Storage`) |
| Verificación de pago manual con link pegado a mano | Igual en el primer release; integración con pasarela/Yape es una fase aparte |
| `nextNumero()` calculado en el cliente sobre el array en memoria | Secuencia/`bigserial`, `INSERT` dentro de transacción, para evitar duplicados con usuarios concurrentes |

## 9. Dónde mirar en el código de este prototipo

| Archivo | Para qué sirve mirarlo |
|---|---|
| `src/workflowEngine.js` | Todas las reglas de negocio puras, con sus mensajes de error exactos |
| `src/models/procedure.js` | Normalización del trámite, requisitos estructurados (`requirementsList`), `canRequestProcedure(proc, origin)`/`getAllowedCreators` y el snapshot inmutable (`captureProcedure`/`preserveProcedureTerms`) — reprodúzcanlo tal cual, es la parte más nueva y más fácil de romper por accidente |
| `src/views/OfficeWorkbenchView.jsx` (bloque "Nueva solicitud") | Cómo la oficina especializada origina un expediente: filtra trámites por `allowedCreators` + pertenencia a su propia ruta antes de mostrar el formulario |
| `tests/workflow.test.mjs` + `tests/catalog-regression.test.mjs` | 29 casos de prueba — la especificación de comportamiento más confiable que existe |
| `src/data/catalogs.js` | Catálogo maestro de oficinas (incl. provisionales), ~38 trámites del TUSNE 2026 con requisitos estructurados y estado de tarifa, roles, vistas y permisos posibles |
| `src/data/seed.js` | Datos de ejemplo — sirven directamente como fixtures/seeders de Laravel |
| `src/repositories/prototypeRepository.js` | Qué se persiste hoy y con qué forma — mapea casi 1 a 1 a qué tablas hacen falta |

## 10. Fuera de alcance de este prototipo (que ustedes sí deben resolver)

- Autenticación real, hash de contraseñas.
- Verificación automática de pagos (pasarela/Yape) — ver sección 4.2 y `SPRINT2_PASARELA_PAGOS.md`.
- Subida y almacenamiento real de archivos.
- Notificaciones (correo/push) al solicitante cuando cambia el estado de su expediente.
- Concurrencia real: dos usuarios editando el mismo expediente al mismo tiempo, bloqueo optimista/pesimista, secuencia segura para `numero`.
- Auditoría a prueba de manipulación (hoy el historial vive en `localStorage`, editable por quien use las herramientas de desarrollador del navegador).
