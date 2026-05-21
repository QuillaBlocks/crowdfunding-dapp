#!/usr/bin/env bash
# Inicializa la instancia del contrato Crowdfunding.
#
# Uso:
#   scripts/init-crowdfunding.sh "Nombre" GOAL_XLM DEADLINE_SECONDS CONTRACT_ID [SOURCE]
#
# Ejemplos:
#   scripts/init-crowdfunding.sh "Vaca de la charla" 50 3600 CDLZFC… alice
#   scripts/init-crowdfunding.sh "Vaca expirada" 50 1 CDLZ…
#       (deadline=1s → expira casi inmediatamente, sirve para demo de refund)
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -lt 4 ]]; then
  cat <<EOF
Uso: scripts/init-crowdfunding.sh "Nombre" GOAL_XLM DEADLINE_SECONDS CONTRACT_ID [SOURCE]

Argumentos:
  NAME                 Nombre legible de la vaca
  GOAL_XLM             Meta en XLM (entero, se convierte a stroops)
  DEADLINE_SECONDS     Cuántos segundos desde ahora hasta el deadline
  CONTRACT_ID          ID del contrato ya desplegado (empieza con C…)
  SOURCE               (opcional) identity de stellar para firmar — default "default"
EOF
  exit 1
fi

NAME="$1"
GOAL_XLM="$2"
DEADLINE_SECONDS="$3"
CONTRACT_ID="$4"
SOURCE="${5:-${STELLAR_ACCOUNT:-default}}"
NETWORK="${STELLAR_NETWORK:-testnet}"

if ! [[ "$GOAL_XLM" =~ ^[0-9]+$ ]]; then
  echo "✗ GOAL_XLM debe ser un entero positivo (en XLM)." >&2
  exit 1
fi
if ! [[ "$DEADLINE_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "✗ DEADLINE_SECONDS debe ser un entero positivo." >&2
  exit 1
fi

GOAL_STROOPS=$(( GOAL_XLM * 10000000 ))
NOW=$(date +%s)
DEADLINE=$(( NOW + DEADLINE_SECONDS ))

ADMIN_ADDR="$(stellar keys address "$SOURCE")"

# Stellar Asset Contract para el XLM nativo en testnet:
#  - Pubnet:  CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
#  - Testnet: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
case "$NETWORK" in
  pubnet|mainnet|public)
    NATIVE_SAC="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
    ;;
  *)
    NATIVE_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
    ;;
esac

echo "▶ initialize en $CONTRACT_ID"
echo "    admin:    $ADMIN_ADDR"
echo "    name:     $NAME"
echo "    goal:     $GOAL_XLM XLM ($GOAL_STROOPS stroops)"
echo "    deadline: $(date -r "$DEADLINE") (unix $DEADLINE, ${DEADLINE_SECONDS}s desde ahora)"
echo "    token:    $NATIVE_SAC (XLM nativo via SAC)"
echo

stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- \
  initialize \
    --admin "$ADMIN_ADDR" \
    --name "$NAME" \
    --goal "$GOAL_STROOPS" \
    --deadline "$DEADLINE" \
    --token "$NATIVE_SAC"

echo "✅ Inicializado."
