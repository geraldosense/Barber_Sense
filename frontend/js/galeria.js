// ===== GALERIA PÚBLICA DE CORTES (dados da base de dados) =====

async function carregarGaleria() {
    const grid = document.getElementById('galeriaGrid');
    if (!grid) return;

    try {
        const res = await fetch(`${window.API_URL}/galeria`);
        if (res.ok) {
            const cortes = await res.json();
            renderizarGaleria(cortes);
        } else {
            grid.innerHTML = '<p class="galeria-empty">Galeria indisponível no momento.</p>';
        }
    } catch {
        grid.innerHTML = '<p class="galeria-empty">Ligue o backend para ver a galeria.</p>';
    }
}

function renderizarGaleria(cortes) {
    const grid = document.getElementById('galeriaGrid');
    if (!grid) return;

    if (!cortes.length) {
        grid.innerHTML = '<p class="galeria-empty">Ainda não há cortes publicados na galeria.</p>';
        return;
    }

    grid.innerHTML = cortes.map(c => `
        <div class="galeria-card">
            <div class="galeria-card-img">
                ${c.imagem_url
                    ? `<img src="${escGaleria(c.imagem_url)}" alt="${escGaleria(c.titulo)}" onerror="this.parentElement.innerHTML='<span class=\\'galeria-placeholder\\'>✂️</span>'">`
                    : '<span class="galeria-placeholder">✂️</span>'}
                <span class="galeria-tipo">${escGaleria(c.tipo_corte)}</span>
            </div>
            <div class="galeria-card-body">
                <h3>${escGaleria(c.titulo)}</h3>
                <p class="galeria-barbeiro"><i class="fas fa-cut"></i> ${escGaleria(c.barbeiro_nome || 'Sense Barbearia')}</p>
                ${c.descricao ? `<p class="galeria-desc">${escGaleria(c.descricao)}</p>` : ''}
                <div class="galeria-meta">
                    ${c.duracao ? `<span><i class="fas fa-clock"></i> ${escGaleria(c.duracao)}</span>` : ''}
                    ${c.video_url ? `<a href="${escGaleria(c.video_url)}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> Ver vídeo</a>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function escGaleria(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', carregarGaleria);
