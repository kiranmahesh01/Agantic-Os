#!/usr/bin/env bash
cd "$(dirname "$0")"

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; OFF=$'\033[0m'
ok(){ echo "${GRN}✓${OFF} $1"; }
bad(){ echo "${RED}✗${OFF} $1"; }
warn(){ echo "${YEL}!${OFF} $1"; }

echo "Agency OS — starting up"
echo "======================"

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  bad "Docker is not installed."
  echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  bad "Docker is installed but not running."
  echo "  Open Docker Desktop from Applications, wait for the whale icon, then run this again."
  exit 1
fi
ok "Docker is running"

# 2. Postgres
echo "  starting Postgres…"
if ! docker compose up -d >/dev/null 2>&1; then
  bad "Could not start Postgres."
  docker compose up -d
  exit 1
fi

for i in $(seq 1 30); do
  if docker exec agency-os-db pg_isready -U agency >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! docker exec agency-os-db pg_isready -U agency >/dev/null 2>&1; then
  bad "Postgres started but is not accepting connections."
  echo "  Check:  docker compose logs db"
  exit 1
fi
ok "Postgres ready on port 5433"

# 3. Tables
cd apps/web
echo "  creating tables…"
if ! npx drizzle-kit push --force 2>&1 | tail -3; then
  bad "Could not create the database tables."
  exit 1
fi
ok "Tables ready"

# 4. OmniRoute (needed only to generate, not to sign in)
if curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  ok "OmniRoute is running"
else
  warn "OmniRoute is not running — you can sign in and add clients,"
  echo "    but generating a profile will fail. In another tab:  omniroute"
fi

echo
echo "======================"
echo " Open http://localhost:3000"
echo " Create an account, then add your first client."
echo "======================"
echo
npm run dev
