# 🧔 Sense Barbershop - Sistema de Agendamento Online

Bem-vindo ao projeto completo de um **site profissional para agendamento de cortes de cabelo** online! Este é um sistema completo com frontend moderno e backend robusto.

## 📸 Screenshots

[Seus screenshots aqui quando o site estiver pronto]

## ✨ Características Principais

### Frontend
- 🎨 Design moderno com tema escuro
- 📱 Totalmente responsivo (Mobile, Tablet, Desktop)
- ⚡ Animações suaves e elegantes
- 🎯 Sistema de agendamento em 4 passos
- 📍 Exibição de serviços e barbeiros
- 🧑‍💼 Galeria de barbeiros com experiência

### Backend
- 🛠️ API REST completa e documentada
- 📊 Banco de dados SQLite
- 🔐 Validações robustas
- 📧 Integração com email
- ⚙️ Escalável e bem organizado

### Funcionalidades
- ✅ Agendar cortes de cabelo online
- ✅ Escolher barbeiro, serviço, data e hora
- ✅ Confirmação automática de agendamento
- ✅ Email de confirmação
- ✅ Gerenciar agendamentos
- ✅ Sistema de horários disponíveis

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ instalado
- npm ou yarn
- Um navegador moderno

### 1️⃣ Clone ou Extraia o Projeto
```bash
cd sense_barber
```

### 2️⃣ Instalar e Iniciar Backend
```bash
cd backend
npm install
npm start
```
✅ Backend rodando em: `http://localhost:3000`

### 3️⃣ Iniciar Frontend
Em outro terminal:
```bash
cd frontend
# Opção 1: Usar Live Server (VS Code)
# Clique direito em index.html > Open with Live Server

# Opção 2: Usar Python
python -m http.server 5500

# Opção 3: Abrir diretamente
# Abra o arquivo index.html no navegador
```
✅ Frontend disponível em: `http://localhost:5500`

## 📁 Estrutura do Projeto

```
sense_barber/
├── frontend/
│   ├── index.html          # Página principal
│   ├── README.md           # Documentação frontend
│   ├── assets/
│   │   ├── logo.png        # Logotipo (já está pronto!)
│   │   ├── barbeiro1.jpg
│   │   ├── barbeiro2.jpg
│   │   └── barbeiro3.jpg
│   ├── css/
│   │   ├── style.css
│   │   └── responsive.css
│   └── js/
│       ├── main.js
│       └── agendamento.js
│
└── backend/
    ├── server.js           # Arquivo principal
    ├── README.md           # Documentação backend
    ├── package.json
    ├── .env               # Configuração
    ├── .gitignore
    ├── database/
    │   ├── database.js
    │   └── barbearia_sense.db
    └── routes/
        ├── servicos.js
        ├── barbeiros.js
        ├── agendamentos.js
        └── email.js
```

## 🎯 Como Funciona

### Cliente (Frontend)
1. Acessa o site da barbearia
2. Clica em "Agendar Corte"
3. Seleciona:
   - Tipo de serviço (Corte, Degradê, Barba, etc.)
   - Barbeiro de sua preferência
   - Data desejada
   - Horário disponível
4. Insere seus dados (Nome, Telefone, Email)
5. Confirma o agendamento
6. Recebe confirmação visual e por email

### Servidor (Backend)
1. Recebe requisição do frontend
2. Valida todos os dados
3. Verifica disponibilidade
4. Salva no banco de dados
5. Envia email de confirmação
6. Retorna confirmação ao cliente

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com animações
- **JavaScript (Vanilla)** - Sem dependências externas
- **Fetch API** - Comunicação com backend

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite3** - Banco de dados leve
- **Nodemailer** - Envio de emails
- **CORS** - Requisições entre domínios

## 📋 Dados de Exemplo

O sistema já vem com dados pré-carregados:

### Serviços Disponíveis
| Serviço | Preço | Tempo |
|---------|-------|-------|
| Corte Normal | €15,00 | 30 min |
| Degradê | €20,00 | 40 min |
| Barba | €12,00 | 25 min |
| Corte + Barba | €25,00 | 55 min |
| Tratamento Capilar | €30,00 | 45 min |

### Barbeiros
- João Silva (10 anos de experiência)
- Carlos Santos (8 anos de experiência)
- Miguel Costa (6 anos de experiência)

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

Edite `backend/.env`:
```env
PORT=3000
NODE_ENV=development

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_app_password
```

### Personalizar Cores

Edite `frontend/css/style.css`:
```css
:root {
    --primary-color: #1a1a1a;      /* Cor principal */
    --secondary-color: #d4af37;    /* Cor secundária (dourado) */
    --accent-color: #e8e8e8;       /* Cor de destaque */
}
```

### Adicionar Logotipo

1. Coloque sua imagem em `frontend/assets/logo.png`
2. Ele será automaticamente usado em:
   - Navbar (topo)
   - Hero section (home)

## 📱 Responsividade

O site funciona perfeitamente em:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (até 600px)
- ✅ Celulares pequenos (até 480px)

## 🔌 API Endpoints

### Serviços
- `GET /api/servicos` - Listar todos
- `POST /api/servicos` - Criar novo
- `PUT /api/servicos/:id` - Atualizar
- `DELETE /api/servicos/:id` - Deletar

### Barbeiros
- `GET /api/barbeiros` - Listar todos
- `POST /api/barbeiros` - Criar novo
- `GET /api/barbeiros/:id/disponibilidade` - Verificar disponibilidade

### Agendamentos
- `GET /api/agendamentos` - Listar (com filtros)
- `POST /api/agendamentos` - Criar novo
- `PUT /api/agendamentos/:id` - Atualizar
- `DELETE /api/agendamentos/:id` - Cancelar
- `GET /api/agendamentos/verificar` - Verificar disponibilidade

[Documentação completa em `backend/README.md`]

## 📧 Configurar Email

### Com Gmail
1. Ative 2FA: https://myaccount.google.com/
2. Gere App Password: https://myaccount.google.com/apppasswords
3. Configure em `.env`

### Com Mailtrap (Desenvolvimento)
1. Cadastre em https://mailtrap.io
2. Copie credenciais
3. Configure em `.env`

## 🎨 Customização

### Alterar Nome (Sense Barbershop)
1. `frontend/index.html` - Linha 7: `<title>`
2. `frontend/index.html` - Linha 42: `<h1>`
3. `backend/server.js` - Linha 57: console.log

### Alterar Horários de Funcionamento
1. `frontend/index.html` - Linha 58: Horário
2. `frontend/js/main.js` - Linha 210: Array de horários

### Alterar Informações de Contato
1. `frontend/index.html` - Seção "Contato"

### Adicionar/Editar Barbeiros
1. Abra postman ou curl
2. Faça POST em `/api/barbeiros` com:
```json
{
  "nome": "Novo Barbeiro",
  "experiencia": "5 anos",
  "especialidades": "Cortes, Barba",
  "foto": "assets/barbeiro.jpg",
  "email": "barbeiro@email.com",
  "telefone": "+351 XXX XXX XXX"
}
```

### Adicionar/Editar Serviços
1. Faça POST em `/api/servicos` com:
```json
{
  "nome": "Novo Serviço",
  "preco": 20.00,
  "tempo": 35,
  "descricao": "Descrição do serviço",
  "icon": "✂️"
}
```

## 🐛 Troubleshooting

### Problema: "Backend não responde"
```bash
# Verifique se está rodando
curl http://localhost:3000/api

# Reinicie
npm start
```

### Problema: "Erro de CORS"
- Verifique se backend está na porta 3000
- Edite `backend/server.js` se necessário

### Problema: "Imagens não aparecem"
- Coloque em `frontend/assets/`
- Verifique os nomes dos arquivos

### Problema: "Email não funciona"
- Deixe em branco para desativar temporariamente
- Configure depois com credenciais válidas

## 📚 Documentação Detalhada

- [Frontend README](frontend/README.md) - Documentação completa do frontend
- [Backend README](backend/README.md) - API e banco de dados

## 🚀 Próximas Melhorias

- [ ] Autenticação de clientes
- [ ] Dashboard de administrador
- [ ] Histórico de agendamentos
- [ ] Avaliações e comentários
- [ ] Integração com WhatsApp
- [ ] Sistema de pagamento
- [ ] Relatórios e estatísticas
- [ ] Backup automático

## 🤝 Contribuições

Sinta-se livre para:
1. Reportar bugs
2. Sugerir novas funcionalidades
3. Melhorar documentação
4. Otimizar código

## 📞 Suporte

Para dúvidas:
1. Leia os READMEs (frontend e backend)
2. Verifique a documentação da API
3. Abra uma issue

## 📄 Licença

MIT - Livre para usar, modificar e distribuir

## 🎉 Créditos

Desenvolvido para **Sense Barbershop** com ❤️

---

## 📊 Status do Projeto

- ✅ Frontend completo e responsivo
- ✅ Backend com API REST completa
- ✅ Banco de dados SQLite
- ✅ Validações de dados
- ✅ Sistema de email
- ✅ Documentação completa

---

**Pronto para começar?** 🚀

1. Instale as dependências: `npm install` (backend)
2. Inicie o backend: `npm start`
3. Abra o frontend: `Open with Live Server`
4. Visite: `http://localhost:5500`

---

Última atualização: **Junho de 2026** 🧔✨
#   B a r b e r _ S e n s e 
 
 