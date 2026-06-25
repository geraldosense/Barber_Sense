#!/bin/bash
# Sense Barbershop — inicia o servidor em segundo plano (sem manter terminal aberto)
cd "$(dirname "$0")"
chmod +x scripts/sense-server.sh 2>/dev/null
./scripts/sense-server.sh start
open "http://localhost:3000" 2>/dev/null || true
echo ""
echo "Site: http://localhost:3000"
echo "Admin: http://localhost:3000/admin-login.html"
echo ""
echo "O servidor corre em segundo plano. Para parar: ./scripts/sense-server.sh stop"
echo "Arranque automático ao ligar o Mac: ./scripts/install-autostart.sh"
