fetch('cards.json').then(res => res.json()).then(data => { 
    database = data; 
    if (isHost) window.parent.postMessage({ type: 'start_game', settings: { mode: 'bunker' } }, '*'); 
});

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
            if (isHost) showScreen('setup-screen'); 
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

function confirmSetup() {
    const voteR1 = document.getElementById('setting-vote-r1').value === 'true';
    const doubleRound = parseInt(document.getElementById('setting-double-round').value);
    
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

    // Берем объекты угрозы и убежища целиком
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
                rules: { voteRound1: voteR1, doubleRevealRound: doubleRound } 
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

function renderGame() {
    const world = globalState.world || {}; 
    const logic = globalState.gameLogic || {}; 
    const alivePlayers = getAlivePlayers();
    
    let activePlayerId = alivePlayers[logic.activePlayerIndex];
    if (!activePlayerId && logic.phase === 'reveal' && isHost) {
        window.parent.postMessage({ type: 'update_state', updates: {'gameLogic/activePlayerIndex': 0} }, '*');
    }
    const isMyTurn = (activePlayerId === myUserId) && (logic.phase === 'reveal');

    // Отрисовка названия Угрозы и Убежища из объектов
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
        
        return `
            <div class="player-item ${pData.kicked ? 'kicked' : ''} ${id === activePlayerId && logic.phase === 'reveal' ? 'active-turn' : ''}">
                <div class="player-header-row">
                    <img src="${globalState.playerAvatars?.[id]}">
                    <div>
                        <div class="font-header" style="font-size:1.6rem;color:${id===myUserId?'var(--accent-cyan)':'var(--text-main)'}">
                            ${name} ${id === myUserId ? '<span class="text-muted" style="font-size:0.8rem; vertical-align: middle;">(ВЫ)</span>' : ''}
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
                    </div>
                    <div class="status-badge font-header">${card.isOpen?SVG_EYE+' ОТКРЫТО':SVG_LOCK+' СКРЫТО'}</div>
                </div>`;
        }).join('');
    }
}

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
    document.getElementById('target-selection-modal').classList.add('active');
    
    document.getElementById('target-players-list').innerHTML = getAlivePlayers().map(id => `
        <div class="vote-item" onclick="executeAction('${id}')">
            <span class="font-header" style="font-size: 1.2rem;">${globalState.playerNames?.[id]}</span>
            <button class="btn-primary" style="width: auto; padding: 10px;">ВЫБРАТЬ</button>
        </div>`
    ).join('');
}

function closeTargetSelection() { 
    document.getElementById('target-selection-modal').classList.remove('active'); 
    currentActionTargeting = null; 
}

function executeAction(targetId) {
    const action = currentActionTargeting; 
    const targetName = globalState.playerNames?.[targetId];
    addLog(`${myName} применил спецпротокол на ${targetName}`, "warning");

    const activeAction = {
        sourceId: myUserId, targetId: targetId,
        cardLabel: action.label, cardText: action.value, 
        type: action.type, trait: action.targetTrait, result: action.result,
        sourceOldVal: globalState.playersData[myUserId].cards[action.targetTrait]?.value,
        targetOldVal: globalState.playersData[targetId].cards[action.targetTrait]?.value
    };

    closeTargetSelection();

    const updates = {};
    updates[`playersData/${myUserId}/cards/action/isOpen`] = true; 
    updates['gameLogic/phase'] = 'action_animation'; 
    updates['gameLogic/activeAction'] = activeAction;

    if (action.type === 'heal' || action.type === 'destroy') {
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = action.result;
    } else if (action.type === 'swap') {
        updates[`playersData/${myUserId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.sourceOldVal;
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