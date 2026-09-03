#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "=================================================="
echo "         Starting SlimeVR Native (macOS)          "
echo "=================================================="

# Keep Mac awake
caffeinate -i -m -s -u -w $$ &
CAFFEINATE_PID=$!
trap "kill -9 $CAFFEINATE_PID 2>/dev/null" EXIT

# Ensure backend server jar exists
SERVER_JAR="server/desktop/build/libs/slimevr.jar"
if [ ! -f "$SERVER_JAR" ]; then
    echo "Building SlimeVR Server daemon..."
    ./gradlew :server:desktop:build -x test
fi

# Check if server daemon is already running on port 21110
if ! lsof -i :21110 >/dev/null 2>&1; then
    echo "Launching SlimeVR Server daemon in background..."
    java -jar "$SERVER_JAR" run-in-terminal >/dev/null 2>&1 &
    SERVER_PID=$!
    trap "kill -9 $SERVER_PID 2>/dev/null; kill -9 $CAFFEINATE_PID 2>/dev/null" EXIT
    sleep 2
fi

# Launch the native SwiftUI app
echo "Launching SlimeVR Native macOS App..."
./mac/SlimeVRNative/.build/release/SlimeVRNative
