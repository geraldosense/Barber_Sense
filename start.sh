#!/bin/bash

# ===== SCRIPT DE INICIALIZAÇÃO - SENSE BARBERSHOP =====

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  🧔 Sense Barbershop - Quick Start      ║"
echo "║  Sistema de Agendamento Online         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Carregar nvm (Node) se existir
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js / npm não encontrado no PATH!"
    echo ""
    echo "   Opção 1 — Instalar Node: https://nodejs.org"
    echo "   Opção 2 — Com nvm:"
    echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "     nvm install 24"
    echo "     nvm use 24"
    echo ""
    exit 1
fi

echo "✓ Node $(node -v) / npm $(npm -v)"
echo ""

# Ir para pasta backend
echo "[1/4] Instalando dependências do Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências do backend"
        exit 1
    fi
else
    echo "✓ Dependências já instaladas"
fi

echo ""
echo "[2/4] Iniciando servidor Backend..."
echo "Servidor em: http://localhost:3000"
echo ""

# Iniciar servidor em background
node server.js &
BACKEND_PID=$!

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar servidor"
    exit 1
fi

# Aguardar um pouco para o servidor iniciar
sleep 2

echo ""
echo "[3/4] Backend iniciado com sucesso! ✓"
echo ""

# Retornar para pasta raiz
cd ..

echo "[4/4] Próximos passos:"
echo ""
echo "📱 Frontend:"
echo "════════════════════════════════════════"
echo "Opção 1: Use editor favorito"
echo "   1. Abra frontend/index.html"
echo "   2. Abra com Live Server ou similar"
echo ""
echo "Opção 2: Backend apenas (recomendado)"
echo "   cd backend"
echo "   ./start.sh"
echo ""
echo "Opção 3: Site completo no mesmo servidor"
echo "   Abra: http://localhost:3000"
echo ""
echo "📍 Endereços:"
echo "════════════════════════════════════════"
echo "Backend:  http://localhost:3000"
echo "Admin:    http://localhost:3000/admin-login.html"
echo ""
echo "✅ Tudo pronto! O backend está rodando."
echo ""
echo "Digite Ctrl+C para parar o servidor"

# Aguardar
wait $BACKEND_PID
