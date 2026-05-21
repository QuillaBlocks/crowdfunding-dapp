# Playbook · Demo en vivo

Guía paso a paso para correr la dApp en una charla: desplegar una vaca fresca,
mostrarla a la audiencia mientras aportan, y retirar los fondos al final.

> Suponemos que ya hiciste `npm install` y tienes el repo clonado. Si no, ver
> [`README.md`](README.md).

---

## 0. El día antes (preparación)

Esto se hace una sola vez, con calma. Tarda ~5 min.

### 0.1 Verifica el toolchain

```bash
stellar --version          # debe ser 26.x+
cargo --version            # 1.85+
node --version             # 20+
rustup target list --installed | grep wasm32v1-none
```

Si falta el target WASM: `rustup target add wasm32v1-none`.

### 0.2 Crea y fondea la identity del speaker

```bash
stellar keys generate speaker --network testnet --fund
stellar keys address speaker     # cópiala, esta será el admin de la vaca
```

### 0.3 Verifica que los tests del contrato pasan

```bash
npm run contract:test
# Salida esperada: test result: ok. 21 passed; 0 failed
```

### 0.4 Despliega el contrato

```bash
scripts/deploy.sh speaker
```

Esto compila, sube el WASM, despliega y regenera los bindings TypeScript con
el contract ID real. Al final imprime algo como:

```
✅ Listo. Pega este contract ID en frontend/.env.local:
   NEXT_PUBLIC_CONTRACT_ID=CABC…XYZ
```

**Anota ese `CONTRACT_ID`**, lo vas a usar tres veces.

### 0.5 Inicializa la vaca

```bash
scripts/init-crowdfunding.sh "Vaca de la charla" 50 3600 CABC…XYZ speaker
#                              ^nombre            ^meta(XLM) ^seg ^contract  ^admin
```

- Meta 50 XLM, deadline en 60 min (3600 s). Ajusta para tu evento.
- El 5° argumento (`speaker`) **es obligatorio**: define quién podrá retirar.

Confirma que quedó bien:

```bash
stellar contract invoke --id CABC…XYZ --network testnet -- admin
# debe devolver la dirección de "speaker"
stellar contract invoke --id CABC…XYZ --network testnet -- get_status
# debe devolver status=Active, total_raised=0
```

### 0.6 Configura el frontend

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edita `frontend/.env.local` y pega el contract ID:

```env
NEXT_PUBLIC_CONTRACT_ID=CABC…XYZ
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
```

### 0.7 Arranca el dev server y verifica

```bash
npm run dev
```

Abre http://localhost:3000. Tienes que ver:

- El nombre "Vaca de la charla" en grande
- Recaudado: 0 XLM · meta: 50 XLM · 0.0%
- Countdown bajando
- Badge "Testnet · Soroban" + "Activa"
- Lista "Últimos aportes" vacía

### 0.8 (Opcional) Vaca pre-expirada para el flujo de refund

Solo si quieres demostrar el refund en vivo, despliega un **segundo** contrato
con deadline corto:

```bash
scripts/deploy.sh speaker
# anota el nuevo CONTRACT_ID, llámalo CEXP…

scripts/init-crowdfunding.sh "Vaca expirada" 50 120 CEXP… speaker
# deadline = 120 segundos
```

Inmediatamente, aporta desde una segunda identity (no `speaker`):

```bash
stellar keys generate audience1 --network testnet --fund
stellar keys address audience1

stellar contract invoke \
  --id CEXP… --source audience1 --network testnet \
  -- contribute --from $(stellar keys address audience1) --amount 50000000
# 50000000 stroops = 5 XLM
```

Espera 2 min para que el deadline pase y agrega el ID a `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ID_EXPIRED=CEXP…
```

Reinicia `npm run dev`. Ahora en el header verás el selector "Vaca en vivo /
Vaca expirada".

### 0.9 Importa la wallet del speaker a Freighter (opcional pero recomendado)

Si quieres retirar desde la UI en vez de CLI durante la charla:

```bash
stellar keys show speaker
# copia la secret (empieza con S…)
```

En Freighter: ⚙️ → Import account → pega la secret → ponle un alias claro
(p. ej. "Speaker Demo"). Asegúrate de que Freighter esté en **testnet**.

---

## 1. Durante la charla (script)

Tiempo estimado: 10–12 min.

### 1.1 Antes de empezar el demo

- Tu dev server está corriendo (`npm run dev`).
- El proyector muestra http://localhost:3000.
- Freighter está abierto con la cuenta del speaker como activa.
- Tienes una pestaña con Stellar Expert lista por si necesitas mostrar la tx.

### 1.2 Apertura

> "Esta es una vaca digital. Las reglas están en el contrato, no en mi cabeza:
> si llegamos a la meta yo retiro; si no, ustedes recuperan su plata
> automáticamente. Nadie tiene que confiar en mí."

Muestra:
- Nombre + recaudado 0 / meta 50 XLM
- Countdown
- Que el contract ID es público (link a Stellar Expert)

### 1.3 Speaker conecta su Freighter

Click en **"Conectar Freighter"** → Freighter pide aprobar → aparece:
- "Conectado · G…" en el header
- El link "**Panel admin →**" (solo lo ves tú porque tu wallet = admin)

> "Yo soy el admin. Lo prueba el contrato, no una contraseña."

### 1.4 La audiencia entra

Da las instrucciones:

1. Abrir https://www.freighter.app/ e instalar la extensión.
2. Crear una wallet nueva. Cambiar a **testnet** en ⚙️.
3. Fondear con Friendbot: en Freighter, click en "fund with friendbot" cuando
   estás en testnet. (O ir a https://friendbot.stellar.org/?addr=SU_ADDRESS)
4. Abrir la URL de la dApp (preferible un QR en pantalla).
5. **Conectar Freighter**.
6. Escribir un monto (`1`, `5`, `10`…) y dar **Contribuir**.

Mientras aportan:

- La barra de progreso sube.
- "Últimos aportes" muestra cada wallet con su monto.
- El contador de "Contribuyentes" sube.

### 1.5 Llegando a la meta

Cuando la barra cruza el 100%:

- Se dispara confeti.
- El badge cambia a **"Meta alcanzada · Lista para retiro"**.
- El formulario lateral cambia a "Aportes cerrados".

> "Listo, llegamos. El contrato cambió a `Completed` solo. Ahora el botón de
> retirar se desbloquea, pero **solo para mí**."

### 1.6 Retirar los fondos

**Opción A — Desde la UI (recomendado para la charla):**

1. Click en "**Panel admin →**" en el header.
2. En `/admin` ves dos tarjetas. La de **"Retirar fondos"** está habilitada.
3. Click → Freighter pide firmar → aprueba.
4. La página actualiza el estado a **Withdrawn** en ~5s.
5. Click en "ver en Stellar Expert" para mostrar la transacción real.

**Opción B — Desde CLI (más rápido si te trabas):**

```bash
stellar contract invoke \
  --id CABC…XYZ \
  --source speaker \
  --network testnet \
  -- \
  withdraw
```

Devuelve la cantidad retirada (en stroops). Refresca la dApp y el estado pasa
a Withdrawn.

### 1.7 Demostrar refund (opcional, solo si tienes la vaca expirada)

1. En el header, cambia el selector a **"Vaca expirada"**.
2. Muestra que `total_raised < goal` y el countdown dice "Deadline alcanzado".
3. Conecta con la wallet `audience1` (la que aportó). Importa su secret en
   Freighter primero si no lo hiciste:
   ```bash
   stellar keys show audience1
   ```
4. El estado todavía es **Active** porque nadie llamó `check_expiration`.
   Para marcarlo Failed: entra a `/admin` con la wallet del speaker y pulsa
   "Marcar Failed". O CLI:
   ```bash
   stellar contract invoke --id CEXP… --source speaker --network testnet \
     -- check_expiration
   ```
5. Vuelve a `/` con la wallet `audience1`. Ahora aparece **"Vaca expirada ·
   Refunds habilitados"** y el botón **"Reclamar mi aporte"** con el monto que
   aportó.
6. Click → Freighter firma → los XLM vuelven a la cuenta.

### 1.8 Cierre

> "Todo esto vive en testnet, es público y auditable. El mismo contrato puede
> servir para una vaca comunitaria, un goteo, una colecta benéfica… las
> reglas no las pone una app, las pone el código."

Muestra el repo, da el link.

---

## 2. Comandos de rescate (copiar-pegar)

Tenlos en una pestaña abierta por si algo se rompe.

```bash
# Variables (rellena una vez al inicio)
CONTRACT_ID=CABC…XYZ
NET=testnet

# Estado del contrato
stellar contract invoke --id "$CONTRACT_ID" --network "$NET" -- get_status

# Quién es el admin
stellar contract invoke --id "$CONTRACT_ID" --network "$NET" -- admin

# Saldo del contrato (cuánto tiene acumulado en XLM stroops)
stellar contract invoke --id "$CONTRACT_ID" --network "$NET" -- total_raised

# Cuánto aportó una dirección específica
stellar contract invoke --id "$CONTRACT_ID" --network "$NET" \
  -- get_contribution --addr G…ADDRESS

# Retiro de emergencia (admin)
stellar contract invoke --id "$CONTRACT_ID" --source speaker --network "$NET" \
  -- withdraw

# Marcar Failed (después del deadline)
stellar contract invoke --id "$CONTRACT_ID" --source speaker --network "$NET" \
  -- check_expiration

# Refund (desde la wallet que aportó)
stellar contract invoke --id "$CONTRACT_ID" --source audience1 --network "$NET" \
  -- refund --from $(stellar keys address audience1)

# Ver el contrato en Stellar Expert
open "https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"

# Ver una cuenta en Stellar Expert
open "https://stellar.expert/explorer/testnet/account/$(stellar keys address speaker)"
```

---

## 3. Si algo sale mal

| Síntoma | Causa probable | Fix rápido |
| --- | --- | --- |
| La dApp dice `NotInitialized` | Te saltaste `init-crowdfunding.sh` | Córrelo (paso 0.5) |
| `No aparece el link "Panel admin"` | La wallet conectada no es el admin | `stellar contract invoke --id ... -- admin` para ver quién es. Importa esa secret en Freighter |
| `Error: DeadlinePassed` al aportar | El countdown ya está en 0 | Despliega de nuevo con deadline más largo |
| Friendbot tarda o no llega | Saturación de testnet | Pide al asistente que recargue Freighter y vuelva a intentar |
| El frontend no muestra cambios | El polling tarda hasta 5s | Da F5, o espera |
| `Error: NotCompleted` al retirar | La meta aún no se cruzó | Verifica `get_status` — debe ser `Completed` |
| Freighter pide cambiar de red | Está en mainnet | Settings → Network → Test Net |
| `Error: AlreadyInitialized` al correr init | Ya estaba inicializado | No corras init dos veces sobre el mismo contrato. Despliega uno nuevo |
| Las "Últimos aportes" no aparecen | El RPC público tarda en indexar | Espera unos segundos, los aportes sí pasaron on-chain |

---

## 4. Después de la charla

```bash
# Verifica los fondos retirados
open "https://stellar.expert/explorer/testnet/account/$(stellar keys address speaker)"

# Si quieres devolver el XLM a la testnet (opcional)
# Simplemente abandona la cuenta — testnet se resetea cada cierto tiempo.
```

Para la próxima charla:
- Repite los pasos 0.4 (deploy) y 0.5 (init) → contract ID nuevo, vaca nueva.
- Actualiza `frontend/.env.local` con el nuevo ID.
- Reinicia `npm run dev`.

Cada despliegue es independiente: no hay forma de reiniciar un crowdfunding,
el contrato es de un solo uso por diseño.
