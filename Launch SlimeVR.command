#!/usr/bin/env bash

# Resolve script directory (Project root)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Ensure environment PATH includes brew, user local bin, and system tools
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.local/bin:$PATH"

# Auto-detect JAVA_HOME if not already set
if [ -z "$JAVA_HOME" ]; then
    if [ -x "/usr/libexec/java_home" ]; then
        export JAVA_HOME="$(/usr/libexec/java_home -v 17+ 2>/dev/null || /usr/libexec/java_home 2>/dev/null)"
        export PATH="$JAVA_HOME/bin:$PATH"
    fi
fi

# Ensure corepack and pnpm are ready
if ! command -v pnpm &> /dev/null; then
    if command -v corepack &> /dev/null; then
        corepack enable --install-directory "$HOME/.local/bin" 2>/dev/null || corepack enable 2>/dev/null
    fi
fi

echo "=================================================="
echo "          Starting SlimeVR Server & GUI           "
echo "=================================================="
echo "Project Path: $DIR"

JAR_PATH="$DIR/server/desktop/build/libs/slimevr.jar"

# Check if the server JAR exists; if not, build it with Gradle
if [ ! -f "$JAR_PATH" ]; then
    echo "Server JAR not found. Building backend with Gradle..."
    ./gradlew :server:desktop:shadowJar
    if [ ! -f "$JAR_PATH" ]; then
        echo "Error: Failed to build server JAR."
        read -p "Press enter to exit..."
        exit 1
    fi
fi

# Trap signals to ensure graceful shutdown
cleanup() {
    echo ""
    echo "Shutting down SlimeVR..."
    if [ -n "$CAFFEINATE_PID" ]; then
        kill "$CAFFEINATE_PID" 2>/dev/null
    fi
    # Kill any lingering GUI/Server processes spawned in this session
    pkill -P $$ 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

# Enable macOS sleep prevention fallback layer
if command -v caffeinate &> /dev/null; then
    echo "Enabling macOS sleep prevention fallback (caffeinate)..."
    caffeinate -i -m -s -u -w $$ &
    CAFFEINATE_PID=$!
fi

echo "Launching SlimeVR GUI with embedded server..."
cd "$DIR/gui"
if command -v caffeinate &> /dev/null; then
    caffeinate -i -m -s -u pnpm run gui -- --path "$DIR/server/desktop/build/libs" "$@"
else
    pnpm run gui -- --path "$DIR/server/desktop/build/libs" "$@"
fi

# Clean exit
exit 0
