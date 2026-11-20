let pasteTargetDoca = null;
let pasteTargetModo = 'input';
let checklistTargetDoca = null;
let audioCtxCpt = null;
const alertasCptDisparados = new Set();
const alertasChecklist30MinDisparados = new Set();

function desbloquearAudioAlerta() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtxCpt) {
        audioCtxCpt = new AudioContextClass();
    }
    if (audioCtxCpt.state === 'suspended') {
        audioCtxCpt.resume().catch(() => {});
    }
}

document.addEventListener('click', desbloquearAudioAlerta, { passive: true });
document.addEventListener('keydown', desbloquearAudioAlerta, { passive: true });

function tocarSomAlertaAlto() {
    desbloquearAudioAlerta();
    if (!audioCtxCpt) return;

    const agora = audioCtxCpt.currentTime;
    const pulsos = [0, 0.28, 0.56];

    pulsos.forEach((offset) => {
        const osc = audioCtxCpt.createOscillator();
        const gain = audioCtxCpt.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(980, agora + offset);
        osc.frequency.exponentialRampToValueAtTime(1320, agora + offset + 0.14);

        gain.gain.setValueAtTime(0.001, agora + offset);
        gain.gain.exponentialRampToValueAtTime(0.85, agora + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, agora + offset + 0.22);

        osc.connect(gain);
        gain.connect(audioCtxCpt.destination);

        osc.start(agora + offset);
        osc.stop(agora + offset + 0.23);
    });
}

function mostrarAlertaVisualCpt(mensagem) {
    let container = document.getElementById('cpt-alert-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cpt-alert-container';
        container.style.cssText = `
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
            width: calc(100% - 36px);
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: linear-gradient(135deg, rgba(127, 29, 29, 0.96), rgba(15, 23, 42, 0.98));
        border: 1px solid #f43f5e;
        box-shadow: 0 0 24px rgba(244, 63, 94, 0.55), 0 12px 28px rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 14px 16px;
        border-radius: 12px;
        font-family: Inter, sans-serif;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    `;

    toast.innerHTML = `
        <div style="font-size: 0.85rem; font-weight: 800; line-height: 1.35;">
            🚨 ${mensagem}
        </div>
        <button type="button" style="
            background: rgba(255,255,255,0.14);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 8px;
            padding: 4px 9px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
        ">OK</button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 12000);
}

function notificarCptExpirado(numero, cptDatetimeStr) {
    const chave = `${numero}-${cptDatetimeStr}`;
    if (alertasCptDisparados.has(chave)) return;
    alertasCptDisparados.add(chave);

    tocarSomAlertaAlto();
    mostrarAlertaVisualCpt(`Doca ${numero} CPT expirado, libere a doca.`);
}

function notificarChecklistSemFazer30Min(numero, placa, chegadaStr) {
    const chave = `chk30-${numero}-${placa || ''}-${chegadaStr || ''}`;
    if (alertasChecklist30MinDisparados.has(chave)) return;
    alertasChecklist30MinDisparados.add(chave);

    tocarSomAlertaAlto();
    const refVeiculo = placa ? ` (${placa})` : '';
    mostrarAlertaVisualCpt(`Doca ${numero}${refVeiculo} está há mais de 30 min no pátio e NÃO está feito o check list!`);
}

function limparAlertasChecklistDoca(numero) {
    for (const chave of Array.from(alertasChecklist30MinDisparados)) {
        if (chave.startsWith(`chk30-${numero}-`)) {
            alertasChecklist30MinDisparados.delete(chave);
        }
    }
}

function garantirModalChecklist() {
    let overlay = document.getElementById('checklist-modal-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'checklist-modal-overlay';
    overlay.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.78);
        backdrop-filter: blur(6px);
        z-index: 99998;
        align-items: center;
        justify-content: center;
        padding: 16px;
    `;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(160deg, #162238 0%, #0b1220 100%);
            border: 1px solid rgba(56, 189, 248, 0.35);
            border-radius: 16px;
            padding: 20px;
            max-width: 420px;
            width: 100%;
            color: #f8fafc;
            font-family: Inter, sans-serif;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #38bdf8;">
                    CHECK LIST — DOCA <span id="checklist-modal-doca-num"></span>
                </h3>
                <button type="button" id="close-checklist-modal" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.15rem;
                    font-weight: 800;
                    cursor: pointer;
                ">✕</button>
            </div>

            <div id="checklist-modal-veiculo-info" style="
                font-size: 0.78rem;
                color: #cbd5e1;
                background: rgba(15, 23, 42, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-radius: 10px;
                padding: 10px 12px;
                margin-bottom: 14px;
                line-height: 1.45;
            "></div>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 12px; font-size: 0.85rem; font-weight: 700;">
                <input type="checkbox" id="checklist-modal-feito-checkbox" style="width: 18px; height: 18px; accent-color: #10b981; cursor: pointer;">
                <span>Check list feito</span>
            </label>

            <label style="display: block; font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">
                OBSERVAÇÃO (OPCIONAL):
            </label>
            <input type="text" id="checklist-modal-obs-input" placeholder="Ex: Lacre conferido, carga ok..." maxlength="200" style="
                width: 100%;
                box-sizing: border-box;
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: rgba(9, 13, 22, 0.85);
                color: #f8fafc;
                font-size: 0.8rem;
                margin-bottom: 16px;
            ">

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" id="cancel-checklist-modal" style="
                    padding: 8px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(30, 41, 59, 0.8);
                    color: #cbd5e1;
                    font-size: 0.78rem;
                    font-weight: 700;
                    cursor: pointer;
                ">Cancelar</button>
                <button type="button" id="save-checklist-modal" style="
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: none;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #06130e;
                    font-size: 0.78rem;
                    font-weight: 800;
                    cursor: pointer;
                ">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModalChecklist();
    });
    document.getElementById('close-checklist-modal').addEventListener('click', fecharModalChecklist);
    document.getElementById('cancel-checklist-modal').addEventListener('click', fecharModalChecklist);
    document.getElementById('save-checklist-modal').addEventListener('click', salvarChecklistModal);

    return overlay;
}

function abrirModalChecklist(numero) {
    if (!numero) return;
    checklistTargetDoca = String(numero);

    const overlay = garantirModalChecklist();
    const plateDisplay = document.getElementById(`plate-display-${numero}`);
    const checklistBtn = document.querySelector(`.btn-checklist-box[data-doca="${numero}"]`);

    const feitoAtual = checklistBtn
        ? checklistBtn.getAttribute('data-checklist-feito') === 'true'
        : (plateDisplay && plateDisplay.getAttribute('data-checklist-feito') === 'true');

    const obsAtual = checklistBtn
        ? (checklistBtn.getAttribute('data-checklist-obs') || '')
        : (plateDisplay ? (plateDisplay.getAttribute('data-checklist-obs') || '') : '');

    const placa = plateDisplay ? (plateDisplay.getAttribute('data-placa') || 'NÃO INFORMADA') : 'NÃO INFORMADA';
    const nome = plateDisplay ? (plateDisplay.getAttribute('data-nome') || 'NÃO INFORMADO') : 'NÃO INFORMADO';
    const regiao = plateDisplay ? (plateDisplay.getAttribute('data-regiao') || 'NÃO INFORMADA') : 'NÃO INFORMADA';

    document.getElementById('checklist-modal-doca-num').innerText = checklistTargetDoca;
    document.getElementById('checklist-modal-veiculo-info').innerHTML = `
        <strong>PLACA:</strong> ${placa} &nbsp;|&nbsp; <strong>NOME:</strong> ${nome}<br>
        <strong>REGIÃO:</strong> ${regiao}
    `;
    document.getElementById('checklist-modal-feito-checkbox').checked = Boolean(feitoAtual);
    document.getElementById('checklist-modal-obs-input').value = obsAtual;

    overlay.style.display = 'flex';
}

function fecharModalChecklist() {
    const overlay = document.getElementById('checklist-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    checklistTargetDoca = null;
}

async function salvarChecklistModal() {
    if (!checklistTargetDoca) return;
    const numero = checklistTargetDoca;
    const feito = document.getElementById('checklist-modal-feito-checkbox').checked;
    const obs = document.getElementById('checklist-modal-obs-input').value.trim();

    try {
        const response = await fetch(`/api/doca/${numero}/checklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                checklist_feito: feito,
                checklist_obs: obs
            })
        });

        if (response.ok) {
            const resultado = await response.json();
            if (resultado.success && resultado.doca) {
                if (resultado.doca.checklist_feito) {
                    limparAlertasChecklistDoca(numero);
                }
                atualizarCardNaTela(resultado.doca);
                fecharModalChecklist();
                fetchDocasStatus();
                return;
            }
        }
        alert('Erro ao salvar o check list.');
    } catch (err) {
        console.error('Erro ao salvar check list:', err);
        alert('Erro de conexão ao salvar o check list.');
    }
}

function gerarQuadradoChecklistHtml(doca) {
    const feito = Boolean(doca.checklist_feito);
    const obs = doca.checklist_obs || '';
    const usuario = doca.checklist_usuario || '';
    const dataHora = doca.checklist_data_hora || '';
    const icone = feito ? '✅' : '❌';
    const titulo = feito
        ? `Check list feito${usuario ? ' por ' + usuario : ''}${dataHora ? ' (' + dataHora + ')' : ''} — Clique para alterar`
        : 'Check list NÃO feito — Clique para marcar check list feito';

    return `
        <button
            type="button"
            class="btn-checklist-box"
            title="${titulo}"
            aria-label="Check list da Doca ${doca.numero}"
            data-doca="${doca.numero}"
            data-checklist-feito="${feito ? 'true' : 'false'}"
            data-checklist-obs="${obs}"
            data-checklist-usuario="${usuario}"
            data-checklist-data-hora="${dataHora}"
            style="
                width: 28px;
                height: 28px;
                min-width: 28px;
                border-radius: 6px;
                border: 1px solid ${feito ? 'rgba(16, 185, 129, 0.7)' : 'rgba(244, 63, 94, 0.7)'};
                background: ${feito ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)'};
                color: ${feito ? '#34d399' : '#fb7185'};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0.85rem;
                font-weight: 800;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            "
        >${icone}</button>
    `;
}

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
            }, 80);
        });
    }

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
                const checklistFeito = plateDisplay.getAttribute('data-checklist-feito') === 'true';

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
                        <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${numero}" data-chegada="${chegada}" data-placa="${placa}" data-checklist-feito="${checklistFeito ? 'true' : 'false'}">
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
                        <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${numero}" data-chegada="${chegada}" data-placa="${placa}" data-checklist-feito="${checklistFeito ? 'true' : 'false'}">
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

    document.body.addEventListener('click', async (e) => {
        const checklistBtn = e.target.closest('.btn-checklist-box');
        if (checklistBtn) {
            const card = checklistBtn.closest('.dock-card');
            const numero = checklistBtn.getAttribute('data-doca') || (card && card.getAttribute('data-numero'));
            if (numero) abrirModalChecklist(numero);
            return;
        }

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
            fetchDocasStatus();
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

function extrairCampoPorRotulo(textoLimpo, padraoRotulo, todosRotulosRegex) {
    const regex = new RegExp(
        `(?:^|[\\r\\n\\s•\\-\\*\\|]+)(?:${padraoRotulo})\\s*[:\\-]?\\s*(.+?)(?=(?:[\\r\\n]+|(?:[\\s•\\-\\*\\|]+)?(?:${todosRotulosRegex})\\s*[:\\-]?)|$)`,
        'i'
    );
    const match = textoLimpo.match(regex);
    if (!match || !match[1]) return '';

    return match[1]
        .replace(/^[\s•\-\*⚪🚚📦🔴🟢🟡⏳⏱️]+/gu, '')
        .replace(/[\s•\-\*⚪🚚📦🔴🟢🟡⏳⏱️]+$/gu, '')
        .trim();
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

    if (!texto || !texto.trim()) return resultado;

    const textoNormalizado = texto
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}⚪🚚📦🔴🟢🟡⏳⏱️]/gu, ' ')
        .replace(/[ \t]+/g, ' ');

    const todosRotulos = 'NOME|MOTORISTA|REGI[ÃA]O|REGIAO|DESTINO|PLACA|DOCA|CHEGADA|ETA|CPT';

    const nomeVal = extrairCampoPorRotulo(textoNormalizado, 'NOME|MOTORISTA', todosRotulos);
    if (nomeVal) resultado.nome = nomeVal;

    const regiaoVal = extrairCampoPorRotulo(textoNormalizado, 'REGI[ÃA]O|REGIAO|DESTINO', todosRotulos);
    if (regiaoVal) resultado.regiao = regiaoVal;

    const placaVal = extrairCampoPorRotulo(textoNormalizado, 'PLACA', todosRotulos);
    if (placaVal) resultado.placa = placaVal.toUpperCase();

    const chegadaVal = extrairCampoPorRotulo(textoNormalizado, 'CHEGADA', todosRotulos);
    if (chegadaVal) resultado.chegada = chegadaVal;

    const etaVal = extrairCampoPorRotulo(textoNormalizado, 'ETA', todosRotulos);
    if (etaVal) resultado.eta = etaVal;

    const cptVal = extrairCampoPorRotulo(textoNormalizado, 'CPT', todosRotulos);
    if (cptVal) {
        resultado.cptStr = cptVal;

        const hoje = new Date();
        const anoAtual = hoje.getFullYear();

        const matchDataHora = cptVal.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})/);
        if (matchDataHora) {
            const dia = matchDataHora[1].padStart(2, '0');
            const mes = matchDataHora[2].padStart(2, '0');
            const ano = matchDataHora[3]
                ? (matchDataHora[3].length === 2 ? `20${matchDataHora[3]}` : matchDataHora[3])
                : String(anoAtual);
            const hora = matchDataHora[4].padStart(2, '0');
            const min = matchDataHora[5].padStart(2, '0');
            resultado.cptDatetime = `${ano}-${mes}-${dia}T${hora}:${min}`;
        } else {
            const matchSoHora = cptVal.match(/(\d{1,2}):(\d{2})/);
            if (matchSoHora) {
                const dia = String(hoje.getDate()).padStart(2, '0');
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const hora = matchSoHora[1].padStart(2, '0');
                const min = matchSoHora[2].padStart(2, '0');
                resultado.cptDatetime = `${anoAtual}-${mes}-${dia}T${hora}:${min}`;
            }
        }
    }

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
    const eta = doca.eta || 'NÃO INFORMADA';
    const cpt = doca.cpt || 'NÃO INFORMADO';

    return `
        <div class="dock-ocupada-actions">
            <button type="button" class="btn-action action-btn-release" data-numero="${doca.numero}">Liberar Doca</button>
            <div class="dock-bottom-mini-actions" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
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
                ${gerarQuadradoChecklistHtml(doca)}
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
                if (novoStatus === 'LIVRE' || dados.acao === 'status') {
                    limparAlertasChecklistDoca(numeroDoca);
                }
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
    const statusLower = String(doca.status || 'LIVRE').toLowerCase();
    const card = document.getElementById(`doca-card-${doca.numero}`);
    if (!card) return;

    card.className = `dock-card ${statusLower}`;
    card.setAttribute('data-status', doca.status);

    const lightEl = document.getElementById(`light-${doca.numero}`);
    if (lightEl) {
        lightEl.className = `status-light ${statusLower}`;
    }

    const statusTextEl = document.getElementById(`status-text-${doca.numero}`);
    if (statusTextEl) {
        statusTextEl.innerText = doca.status;
    }

    const checklistFeito = Boolean(doca.checklist_feito);
    const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
    if (plateDisplay) {
        plateDisplay.setAttribute('data-placa', doca.placa || '');
        plateDisplay.setAttribute('data-regiao', doca.regiao || '');
        plateDisplay.setAttribute('data-cpt', doca.cpt || '');
        plateDisplay.setAttribute('data-cptdatetime', doca.cpt_datetime || '');
        plateDisplay.setAttribute('data-nome', doca.nome || '');
        plateDisplay.setAttribute('data-chegada', doca.chegada || '');
        plateDisplay.setAttribute('data-eta', doca.eta || '');
        plateDisplay.setAttribute('data-checklist-feito', checklistFeito ? 'true' : 'false');
        plateDisplay.setAttribute('data-checklist-obs', doca.checklist_obs || '');
        plateDisplay.setAttribute('data-checklist-usuario', doca.checklist_usuario || '');
        plateDisplay.setAttribute('data-checklist-data-hora', doca.checklist_data_hora || '');

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
                    <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${doca.numero}" data-chegada="${doca.chegada || ''}" data-placa="${doca.placa || ''}" data-checklist-feito="${checklistFeito ? 'true' : 'false'}">
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
                    <div style="margin-top: 4px; font-size: 0.7rem; font-weight: 700; color: #10b981;" id="chegada-timer-${doca.numero}" data-chegada="${doca.chegada || ''}" data-placa="${doca.placa || ''}" data-checklist-feito="${checklistFeito ? 'true' : 'false'}">
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
                const checklistFeito = Boolean(doca.checklist_feito);
                const plateDisplay = document.getElementById(`plate-display-${doca.numero}`);
                if (plateDisplay) {
                    plateDisplay.setAttribute('data-placa', doca.placa || '');
                    plateDisplay.setAttribute('data-regiao', doca.regiao || '');
                    plateDisplay.setAttribute('data-cpt', doca.cpt || '');
                    plateDisplay.setAttribute('data-cptdatetime', doca.cpt_datetime || '');
                    plateDisplay.setAttribute('data-nome', doca.nome || '');
                    plateDisplay.setAttribute('data-chegada', doca.chegada || '');
                    plateDisplay.setAttribute('data-eta', doca.eta || '');
                    plateDisplay.setAttribute('data-checklist-feito', checklistFeito ? 'true' : 'false');
                    plateDisplay.setAttribute('data-checklist-obs', doca.checklist_obs || '');
                    plateDisplay.setAttribute('data-checklist-usuario', doca.checklist_usuario || '');
                    plateDisplay.setAttribute('data-checklist-data-hora', doca.checklist_data_hora || '');
                }

                const chegadaTimer = document.getElementById(`chegada-timer-${doca.numero}`);
                if (chegadaTimer) {
                    chegadaTimer.setAttribute('data-placa', doca.placa || '');
                    chegadaTimer.setAttribute('data-checklist-feito', checklistFeito ? 'true' : 'false');
                }

                const shareBtn = card.querySelector('.btn-share-whatsapp');
                if (shareBtn && doca.status === 'OCUPADA') {
                    shareBtn.dataset.doca = doca.numero;
                    shareBtn.dataset.nome = doca.nome || 'NÃO INFORMADO';
                    shareBtn.dataset.regiao = doca.regiao || 'NÃO INFORMADA';
                    shareBtn.dataset.placa = doca.placa || 'NÃO INFORMADA';
                    shareBtn.dataset.chegada = doca.chegada || 'NÃO INFORMADA';
                    shareBtn.dataset.eta = doca.eta || 'NÃO INFORMADA';
                    shareBtn.dataset.cpt = doca.cpt || 'NÃO INFORMADO';
                }

                const checklistBtn = card.querySelector('.btn-checklist-box');
                if (checklistBtn && doca.status === 'OCUPADA') {
                    const icone = checklistFeito ? '✅' : '❌';
                    checklistBtn.innerHTML = icone;
                    checklistBtn.setAttribute('data-checklist-feito', checklistFeito ? 'true' : 'false');
                    checklistBtn.setAttribute('data-checklist-obs', doca.checklist_obs || '');
                    checklistBtn.setAttribute('data-checklist-usuario', doca.checklist_usuario || '');
                    checklistBtn.setAttribute('data-checklist-data-hora', doca.checklist_data_hora || '');
                    checklistBtn.style.borderColor = checklistFeito ? 'rgba(16, 185, 129, 0.7)' : 'rgba(244, 63, 94, 0.7)';
                    checklistBtn.style.background = checklistFeito ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';
                    checklistBtn.style.color = checklistFeito ? '#34d399' : '#fb7185';
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
        const numero = timerEl.id.replace('cpt-timer-', '');
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
            notificarCptExpirado(numero, cptDatetimeStr);
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
        const numero = timerEl.id.replace('chegada-timer-', '');
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

        const trintaMinutosMs = 30 * 60 * 1000;
        const checklistFeito = timerEl.getAttribute('data-checklist-feito') === 'true';
        const placa = timerEl.getAttribute('data-placa') || '';

        if (diffMs >= trintaMinutosMs && !checklistFeito) {
            notificarChecklistSemFazer30Min(numero, placa, chegadaStr);
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
