# 🧔 Barbearia Sense - Backend

API REST para sistema de agendamento online de barbearia.

## 📁 Estrutura de Arquivos

```
backend/
├── server.js           # Arquivo principal
├── package.json        # Dependências
├── .env               # Configuração
├── .gitignore         # Git ignorar
├── database/
│   ├── database.js    # Classe de banco de dados
│   └── barbearia_sense.db # Banco SQLite (gerado automaticamente)
├── routes/
│   ├── servicos.js    # Rotas de serviços
│   ├── barbeiros.js   # Rotas de barbeiros
│   ├── agendamentos.js # Rotas de agendamentos
│   └── email.js       # Rotas de email
└── README.md          # Este arquivo
```

## 🚀 Instalação e Execução

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `.env`:
```env
PORT=3000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha
```

### 3. Iniciar o Servidor
```bash
# Modo produção
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

## 📚 Documentação da API

### 1. Serviços

#### GET /api/servicos
Listar todos os serviços disponíveis

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Corte Normal",
    "preco": 15.00,
    "tempo": 30,
    "descricao": "Corte clássico com acabamento perfeito",
    "icon": "✂️"
  }
]
```

#### GET /api/servicos/:id
Obter serviço específico

#### POST /api/servicos
Criar novo serviço

**Body:**
```json
{
  "nome": "Novo Serviço",
  "preco": 25.00,
  "tempo": 40,
  "descricao": "Descrição do serviço",
  "icon": "✂️"
}
```

#### PUT /api/servicos/:id
Atualizar serviço

#### DELETE /api/servicos/:id
Deletar serviço

---

### 2. Barbeiros

#### GET /api/barbeiros
Listar todos os barbeiros

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "experiencia": "10 anos",
    "especialidades": "Cortes, Degradês, Barba",
    "foto": "assets/barbeiro1.jpg",
    "email": "joao@barbeariasense.pt",
    "telefone": "+351 XXX XXX XXX",
    "ativo": 1
  }
]
```

#### GET /api/barbeiros/:id
Obter barbeiro específico

#### GET /api/barbeiros/:id/agendamentos
Listar agendamentos de um barbeiro

**Query Parameters:**
- `data` (optional): Filtrar por data (YYYY-MM-DD)

#### GET /api/barbeiros/:id/disponibilidade
Obter disponibilidade de um barbeiro

**Query Parameters:**
- `data` (required): Data (YYYY-MM-DD)

**Resposta:**
```json
{
  "data": "2026-06-15",
  "barbeiro_id": 1,
  "horarios_disponiveis": ["09:00", "09:30", "10:00"],
  "horarios_ocupados": ["14:00", "15:00"]
}
```

#### POST /api/barbeiros
Criar novo barbeiro

#### PUT /api/barbeiros/:id
Atualizar barbeiro

#### DELETE /api/barbeiros/:id
Desativar barbeiro

---

### 3. Agendamentos

#### GET /api/agendamentos
Listar agendamentos

**Query Parameters:**
- `email` (optional): Filtrar por email do cliente
- `data` (optional): Filtrar por data
- `barbeiro_id` (optional): Filtrar por barbeiro
- `status` (optional): Filtrar por status

**Resposta:**
```json
[
  {
    "id": 1,
    "servico": {
      "id": 1,
      "nome": "Corte Normal",
      "preco": 15.00,
      "tempo": 30
    },
    "barbeiro": {
      "id": 1,
      "nome": "João Silva"
    },
    "nome": "Cliente Nome",
    "telefone": "+351 XXX XXX XXX",
    "email": "cliente@email.com",
    "data": "2026-06-15",
    "hora": "09:00",
    "status": "confirmado"
  }
]
```

#### GET /api/agendamentos/:id
Obter agendamento específico

#### POST /api/agendamentos
Criar novo agendamento

**Body:**
```json
{
  "servico_id": 1,
  "barbeiro_id": 1,
  "data": "2026-06-15",
  "hora": "09:00",
  "nome": "Cliente Nome",
  "telefone": "+351 XXXXXXXXX",
  "email": "cliente@email.com"
}
```

**Validações:**
- ✅ Todos os campos são obrigatórios
- ✅ Data não pode ser no passado
- ✅ Data não pode ser domingo
- ✅ Horário não pode estar ocupado

#### PUT /api/agendamentos/:id
Atualizar agendamento

#### DELETE /api/agendamentos/:id
Cancelar agendamento

**Body (opcional):**
```json
{
  "motivo": "Motivo do cancelamento"
}
```

#### GET /api/agendamentos/verificar
Verificar disponibilidade de horário

**Query Parameters:**
- `data` (required): Data
- `hora` (required): Hora
- `barbeiro_id` (required): ID do barbeiro

**Resposta:**
```json
{
  "data": "2026-06-15",
  "hora": "09:00",
  "barbeiro_id": 1,
  "disponivel": true
}
```

#### GET /api/agendamentos/ocupados
Listar horários ocupados

**Query Parameters:**
- `data` (required): Data
- `barbeiro_id` (required): ID do barbeiro

**Resposta:**
```json
{
  "data": "2026-06-15",
  "barbeiro_id": 1,
  "horarios": ["09:00", "10:00", "14:30"]
}
```

---

### 4. Email

#### POST /api/email/confirmacao
Enviar email de confirmação

**Body:**
```json
{
  "email": "cliente@email.com",
  "agendamento": {
    "id": 1,
    "nome": "Cliente",
    "servico": {
      "nome": "Corte",
      "preco": 15
    },
    "barbeiro": {
      "nome": "João"
    },
    "data": "2026-06-15",
    "hora": "09:00"
  }
}
```

#### POST /api/email/lembrete
Enviar email de lembrete

#### POST /api/email/cancelamento
Enviar email de cancelamento

---

## 🗄️ Base de Dados

### Tabelas

#### servicos
```sql
CREATE TABLE servicos (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  preco REAL NOT NULL,
  tempo_estimado INTEGER NOT NULL,
  descricao TEXT,
  icone TEXT,
  criado_em DATETIME
)
```

#### barbeiros
```sql
CREATE TABLE barbeiros (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  experiencia TEXT,
  especialidades TEXT,
  foto TEXT,
  telefone TEXT,
  email TEXT,
  ativo INTEGER DEFAULT 1,
  criado_em DATETIME
)
```

#### agendamentos
```sql
CREATE TABLE agendamentos (
  id INTEGER PRIMARY KEY,
  servico_id INTEGER NOT NULL,
  barbeiro_id INTEGER NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT DEFAULT 'confirmado',
  observacoes TEXT,
  criado_em DATETIME,
  atualizado_em DATETIME,
  FOREIGN KEY (servico_id) REFERENCES servicos(id),
  FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
  UNIQUE(barbeiro_id, data, hora)
)
```

#### cancelamentos
```sql
CREATE TABLE cancelamentos (
  id INTEGER PRIMARY KEY,
  agendamento_id INTEGER NOT NULL,
  motivo TEXT,
  cancelado_em DATETIME,
  FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
)
```

---

## 📧 Configuração de Email

### Usar Gmail

1. Ative 2FA em sua conta Google
2. Gere uma "App Password" em: https://myaccount.google.com/apppasswords
3. Configure no `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_app_password
```

### Usar Mailtrap (Desenvolvimento)

1. Crie conta em: https://mailtrap.io
2. Copie as credenciais SMTP
3. Configure no `.env`:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=seu_usuario
EMAIL_PASS=sua_senha
```

---

## 🔒 Segurança

### Implementado
- ✅ Validação de entrada
- ✅ CORS configurável
- ✅ Proteção contra agendamentos duplicados
- ✅ Validação de datas

### Recomendações
- 🔒 Adicionar autenticação (JWT)
- 🔒 Rate limiting
- 🔒 Validação de email com tokens
- 🔒 Backup automático do banco de dados

---

## 🧪 Testes

### Listar Serviços
```bash
curl http://localhost:3000/api/servicos
```

### Criar Agendamento
```bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "servico_id": 1,
    "barbeiro_id": 1,
    "data": "2026-06-20",
    "hora": "10:00",
    "nome": "João Silva",
    "telefone": "+351912345678",
    "email": "joao@email.com"
  }'
```

---

## 📦 Dependências

- **express**: Framework web
- **cors**: Middleware CORS
- **sqlite3**: Banco de dados
- **nodemailer**: Envio de emails
- **dotenv**: Variáveis de ambiente
- **body-parser**: Parser de requisições
- **nodemon**: Auto-reload em desenvolvimento

---

## 🚨 Troubleshooting

### "Porto 3000 já está em uso"
```bash
# Alterar porta no .env
PORT=3001
```

### "Erro de CORS"
```bash
# Configurar em server.js
app.use(cors({
  origin: 'http://localhost:5500'
}));
```

### "Erro ao enviar email"
- Email não configurado (normal em desenvolvimento)
- Verifique credenciais em `.env`
- Use Mailtrap para testes

---

## 📞 Endpoints Resumidos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api | Status da API |
| GET | /api/servicos | Listar serviços |
| POST | /api/servicos | Criar serviço |
| GET | /api/barbeiros | Listar barbeiros |
| POST | /api/barbeiros | Criar barbeiro |
| GET | /api/agendamentos | Listar agendamentos |
| POST | /api/agendamentos | Criar agendamento |
| PUT | /api/agendamentos/:id | Atualizar agendamento |
| DELETE | /api/agendamentos/:id | Cancelar agendamento |

---

**Desenvolvido para Barbearia Sense** 🧔✨
