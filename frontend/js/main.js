// ===== CONFIGURAÇÃO =====
// API_URL definido em config.js

const HORARIOS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30'
];

const DADOS_EXEMPLO = {
    servicos: [
        { id: 1, nome: 'Corte Normal', preco: 15, tempo: 30, descricao: 'Corte clássico com acabamento perfeito', icon: '✂️' },
        { id: 2, nome: 'Degradê', preco: 20, tempo: 40, descricao: 'Degradê moderno com transição suave', icon: '💇' },
        { id: 3, nome: 'Barba', preco: 12, tempo: 25, descricao: 'Aparagem e modelagem de barba', icon: '🧔' },
        { id: 4, nome: 'Corte + Barba', preco: 25, tempo: 55, descricao: 'Combinação de corte e barba', icon: '👔' },
        { id: 5, nome: 'Tratamento Capilar', preco: 30, tempo: 45, descricao: 'Hidratação e tratamento profissional', icon: '💆' }
    ],
    barbeiros: [
        { id: 1, nome: 'Geraldo Sense', experiencia: '15+ anos', especialidades: 'Cortes clássicos, Degradê, Barba', foto: 'assets/logo.png' }
    ]
};

let servicos = [];
let barbeiros = [];
let agendamento = {
    servico_id: null,
    barbeiro_id: null,
    data: null,
    hora: null,
    nome: null,
    telefone: null,
    email: null
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    configurarEventos();
    configurarMenuMobile();
    configurarScroll();
    configurarHeroSlider();
});

async function carregarDados() {
    try {
        const [resServicos, resBarbeiros] = await Promise.all([
            fetch(`${API_URL}/servicos`),
            fetch(`${API_URL}/barbeiros`)
        ]);

        if (resServicos.ok) servicos = await resServicos.json();
        if (resBarbeiros.ok) barbeiros = await resBarbeiros.json();
    } catch (error) {
        console.warn('Backend indisponível, usando dados de exemplo.');
    }

    if (!servicos.length) servicos = DADOS_EXEMPLO.servicos;
    if (!barbeiros.length) barbeiros = DADOS_EXEMPLO.barbeiros;

    // Mostrar apenas o barbeiro principal no site público
    const principal = barbeiros.find(b => b.principal) || barbeiros[0];
    barbeiros = principal ? [principal] : barbeiros;

    renderizarServicos();
    renderizarBarbeiros();
}

// ===== RENDERIZAÇÃO =====
function renderizarServicos() {
    const grid = document.getElementById('servicosGrid');
    if (!grid) return;

    grid.innerHTML = servicos.map(s => `
        <div class="course-item">
            <div class="course-item-header">
                <div class="course-item-icon">${s.icon || '✂️'}</div>
                <h3>${s.nome}</h3>
                <div class="course-item-price">${s.preco.toFixed(2)}€</div>
            </div>
            <p>${s.descricao || ''}</p>
            <div class="course-item-tempo"><i class="fas fa-clock"></i> ${s.tempo} min</div>
            <button class="learn-more" onclick="abrirModalComServico(${s.id})">Agendar</button>
        </div>
    `).join('');
}

function renderizarBarbeiros() {
    const grid = document.getElementById('barbeirosGrid');
    if (!grid) return;

    grid.innerHTML = barbeiros.map(b => `
        <div class="barbeiro-card">
            <div class="barbeiro-image-container">
                ${b.foto
                    ? `<img src="${b.foto}" alt="${b.nome}" onerror="this.parentElement.innerHTML='<span class=\\'barbeiro-placeholder\\'>🧔</span>'">`
                    : '<span class="barbeiro-placeholder">🧔</span>'}
            </div>
            <div class="barbeiro-info">
                <h3>${b.nome}</h3>
                <p class="barbeiro-experiencia"><i class="fas fa-star"></i> ${b.experiencia || 'Profissional'}</p>
                <p class="barbeiro-especialidades">${b.especialidades || ''}</p>
            </div>
        </div>
    `).join('');
}

function renderizarOpcoesModal() {
    const servicosLista = document.getElementById('servicosLista');
    const barbeirosLista = document.getElementById('barbeirosLista');

    if (servicosLista) {
        servicosLista.innerHTML = servicos.map(s => `
            <div class="servico-option ${agendamento.servico_id === s.id ? 'selected' : ''}"
                 onclick="selecionarServico(${s.id})">
                ${s.icon || '✂️'}<br>${s.nome}<br><small>${s.preco.toFixed(2)}€</small>
            </div>
        `).join('');
    }

    if (barbeirosLista) {
        barbeirosLista.innerHTML = barbeiros.map(b => `
            <div class="barbeiro-option ${agendamento.barbeiro_id === b.id ? 'selected' : ''}"
                 onclick="selecionarBarbeiro(${b.id})">
                🧔<br>${b.nome}
            </div>
        `).join('');
    }
}

// ===== MODAL =====
function abrirModal() {
    const modal = document.getElementById('modalAgendamento');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    renderizarOpcoesModal();
    proximoPasso(1);
}

function abrirModalComServico(servicoId) {
    if (typeof irParaMarcacao === 'function') {
        sessionStorage.setItem('servicoPretendido', servicoId);
        irParaMarcacao();
        return;
    }
    agendamento.servico_id = servicoId;
    abrirModal();
}

function fecharModal() {
    const modal = document.getElementById('modalAgendamento');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    resetarAgendamento();
}

function resetarAgendamento() {
    agendamento = {
        servico_id: null,
        barbeiro_id: null,
        data: null,
        hora: null,
        nome: null,
        telefone: null,
        email: null
    };
    const form = document.getElementById('formAgendamento');
    if (form) form.reset();
    proximoPasso(1);
}

function proximoPasso(passo) {
    if (passo === 2 && !agendamento.servico_id) {
        mostrarNotificacao('Selecione um serviço.', 'error');
        return;
    }
    if (passo === 3 && !agendamento.barbeiro_id) {
        mostrarNotificacao('Selecione um barbeiro.', 'error');
        return;
    }
    if (passo === 4) {
        const data = document.getElementById('data').value;
        const hora = document.getElementById('hora').value;
        if (!data || !hora) {
            mostrarNotificacao('Selecione data e horário.', 'error');
            return;
        }
        agendamento.data = data;
        agendamento.hora = hora;
    }

    document.querySelectorAll('.form-step').forEach(step => step.classList.add('hidden'));
    const stepEl = document.getElementById(`step${passo}`);
    if (stepEl) stepEl.classList.remove('hidden');

    if (passo === 3) atualizarHorarios();
    if (passo === 4) preencherDadosUtilizador();
}

function preencherDadosUtilizador() {
    if (typeof utilizadorAtual !== 'undefined' && utilizadorAtual) {
        const nomeEl = document.getElementById('nome');
        const telEl = document.getElementById('telefone');
        const emailEl = document.getElementById('email');
        if (nomeEl) {
            nomeEl.value = utilizadorAtual.nome || '';
            nomeEl.readOnly = true;
        }
        if (telEl) {
            telEl.value = utilizadorAtual.telefone || '';
            telEl.readOnly = !!utilizadorAtual.telefone;
        }
        if (emailEl) {
            emailEl.value = utilizadorAtual.email || '';
            emailEl.readOnly = true;
        }

        const step4 = document.getElementById('step4');
        let hint = step4?.querySelector('.booking-account-hint');
        if (step4 && !hint) {
            hint = document.createElement('p');
            hint.className = 'booking-account-hint dash-user-readonly';
            hint.innerHTML = `<i class="fas fa-user-check"></i> Dados da sua conta Google — prontos para confirmar a marcação.`;
            step4.insertBefore(hint, step4.querySelector('.form-buttons'));
        }
    }
}

// ===== SELEÇÃO =====
function selecionarServico(id) {
    agendamento.servico_id = id;
    renderizarOpcoesModal();
}

function selecionarBarbeiro(id) {
    agendamento.barbeiro_id = id;
    renderizarOpcoesModal();
}

async function atualizarHorarios() {
    const select = document.getElementById('hora');
    const data = document.getElementById('data').value;
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um horário</option>';

    let ocupados = [];
    if (data && agendamento.barbeiro_id) {
        try {
            const res = await fetch(
                `${API_URL}/agendamentos/ocupados?data=${data}&barbeiro_id=${agendamento.barbeiro_id}`
            );
            if (res.ok) {
                const resultado = await res.json();
                ocupados = resultado.horarios || [];
            }
        } catch (e) {
            /* usa todos os horários */
        }
    }

    HORARIOS.forEach(hora => {
        if (!ocupados.includes(hora)) {
            const opt = document.createElement('option');
            opt.value = hora;
            opt.textContent = hora;
            select.appendChild(opt);
        }
    });
}

// ===== SUBMISSÃO =====
async function submeterAgendamento(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!nome || !telefone || !email) {
        mostrarNotificacao('Preencha todos os campos.', 'error');
        return;
    }

    const payload = {
        servico_id: agendamento.servico_id,
        barbeiro_id: agendamento.barbeiro_id,
        data: agendamento.data,
        hora: agendamento.hora,
        nome,
        telefone,
        email
    };

    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('authToken');
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const resultado = await res.json();

        if (!res.ok) {
            throw new Error(resultado.erro || 'Erro ao agendar');
        }

        mostrarConfirmacao(resultado);
        proximoPasso(5);
    } catch (error) {
        mostrarNotificacao(error.message || 'Erro ao confirmar agendamento.', 'error');
    }
}

function mostrarConfirmacao(dados) {
    const msg = document.getElementById('confirmationMessage');
    if (!msg) return;

    const servico = dados.servico || servicos.find(s => s.id === agendamento.servico_id);
    const barbeiro = dados.barbeiro || barbeiros.find(b => b.id === agendamento.barbeiro_id);

    msg.innerHTML = `
        <p><strong>Serviço:</strong> ${servico?.nome || ''}</p>
        <p><strong>Barbeiro:</strong> ${barbeiro?.nome || ''}</p>
        <p><strong>Data:</strong> ${dados.data || agendamento.data}</p>
        <p><strong>Hora:</strong> ${dados.hora || agendamento.hora}</p>
        <p><strong>Nome:</strong> ${dados.nome || ''}</p>
        <p>Receberá uma confirmação por email.</p>
    `;
}

// ===== UTILITÁRIOS =====
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.textContent = mensagem;
    document.body.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add('show'));
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function configurarEventos() {
    const btnAgendar = document.getElementById('btnAgendar');
    const btnAgendarNav = document.getElementById('btnAgendarNav');
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('modalAgendamento');
    const form = document.getElementById('formAgendamento');
    const dataInput = document.getElementById('data');

    if (btnAgendar) {
        btnAgendar.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof irParaMarcacao === 'function') {
                irParaMarcacao();
            } else {
                window.location.href = 'marcacao.html';
            }
        });
    }

    if (closeModal) closeModal.addEventListener('click', fecharModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });
    }

    if (form) form.addEventListener('submit', submeterAgendamento);

    if (dataInput) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        if (amanha.getDay() === 0) amanha.setDate(amanha.getDate() + 1);
        dataInput.min = amanha.toISOString().split('T')[0];

        const max = new Date();
        max.setDate(max.getDate() + 30);
        dataInput.max = max.toISOString().split('T')[0];

        dataInput.addEventListener('change', atualizarHorarios);
    }
}

function configurarMenuMobile() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        }
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        });
    });
}

function configurarScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 120;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

function configurarHeroSlider() {
    const slides = Array.from(document.querySelectorAll('.hero-slide'));
    const indicatorsEl = document.getElementById('heroIndicators');
    if (!slides.length) return;

    let currentIndex = 0;
    let timer = null;
    const indicators = [];

    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-indicator' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Publicidade ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index, true));
        indicatorsEl?.appendChild(dot);
        indicators.push(dot);
    });

    function clearTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function resetVideos() {
        slides.forEach(slide => {
            const video = slide.querySelector('video');
            if (!video) return;
            video.onended = null;
            video.pause();
            video.currentTime = 0;
        });
    }

    function scheduleNext(delay) {
        clearTimer();
        timer = setTimeout(() => goToSlide((currentIndex + 1) % slides.length), delay);
    }

    function goToSlide(index, manual) {
        clearTimer();
        resetVideos();

        slides[currentIndex]?.classList.remove('active');
        indicators[currentIndex]?.classList.remove('active');

        currentIndex = index;
        const slide = slides[currentIndex];
        slide.classList.add('active');
        indicators[currentIndex]?.classList.add('active');

        if (slide.dataset.type === 'video') {
            const video = slide.querySelector('video');
            if (!video) {
                scheduleNext(manual ? 5000 : 5000);
                return;
            }

            video.currentTime = 0;
            video.onended = () => scheduleNext(600);

            video.play().catch(() => scheduleNext(5000));
            return;
        }

        const duration = parseInt(slide.dataset.duration, 10) || 5000;
        scheduleNext(duration);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearTimer();
            resetVideos();
        } else {
            goToSlide(currentIndex, true);
        }
    });

    goToSlide(0);
}
