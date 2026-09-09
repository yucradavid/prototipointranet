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
