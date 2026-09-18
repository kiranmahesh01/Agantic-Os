#!/usr/bin/env bash
# One command: restaurant URL -> posts you can show the owner.
# Usage: ./demo.sh https://a-restaurant.com [postCount]
set -a; [ -f .env ] && . ./.env; set +a

URL="$1"
COUNT="${2:-3}"

if [ -z "$URL" ]; then
  echo "Usage: ./demo.sh https://a-restaurant.com [postCount]"
  exit 1
fi

if ! curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  echo "OmniRoute is not running. In another tab run:  omniroute"
  exit 1
fi

DOMAIN=$(echo "$URL" | sed -E 's|https?://||; s|^www\.||; s|/.*$||')

echo "=============================================="
echo " 1/2  Reading $DOMAIN"
echo "=============================================="
npx tsx scripts/brand-profile.ts "$URL" || exit 1

echo
echo "=============================================="
echo " 2/2  Writing $COUNT posts"
echo "=============================================="
npx tsx scripts/generate-posts.ts "out/$DOMAIN.json" "$COUNT" || exit 1

echo
echo "=============================================="
echo " Done. Show them:  posts/$DOMAIN.md"
echo "=============================================="
