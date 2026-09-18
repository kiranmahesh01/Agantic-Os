#!/usr/bin/env bash
# Start the Agency OS web app.
if ! curl -s -m 3 -o /dev/null http://localhost:20128/v1/models; then
  echo "OmniRoute is not running. In another tab run:  omniroute"
  exit 1
fi
cd "$(dirname "$0")/apps/web" && npm run dev
