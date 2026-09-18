#!/usr/bin/env bash
# Usage: ./posts.sh out/philippes.com.json [count]
set -a; [ -f .env ] && . ./.env; set +a
if [ -z "$1" ]; then echo "Usage: ./posts.sh out/<name>.json [count]"; exit 1; fi
if ! curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  echo "OmniRoute is not running. In another tab run:  omniroute"; exit 1
fi
npx tsx scripts/generate-posts.ts "$1" "${2:-5}"
