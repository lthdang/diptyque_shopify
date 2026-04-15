#!/bin/sh
set -e

echo "==> [entrypoint] Starting container..."

# Print available env var keys (not values) to help diagnose missing vars
echo "==> [entrypoint] Detected environment variables:"
env | cut -d= -f1 | sort | sed 's/^/    /'

# Validate DATABASE_URL is set and non-empty
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set or is empty. Aborting."
  echo ""
  echo "To fix: Go to Render Dashboard → diptyque-shopify → Environment"
  echo "        and add DATABASE_URL linked to the diptyque-db connection string."
  echo "        Or go to Render Dashboard → Blueprints and sync render.yaml."
  exit 1
fi

echo "==> [entrypoint] DATABASE_URL is set. Running Prisma migrations..."
npx prisma migrate deploy

echo "==> [entrypoint] Migrations complete. Starting application..."

# If START_WORKER=true, run the BullMQ worker instead of the Remix server.
# The Render worker service sets this env var; the web service does not.
if [ "$START_WORKER" = "true" ]; then
  echo "==> [entrypoint] START_WORKER=true — starting BullMQ worker process..."
  exec npm run worker
fi

exec npm run start
