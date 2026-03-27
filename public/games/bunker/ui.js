// --- SVG ИКОНКИ ДЛЯ СПЕЦПРОТОКОЛОВ ---
const SVG_SWAP = `<svg viewBox="0 0 24 24"><path d="M12 2.75a9.25 9.25 0 1 0 4.737 17.197l-1.363-1.636A7.25 7.25 0 1 1 19.25 12h-2L20.5 8l3.25 4h-2.5a9.25 9.25 0 0 0-9.25-9.25z"/></svg>`;
const SVG_REVEAL = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const SVG_BIOHAZARD = `<svg viewBox="0 0 24 24"><path d="M12 2A10 10 0 1 0 22 12 10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm0-14a5.98 5.98 0 0 0-4.665 2.24l2.131 1.23A3.491 3.491 0 0 1 12 8.5a3.491 3.491 0 0 1 2.534.97l2.131-1.23A5.98 5.98 0 0 0 12 6zm-3.46 7.5a3.491 3.491 0 0 1-1.04-2.47H5A5.992 5.992 0 0 0 8.847 16l1.242-2.152a3.447 3.447 0 0 1-1.549-1.348zm6.92 0a3.447 3.447 0 0 1-1.549 1.348L15.153 16A5.992 5.992 0 0 0 19 11.03h-2.5a3.491 3.491 0 0 1-1.04 2.47zM12 10.5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z"/></svg>`;
const SVG_RAID = `<svg viewBox="0 0 24 24"><path d="M19.7 4.3a1 1 0 0 0-1.4 0L12 10.6 5.7 4.3a1 1 0 0 0-1.4 1.4l6.3 6.3-6.3 6.3a1 1 0 0 0 1.4 1.4l6.3-6.3 6.3 6.3a1 1 0 0 0 1.4-1.4l-6.3-6.3 6.3-6.3a1 1 0 0 0 0-1.4z"/></svg>`;
const SVG_SCAVENGE = `<svg viewBox="0 0 24 24"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm-1.5 9.5c-.83 0-1.5-.67-1.5-1.5S9.67 8.5 10.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5S12.67 8.5 13.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 20h-6v2h6v-2z"/></svg>`;
const SVG_REROLL = `<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;
const SVG_SHIELD = `<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`;
const SVG_HEAL = `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
const SVG_SABOTAGE = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
const SVG_SHUFFLE = `<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`;
const SVG_DICTATOR = `<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.83L18.17 19H5.83L12 5.83zM11 10h2v5h-2v-5zm0 6h2v2h-2v-2z"/></svg>`;
const SVG_LOCKDOWN = `<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;
const SVG_PUPPETEER = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>`;
const FALLBACK_AVATAR_UI = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

window.showHelp = function(title, desc) {
    document.getElementById('world-detail-title').innerText = title;
    document.getElementById('world-detail-desc').innerText = desc;
    document.getElementById('world-detail-modal').classList.add('active');
};

function showWorldDetail(type) {
    const data = globalState.world?.[type];
    if (!data) return;
    document.getElementById('world-detail-title').innerText = data.title;
    document.getElementById('world-detail-desc').innerText = data.description;
    document.getElementById('world-detail-modal').classList.add('active');
}

function closeWorldDetail() { 
    document.getElementById('world-detail-modal').classList.remove('active'); 
}

function toggleLogs() {
    const panel = document.getElementById('logs-panel');
    panel.classList.toggle('active');
    if(panel.classList.contains('active')) renderLogs();
}

function renderLogs() {
    const container = document.getElementById('logs-container');
    const logsObj = globalState.logs || {};
    const logsArr = Object.values(logsObj).sort((a,b) => (a.time > b.time ? 1 : -1));
    
    container.innerHTML = logsArr.map(log => 
        `<div class="log-entry log-${log.type}">
            <span class="text-muted" style="font-size:0.8rem; margin-right:8px;">[${log.time}]</span>
            ${log.text}
        </div>`
    ).join('') || '<div class="text-muted" style="text-align:center;">Журнал пуст.</div>';
    container.scrollTop = container.scrollHeight;
}

function generatePlayerTraitsList(pData) {
    let traitsHTML = '';
    if (pData.cards) {
        CARD_ORDER.forEach(key => { 
            if (pData.cards[key]?.isOpen) {
                traitsHTML += `
                <div class="aesthetic-trait-row survivor-trait">
                    <span class="trait-label">${pData.cards[key].label}</span>
                    <span class="trait-value">${pData.cards[key].value}</span>
                </div>`; 
            }
        });
    }
    return traitsHTML 
        ? `<div class="aesthetic-traits-container">${traitsHTML}</div>` 
        : `<div class="aesthetic-traits-container"><div class="text-muted text-center" style="width: 100%; font-size: 0.9rem; padding: 10px 0; letter-spacing: 2px;">/// ДАННЫЕ ЗАСЕКРЕЧЕНЫ ///</div></div>`;
}

window.getPlayerTraitsHTML = generatePlayerTraitsList;

window.toggleAccordion = function(id) {
    const content = document.getElementById(`disc-content-${id}`);
    const chevron = document.getElementById(`disc-chevron-${id}`);
    if (content) content.classList.toggle('expanded');
    if (chevron) chevron.classList.toggle('expanded');
};

function handleDiscussionUI() {
    const logic = globalState.gameLogic;
    if (logic.phase !== 'discussion') return;

    const myData = globalState.playersData?.[window.myUserId] || {};
    const isKicked = myData.kicked;

    document.getElementById('discussion-modal').classList.add('active');
    const alive = getAlivePlayers();
    const readyMap = logic.readyPlayers || {};
    let readyCount = 0;

    document.getElementById('discussion-players-list').innerHTML = alive.map(id => {
        const pData = globalState.playersData?.[id] || {}; 
        const isReady = readyMap[id];
        if (isReady) readyCount++;
        
        return `
            <div class="player-item aesthetic-player-card ${isReady ? 'ready-pulse' : ''}" style="padding: 15px;">
                <div class="player-header-row" onclick="toggleAccordion('${id}')" style="cursor: pointer; position: relative;">
                    <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR_UI}'" style="width: 50px; height: 50px;">
                    <div style="flex-grow: 1;">
                        <div class="font-header" style="font-size:1.4rem;color:${isReady ? 'var(--success)' : 'var(--text-main)'}">
                            ${globalState.playerNames?.[id]}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${isReady ? `<span style="color: var(--success); display: flex; align-items: center;">${SVG_CHECK}</span>` : ''}
                        <svg id="disc-chevron-${id}" class="accordion-chevron" viewBox="0 0 24 24" width="24" height="24" fill="${isReady ? 'var(--success)' : 'var(--accent-cyan)'}"><path d="M7 10l5 5 5-5z"/></svg>
                    </div>
                </div>
                <div id="disc-content-${id}" class="accordion-content">
                    <div class="accordion-inner">
                        ${generatePlayerTraitsList(pData)}
                    </div>
                </div>
            </div>`;
    }).join('');

    document.getElementById('ui-ready-count').innerText = readyCount;
    document.getElementById('ui-alive-count').innerText = alive.length;
    document.getElementById('ui-ready-bar-fill').style.width = `${(readyCount / alive.length) * 100}%`;
    
    const btn = document.getElementById('btn-ready');
    if (isKicked) {
        btn.innerText = "ОТКЛЮЧЕНО (РЕЖИМ НАБЛЮДЕНИЯ)";
        btn.className = 'btn-danger full-width';
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
    } else {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        if (readyMap[window.myUserId]) {
            btn.innerText = "ОТМЕНИТЬ ГОТОВНОСТЬ";
            btn.className = 'btn-danger full-width';
        } else {
            btn.innerText = "ПОДТВЕРДИТЬ ГОТОВНОСТЬ";
            btn.className = 'btn-primary full-width glow-hover';
        }
    }
}

let votingInterval;
function handleVotingUI() {
    const logic = globalState.gameLogic;
    const myData = globalState.playersData?.[window.myUserId] || {};
    const isKicked = myData.kicked;
    const isQuarantined = logic.quarantinedPlayers?.[window.myUserId];

    if (logic.phase === 'voting' && globalState.voting?.active) {
        document.getElementById('voting-modal').classList.add('active');
        
        // --- ДВОЙНАЯ ФАЗА ТЕКСТ ---
        const doublePhase = logic.doubleExilePhase || 0;
        let phaseTitle = "ПРОТОКОЛ ИЗГНАНИЯ";
        if (doublePhase === 1) phaseTitle = "ПРОТОКОЛ ИЗГНАНИЯ: ФАЗА 1";
        if (doublePhase === 2) phaseTitle = "ПРОТОКОЛ ИЗГНАНИЯ: ФАЗА 2 (ДВОЙНАЯ УГРОЗА)";
        
        const titleUi = document.getElementById('voting-title-ui');
        if (titleUi) titleUi.innerText = phaseTitle;

        const alive = getAlivePlayers();
        const results = globalState.voting.results || {};
        const myVote = results[window.myUserId];
        
        let votedCount = Object.keys(results).length;
        const quarantinedCount = Object.keys(logic.quarantinedPlayers || {}).length;
        const expectedVotes = alive.length - quarantinedCount;

        document.getElementById('voting-counter').innerText = `${votedCount} / ${expectedVotes}`;

        let votingHTML = "";

        if (isKicked) {
            votingHTML += `
                <div class="isolation-panel" style="margin-bottom: 20px; padding: 30px 15px; min-height: 250px;">
                    <div class="isolation-icon" style="width: 60px; height: 60px; margin-bottom: 15px;">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C7.58 2 4 5.58 4 10v4.58c0 1.25.75 2.37 1.89 2.83l1.84.74c1.17.47 1.94 1.62 1.94 2.89V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-.96c0-1.27.77-2.42 1.94-2.89l1.84-.74C21.25 16.95 22 15.83 22 14.58V10c0-4.42-3.58-8-8-8zm-3 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM9 16h6v2H9v-2z"/>
                        </svg>
                    </div>
                    <h3 class="isolation-title glitch-text" style="font-size: clamp(1.2rem, 4vw, 1.8rem); letter-spacing: 2px;">СВЯЗЬ ПОТЕРЯНА</h3>
                    <p class="isolation-desc" style="font-size: 0.95rem;">Вы изгнаны. Право голоса аннулировано.<br>Ожидайте решения выживших.</p>
                    <div class="isolation-scanline"></div>
                </div>
            `;
        } else if (isQuarantined) {
            votingHTML += `
                <div class="quarantine-lockdown-panel">
                    <div class="effect-center-icon" style="margin: 0 auto 10px auto; width: 50px; color: var(--danger);">${SVG_BIOHAZARD}</div>
                    <h3 class="font-header text-danger mb-5" style="font-size: 1.6rem; letter-spacing: 3px;">БЛОКИРОВКА СИСТЕМЫ</h3>
                    <p class="text-main" style="font-size: 0.95rem; opacity: 0.9;">Ваш голос заблокирован протоколом карантина.</p>
                </div>
            `;
        }

        if (!isKicked) {
            votingHTML += alive.map(id => {
                const isMe = id === window.myUserId;
                const isSelected = myVote === id;
                const isShielded = logic.shieldedPlayers?.[id];
                
                return `
                <div class="vote-item aesthetic-player-card ${isSelected ? 'selected' : ''} ${(isMe || isShielded) ? 'dimmed' : ''}" ${!isMe && !isQuarantined && !isShielded ? `onclick="submitVote('${id}')"` : ''} style="margin-bottom: 12px; padding: 12px 18px; ${isShielded ? 'border-color: var(--accent-cyan); box-shadow: inset 0 0 15px rgba(0, 229, 255, 0.2);' : ''}">
                    <div class="player-header-row" style="margin-bottom: 0;">
                        <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR_UI}'" style="width: 48px; height: 48px;">
                        <div style="flex-grow: 1;">
                            <span class="font-header" style="font-size: 1.4rem; line-height: 1; ${isShielded ? 'color: var(--accent-cyan)' : ''}">${globalState.playerNames?.[id]}</span>
                        </div>
                        <div>${isShielded ? SVG_SHIELD : isSelected ? SVG_TARGET : ''}</div>
                    </div>
                </div>`;
            }).join('');
        }

        document.getElementById('voting-players').innerHTML = votingHTML;

        clearInterval(votingInterval);
        const endTime = globalState.voting.endTime;
        votingInterval = setInterval(() => {
            const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            document.getElementById('voting-timer').innerText = left;
            
            if (left <= 0 || (votedCount >= expectedVotes && expectedVotes > 0)) {
                clearInterval(votingInterval);
                if (window.isHost && globalState.voting.active) window.executeExile();
            }
        }, 1000);
    } else {
        clearInterval(votingInterval);
        document.getElementById('voting-modal').classList.remove('active');
    }
}

function playActionCinema(actionData) {
    if (!actionData) return;
    
    document.getElementById('cinema-card-text').innerHTML = actionData.cardText;
    document.getElementById('cinema-card-phase').classList.add('active');
    document.getElementById('cinema-effect-phase').classList.remove('active');
    
    const effectPhase = document.getElementById('cinema-effect-phase');
    effectPhase.className = 'cinema-phase'; 
    
    const box1 = document.getElementById('ep1-trait-box');
    const box2 = document.getElementById('ep2-trait-box');
    box1.className = 'aesthetic-trait-row mt-10';
    box2.className = 'aesthetic-trait-row mt-10';
    box1.style = ''; box2.style = '';

    setTimeout(() => {
        document.getElementById('cinema-card-phase').classList.remove('active');
        effectPhase.classList.add('active');
        effectPhase.classList.add(`anim-${actionData.type}`);

        document.getElementById('ep1-avatar').src = globalState.playerAvatars?.[actionData.sourceId] || FALLBACK_AVATAR_UI;
        document.getElementById('ep1-name').innerText = globalState.playerNames?.[actionData.sourceId] || 'ИГРОК 1';
        
        document.getElementById('ep2-avatar').src = globalState.playerAvatars?.[actionData.targetId] || FALLBACK_AVATAR_UI;
        document.getElementById('ep2-name').innerText = globalState.playerNames?.[actionData.targetId] || 'ИГРОК 2';
        
        // Сброс классов цвета
        document.getElementById('ep1-name').classList.remove('text-danger');
        document.getElementById('ep2-name').classList.remove('text-danger');

        let svgIcon = ""; let text1 = "ИНИЦИАТОР"; let text2 = "ЦЕЛЬ";
        document.getElementById('effect-p2').style.display = 'flex';
        document.getElementById('effect-center-icon').style.display = '';

        if (actionData.type === 'swap') {
            svgIcon = SVG_SWAP; text1 = actionData.targetOldVal; text2 = actionData.sourceOldVal;
            setTimeout(() => {
                const rect1 = box1.getBoundingClientRect(); const rect2 = box2.getBoundingClientRect();
                const dX = (rect2.left + rect2.width / 2) - (rect1.left + rect1.width / 2);
                const dY = (rect2.top + rect2.height / 2) - (rect1.top + rect1.height / 2);
                
                box1.style.setProperty('--target-x', dX + 'px'); box1.style.setProperty('--target-y', dY + 'px'); box1.style.setProperty('--swap-color', 'var(--accent-cyan)');
                box2.style.setProperty('--target-x', -dX + 'px'); box2.style.setProperty('--target-y', -dY + 'px'); box2.style.setProperty('--swap-color', 'var(--warning)');
                box1.classList.add('anim-swap-dynamic'); box2.classList.add('anim-swap-dynamic');
            }, 100);
        } else {
            if (actionData.type === 'reveal') { svgIcon = SVG_REVEAL; text1 = "СКАНИРОВАНИЕ..."; text2 = `ВСКРЫТО: ${actionData.targetOldVal}`; } 
            else if (actionData.type === 'quarantine') { svgIcon = SVG_BIOHAZARD; text1 = "ИЗОЛЯЦИЯ"; text2 = "БЛОКИРОВКА ГОЛОСА"; document.getElementById('ep2-name').classList.add('text-danger'); } 
            else if (actionData.type === 'raid') { svgIcon = SVG_RAID; text1 = `ПОЛУЧЕНО: ${actionData.targetOldVal}`; text2 = "ПУСТО"; } 
            else if (actionData.type === 'scavenge') { svgIcon = SVG_SCAVENGE; text1 = `СЛУТАНО: ${actionData.targetOldVal}`; text2 = "МЕРТВ"; } 
            else if (actionData.type === 'reroll') { svgIcon = SVG_REROLL; text1 = `СБРОШЕНО: ${actionData.targetOldVal}`; text2 = `ОБНОВЛЕНИЕ: ${actionData.targetNewVal}`; setTimeout(() => { box2.style.setProperty('--swap-color', 'var(--accent-cyan)'); box2.classList.add('anim-swap-dynamic'); }, 100); }
            else if (actionData.type === 'shield') { svgIcon = SVG_SHIELD; text1 = "АКТИВАЦИЯ"; text2 = "ИММУНИТЕТ ОТ ИЗГНАНИЯ"; setTimeout(() => { box2.style.setProperty('--swap-color', 'var(--accent-cyan)'); box2.classList.add('anim-shield-pulse'); }, 100); }
            else if (actionData.type === 'heal') { svgIcon = SVG_HEAL; text1 = "СИСТЕМА ЖИЗНЕОБЕСПЕЧЕНИЯ"; text2 = `ИЗЛЕЧЕН: ${actionData.targetNewVal}`; setTimeout(() => { box2.style.setProperty('--swap-color', 'var(--success)'); box2.classList.add('anim-heal-pulse'); }, 100); }
            else if (actionData.type === 'sabotage') { svgIcon = SVG_SABOTAGE; text1 = "ВИРУСНАЯ АТАКА"; text2 = `ДОБАВЛЕНО: ${actionData.targetNewVal}`; setTimeout(() => { box2.style.setProperty('--swap-color', '#aa00ff'); box2.classList.add('anim-sabotage-glitch'); }, 100); }
            else if (actionData.type === 'shuffle') { svgIcon = SVG_SHUFFLE; text1 = "ИЗЪЯТИЕ ДАННЫХ"; text2 = "ПЕРЕРАСПРЕДЕЛЕНИЕ..."; }
            else if (actionData.type === 'dictator_veto') { svgIcon = SVG_DICTATOR; text1 = "АБСОЛЮТНАЯ ВЛАСТЬ"; text2 = "ДВОЙНОЙ ГОЛОС ПРИНЯТ"; }
            else if (actionData.type === 'dictator_gag') { svgIcon = SVG_DICTATOR; text1 = "ЦЕНЗУРА"; text2 = "КЛЯП: БЛОКИРОВКА ДЕЙСТВИЙ"; document.getElementById('ep2-name').classList.add('text-danger'); }
            
            // НОВЫЕ ЭКШЕНЫ
            else if (actionData.type === 'lockdown') { svgIcon = SVG_LOCKDOWN; text1 = "ПРОТОКОЛ АКТИВИРОВАН"; text2 = "ГЕРМЕТИЗАЦИЯ / ДВОЙНАЯ ФАЗА В СЛЕДУЮЩЕМ РАУНДЕ"; document.getElementById('ep2-name').innerText = "ВСЕ ВЫЖИВШИЕ"; }
            else if (actionData.type === 'puppeteer') { svgIcon = SVG_PUPPETEER; text1 = "УПРАВЛЕНИЕ ПЕРЕХВАЧЕНО"; text2 = "МАРИОНЕТКА ПОДЧИНЕНА"; document.getElementById('ep2-name').classList.add('text-danger'); }
            else if (actionData.type === 'infection') { svgIcon = SVG_BIOHAZARD; text1 = "НУЛЕВОЙ ПАЦИЕНТ"; text2 = actionData.targetNewVal; setTimeout(() => { box2.style.setProperty('--swap-color', 'var(--success)'); box2.classList.add('anim-sabotage-glitch'); }, 100); }
            else if (actionData.type === 'seance') { svgIcon = SVG_EYE; text1 = "УСТАНОВЛЕНИЕ СВЯЗИ"; text2 = "ДОСТУП К МЕСТИ ОТКРЫТ"; }
            else if (actionData.type === 'revenge') { svgIcon = SVG_REVEAL; text1 = "МЕРТВЫЕ НЕ МОЛЧАТ"; text2 = `ВСКРЫТО: ${actionData.targetOldVal}`; document.getElementById('ep1-name').classList.add('text-danger'); }
            else if (actionData.type === 'mirror_armor') { svgIcon = SVG_SHIELD; text1 = "АКТИВАЦИЯ"; text2 = "ЗЕРКАЛЬНАЯ БРОНЯ В ДЕЛЕ"; document.getElementById('effect-p2').style.display = 'none'; document.getElementById('effect-center-icon').style.display = 'none'; }
            else if (actionData.type === 'fake_document') { svgIcon = SVG_REROLL; text1 = "ПОДДЕЛКА..."; text2 = `ОБНОВЛЕНО: ${actionData.targetOldVal}`; document.getElementById('effect-p2').style.display = 'none'; document.getElementById('effect-center-icon').style.display = 'none'; }

            if (['shuffle', 'dictator_veto'].includes(actionData.type)) {
                document.getElementById('effect-p2').style.display = 'none';
                document.getElementById('effect-center-icon').style.display = 'none';
            }
        }

        document.getElementById('effect-center-icon').innerHTML = svgIcon;
        document.getElementById('ep1-trait').innerHTML = text1;
        document.getElementById('ep2-trait').innerHTML = text2;

        setTimeout(() => {
            if (window.isHost && globalState.gameLogic.nextPhase) {
                window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*');
            }
        }, 4000); 
    }, 2500);
}

let currentTargetCard = null;

window.openCardMenu = function(cardKey) {
    const card = globalState.playersData[window.myUserId].cards[cardKey];
    currentTargetCard = cardKey;
    
    document.getElementById('cam-title').innerText = card.label;
    const btnsContainer = document.getElementById('cam-buttons');
    
    if (cardKey === 'baggage') {
        document.getElementById('cam-desc').innerText = "Вы можете вскрыть багаж как личное имущество, либо отдать его в Общий склад бункера (он останется там даже если вас выгонят).";
        btnsContainer.innerHTML = `
            <button class="btn-primary full-width glow-hover" onclick="confirmRevealCard()">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                ВСКРЫТЬ ЛИЧНО
            </button>
            <button class="btn-primary full-width glow-hover" onclick="donateToStash()" style="background: rgba(255, 171, 0, 0.1); color: var(--warning); border-color: rgba(255, 171, 0, 0.3);">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px;"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8z"/></svg>
                СДАТЬ В ОБЩАК
            </button>
        `;
    } else {
        document.getElementById('cam-desc').innerText = "Вы собираетесь вскрыть эту информацию для всех выживших. Действие необратимо.";
        btnsContainer.innerHTML = `
            <button class="btn-primary full-width glow-hover" onclick="confirmRevealCard()">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                ОТКРЫТЬ ${card.label.toUpperCase()}
            </button>
        `;
    }
    
    document.getElementById('card-action-modal').classList.add('active');
};

window.closeCardModal = function() {
    document.getElementById('card-action-modal').classList.remove('active');
    currentTargetCard = null;
};

window.confirmRevealCard = function() {
    if (!currentTargetCard) return;
    const key = currentTargetCard;
    closeCardModal();
    if (typeof window.revealCard === 'function') window.revealCard(key);
};

window.donateToStash = function() {
    if (currentTargetCard !== 'baggage') return;
    closeCardModal();
    
    setTimeout(() => {
        const itemValue = globalState.playersData[window.myUserId].cards.baggage.value;
        const logic = globalState.gameLogic; 
        const required = getRoundRules(logic.round).revealsRequired;
        let newCount = (logic.revealedThisTurn || 0) + 1;
        const currentStash = globalState.world.sharedStash || [];
        
        const updates = {};
        updates['world/sharedStash'] = [...currentStash, itemValue]; 
        updates[`playersData/${window.myUserId}/cards/baggage/isOpen`] = true;
        updates[`playersData/${window.myUserId}/cards/baggage/value`] = "<span class='text-warning'>Отдано в Общак</span>";
        
        if (typeof addLog === 'function') addLog(`${window.myName} пожертвовал [${itemValue}] в Общий склад!`, "success");

        if (newCount >= required) {
            let nextIdx = logic.activePlayerIndex + 1;
            if (nextIdx >= getAlivePlayers().length) { 
                updates['gameLogic/phase'] = 'discussion'; updates['gameLogic/readyPlayers'] = null; 
            } else { 
                updates['gameLogic/activePlayerIndex'] = nextIdx; updates['gameLogic/revealedThisTurn'] = 0; 
            }
        } else { 
            updates['gameLogic/revealedThisTurn'] = newCount; 
        }
        
        window.parent.postMessage({ type: 'update_state', updates }, '*');
    }, Math.random() * 800);
};

window.playRoulette = function(rouletteData) {
    const overlay = document.getElementById('roulette-overlay');
    const track = document.getElementById('roulette-track');
    if (!overlay || !track) return;

    overlay.classList.add('active');
    track.innerHTML = '';

    const allItems = [];
    for (let i = 0; i < 40; i++) {
        let pId = rouletteData.tiedPlayers[i % rouletteData.tiedPlayers.length];
        allItems.push(pId);
    }
    
    allItems[35] = rouletteData.loserId;

    track.innerHTML = allItems.map(id => `
        <div class="roulette-item">
            <img src="${globalState.playerAvatars?.[id] || FALLBACK_AVATAR_UI}">
            <div>${globalState.playerNames?.[id] || "Аноним"}</div>
        </div>
    `).join('');

    track.style.transition = 'none';
    track.style.transform = `translateX(0px)`;

    setTimeout(() => {
        const firstItem = track.querySelector('.roulette-item');
        const itemW = firstItem ? firstItem.offsetWidth : 120;
        const windowElem = document.querySelector('.roulette-window');
        const windowW = windowElem ? windowElem.offsetWidth : window.innerWidth;
        
        const targetX = (35 * itemW) - (windowW / 2) + (itemW / 2);
        
        track.style.transition = 'transform 6s cubic-bezier(0.15, 0.85, 0.15, 1)';
        track.style.transform = `translateX(-${targetX}px)`;
    }, 100);

    const rouletteEndTime = Date.now() + 7000;
    const rouletteInterval = setInterval(() => {
        if (Date.now() >= rouletteEndTime) {
            clearInterval(rouletteInterval);
            overlay.classList.remove('active');
            
            if (window.isHost) {
                const targetCards = globalState.playersData[rouletteData.loserId]?.cards;
                const updates = {};
                
                if (targetCards?.action?.type === 'seance' && !targetCards.action.isOpen) {
                    updates[`gameLogic/revengeReady/${rouletteData.loserId}`] = true;
                    addLog(`Внимание! Изгнанный ${globalState.playerNames[rouletteData.loserId]} унес с собой Спиритический сеанс и жаждет мести...`, "danger");
                }
                
                updates[`playersData/${rouletteData.loserId}/kicked`] = true; 
                updates['gameLogic/phase'] = 'exile_animation'; 
                updates['gameLogic/exiledPlayer'] = rouletteData.loserId;
                updates['gameLogic/quarantinedPlayers'] = {}; 
                updates['gameLogic/shieldedPlayers'] = {}; 
                updates['gameLogic/vetoPlayers'] = {};
                updates['gameLogic/puppeteers'] = {}; 
                
                const capacity = globalState.world.capacity;
                updates['gameLogic/nextPhase'] = (getAlivePlayers().length - 1 <= capacity) ? 'ended' : 'reveal';
                if (updates['gameLogic/nextPhase'] === 'reveal') {
                    updates['gameLogic/round'] = globalState.gameLogic.round + 1; 
                    updates['gameLogic/activePlayerIndex'] = 0; 
                    updates['gameLogic/revealedThisTurn'] = 0; 
                    updates['gameLogic/readyPlayers'] = null; 
                }
                window.parent.postMessage({ type: 'update_state', updates }, '*');
                
                setTimeout(() => { 
                    window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*'); 
                }, 5000);
            }
        }
    }, 200);
};