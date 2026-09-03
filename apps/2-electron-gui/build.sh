#!/usr/bin/env bash
cd "$(dirname "$0")/../.."

echo "=================================================="
echo "          Building SlimeVR Electron GUI           "
echo "=================================================="

pnpm run build

echo ""
echo "✅ Build complete! Bundle located at: gui/out/"
