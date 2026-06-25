#!/bin/bash
# Duplo-clique para iniciar o site (macOS)
cd "$(dirname "$0")"
./scripts/sense-server.sh start
open "http://localhost:3000"
echo ""
echo "Sense Barbershop está a correr em http://localhost:3000"
echo "Pode fechar esta janela — o servidor continua em segundo plano."
echo ""
read -r -p "Prima Enter para fechar..."
