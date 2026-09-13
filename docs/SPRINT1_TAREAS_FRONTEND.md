# Sprint 1 — Tareas de Frontend

Checklist resumido para repartir ya. El detalle técnico completo de cada punto está en `docs/HANDOFF_FRONTEND.md` — este documento es solo "qué hacer y en qué orden", listo para copiar a Trello. Hay una versión hermana para Backend en `docs/SPRINT1_TAREAS_BACKEND.md` — la lista "Compartido / Bloqueante" es igual en ambos documentos porque hay que resolverla junto con Backend antes de programar en paralelo.

## Cómo pasarlo a Trello

1. Tablero: **"ARIB Mesa de Partes — Sprint 1"** (el mismo para ambos equipos, o uno propio de Frontend — como prefieran).
2. Lista: **Frontend**. Cada `### Tarjeta:` de abajo es una tarjeta — el título en negrita como nombre, las líneas de abajo como descripción/checklist.
3. Agreguen también la lista **Compartido / Bloqueante** (ver abajo) — resolver esas tarjetas ANTES de empezar a programar.

---

## Lista: Compartido / Bloqueante (resolver junto con Backend antes de programar en paralelo)

### Tarjeta: Confirmar el contrato de API
- Backend y Frontend se sientan juntos y revisan la sección "Contrato de API" de `HANDOFF_BACKEND.md` / `HANDOFF_FRONTEND.md` (son la misma lista en ambos documentos).
- Si algo cambia, se actualiza en LOS DOS documentos el mismo día.

### Tarjeta: Decidir permisos por-rol vs. por-oficina
- Hoy el prototipo maneja permisos por ROL compartido (las 6 oficinas comparten el rol "oficina").
- Pregunta abierta: ¿alguna oficina necesitará permisos distintos a las demás? Si sí, cambia qué debe devolver el backend en el login y cómo el frontend decide qué mostrar.

### Tarjeta: Confirmar qué NO entra en este sprint
- Verificación automática de pagos (pasarela/Yape) → es Sprint 2, ver `SPRINT2_PASARELA_PAGOS.md`. No construir esa UI ahora.
- Notificaciones por correo/push: fuera de alcance.
- Subida de archivos: sí entra (evidencia de pago), apuntando al endpoint real de Backend en vez de la simulación con `data:` URL del prototipo.

---

## Lista: Frontend

### Tarjeta: Reemplazar `localStorage` por la API
- Todo lo que hoy vive en `src/repositories/prototypeRepository.js` pasa a ser llamadas HTTP.
- Recomendado: React Query o SWR para cache/invalidación en vez de manejar todo a mano.

### Tarjeta: Login real
- Formulario de usuario/contraseña + botón Google institucional, contra los endpoints de Sanctum.
- Guardar el token y adjuntarlo a cada request.
- El rol y permisos del usuario deben venir del backend en la respuesta de login — dejar de usar `DEFAULT_ROLE_PERMISSIONS` hardcodeado.
- Persistir sesión al refrescar la página (mismo comportamiento que hoy).

### Tarjeta: Portar las vistas por rol
- Un componente por rol: Estudiante/Docente, Secretaría, Dirección, Oficina, Administrador — ya están resueltas en `src/views/*.jsx`, es portar UI + conectarlas a la API real.
- Reusar tal cual: `ui.jsx` (Panel, Badge, StatusBadge, Modal, Field, FileList, PaymentStatusCard), `CargoModal.jsx`, `ReciboPagoModal.jsx`.

### Tarjeta: Módulo de pagos (UI)
- Formulario de "Registrar pago" en Tesorería con subida real de archivo (ya no simulada con `data:` URL — apunta al endpoint de Backend).
- Tarjeta de estado de pago para el solicitante (`PaymentStatusCard`).
- Reporte de Caja para el Administrador (`CashReportView.jsx` como referencia).

### Tarjeta: Manejo de errores y sesión
- Mostrar tal cual los mensajes de error que devuelve la API (ya están redactados para el usuario final).
- Redirigir a login si el token expira/es inválido.
- Estados de carga (spinners/skeletons) — el prototipo no los necesita porque todo es síncrono en memoria, la versión real sí.

---

## Definición de Terminado (lo que le toca a Frontend)

- [ ] Un usuario real puede loguearse y ver solo las vistas/acciones que le corresponden según lo que devuelve el backend (no un valor hardcodeado en el cliente).
- [ ] Un FUT se puede presentar, subsanar y hacer seguimiento de principio a fin contra la API real.
- [ ] La UI de pagos (registrar, ver estado, ver recibo) funciona con archivos reales subidos al backend.
- [ ] Los mensajes de error de la API se muestran tal cual, sin genéricos tipo "Ocurrió un error".
- [ ] La sesión persiste al refrescar y expira correctamente si el token es inválido.

## Dónde está el detalle completo

- `docs/HANDOFF_FRONTEND.md` — vistas por rol, contrato de API a consumir, manejo de sesión.
- `docs/SPRINT1_TAREAS_BACKEND.md` — para coordinar con Backend.
- `docs/SPRINT2_PASARELA_PAGOS.md` — para después de este sprint, no ahora.
