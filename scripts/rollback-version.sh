#!/bin/sh
# Usage: sh scripts/rollback-version.sh v6-baseline
#        sh scripts/rollback-version.sh v7.2.0
set -eu
cd "$(dirname "$0")/.."
VER="${1:-}"
if [ -z "$VER" ] || [ ! -d "versions/$VER" ]; then
  echo "Usage: $0 <version-dir>"
  ls versions/
  exit 1
fi
cp -f "versions/$VER/index.html" ./index.html
cp -f "versions/$VER/index.html" ./public/index.html 2>/dev/null || true
cp -f "versions/$VER/config.json" ./config.json 2>/dev/null || true
cp -f "versions/$VER/cloudflare-worker.js" ./deploy/cloudflare-worker.js 2>/dev/null || \
  cp -f "versions/$VER/deploy/cloudflare-worker.js" ./deploy/cloudflare-worker.js 2>/dev/null || true
cp -f "versions/$VER/schema.sql" ./deploy/schema.sql 2>/dev/null || \
  cp -f "versions/$VER/deploy/schema.sql" ./deploy/schema.sql 2>/dev/null || true
echo "Restored files from versions/$VER"
echo "Next: commit, set COMMIT pin in worker to this tree's git SHA, redeploy worker."
