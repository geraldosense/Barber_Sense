#!/bin/bash
# Gestor do servidor Sense Barbershop — start | stop | restart | status

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
PID_FILE="$BACKEND/.sense-server.pid"
LOG_DIR="$BACKEND/logs"
LOG_FILE="$LOG_DIR/server.log"
PORT="${PORT:-3000}"

load_node() {
    export NVM_DIR="$HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
    fi
}

find_node() {
    load_node
    if command -v node &>/dev/null; then
        return 0
    fi
    return 1
}

is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        rm -f "$PID_FILE"
    fi
    return 1
}

free_port() {
    local pids
    pids=$(lsof -ti:"$PORT" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

cmd_start() {
    if is_running; then
        echo "✓ Servidor já está a correr (PID $(cat "$PID_FILE")) — http://localhost:$PORT"
        return 0
    fi

    if ! find_node; then
        echo "❌ Node.js não encontrado. Instale em https://nodejs.org"
        exit 1
    fi

    mkdir -p "$LOG_DIR"
    cd "$BACKEND"

    if [ ! -d "node_modules" ]; then
        echo "📦 A instalar dependências..."
        npm install --omit=dev
    fi

    free_port

    nohup node server.js >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2

    if is_running && curl -sf "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
        echo "✓ Sense Barbershop online — http://localhost:$PORT"
        echo "  Log: $LOG_FILE"
        return 0
    fi

    echo "❌ Falha ao iniciar. Ver log: $LOG_FILE"
    tail -20 "$LOG_FILE" 2>/dev/null || true
    exit 1
}

cmd_stop() {
    if is_running; then
        kill "$(cat "$PID_FILE")" 2>/dev/null || true
        rm -f "$PID_FILE"
        echo "✓ Servidor parado."
    else
        free_port
        echo "✓ Nenhum servidor Sense Barbershop em execução."
    fi
}

cmd_status() {
    if is_running; then
        echo "✓ Online — PID $(cat "$PID_FILE") — http://localhost:$PORT"
        curl -sf "http://localhost:$PORT/api/health" && echo ""
    else
        echo "○ Offline — servidor não está a correr."
        exit 1
    fi
}

cmd_restart() {
    cmd_stop
    cmd_start
}

case "${1:-start}" in
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    status)  cmd_status ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
