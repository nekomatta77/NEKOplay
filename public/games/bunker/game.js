const urlParams = new URLSearchParams(window.location.search);
const myName = urlParams.get('name') || 'Аноним';
const myUserId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';

let globalState = {};
let database = {};

const CARD_ORDER = ['bio', 'health', 'prof', 'hobby', 'phobia', 'fact', 'baggage', 'action'];

const SVG_LOCK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4z"/><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/></svg>`;
const SVG_EYE = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const SVG_CHECK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
const SVG_TARGET = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5.08 4.06 5.6 7.41h-2.6c-.45-1.57-1.84-2.76-3.56-2.91v2.41c1.8.18 3.2 1.58 3.38 3.38h2.4c-.16 1.4-.76 2.68-1.62 3.65z"/></svg>`;

const CAPACITY_MAP = { 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4, 11: 5, 12: 5, 13: 6, 14: 6, 15: 7, 16: 7 };

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

fetch('cards.json').then(res => res.json()).then(data => {
    database = data;
    if (isHost) window.parent.postMessage({ type: 'start_game', settings: { mode: 'bunker' } }, '*');
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        globalState = event.data.state || {};
        handleStateChange();
    }
});

function getAlivePlayers() { return (globalState.players || []).filter(id => !globalState.playersData?.[id]?.kicked); }
function getRoundRules(round) {
    const rules = globalState.gameLogic?.rules || { voteRound1: false, doubleRevealRound: 3 };
    return { revealsRequired: round >= rules.doubleRevealRound ? 2 : 1, hasVoting: round === 1 ? rules.voteRound1 : true };
}

function handleStateChange() {
    if (!globalState.status || globalState.status === 'waiting') {
        showScreen('loading-screen'); return;
    }
    if (globalState.status === 'playing') {
        if (!globalState.gameLogic) {
            if (isHost) showScreen('setup-screen');
            else showScreen('guest-setup-screen');
            return;
        }

        // ВАЖНО: Сначала обновляем UI модальных окон, чтобы они скрылись перед анимацией
        handleDiscussionUI();
        handleVotingUI();

        if (globalState.gameLogic.phase === 'ended') {
            showScreen('end-screen'); renderEndScreen(); return;
        }

        // ЭКРАН ИЗГНАНИЯ
        if (globalState.gameLogic.phase === 'exile_animation') {
            showScreen('exile-screen');
            const exiledId = globalState.gameLogic.exiledPlayer;
            document.getElementById('exile-name').innerText = globalState.playerNames?.[exiledId] || "НЕИЗВЕСТНЫЙ";
            document.getElementById('exile-avatar').src = globalState.playerAvatars?.[exiledId] || "";
            return;
        }

        showScreen('game-screen');
        checkHostAutomations();
        renderGame();
    }
}

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generateBio() {
    const genders = ["Мужчина", "Женщина"];
    return `${genders[Math.floor(Math.random() * genders.length)]}, ${Math.floor(Math.random() * (75 - 18 + 1)) + 18} лет`;
}

function confirmSetup() {
    const voteR1 = document.getElementById('setting-vote-r1').value === 'true';
    const doubleRound = parseInt(document.getElementById('setting-double-round').value);
    const playersCount = globalState.players.length;
    const capacity = CAPACITY_MAP[playersCount] || Math.max(1, Math.floor(playersCount / 2)); 

    const initialPlayersData = {};
    globalState.players.forEach(playerId => {
        initialPlayersData[playerId] = {
            kicked: false,
            cards: {
                bio: { label: 'Биография', value: generateBio(), isOpen: false },
                health: { label: 'Здоровье', value: getRandom(database.healths), isOpen: false },
                prof: { label: 'Профессия', value: getRandom(database.professions), isOpen: false },
                hobby: { label: 'Хобби', value: getRandom(database.hobbies), isOpen: false },
                phobia: { label: 'Фобия', value: getRandom(database.phobias), isOpen: false },
                fact: { label: 'Факты', value: getRandom(database.traits), isOpen: false },
                baggage: { label: 'Багаж', value: getRandom(database.baggages), isOpen: false },
                action: { label: 'Действие', value: getRandom(database.actionCards), isOpen: false }
            }
        };
    });

    window.parent.postMessage({ 
        type: 'update_state', 
        updates: { 
            world: { catastrophe: getRandom(database.catastrophes), bunker: getRandom(database.bunkers), capacity }, 
            playersData: initialPlayersData,
            gameLogic: { round: 1, phase: 'reveal', activePlayerIndex: 0, revealedThisTurn: 0, readyPlayers: {}, rules: { voteRound1: voteR1, doubleRevealRound: doubleRound } },
            voting: null 
        } 
    }, '*');
}

function checkHostAutomations() {
    if (!isHost) return;
    const logic = globalState.gameLogic;
    const alive = getAlivePlayers();

    if (logic.phase === 'discussion') {
        const readyMap = logic.readyPlayers || {};
        const allReady = alive.every(id => readyMap[id]);
        
        if (allReady) {
            const rule = getRoundRules(logic.round);
            const updates = {};
            if (rule.hasVoting) {
                updates['gameLogic/phase'] = 'voting';
                updates['voting/active'] = true;
                updates['voting/results'] = null;
                updates['voting/endTime'] = Date.now() + 60000; // 60 секунд таймер
            } else {
                updates['gameLogic/phase'] = 'reveal';
                updates['gameLogic/round'] = logic.round + 1;
                updates['gameLogic/activePlayerIndex'] = 0;
                updates['gameLogic/revealedThisTurn'] = 0;
                updates['gameLogic/readyPlayers'] = null;
            }
            window.parent.postMessage({ type: 'update_state', updates }, '*');
        }
    }
}

function renderGame() {
    const world = globalState.world || {};
    const logic = globalState.gameLogic || {};
    const alivePlayers = getAlivePlayers();
    
    let activePlayerId = alivePlayers[logic.activePlayerIndex];
    if (!activePlayerId && logic.phase === 'reveal' && isHost) {
        window.parent.postMessage({ type: 'update_state', updates: {'gameLogic/activePlayerIndex': 0} }, '*');
    }
    const isMyTurn = (activePlayerId === myUserId) && (logic.phase === 'reveal');
    const rules = getRoundRules(logic.round);

    // СТАТУС
    document.getElementById('ui-catastrophe').innerText = world.catastrophe || "...";
    document.getElementById('ui-bunker').innerText = world.bunker || "...";
    document.getElementById('ui-capacity').innerText = world.capacity || "0";
    
    const banner = document.getElementById('status-banner');
    document.getElementById('ui-round-info').innerText = logic.phase === 'voting' ? 'ФАЗА ИЗГНАНИЯ' : logic.phase === 'discussion' ? 'ДЕБАТЫ' : `РАУНД ${logic.round}: ВЫКЛАДКА КАРТ`;
    
    if (logic.phase === 'reveal') {
        const activeName = globalState.playerNames?.[activePlayerId] || "Аноним";
        document.getElementById('ui-turn-info').innerText = isMyTurn ? "ДЕЙСТВУЙТЕ!" : `Активен: ${activeName}`;
        banner.className = isMyTurn ? 'status-banner highlight' : 'status-banner';
    } else {
        document.getElementById('ui-turn-info').innerText = "Системный процесс";
        banner.className = 'status-banner';
    }

    // ИГРОКИ
    const ingameList = document.getElementById('ingame-players-list');
    ingameList.innerHTML = (globalState.players || []).map(id => {
        const pData = globalState.playersData?.[id] || {};
        const name = globalState.playerNames?.[id] || "Аноним";
        const avatar = globalState.playerAvatars?.[id] || "";
        const isKicked = pData.kicked;
        const isActiveClass = (id === activePlayerId && logic.phase === 'reveal') ? 'active-turn' : '';
        const kickedClass = isKicked ? 'kicked' : '';

        let traitsHTML = '';
        if (pData.cards) {
            CARD_ORDER.forEach(key => {
                const card = pData.cards[key];
                if (card && card.isOpen) traitsHTML += `<div class="survivor-trait"><span class="trait-label">${card.label}</span><span class="trait-value">${card.value}</span></div>`;
            });
        }
        if (!traitsHTML) traitsHTML = '<div class="text-muted" style="grid-column: span 2; font-size: 0.85rem; padding: 10px 0;">/// ДАННЫЕ ЗАСЕКРЕЧЕНЫ ///</div>';

        return `
            <div class="player-item ${kickedClass} ${isActiveClass}">
                <div class="player-header-row">
                    <img src="${avatar}">
                    <div>
                        <div class="font-header" style="font-size: 1.6rem; letter-spacing: 1.5px; color: ${id === myUserId ? 'var(--accent-cyan)' : 'var(--text-main)'};">
                            ${name} ${id === myUserId ? '<span class="text-muted" style="font-size:0.8rem; vertical-align: middle;">(ВЫ)</span>' : ''}
                        </div>
                        ${isKicked ? '<div class="text-danger font-header" style="font-size: 0.95rem; letter-spacing: 1px; margin-top:2px;">ИЗГНАН ИЗ СИСТЕМЫ</div>' : ''}
                    </div>
                </div>
                <div class="survivor-traits-grid">
                    ${traitsHTML}
                </div>
            </div>`;
    }).join('');

    // МОИ КАРТЫ
    const myData = globalState.playersData?.[myUserId];
    const myCardsContainer = document.getElementById('my-cards-container');
    const hintEl = document.getElementById('ui-my-turn-hint');
    
    if (myData?.kicked) hintEl.innerHTML = `<span class='text-danger'>Вы изолированы. Доступ к картам закрыт.</span>`;
    else if (isMyTurn) hintEl.innerHTML = `<span class='text-warning' style='font-weight:bold'>СДЕЛАЙТЕ ВЫБОР: Вскройте ${rules.revealsRequired} карт(у).</span>`;
    else hintEl.innerText = "Дождитесь своей очереди для открытия.";

    if (myData && myData.cards) {
        myCardsContainer.innerHTML = CARD_ORDER.map(cardKey => {
            const card = myData.cards[cardKey];
            if(!card) return '';
            const cardStateClass = card.isOpen ? 'revealed-card' : 'hidden-card';
            const statusIcon = card.isOpen ? SVG_EYE : SVG_LOCK;
            const statusText = card.isOpen ? 'ОТКРЫТО' : 'СКРЫТО';
            const canClick = isMyTurn && !myData.kicked && !card.isOpen;
            
            return `
                <div class="bunker-card ${cardStateClass} ${!canClick ? 'disabled' : ''}" ${canClick ? `onclick="revealCard('${cardKey}')"` : ''}>
                    <div>
                        <div class="type">${card.label}</div>
                        <div class="value">${card.value}</div>
                    </div>
                    <div class="status-badge font-header">${statusIcon} ${statusText}</div>
                </div>`;
        }).join('');
    }
}

function revealCard(cardKey) {
    let logic = globalState.gameLogic;
    let newRevealedCount = (logic.revealedThisTurn || 0) + 1;
    let alivePlayers = getAlivePlayers();
    const updates = {};
    updates[`playersData/${myUserId}/cards/${cardKey}/isOpen`] = true;

    if (newRevealedCount >= getRoundRules(logic.round).revealsRequired) {
        let nextIdx = logic.activePlayerIndex + 1;
        if (nextIdx >= alivePlayers.length) {
            updates['gameLogic/phase'] = 'discussion';
            updates['gameLogic/readyPlayers'] = null;
        } else {
            updates['gameLogic/activePlayerIndex'] = nextIdx;
            updates['gameLogic/revealedThisTurn'] = 0;
        }
    } else {
        updates['gameLogic/revealedThisTurn'] = newRevealedCount;
    }
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

// ОБСУЖДЕНИЕ
function handleDiscussionUI() {
    const logic = globalState.gameLogic || {};
    const modal = document.getElementById('discussion-modal');
    
    if (logic.phase === 'discussion') {
        modal.classList.add('active');
        const alivePlayers = getAlivePlayers();
        const readyMap = logic.readyPlayers || {};
        const readyCount = Object.keys(readyMap).filter(id => readyMap[id] && alivePlayers.includes(id)).length;
        
        document.getElementById('ui-ready-count').innerText = readyCount;
        document.getElementById('ui-alive-count').innerText = alivePlayers.length;
        document.getElementById('ui-ready-bar-fill').style.width = `${(readyCount / alivePlayers.length) * 100}%`;
        
        const btnReady = document.getElementById('btn-ready');
        if (readyMap[myUserId]) {
            btnReady.classList.add('ready');
            btnReady.innerHTML = `${SVG_CHECK} ВЫ ГОТОВЫ`;
        } else {
            btnReady.classList.remove('ready');
            btnReady.innerText = "ПОДТВЕРДИТЬ ГОТОВНОСТЬ";
        }

        const listContainer = document.getElementById('discussion-players-list');
        listContainer.innerHTML = alivePlayers.map(id => {
            const name = globalState.playerNames?.[id] || "Аноним";
            const avatar = globalState.playerAvatars?.[id] || "";
            const pData = globalState.playersData?.[id] || {};
            
            let openedCardsHTML = '';
            if (pData.cards) {
                CARD_ORDER.forEach(key => {
                    const card = pData.cards[key];
                    if (card && card.isOpen) openedCardsHTML += `<div class="disc-stat"><span>${card.label}</span>${card.value}</div>`;
                });
            }
            if(!openedCardsHTML) openedCardsHTML = `<div class="text-muted" style="grid-column: span 2;">Нет открытых данных</div>`;

            return `
                <div class="disc-player-item">
                    <div class="disc-player-header" onclick="toggleDiscPlayer('${id}')">
                        <div class="disc-player-info">
                            <img src="${avatar}">
                            <span class="font-header" style="font-size: 1.2rem; letter-spacing:1px">${name}</span>
                        </div>
                        <div class="disc-chevron" id="disc-icon-${id}">▼</div>
                    </div>
                    <div class="disc-player-content" id="disc-content-${id}">
                        <div class="disc-content-inner">${openedCardsHTML}</div>
                    </div>
                </div>`;
        }).join('');
    } else {
        modal.classList.remove('active');
    }
}

function toggleDiscPlayer(id) {
    const content = document.getElementById(`disc-content-${id}`);
    const icon = document.getElementById(`disc-icon-${id}`);
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.style.transform = 'rotate(180deg)';
    }
}

function toggleReady() {
    const updates = {};
    updates[`gameLogic/readyPlayers/${myUserId}`] = !(globalState.gameLogic?.readyPlayers?.[myUserId]);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

// ГОЛОСОВАНИЕ И ТАЙМЕР
let votingInterval;
function handleVotingUI() {
    const modal = document.getElementById('voting-modal');
    // Окно активно только в фазе голосования
    if (globalState.voting?.active && globalState.gameLogic?.phase === 'voting') {
        modal.classList.add('active');
        renderVotingList();
        
        clearInterval(votingInterval);
        votingInterval = setInterval(() => {
            const endTime = globalState.voting?.endTime || Date.now();
            const timeLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            
            const timerEl = document.getElementById('voting-timer');
            if (timerEl) timerEl.innerText = timeLeft;

            if (isHost) {
                const votes = globalState.voting?.results || {};
                const aliveCount = getAlivePlayers().length;
                // Завершаем, если время вышло ИЛИ все живые проголосовали
                if (timeLeft <= 0 || Object.keys(votes).length >= aliveCount) {
                    clearInterval(votingInterval);
                    executeExile();
                }
            }
        }, 500);
    } else {
        clearInterval(votingInterval);
        modal.classList.remove('active');
    }
}

function renderVotingList() {
    const container = document.getElementById('voting-players');
    const alivePlayers = getAlivePlayers();
    const myVote = globalState.voting?.results?.[myUserId]; 

    container.innerHTML = alivePlayers.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const isSelected = myVote === id;
        const btnText = myVote ? (isSelected ? `${SVG_TARGET} ВЫБРАН` : '---') : 'УДАЛИТЬ';
        const disabledClass = myVote ? 'disabled' : '';

        return `
            <div class="vote-item" style="border-color: ${isSelected ? 'var(--danger)' : 'rgba(255,255,255,0.05)'}">
                <span class="font-header" style="font-size: 1.2rem; letter-spacing: 1px;">${name}</span>
                <button class="btn-primary" style="width: auto; padding: 10px 18px;" ${disabledClass} onclick="submitVote('${id}')">${btnText}</button>
            </div>`;
    }).join('');
}

function submitVote(targetId) {
    const updates = {};
    updates[`voting/results/${myUserId}`] = targetId;
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function executeExile() {
    const votes = globalState.voting?.results || {};
    const voteCounts = {};
    Object.values(votes).forEach(tId => { voteCounts[tId] = (voteCounts[tId] || 0) + 1; });
    
    let maxVotes = 0; let targetToKick = null;
    Object.entries(voteCounts).forEach(([tId, count]) => { if (count > maxVotes) { maxVotes = count; targetToKick = tId; } });

    if (!targetToKick) { targetToKick = getRandom(getAlivePlayers()); }

    const updates = {};
    updates[`playersData/${targetToKick}/kicked`] = true; 
    
    const aliveAfterKick = getAlivePlayers().length - 1; 
    const capacity = globalState.world.capacity;

    updates['voting/active'] = false;
    updates['gameLogic/phase'] = 'exile_animation';
    updates['gameLogic/exiledPlayer'] = targetToKick;

    if (aliveAfterKick <= capacity) {
        updates['gameLogic/nextPhase'] = 'ended';
    } else {
        updates['gameLogic/nextPhase'] = 'reveal';
        updates['gameLogic/round'] = globalState.gameLogic.round + 1;
        updates['gameLogic/activePlayerIndex'] = 0;
        updates['gameLogic/revealedThisTurn'] = 0;
        updates['gameLogic/readyPlayers'] = null;
    }

    window.parent.postMessage({ type: 'update_state', updates }, '*');

    // Через 5 секунд переходим к следующей фазе
    setTimeout(() => {
        window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*');
    }, 5000);
}

function renderEndScreen() {
    const winnersList = document.getElementById('winners-list');
    winnersList.innerHTML = getAlivePlayers().map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const avatar = globalState.playerAvatars?.[id] || "";
        return `
            <div class="player-item mb-10" style="border-color: rgba(0,230,118,0.5); background: rgba(0, 230, 118, 0.05); padding: 12px 20px;">
                <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%;">
                <div class="font-header" style="font-size: 1.2rem; letter-spacing: 1px; color: var(--success);">${name}</div>
            </div>`;
    }).join('');
}