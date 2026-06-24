@echo off
REM ===== SCRIPT DE INICIALIZAÇÃO - SENSE BARBERSHOP =====
REM Este script inicia o projeto completo

echo.
echo ╔════════════════════════════════════════╗
echo ║  🧔 Sense Barbershop - Quick Start      ║
echo ║  Sistema de Agendamento Online         ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js detectado
echo.

REM Ir para pasta backend
echo [1/4] Instalando dependências do Backend...
cd backend
if not exist node_modules (
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências do backend
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependências já instaladas
)

echo.
echo [2/4] Iniciando servidor Backend...
echo Servidor em: http://localhost:3000
echo.

REM Iniciar servidor em outra janela
start /b node server.js
if errorlevel 1 (
    echo ❌ Erro ao iniciar servidor
    pause
    exit /b 1
)

REM Aguardar um pouco para o servidor iniciar
timeout /t 2 /nobreak

echo.
echo [3/4] Backend iniciado com sucesso! ✓
echo.

REM Retornar para pasta raiz
cd ..

echo [4/4] Abrindo o site no navegador...
echo.
echo 📍 Abra: http://localhost:3000
echo    (Backend + Frontend no mesmo endereço)
echo.
start http://localhost:3000
echo.
echo ✅ Tudo pronto! Login funciona em http://localhost:3000
echo    Admin: admin@sensebarbearia.pt / admin123
echo    Barbeiro: joao@barbeariasense.pt / barbeiro123
echo.
echo Digite Ctrl+C para parar o servidor
pause
