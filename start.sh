#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "1/4  Starting Postgres…"
docker compose up -d
sleep 3

echo "2/4  Creating database tables…"
cd apps/web
npx drizzle-kit push --force

echo "3/4  Checking OmniRoute…"
if ! curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  echo "     ⚠  OmniRoute is not running. In another tab:  omniroute"
fi

echo "4/4  Starting Agency OS on http://localhost:3000"
npm run dev
