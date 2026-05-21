# Crowdfunding — Soroban dApp

Demo dApp pensada para charlas y talleres sobre Stellar/Soroban. Implementa el concepto de una "vaca" (caja de ahorro comunitaria) como smart contract en Soroban, con frontend para que los asistentes contribuyan en vivo desde su wallet.

## Concepto

Todos en LATAM hemos hecho una vaca alguna vez: un grupo se junta para reunir dinero hacia un objetivo común (un paseo, un regalo, un evento). El problema clásico: confianza. ¿Quién guarda la plata? ¿La organizadora va a usarla solo para el objetivo? ¿Si no se alcanza la meta, devuelven lo aportado?

El contrato resuelve esto poniendo las reglas en código:

- Las reglas están escritas en el contrato y no se pueden alterar después de desplegado.
- Cualquiera puede verificar el estado on-chain.
- El organizador (admin) solo puede retirar si se alcanza la meta.
- Si no se alcanza para una fecha límite, los aportantes pueden retirar lo suyo.

## Caso de uso durante la charla

1. Antes de la charla, desplegar el contrato en testnet con la wallet del speaker como admin.
2. Inicializar un crowdfunding de ejemplo: meta 50 XLM, deadline 60 minutos desde el inicio.
3. Los asistentes conectan Freighter, fondean su wallet con Friendbot, y contribuyen lo que quieran.
4. En la dApp se ve en vivo la barra de progreso subiendo, los contribuyentes apareciendo, el contador bajando.
5. Si alcanzan la meta: el speaker retira como admin (mostrando el control de acceso en acción).
6. Tener una segunda instancia pre-expirada con meta no alcanzada para demostrar el flujo de refund sin tener que esperar.

## Funcionalidad del contrato

### Estado del crowdfunding

- `admin`: la dirección que organiza el crowdfunding y puede retirar al cumplirse la meta.
- `name`: nombre legible (por ejemplo, "Vaca de la charla").
- `goal`: monto objetivo en stroops (1 XLM = 10⁷ stroops).
- `deadline`: timestamp Unix hasta el cual se aceptan contribuciones.
- `total_raised`: monto acumulado actual.
- `contributions`: mapa de `Address -> i128` con lo aportado por cada persona.
- `status`: enum con `Active | Completed | Failed | Withdrawn`.
- `token`: dirección del token usado (Stellar Asset Contract del XLM nativo).

### Funciones públicas

Cualquier wallet puede llamarlas.

- `contribute(from: Address, amount: i128)` — aporta al crowdfunding. Verifica que el crowdfunding esté activo, que no haya pasado el deadline, transfiere el token al contrato, actualiza `total_raised` y `contributions[from]`. Si con esta contribución se alcanza la meta, marca como `Completed`.
- `refund(from: Address)` — solo si el estado es `Failed` (deadline pasó sin alcanzar meta). Transfiere de vuelta lo aportado por `from`, marca su contribución como retirada.
- `get_status()` — retorna el estado actual y porcentaje completado.
- `get_contribution(addr: Address)` — retorna cuánto aportó una dirección.
- `total_raised()` / `total_contributors()` — para mostrar en UI.

### Funciones solo-admin

Verifican `admin.require_auth()` al inicio y revierten si quien llama no es el admin.

- `initialize(admin, name, goal, deadline, token)` — inicializa el crowdfunding una sola vez.
- `withdraw()` — solo si el estado es `Completed`. Transfiere todos los fondos al admin, marca como `Withdrawn`.
- `extend_deadline(new_deadline)` — opcional. Solo permitido si el crowdfunding aún está activo.

### Transición de estado

- Llamada pública `check_expiration()` que cualquiera puede invocar para marcar el crowdfunding como `Failed` si pasó el deadline sin alcanzar meta. Necesario porque los smart contracts no se ejecutan solos.

### Eventos a emitir

Para que el frontend pueda escuchar y reaccionar:

- `contribute_event(from, amount, total_raised)`
- `goal_reached_event(total_raised)`
- `withdrawn_event(admin, amount)`
- `refunded_event(from, amount)`

## Stack recomendado

### Contrato

- Soroban SDK (Rust). Sin librerías externas.
- Patrón admin implementado manualmente: la dirección admin se guarda en Instance storage al inicializar; las funciones admin-only llaman `admin.require_auth()` al inicio para verificar quién está invocando.
- XLM nativo manejado vía Stellar Asset Contract.

### Frontend

- Next.js + TypeScript + Tailwind.
- `@stellar/stellar-sdk` para construir y firmar transacciones.
- `@stellar/freighter-api` para conectar la wallet Freighter.
- Stellar RPC en testnet: `https://soroban-testnet.stellar.org`.

### Indexer / data fetching

- Para la barra de progreso en tiempo real: polling cada 5–10 segundos al RPC para leer el estado del contrato. Suficiente para una demo en vivo.
- Opcionalmente, escuchar eventos del contrato vía SSE de Stellar RPC para reactividad más fina.

## UI mínima necesaria

Pantalla principal:

- Nombre del crowdfunding y descripción.
- Barra de progreso visual (% hacia la meta).
- Monto recaudado vs meta.
- Tiempo restante (countdown).
- Botón "Conectar Freighter".
- Input de monto + botón "Contribuir".
- Lista de últimos N contribuyentes (dirección truncada + monto + timestamp).

Pantalla admin (solo visible si la wallet conectada es el admin):

- Estado actual del crowdfunding.
- Botón "Retirar fondos" (habilitado solo si meta alcanzada).
- Información para auditoría.

Estados visuales:

- Activo: animaciones, barra subiendo, contador.
- Meta alcanzada: confeti, mensaje de éxito, botón de admin habilitado.
- Expirado sin meta: mensaje claro, botón de refund visible para los contribuyentes.

## Demo en vivo durante la charla

Guion sugerido:

1. Mostrar el contrato en código (no editar, solo explicar la estructura).
2. Recordar que ya fue desplegado en testnet — mostrar el contract address.
3. Abrir la dApp.
4. El speaker conecta su wallet primero (como admin).
5. Pedir a los asistentes que conecten Freighter y fondeen con Friendbot.
6. Cada quien contribuye lo que quiera.
7. En pantalla se ve la barra de progreso subir y los contribuyentes aparecer.
8. Cuando se alcanza la meta, el speaker muestra que puede retirar (botón habilitado solo para él).
9. Verificar la transacción de retiro en Stellar Expert.
10. Mostrar la segunda instancia (la pre-expirada) y demostrar el flujo de refund.

## Justificación pedagógica

Este caso permite mostrar:

- Estado on-chain (storage del contrato).
- Control de acceso por roles (admin vs cualquiera).
- Manejo de tokens (transferencias de XLM dentro del contrato).
- Lógica condicional basada en tiempo (deadline).
- Patrón de refunds (devolución condicional).
- Emisión de eventos.
- Integración frontend-contrato (SDK + wallet + RPC).

Todo justificado por un caso de uso que la audiencia reconoce inmediatamente.

## Decisiones tomadas

- **XLM nativo, no USDC.** Los asistentes pueden conseguirlo gratis vía Friendbot, no necesitan stablecoins. Se usa el Stellar Asset Contract del XLM nativo.
- **Deadline corto en la demo.** 30–60 minutos para que el ciclo completo quepa en la charla.
- **Dos instancias pre-creadas.** Una activa para la demo en vivo, una pre-expirada para mostrar refund sin esperar.
- **Sin códigos de claim ni capas extra.** El pool acepta cualquier contribución, el flujo es directo.

## Próximos pasos para implementación

1. Bootstrap del proyecto Rust con `stellar contract init`.
2. Implementar el contrato siguiendo la especificación de arriba.
3. Tests unitarios para los flujos principales: contribute, withdraw, refund, expiration.
4. Deploy a testnet y guardar el contract ID.
5. Bootstrap del frontend Next.js.
6. Integrar Freighter y Stellar SDK.
7. Probar el flujo end-to-end con varias wallets distintas.
8. Refinar UI para que se vea bien en proyector (texto grande, contraste alto, sin scroll).
9. Día previo: deploy fresco, verificar todo funcione, fondear varias wallets de prueba.
