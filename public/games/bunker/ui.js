// --- SVG ИКОНКИ ДЛЯ СПЕЦПРОТОКОЛОВ ---
const SVG_SWAP = `<svg viewBox="0 0 24 24"><path d="M12 2.75a9.25 9.25 0 1 0 4.737 17.197l-1.363-1.636A7.25 7.25 0 1 1 19.25 12h-2L20.5 8l3.25 4h-2.5a9.25 9.25 0 0 0-9.25-9.25z"/></svg>`;
const SVG_REVEAL = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const SVG_BIOHAZARD = `<svg viewBox="0 0 24 24"><path d="M12 2A10 10 0 1 0 22 12 10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm0-14a5.98 5.98 0 0 0-4.665 2.24l2.131 1.23A3.491 3.491 0 0 1 12 8.5a3.491 3.491 0 0 1 2.534.97l2.131-1.23A5.98 5.98 0 0 0 12 6zm-3.46 7.5a3.491 3.491 0 0 1-1.04-2.47H5A5.992 5.992 0 0 0 8.847 16l1.242-2.152a3.447 3.447 0 0 1-1.549-1.348zm6.92 0a3.447 3.447 0 0 1-1.549 1.348L15.153 16A5.992 5.992 0 0 0 19 11.03h-2.5a3.491 3.491 0 0 1-1.04 2.47zM12 10.5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z"/></svg>`;
const SVG_RAID = `<svg viewBox="0 0 24 24"><path d="M19.7 4.3a1 1 0 0 0-1.4 0L12 10.6 5.7 4.3a1 1 0 0 0-1.4 1.4l6.3 6.3-6.3 6.3a1 1 0 0 0 1.4 1.4l6.3-6.3 6.3 6.3a1 1 0 0 0 1.4-1.4l-6.3-6.3 6.3-6.3a1 1 0 0 0 0-1.4z"/></svg>`;
const SVG_SCAVENGE = `<svg viewBox="0 0 24 24"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm-1.5 9.5c-.83 0-1.5-.67-1.5-1.5S9.67 8.5 10.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5S12.67 8.5 13.5 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 20h-6v2h6v-2z"/></svg>`;
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

function showWorldDetail(type) {
    const data = globalState.world?.[type];
    if (!data) return;
    document.getElementById('world-detail-title').innerText = data.title;
    document.getElementById('world-detail-desc').innerText = data.description;
    document.getElementById('world-detail-modal').classList.add('active');
}
function closeWorldDetail() { document.getElementById('world-detail-modal').classList.remove('active'); }

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

// === НОВЫЙ ДИЗАЙН ХАРАКТЕРИСТИК (Используется везде!) ===
function generatePlayerTraitsList(pData) {
    let traitsHTML = '';
    if (pData.cards) {
        CARD_ORDER.forEach(key => { 
            if (pData.cards[key]?.isOpen) {
                traitsHTML += `
                <div class="aesthetic-trait-row">
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

// Пробрасываем для game.js
window.getPlayerTraitsHTML = generatePlayerTraitsList;

function handleDiscussionUI() {
    const logic = globalState.gameLogic;
    if (logic.phase !== 'discussion') return;

    document.getElementById('discussion-modal').classList.add('active');
    const alive = getAlivePlayers();
    const readyMap = logic.readyPlayers || {};
    let readyCount = 0;

    document.getElementById('discussion-players-list').innerHTML = alive.map(id => {
        const pData = globalState.playersData?.[id] || {}; 
        const isReady = readyMap[id];
        if (isReady) readyCount++;
        
        return `
            <div class="player-item aesthetic-player-card ${isReady ? 'ready-pulse' : ''}">
                <div class="player-header-row">
                    <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR_UI}'">
                    <div style="flex-grow: 1;">
                        <div class="font-header" style="font-size:1.4rem;color:${isReady ? 'var(--success)' : 'var(--text-main)'}">
                            ${globalState.playerNames?.[id]}
                        </div>
                    </div>
                    <div>${isReady ? SVG_CHECK : ''}</div>
                </div>
                ${generatePlayerTraitsList(pData)}
            </div>`;
    }).join('');

    document.getElementById('ui-ready-count').innerText = readyCount;
    document.getElementById('ui-alive-count').innerText = alive.length;
    document.getElementById('ui-ready-bar-fill').style.width = `${(readyCount / alive.length) * 100}%`;
    
    const btn = document.getElementById('btn-ready');
    if (readyMap[myUserId]) {
        btn.innerText = "ОТМЕНИТЬ ГОТОВНОСТЬ";
        btn.classList.replace('btn-primary', 'btn-danger');
    } else {
        btn.innerText = "ПОДТВЕРДИТЬ ГОТОВНОСТЬ";
        btn.classList.replace('btn-danger', 'btn-primary');
    }
}

let votingInterval;
function handleVotingUI() {
    const logic = globalState.gameLogic;
    const isQuarantined = logic.quarantinedPlayers?.[myUserId];

    if (logic.phase === 'voting' && globalState.voting?.active) {
        document.getElementById('voting-modal').classList.add('active');
        const alive = getAlivePlayers();
        const results = globalState.voting.results || {};
        const myVote = results[myUserId];
        
        let votedCount = Object.keys(results).length;
        const quarantinedCount = Object.keys(logic.quarantinedPlayers || {}).length;
        const expectedVotes = alive.length - quarantinedCount;

        document.getElementById('voting-counter').innerText = `${votedCount} / ${expectedVotes}`;

        document.getElementById('voting-players').innerHTML = alive.map(id => {
            const pData = globalState.playersData?.[id] || {}; 
            const isMe = id === myUserId;
            const isSelected = myVote === id;
            
            return `
            <div class="vote-item aesthetic-player-card ${isSelected ? 'selected' : ''} ${isMe ? 'dimmed' : ''}" ${!isMe && !isQuarantined ? `onclick="submitVote('${id}')"` : ''}>
                <div class="player-header-row">
                    <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR_UI}'">
                    <div style="flex-grow: 1;">
                        <span class="font-header" style="font-size: 1.4rem;">${globalState.playerNames?.[id]}</span>
                    </div>
                    <div>${isSelected ? SVG_TARGET : ''}</div>
                </div>
                ${generatePlayerTraitsList(pData)}
            </div>`;
        }).join('');

        if (isQuarantined) {
            document.getElementById('voting-players').innerHTML += `<div class="text-danger font-header mt-15 text-center" style="font-size: 1.2rem; letter-spacing: 2px;">ВАШ ГОЛОС ЗАБЛОКИРОВАН КАРАНТИНОМ ${SVG_BIOHAZARD}</div>`;
        }

        clearInterval(votingInterval);
        const endTime = globalState.voting.endTime;
        votingInterval = setInterval(() => {
            const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            document.getElementById('voting-timer').innerText = left;
            
            if (left <= 0 || (votedCount >= expectedVotes && expectedVotes > 0)) {
                clearInterval(votingInterval);
                if (isHost && globalState.voting.active) executeExile();
            }
        }, 1000);
    } else {
        clearInterval(votingInterval);
        document.getElementById('voting-modal').classList.remove('active');
    }
}

// --- КИНО-ЭКРАН АНИМАЦИИ ---
function playActionCinema(actionData) {
    if (!actionData) return;
    
    document.getElementById('cinema-card-text').innerHTML = actionData.cardText;
    document.getElementById('cinema-card-phase').classList.add('active');
    document.getElementById('cinema-effect-phase').classList.remove('active');
    
    const effectPhase = document.getElementById('cinema-effect-phase');
    effectPhase.className = 'cinema-phase'; 
    
    // Снимаем классы анимации с плашек характеристик перед началом
    document.getElementById('ep1-trait-box').className = 'aesthetic-trait-row mt-10';
    document.getElementById('ep2-trait-box').className = 'aesthetic-trait-row mt-10';

    setTimeout(() => {
        document.getElementById('cinema-card-phase').classList.remove('active');
        effectPhase.classList.add('active');
        effectPhase.classList.add(`anim-${actionData.type}`);

        document.getElementById('ep1-avatar').src = globalState.playerAvatars?.[actionData.sourceId] || FALLBACK_AVATAR_UI;
        document.getElementById('ep1-name').innerText = globalState.playerNames?.[actionData.sourceId] || 'ИГРОК 1';
        
        document.getElementById('ep2-avatar').src = globalState.playerAvatars?.[actionData.targetId] || FALLBACK_AVATAR_UI;
        document.getElementById('ep2-name').innerText = globalState.playerNames?.[actionData.targetId] || 'ИГРОК 2';

        let svgIcon = "";
        let text1 = "ИНИЦИАТОР";
        let text2 = "ЦЕЛЬ";

        if (actionData.type === 'swap') {
            svgIcon = SVG_SWAP; text1 = actionData.targetOldVal; text2 = actionData.sourceOldVal;
            // Анимация вешается ИСКЛЮЧИТЕЛЬНО на плашки характеристик!
            document.getElementById('ep1-trait-box').classList.add('anim-swap-left');
            document.getElementById('ep2-trait-box').classList.add('anim-swap-right');
        } else if (actionData.type === 'reveal') {
            svgIcon = SVG_REVEAL; text1 = "СКАНИРОВАНИЕ..."; text2 = `ВСКРЫТО: ${actionData.targetOldVal}`;
        } else if (actionData.type === 'quarantine') {
            svgIcon = SVG_BIOHAZARD; text1 = "ИЗОЛЯЦИЯ"; text2 = "БЛОКИРОВКА ГОЛОСА";
            document.getElementById('ep2-name').classList.add('text-danger');
        } else if (actionData.type === 'raid') {
            svgIcon = SVG_RAID; text1 = `ПОЛУЧЕНО: ${actionData.targetOldVal}`; text2 = "ПУСТО";
        } else if (actionData.type === 'scavenge') {
            svgIcon = SVG_SCAVENGE; text1 = `СЛУТАНО: ${actionData.targetOldVal}`; text2 = "МЕРТВ";
        }

        document.getElementById('effect-center-icon').innerHTML = svgIcon;
        document.getElementById('ep1-trait').innerHTML = text1;
        document.getElementById('ep2-trait').innerHTML = text2;
        
        document.getElementById('effect-p2').style.display = 'flex';

        setTimeout(() => {
            if (isHost && globalState.gameLogic.nextPhase) {
                window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*');
            }
        }, 4000); 
    }, 2500);
}

// --- ФИНАЛЬНЫЙ ЭКРАН И ИИ ---
let aiStoryGenerated = false;

async function renderEndScreen() {
    const aliveIds = getAlivePlayers();
    
    document.getElementById('winners-list').innerHTML = aliveIds.map(id => `
        <div class="player-item mb-10" style="border-color:rgba(0,230,118,0.5);background:rgba(0, 230, 118, 0.05);padding:12px">
            <div class="player-header-row">
                <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR_UI}'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
                <div class="font-header" style="font-size:1.4rem;color:var(--success)">${globalState.playerNames?.[id]}</div>
            </div>
        </div>`).join('');
        
    if (isHost) document.getElementById('btn-exit-lobby').style.display = 'block';

    const storyEl = document.getElementById('ai-story-text');

    if (globalState.gameLogic?.aiStory) {
        if (storyEl.getAttribute('data-loaded') !== 'true') {
            storyEl.setAttribute('data-loaded', 'true');
            if (!isHost) {
                storyEl.innerText = "";
                let i = 0;
                const text = globalState.gameLogic.aiStory;
                const typeInterval = setInterval(() => {
                    storyEl.innerText += text.charAt(i); i++;
                    const screen = document.getElementById('end-screen'); screen.scrollTop = screen.scrollHeight;
                    if (i >= text.length) clearInterval(typeInterval);
                }, 15);
            } else {
                storyEl.innerText = globalState.gameLogic.aiStory;
            }
        }
        return;
    }

    if (!aiStoryGenerated) {
        aiStoryGenerated = true; 
        if (isHost) {
            storyEl.innerText = "Подключение к нейросети... Генерация отчета..."; 
            const finalText = await StoryGenerator.generate(aliveIds, globalState.playersData, globalState.world, (newText) => {
                storyEl.innerText = newText;
                const screen = document.getElementById('end-screen'); screen.scrollTop = screen.scrollHeight;
            });
            window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/aiStory': finalText } }, '*');
        } else {
            storyEl.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin-bottom: 10px;"></div> <br>Ожидание отчета от лидера...`;
        }
    }
}