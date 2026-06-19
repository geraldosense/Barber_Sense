# ⚡ QUICK START - Começar em 5 Minutos

## 🎯 Objetivo
Ter o sistema rodando em seu computador nos próximos 5 minutos.

---

## ✅ Pré-requisito (Já tem?)
- [ ] Node.js instalado? Baixe em https://nodejs.org se não tiver

---

## 🚀 Começar AGORA

### Terminal 1: Backend

```bash
# 1. Navegar para a pasta backend
cd backend

# 2. Instalar dependências (primeira vez apenas)
npm install

# 3. Iniciar servidor
npm start
```

**Deve aparecer:**
```
✓ Banco de dados conectado
✓ Tabelas criadas/verificadas
Servidor iniciado em porta 3000
URL: http://localhost:3000
```

✅ **Backend está rodando!**

---

### Terminal 2: Frontend

Abra um **novo terminal** e execute:

```bash
# 1. Navegar para a pasta frontend
cd frontend

# 2. Iniciar servidor (escolha uma opção)

# OPÇÃO A: Com npx (recomendado)
npx http-server -p 5500

# OPÇÃO B: Com Python (se tiver instalado)
python -m http.server 5500

# OPÇÃO C: Abrir em VS Code Live Server
# Clique direito em index.html > "Open with Live Server"
```

---

## 🌐 Acessar o Site

Abra seu navegador em:

```
http://localhost:5500
```

**Você deve ver:**
- ✅ Página bonita com logotipo
- ✅ Seção de serviços
- ✅ Seção de barbeiros
- ✅ Botão "Agendar Corte"

---

## 🧪 Testar o Agendamento

1. Clique em **"Agendar Corte"**
2. Selecione um **Serviço** (ex: Corte Normal)
3. Selecione um **Barbeiro** (ex: João Silva)
4. Escolha uma **Data** (qualquer data futura, não domingo)
5. Escolha uma **Hora** (ex: 09:00)
6. Preencha seus dados:
   - Nome: Seu nome
   - Telefone: +351 912345678
   - Email: seu_email@email.com
7. Clique **"Confirmar Agendamento"**

**Se vir uma mensagem de sucesso → TUDO FUNCIONA!** 🎉

---

## 📞 Duas Janelas Abertas?

**Terminal 1 (Backend):**
```
npm start
```
Deixe rodando!

**Terminal 2 (Frontend):**
```
npx http-server -p 5500
```
Deixe rodando!

**Navegador:**
```
http://localhost:5500
```
Use normalmente!

---

## 🛑 Para Parar

Pressione **Ctrl + C** em cada terminal.

---

## 🎓 Próximos Passos

Depois que testar:

1. Leia: **README.md** (visão geral)
2. Leia: **FAQ.md** (perguntas comuns)
3. Customize: cores, logotipo, informações

---

## 🆘 Problema?

### "Comando não encontrado"
→ Node.js não está instalado
→ Baixe em: https://nodejs.org

### "Porta 3000/5500 já em uso"
→ Feche outras aplicações que usem essas portas
→ Ou mude: `PORT=3001 npm start`

### "Erro ao abrir página"
→ Verifique se ambos os servidores estão rodando
→ Console (F12) mostrará o erro

### "Dados não carregam"
→ Certifique-se que backend está em http://localhost:3000
→ Verifique console (F12) para erros

---

## ✨ Parabéns!

Você agora tem um **sistema profissional de agendamento online** rodando em seu computador! 🧔

---

**Tempo total:** ~5 minutos ⏱️

**Próximo:** Ler README.md para entender melhor

**Dúvidas:** Veja FAQ.md
