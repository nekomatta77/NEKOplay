// --- ИНИЦИАЛИЗАЦИЯ И СИНХРОНИЗАЦИЯ ---
Promise.all([
    fetch('actions.json').then(res => res.json()),
    fetch('bio.json').then(res => res.json()),
    fetch('professions.json').then(res => res.json()),
    fetch('health.json').then(res => res.json()),
    fetch('hobbies.json').then(res => res.json()),
    fetch('phobias.json').then(res => res.json()),
    fetch('baggages.json').then(res => res.json()),
    fetch('traits.json').then(res => res.json()),
    fetch('catastrophes.json').then(res => res.json()),
    fetch('bunkers.json').then(res => res.json())
]).then(([actionsData, bioData, profData, healthData, hobbiesData, phobiasData, baggagesData, traitsData, catastrophesData, bunkersData]) => { 
    database = { actionCards: actionsData }; 
    database.bio = bioData; 
    database.professions = profData; 
    database.healths = healthData;   
    database.hobbies = hobbiesData;
    database.phobias = phobiasData;
    database.baggages = baggagesData;
    database.traits = traitsData;
    database.catastrophes = catastrophesData;
    database.bunkers = bunkersData;
    
    if (isHost) window.parent.postMessage({ type: 'start_game', settings: { mode: 'bunker' } }, '*'); 
}).catch(err => console.error("Ошибка загрузки баз данных:", err));

window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        globalState = event.data.state || {};
        handleStateChange();
        if(document.getElementById('logs-panel').classList.contains('active')) renderLogs();
    }
});

function handleStateChange() {
    if (!globalState.status || globalState.status === 'waiting') { 
        showScreen('loading-screen'); 
        return; 
    }
    
    if (globalState.status === 'playing') {
        if (!globalState.gameLogic) { 
            if (isHost) {
                const savedKey = localStorage.getItem('bunker_api_key');
                if (savedKey && document.getElementById('setting-api-key')) {
                    document.getElementById('setting-api-key').value = savedKey;
                }
                showScreen('setup-screen'); 
            }
            else showScreen('guest-setup-screen'); 
            return; 
        }

        hideAllModals(); 
        
        if (globalState.gameLogic.phase === 'action_animation') {
            showScreen('action-cinema-screen');
            playActionCinema(globalState.gameLogic.activeAction);
            return;
        }
        if (globalState.gameLogic.phase === 'ended') { 
            showScreen('end-screen'); renderEndScreen(); return; 
        }
        if (globalState.gameLogic.phase === 'exile_animation') { 
            showScreen('exile-screen'); 
            const exiledId = globalState.gameLogic.exiledPlayer; 
            document.getElementById('exile-name').innerText = globalState.playerNames?.[exiledId] || "ИГРОК"; 
            document.getElementById('exile-avatar').src = globalState.playerAvatars?.[exiledId] || ""; 
            return; 
        }

        showScreen('game-screen');
        checkHostAutomations(); 
        renderGame(); 
        handleDiscussionUI();
        handleVotingUI();
    }
}

// --- ЛОГИКА ХОСТА ---
function confirmSetup() {
    const apiKeyInput = document.getElementById('setting-api-key')?.value.trim();
    if (apiKeyInput) {
        localStorage.setItem('bunker_api_key', apiKeyInput);
    }

    const firstVoteRound = parseInt(document.getElementById('setting-first-vote-round').value) || 2;
    const doubleRound = parseInt(document.getElementById('setting-double-round').value) || 3;
    
    const playersCount = globalState.players.length;
    const capacity = Math.ceil(playersCount / 2); 

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
                action: { ...getRandom(database.actionCards), isOpen: false }
            }
        };
    });

    const selectedCatastrophe = getRandom(database.catastrophes);
    const selectedBunker = getRandom(database.bunkers);

    window.parent.postMessage({ 
        type: 'update_state', 
        updates: { 
            world: { catastrophe: selectedCatastrophe, bunker: selectedBunker, capacity }, 
            playersData: initialPlayersData, 
            logs: {},
            gameLogic: { 
                round: 1, phase: 'reveal', activePlayerIndex: 0, 
                revealedThisTurn: 0, readyPlayers: {}, 
                quarantinedPlayers: {}, 
                rules: { firstVoteRound: firstVoteRound, doubleRevealRound: doubleRound } 
            },
            voting: null 
        } 
    }, '*');
    addLog("Симуляция запущена.", "success");
}

function checkHostAutomations() {
    if (!isHost) return;
    const logic = globalState.gameLogic;
    if (logic.phase === 'discussion') {
        const readyMap = logic.readyPlayers || {};
        if (getAlivePlayers().every(id => readyMap[id])) {
            const rule = getRoundRules(logic.round);
            const updates = {};
            if (rule.hasVoting) {
                updates['gameLogic/phase'] = 'voting'; 
                updates['voting/active'] = true; 
                updates['voting/results'] = null; 
                updates['voting/endTime'] = Date.now() + 60000;
                addLog("Запущено голосование.", "danger");
            } else {
                updates['gameLogic/phase'] = 'reveal'; 
                updates['gameLogic/round'] = logic.round + 1; 
                updates['gameLogic/activePlayerIndex'] = 0; 
                updates['gameLogic/revealedThisTurn'] = 0; 
                updates['gameLogic/readyPlayers'] = null;
                addLog(`Начат раунд ${logic.round + 1}.`, "info");
            }
            window.parent.postMessage({ type: 'update_state', updates }, '*');
        }
    }
}

// --- ОТРИСОВКА ИГРЫ ---
const SVG_BIO_MINI = `<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;"><path d="M12 2A10 10 0 1 0 22 12 10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm0-14a5.98 5.98 0 0 0-4.665 2.24l2.131 1.23A3.491 3.491 0 0 1 12 8.5a3.491 3.491 0 0 1 2.534.97l2.131-1.23A5.98 5.98 0 0 0 12 6zm-3.46 7.5a3.491 3.491 0 0 1-1.04-2.47H5A5.992 5.992 0 0 0 8.847 16l1.242-2.152a3.447 3.447 0 0 1-1.549-1.348zm6.92 0a3.447 3.447 0 0 1-1.549 1.348L15.153 16A5.992 5.992 0 0 0 19 11.03h-2.5a3.491 3.491 0 0 1-1.04 2.47zM12 10.5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z"/></svg>`;
const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

function renderGame() {
    const world = globalState.world || {}; 
    const logic = globalState.gameLogic || {}; 
    const alivePlayers = getAlivePlayers();
    
    let activePlayerId = alivePlayers[logic.activePlayerIndex];
    if (!activePlayerId && logic.phase === 'reveal' && isHost) {
        window.parent.postMessage({ type: 'update_state', updates: {'gameLogic/activePlayerIndex': 0} }, '*');
    }
    const isMyTurn = (activePlayerId === myUserId) && (logic.phase === 'reveal');

    document.getElementById('ui-catastrophe').innerText = world.catastrophe?.title || "..."; 
    document.getElementById('ui-bunker').innerText = world.bunker?.title || "..."; 
    document.getElementById('ui-capacity').innerText = world.capacity || "0";
    document.getElementById('ui-round-info').innerText = logic.phase === 'voting' ? 'ФАЗА ИЗГНАНИЯ' : logic.phase === 'discussion' ? 'ДЕБАТЫ' : `РАУНД ${logic.round}`;

    if (logic.phase === 'reveal') {
        document.getElementById('ui-turn-info').innerText = isMyTurn ? "ДЕЙСТВУЙТЕ!" : `Активен: ${globalState.playerNames?.[activePlayerId] || "Аноним"}`;
        document.getElementById('status-banner').className = isMyTurn ? 'status-banner highlight' : 'status-banner';
    } else {
        document.getElementById('ui-turn-info').innerText = "Системный процесс";
        document.getElementById('status-banner').className = 'status-banner';
    }

    document.getElementById('ingame-players-list').innerHTML = (globalState.players || []).map(id => {
        const pData = globalState.playersData?.[id] || {}; 
        const name = globalState.playerNames?.[id] || "Аноним";
        let traitsHTML = '';
        if (pData.cards) {
            CARD_ORDER.forEach(key => { 
                if (pData.cards[key]?.isOpen) {
                    traitsHTML += `<div class="survivor-trait"><span class="trait-label">${pData.cards[key].label}</span><span class="trait-value">${pData.cards[key].value}</span></div>`; 
                }
            });
        }
        if (!traitsHTML) traitsHTML = '<div class="text-muted" style="grid-column:span 2">/// СКРЫТО ///</div>';
        
        let quarantineBadge = logic.quarantinedPlayers?.[id] ? `<span class="quarantine-badge">${SVG_BIO_MINI} КАРАНТИН</span>` : '';
        
        return `
            <div class="player-item ${pData.kicked ? 'kicked' : ''} ${id === activePlayerId && logic.phase === 'reveal' ? 'active-turn' : ''}">
                <div class="player-header-row">
                    <img src="${globalState.playerAvatars?.[id]}" onerror="this.src='${FALLBACK_AVATAR}'">
                    <div>
                        <div class="font-header" style="font-size:1.6rem;color:${id===myUserId?'var(--accent-cyan)':'var(--text-main)'}">
                            ${name} ${id === myUserId ? '<span class="text-muted" style="font-size:0.8rem; vertical-align: middle;">(ВЫ)</span>' : ''} ${quarantineBadge}
                        </div>
                        ${pData.kicked?'<div class="text-danger font-header">ИЗГНАН</div>':''}
                    </div>
                </div>
                <div class="survivor-traits-grid">${traitsHTML}</div>
            </div>`;
    }).join('');

    const myData = globalState.playersData?.[myUserId];
    document.getElementById('ui-my-turn-hint').innerHTML = myData?.kicked 
        ? `<span class='text-danger'>Вы изолированы. Доступ к картам закрыт.</span>` 
        : isMyTurn ? `<span class='text-warning'>Вскройте ${getRoundRules(logic.round).revealsRequired} карт(у).</span>` : "Дождитесь очереди.";

    if (myData && myData.cards) {
        document.getElementById('my-cards-container').innerHTML = CARD_ORDER.map(cardKey => {
            const card = myData.cards[cardKey]; if(!card) return '';
            const canClick = isMyTurn && !myData.kicked && !card.isOpen;
            const clickFunc = cardKey === 'action' ? `startActionTargeting()` : `revealCard('${cardKey}')`;
            return `
                <div class="bunker-card ${card.isOpen?'revealed-card':'hidden-card'} ${!canClick?'disabled':''}" ${canClick?`onclick="${clickFunc}"`:''}>
                    <div class="card-content-wrapper">
                        <div class="type">${card.label}</div>
                        <div class="value">${card.value}</div>
                        <div class="status-badge font-header">${card.isOpen ? SVG_EYE+' ОТКРЫТО' : SVG_LOCK+' СКРЫТО'}</div>
                    </div>
                </div>`;
        }).join('');
    }
}

// --- ХОДЫ И ДЕЙСТВИЯ ---
function revealCard(cardKey) {
    const logic = globalState.gameLogic; 
    const required = getRoundRules(logic.round).revealsRequired;
    const cardName = globalState.playersData[myUserId].cards[cardKey].label;
    addLog(`${myName} открыл: ${cardName}`, "info");

    let newCount = (logic.revealedThisTurn || 0) + 1;
    const updates = {}; 
    updates[`playersData/${myUserId}/cards/${cardKey}/isOpen`] = true;
    
    if (newCount >= required) {
        let nextIdx = logic.activePlayerIndex + 1;
        if (nextIdx >= getAlivePlayers().length) { 
            updates['gameLogic/phase'] = 'discussion'; 
            updates['gameLogic/readyPlayers'] = null; 
        } else { 
            updates['gameLogic/activePlayerIndex'] = nextIdx; 
            updates['gameLogic/revealedThisTurn'] = 0; 
        }
    } else { 
        updates['gameLogic/revealedThisTurn'] = newCount; 
    }
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function toggleReady() {
    const updates = {};
    updates[`gameLogic/readyPlayers/${myUserId}`] = !(globalState.gameLogic?.readyPlayers?.[myUserId]);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

let currentActionTargeting = null;

function startActionTargeting() {
    const actionCard = globalState.playersData[myUserId].cards.action;
    currentActionTargeting = actionCard; 
    
    document.getElementById('target-action-name').innerText = actionCard.value;
    
    let availableTargets = [];
    if (actionCard.type === 'scavenge') {
        availableTargets = (globalState.players || []).filter(id => globalState.playersData[id].kicked);
        if (availableTargets.length === 0) {
            alert("Нет изгнанных игроков! Вы не можете применить Мародера сейчас.");
            return;
        }
    } else {
        availableTargets = getAlivePlayers().filter(id => id !== myUserId); 
    }

    document.getElementById('target-players-list').innerHTML = availableTargets.map(id => {
        let namePrefix = actionCard.type === 'scavenge' ? "<span class='text-danger' style='margin-right:8px;'>[МЕРТВ]</span>" : "";
        return `
        <div class="vote-item" onclick="executeAction('${id}')">
            <span class="font-header" style="font-size: 1.2rem;">${namePrefix}${globalState.playerNames?.[id]}</span>
            <button class="btn-primary" style="width: auto; padding: 10px;">ВЫБРАТЬ</button>
        </div>`
    }).join('');
    
    document.getElementById('target-selection-modal').classList.add('active');
}

function closeTargetSelection() { 
    document.getElementById('target-selection-modal').classList.remove('active'); 
    currentActionTargeting = null; 
}

function executeAction(targetId) {
    const action = currentActionTargeting; 
    const targetName = globalState.playerNames?.[targetId];
    addLog(`${myName} применил спецпротокол на ${targetName}`, "warning");

    // ИСПРАВЛЕНИЕ 1: Безопасное чтение старых значений (если цель none - избегаем ошибки)
    const sourceCard = globalState.playersData[myUserId].cards[action.targetTrait];
    const targetCard = globalState.playersData[targetId].cards[action.targetTrait];

    const activeAction = {
        sourceId: myUserId, targetId: targetId,
        cardLabel: action.label, cardText: action.value, 
        type: action.type, trait: action.targetTrait,
        sourceOldVal: sourceCard ? sourceCard.value : "—",
        targetOldVal: targetCard ? targetCard.value : "—"
    };

    closeTargetSelection();
    const updates = {};
    updates[`playersData/${myUserId}/cards/action/isOpen`] = true; 
    updates['gameLogic/phase'] = 'action_animation'; 
    updates['gameLogic/activeAction'] = activeAction;

    if (action.type === 'swap' && sourceCard && targetCard) {
        updates[`playersData/${myUserId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.sourceOldVal;
    } 
    else if (action.type === 'reveal' && targetCard) {
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
    }
    else if (action.type === 'quarantine') {
        updates[`gameLogic/quarantinedPlayers/${targetId}`] = true;
    }
    else if (action.type === 'raid' || action.type === 'scavenge') {
        updates[`playersData/${myUserId}/cards/baggage/value`] = activeAction.sourceOldVal + " <br><span class='text-accent'>+ [" + activeAction.targetOldVal + "]</span>";
        updates[`playersData/${targetId}/cards/baggage/value`] = "ПУСТО (Ограблен)";
    }

    let logic = globalState.gameLogic;
    if ((logic.revealedThisTurn || 0) + 1 >= getRoundRules(logic.round).revealsRequired) {
        let nextIdx = logic.activePlayerIndex + 1;
        if (nextIdx >= getAlivePlayers().length) { 
            updates['gameLogic/nextPhase'] = 'discussion'; updates['gameLogic/readyPlayers'] = null; 
        } else { 
            updates['gameLogic/nextPhase'] = 'reveal'; updates['gameLogic/activePlayerIndex'] = nextIdx; updates['gameLogic/revealedThisTurn'] = 0; 
        }
    } else {
        updates['gameLogic/nextPhase'] = 'reveal'; updates['gameLogic/revealedThisTurn'] = (logic.revealedThisTurn || 0) + 1;
    }

    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function submitVote(targetId) {
    if (globalState.gameLogic?.quarantinedPlayers?.[myUserId]) return; 
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
    if (!targetToKick) targetToKick = getRandom(getAlivePlayers());

    addLog(`Игрок ${globalState.playerNames?.[targetToKick]} изгнан.`, "danger");

    const updates = {}; 
    updates[`playersData/${targetToKick}/kicked`] = true; 
    updates['voting/active'] = false; 
    updates['gameLogic/phase'] = 'exile_animation'; 
    updates['gameLogic/exiledPlayer'] = targetToKick;
    
    updates['gameLogic/quarantinedPlayers'] = {}; 
    
    const capacity = globalState.world.capacity;
    updates['gameLogic/nextPhase'] = (getAlivePlayers().length - 1 <= capacity) ? 'ended' : 'reveal';
    
    if(updates['gameLogic/nextPhase'] === 'reveal') { 
        updates['gameLogic/round'] = globalState.gameLogic.round + 1; 
        updates['gameLogic/activePlayerIndex'] = 0; 
        updates['gameLogic/revealedThisTurn'] = 0; 
        updates['gameLogic/readyPlayers'] = null; 
    }

    window.parent.postMessage({ type: 'update_state', updates }, '*');
    setTimeout(() => { window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*'); }, 5000);
}

function exitToLobby() {
    if (!isHost) return;
    if (confirm("Вернуть всех в лобби? Игра будет завершена.")) {
        window.parent.postMessage({ type: 'play_again' }, '*');
    }
}