# Sprint 2 — Verificación automática de pagos (pasarela de pagos)

Este documento es el encargo de **Sprint 2** para el equipo de Backend y Frontend, una vez que Sprint 1 (el traspaso descrito en `HANDOFF_BACKEND.md`/`HANDOFF_FRONTEND.md`) ya esté funcionando con verificación **manual** de pagos. El objetivo de este sprint es reemplazar (o complementar) esa verificación manual por una confirmación **automática**, contra una pasarela de pagos real.

> No es un sprint para empezar el día 1 del proyecto. Depende de que Sprint 1 ya tenga expedientes, trámites con `monto` y el flujo de Tesorería funcionando con datos reales en Postgres — este sprint solo le agrega automatización a una pieza que ya existe.

---

## 1. ¿Con qué API/proveedor afiliarse?

| | **Culqi** (recomendado para este sprint) | **PagaloPerú.pe / Niubiz** (alternativa "institucional") |
|---|---|---|
| Qué es | Pasarela de pagos peruana, orientada a desarrolladores | Producto de Niubiz (ex-VisaNet Perú) hecho específicamente para que **entidades públicas** (municipalidades, universidades, institutos) cobren tasas/derechos administrativos |
| Métodos de pago | Tarjetas Visa/Mastercard, y tiene integración con Yape dentro de su checkout | Tarjetas, agente, banca por internet, y variantes con Yape según el convenio |
| Cómo te afilias | Registro **self-service** en su panel web, con RUC de la institución; tienen ambiente de pruebas (sandbox) inmediato | Proceso **comercial**: hay que contactar a Niubiz/PagaloPerú directamente y firmar un convenio como entidad pública — no es un registro instantáneo |
| Tiempo para empezar a integrar | Días (apenas tienen las llaves de prueba ya pueden programar) | Semanas/meses (depende de la gestión administrativa del instituto, no de ustedes) |
| Curva para estudiantes | Baja — SDK de JS para tokenizar, API REST + webhooks bien documentados | Más alta — documentación menos pública, integración pensada para bancos/grandes empresas |
| Encaje con el caso de uso | Bueno, genérico | El **"correcto" a largo plazo** para una entidad pública peruana que cobra tasas — es literalmente su público objetivo |

**Recomendación para este sprint: Culqi.** Es la opción que un equipo de estudiantes puede afiliar, probar y demostrar funcionando dentro de un sprint, sin depender de que la institución gestione un convenio comercial con Niubiz (que puede tardar más que todo el proyecto). Dejen documentado que **PagaloPerú.pe es el camino recomendado si la institución algún día decide hacerlo "oficial"** — es una decisión de la Dirección/administración del instituto, no del equipo técnico, y pueden cambiar de proveedor más adelante sin rehacer todo el sistema si diseñan bien la capa de pagos (ver sección 4).

## 2. ¿Cuánto va a costar?

**Confirmen la tarifa vigente directamente en el panel de Culqi antes de comprometerse** — las comisiones cambian con el tiempo y no quiero que planifiquen presupuesto con un número que ya no esté vigente cuando lo lean. Lo que sí pueden asumir como estructura general (válido para la mayoría de pasarelas peruanas tipo Culqi):

- **No hay costo de arranque ni mensualidad fija** para empezar a integrar y probar en modo sandbox — es gratis crear la cuenta y programar contra el ambiente de pruebas.
- **Cobran una comisión por cada transacción exitosa** (un porcentaje del monto + a veces un monto fijo), descontada automáticamente antes de depositarles el dinero. Es decir, el costo es proporcional a cuánto efectivamente se cobra, no un gasto fijo mensual.
- Para pasar de sandbox a producción (cobros reales) normalmente piden datos legales de la institución (RUC, representante legal, cuenta bancaria destino) — esto sí depende de gestión administrativa del instituto, avísenle a la Dirección con anticipación.
- PagaloPerú/Niubiz probablemente tenga una estructura de costos distinta (posible tarifa por convenio, no solo por transacción) — pregúntenlo directamente si en algún momento evalúan ese camino.

**En plata simple:** mientras solo estén probando (sandbox), no cuesta nada. Cuando empiecen a cobrar de verdad en producción, el instituto paga un porcentaje pequeño de cada pago recibido — no hay que pagar nada por adelantado para desarrollar este sprint.

## 3. Cómo funciona la integración (arquitectura, sin atarse a nombres exactos de endpoints que puedan cambiar)

Toda pasarela de pagos moderna (Culqi incluido) funciona con el mismo patrón de 4 pasos — apréndanse el patrón, no memoricen endpoints que van a estar desactualizados en un año:

```
1. TOKENIZACIÓN (en el navegador del solicitante, nunca en el backend)
   El frontend usa el SDK de JS de la pasarela (ej. Culqi.js) para convertir los datos
   de la tarjeta/Yape en un "token" de un solo uso. Los datos sensibles de la tarjeta
   NUNCA tocan el servidor de Laravel — eso es lo que evita que el instituto tenga que
   cumplir PCI-DSS completo (el cumplimiento de seguridad de tarjetas más pesado).

2. CREAR EL CARGO (backend, con la llave secreta de la pasarela)
   El frontend manda el token al backend (POST /api/expedientes/{id}/pago/iniciar).
   Laravel llama a la API de la pasarela con ese token + el monto exacto del trámite,
   y la pasarela procesa el cobro. La respuesta puede ser inmediata (aprobado/rechazado)
   o quedar "pendiente" según el método.

3. CONFIRMACIÓN POR WEBHOOK (la pieza que reemplaza la verificación manual)
   La pasarela le avisa a Laravel — a una URL pública que ustedes exponen
   (ej. POST /api/webhooks/culqi) — cuando el cargo se confirma de verdad. Esto es
   necesario porque algunos métodos no confirman al instante. El backend debe:
     a) Verificar la firma/autenticidad del webhook (que de verdad venga de la pasarela).
     b) Buscar el pago/expediente asociado (por un ID de referencia que ustedes le
        pasaron al crear el cargo).
     c) Marcar el pago como PAGADO automáticamente — el mismo `registerPayment` que
        hoy hace Tesorería a mano, pero disparado por el webhook en vez de un clic.

4. EL EXPEDIENTE SE DESBLOQUEA SOLO
   En cuanto el paso 3 marca `pago.estado = 'PAGADO'`, la misma regla que ya existe
   (`completeOfficeStep` exige el pago) deja avanzar el expediente — no hace falta
   tocar esa regla de negocio, ya está lista para esto desde Sprint 1.
```

### Diseño recomendado para no atarse a un solo proveedor

Aíslen la integración detrás de una interfaz propia (ej. una clase `PaymentGatewayService` con métodos `crearCargo()` y `confirmarWebhook()`). Si mañana el instituto decide moverse a PagaloPerú/Niubiz, solo reemplazan la implementación de esa clase — el resto del sistema (expedientes, `registerPayment`, el reporte de Caja) no debería enterarse de qué pasarela están usando por debajo.

## 4. Qué cambia en el modelo de datos (sobre lo que ya definió Sprint 1)

Agregar a la tabla `pagos` (definida en `HANDOFF_BACKEND.md`, sección 4.3):

```sql
alter table pagos add column gateway varchar(30);              -- 'culqi' | 'manual'
alter table pagos add column gateway_charge_id varchar(120);   -- id del cargo en la pasarela, para reconciliar
alter table pagos add column gateway_status varchar(30);       -- estado crudo que devuelve la pasarela
alter table pagos add column gateway_raw_payload jsonb;        -- guardar la respuesta completa, por auditoría
```

`metodo`, `voucher`, `fecha_pago` siguen existiendo — un pago automático los llena solo (voucher = el ID del cargo de la pasarela); un pago manual (el flujo de hoy) los sigue llenando Tesorería a mano. **Ambos caminos conviven** — no hace falta eliminar el registro manual, es el respaldo cuando la pasarela falla o cuando el trámite se paga en efectivo en caja.

## 5. Historias de usuario — Backend (Laravel)

1. **Como sistema, quiero crear un cargo en Culqi cuando el solicitante decide pagar en línea**, para no depender de que transcriba un voucher a mano.
   - Endpoint `POST /api/expedientes/{id}/pago/iniciar` — recibe el token de Culqi.js, valida que el expediente exista y tenga `monto > 0`, llama a la API de Culqi, guarda el intento en `pagos` con `estado='PENDIENTE'` y `gateway='culqi'`.
2. **Como sistema, quiero recibir y validar el webhook de Culqi**, para confirmar el pago sin intervención humana.
   - Endpoint público `POST /api/webhooks/culqi` — **sin autenticación de usuario** (viene de Culqi, no de un usuario logueado) pero **sí debe validar la firma/autenticidad** del payload contra la pasarela para que nadie pueda falsear un "pago exitoso" enviando un POST falso.
   - Si el webhook confirma el pago, ejecutar la misma lógica de `registerPayment` (o el servicio equivalente), marcando `estado='PAGADO'`.
   - Registrar el evento en `expediente_historial` igual que hoy, con `actor='Pasarela de pagos'`.
3. **Como administrador, quiero que un pago fallido/rechazado quede registrado** (no solo los exitosos), para poder ver en el reporte de Caja cuántos intentos de pago fallan y por qué.
4. **Idempotencia**: si Culqi reintenta el mismo webhook dos veces (pasa en la práctica), el sistema no debe registrar el pago dos veces ni duplicar el historial — usar el `gateway_charge_id` como clave única.
5. **Manejo de errores**: si la pasarela está caída o rechaza el cargo, el solicitante debe poder seguir el camino manual de siempre (adjuntar comprobante, Tesorería valida) — el pago automático es un atajo, no debe ser el único camino posible.

## 6. Historias de usuario — Frontend

1. **Como solicitante, en la pantalla de pago quiero elegir entre "Pagar en línea ahora" o "Ya pagué, adjunto mi comprobante"**, para no obligar a nadie a tener tarjeta si prefiere Yape/depósito manual.
2. **Como solicitante, al elegir "Pagar en línea" quiero un formulario seguro de tarjeta** que use el SDK de Culqi.js — nunca deben escribir ustedes mismos un `<input>` que capture el número de tarjeta y lo mande a su propio backend; eso es exactamente lo que el SDK evita.
3. **Como solicitante, quiero ver el resultado inmediato del cobro** (aprobado/rechazado) sin recargar la página, y si aún está "procesando" (esperando el webhook), un estado claro de "Confirmando tu pago…" en vez de dejarlo sin respuesta.
4. **Como solicitante, en mi seguimiento quiero que la tarjeta de estado de pago (`PaymentStatusCard`, ya construida en Sprint 1) distinga** entre "pagado manualmente, validado por Tesorería" y "pagado en línea, confirmado automáticamente" — mismo componente, un dato más para mostrar de dónde vino la confirmación.
5. **Como Tesorería, en mi bandeja quiero ver si un pago vino de la pasarela o fue manual**, para saber si igual necesito revisar algo o ya está resuelto.

## 7. Definición de terminado (Definition of Done) de este sprint

- [ ] Cuenta de Culqi creada con RUC del instituto, llaves de **prueba** (sandbox) funcionando.
- [ ] Se puede completar un pago de principio a fin en sandbox: tokenizar → crear cargo → recibir webhook → expediente se desbloquea solo, sin que nadie en Tesorería haga clic en "Registrar pago".
- [ ] El camino manual (Sprint 1) sigue funcionando exactamente igual — nadie debe estar obligado a pagar en línea.
- [ ] El webhook valida la firma/autenticidad de Culqi antes de marcar cualquier pago como confirmado.
- [ ] Los reintentos de webhook no duplican pagos ni historial.
- [ ] El reporte de Caja (`CashReportView` del prototipo, o su equivalente en producción) distingue pagos manuales de pagos por pasarela.
- [ ] Documentado en el propio repo (README o este mismo archivo, actualizado) cómo pasar de sandbox a producción cuando la Dirección del instituto lo autorice — con quién hablar, qué papeles piden.

## 8. Cosas que decidir ANTES de empezar a programar (no son técnicas, son de gestión)

- ¿Quién de la institución va a firmar el registro comercial en Culqi (RUC, representante legal, cuenta bancaria de depósito)? Sin esto no se puede pasar de sandbox a producción — pueden programar y probar todo el sprint sin esto, pero no cobrar de verdad.
- ¿La Dirección está de acuerdo con pagar la comisión por transacción de la pasarela, o prefiere seguir cobrando solo por Yape/depósito manual (gratis) y dejar el pago en línea como algo opcional?
- Si más adelante quieren evaluar PagaloPerú/Niubiz en serio, eso implica contactarlos directamente — no es algo que el equipo técnico pueda "activar" por su cuenta como con Culqi.
