# 🚀 Guia de Instalação - Barbearia Sense

Bem-vindo! Este guia vai te ajudar a colocar o sistema online em poucos minutos.

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] **Node.js** (versão 14 ou superior)
  - Download: https://nodejs.org
  - Verificar: `node --version`
  
- [ ] **npm** (vem com Node.js)
  - Verificar: `npm --version`

- [ ] **Um navegador moderno**
  - Chrome, Firefox, Edge, Safari

## 📖 Método 1: Quick Start (Windows)

### Passo 1: Abra o Prompt de Comando
1. Pressione `Win + R`
2. Digite `cmd` e clique Enter

### Passo 2: Navegue até a pasta do projeto
```bash
cd C:\Users\sense\OneDrive\Desktop\sense_barber
```

### Passo 3: Execute o script
```bash
start.bat
```

Pronto! O backend iniciará automaticamente.

### Passo 4: Inicie o frontend
1. Vá até `frontend/index.html`
2. Clique direito
3. Escolha "Open with Live Server"

**Ou use:**
```bash
cd frontend
npx http-server -p 5500
```

---

## 📖 Método 2: Instalação Manual (Recomendado)

### Passo 1: Abra um terminal/prompt de comando

**Windows**: Pressione `Win + R`, digite `cmd`, Enter

**Mac/Linux**: Abra o Terminal

### Passo 2: Navegue até a pasta do projeto
```bash
cd C:\Users\sense\OneDrive\Desktop\sense_barber
```

### Passo 3: Instalar e iniciar o Backend

```bash
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install

# Iniciar servidor
npm start
```

Você verá:
```
╔═══════════════════════════════════════╗
║  🧔 Barbearia Sense - Backend         ║
║  Servidor iniciado em porta 3000       ║
║  URL: http://localhost:3000           ║
╚═══════════════════════════════════════╝
```

✅ Backend está rodando!

### Passo 4: Abrir novo terminal para o Frontend

**Mantenha o terminal anterior aberto com o backend**

Abra um novo terminal:

**Windows**: `Ctrl + N` no prompt
**Mac/Linux**: Abra um novo Terminal

### Passo 5: Iniciar o Frontend

```bash
# Voltar à pasta raiz
cd C:\Users\sense\OneDrive\Desktop\sense_barber

# Entrar na pasta frontend
cd frontend

# Opção A: Usar http-server
npx http-server -p 5500

# Opção B: Usar Python
python -m http.server 5500

# Opção C: Abrir diretamente no navegador
# Apenas abra o arquivo index.html
```

### Passo 6: Acesse no navegador

Abra seu navegador favorito e vá para:
```
http://localhost:5500
```

✅ Tudo funcionando!

---

## 🔧 Solução de Problemas

### ❌ "Node.js não está instalado"
- Baixe em: https://nodejs.org
- Instale a versão LTS recomendada
- Reinicie seu computador

### ❌ "npm: comando não encontrado"
- Reinstale Node.js
- Certifique-se de adicionar ao PATH durante instalação

### ❌ "Porta 3000 já em uso"
```bash
# Matar processo na porta 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### ❌ "Erro ao instalar dependências"
```bash
# Limpar cache npm
npm cache clean --force

# Tentar novamente
npm install
```

### ❌ "Frontend não carrega"
- Verifique se backend está rodando em http://localhost:3000
- Verifique o console (F12) para erros
- Certifique-se que está na porta correta (5500)

---

## 📁 Estrutura de Pastas

Após tudo funcionando, você terá:

```
sense_barber/
├── frontend/
│   ├── index.html              ← Abrir isso no navegador
│   ├── css/
│   │   ├── style.css
│   │   └── responsive.css
│   └── js/
│       ├── main.js
│       └── agendamento.js
│
├── backend/
│   ├── server.js               ← Servidor rodando
│   ├── database/
│   │   └── barbearia_sense.db  ← Banco de dados
│   └── routes/
│       ├── servicos.js
│       ├── barbeiros.js
│       ├── agendamentos.js
│       └── email.js
│
├── README.md                   ← Documentação principal
└── start.bat ou start.sh       ← Scripts de início
```

---

## ✨ Próximos Passos

### 1. Adicionar Logotipo
- Coloque seu logotipo em: `frontend/assets/logo.png`
- Será automaticamente usado em todo o site

### 2. Adicionar Fotos de Barbeiros
- Coloque em: `frontend/assets/barbeiro1.jpg` (e 2, 3)
- Qualidade: 200x200px ou maior

### 3. Personalizar Dados
- Edite `backend/.env` para configurações
- Adicione novos serviços via API ou direto no banco

### 4. Configurar Email (Opcional)
- Edite `backend/.env`
- Configure com Gmail ou Mailtrap
- Veja instruções em `backend/README.md`

---

## 📊 Verificar se Tudo Funciona

### Teste 1: Backend
Abra no navegador:
```
http://localhost:3000/api
```

Você deve ver:
```json
{
  "mensagem": "API da Barbearia Sense",
  "versao": "1.0.0",
  "status": "Online"
}
```

### Teste 2: Frontend
Abra:
```
http://localhost:5500
```

Você deve ver a página inicial bonita com o logotipo.

### Teste 3: Agendamento
1. Clique em "Agendar Corte"
2. Selecione um serviço
3. Selecione um barbeiro
4. Escolha uma data e hora
5. Digite seus dados
6. Clique "Confirmar Agendamento"

Se vir uma confirmação, **está tudo funcionando!** 🎉

---

## 🎯 Comandos Úteis

### Backend
```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Iniciar em modo desenvolvimento (auto-reload)
npm run dev
```

### Frontend
```bash
# Iniciar servidor (porta 5500)
npx http-server -p 5500

# Com Python 3
python -m http.server 5500

# Com Live Server (VS Code)
# Clique direito em index.html > Open with Live Server
```

---

## 📞 Suporte

Se tiver problemas:

1. **Leia os READMEs**
   - `README.md` - Documentação geral
   - `backend/README.md` - API e banco de dados
   - `frontend/README.md` - Frontend e customização

2. **Verifique o console**
   - Pressione F12 no navegador
   - Veja se há mensagens de erro vermelhas

3. **Verifique o terminal**
   - Veja se há erros quando faz uma ação

4. **Requisitos comuns**
   - Node.js 14+
   - npm 6+
   - Navegador com suporte a ES6+

---

## 🎉 Conclusão

Parabéns! Seu sistema de agendamento está funcionando! 🧔

Agora você pode:
- ✅ Receber agendamentos online
- ✅ Gerenciar barbeiros e serviços
- ✅ Enviar confirmações por email
- ✅ Customizar o design

**Última atualização**: Junho 2026

---

**Desenvolvido para Barbearia Sense com ❤️**
