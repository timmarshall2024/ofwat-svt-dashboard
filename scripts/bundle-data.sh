#!/bin/bash
# Copy data and knowledge files into dist/ after Vite build.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DASH_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$DASH_DIR/dist" ]; then
  echo "Error: dist/ does not exist. Run 'npm run build' first."
  exit 1
fi

if [ ! -d "$DASH_DIR/public/data" ]; then
  echo "Error: dashboard/public/data/ does not exist."
  echo "Symlink or copy your data folder into dashboard/public/data/ first."
  exit 1
fi

echo "Copying data files to dist/..."
cp -r "$DASH_DIR/public/data" "$DASH_DIR/dist/data"
echo "data/: $(du -sh "$DASH_DIR/dist/data" | cut -f1)"

if [ -d "$DASH_DIR/public/knowledge" ]; then
  echo "Copying knowledge files to dist/..."
  cp -r "$DASH_DIR/public/knowledge" "$DASH_DIR/dist/knowledge"
  echo "knowledge/: $(du -sh "$DASH_DIR/dist/knowledge" | cut -f1)"
fi
