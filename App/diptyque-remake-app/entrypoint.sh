#!/bin/sh
set -e

echo "==> [entrypoint] Starting container..."

# Validate DATABASE_URL is set and non-empty
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set or is empty. Aborting."
  exit 1
fi

echo "==> [entrypoint] DATABASE_URL is set. Running Prisma migrations..."
npx prisma migrate deploy

echo "==> [entrypoint] Migrations complete. Starting application..."
exec npm run start
