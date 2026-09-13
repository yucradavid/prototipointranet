# Sprint 1 — Tareas de Backend

Checklist resumido para repartir ya. El detalle técnico completo de cada punto está en `docs/HANDOFF_BACKEND.md` — este documento es solo "qué hacer y en qué orden", listo para copiar a Trello. Hay una versión hermana para Frontend en `docs/SPRINT1_TAREAS_FRONTEND.md` — la lista "Compartido / Bloqueante" es igual en ambos documentos porque hay que resolverla junto con Frontend antes de programar en paralelo.

## Cómo pasarlo a Trello

1. Tablero: **"ARIB Mesa de Partes — Sprint 1"** (el mismo para ambos equipos, o uno propio de Backend — como prefieran).
2. Lista: **Backend**. Cada `### Tarjeta:` de abajo es una tarjeta — el título en negrita como nombre, las líneas de abajo como descripción/checklist.
3. Agreguen también la lista **Compartido / Bloqueante** (ver abajo) — resolver esas tarjetas ANTES de empezar a programar.

---

## Lista: Compartido / Bloqueante (resolver junto con Frontend antes de programar en paralelo)

### Tarjeta: Confirmar el contrato de API
- Backend y Frontend se sientan juntos y revisan la sección "Contrato de API" de `HANDOFF_BACKEND.md` / `HANDOFF_FRONTEND.md` (son la misma lista en ambos documentos).
- Si algo cambia, se actualiza en LOS DOS documentos el mismo día.

### Tarjeta: Decidir permisos por-rol vs. por-oficina
- Hoy el prototipo maneja permisos por ROL compartido (las 6 oficinas comparten el rol "oficina").
- Pregunta abierta: ¿alguna oficina necesitará permisos distintos a las demás? Si sí, el modelo de datos de `role_permissions` cambia antes de programarlo.

### Tarjeta: Confirmar qué NO entra en este sprint
- Verificación automática de pagos (pasarela/Yape) → es Sprint 2, ver `SPRINT2_PASARELA_PAGOS.md`. No implementarlo ahora.
- Notificaciones por correo/push: fuera de alcance.
- Subida de archivos: sí entra (evidencia de pago), pero como almacenamiento simple (Storage/S3), no hace falta nada más sofisticado.

---

## Lista: Backend (Laravel 11 + PostgreSQL)

### Tarjeta: Modelo de datos y migraciones
- Tablas: `users`, `offices`, `procedures`, `workflow_configs`, `role_permissions`, `expedientes`, `expediente_historial`, `expediente_adjuntos`, `pagos`.
- Ver DDL de referencia en `HANDOFF_BACKEND.md` sección 5.
- Seeders con los datos de `src/data/seed.js` y `src/data/catalogs.js` del prototipo (oficinas, trámites con su `monto`, usuarios de las 6 oficinas).

### Tarjeta: Autenticación
- Laravel Sanctum (login por usuario/contraseña + variante "Google institucional").
- Contraseñas con `Hash::make` — nunca texto plano.
- Login debe rechazar usuarios con `active = false`.

### Tarjeta: Endpoints de catálogos
- CRUD de `offices`, `procedures` (incluye campo `monto`), `users`.
- Endpoint de `role_permissions` (get/put por rol).
- Validar `canDeleteOffice`/`canDeleteProcedure` (no dejar borrar si están en uso) — lógica ya escrita en `src/workflowEngine.js`.

### Tarjeta: Máquina de estados del expediente
- Portar las funciones de `src/workflowEngine.js` (`issueProveido`, `observeAtOffice`, `correctObservation`, `completeOfficeStep`, `redirectToOffice`, `finalizeCase`) como servicios de Laravel.
- Cada acción = un endpoint (ver lista completa en `HANDOFF_BACKEND.md` sección 6).
- Los 16 tests en `tests/workflow.test.mjs` son la especificación de comportamiento — igual resultado esperado en Laravel.

### Tarjeta: Módulo de pagos (registro manual)
- Endpoint para registrar pago (monto, método, voucher, fecha, comprobante).
- Bloquear `completeOfficeStep` en Tesorería si el trámite tiene costo y no hay pago `PAGADO` — ya validado en el prototipo, portar la misma regla.
- Endpoint de reporte de Caja (totales, desglose por trámite, historial paginado).

### Tarjeta: SLA con pausa
- El SLA se pausa mientras el expediente está `OBSERVADO` o esperando pago en Tesorería, y se reanuda al resolverse.
- Ver `slaInfo` en `src/workflowEngine.js` (campos `pauseStartedAt` / `slaPausedMs`).

### Tarjeta: Auditoría administrativa
- Registrar quién crea/edita/elimina oficinas, trámites, usuarios, permisos y datos de pago (tabla aparte, no confundir con `expediente_historial`).

---

## Definición de Terminado (lo que le toca a Backend)

- [ ] Un usuario real puede autenticarse y su rol/permisos vienen correctamente en la respuesta.
- [ ] Cada endpoint de acción sobre expediente valida la regla de negocio correspondiente (no confía en que el frontend ya la validó).
- [ ] Un trámite con costo no puede completarse en Tesorería sin un pago `PAGADO`.
- [ ] El reporte de Caja y el Libro Oficial devuelven datos reales desde PostgreSQL.
- [ ] Los 16 tests de `tests/workflow.test.mjs` tienen su equivalente verificado contra los endpoints reales.

## Dónde está el detalle completo

- `docs/HANDOFF_BACKEND.md` — modelo de datos, invariantes, contrato de API, autenticación.
- `docs/SPRINT1_TAREAS_FRONTEND.md` — para coordinar con Frontend.
- `docs/SPRINT2_PASARELA_PAGOS.md` — para después de este sprint, no ahora.
