# Guia completo — colocar o Sense Barbershop online

Este guia explica **tudo por ordem**, do zero até ter o site a funcionar na internet.

---

## Resumo rápido (ordem obrigatória)

```
1. Enviar código para o GitHub     ← SEM ISTO, O RENDER NÃO VÊ O PROJETO
2. (Opcional) Ativar GitHub Pages   ← só o design do site
3. Criar conta no Render            ← site COMPLETO (marcações, pagamentos, etc.)
4. Ligar GitHub ao Render
5. New → Blueprint → escolher Barber_Sense
```

**Regra importante:** O Render **não lê o projeto do seu Mac**. Ele só vê repositórios que já estão no **GitHub** e à conta GitHub que ligou ao Render.

---

## Porque o projeto não aparece no Render?

| Situação | O que fazer |
|----------|-------------|
| Ainda não fez `push` para o GitHub | Faça a **Parte 1** deste guia primeiro |
| O código no GitHub está antigo (só `FAQ.md`, etc.) | Corra `./scripts/push-github.sh` para enviar a versão nova |
| Conta Render criada com email, mas GitHub não ligado | No Render: **Account Settings → Connect GitHub** |
| Ligou outra conta GitHub (não `geraldosense`) | Desligue e volte a ligar a conta certa |
| Procurou em "Web Service" em vez de "Blueprint" | Use **Blueprint** — o projeto tem ficheiro `render.yaml` |
| Repositório é privado e Render não tem permissão | Ao ligar GitHub, autorize acesso ao repo `Barber_Sense` |

---

## PARTE 1 — Enviar o projeto para o GitHub

### 1.1 Abrir o Terminal no Mac

1. Prima **Cmd + Espaço**
2. Escreva **Terminal**
3. Prima Enter

### 1.2 Ir à pasta do projeto

Cole e prima Enter:

```bash
cd /Users/Mac/sense_barber
```

### 1.3 Criar um token do GitHub (só na primeira vez)

O GitHub **já não aceita a palavra-passe normal** no Terminal. Precisa de um **token**:

1. Abra no browser: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. Nome: `Sense Barbershop Mac`
4. Validade: escolha **90 days** ou **No expiration**
5. Marque a caixa **`repo`** (acesso total aos repositórios)
6. Clique **Generate token**
7. **Copie o token** (só aparece uma vez — guarde-o num sítio seguro)

### 1.4 Enviar o código

```bash
chmod +x scripts/push-github.sh
./scripts/push-github.sh
```

Quando pedir credenciais:

| Campo | O que escrever |
|-------|----------------|
| **Username** | `geraldosense` |
| **Password** | Cole o **token** (não a palavra-passe do GitHub) |

### 1.5 Confirmar que funcionou

Deve ver no Terminal algo como:

```
✓ Código enviado com sucesso!
```

Abra no browser: **https://github.com/geraldosense/Barber_Sense**

Deve ver pastas como `frontend/`, `backend/`, `render.yaml`, `.github/` — **não** só um ficheiro `FAQ.md`.

### 1.6 Se o push falhar

**Erro: "could not read Username"**
→ Volte ao passo 1.3 e crie o token.

**Erro: "rejected" ou "non-fast-forward"**
→ Tente manualmente:

```bash
git push --force-with-lease -u origin main
```

**Erro: "Permission denied"**
→ Confirme que está logado como `geraldosense` e que o token tem permissão `repo`.

---

## PARTE 2 — Site só com design (GitHub Pages) — opcional

Isto mostra o **aspeto** do site. **Marcações e pagamentos não funcionam** aqui (falta o servidor).

1. Abra: https://github.com/geraldosense/Barber_Sense/settings/pages
2. Em **Build and deployment** → **Source**, escolha **GitHub Actions**
3. Aguarde 2–5 minutos
4. O site fica em: **https://geraldosense.github.io/Barber_Sense/**

Para ver se o deploy correu: separador **Actions** no GitHub → workflow "Publicar site no GitHub Pages" com ✓ verde.

---

## PARTE 3 — Site COMPLETO no Render (recomendado)

Aqui o site funciona **a sério**: marcações, login, pagamentos, painel admin.

### 3.1 Criar conta no Render

1. Abra: https://render.com
2. Clique **Get Started** ou **Sign Up**
3. Escolha **Sign up with GitHub** (mais fácil — liga as contas de uma vez)
   - Ou: registe com email e depois ligue o GitHub em **Account Settings**

### 3.2 Ligar o GitHub ao Render (se ainda não ligou)

1. No Render, clique no seu nome (canto superior direito) → **Account Settings**
2. Separador **Connections** ou **Git Providers**
3. Ao lado de **GitHub**, clique **Connect**
4. O GitHub abre um ecrã de autorização:
   - Se o repo for **público**: pode escolher **All repositories** ou só **Barber_Sense**
   - Se for **privado**: tem de autorizar explicitamente o `Barber_Sense`
5. Clique **Install** ou **Authorize**

### 3.3 Criar o deploy com Blueprint

1. No painel Render: https://dashboard.render.com
2. Clique o botão azul **New +** (canto superior direito)
3. Escolha **Blueprint**
   - *Não escolha "Web Service" manualmente — o Blueprint lê o ficheiro `render.yaml` e configura tudo*
4. Aparece a lista de repositórios GitHub:
   - Use a caixa de pesquisa e escreva: `Barber_Sense`
   - Clique no repositório **geraldosense/Barber_Sense**
5. O Render mostra o que vai criar (serviço `sense-barbershop` a partir do `render.yaml`)
6. Clique **Apply** ou **Create Blueprint**
7. Aguarde o **build** (5–15 minutos na primeira vez)

### 3.4 Obter o URL do site

Quando o estado ficar **Live** (verde):

1. Clique no serviço **sense-barbershop**
2. No topo vê algo como: `https://sense-barbershop.onrender.com`
3. Abra esse link no browser — é o **site completo online**

### 3.5 Testar se está tudo bem

| Teste | URL |
|-------|-----|
| Página inicial | `https://sense-barbershop.onrender.com/` |
| API online | `https://sense-barbershop.onrender.com/api/health` |
| Marcação | `https://sense-barbershop.onrender.com/marcacao.html` |
| Admin | `https://sense-barbershop.onrender.com/admin-login.html` |

Se `/api/health` mostrar `{"status":"ok",...}` → o servidor está a funcionar.

---

## PARTE 4 — O repositório NÃO aparece na lista do Render

Siga esta checklist **por ordem**:

### Passo A — O código está mesmo no GitHub?

Abra https://github.com/geraldosense/Barber_Sense

- ❌ Só vê ficheiros antigos → volte à **Parte 1** e faça o push
- ✅ Vê `frontend/`, `backend/`, `render.yaml` → continue

### Passo B — GitHub ligado ao Render?

1. Render → **Account Settings** → **Connections**
2. GitHub deve estar **Connected**
3. Se não: **Connect** e autorize

### Passo C — Render tem permissão para o repositório?

1. Abra: https://github.com/settings/installations
2. Clique em **Render**
3. Em **Repository access**, confirme que `Barber_Sense` está incluído
4. Se não: **Configure** → adicione `Barber_Sense` → **Save**

### Passo D — Está no sítio certo no Render?

- ✅ **New +** → **Blueprint**
- ❌ Não use só "Static Site" (isso é para sites sem servidor)

### Passo E — Conta GitHub certa?

O repositório é de **geraldosense**. Se ligou outra conta GitHub ao Render, o repo não aparece. Desligue e ligue a conta correta.

### Passo F — Atualizar a lista

Depois de ligar o GitHub, feche o ecrã do Blueprint e abra de novo **New +** → **Blueprint**. A lista atualiza.

---

## PARTE 5 — Alternativa: Web Service manual (se Blueprint não funcionar)

Se o Blueprint der erro, pode criar à mão:

1. **New +** → **Web Service**
2. Ligue o repositório **geraldosense/Barber_Sense**
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | `sense-barbershop` |
| **Region** | Frankfurt (EU) ou a mais próxima |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free |

4. Em **Environment Variables**, adicione:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = qualquer texto longo aleatório (ex: `sense-barber-2026-segredo`)

5. Clique **Create Web Service**

---

## PARTE 6 — Plano gratuito do Render (o que esperar)

- O site **adormece** após ~15 minutos sem visitas
- A **primeira visita** depois disso pode demorar 30–60 segundos a acordar
- Isto é normal no plano Free
- Para site sempre rápido, seria preciso plano pago

---

## PARTE 7 — Resumo dos links

| O quê | Link |
|-------|------|
| Código no GitHub | https://github.com/geraldosense/Barber_Sense |
| Pré-visualização (só design) | https://geraldosense.github.io/Barber_Sense/ |
| Site completo (após Render) | https://sense-barbershop.onrender.com |
| Painel Render | https://dashboard.render.com |
| Criar token GitHub | https://github.com/settings/tokens |
| Permissões Render no GitHub | https://github.com/settings/installations |

---

## PARTE 8 — Correr no Mac (local, sem internet)

Duplo-clique em **Sense Barbershop.app** ou:

```bash
cd /Users/Mac/sense_barber
./Sense\ Barbershop.command
```

Site local: http://localhost:3000

---

## Precisa de ajuda?

Se algo falhar, envie:

1. O que apareceu no Terminal ao correr `./scripts/push-github.sh`
2. Uma captura do ecrã do Render (lista de repositórios ou mensagem de erro)
3. O link https://github.com/geraldosense/Barber_Sense — confirme se vê as pastas novas
