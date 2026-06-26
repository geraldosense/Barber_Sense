#!/bin/bash
# Envia o projeto Sense Barbershop para o GitHub
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "╔══════════════════════════════════════════╗"
echo "║  Sense Barbershop → GitHub                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "Erro: esta pasta não é um repositório Git."
    exit 1
fi

echo "→ Repositório: $(git remote get-url origin 2>/dev/null || echo 'sem remote')"
echo "→ Branch: $(git branch --show-current)"
echo "→ Último commit: $(git log -1 --oneline)"
echo ""

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠ Há alterações por guardar. Faça commit primeiro:"
    echo "  git add -A && git commit -m 'sua mensagem'"
    exit 1
fi

echo "A enviar para GitHub..."
echo "(Se pedir credenciais: use o seu utilizador GitHub e um Personal Access Token como palavra-passe)"
echo " Token: https://github.com/settings/tokens"
echo ""

if git push --force-with-lease -u origin main; then
    echo ""
    echo "✓ Código enviado com sucesso!"
    echo ""
    echo "Repositório:  https://github.com/geraldosense/Barber_Sense"
    echo "Site (Pages): https://geraldosense.github.io/Barber_Sense/"
    echo ""
    echo "Próximos passos no GitHub:"
    echo "  1. Settings → Pages → Source: GitHub Actions"
    echo "  2. O site publica-se automaticamente após cada push"
    echo ""
    echo "Para o site COMPLETO (marcações + pagamentos) online:"
    echo "  → Crie conta em https://render.com"
    echo "  → New → Blueprint → ligue o repositório Barber_Sense"
    echo "  → O ficheiro render.yaml configura tudo automaticamente"
else
    echo ""
    echo "✗ Falhou o envio. Tente manualmente:"
    echo "  git push --force-with-lease -u origin main"
    echo ""
    echo "Ou com SSH:"
    echo "  git remote set-url origin git@github.com:geraldosense/Barber_Sense.git"
    echo "  git push --force-with-lease -u origin main"
    exit 1
fi
