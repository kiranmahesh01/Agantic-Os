#!/usr/bin/env bash
# Usage: ./run.sh https://a-restaurant.com
set -a; [ -f .env ] && . ./.env; set +a

if [ -z "$1" ]; then
  echo "Usage: ./run.sh https://a-restaurant.com"
  exit 1
fi

if ! curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  echo "OmniRoute is not running."
  echo "Open another terminal tab and run:  omniroute"
  exit 1
fi

npx tsx scripts/brand-profile.ts "$1"
