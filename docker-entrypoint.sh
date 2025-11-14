#!/bin/sh
set -e

echo "[entrypoint] Running migrations (npm run db:migrate)"
npm run db:migrate

echo "[entrypoint] Starting app…"
exec "$@"
