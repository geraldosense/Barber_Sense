#!/bin/bash
# Inicia o backend com Node (nvm) — use: ./start.sh

cd "$(dirname "$0")"

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
fi

if ! command -v npm &>/dev/null; then
    echo ""
    echo "❌ npm não encontrado."
    echo "   Instale Node.js: https://nodejs.org"
    echo "   Ou com nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "   Depois: nvm install 24 && nvm use 24"
    echo ""
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 A instalar dependências..."
    npm install
fi

# Libertar porta 3000 se um servidor antigo ainda estiver a correr
OLD_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$OLD_PIDS" ]; then
    echo "⚠️  Porta 3000 ocupada — a parar processo antigo..."
    echo "$OLD_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "🧔 Sense Barbershop — Backend em http://localhost:3000"
echo "   Admin: http://localhost:3000/admin-login.html"
echo "   (Ctrl+C para parar)"
echo ""

npm start
