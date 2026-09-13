# IESTP ARIB · Prototipo Maestro de Mesa de Partes

Prototipo funcional de la versión objetivo del módulo Mesa de Partes. No es el Sprint 1 reducido: sirve como referencia visual y funcional para definir después los sprints de Frontend, Backend y QA.

## Regla institucional crítica

Todo documento registrado en Mesa de Partes pasa obligatoriamente por Dirección. Dirección emite V°B°/proveído y activa una ruta de oficinas. Ninguna oficina puede recibir directamente desde Secretaría.

`Solicitante → Mesa de Partes → Dirección → Oficina 1 → Oficina 2 → … → Mesa de Partes → Cierre`

## Perfiles de demostración

- Estudiante: FUT virtual, seguimiento, subsanación, descarga de respuesta.
- Docente: mismo canal de solicitante interno, con sus propias solicitudes.
- Secretaría: registro virtual/físico, libro digital, remisión obligatoria a Dirección, entrega/cierre.
- Dirección: proveído obligatorio y activación/ajuste de la ruta de atención.
- Oficina destino: bandeja por oficina, observación, atención y derivación automática al siguiente paso.
- Administrador: monitor global, diseñador visual de rutas, versiones, libro/auditoría.

En producción, Dirección y Oficina destino deben resolverse por **rol + oficina + permisos**, no por un selector manual. El selector existe solo para demostrar todas las vistas en un único frontend.

## Diseñador de flujo

Los nodos Mesa de Partes y Dirección están bloqueados. El administrador puede arrastrar oficinas al lienzo, conectarlas, moverlas, autoordenar, simular y publicar una nueva versión de la ruta para cada tipo de trámite.

Dirección recibe la plantilla publicada, puede hacer un ajuste operativo antes de firmar el proveído y activa la ruta del expediente. Cada expediente conserva `routeVersion`.

## Ejecutar

```bash
npm install
npm run dev
```

Pruebas del motor:

```bash
npm run test:logic
```

## Importante

Este prototipo utiliza `localStorage` como repositorio temporal para que el flujo sea demostrable sin backend. En producción, el Repository de React consumirá Laravel API y Laravel será la única fuente de verdad para permisos, estados, rutas y trazabilidad.

## Traspaso a producción (Frontend + Backend Laravel 11 / PostgreSQL)

Para repartir tareas ya, cada integrante tiene su propio checklist resumido, listo para copiar a Trello:

- **[`docs/SPRINT1_TAREAS_BACKEND.md`](docs/SPRINT1_TAREAS_BACKEND.md)**
- **[`docs/SPRINT1_TAREAS_FRONTEND.md`](docs/SPRINT1_TAREAS_FRONTEND.md)**

Ambos comparten la misma lista "Compartido / Bloqueante" — hay que resolverla en conjunto antes de programar en paralelo.

Cada integrante del equipo tiene además su propia guía técnica completa:

- **[`docs/HANDOFF_BACKEND.md`](docs/HANDOFF_BACKEND.md)** — máquina de estados, invariantes de negocio, modelo de datos PostgreSQL, contrato de API a exponer, autenticación/RBAC.
- **[`docs/HANDOFF_FRONTEND.md`](docs/HANDOFF_FRONTEND.md)** — vistas por rol, qué pantallas construir (incluido el módulo de pagos), contrato de API a consumir, manejo de errores y sesión.

Ambos documentos comparten el mismo contrato de API (sección "Contrato de API" en cada uno) — si alguno lo cambia, debe avisarle al otro. Son el **Sprint 1** (pago verificado manualmente por Tesorería, tal como funciona hoy este prototipo).

- **[`docs/SPRINT2_PASARELA_PAGOS.md`](docs/SPRINT2_PASARELA_PAGOS.md)** — **Sprint 2**, para cuando quieran automatizar la verificación del pago: con qué pasarela afiliarse (recomendado: Culqi), cómo se integra (tokenización → cargo → webhook), cuánto cuesta, e historias de usuario separadas para Backend y Frontend.
