document.addEventListener('DOMContentLoaded', () => {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => sidebar.classList.add('active'));
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    // Clique nos cards para alternar visualização ou abrir edição
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('input') || e.target.closest('button') || e.target.closest('form')) {
            return;
        }

        const card = e.target.closest('.dock-card');
        if (!card) return;

        const status = card.getAttribute('data-status');
        const numero = card.getAttribute('data-numero');

        if (status === 'LIVRE') {
            const form = document.getElementById(`form-${numero}`);
            if (form) {
                const isHidden = form.style.display === 'none' || form.style.display === '';
                form.style.display = isHidden ? 'flex' : 'none';
            }
            return;
        }

        if (status === 'OCUPADA') {
            const plateDisplay = document.getElementById(`plate-display-${numero}`);
            if (plateDisplay) {
                const modoDetalhado = plateDisplay.getAttribute('data-detalhes') === 'true';
                
                const placa = plateDisplay.getAttribute('data-placa') || '';
                const regiao = plateDisplay.getAttribute('data-regiao') || '';
                const cpt = plateDisplay.getAttribute('data-cpt') || '';
                const cptDatetime = plateDisplay.getAttribute('data-cptdatetime') || '';
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
                        <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${numero}" data-cptdatetime="${cptDatetime}">
                            ⏳ CPT: Calculando...
                        </div>
                        <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${numero}" data-chegada="${chegada}">
                            ⏱️ TEMPO NO PÁTIO: 00:00:00
                        </div>
                        <div style="display: flex; gap: 4px; margin-top: 8px;">
                            <button type="button" class="btn-action btn-edit-open" data-numero="${numero}" style="background: var(--accent-blue); color: #0f172a; flex: 1; font-size: 0.75rem;">✏️ Editar Dados</button>
                        </div>
                        <small style="color: var(--accent-blue); margin-top: 4px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'true');
                } else {
                    plateDisplay.innerHTML = `
                        <span class="plate-label">PLACA:</span>
                        <span class="plate-value">${placa || 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                        <span class="destination-value">${regiao || 'NÃO INFORMADO'}</span>
                        <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                        <span class="destination-value">${cpt || 'NÃO INFORMADO'}</span>
                        <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${numero}" data-cptdatetime="${cptDatetime}">
                            ⏳ CPT: Calculando...
                        </div>
                        <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${numero}" data-chegada="${chegada}">
                            ⏱️ TEMPO NO PÁTIO: 00:00:00
                        </div>
                        <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes / editar</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'false');
                }
            }
            return;
        }
    });

    // Eventos para Botões de Ação, Edição e Salvamento
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-btn-cancel') || e.target.classList.contains('btn-edit-cancel')) {
            const numero = e.target.getAttribute('data-numero');
            fetchDocasStatus(); // Restaura o card original
        }

        if (e.target.classList.contains('btn-edit-open')) {
            const numero = e.target.getAttribute('data-numero');
            abrirFormularioEdicao(numero);
        }

        if (e.target.classList.contains('action-btn-occupy')) {
            const numero = e.target.getAttribute('data-numero');
            enviarDadosDoca(numero, 'OCUPADA', 'status');
        }

        if (e.target.classList.contains('btn-edit-save')) {
            const numero = e.target.getAttribute('data-numero');
            enviarDadosDoca(numero, 'OCUPADA', 'editar');
        }

        if (e.target.classList.contains('action-btn-release')) {
            const numero = e.target.getAttribute('data-numero');
            alterarStatusComDados(numero, 'LIVRE', {});
        }
    });

    setInterval(fetchDocasStatus, 3000);

    setInterval(() => {
        atualizarCronometrosCPT();
        atualizarCronometrosChegada();
    }, 1000);
});

function abrirFormularioEdicao(numero) {
    const plateDisplay = document.getElementById(`plate-display-${numero}`);
    if (!plateDisplay) return;

    const placa = plateDisplay.getAttribute('data-placa') || '';
    const regiao = plateDisplay.getAttribute('data-regiao') || '';
    const nome = plateDisplay.getAttribute('data-nome') || '';
    const chegada = plateDisplay.getAttribute('data-chegada') || '';
    const eta = plateDisplay.getAttribute('data-eta') || '';
    const cptDatetime = plateDisplay.getAttribute('data-cptdatetime') || '';

    plateDisplay.innerHTML = `
        <div class="plate-input-group" style="text-align: left;">
            <label style="font-size: 0.65rem; color: var(--text-muted);">EDITAR NOME:</label>
            <input type="text" id="edit-nome-${numero}" class="input-plate" value="${nome}" maxlength="100" style="font-size: 0.8rem; padding: 6px;">
            <label style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">EDITAR REGIÃO:</label>
            <input type="text" id="edit-regiao-${numero}" class="input-plate" value="${regiao}" maxlength="100" style="font-size: 0.8rem; padding: 6px;">
            <label style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">EDITAR PLACA:</label>
            <input type="text" id="edit-placa-${numero}" class="input-plate" value="${placa}" maxlength="10" style="font-size: 0.8rem; padding: 6px;">
            <label style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">EDITAR CHEGADA:</label>
            <input type="text" id="edit-chegada-${numero}" class="input-plate" value="${chegada}" maxlength="20" style="font-size: 0.8rem; padding: 6px;">
            <label style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">EDITAR ETA:</label>
            <input type="text" id="edit-eta-${numero}" class="input-plate" value="${eta}" maxlength="20" style="font-size: 0.8rem; padding: 6px;">
            <label style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">EDITAR CPT:</label>
            <input type="datetime-local" id="edit-cpt-${numero}" class="input-plate" value="${cptDatetime}" style="color-scheme: dark; font-size: 0.75rem; padding: 6px;">
            <div style="display: flex; gap: 4px; margin-top: 8px;">
                <button type="button" class="btn-action btn-edit-save" data-numero="${numero}" style="background: var(--green-neon); color: #090d16; flex: 1;">Salvar</button>
                <button type="button" class="btn-action btn-edit-cancel" data-numero="${numero}" style="background: var(--red-neon); color: #fff; width: 40px;">X</button>
            </div>
        </div>
    `;
}

function enviarDadosDoca(numero, statusDoca, acaoTipo) {
    const prefix = acaoTipo === 'editar' ? 'edit' : 'input';
    
    const nomeInput = document.getElementById(`${prefix}-nome-${numero}`);
    const regiaoInput = document.getElementById(`${prefix}-regiao-${numero}`);
    const placaInput = document.getElementById(`${prefix}-placa-${numero}`);
    const chegadaInput = document.getElementById(`${prefix}-chegada-${numero}`);
    const etaInput = document.getElementById(`${prefix}-eta-${numero}`);
    const cptInput = document.getElementById(`${prefix}-cpt-${numero}`);

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const regiao = regiaoInput ? regiaoInput.value.trim() : '';
    const placa = placaInput ? placaInput.value.trim() : '';
    const chegada = chegadaInput ? chegadaInput.value.trim() : '';
    const eta = etaInput ? etaInput.value.trim() : '';
    
    let cptStr = '';
    let cptDatetime = '';

    if (cptInput && cptInput.value) {
        cptDatetime = cptInput.value;
        const dataObj = new Date(cptDatetime);
        if (!isNaN(dataObj)) {
            const dia = String(dataObj.getDate()).padStart(2, '0');
            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const hora = String(dataObj.getHours()).padStart(2, '0');
            const min = String(dataObj.getMinutes()).padStart(2, '0');
            cptStr = `${dia}/${mes} ${hora}:${min}`;
        }
    }

    if (!placa) {
        alert('Por favor, informe a placa do veículo.');
        if (placaInput) placaInput.focus();
        return;
    }

    alterarStatusComDados(numero, statusDoca, { nome, regiao, placa, chegada, eta, cpt: cptStr, cpt_datetime: cptDatetime, acao: acaoTipo });
}

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
            alert('Erro ao atualizar a doca.');
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
    }
}

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
        plateDisplay.setAttribute('data-cptdatetime', doca.cpt_datetime || '');
        plateDisplay.setAttribute('data-nome', doca.nome || '');
        plateDisplay.setAttribute('data-chegada', doca.chegada || '');
        plateDisplay.setAttribute('data-eta', doca.eta || '');

        const modoDetalhado = plateDisplay.getAttribute('data-detalhes') === 'true';

        if (doca.status === 'OCUPADA') {
            if (modoDetalhado) {
                plateDisplay.innerHTML = `
                    <span class="plate-label">NOME:</span>
                    <span class="plate-value" style="font-size: 0.95rem; padding: 4px 8px;">${doca.nome || 'NÃO INFORMADO'}</span>
                    <span class="plate-label" style="margin-top: 4px;">PLACA:</span>
                    <span class="plate-value">${doca.placa || 'NÃO INFORMADA'}</span>
                    <span class="destination-label" style="margin-top: 4px;">REGIÃO:</span>
                    <span class="destination-value">${doca.regiao || 'NÃO INFORMADA'}</span>
                    <span class="destination-label" style="margin-top: 4px;">CHEGADA:</span>
                    <span class="destination-value">${doca.chegada || 'NÃO INFORMADA'}</span>
                    <span class="destination-label" style="margin-top: 4px;">ETA:</span>
                    <span class="destination-value">${doca.eta || 'NÃO INFORMADA'}</span>
                    <span class="destination-label" style="margin-top: 4px;">CPT:</span>
                    <span class="destination-value">${doca.cpt || 'NÃO INFORMADO'}</span>
                    <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${doca.numero}" data-cptdatetime="${doca.cpt_datetime || ''}">
                        ⏳ CPT: Calculando...
                    </div>
                    <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${doca.numero}" data-chegada="${doca.chegada || ''}">
                        ⏱️ TEMPO NO PÁTIO: 00:00:00
                    </div>
                    <div style="display: flex; gap: 4px; margin-top: 8px;">
                        <button type="button" class="btn-action btn-edit-open" data-numero="${doca.numero}" style="background: var(--accent-blue); color: #0f172a; flex: 1; font-size: 0.75rem;">✏️ Editar Dados</button>
                    </div>
                    <small style="color: var(--accent-blue); margin-top: 4px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                `;
            } else {
                plateDisplay.innerHTML = `
                    <span class="plate-label">PLACA:</span>
                    <span class="plate-value">${doca.placa || 'NÃO INFORMADA'}</span>
                    <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                    <span class="destination-value">${doca.regiao || 'NÃO INFORMADO'}</span>
                    <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                    <span class="destination-value">${doca.cpt || 'NÃO INFORMADO'}</span>
                    <div style="margin-top: 6px; font-size: 0.7rem; font-weight: 700; color: #f43f5e;" id="cpt-timer-${doca.numero}" data-cptdatetime="${doca.cpt_datetime || ''}">
                        ⏳ CPT: Calculando...
                    </div>
                    <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${doca.numero}" data-chegada="${doca.chegada || ''}">
                        ⏱️ TEMPO NO PÁTIO: 00:00:00
                    </div>
                    <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes / editar</small>
                `;
            }
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
                    <input type="text" id="input-chegada-${doca.numero}" class="input-plate" placeholder="CHEGADA (Ex: 22:00)" maxlength="20" style="margin-top: 6px;">
                    <input type="text" id="input-eta-${doca.numero}" class="input-plate" placeholder="ETA" maxlength="20" style="margin-top: 6px;">
                    <div style="margin-top: 6px;">
                        <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 2px;">DATA E HORA CPT:</label>
                        <input type="datetime-local" id="input-cpt-${doca.numero}" class="input-plate" style="color-scheme: dark; font-size: 0.8rem;">
                    </div>
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

    // Se houver texto na barra de busca ativa, não faz polling automático para não sobrescrever a listagem filtrada
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('q') && urlParams.get('q').trim() !== '') return;

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
            if (card) {
                const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
                if (plateDisplay) {
                    plateDisplay.setAttribute('data-placa', doca.placa || '');
                    plateDisplay.setAttribute('data-regiao', doca.regiao || '');
                    plateDisplay.setAttribute('data-cpt', doca.cpt || '');
                    plateDisplay.setAttribute('data-cptdatetime', doca.cpt_datetime || '');
                    plateDisplay.setAttribute('data-nome', doca.nome || '');
                    plateDisplay.setAttribute('data-chegada', doca.chegada || '');
                    plateDisplay.setAttribute('data-eta', doca.eta || '');
                }

                if (card.getAttribute('data-status') !== doca.status) {
                    atualizarCardNaTela(doca);
                }
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

function atualizarCronometrosCPT() {
    const timers = document.querySelectorAll('[id^="cpt-timer-"]');
    
    timers.forEach(timerEl => {
        const cptDatetimeStr = timerEl.getAttribute('data-cptdatetime');
        if (!cptDatetimeStr || cptDatetimeStr.trim() === '') {
            timerEl.innerText = '⏳ CPT: Não Informado';
            return;
        }

        const agora = new Date();
        const alvo = new Date(cptDatetimeStr);

        if (isNaN(alvo.getTime())) {
            timerEl.innerText = '⏳ CPT: Inválido';
            return;
        }

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

function atualizarCronometrosChegada() {
    const timers = document.querySelectorAll('[id^="chegada-timer-"]');
    
    timers.forEach(timerEl => {
        const chegadaStr = timerEl.getAttribute('data-chegada');
        if (!chegadaStr || chegadaStr.trim() === '' || chegadaStr.includes('NÃO')) {
            timerEl.innerText = '⏱️ TEMPO NO PÁTIO: Não Informado';
            return;
        }

        const match = chegadaStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) {
            timerEl.innerText = `⏱️ TEMPO: ${chegadaStr}`;
            return;
        }

        const agora = new Date();
        const chegadaHora = parseInt(match[1], 10);
        const chegadaMinuto = parseInt(match[2], 10);
        const chegadaSegundo = match[3] ? parseInt(match[3], 10) : 0;

        const inicio = new Date();
        inicio.setHours(chegadaHora, chegadaMinuto, chegadaSegundo, 0);

        let diffMs = agora - inicio;
        if (diffMs < 0) {
            diffMs = 0; 
        }

        const horas = Math.floor(diffMs / (1000 * 60 * 60));
        const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

        const hFormatado = String(horas).padStart(2, '0');
        const mFormatado = String(minutos).padStart(2, '0');
        const sFormatado = String(segundos).padStart(2, '0');

        timerEl.innerHTML = `<span style="color: #10b981; font-weight: 900; letter-spacing: 1px;">⏱️ TEMPO NO PÁTIO: ${hFormatado}:${mFormatado}:${sFormatado}</span>`;
    });
}
