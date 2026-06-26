#!/bin/bash
# Sense Barbershop — configura arranque automático e abre o site
cd "$(dirname "$0")"
chmod +x scripts/*.sh 2>/dev/null || true
./scripts/install-autostart.sh
open "http://localhost:3000" 2>/dev/null || true
