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
GUI_ELECTRON_VITE="$DIR/gui/node_modules/.bin/electron-vite"

if [ ! -x "$GUI_ELECTRON_VITE" ]; then
    echo "Error: GUI dependencies are missing."
    echo "Run: cd \"$DIR\" && pnpm install"
    read -p "Press enter to exit..."
    exit 1
fi

# Stop stale processes from an earlier launch of this exact project. This is
# intentionally path-scoped so unrelated Electron and Java apps are untouched.
stop_existing_instances() {
    EXISTING_PIDS="$(pgrep -f "$DIR/gui/node_modules/.bin/../electron-vite|Electron \. --path $DIR/server/desktop/build/libs|java .* -jar $JAR_PATH run" 2>/dev/null || true)"
    if [ -n "$EXISTING_PIDS" ]; then
        echo "Stopping an existing SlimeVR instance..."
        kill $EXISTING_PIDS 2>/dev/null || true
        sleep 1
    fi

    REMAINING_PIDS="$(pgrep -f "java .* -jar $JAR_PATH run" 2>/dev/null || true)"
    if [ -n "$REMAINING_PIDS" ]; then
        kill -KILL $REMAINING_PIDS 2>/dev/null || true
    fi
}

stop_existing_instances

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

# Trap signals and terminal closure to stop the complete project process tree.
CLEANUP_COMPLETE=0
cleanup() {
    if [ "$CLEANUP_COMPLETE" -eq 1 ]; then
        return
    fi
    CLEANUP_COMPLETE=1
    trap - SIGINT SIGTERM SIGHUP EXIT

    echo ""
    echo "Shutting down SlimeVR..."
    if [ -n "$GUI_RUNNER_PID" ]; then
        kill "$GUI_RUNNER_PID" 2>/dev/null || true
    fi

    PROJECT_PIDS="$(pgrep -f "$DIR/gui/node_modules/.bin/../electron-vite|Electron \. --path $DIR/server/desktop/build/libs|java .* -jar $JAR_PATH run" 2>/dev/null || true)"
    if [ -n "$PROJECT_PIDS" ]; then
        kill $PROJECT_PIDS 2>/dev/null || true
        sleep 1
    fi

    SERVER_PIDS="$(pgrep -f "java .* -jar $JAR_PATH run" 2>/dev/null || true)"
    if [ -n "$SERVER_PIDS" ]; then
        kill -KILL $SERVER_PIDS 2>/dev/null || true
    fi
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

echo "Launching SlimeVR GUI with embedded server..."
cd "$DIR/gui"
if command -v caffeinate &> /dev/null; then
    caffeinate -i -m -s -u pnpm run gui -- --path "$DIR/server/desktop/build/libs" "$@" &
else
    pnpm run gui -- --path "$DIR/server/desktop/build/libs" "$@" &
fi
GUI_RUNNER_PID=$!
wait "$GUI_RUNNER_PID"
RUN_STATUS=$?

# Clean exit
cleanup
exit "$RUN_STATUS"
