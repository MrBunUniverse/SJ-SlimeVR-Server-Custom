#!/usr/bin/env bash

# Resolve script directory (Project root)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "          Stopping SlimeVR Processes              "
echo "=================================================="

# Gracefully terminate any running electron or java server instances for this project
pkill -f "slimevr.jar" 2>/dev/null && echo "Stopped SlimeVR Server process." || echo "No running SlimeVR Server found."
pkill -f "electron.*gui" 2>/dev/null && echo "Stopped SlimeVR GUI process." || echo "No running SlimeVR GUI found."

echo "Done."
sleep 1
exit 0
