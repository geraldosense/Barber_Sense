# 🧔 Barbearia Sense - Frontend

Sistema moderno de agendamento online para barbearias profissionais.

## 📁 Estrutura de Arquivos

```
frontend/
├── index.html          # Página principal
├── assets/            # Imagens e recursos
│   ├── logo.png      # Logotipo da barbearia
│   ├── barbeiro1.jpg # Foto barbeiro 1
│   ├── barbeiro2.jpg # Foto barbeiro 2
│   └── barbeiro3.jpg # Foto barbeiro 3
├── css/
│   ├── style.css      # Estilos principais
│   └── responsive.css # Estilos responsivos
└── js/
    ├── main.js        # Funções principais
    └── agendamento.js # Funções de agendamento
```

## 🎯 Funcionalidades

### Página Inicial
- ✅ Navegação responsiva com menu hamburger
- ✅ Hero section com call-to-action
- ✅ Exibição de serviços disponíveis
- ✅ Galeria de barbeiros
- ✅ Informações de contato
- ✅ Design moderno com tema escuro

### Sistema de Agendamento
- ✅ Formulário em 4 passos
- ✅ Seleção de serviço, barbeiro, data e hora
- ✅ Validação de dados em tempo real
- ✅ Confirmação visual do agendamento
- ✅ Modal responsivo

### Design
- ✅ Tema escuro profissional
- ✅ Paleta de cores: Preto, Dourado, Branco
- ✅ Responsivo para mobile, tablet e desktop
- ✅ Animações suaves
- ✅ Transições elegantes

## 🚀 Como Usar

### 1. Configurar o Backend
```bash
cd backend
npm install
npm start
```
O servidor estará rodando em `http://localhost:3000`

### 2. Abrir o Frontend
```bash
# Opção 1: Usar Live Server (VS Code)
# Clique direito em index.html > Open with Live Server

# Opção 2: Usar Python
python -m http.server 5500

# Opção 3: Abrir diretamente no navegador
# Abra frontend/index.html no seu navegador
```

## 🎨 Customização

### Logotipo
1. Coloque seu logotipo em `frontend/assets/logo.png`
2. O arquivo já vem com o logotipo da Barbearia Sense

### Cores
Edite as variáveis CSS em `frontend/css/style.css`:
```css
:root {
    --primary-color: #1a1a1a;     /* Preto */
    --secondary-color: #d4af37;   /* Dourado */
    --accent-color: #e8e8e8;      /* Cinzento claro */
}
```

### Fotos de Barbeiros
Adicione as fotos em `frontend/assets/`:
- `barbeiro1.jpg`
- `barbeiro2.jpg`
- `barbeiro3.jpg`

## 📱 Responsividade

- **Desktop**: 1200px+
- **Tablet**: 768px - 1024px
- **Mobile**: até 600px
- **Celulares pequenos**: até 480px

## ⚙️ Configuração da API

O frontend comunica com o backend através da variável:
```javascript
const API_URL = 'http://localhost:3000/api';
```

### Endpoints Utilizados
- `GET /api/servicos` - Listar serviços
- `GET /api/barbeiros` - Listar barbeiros
- `POST /api/agendamentos` - Criar agendamento
- `GET /api/agendamentos` - Listar agendamentos

## 🔒 Validações

- ✅ Telefone: mínimo 9 dígitos
- ✅ Email: formato válido
- ✅ Data: não pode ser no passado
- ✅ Hora: dentro do horário de funcionamento
- ✅ Disponibilidade: verifica se hora está livre

## 📧 Integrações

O sistema é preparado para:
- Email de confirmação
- Email de lembrete (24h antes)
- Email de cancelamento

*Obs: Email deve ser configurado no backend*

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos e animações
- **JavaScript Vanilla** - Funcionalidades
- **Fetch API** - Comunicação com backend

## 📝 Notas Importantes

1. **Primeira Vez**: Execute o backend primeiro para carregar os dados de exemplo
2. **Banco de Dados**: Dados de exemplo são carregados automaticamente
3. **Modo Offline**: Se o backend não estiver disponível, dados de exemplo são usados
4. **CORS**: Configure em `backend/.env` se necessário

## 🐛 Troubleshooting

### "Não consigo agendar"
- Verifique se o backend está rodando
- Verifique o console (F12) para erros
- Certifique-se de que CORS está configurado corretamente

### "Página em branco"
- Verifique se todos os arquivos CSS e JS estão sendo carregados
- Abra o console (F12) para ver erros

### "Imagens não aparecem"
- Coloque as imagens em `frontend/assets/`
- Verifique os nomes dos arquivos

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do backend.

---

**Desenvolvido para Barbearia Sense** 🧔✨
