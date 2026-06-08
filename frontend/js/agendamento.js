// ===== FUNÇÕES ESPECÍFICAS DE AGENDAMENTO =====

/**
 * Validar número de telefone
 * @param {string} telefone - Número de telefone
 * @returns {boolean} - True se válido
 */
function validarTelefone(telefone) {
    const regex = /^(\+\d{1,3}[- ]?)?\d{9,}$/;
    return regex.test(telefone.replace(/\s/g, ''));
}

/**
 * Validar email
 * @param {string} email - Email
 * @returns {boolean} - True se válido
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Formatar número de telefone
 * @param {string} telefone - Número de telefone
 * @returns {string} - Número formatado
 */
function formatarTelefone(telefone) {
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length === 9) {
        return `+351 ${digitos.substring(0, 3)} ${digitos.substring(3, 6)} ${digitos.substring(6)}`;
    }
    return telefone;
}

/**
 * Obter data mínima (próximo dia útil)
 * @returns {string} - Data em formato YYYY-MM-DD
 */
function obterDataMinima() {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1); // Próximo dia
    
    // Se for domingo, pular para segunda
    if (hoje.getDay() === 0) {
        hoje.setDate(hoje.getDate() + 1);
    }
    
    return hoje.toISOString().split('T')[0];
}

/**
 * Obter data máxima (30 dias a partir de hoje)
 * @returns {string} - Data em formato YYYY-MM-DD
 */
function obterDataMaxima() {
    const dataMax = new Date();
    dataMax.setDate(dataMax.getDate() + 30);
    return dataMax.toISOString().split('T')[0];
}

/**
 * Verificar se dia é útil (seg-sab)
 * @param {string} data - Data em formato YYYY-MM-DD
 * @returns {boolean} - True se for dia útil
 */
function ehDiaUtil(data) {
    const date = new Date(data + 'T00:00:00');
    const dia = date.getDay();
    return dia !== 0; // 0 = domingo
}

/**
 * Obter nome do dia da semana
 * @param {string} data - Data em formato YYYY-MM-DD
 * @returns {string} - Nome do dia
 */
function obterNomeDia(data) {
    const date = new Date(data + 'T00:00:00');
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[date.getDay()];
}

/**
 * Verificar disponibilidade de horário
 * @param {string} data - Data em formato YYYY-MM-DD
 * @param {string} hora - Hora em formato HH:MM
 * @param {number} barbeiroId - ID do barbeiro
 * @returns {Promise<boolean>} - True se disponível
 */
async function verificarDisponibilidade(data, hora, barbeiroId) {
    try {
        const response = await fetch(
            `${API_URL}/agendamentos/verificar?data=${data}&hora=${hora}&barbeiro_id=${barbeiroId}`
        );
        if (response.ok) {
            const resultado = await response.json();
            return resultado.disponivel;
        }
        return true; // Se erro, assume disponível
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return true;
    }
}

/**
 * Obter horários ocupados de um barbeiro em uma data
 * @param {string} data - Data em formato YYYY-MM-DD
 * @param {number} barbeiroId - ID do barbeiro
 * @returns {Promise<Array>} - Lista de horários ocupados
 */
async function obterHorariosOcupados(data, barbeiroId) {
    try {
        const response = await fetch(
            `${API_URL}/agendamentos/ocupados?data=${data}&barbeiro_id=${barbeiroId}`
        );
        if (response.ok) {
            const resultado = await response.json();
            return resultado.horarios || [];
        }
        return [];
    } catch (error) {
        console.error('Erro ao obter horários ocupados:', error);
        return [];
    }
}

/**
 * Enviar email de confirmação
 * @param {string} email - Email do cliente
 * @param {object} agendamento - Dados do agendamento
 * @returns {Promise}
 */
async function enviarEmailConfirmacao(email, agendamento) {
    try {
        const response = await fetch(`${API_URL}/email/confirmacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                agendamento: agendamento
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return false;
    }
}

/**
 * Cancelar agendamento
 * @param {number} agendamentoId - ID do agendamento
 * @returns {Promise<boolean>}
 */
async function cancelarAgendamento(agendamentoId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Agendamento cancelado com sucesso!');
            return true;
        } else {
            alert('Erro ao cancelar agendamento!');
            return false;
        }
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
}

/**
 * Editar agendamento
 * @param {number} agendamentoId - ID do agendamento
 * @param {object} novosDados - Novos dados
 * @returns {Promise}
 */
async function editarAgendamento(agendamentoId, novosDados) {
    try {
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novosDados)
        });
        
        if (response.ok) {
            alert('Agendamento atualizado com sucesso!');
            return true;
        } else {
            alert('Erro ao atualizar agendamento!');
            return false;
        }
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
}

/**
 * Obter agendamentos por email
 * @param {string} email - Email do cliente
 * @returns {Promise<Array>}
 */
async function obterAgendamentosPorEmail(email) {
    try {
        const response = await fetch(`${API_URL}/agendamentos?email=${email}`);
        
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Erro ao obter agendamentos:', error);
        return [];
    }
}

/**
 * Formatar data para exibição
 * @param {string} data - Data em formato YYYY-MM-DD
 * @returns {string} - Data formatada
 */
function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calcular tempo de espera estimado
 * @param {Array} agendamentos - Lista de agendamentos
 * @returns {number} - Minutos estimados de espera
 */
function calcularTempoEspera(agendamentos) {
    return agendamentos.length * 5; // 5 minutos por agendamento
}

/**
 * Gerar relatório de agendamentos
 * @param {Array} agendamentos - Lista de agendamentos
 * @returns {object} - Relatório com estatísticas
 */
function gerarRelatorio(agendamentos) {
    const relatorio = {
        totalAgendamentos: agendamentos.length,
        servicos: {},
        barbeiros: {},
        dias: {}
    };

    agendamentos.forEach(agendamento => {
        // Contar por serviço
        if (!relatorio.servicos[agendamento.servico.nome]) {
            relatorio.servicos[agendamento.servico.nome] = 0;
        }
        relatorio.servicos[agendamento.servico.nome]++;

        // Contar por barbeiro
        if (!relatorio.barbeiros[agendamento.barbeiro.nome]) {
            relatorio.barbeiros[agendamento.barbeiro.nome] = 0;
        }
        relatorio.barbeiros[agendamento.barbeiro.nome]++;

        // Contar por dia
        const dia = formatarData(agendamento.data);
        if (!relatorio.dias[dia]) {
            relatorio.dias[dia] = 0;
        }
        relatorio.dias[dia]++;
    });

    return relatorio;
}

// ===== EVENT LISTENERS ADICIONAIS =====

// Validar input de telefone em tempo real
document.addEventListener('input', (e) => {
    if (e.target.id === 'telefone') {
        const isValid = validarTelefone(e.target.value);
        if (isValid) {
            e.target.style.borderColor = 'var(--success-color)';
        } else {
            e.target.style.borderColor = 'var(--danger-color)';
        }
    }

    if (e.target.id === 'email') {
        const isValid = validarEmail(e.target.value);
        if (isValid) {
            e.target.style.borderColor = 'var(--success-color)';
        } else if (e.target.value.length > 0) {
            e.target.style.borderColor = 'var(--danger-color)';
        } else {
            e.target.style.borderColor = 'var(--secondary-color)';
        }
    }
});

// Configurar data mínima no input de data
document.addEventListener('DOMContentLoaded', () => {
    const dataInput = document.getElementById('data');
    if (dataInput) {
        dataInput.min = obterDataMinima();
        dataInput.max = obterDataMaxima();
    }
});

