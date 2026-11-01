#!/bin/sh
set -eu

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"

docker compose exec -T postgres pg_dump -U libaas -d libaas -Fc > "backups/libaas-${STAMP}.dump"
echo "Wrote backups/libaas-${STAMP}.dump"
