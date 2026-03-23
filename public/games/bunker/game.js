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
    Object.assign(database, {
        actionCards: actionsData,
        bio: bioData,
        professions: profData,
        healths: healthData,
        hobbies: hobbiesData,
        phobias: phobiasData,
        baggages: baggagesData,
        traits: traitsData,
        catastrophes: catastrophesData,
        bunkers: bunkersData
    });
    
    try {
        const checkIsHost = typeof isHost !== 'undefined' ? isHost : (new URLSearchParams(window.location.search).get('isHost') === 'true');
        if (checkIsHost) window.parent.postMessage({ type: 'start_game', settings: { mode: 'bunker' } }, '*'); 
    } catch(e) { console.error(e); }
}).catch(err => {
    console.error("Ошибка загрузки баз данных:", err);
});

window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        globalState = event.data.state || {};
        globalState.roomPlayers = event.data.roomPlayers || []; 
        handleStateChange();
        if(document.getElementById('logs-panel')?.classList.contains('active')) renderLogs();
    }
});

function handleStateChange() {
    if (!globalState.status || globalState.status === 'waiting') { 
        showScreen('loading-screen'); 
        return; 
    }
    
    if (globalState.status === 'playing') {
        if (!globalState.gameLogic) { 
            const checkIsHost = typeof isHost !== 'undefined' ? isHost : (new URLSearchParams(window.location.search).get('isHost') === 'true');
            if (checkIsHost) showScreen('setup-screen'); 
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
                quarantinedPlayers: {}, shieldedPlayers: {}, vetoPlayers: {}, gaggedTargets: {},
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

    document.getElementById('ingame-players-list').innerHTML = alivePlayers.map(id => {
        const pData = globalState.playersData?.[id] || {}; 
        const name = globalState.playerNames?.[id] || "Аноним";
        
        let badges = "";
        if (logic.quarantinedPlayers?.[id]) badges += `<span class="quarantine-badge">КАРАНТИН</span>`;
        if (logic.shieldedPlayers?.[id]) badges += `<span class="shield-badge" style="background:var(--accent-cyan);color:#000;padding:3px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;margin-left:10px;vertical-align:middle;">ИММУНИТЕТ</span>`;
        
        return `
            <div class="player-item aesthetic-player-card ${id === activePlayerId && logic.phase === 'reveal' ? 'active-turn' : ''}">
                <div class="player-header-row mb-10">
                    <img src="${globalState.playerAvatars?.[id]}" onerror="this.src=''">
                    <div>
                        <div class="font-header" style="font-size:1.6rem;color:${id===myUserId?'var(--accent-cyan)':'var(--text-main)'}">
                            ${name} ${id === myUserId ? '<span class="text-muted" style="font-size:0.8rem; vertical-align: middle;">(ВЫ)</span>' : ''} ${badges}
                        </div>
                    </div>
                </div>
                ${window.getPlayerTraitsHTML(pData)}
            </div>`;
    }).join('');

    const myData = globalState.playersData?.[myUserId];
    const hintEl = document.getElementById('ui-my-turn-hint');
    const cardsContainer = document.getElementById('my-cards-container');

    if (myData?.kicked) {
        hintEl.style.display = 'none'; 
        cardsContainer.innerHTML = `
            <div class="isolation-panel">
                <div class="isolation-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C7.58 2 4 5.58 4 10v4.58c0 1.25.75 2.37 1.89 2.83l1.84.74c1.17.47 1.94 1.62 1.94 2.89V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-.96c0-1.27.77-2.42 1.94-2.89l1.84-.74C21.25 16.95 22 15.83 22 14.58V10c0-4.42-3.58-8-8-8zm-3 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM9 16h6v2H9v-2z"/>
                    </svg>
                </div>
                <h2 class="isolation-title glitch-text">СИСТЕМА ЗАБЛОКИРОВАНА</h2>
                <p class="isolation-desc">Протокол изгнания завершен. Вы покинули бункер.<br>Доступ к терминалу и личным карточкам навсегда закрыт. Теперь вы находитесь в режиме наблюдения за выжившими.</p>
                <div class="isolation-scanline"></div>
            </div>
        `;
    } else {
        hintEl.style.display = 'block';
        hintEl.innerHTML = isMyTurn ? `<span class='text-warning'>Вскройте ${getRoundRules(logic.round).revealsRequired} карт(у).</span>` : "Дождитесь очереди.";

        if (myData && myData.cards) {
            cardsContainer.innerHTML = CARD_ORDER.map(cardKey => {
                const card = myData.cards[cardKey]; if(!card) return '';
                const canClick = isMyTurn && !card.isOpen;
                const clickFunc = cardKey === 'action' ? `startActionTargeting()` : `revealCard('${cardKey}')`;
                return `
                    <div class="bunker-card ${card.isOpen?'revealed-card':'hidden-card'} ${!canClick?'disabled':''}" ${canClick?`onclick="${clickFunc}"`:''}>
                        <div class="card-content-wrapper">
                            <div class="type">${card.label}</div>
                            <div class="value">${card.value}</div>
                            <div class="status-badge font-header">${card.isOpen ? 'ОТКРЫТО' : 'СКРЫТО'}</div>
                        </div>
                    </div>`;
            }).join('');
        }
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
    if (globalState.playersData?.[myUserId]?.kicked) return; 
    const updates = {};
    updates[`gameLogic/readyPlayers/${myUserId}`] = !(globalState.gameLogic?.readyPlayers?.[myUserId]);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

let currentActionTargeting = null;

function startActionTargeting() {
    const actionCard = globalState.playersData[myUserId].cards.action;
    currentActionTargeting = actionCard; 
    
    document.getElementById('target-action-name').innerText = actionCard.value;
    
    if (['shuffle', 'dictator_veto'].includes(actionCard.type)) {
        document.getElementById('target-players-list').innerHTML = `
            <div class="vote-item" onclick="executeAction('${myUserId}')" style="text-align: center;">
                <span class="font-header text-warning" style="font-size: 1.4rem;">ПРИМЕНИТЬ КО ВСЕМУ БУНКЕРУ</span>
            </div>`;
        document.getElementById('target-selection-modal').classList.add('active');
        return;
    }

    let availableTargets = getAlivePlayers();
    
    if (actionCard.type === 'scavenge') {
        availableTargets = (globalState.players || []).filter(id => globalState.playersData[id].kicked);
    } 
    else if (actionCard.type === 'shield') {
        availableTargets = getAlivePlayers(); 
    } 
    else {
        availableTargets = availableTargets.filter(id => id !== myUserId); 
    }

    availableTargets = availableTargets.filter(id => !(globalState.gameLogic?.gaggedTargets?.[myUserId]?.[id]));

    if (availableTargets.length === 0) {
        alert("Нет доступных целей для этого действия.");
        return;
    }

    document.getElementById('target-players-list').innerHTML = availableTargets.map(id => {
        let namePrefix = actionCard.type === 'scavenge' ? "<span class='text-danger' style='margin-right:8px;'>[МЕРТВ]</span>" : "";
        let isMe = id === myUserId ? "<span class='text-accent' style='margin-right:8px;'>[ВЫ САМИ]</span>" : "";
        return `
        <div class="vote-item" onclick="executeAction('${id}')">
            <span class="font-header" style="font-size: 1.2rem;">${namePrefix}${isMe}${globalState.playerNames?.[id]}</span>
            <button class="btn-primary" style="width: auto; padding: 10px;">ВЫБРАТЬ</button>
        </div>`
    }).join('');
    
    document.getElementById('target-selection-modal').classList.add('active');
}

function closeTargetSelection() { 
    document.getElementById('target-selection-modal').classList.remove('active'); 
    currentActionTargeting = null; 
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function executeAction(targetId) {
    const action = currentActionTargeting; 
    closeTargetSelection();

    const sourceCard = globalState.playersData[myUserId].cards[action.targetTrait];
    const targetCard = globalState.playersData[targetId]?.cards[action.targetTrait];

    const activeAction = {
        sourceId: myUserId, targetId: targetId,
        cardLabel: action.label, cardText: action.value, 
        type: action.type, trait: action.targetTrait,
        sourceOldVal: sourceCard ? sourceCard.value : "—",
        targetOldVal: targetCard ? targetCard.value : "—"
    };

    const updates = {};
    updates[`playersData/${myUserId}/cards/action/isOpen`] = true; 
    
    if (action.type === 'shield') {
        updates[`gameLogic/shieldedPlayers/${targetId}`] = true;
    } 
    else if (action.type === 'heal' && targetCard) {
        let val = action.targetTrait === 'health' ? "Абсолютно здоров" : "Отсутствуют (Излечен)";
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = val;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
        activeAction.targetNewVal = val;
    }
    else if (action.type === 'sabotage' && targetCard) {
        let newIllness = action.targetTrait === 'health' ? getRandom(database.healths) : getRandom(database.phobias);
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal + ` <br><span class='text-danger'>+ [${newIllness}]</span>`;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
        activeAction.targetNewVal = newIllness;
    }
    else if (action.type === 'dictator_veto') {
        updates[`gameLogic/vetoPlayers/${myUserId}`] = true;
    }
    else if (action.type === 'dictator_gag') {
        updates[`gameLogic/gaggedTargets/${targetId}/${myUserId}`] = true;
    }
    else if (action.type === 'shuffle') {
        const alive = getAlivePlayers();
        let traitsPool = alive.map(id => globalState.playersData[id].cards[action.targetTrait].value);
        shuffleArray(traitsPool);
        alive.forEach((id, index) => {
            updates[`playersData/${id}/cards/${action.targetTrait}/value`] = traitsPool[index];
            updates[`playersData/${id}/cards/${action.targetTrait}/isOpen`] = true;
        });
    }
    else if (action.type === 'reroll' && targetCard) {
        let newTraitValue = "Неизвестно";
        if (action.targetTrait === 'bio') newTraitValue = generateBio();
        else if (action.targetTrait === 'health') newTraitValue = getRandom(database.healths);
        else if (action.targetTrait === 'prof') newTraitValue = getRandom(database.professions);
        else if (action.targetTrait === 'hobby') newTraitValue = getRandom(database.hobbies);
        else if (action.targetTrait === 'phobia') newTraitValue = getRandom(database.phobias);
        else if (action.targetTrait === 'fact') newTraitValue = getRandom(database.traits);
        else if (action.targetTrait === 'baggage') newTraitValue = getRandom(database.baggages);
        
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = newTraitValue;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
        activeAction.targetNewVal = newTraitValue;
    } 
    else if (action.type === 'swap' && sourceCard && targetCard && activeAction.sourceOldVal !== "—" && activeAction.targetOldVal !== "—") {
        updates[`playersData/${myUserId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.sourceOldVal;
        updates[`playersData/${myUserId}/cards/${action.targetTrait}/isOpen`] = true;
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
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

    updates['gameLogic/phase'] = 'action_animation'; 
    updates['gameLogic/activeAction'] = activeAction;

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
    if (globalState.playersData?.[myUserId]?.kicked) return; 
    if (globalState.gameLogic?.quarantinedPlayers?.[myUserId]) return; 
    
    const updates = {}; 
    updates[`voting/results/${myUserId}`] = targetId;
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function executeExile() {
    const votes = globalState.voting?.results || {}; 
    const vetoes = globalState.gameLogic?.vetoPlayers || {};
    const voteCounts = {};
    
    Object.entries(votes).forEach(([voterId, tId]) => { 
        let weight = vetoes[voterId] ? 2 : 1;
        voteCounts[tId] = (voteCounts[tId] || 0) + weight; 
    });
    
    let maxVotes = 0; 
    let tiedPlayers = [];
    
    Object.entries(voteCounts).forEach(([tId, count]) => { 
        if (count > maxVotes) { 
            maxVotes = count; 
            tiedPlayers = [tId]; 
        } else if (count === maxVotes) {
            tiedPlayers.push(tId); 
        }
    });
    
    let availableForKick = tiedPlayers.length > 0 
        ? tiedPlayers.filter(id => !(globalState.gameLogic?.shieldedPlayers?.[id]))
        : getAlivePlayers().filter(id => !(globalState.gameLogic?.shieldedPlayers?.[id]));
        
    if (availableForKick.length === 0) {
        availableForKick = getAlivePlayers().filter(id => !(globalState.gameLogic?.shieldedPlayers?.[id]));
        if (availableForKick.length === 0) availableForKick = getAlivePlayers(); 
    }
        
    let targetToKick = availableForKick.length > 0 ? getRandom(availableForKick) : getRandom(getAlivePlayers());

    addLog(`Игрок ${globalState.playerNames?.[targetToKick]} изгнан.`, "danger");

    const updates = {}; 
    updates[`playersData/${targetToKick}/kicked`] = true; 
    updates['voting/active'] = false; 
    updates['gameLogic/phase'] = 'exile_animation'; 
    updates['gameLogic/exiledPlayer'] = targetToKick;
    
    updates['gameLogic/quarantinedPlayers'] = {}; 
    updates['gameLogic/shieldedPlayers'] = {};
    updates['gameLogic/vetoPlayers'] = {};
    
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