#!/bin/bash
# Inicia o backend em segundo plano — ou use: ../scripts/sense-server.sh start
cd "$(dirname "$0")/.."
exec ./scripts/sense-server.sh start
