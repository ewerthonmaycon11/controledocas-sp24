// Atualização em tempo real (Polling a cada 3 segundos)
document.addEventListener('DOMContentLoaded', () => {
    // Event listener global para os botões de ocupar e liberar
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-btn-occupy')) {
            const numero = e.target.getAttribute('data-numero');
            const placaInput = document.getElementById(`input-placa-${numero}`);
            const destInput = document.getElementById(`input-dest-${numero}`);
            
            const placa = placaInput ? placaInput.value.trim() : '';
            const destino = destInput ? destInput.value.trim() : '';

            if (!placa) {
                alert('Por favor, informe a placa do veículo.');
                placaInput.focus();
                return;
            }

            if (!destino) {
                alert('Por favor, informe o destino.');
                destInput.focus();
                return;
            }

            alterarStatusComDados(numero, 'OCUPADA', placa, destino);
        }
        if (e.target.classList.contains('action-btn-release')) {
            const numero = e.target.getAttribute('data-numero');
            alterarStatusComDados(numero, 'LIVRE', '', '');
        }
    });

    setInterval(fetchDocasStatus, 3000);
});

async function alterarStatusComDados(numeroDoca, novoStatus, placa, destino) {
    try {
        const response = await fetch(`/api/doca/${numeroDoca}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, placa: placa, destino: destino })
        });

        if (response.ok) {
            fetchDocasStatus();
        } else {
            alert('Erro ao atualizar a doca. Verifique sua sessão de admin.');
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
    }
}

async function fetchDocasStatus() {
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

            const light = document.getElementById(`light-${doca.numero}`);
            if (light) light.className = `status-light ${doca.status.toLowerCase()}`;

            const statusText = document.getElementById(`status-text-${doca.numero}`);
            if (statusText) statusText.innerText = doca.status;

            // Renderiza corretamente a Placa E o Destino para nunca mais sumirem
            const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
            if (plateDisplay) {
                if (doca.status === 'OCUPADA') {
                    plateDisplay.innerHTML = `
                        <span class="plate-label">PLACA:</span>
                        <span class="plate-value">${doca.placa ? doca.placa : 'NÃO INFORMADA'}</span>
                        <span class="destination-label" style="margin-top: 6px;">DESTINO:</span>
                        <span class="destination-value">${doca.destino ? doca.destino : 'NÃO INFORMADO'}</span>
                    `;
                } else {
                    plateDisplay.innerHTML = `<span class="plate-placeholder">LIVRE PARA CARGAMENTO</span>`;
                }
            }

            // Atualiza os controles do admin caso o card mude de estado via outro usuário
            const adminControls = card.querySelector('.admin-controls');
            if (adminControls) {
                if (doca.status === 'OCUPADA' && adminControls.innerHTML.indexOf('btn-release') === -1) {
                    adminControls.innerHTML = `
                        <button type="button" class="action-btn-release" data-numero="${doca.numero}">Liberar Doca</button>
                    `;
                } else if (doca.status === 'LIVRE' && adminControls.innerHTML.indexOf('action-btn-occupy') === -1) {
                    adminControls.innerHTML = `
                        <div class="plate-input-group">
                            <input type="text" id="input-placa-${doca.numero}" class="input-plate" placeholder="PLACA (ABC-1D23)" maxlength="10">
                            <input type="text" id="input-dest-${doca.numero}" class="input-plate" placeholder="DESTINO (EX: FILIAL SP)" maxlength="50">
                            <button type="button" class="action-btn-occupy" data-numero="${doca.numero}">Ocupar Doca</button>
                        </div>
                    `;
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
