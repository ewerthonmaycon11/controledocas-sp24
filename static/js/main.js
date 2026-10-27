// Atualização em tempo real e controle dinâmico do Pátio Docas
document.addEventListener('DOMContentLoaded', () => {
    // Event listener global para os cliques nos cards das docas
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.dock-card');
        if (!card) return;

        const status = card.getAttribute('data-status');
        const numero = card.getAttribute('data-numero');

        // Se a doca estiver LIVRE, abre/fecha o formulário de atribuição
        if (status === 'LIVRE' && !e.target.closest('input') && !e.target.closest('button')) {
            const form = document.getElementById(`form-${numero}`);
            if (form) {
                form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'flex' : 'none';
            }
            return;
        }

        // Se a doca estiver OCUPADA e clicar no card (fora de botões), alterna entre visualização resumida e detalhada
        if (status === 'OCUPADA' && !e.target.closest('button') && !e.target.closest('input')) {
            const plateDisplay = document.getElementById(`plate-display-${numero}`);
            if (plateDisplay) {
                const modoDetalhado = plateDisplay.getAttribute('data-detalhes') === 'true';
                
                // Pega os dados armazenados ou nos atributos do elemento
                const placa = plateDisplay.getAttribute('data-placa') || '';
                const regiao = plateDisplay.getAttribute('data-regiao') || '';
                const cpt = plateDisplay.getAttribute('data-cpt') || '';
                const nome = plateDisplay.getAttribute('data-nome') || '';
                const chegada = plateDisplay.getAttribute('data-chegada') || '';
                const eta = plateDisplay.getAttribute('data-eta') || '';

                if (!modoDetalhado) {
                    // Mostra TODAS as informações completas
                    plateDisplay.innerHTML = `
                        <span class="plate-label">NOME:</span>
                        <span class="plate-value" style="font-size: 0.95rem; padding: 4px 8px;">${nome ? nome : 'NÃO INFORMADO'}</span>
                        <span class="plate-label" style="margin-top: 4px;">PLACA:</span>
                        <span class="plate-value">${placa ? placa : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">REGIÃO:</span>
                        <span class="destination-value">${regiao ? regiao : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">CHEGADA:</span>
                        <span class="destination-value">${chegada ? chegada : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">ETA:</span>
                        <span class="destination-value">${eta ? eta : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 4px;">CPT:</span>
                        <span class="destination-value">${cpt ? cpt : 'NÃO INFORMADO'}</span>
                        <small style="color: var(--accent-blue); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'true');
                } else {
                    // Volta para as 3 informações padrão
                    plateDisplay.innerHTML = `
                        <span class="plate-label">PLACA:</span>
                        <span class="plate-value">${placa ? placa : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                        <span class="destination-value">${regiao ? regiao : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                        <span class="destination-value">${cpt ? cpt : 'NÃO INFORMADO'}</span>
                        <small style="color: var(--text-muted); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para ver detalhes</small>
                    `;
                    plateDisplay.setAttribute('data-detalhes', 'false');
                }
            }
            return;
        }

        // Botão de Atribuir Veículo
        if (e.target.classList.contains('action-btn-occupy')) {
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
            alterarStatusComDados(numero, 'LIVRE', {});
        }
    });

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
            alert('Erro ao atualizar a doca. Verifique sua sessão de admin.');
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
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
            if (!card) return;

            card.className = `dock-card ${doca.status.toLowerCase()}`;
            card.setAttribute('data-status', doca.status);

            const light = document.getElementById(`light-${doca.numero}`);
            if (light) light.className = `status-light ${doca.status.toLowerCase()}`;

            const statusText = document.getElementById(`status-text-${doca.numero}`);
            if (statusText) statusText.innerText = doca.status;

            const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
            if (plateDisplay) {
                // Guarda os dados brutos nos atributos para o clique alternar perfeitamente
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
                            <span class="plate-value" style="font-size: 0.95rem; padding: 4px 8px;">${doca.nome ? doca.nome : 'NÃO INFORMADO'}</span>
                            <span class="plate-label" style="margin-top: 4px;">PLACA:</span>
                            <span class="plate-value">${doca.placa ? doca.placa : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 4px;">REGIÃO:</span>
                            <span class="destination-value">${doca.regiao ? doca.regiao : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 4px;">CHEGADA:</span>
                            <span class="destination-value">${doca.chegada ? doca.chegada : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 4px;">ETA:</span>
                            <span class="destination-value">${doca.eta ? doca.eta : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 4px;">CPT:</span>
                            <span class="destination-value">${doca.cpt ? doca.cpt : 'NÃO INFORMADO'}</span>
                            <small style="color: var(--accent-blue); margin-top: 6px; font-size: 0.65rem; text-align: center; cursor: pointer;">🔍 Clique para recolher</small>
                        `;
                    } else {
                        plateDisplay.innerHTML = `
                            <span class="plate-label">PLACA:</span>
                            <span class="plate-value">${doca.placa ? doca.placa : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 6px;">REGIÃO:</span>
                            <span class="destination-value">${doca.regiao ? doca.regiao : 'NÃO INFORMADA'}</span>
                            <span class="destination-label" style="margin-top: 6px;">CPT:</span>
                            <span class="destination-value">${doca.cpt ? doca.cpt : 'NÃO INFORMADO'}</span>
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
