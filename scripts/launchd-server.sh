#!/bin/bash
# Processo persistente para o LaunchAgent (não deve terminar após arrancar)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
PORT="${PORT:-3000}"
LOG_DIR="$BACKEND/logs"
mkdir -p "$LOG_DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
fi

NODE_BIN=""
for candidate in \
    "$(command -v node 2>/dev/null)" \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node" \
    "$HOME/.nvm/versions/node/$(cat "$ROOT/.nvmrc" 2>/dev/null)/bin/node"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
        NODE_BIN="$candidate"
        break
    fi
done

if [ -z "$NODE_BIN" ]; then
    echo "Node.js não encontrado" >> "$LOG_DIR/launchd-error.log"
    exit 1
fi

echo "$NODE_BIN" > "$BACKEND/.sense-node-path"

cd "$BACKEND"

if [ ! -d "node_modules" ]; then
    "$NODE_BIN" "$(dirname "$NODE_BIN")/npm" install --omit=dev >> "$LOG_DIR/launchd.log" 2>&1 || true
fi

PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

export PORT
exec "$NODE_BIN" server.js >> "$LOG_DIR/server.log" 2>&1
