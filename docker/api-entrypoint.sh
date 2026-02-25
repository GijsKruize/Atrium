#!/bin/sh
set -e

echo "Running database schema sync..."
bunx prisma db push --schema=./packages/database/prisma/schema.prisma --skip-generate
echo "Database ready."

exec bun run start:prod
