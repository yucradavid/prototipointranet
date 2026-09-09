# Guía de demostración del prototipo maestro

1. Entrar como **Administrador** y mostrar `Centro de control`: expedientes activos y ubicación actual.
2. Ir a `Trámites y rutas`, seleccionar un trámite y demostrar que Mesa de Partes + Dirección están bloqueados. Arrastrar una oficina, conectarla y publicar una nueva versión.
3. Cambiar a **Estudiante** y registrar un FUT virtual.
4. Cambiar a **Secretaría**: validar la solicitud, generar N.° expediente y mostrar que pasa automáticamente a Dirección.
5. Cambiar a **Dirección**: revisar la ruta sugerida, emitir proveído y activarla.
6. Cambiar a **Oficina destino**: seleccionar la oficina correspondiente y completar el paso. Si hay otro paso, el sistema deriva automáticamente.
7. Mostrar una **observación** desde una oficina. Volver a Estudiante, subsanar, y comprobar que regresa a la misma oficina.
8. Completar el último paso. Cambiar a Secretaría y registrar entrega/cierre.
9. Mostrar `Libro digital` y `Seguimiento global` para explicar trazabilidad.

## Mensaje clave

El prototipo representa la **versión objetivo del módulo**, mientras que los sprints posteriores dividirán esta visión en incrementos implementables por Backend, Frontend y QA.
