#!/usr/bin/env bash
# Build, upload y deploy del contrato a testnet. Regenera bindings TypeScript.
#
# Uso:
#   scripts/deploy.sh SOURCE
#   scripts/deploy.sh speaker        # despliega firmado por la identity "speaker"
#
# SOURCE es obligatorio: es la identity que firma deploy y upload. No es
# necesariamente quien será el admin del crowdfunding (eso se decide al llamar
# init-crowdfunding.sh), pero conviene usar la misma para que no te confundas.
#
# Requisitos:
#   - stellar CLI 26+
#   - identity de testnet fondeada (Friendbot) registrada con `stellar keys`
#   - cargo + target wasm32v1-none instalado
set -euo pipefail

cd "$(dirname "$0")/.."

SOURCE="${1:-${STELLAR_ACCOUNT:-}}"
NETWORK="${STELLAR_NETWORK:-testnet}"
MANIFEST="contracts/crowdfunding/Cargo.toml"
WASM="target/wasm32v1-none/release/crowdfunding.wasm"
BINDINGS_DIR="packages/crowdfunding-client"

if [[ -z "$SOURCE" ]]; then
  echo "✗ Falta SOURCE (la identity que firma el deploy)." >&2
  echo "  Uso: scripts/deploy.sh <identity>" >&2
  echo "  o exporta STELLAR_ACCOUNT=<identity> antes de correr." >&2
  echo >&2
  echo "  Identities disponibles:" >&2
  stellar keys ls 2>/dev/null | sed 's/^/    - /' >&2
  exit 1
fi

echo "▶ stellar version: $(stellar --version | head -1)"
echo "▶ source identity: $SOURCE"
echo "▶ network:         $NETWORK"
echo

# 0. Verifica que la identity exista
if ! stellar keys ls 2>/dev/null | grep -q "^${SOURCE}$"; then
  echo "✗ La identity '${SOURCE}' no existe."
  echo "  Crea una con:  stellar keys generate ${SOURCE} --network ${NETWORK} --fund"
  exit 1
fi

# 1. Build
echo "▶ stellar contract build…"
stellar contract build --manifest-path "$MANIFEST"
echo "  WASM: $WASM"
echo

# 2. Upload (instala el WASM blob on-chain)
echo "▶ stellar contract upload…"
WASM_HASH="$(stellar contract upload \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK")"
echo "  Wasm hash: $WASM_HASH"
echo

# 3. Deploy (crea la instancia del contrato)
echo "▶ stellar contract deploy…"
CONTRACT_ID="$(stellar contract deploy \
  --wasm-hash "$WASM_HASH" \
  --source "$SOURCE" \
  --network "$NETWORK")"
echo "  Contract ID: $CONTRACT_ID"
echo

# 4. Regenerar bindings TypeScript con el contract ID real
echo "▶ stellar contract bindings typescript…"
stellar contract bindings typescript \
  --network "$NETWORK" \
  --contract-id "$CONTRACT_ID" \
  --output-dir "$BINDINGS_DIR" \
  --overwrite
echo "  Bindings → $BINDINGS_DIR"
echo

# 5. Compilar el paquete de bindings para que el frontend pueda importarlo
echo "▶ build bindings…"
(cd "$BINDINGS_DIR" && npm install --silent && npm run build --silent)
echo

cat <<EOF
✅ Listo. Pega este contract ID en frontend/.env.local:

   NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID

Y luego inicializa el crowdfunding con (el último arg = identity que será admin):

   scripts/init-crowdfunding.sh "Mi Vaca" 50 3600 $CONTRACT_ID $SOURCE

Sigue el README para más detalles.
EOF
