// ===== GALERIA PÚBLICA DE CORTES (mesma API no telemóvel e no PC) =====

async function carregarGaleria() {
    const grid = document.getElementById('galeriaGrid');
    if (!grid) return;

    const fetchFn = typeof window.senseFetch === 'function' ? window.senseFetch : fetch;
    const api = window.API_URL;

    if (!api) {
        grid.innerHTML = '<p class="galeria-empty">Galeria indisponível.</p>';
        return;
    }

    try {
        const res = await fetchFn(`${api}/galeria`, { cache: 'no-store' });
        if (!res.ok) {
            grid.innerHTML = '<p class="galeria-empty">Galeria indisponível no momento.</p>';
            return;
        }
        const cortes = await res.json();
        renderizarGaleria(Array.isArray(cortes) ? cortes : []);
    } catch {
        grid.innerHTML = '<p class="galeria-empty">A ligar ao servidor… a galeria aparece em breve.</p>';
    }
}

function renderizarGaleria(cortes) {
    const grid = document.getElementById('galeriaGrid');
    if (!grid) return;

    if (!cortes.length) {
        const msg = typeof t === 'function' ? t('gallery.empty') : 'Ainda não há cortes publicados.';
        grid.innerHTML = `<p class="galeria-empty">${msg}</p>`;
        return;
    }

    grid.innerHTML = cortes.map(c => {
        const imgSrc = c.imagem_url
            ? (typeof resolveMediaUrl === 'function' ? resolveMediaUrl(c.imagem_url) : c.imagem_url)
            : '';
        return `
        <article class="galeria-card">
            <div class="galeria-card-img">
                ${imgSrc
                    ? `<img src="${escGaleria(imgSrc)}" alt="${escGaleria(c.titulo)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'galeria-placeholder\\'>✂️</span>'">`
                    : '<span class="galeria-placeholder">✂️</span>'}
                <span class="galeria-tipo">${escGaleria(c.tipo_corte)}</span>
            </div>
            <div class="galeria-card-body">
                <h3>${escGaleria(c.titulo)}</h3>
                <p class="galeria-barbeiro"><i class="fas fa-cut"></i> ${escGaleria(c.barbeiro_nome || 'Sense Barbershop')}</p>
                ${c.preco ? `<p class="galeria-preco">${Number(c.preco).toFixed(2)}€</p>` : ''}
                ${c.descricao ? `<p class="galeria-desc">${escGaleria(c.descricao)}</p>` : ''}
                <div class="galeria-meta">
                    ${c.duracao ? `<span><i class="fas fa-clock"></i> ${escGaleria(c.duracao)}</span>` : ''}
                    ${c.video_url ? `<a href="${escGaleria(c.video_url)}" target="_blank" rel="noopener"><i class="fas fa-play-circle"></i> Ver vídeo</a>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

function escGaleria(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', carregarGaleria);
document.addEventListener('sense:langchange', carregarGaleria);
document.addEventListener('sense:sync', carregarGaleria);
document.addEventListener('sense:servidor-online', carregarGaleria);

window.carregarGaleria = carregarGaleria;
