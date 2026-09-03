#!/usr/bin/env bash
cd "$(dirname "$0")/source"

echo "=================================================="
echo "      Building SlimeVR Native macOS (Release)     "
echo "=================================================="

swift build -c release

echo ""
echo "✅ Build complete! Binary located at: source/.build/release/SlimeVRNative"
