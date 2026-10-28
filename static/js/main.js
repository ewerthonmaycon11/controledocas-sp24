// Atualização em tempo real e controle dinâmico do Pátio Docas
document.addEventListener('DOMContentLoaded', () => {
    // Event listener global para os cliques nos cards das docas
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('input') || e.target.closest('button')) {
            return;
        }

        const card = e.target.closest('.dock-card');
        if (!card) return;

        const status = card.getAttribute('data-status');
        const numero = card.getAttribute('data-numero');

        // 1. Se a doca estiver LIVRE, abre/fecha o formulário de atribuição
        if (status === 'LIVRE') {
            const form = document.getElementById(`form-${numero}`);
            if (form) {
                const isHidden = form.style.display === 'none' || form.style.display === '';
                form.style.display = isHidden ? 'flex' : 'none';
            }
            return;
        }

        // 2. Se a doca estiver OCUPADA, alterna entre visualização resumida e detalhada
        if (status === 'OCUPADA') {
            const plateDisplay = document.getElementById(`plate-display-${numero}`);
            if (plateDisplay) {
                const modoDetalhado = plateDisplay.getAttribute('data-detalhes') === 'true';
                
                const placa = plateDisplay.getAttribute('data-placa') || '';
                const regiao = plateDisplay.getAttribute('data-regiao') || '';
                const cpt = plateDisplay.getAttribute('data-cpt') || '';
                const nome = plateDisplay.getAttribute('data-nome') || '';
                const chegada = plateDisplay.getAttribute('data-chegada') || '';
                const eta = plateDisplay.getAttribute('data-eta') || '';

                if (!modoDetalhado) {
                    plateDisplay.innerHTML = `
                        <span class="plate-label">NOME:</span>
                        <span class="plate-value" style="font-size: 0.95rem; padding: 4px 8px;">${nome || 'NÃO INFORMADO'}</span>
                        <span class="plate-label" style="margin-top: 4px;">PLACA:</span>
                        <span class="plate-value">${placa || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">REGIÃO:</span>
                        <span class="destination-value">${regiao || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">CHEGADA:</span>
                        <span class="destination-value">${chegada || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">ETA:</span>
                        <span class="destination-value">${eta || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">CPT:</span>
                        <span class="destination-value">${cpt || 'NÃO INFORMADO'}</span>
                        <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${numero}" data-cpt="${cpt}">
                            ⏳ CPT: Calculando...
                        </div>
                        <small style="color: var(--accent-blue); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'true');
                } else {
                    plateDisplay.innerHTML = `
                        <span class="plate-label">PLACA:</span>
                        <span class="plate-value">${placa || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                        <span class="destination-value">${regiao || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                        <span class="destination-value">${cpt || 'NÃO INFORMADO'}</span>
                        <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${numero}" data-cpt="${cpt}">
                            ⏳ CPT: Calculando...
                        </div>
                        <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'false');
                }
            }
            return;
        }
    });

    // Eventos específicos para Botões de Ação
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-btn-cancel')) {
            const numero = e.target.getAttribute('data-numero');
            const form = document.getElementById(`form-${numero}`);
            if (form) form.style.display = 'none';
        }

        if (e.target.classList.contains('action-btn-occupy')) {
            const numero = e.target.getAttribute('data-numero');
            
            const nomeInput = document.getElementById(`input-nome-${numero}`);
            const regiaoInput = document.getElementById(`input-regiao-${numero}`);
            const placaInput = document.getElementById(`input-placa-${numero}`);
            const chegadaInput = document.getElementById(`input-chegada-${numero}`);
            const etaInput = document.getElementById(`input-eta-${numero}`);
            const cptInput = document.getElementById(`input-cpt-${numero}`);

            const nome = nomeInput ? nomeInput.value.trim() : '';
            const regiao = regiaoInput ? regiaoInput.value.trim() : '';
            const placa = placaInput ? placaInput.value.trim() : '';
            const chegada = chegadaInput ? chegadaInput.value.trim() : '';
            const eta = etaInput ? etaInput.value.trim() : '';
            const cpt = cptInput ? cptInput.value.trim() : '';

            if (!placa) {
                alert('Por favor, informe a placa do veículo.');
                if (placaInput) placaInput.focus();
                return;
            }

            alterarStatusComDados(numero, 'OCUPADA', { nome, regiao, placa, chegada, eta, cpt });
        }

        if (e.target.classList.contains('action-btn-release')) {
            const numero = e.target.getAttribute('data-numero');
            alterarStatusComDados(numero, 'LIVRE', {});
        }
    });

    // Polling a cada 3 segundos para sincronizar status com o servidor
    setInterval(fetchDocasStatus, 3000);

    // Atualiza os cronômetros CPT a cada 1 segundo em tempo real
    setInterval(atualizarCronometrosCPT, 1000);
});

async function alterarStatusComDados(numeroDoca, novoStatus, dados) {
    try {
        const response = await fetch(`/api/doca/${numeroDoca}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, ...dados })
        });

        if (response.ok) {
            const resultado = await response.json();
            if (resultado.success) {
                atualizarCardNaTela(resultado.doca);
                fetchDocasStatus();
            }
        } else {
            alert('Erro ao atualizar a doca. Verifique sua sessão de login.');
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
    }
}

// Função atualizada para incluir o cronômetro também nas atualizações AJAX/Polling
function atualizarCardNaTela(doca) {
    const card = document.getElementById(`doca-card-${doca.numero}`);
    if (!card) return;

    card.className = `dock-card ${doca.status.toLowerCase()}`;
    card.setAttribute('data-status', doca.status);

    const light = document.getElementById(`light-${doca.numero}`);
    if (light) light.className = `status-light ${doca.status.toLowerCase()}`;

    const statusText = document.getElementById(`status-text-${doca.numero}`);
    if (statusText) statusText.innerText = doca.status;

    const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
    if (plateDisplay) {
        plateDisplay.setAttribute('data-placa', doca.placa || '');
        plateDisplay.setAttribute('data-regiao', doca.regiao || '');
        plateDisplay.setAttribute('data-cpt', doca.cpt || '');
        plateDisplay.setAttribute('data-nome', doca.nome || '');
        plateDisplay.setAttribute('data-chegada', doca.chegada || '');
        plateDisplay.setAttribute('data-eta', doca.eta || '');

        if (doca.status === 'OCUPADA') {
            plateDisplay.innerHTML = `
                <span class="plate-label">PLACA:</span>
                <span class="plate-value">${doca.placa || 'NÃO INFORMADA'}</span>
                <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                <span class="destination-value">${doca.regiao || 'NÃO INFORMADA'}</span>
                <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                <span class="destination-value">${doca.cpt || 'NÃO INFORMADO'}</span>
                <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${doca.numero}" data-cpt="${doca.cpt || ''}">
                    ⏳ CPT: Calculando...
                </div>
                <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes</small>
            `;
        } else {
            plateDisplay.innerHTML = `<span class="plate-placeholder">LIVRE PARA CARGAMENTO</span>`;
            plateDisplay.removeAttribute('data-detalhes');
        }
    }

    const adminControls = document.getElementById(`admin-controls-${doca.numero}`);
    const temPermissao = adminControls && (adminControls.innerHTML.trim() !== '');

    if (adminControls && temPermissao) {
        if (doca.status === 'OCUPADA') {
            adminControls.innerHTML = `<button type="button" class="btn-action action-btn-release" data-numero="${doca.numero}" style="margin-top: 8px;">Liberar Doca</button>`;
        } else {
            adminControls.innerHTML = `
                <div class="plate-input-group form-atribuicao" id="form-${doca.numero}" style="display: none; margin-top: 8px;">
                    <input type="text" id="input-nome-${doca.numero}" class="input-plate" placeholder="NOME" maxlength="100">
                    <input type="text" id="input-regiao-${doca.numero}" class="input-plate" placeholder="REGIÃO" maxlength="100" style="margin-top: 6px;">
                    <input type="text" id="input-placa-${doca.numero}" class="input-plate" placeholder="PLACA (ABC-1D23)" maxlength="10" style="margin-top: 6px;">
                    <input type="text" id="input-chegada-${doca.numero}" class="input-plate" placeholder="CHEGADA" maxlength="20" style="margin-top: 6px;">
                    <input type="text" id="input-eta-${doca.numero}" class="input-plate" placeholder="ETA" maxlength="20" style="margin-top: 6px;">
                    <input type="text" id="input-cpt-${doca.numero}" class="input-plate" placeholder="CPT" maxlength="50" style="margin-top: 6px;">
                    <div style="display: flex; gap: 4px; margin-top: 8px;">
                        <button type="button" class="btn-action action-btn-occupy" data-numero="${doca.numero}" style="flex: 1;">Atribuir</button>
                        <button type="button" class="btn-action action-btn-cancel" data-numero="${doca.numero}" style="background: var(--red-neon); color: #fff; width: 40px;">X</button>
                    </div>
                </div>
            `;
        }
    }

    const timeEl = document.getElementById(`time-${doca.numero}`);
    if (timeEl && doca.ultima_atualizacao) {
        timeEl.innerText = doca.ultima_atualizacao;
    }
}

async function fetchDocasStatus() {
    const formularioAberto = Array.from(document.querySelectorAll('.form-atribuicao')).some(f => f.style.display === 'flex');
    if (formularioAberto) return;

    try {
        const response = await fetch('/api/docas');
        if (!response.ok) return;

        const docas = await response.json();
        let livres = 0;
        let ocupadas = 0;

        docas.forEach(doca => {
            if (doca.status === 'LIVRE') livres++;
            if (doca.status === 'OCUPADA') ocupadas++;

            const card = document.getElementById(`doca-card-${doca.numero}`);
            if (card && card.getAttribute('data-status') !== doca.status) {
                atualizarCardNaTela(doca);
            }
        });

        const livresEl = document.getElementById('stat-livres');
        const ocupadasEl = document.getElementById('stat-ocupadas');
        if (livresEl) livresEl.innerText = livres;
        if (ocupadasEl) ocupadasEl.innerText = ocupadas;

    } catch (err) {
        console.error('Erro no polling:', err);
    }
}

// Função que calcula e atualiza o cronômetro decrescente para cada CPT informado
function atualizarCronometrosCPT() {
    const timers = document.querySelectorAll('[id^="cpt-timer-"]');
    
    timers.forEach(timerEl => {
        const cptStr = timerEl.getAttribute('data-cpt');
        if (!cptStr || cptStr.trim() === '' || cptStr.includes('NÃO')) {
            timerEl.innerText = '⏳ CPT: Não Informado';
            return;
        }

        const match = cptStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) {
            timerEl.innerText = `⏳ CPT: ${cptStr}`;
            return;
        }

        const agora = new Date();
        const cptHora = parseInt(match[1], 10);
        const cptMinuto = parseInt(match[2], 10);
        const cptSegundo = match[3] ? parseInt(match[3], 10) : 0;

        const alvo = new Date();
        alvo.setHours(cptHora, cptMinuto, cptSegundo, 0);

        const diffMs = alvo - agora;

        if (diffMs <= 0) {
            timerEl.innerHTML = `<span style="color: #f43f5e; font-weight: 800;">⚠️ CPT VENCIDO / EXPIRADO</span>`;
            return;
        }

        const horas = Math.floor(diffMs / (1000 * 60 * 60));
        const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

        const hFormatado = String(horas).padStart(2, '0');
        const mFormatado = String(minutos).padStart(2, '0');
        const sFormatado = String(segundos).padStart(2, '0');

        timerEl.innerHTML = `<span style="color: #f43f5e; font-weight: 900; letter-spacing: 1px;">⏳ RESTANTE: ${hFormatado}:${mFormatado}:${sFormatado}</span>`;
    });
}
