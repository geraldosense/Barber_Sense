#!/bin/bash

# ===== SCRIPT DE INICIALIZAÇÃO - BARBEARIA SENSE =====
# Este script inicia o projeto completo

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  🧔 Barbearia Sense - Quick Start      ║"
echo "║  Sistema de Agendamento Online         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "Baixe em: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js detectado"
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
echo "Opção 2: Use linha de comando"
echo "   cd frontend"
echo "   python3 -m http.server 5500"
echo ""
echo "Opção 3: Abra diretamente"
echo "   Abra: http://localhost:5500 no navegador"
echo ""
echo "📍 Endereços:"
echo "════════════════════════════════════════"
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5500"
echo ""
echo "✅ Tudo pronto! O backend está rodando."
echo ""
echo "Digite Ctrl+C para parar o servidor"

# Aguardar
wait $BACKEND_PID
