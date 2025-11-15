#!/bin/sh
set -e

echo "[entrypoint] Running migrations (npm run db:migrate)"
echo "DATABASE_URL: $DATABASE_URL"
npm run db:migrate

echo "[entrypoint] Starting app…"
exec "$@"
