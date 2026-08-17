#!/usr/bin/env bash
set -eu
ROOT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

if pgrep -f "mongod --port 27018" > /dev/null; then
  echo "Mongo del proyecto ya está activo en el puerto 27018."
else
  # faltaba crear data/db
  
  mkdir -p "$ROOT_DIR/data/db" # mod: línea agregada
  "$ROOT_DIR/tools/bin/mongod" \
    --dbpath "$ROOT_DIR/data/db" \
    --port 27018 \
    --bind_ip 127.0.0.1 \
    --fork \
    --logpath "$ROOT_DIR/data/mongod.log"
  echo "Mongo del proyecto iniciado en el puerto 27018."
fi
