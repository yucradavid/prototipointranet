# Guía de demostración del prototipo maestro

Script paso a paso para presentar el prototipo (ej. a "el ingeniero"). Actualizado para reflejar el flujo actual: login por oficina real, módulo de pagos/Caja, Roles y Permisos granulares, y auditoría administrativa.

## 0. Pantalla de login

- Mostrar que hay tres caminos de acceso: **Google institucional** (simulado), **usuario y contraseña**, y — solo para esta demo — **accesos directos**: perfiles genéricos (Estudiante, Docente, Secretaría, Dirección, Administrador) y **pestañas por oficina real** (Biblioteca, Jefatura Académica, Tesorería, EFSRT, Unidad Académica, Secretaría Académica), cada una con su propia cuenta.
- Aclarar: en producción solo existiría Google/usuario-contraseña; los accesos directos son solo para que la demo no requiera escribir credenciales cada vez.

## 1. Administrador — panorama general

Entrar como **admin / admin123**.

1. `Centro de control`: expedientes activos, ubicación actual de cada uno, carga de trabajo por oficina, y la matriz de Roles y Permisos (ya con etiquetas legibles, no claves técnicas).
2. `Trámites y rutas`: seleccionar un trámite y mostrar que Mesa de Partes y Dirección están bloqueados en el diseñador. Arrastrar una oficina, conectarla y publicar una nueva versión de ruta.
3. `Usuarios y catálogos` — recorrer las 5 pestañas:
   - **Oficinas y Dependencias**: catálogo de las 6 oficinas reales + Mesa de Partes/Dirección.
   - **Trámites**: incluye el campo de **costo** por trámite y el bloque de **Datos de pago institucional** (Yape, cuenta bancaria, CCI) que ve el solicitante al pagar.
   - **Usuarios y Accesos**: las 6 cuentas de oficina, cambio/reseteo de contraseña, activar/desactivar.
   - **Roles y Permisos**: mostrar que "Registrar pagos en Tesorería" es un permiso independiente de "Atender y completar pasos" — se puede quitar sin afectar lo demás.
   - **Auditoría**: quién creó/editó/eliminó qué y cuándo (independiente del historial de cada expediente).

## 2. Solicitante presenta un trámite CON costo

Cerrar sesión → entrar como **Estudiante** (acceso directo).

1. "Nueva solicitud (FUT)" → elegir **Certificado modular** (S/ 25.00, se ve el costo en el mismo selector).
2. Llenar fundamento y requisitos.
3. Mostrar el bloque **"Pago del derecho de trámite"**: aparecen el Yape y la cuenta bancaria institucional, y un campo obligatorio para adjuntar el enlace del comprobante (captura de Yape/voucher).
4. Enviar → se genera el cargo oficial (FUT), que además deja constancia de que el trámite tiene costo y de qué comprobante se adjuntó.

## 3. Secretaría → Dirección

1. Entrar como **Secretaría** (secretaria/secretaria123): validar la solicitud virtual, se genera el N.° de expediente definitivo y pasa automáticamente a Dirección.
2. Entrar como **Dirección** (direccion/direccion123): revisar la ruta sugerida (para un trámite con costo, la ruta ya propone Tesorería). Si alguien quitara Tesorería de la ruta de un trámite pagado, aparece una advertencia explícita antes de firmar. Emitir el proveído.

## 4. Tesorería valida el pago

Cerrar sesión → pestaña de oficina **Tesorería** (o tesoreria/tesoreria123).

1. Abrir el expediente: se ve la tarjeta "Pago pendiente" con el monto y, si el estudiante ya adjuntó su comprobante, un enlace para revisarlo.
2. El botón "Completar y derivar" está deshabilitado — no se puede avanzar sin registrar el pago.
3. "Registrar pago": monto, método (Yape/Plin ya es la primera opción), N.° de operación, fecha — el campo de evidencia viene pre-cargado con el comprobante que subió el estudiante.
4. Al guardar, se genera el recibo de caja oficial y el botón de completar ya queda habilitado.

## 5. Oficina normal — observación y subsanación

1. Con una oficina sin costo (ej. **Biblioteca**, biblioteca/biblioteca123), observar un expediente con un motivo claro.
2. Volver a Estudiante, subsanar la observación desde su portal, y comprobar que el expediente regresa automáticamente a la misma oficina.
3. Mostrar que mientras estuvo observado (o esperando pago en Tesorería), el badge de SLA decía "SLA pausado" en vez de contar esos días como demora de la oficina.

## 6. Cierre y trazabilidad

1. Completar el último paso de la ruta → el expediente vuelve a Mesa de Partes.
2. Como Secretaría, registrar la entrega/cierre.
3. Mostrar `Libro digital`: ahora con columna de **Pago** (Pagado/Pendiente/Gratuito) junto a las firmas y el V°B°.
4. Mostrar `Seguimiento global`: cualquiera puede buscar por N.° de expediente o DNI y ver, además del recorrido, la confirmación de pago con acceso al recibo.

## 7. Vista financiera del Administrador

Volver a **Administrador** → `Caja y pagos`:

- Total recaudado, pagos registrados, monto pendiente de cobro, y desglose por trámite.
- Abrir el recibo de cualquier pago desde la tabla.
- Exportar el reporte a CSV.

## 8. Autogestión de cuenta

Con cualquier cuenta real (no un perfil demo), mostrar "Cambiar mi contraseña" en el menú lateral — pide la contraseña actual antes de permitir el cambio.

## Mensaje clave

El prototipo ya no es solo el flujo documentario: incluye el ciclo completo de **cobro de derechos de trámite** (tarifario, evidencia del solicitante, validación de Tesorería, recibo oficial y reporte financiero), con permisos granulares y auditoría administrativa. Los documentos en `docs/HANDOFF_BACKEND.md`, `docs/HANDOFF_FRONTEND.md` y `docs/SPRINT2_PASARELA_PAGOS.md` detallan cómo el equipo de producción (Laravel 11 + PostgreSQL) debe reproducir este mismo comportamiento con datos reales, y qué parte (verificación automática de pagos) queda para una segunda etapa.
