#!/bin/bash
# Instala arranque automático ao iniciar sessão no Mac (sem terminal)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_NAME="com.sensebarbershop.server.plist"
PLIST_SRC="$ROOT/scripts/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

if [[ "$OSTYPE" != darwin* ]]; then
    echo "Este script é apenas para macOS."
    exit 1
fi

# Substituir caminho do projeto no plist
sed "s|__SENSE_ROOT__|$ROOT|g" "$PLIST_SRC" > "$PLIST_DST"

launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"

echo ""
echo "✓ Arranque automático instalado!"
echo "  O site inicia sozinho quando liga o Mac."
echo "  URL: http://localhost:3000"
echo ""
echo "Comandos úteis:"
echo "  ./scripts/sense-server.sh status   — ver se está online"
echo "  ./scripts/sense-server.sh stop     — parar servidor"
echo "  ./scripts/sense-server.sh start    — iniciar manualmente"
echo ""
