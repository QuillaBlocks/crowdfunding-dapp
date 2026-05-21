# Vaca · Crowdfunding dApp sobre Stellar

Demo dApp diseñada para charlas y talleres de Stellar/Soroban. Implementa una
"vaca" (caja comunitaria LATAM) como contrato Soroban + frontend Next.js. Los
asistentes conectan Freighter y aportan XLM en vivo; la barra de progreso sube
en tiempo real y, al alcanzarse la meta, el speaker demuestra el retiro
restringido a admin. La instancia pre-expirada sirve para mostrar el flujo de
refund sin tener que esperar al deadline.

- Especificación completa: [`CROWDFUNDING.md`](CROWDFUNDING.md).
- Playbook listo para una charla en vivo: [`DEMO.md`](DEMO.md).

---

## Estructura

```
crowdfunding-dapp/
├── contracts/crowdfunding/      ← Soroban smart contract (Rust)
│   ├── src/contract.rs          ← Lógica pública: contribute, refund, withdraw…
│   ├── src/storage.rs           ← Helpers de Instance + Persistent storage
│   ├── src/events.rs            ← Eventos tipados (#[contractevent])
│   └── src/test.rs              ← 21 tests unitarios
├── packages/crowdfunding-client/← Bindings TypeScript autogenerados (no editar)
├── frontend/                    ← Next.js 15 + Tailwind
│   ├── app/page.tsx             ← Pantalla pública
│   ├── app/admin/page.tsx       ← Panel admin
│   └── lib/                     ← cliente, formato, hooks, eventos
├── scripts/
│   ├── deploy.sh                ← build + upload + deploy + regenera bindings
│   └── init-crowdfunding.sh     ← invoca initialize con los args
├── Cargo.toml                   ← Cargo workspace
├── package.json                 ← npm workspaces (frontend + bindings)
└── CROWDFUNDING.md              ← Spec original
```

---

## Requisitos

| Herramienta   | Versión mínima | Verifica con            |
| ------------- | -------------- | ----------------------- |
| `stellar` CLI | **26.0.0**     | `stellar --version`     |
| Rust + cargo  | 1.85+          | `cargo --version`       |
| Target WASM   | `wasm32v1-none`| `rustup target list --installed` |
| Node          | 20+            | `node --version`        |
| npm           | 10+            | `npm --version`         |
| Freighter     | última         | https://www.freighter.app |

Si te falta el target WASM:

```bash
rustup target add wasm32v1-none
```

---

## Instalación

```bash
git clone … crowdfunding-dapp
cd crowdfunding-dapp
npm install               # instala frontend + bindings package
```

Crea (o asegura) una identity de Stellar en testnet, fondeada por Friendbot:

```bash
stellar keys generate speaker --network testnet --fund
stellar keys address speaker            # cópiala, será el admin
```

(Si ya tienes una identity, úsala — sus comandos abajo asumen que se llama `speaker`.)

---

## Tests del contrato

```bash
npm run contract:test
```

21 tests cubriendo: `initialize`, `contribute` (éxito + edge cases), `withdraw` (admin + no-admin), `refund` (Failed + casos inválidos), `check_expiration`, `extend_deadline`. Salida esperada:

```
test result: ok. 21 passed; 0 failed; 0 ignored
```

---

## Desplegar el contrato

```bash
scripts/deploy.sh speaker
```

El script:
1. Compila el contrato a WASM con `stellar contract build`.
2. Lo sube a testnet con `stellar contract upload`.
3. Crea una instancia con `stellar contract deploy`.
4. **Regenera** los bindings TypeScript con `stellar contract bindings typescript`.
5. Imprime el `CONTRACT_ID` final.

> **Cuando cambies el contrato, repite `scripts/deploy.sh`**: el paso 4 reescribe el paquete `packages/crowdfunding-client` con el spec nuevo y un contract ID fresco.

Pega el ID en `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
# edita el archivo y pega NEXT_PUBLIC_CONTRACT_ID=C…
```

---

## Inicializar una vaca

Una vez desplegado, llama `initialize` con los parámetros que quieras:

```bash
# Vaca activa: meta 50 XLM, deadline en 60 minutos
scripts/init-crowdfunding.sh "Vaca de la charla" 50 3600 \
  C…CONTRACT_ID…  speaker
```

Si quieres una segunda vaca pre-expirada para la demo de refund, **despliega otro contrato** (vuelve a correr `deploy.sh`) e inicialízalo con un deadline corto:

```bash
scripts/init-crowdfunding.sh "Vaca expirada" 50 1 \
  C…SEGUNDO_CONTRACT_ID  speaker
# después de 1s ya está expirado on-chain
```

Agrega el segundo ID a `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ID=C…activo
NEXT_PUBLIC_CONTRACT_ID_EXPIRED=C…expirado
```

El frontend mostrará un selector entre ambas vacas en la parte superior.

> **Nota sobre la vaca expirada**: como el deadline ya pasó, antes de mostrar el refund alguien tiene que llamar `check_expiration` para mover el estado a `Failed`. El panel admin tiene el botón listo, o puedes hacerlo desde la CLI:
>
> ```bash
> stellar contract invoke --id C…EXP --source speaker --network testnet -- check_expiration
> ```

---

## Correr el frontend

```bash
npm run dev
```

Abre http://localhost:3000.

- **Pantalla principal (`/`)**: barra de progreso, countdown, formulario para aportar, lista de últimos 10 contribuyentes (vía `getEvents` del RPC), refresh automático cada 5s.
- **Pantalla admin (`/admin`)**: visible solo si la wallet conectada coincide con el admin del contrato; botón "Retirar fondos" habilitado solo cuando la meta esté alcanzada; botón "Marcar Failed" para vacas expiradas.

---

## Desplegar a Vercel (auto-deploy en cada push a `main`)

El repo ya trae `vercel.json` con la configuración de build para el monorepo.
Lo único que tienes que hacer es importar el repo en Vercel una vez.

### Primera vez (5 minutos)

1. Entra a https://vercel.com/new y selecciona "Import Git Repository".
2. Elige el repo (`QuillaBlocks/crowdfunding-dapp`).
3. **Importante — Root Directory**: Vercel va a sugerirte `frontend` automáticamente porque ahí detecta Next.js. **No lo aceptes**. Click "Edit" al lado de Root Directory y déjalo en `./` (la raíz del repo). Si no lo haces, npm workspaces no resuelve `crowdfunding-client` y el build falla con `Cannot find module 'crowdfunding-client'` o con la ruta duplicada `frontend/frontend/.next not found`.
4. Vercel lee `vercel.json` y autoconfigura:
   - Framework: **Next.js**
   - Install Command: `npm install`
   - Build Command: `npm run build --workspace=crowdfunding-client && npm run build --workspace=crowdfunding-frontend`
   - Output Directory: `frontend/.next`

   No cambies nada de esto.
4. **Environment Variables** — agrega estas tres (todas con scope "Production" + "Preview" + "Development"):

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_CONTRACT_ID` | El contract ID activo (empieza con `C…`) |
   | `NEXT_PUBLIC_CONTRACT_ID_EXPIRED` | (opcional) Contract ID de la vaca pre-expirada |
   | `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` |

5. Click **Deploy**.

Al terminar tienes una URL `https://crowdfunding-dapp-<hash>.vercel.app`. La promueves a un dominio custom desde el dashboard si quieres.

### A partir de ahí (automático)

- **Push a `main`** → deploy de producción (la URL principal).
- **Push a cualquier otra rama / PR** → deploy de preview con su propia URL temporal (útil para probar cambios sin tocar la URL pública).
- **Pull request comments**: Vercel deja un link al preview en cada PR.

### Cuando despliegues un contrato nuevo

Cada vez que corres `scripts/deploy.sh` localmente sale un `CONTRACT_ID` nuevo. Para que la app en Vercel apunte al contrato nuevo:

1. Settings → Environment Variables → edita `NEXT_PUBLIC_CONTRACT_ID`.
2. Re-despliega: Deployments → ⋯ → **Redeploy** (o haz un push vacío a `main`).

Los bindings de TypeScript se commitean al repo cada vez que corres `deploy.sh`, así que el build de Vercel siempre usa los del último deploy.

### Si el build falla en Vercel

| Error | Causa | Fix |
|-------|-------|-----|
| `Cannot find module 'crowdfunding-client'` | Faltó el paso `tsc` de los bindings, o Root Directory = `frontend` (workspaces no resuelven) | Settings → Root Directory = `./` |
| `frontend/frontend/.next not found` | Root Directory = `frontend` y `vercel.json` duplica la ruta | Settings → Root Directory = `./` y Redeploy |
| `Module not found: ./dist/index.js` | El paquete de bindings no se compiló | Verifica que `npm run build --workspace=crowdfunding-client` corra primero |
| `Build exceeded maximum duration` | Stellar SDK + Next es pesado | Sube el plan o usa `output: 'standalone'` en `next.config.js` |
| La página muestra "Falta configurar el contract ID" | `NEXT_PUBLIC_CONTRACT_ID` no está seteada en Vercel | Settings → Environment Variables |

---

## Guion de la demo en vivo

1. Abre la dApp con la vaca activa (proyector).
2. Conecta tu Freighter (admin). Aparece el link al panel admin.
3. Pide a los asistentes que abran la URL, conecten Freighter y fondeen con Friendbot.
4. Cada quien aporta. En pantalla: barra subiendo, contribuyentes apareciendo, countdown bajando.
5. Cuando se alcanza la meta: confeti, badge "Meta alcanzada", botón admin habilitado.
6. Como admin, abre `/admin` → "Retirar fondos". Muestra que solo a ti te deja firmar.
7. Verifica la transacción en Stellar Expert (link inline).
8. Cambia al selector "Vaca expirada". Conecta una wallet que haya aportado allí (o monta la demo con dos contribuciones previas). Pulsa "Reclamar mi aporte".

---

## Stack

- **Contrato**: Soroban SDK 26, sin librerías externas. Usa `#[contractevent]`, `i128`, `token::Client` para transferencias del SAC del XLM nativo.
- **Bindings**: generados por `stellar contract bindings typescript`, instalados como dependencia local del frontend vía npm workspaces.
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind 3, `@stellar/stellar-sdk`, `@stellar/freighter-api`. Poppins + JetBrains Mono. Paleta QuillaBlocks.
- **Estado en vivo**: polling al RPC cada 5s (`useCrowdfunding`) + lectura de eventos vía `Server.getEvents` para la lista de contribuyentes.

---

## Troubleshooting

**`ledger protocol version too old for host` al correr tests**
Asegúrate de no estar seteando `LedgerInfo` manualmente con `protocol_version: 23`. Usa `env.ledger().with_mut(|li| li.timestamp = …)` para mantener el default del SDK.

**El frontend no encuentra `crowdfunding-client`**
Corre `npm install` desde la raíz para que workspaces enlace el paquete. Si los bindings no existen aún, `scripts/deploy.sh` los genera; de lo contrario puedes generar un placeholder con
`stellar contract bindings typescript --wasm target/wasm32v1-none/release/crowdfunding.wasm --output-dir packages/crowdfunding-client --overwrite`.

**`Error: NotInitialized` al cargar la página**
Faltó correr `scripts/init-crowdfunding.sh` después de `deploy.sh`. El contrato existe pero no tiene admin/goal/deadline.

**`error: DeadlineInPast` al inicializar**
El parámetro `DEADLINE_SECONDS` se cuenta desde *ahora*. Si el reloj de tu RPC y el de tu shell están descoordinados, súbelo a unos minutos.

**El admin no aparece como tal en el panel**
Asegúrate de conectar la misma wallet que firmó `initialize`. La dirección admin se ve en cualquier momento con:

```bash
stellar contract invoke --id C… --network testnet -- admin
```

**Tus aportes no aparecen en "Últimos aportes"**
La RPC pública mantiene eventos ~24h. Si llevas más de un día sin actividad, baja `lookback` en `lib/events.ts` o redespliega.

**Freighter pide cambiar de red**
La dApp habla con testnet. Cambia la red en Freighter antes de aportar.

---

## Licencia

MIT, salvo donde se indique lo contrario.
