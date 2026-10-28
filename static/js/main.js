// Atualização em tempo real e controle dinâmico do Pátio Docas
document.addEventListener('DOMContentLoaded', () => {
    // Event listener global para os cliques nos cards das docas
    document.body.addEventListener('click', (e) => {
        // Se clicou em um input ou botão dentro do formulário, deixa interagir normalmente
        if (e.target.closest('input') || e.target.closest('button')) {
            return;
        }

        const card = e.target.closest('.dock-card');
        if (!card) return;

        const status = card.getAttribute('data-status');
        const numero = card.getAttribute('data-numero');

        // 1. Se a doca estiver LIVRE, abre/fecha o formulário de atribuição perfeitamente
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
                        <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'false');
                }
            }
            return;
        }
    });

    // Eventos específicos para Botões de Ação (Atribuir, Cancelar, Liberar)
    document.body.addEventListener('click', (e) => {
        // Botão Fechar / Cancelar (X)
        if (e.target.classList.contains('action-btn-cancel')) {
            const numero = e.target.getAttribute('data-numero');
            const form = document.getElementById(`form-${numero}`);
            if (form) form.style.display = 'none';
        }

        // Botão de Atribuir Veículo
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

        // Botão de Liberar Doca
        if (e.target.classList.contains('action-btn-release')) {
            const numero = e.target.getAttribute('data-numero');
            alterarStatusComDados(numero, 'LIVRE', {});
        }
    });

    // Polling a cada 3 segundos em segundo plano
    setInterval(fetchDocasStatus, 3000);
});

async function alterarStatusComDados(numeroDoca, novoStatus, dados) {
    try {
        const response = await fetch(`/api/doca/${numeroDoca}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, ...dados })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Erro ao atualizar a doca. Verifique sua sessão de login.');
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
    }
}

async function fetchDocasStatus() {
    // Pausa o polling se houver algum formulário aberto para não apagar o que o operador está digitando
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
                            <small style="color: var(--accent-blue); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                        `;
                    } else {
                        plateDisplay.innerHTML = `
                            <span class="plate-label">PLACA:</span>
                            <span class="plate-value">${doca.placa || 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                            <span class="destination-value">${doca.regiao || 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                            <span class="destination-value">${doca.cpt || 'NÃO INFORMADO'}</span>
                            <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes</small>
                        `;
                    }
                } else {
                    plateDisplay.innerHTML = `<span class="plate-placeholder">LIVRE PARA CARGAMENTO</span>`;
                    plateDisplay.removeAttribute('data-detalhes');
                }
            }

            const timeEl = document.getElementById(`time-${doca.numero}`);
            if (timeEl) timeEl.innerText = doca.ultima_atualizacao;
        });

        const livresEl = document.getElementById('stat-livres');
        const ocupadasEl = document.getElementById('stat-ocupadas');
        if (livresEl) livresEl.innerText = livres;
        if (ocupadasEl) ocupadasEl.innerText = ocupadas;

    } catch (err) {
        console.error('Erro no polling:', err);
    }
}
