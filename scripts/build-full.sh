#!/bin/bash
# Full build: Vite production build + bundle data and knowledge into dist/
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DASH_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DASH_DIR"
npm run build
bash "$SCRIPT_DIR/bundle-data.sh"

echo ""
echo "Full build complete. dist/ size: $(du -sh dist | cut -f1)"
echo "Ready to deploy: drag dashboard/dist/ to Cloudflare Pages, or use CI."
