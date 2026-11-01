#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 backups/libaas-YYYYmmdd-HHMMSS.dump"
  exit 1
fi

docker compose exec -T postgres pg_restore -U libaas -d libaas --clean --if-exists < "$1"
echo "Restored $1"
