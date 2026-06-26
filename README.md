# Sense Barbershop

Sistema de marcação online para a **Sense Barbershop** — serviços, galeria, pagamentos (MB Way, Visa, PayPal, Revolut), painel admin e idiomas PT / EN / FR / ES.

## Links

| O quê | URL |
|--------|-----|
| Código (GitHub) | https://github.com/geraldosense/Barber_Sense |
| Site público (GitHub Pages) | https://geraldosense.github.io/Barber_Sense/ |
| Local (Mac) | http://localhost:3000 |

## Porque o GitHub não mostra o site completo?

O link `github.com/geraldosense/Barber_Sense` é o **repositório de código**, não a aplicação a correr.

- **GitHub Pages** mostra o design do site (frontend).
- **Marcações, login e pagamentos** precisam do servidor Node.js (backend).

## Colocar o código no GitHub

No Terminal (Mac):

```bash
cd /Users/Mac/sense_barber
chmod +x scripts/push-github.sh
./scripts/push-github.sh
```

Se pedir login: utilize o seu utilizador GitHub e um [Personal Access Token](https://github.com/settings/tokens) como palavra-passe.

## Ativar o site no GitHub Pages

1. Envie o código (comando acima).
2. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Após o push, o workflow publica automaticamente em:
   **https://geraldosense.github.io/Barber_Sense/**

## Site completo online (Render — gratuito)

1. Envie o código para o GitHub.
2. Crie conta em [render.com](https://render.com).
3. **New → Blueprint** → ligue o repositório `Barber_Sense`.
4. O ficheiro `render.yaml` instala e arranca o servidor.
5. O Render dá um URL tipo `https://sense-barbershop.onrender.com` com **tudo a funcionar**.

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
