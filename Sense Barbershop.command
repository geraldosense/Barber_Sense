#!/bin/bash
# Duplo-clique para abrir o Sense Barbershop (sem depender do terminal)
cd "$(dirname "$0")"
chmod +x scripts/*.sh 2>/dev/null || true
./scripts/install-autostart.sh
open "http://localhost:3000" 2>/dev/null || true
osascript -e 'display notification "Sense Barbershop está online em http://localhost:3000" with title "Sense Barbershop"'
