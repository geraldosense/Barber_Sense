# Sense Barbershop

Sistema de marcação online para a **Sense Barbershop** — serviços, galeria, pagamentos (MB Way, Visa, PayPal, Revolut), painel admin e idiomas PT / EN / FR / ES.

## Links

| O quê | URL |
|--------|-----|
| Código (GitHub) | https://github.com/geraldosense/Barber_Sense |
| Site público (GitHub Pages) | https://geraldosense.github.io/Barber_Sense/ |
| Local (Mac) | http://localhost:3000 |

## Guia passo a passo (leia isto primeiro)

**Instruções completas em português:** [GUIA-ONLINE.md](GUIA-ONLINE.md)

### Porque o projeto não aparece no Render?

O Render **só mostra repositórios que já estão no GitHub**. O código novo ainda está no seu Mac — tem de enviá-lo primeiro.

**Ordem obrigatória:**

1. **Enviar para o GitHub** (Terminal → `./scripts/push-github.sh`)
2. **Confirmar** em https://github.com/geraldosense/Barber_Sense que vê `frontend/`, `backend/`, `render.yaml`
3. **Criar conta no Render** com "Sign up with GitHub"
4. **New + → Blueprint** → escolher `geraldosense/Barber_Sense`
5. Site online em `https://sense-barbershop.onrender.com`

### Envio rápido para o GitHub

```bash
cd /Users/Mac/sense_barber
./scripts/push-github.sh
```

Login: utilizador `geraldosense` + [Personal Access Token](https://github.com/settings/tokens) como palavra-passe.

### Diferença GitHub vs Render

| Onde | O que mostra |
|------|----------------|
| Link do GitHub | Código-fonte (ficheiros) |
| GitHub Pages | Só o design do site |
| Render | Site **completo** (marcações, pagamentos, admin) |

## Correr no Mac (local)

```bash
./Sense\ Barbershop.command
```

Ou duplo-clique em **Sense Barbershop.app**.

## Estrutura

```
sense_barber/
├── frontend/          # Site (HTML, CSS, JS)
├── backend/           # API Node.js + SQLite
├── scripts/           # Arranque automático e push GitHub
├── render.yaml        # Deploy online (Render)
└── .github/workflows/ # Publicação GitHub Pages
```

## Admin

- URL local: http://localhost:3000/admin-login.html
- Credenciais padrão: ver documentação interna / base de dados

---

© Sense Barbershop
