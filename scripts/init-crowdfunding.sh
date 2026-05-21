#!/usr/bin/env bash
# Inicializa la instancia del contrato Crowdfunding.
#
# Uso:
#   scripts/init-crowdfunding.sh "Nombre" GOAL_XLM DEADLINE_SECONDS CONTRACT_ID SOURCE
#
# Ejemplo:
#   scripts/init-crowdfunding.sh "Vaca de la charla" 50 3600 CDLZFC… speaker
#
# SOURCE define quién queda como admin del contrato (la cuenta que podrá
# llamar withdraw). Es obligatorio para evitar que el script silenciosamente
# use la identity "default" si la olvidas.
set -euo pipefail

cd "$(dirname "$0")/.."

usage() {
  cat <<EOF
Uso: scripts/init-crowdfunding.sh "Nombre" GOAL_XLM DEADLINE_SECONDS CONTRACT_ID SOURCE

Argumentos (todos obligatorios):
  NAME                 Nombre legible de la vaca (entre comillas)
  GOAL_XLM             Meta en XLM (entero positivo, se convierte a stroops)
  DEADLINE_SECONDS     Cuántos segundos desde ahora hasta el deadline
  CONTRACT_ID          ID del contrato ya desplegado (empieza con C…)
  SOURCE               Identity de stellar que firma y queda como admin
                       (lista las que tienes con: stellar keys ls)

Tip: si quieres reutilizar la misma cuenta en varias corridas, podés exportar
STELLAR_ACCOUNT=<identity> y entonces SOURCE pasa a ser opcional.
EOF
}

if [[ $# -lt 4 ]]; then
  usage
  exit 1
fi

NAME="$1"
GOAL_XLM="$2"
DEADLINE_SECONDS="$3"
CONTRACT_ID="$4"
SOURCE="${5:-${STELLAR_ACCOUNT:-}}"
NETWORK="${STELLAR_NETWORK:-testnet}"

if [[ -z "$SOURCE" ]]; then
  echo "✗ Falta SOURCE (la identity que será admin del contrato)." >&2
  echo "  Pásala como 5to argumento, o exporta STELLAR_ACCOUNT=<identity>." >&2
  echo >&2
  echo "  Identities disponibles:" >&2
  stellar keys ls 2>/dev/null | sed 's/^/    - /' >&2
  exit 1
fi

if ! stellar keys ls 2>/dev/null | grep -q "^${SOURCE}$"; then
  echo "✗ La identity '${SOURCE}' no existe." >&2
  echo "  Crea una con:  stellar keys generate ${SOURCE} --network ${NETWORK} --fund" >&2
  exit 1
fi

if ! [[ "$GOAL_XLM" =~ ^[0-9]+$ ]] || [[ "$GOAL_XLM" -le 0 ]]; then
  echo "✗ GOAL_XLM debe ser un entero positivo (en XLM). Recibido: '$GOAL_XLM'." >&2
  exit 1
fi
if ! [[ "$DEADLINE_SECONDS" =~ ^[0-9]+$ ]] || [[ "$DEADLINE_SECONDS" -le 0 ]]; then
  echo "✗ DEADLINE_SECONDS debe ser un entero positivo. Recibido: '$DEADLINE_SECONDS'." >&2
  exit 1
fi

GOAL_STROOPS=$(( GOAL_XLM * 10000000 ))
NOW=$(date +%s)
DEADLINE=$(( NOW + DEADLINE_SECONDS ))

ADMIN_ADDR="$(stellar keys address "$SOURCE")"

# Stellar Asset Contract para el XLM nativo:
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
echo "    source:   $SOURCE"
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

echo "✅ Inicializado. Admin del contrato: $ADMIN_ADDR ($SOURCE)"
