let pasteTargetDoca = null;
let pasteTargetModo = 'input';

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

    // Eventos do Modal de Colar Texto
    const pasteOverlay = document.getElementById('paste-modal-overlay');
    const pasteTextarea = document.getElementById('paste-modal-textarea');
    const applyPasteBtn = document.getElementById('apply-paste-modal');
    const closePasteBtn = document.getElementById('close-paste-modal');
    const cancelPasteBtn = document.getElementById('cancel-paste-modal');

    if (closePasteBtn) closePasteBtn.addEventListener('click', fecharModalColar);
    if (cancelPasteBtn) cancelPasteBtn.addEventListener('click', fecharModalColar);
    if (pasteOverlay) {
        pasteOverlay.addEventListener('click', (e) => {
            if (e.target === pasteOverlay) fecharModalColar();
        });
    }

    if (applyPasteBtn && pasteTextarea) {
        applyPasteBtn.addEventListener('click', () => {
            const texto = pasteTextarea.value;
            const numeroAlvo = pasteTargetDoca || (pasteOverlay && pasteOverlay.getAttribute('data-doca')) || (applyPasteBtn && applyPasteBtn.getAttribute('data-doca'));
            const modoAlvo = pasteTargetModo || (pasteOverlay && pasteOverlay.getAttribute('data-modo')) || 'input';

            if (!texto.trim()) {
                alert('Cole o texto antes de preencher os campos.');
                pasteTextarea.focus();
                return;
            }
            aplicarTextoNosCampos(numeroAlvo, modoAlvo, texto);
            fecharModalColar();
        });
    }

    // Preenche automaticamente assim que o usuário cola (Ctrl+V / Colar) dentro da caixa
    if (pasteTextarea) {
        pasteTextarea.addEventListener('paste', () => {
            setTimeout(() => {
                const texto = pasteTextarea.value;
                const numeroAlvo = pasteTargetDoca || (pasteOverlay && pasteOverlay.getAttribute('data-doca'));
                const modoAlvo = pasteTargetModo || (pasteOverlay && pasteOverlay.getAttribute('data-modo')) || 'input';
                if (texto.trim() && numeroAlvo) {
                    aplicarTextoNosCampos(numeroAlvo, modoAlvo, texto);
                    fecharModalColar();
                }
            }, 50);
        });
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

    // Eventos para Botões de Ação, Edição, Salvamento, WhatsApp e Colar
    document.body.addEventListener('click', async (e) => {
        const shareBtn = e.target.closest('.btn-share-whatsapp');
        if (shareBtn) {
            const dados = {
                doca: shareBtn.dataset.doca,
                nome: shareBtn.dataset.nome,
                regiao: shareBtn.dataset.regiao,
                placa: shareBtn.dataset.placa,
                chegada: shareBtn.dataset.chegada,
                eta: shareBtn.dataset.eta,
                cpt: shareBtn.dataset.cpt
            };

            const texto = formatarMensagemWhatsApp(dados);
            const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        const pasteBtn = e.target.closest('.btn-paste-data');
        if (pasteBtn) {
            const card = pasteBtn.closest('.dock-card');
            const numero = pasteBtn.getAttribute('data-numero') || (card && card.getAttribute('data-numero'));
            const modo = pasteBtn.getAttribute('data-modo') || 'input';

            if (!numero) return;

            if (modo === 'edit') {
                abrirFormularioEdicao(numero);
            } else {
                const form = document.getElementById(`form-${numero}`);
                if (form) form.style.display = 'flex';
            }

            abrirModalColar(numero, modo);
            return;
        }

        if (e.target.classList.contains('action-btn-cancel') || e.target.classList.contains('btn-edit-cancel')) {
            fetchDocasStatus(); // Restaura o card original
        }

        if (e.target.classList.contains('btn-edit-open')) {
            const card = e.target.closest('.dock-card');
            const numero = e.target.getAttribute('data-numero') || (card && card.getAttribute('data-numero'));
            if (numero) abrirFormularioEdicao(numero);
        }

        if (e.target.classList.contains('action-btn-occupy')) {
            const card = e.target.closest('.dock-card');
            const numero = e.target.getAttribute('data-numero') || (card && card.getAttribute('data-numero'));
            if (numero) enviarDadosDoca(numero, 'OCUPADA', 'status');
        }

        if (e.target.classList.contains('btn-edit-save')) {
            const card = e.target.closest('.dock-card');
            const numero = e.target.getAttribute('data-numero') || (card && card.getAttribute('data-numero'));
            if (numero) enviarDadosDoca(numero, 'OCUPADA', 'editar');
        }

        if (e.target.classList.contains('action-btn-release')) {
            const card = e.target.closest('.dock-card');
            const numero = e.target.getAttribute('data-numero') || (card && card.getAttribute('data-numero'));
            if (numero) alterarStatusComDados(numero, 'LIVRE', {});
        }
    });

    setInterval(fetchDocasStatus, 3000);

    setInterval(() => {
        atualizarCronometrosCPT();
        atualizarCronometrosChegada();
    }, 1000);
});

async function abrirModalColar(numero, modo) {
    if (!numero) return;

    pasteTargetDoca = String(numero);
    pasteTargetModo = modo || 'input';

    const overlay = document.getElementById('paste-modal-overlay');
    const textarea = document.getElementById('paste-modal-textarea');
    const docaNumSpan = document.getElementById('paste-modal-doca-num');
    const applyPasteBtn = document.getElementById('apply-paste-modal');

    if (overlay) {
        overlay.setAttribute('data-doca', pasteTargetDoca);
        overlay.setAttribute('data-modo', pasteTargetModo);
        overlay.style.display = 'flex';
    }
    if (applyPasteBtn) {
        applyPasteBtn.setAttribute('data-doca', pasteTargetDoca);
        applyPasteBtn.setAttribute('data-modo', pasteTargetModo);
    }
    if (docaNumSpan) docaNumSpan.innerText = pasteTargetDoca;
    if (textarea) textarea.value = '';

    // Tenta ler automaticamente da área de transferência se o navegador permitir e houver texto
    if (navigator.clipboard && navigator.clipboard.readText) {
        try {
            const textoCopiado = await navigator.clipboard.readText();
            if (textoCopiado && textoCopiado.trim() && textarea) {
                textarea.value = textoCopiado;
                aplicarTextoNosCampos(pasteTargetDoca, pasteTargetModo, textoCopiado);
            }
        } catch (err) {
            // Mantém o modal aberto para colagem manual
        }
    }

    if (textarea) {
        setTimeout(() => textarea.focus(), 50);
    }
}

function fecharModalColar() {
    const overlay = document.getElementById('paste-modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

function interpretarTextoColado(texto) {
    const resultado = {
        nome: '',
        regiao: '',
        placa: '',
        chegada: '',
        eta: '',
        cptStr: '',
        cptDatetime: ''
    };

    const linhas = texto.split(/\r?\n/);

    linhas.forEach((linhaOriginal) => {
        // Remove emojis e símbolos comuns no início da linha
        const linha = linhaOriginal
            .replace(/^[\s•\-\*⚪🚚📦🔴🟢🟡⏳⏱️]+/gu, '')
            .trim();

        if (!linha) return;

        const matchNome = linha.match(/^(?:NOME|MOTORISTA)\s*[:\-]\s*(.+)$/i);
        if (matchNome) {
            resultado.nome = matchNome[1].trim();
            return;
        }

        const matchRegiao = linha.match(/^(?:REGI[ÃA]O|DESTINO)\s*[:\-]\s*(.+)$/i);
        if (matchRegiao) {
            resultado.regiao = matchRegiao[1].trim();
            return;
        }

        const matchPlaca = linha.match(/^PLACA\s*[:\-]\s*(.+)$/i);
        if (matchPlaca) {
            resultado.placa = matchPlaca[1].trim().toUpperCase();
            return;
        }

        const matchChegada = linha.match(/^CHEGADA\s*[:\-]\s*(.+)$/i);
        if (matchChegada) {
            resultado.chegada = matchChegada[1].trim();
            return;
        }

        const matchEta = linha.match(/^ETA\s*[:\-]\s*(.+)$/i);
        if (matchEta) {
            resultado.eta = matchEta[1].trim();
            return;
        }

        const matchCpt = linha.match(/^CPT\s*[:\-]\s*(.+)$/i);
        if (matchCpt) {
            const valorCpt = matchCpt[1].trim();
            resultado.cptStr = valorCpt;

            // Tenta converter para YYYY-MM-DDTHH:MM para preencher input datetime-local
            const hoje = new Date();
            const anoAtual = hoje.getFullYear();

            // Formato DD/MM/AAAA HH:MM ou DD/MM HH:MM
            const matchDataHora = valorCpt.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})/);
            if (matchDataHora) {
                const dia = matchDataHora[1].padStart(2, '0');
                const mes = matchDataHora[2].padStart(2, '0');
                const ano = matchDataHora[3]
                    ? (matchDataHora[3].length === 2 ? `20${matchDataHora[3]}` : matchDataHora[3])
                    : String(anoAtual);
                const hora = matchDataHora[4].padStart(2, '0');
                const min = matchDataHora[5].padStart(2, '0');
                resultado.cptDatetime = `${ano}-${mes}-${dia}T${hora}:${min}`;
                return;
            }

            // Formato apenas HH:MM (assume data de hoje)
            const matchSoHora = valorCpt.match(/^(\d{1,2}):(\d{2})$/);
            if (matchSoHora) {
                const dia = String(hoje.getDate()).padStart(2, '0');
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const hora = matchSoHora[1].padStart(2, '0');
                const min = matchSoHora[2].padStart(2, '0');
                resultado.cptDatetime = `${anoAtual}-${mes}-${dia}T${hora}:${min}`;
            }
        }
    });

    return resultado;
}

function aplicarTextoNosCampos(numero, modo, texto) {
    if (!numero) return;
    const dados = interpretarTextoColado(texto);
    const prefix = modo === 'edit' ? 'edit' : 'input';

    const nomeEl = document.getElementById(`${prefix}-nome-${numero}`);
    const regiaoEl = document.getElementById(`${prefix}-regiao-${numero}`);
    const placaEl = document.getElementById(`${prefix}-placa-${numero}`);
    const chegadaEl = document.getElementById(`${prefix}-chegada-${numero}`);
    const etaEl = document.getElementById(`${prefix}-eta-${numero}`);
    const cptEl = document.getElementById(`${prefix}-cpt-${numero}`);

    if (nomeEl && dados.nome) nomeEl.value = dados.nome;
    if (regiaoEl && dados.regiao) regiaoEl.value = dados.regiao;
    if (placaEl && dados.placa) placaEl.value = dados.placa;
    if (chegadaEl && dados.chegada) chegadaEl.value = dados.chegada;
    if (etaEl && dados.eta) etaEl.value = dados.eta;
    if (cptEl && dados.cptDatetime) cptEl.value = dados.cptDatetime;
}

function gerarHtmlAcoesOcupada(doca) {
    const nome = doca.nome || 'NÃO INFORMADO';
    const regiao = doca.regiao || 'NÃO INFORMADA';
    const placa = doca.placa || 'NÃO INFORMADA';
    const chegada = doca.chegada || 'NÃO INFORMADA';
    const eta = doca.eta || 'NÃO INFORMADO';
    const cpt = doca.cpt || 'NÃO INFORMADO';

    return `
        <div class="dock-ocupada-actions">
            <button type="button" class="btn-action action-btn-release" data-numero="${doca.numero}">Liberar Doca</button>
            <div class="dock-bottom-mini-actions">
                <button
                    type="button"
                    class="btn-share-whatsapp"
                    title="Compartilhar no WhatsApp"
                    aria-label="Compartilhar Doca ${doca.numero} no WhatsApp"
                    data-doca="${doca.numero}"
                    data-nome="${nome}"
                    data-regiao="${regiao}"
                    data-placa="${placa}"
                    data-chegada="${chegada}"
                    data-eta="${eta}"
                    data-cpt="${cpt}"
                >
                    📤 WhatsApp
                </button>
                <button
                    type="button"
                    class="btn-paste-data"
                    title="Colar texto copiado para preencher campos"
                    aria-label="Colar dados na Doca ${doca.numero}"
                    data-numero="${doca.numero}"
                    data-modo="edit"
                >
                    📋 Colar
                </button>
            </div>
        </div>
    `;
}

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
            <div style="display: flex; justify-content: flex-start; margin-bottom: 4px;">
                <button type="button" class="btn-paste-data" data-numero="${numero}" data-modo="edit" title="Colar texto copiado">
                    📋 Colar Texto
                </button>
            </div>
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
    if (!numero) return;
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
    if (!numeroDoca) return;
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
            adminControls.innerHTML = gerarHtmlAcoesOcupada(doca);
        } else {
            adminControls.innerHTML = `
                <div class="plate-input-group form-atribuicao" id="form-${doca.numero}" style="display: none; margin-top: 8px;">
                    <div style="display: flex; justify-content: flex-start; margin-bottom: 4px;">
                        <button type="button" class="btn-paste-data" data-numero="${doca.numero}" data-modo="input" title="Colar texto copiado">
                            📋 Colar Texto
                        </button>
                    </div>
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

                const shareBtn = card.querySelector('.btn-share-whatsapp');
                if (shareBtn && doca.status === 'OCUPADA') {
                    shareBtn.dataset.doca = doca.numero;
                    shareBtn.dataset.nome = doca.nome || 'NÃO INFORMADO';
                    shareBtn.dataset.regiao = doca.regiao || 'NÃO INFORMADA';
                    shareBtn.dataset.placa = doca.placa || 'NÃO INFORMADA';
                    shareBtn.dataset.chegada = doca.chegada || 'NÃO INFORMADA';
                    shareBtn.dataset.eta = doca.eta || 'NÃO INFORMADO';
                    shareBtn.dataset.cpt = doca.cpt || 'NÃO INFORMADO';
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

function formatarMensagemWhatsApp(dados) {
    const linhas = [
        'Pátio Outbound Carregamento:',
        '',
        `⚪ NOME: ${dados.nome || 'NÃO INFORMADO'}`,
        `⚪ REGIÃO: ${dados.regiao || 'NÃO INFORMADA'}`,
        `⚪ PLACA: ${dados.placa || 'NÃO INFORMADA'}`,
        `🚚 DOCA: ${dados.doca || ''}`,
        `⚪ CHEGADA: ${dados.chegada || 'NÃO INFORMADA'}`,
        `⚪ ETA: ${dados.eta || 'NÃO INFORMADO'}`,
        `⚪ CPT: ${dados.cpt || 'NÃO INFORMADO'}`
    ];
    return linhas.join('\n');
}
