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

chmod +x "$ROOT/scripts/sense-server.sh" "$ROOT/scripts/launchd-server.sh" 2>/dev/null || true

sed "s|__SENSE_ROOT__|$ROOT|g" "$PLIST_SRC" > "$PLIST_DST"

UID_NUM="$(id -u)"
DOMAIN="gui/$UID_NUM"

launchctl bootout "$DOMAIN" "$PLIST_DST" 2>/dev/null || launchctl unload "$PLIST_DST" 2>/dev/null || true
if launchctl bootstrap "$DOMAIN" "$PLIST_DST" 2>/dev/null; then
    :
else
    launchctl load "$PLIST_DST"
fi

# Garantir que o servidor está online agora
"$ROOT/scripts/sense-server.sh" start || true

# Criar / atualizar aplicação de arranque (sem janela de terminal)
"$ROOT/scripts/build-launcher-app.sh" 2>/dev/null || true

echo ""
echo "✓ Sense Barbershop configurado para arrancar automaticamente."
echo "  URL: http://localhost:3000"
echo "  Arranque ao ligar o Mac: ativo"
echo "  Atalho: Sense Barbershop.app (duplo-clique, sem terminal)"
echo ""
