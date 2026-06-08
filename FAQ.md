# ❓ FAQ - Perguntas Frequentes

## ⚙️ Instalação e Setup

### P: Onde faço download de Node.js?
**R:** Visite https://nodejs.org e baixe a versão LTS (recomendada)

### P: Como verifico se Node.js está instalado?
**R:** Abra terminal/prompt e digite:
```bash
node --version
npm --version
```

### P: Qual a pasta certa para clonar o projeto?
**R:** Use qualquer pasta, mas recomenda-se:
```
C:\Users\sense\OneDrive\Desktop\sense_barber
```

### P: Preciso instalar algo mais além de Node.js?
**R:** Não, Node.js com npm é o único requisito

### P: Como instalo dependências?
**R:** 
```bash
cd backend
npm install
```

---

## 🏃 Executando o Projeto

### P: Como inicio o backend?
**R:**
```bash
cd backend
npm start
```

### P: Como inicio o frontend?
**R:** Opção 1 - Live Server no VS Code:
1. Abra `frontend/index.html`
2. Clique direito > "Open with Live Server"

Opção 2 - Linha de comando:
```bash
cd frontend
npx http-server -p 5500
```

### P: Qual é a URL do site?
**R:**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5500`

### P: Posso alterar as portas?
**R:** Sim!
- Backend: Edite `.env` (altere PORT)
- Frontend: Adicione `:5500` ao comando http-server

### P: Os dois precisam rodar ao mesmo tempo?
**R:** Sim! O frontend chama a API do backend

---

## 🎨 Customização

### P: Onde coloco meu logotipo?
**R:**
1. Coloque a imagem em: `frontend/assets/logo.png`
2. Será automaticamente usado

### P: Quais as dimensões recomendadas?
**R:** Quadrado (100x100px mínimo, recomenda-se 200x200px)

### P: Posso usar PNG com transparência?
**R:** Sim! PNG é ideal para logotipos

### P: Onde adiciono as fotos dos barbeiros?
**R:** Em `frontend/assets/`:
- `barbeiro1.jpg` - João Silva
- `barbeiro2.jpg` - Carlos Santos  
- `barbeiro3.jpg` - Miguel Costa

### P: Qual tamanho de foto?
**R:** Quadrada, mínimo 200x200px. Recomenda-se 400x400px

### P: Como mudo o nome da barbearia?
**R:** Edite em 3 lugares:
1. `frontend/index.html` (título no topo)
2. `frontend/index.html` (navbar)
3. `backend/server.js` (mensagem de inicialização)

### P: Como mudo as cores?
**R:** Edite `frontend/css/style.css`:
```css
:root {
    --primary-color: #1a1a1a;
    --secondary-color: #d4af37;
    --accent-color: #e8e8e8;
}
```

### P: Como mudo os horários?
**R:** Edite em dois lugares:
1. `frontend/index.html` (seção info)
2. `frontend/js/main.js` (array de horários)

### P: Como adiciono um novo serviço?
**R:** Opção 1 - Via API (recomendado):
```bash
curl -X POST http://localhost:3000/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Serviço",
    "preco": 25,
    "tempo": 40,
    "descricao": "Descrição",
    "icon": "✂️"
  }'
```

Opção 2 - Diretamente no banco:
1. Abra `backend/database/barbearia_sense.db`
2. Edite a tabela `servicos`

### P: Como adiciono um novo barbeiro?
**R:** Similar aos serviços, use:
```bash
curl -X POST http://localhost:3000/api/barbeiros \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Barbeiro",
    "experiencia": "5 anos",
    "especialidades": "Cortes, Barba",
    "foto": "assets/barbeiro.jpg",
    "email": "barbeiro@email.com"
  }'
```

---

## 📧 Email

### P: Como configuro email?
**R:** Edite `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_app_password
```

### P: Como faço com Gmail?
**R:**
1. Ative 2FA: https://myaccount.google.com
2. Gere App Password: https://myaccount.google.com/apppasswords
3. Cole a senha em `.env`

### P: Posso usar Mailtrap?
**R:** Sim! Cadastre em https://mailtrap.io e use as credenciais

### P: Email é obrigatório?
**R:** Não. Deixe vazio em `.env` para desabilitar

### P: Como testo se email funciona?
**R:** Faça um agendamento. Se vir confirmação na tela, email foi enviado (se configurado)

---

## 🐛 Problemas e Soluções

### P: Porta 3000 já está em uso
**R:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <NUMERO> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

Ou mude a porta em `.env`:
```env
PORT=3001
```

### P: Erro "Cannot find module"
**R:**
```bash
cd backend
npm install
```

### P: Frontend não carrega dados
**R:** Verifique:
1. Backend está rodando? (`http://localhost:3000/api`)
2. Console do navegador tem erro? (F12)
3. Firewall bloqueando porta?

### P: Agendamento não salva
**R:**
1. Verifique console (F12) para erros
2. Verifique terminal do backend
3. Certifique-se que todos os campos estão preenchidos

### P: Imagens não aparecem
**R:** Coloque em `frontend/assets/` com os nomes corretos:
- `logo.png`
- `barbeiro1.jpg`, `barbeiro2.jpg`, `barbeiro3.jpg`

### P: Página em branco
**R:**
1. Verifique console (F12)
2. Verifique se arquivos CSS e JS carregam
3. Verifique nomes de arquivo (case-sensitive no Linux/Mac)

---

## 🔒 Segurança

### P: Como faço backup do banco de dados?
**R:** Copie `backend/database/barbearia_sense.db` para local seguro

### P: Como faço deploy para internet?
**R:** Veja documentação completa em `README.md`

### P: Dados são salvos automaticamente?
**R:** Sim! Estão em `backend/database/barbearia_sense.db`

### P: Preciso adicionar login?
**R:** Sim, recomenda-se para produção. Veja melhorias futuras

---

## 📱 Mobile e Responsividade

### P: O site funciona em mobile?
**R:** Sim! 100% responsivo

### P: Como testo em mobile?
**R:** Pressione F12 (DevTools) e clique no ícone de mobile

### P: Como acesso do telefone?
**R:** Use o IP da máquina:
```
http://SEU_IP:5500
```

Descubra seu IP com:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

---

## 📊 Dados

### P: Quantos agendamentos posso fazer?
**R:** Ilimitados! SQLite aguenta milhões

### P: Como vejo todos os agendamentos?
**R:**
```bash
curl http://localhost:3000/api/agendamentos
```

### P: Como filtro agendamentos?
**R:**
```bash
# Por email
curl "http://localhost:3000/api/agendamentos?email=cliente@email.com"

# Por data
curl "http://localhost:3000/api/agendamentos?data=2026-06-15"

# Por barbeiro
curl "http://localhost:3000/api/agendamentos?barbeiro_id=1"
```

### P: Como cancelo um agendamento?
**R:**
```bash
curl -X DELETE http://localhost:3000/api/agendamentos/1 \
  -H "Content-Type: application/json" \
  -d '{"motivo": "Cliente pediu cancelamento"}'
```

### P: Como vejo o banco de dados?
**R:** Use um programa como DB Browser:
1. Download: https://sqlitebrowser.org
2. Abra `backend/database/barbearia_sense.db`

---

## 🚀 Performance

### P: O site é rápido?
**R:** Sim! Otimizado para performance

### P: Como melhoro velocidade?
**R:**
1. Comprima imagens (TinyPNG)
2. Use CDN para imagens
3. Minifique CSS e JS (produção)

### P: Quantos usuários simultaneamente?
**R:** Pode suportar centenas em servidor básico

---

## 💡 Dicas e Truques

### P: Posso customizar o modal de agendamento?
**R:** Sim! Edite `frontend/index.html` (seção modal)

### P: Como adiciono Google Analytics?
**R:** Adicione antes de `</body>` em `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

### P: Posso adicionar WhatsApp?
**R:** Sim! Adicione link em `frontend/index.html`:
```html
<a href="https://wa.me/55XXXX">WhatsApp</a>
```

### P: Como mudo o layout?
**R:** Edite `frontend/index.html` (estrutura HTML)

### P: Posso adicionar mais passos no agendamento?
**R:** Sim! Edite `frontend/index.html` e `frontend/js/main.js`

---

## 📚 Documentação

### P: Onde encontro mais documentação?
**R:**
- `README.md` - Visão geral
- `backend/README.md` - API completa
- `frontend/README.md` - Frontend
- `INSTALACAO.md` - Instalação passo a passo

### P: Como vejo a documentação da API?
**R:** Abra `backend/README.md` (seção Documentação da API)

### P: Preciso saber programar?
**R:** Para usar: Não
Para customizar muito: Um pouco de HTML/CSS/JavaScript

---

## 🆘 Ainda com Dúvidas?

### Passo 1: Releia a documentação
- `README.md`
- `INSTALACAO.md` 
- Este arquivo (FAQ)

### Passo 2: Verifique os erros
- Console do navegador (F12)
- Terminal/prompt do backend

### Passo 3: Tente as soluções
- Este FAQ tem respostas para problemas comuns

### Passo 4: Procure online
- Google o erro que aparece
- Stack Overflow

---

**Última atualização**: Junho 2026

Desenvolvido para **Barbearia Sense** 🧔✨
