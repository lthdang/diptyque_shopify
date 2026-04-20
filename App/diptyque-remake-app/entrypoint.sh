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

# Start the scheduler worker as a background process.
# It polls the DB for due scheduled-publish jobs — no port binding needed.
echo "==> [entrypoint] Starting scheduler worker in background..."
npm run worker &
WORKER_PID=$!
echo "==> [entrypoint] Worker started (PID: $WORKER_PID)"

# Start the Remix server as the foreground process (binds to $PORT).
# Using exec so signals (SIGTERM) are forwarded to the server process.
echo "==> [entrypoint] Starting Remix server..."
exec npm run start
