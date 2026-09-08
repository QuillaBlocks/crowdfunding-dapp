#!/usr/bin/env bash
# Prepara el Codespace para la Sesión 3.
#
# Lo importante de este script es la PRE-COMPILACIÓN del contrato. Sin ella, el
# primer `stellar contract build` del asistente compila soroban-sdk desde cero:
# en una máquina de 2 núcleos son 5–10 minutos, por persona, en el medio del
# taller. Compilándolo aquí, su primera edición es incremental (~20 s).
# Sin `set -e`: si algo aquí falla, el contenedor debe crearse IGUAL. Un
# onCreateCommand que devuelve error hace que Codespaces caiga a un contenedor
# de recuperación SIN Rust — y el asistente se queda sin entorno, que es mucho
# peor que quedarse sin la pre-compilación.
set -uo pipefail

echo "▶ Dependencias del sistema…"
# El binario del Stellar CLI enlaza contra libdbus (keyring). Sin ella aborta con
# "error while loading shared libraries: libdbus-1.so.3".
# ca-certificates viene de 2023 en la imagen base y NO valida la cadena de
# soroban-testnet.stellar.org ni friendbot.stellar.org: toda llamada moriría con
# "unable to get local issuer certificate" mientras Horizon sigue funcionando,
# así que el fallo parece aleatorio.
sudo apt-get update -qq >/dev/null 2>&1 || true
sudo apt-get install -y -qq --only-upgrade ca-certificates >/dev/null 2>&1 || true
sudo update-ca-certificates >/dev/null 2>&1 || true
sudo apt-get install -y -qq libdbus-1-3 >/dev/null 2>&1 || true

echo "▶ Rust al día…"
# El Stellar CLI 28 compila contra wasm32v1-none, un target que sólo existe
# desde Rust 1.85. La imagen base trae uno anterior, así que sin actualizar
# primero el `target add` falla y el build muere con exit 101.
rustup update stable
rustup default stable
rustc --version | sed 's/^/  /'

echo "▶ Target WebAssembly…"
if rustup target add wasm32v1-none; then
  echo "  wasm32v1-none listo"
else
  echo "  ⚠ wasm32v1-none no disponible — intento wasm32-unknown-unknown"
  rustup target add wasm32-unknown-unknown || true
fi

echo "▶ Stellar CLI…"
STELLAR_VERSION="28.0.0"
case "$(uname -m)" in
  x86_64)  TARGET="x86_64-unknown-linux-gnu" ;;
  aarch64) TARGET="aarch64-unknown-linux-gnu" ;;
  *) TARGET="" ;;
esac
if [ -n "$TARGET" ]; then
  URL="https://github.com/stellar/stellar-cli/releases/download/v${STELLAR_VERSION}/stellar-cli-${STELLAR_VERSION}-${TARGET}.tar.gz"
  curl -fsSL "$URL" -o /tmp/stellar.tar.gz && \
    sudo tar -xzf /tmp/stellar.tar.gz -C /usr/local/bin stellar && \
    sudo chmod +x /usr/local/bin/stellar
  rm -f /tmp/stellar.tar.gz
  stellar --version | head -1 | sed 's/^/  /'
fi

echo "▶ Red testnet…"
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true

echo "▶ Pre-compilando el contrato (esto es lo que te ahorra la espera)…"
if stellar contract build 2>&1 | tail -3 | sed 's/^/  /'; then
  echo "  ✔ contrato pre-compilado"
else
  echo "  ⚠ la pre-compilación falló; el entorno sirve igual, pero tu primer"
  echo "    build va a tardar unos minutos en vez de segundos."
fi

echo "▶ Dependencias del frontend…"
npm install --no-audit --no-fund >/dev/null 2>&1 || true

cat <<'BANNER'

╭────────────────────────────────────────────────────────────────╮
│  Stellar Campus · Sesión 3 · entorno listo                     │
╰────────────────────────────────────────────────────────────────╯

  El contrato ya está compilado, así que tus cambios compilan en segundos.

  1. Crea tu identidad y pide fondos:
       stellar keys generate yo --network testnet --fund
       stellar keys address yo

  2. Edita  contracts/crowdfunding/src/contract.rs

  3. Compila:
       stellar contract build

  El paso a paso completo está en:  retos/sesion-3/

BANNER

# El contenedor se crea sí o sí.
exit 0
