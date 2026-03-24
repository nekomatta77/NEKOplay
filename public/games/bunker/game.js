// ==========================================
// ИНИЦИАЛИЗАЦИЯ И СИНХРОНИЗАЦИЯ БАЗ ДАННЫХ
// ==========================================
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
        const checkIsHost = typeof window.isHost !== 'undefined' ? window.isHost : (new URLSearchParams(window.location.search).get('isHost') === 'true');
        if (checkIsHost) {
            window.parent.postMessage({ type: 'start_game', settings: { mode: 'bunker' } }, '*'); 
        }
    } catch(e) { 
        console.error(e); 
    }
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

// ==========================================
// ГЛОБАЛЬНЫЙ РОУТЕР СОСТОЯНИЙ
// ==========================================
function handleStateChange() {
    // Проверка ложной тревоги (из extensions.js)
    if (typeof checkThreats === 'function') checkThreats();

    if (!globalState.status || globalState.status === 'waiting') { 
        showScreen('loading-screen'); 
        return; 
    }
    
    if (globalState.status === 'playing') {
        if (!globalState.gameLogic) { 
            const checkIsHost = typeof window.isHost !== 'undefined' ? window.isHost : (new URLSearchParams(window.location.search).get('isHost') === 'true');
            if (checkIsHost) showScreen('setup-screen'); 
            else showScreen('guest-setup-screen'); 
            return; 
        }

        hideAllModals(); 
        
        if (globalState.gameLogic.phase === 'tie_roulette') {
            showScreen('game-screen');
            hideAllModals();
            if (typeof playRoulette === 'function' && globalState.gameLogic.rouletteData) {
                playRoulette(globalState.gameLogic.rouletteData);
            }
            return;
        }

        if (globalState.gameLogic.phase === 'action_animation') {
            showScreen('action-cinema-screen');
            playActionCinema(globalState.gameLogic.activeAction);
            return;
        }
        
        if (globalState.gameLogic.phase === 'ended') { 
            showScreen('end-screen'); 
            renderEndScreen(); 
            return; 
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

// ==========================================
// СОЗДАНИЕ МИРА И ИГРОКОВ (ХОСТ)
// ==========================================
window.confirmSetup = function() {
    const firstVoteRound = parseInt(document.getElementById('setting-first-vote-round').value) || 2;
    const doubleRound = parseInt(document.getElementById('setting-double-round').value) || 3;
    const threatsEnabled = document.getElementById('setting-threats')?.checked || false;
    const crisesEnabled = document.getElementById('setting-crises')?.checked || false;
    
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
            world: { 
                catastrophe: selectedCatastrophe, 
                bunker: selectedBunker, 
                capacity, 
                sharedStash: [] 
            }, 
            playersData: initialPlayersData, 
            logs: {},
            gameLogic: { 
                round: 1, 
                phase: 'reveal', 
                activePlayerIndex: 0, 
                revealedThisTurn: 0, 
                readyPlayers: {}, 
                quarantinedPlayers: {}, 
                shieldedPlayers: {}, 
                vetoPlayers: {}, 
                gaggedTargets: {},
                settings: { threats: threatsEnabled, crises: crisesEnabled },
                rules: { firstVoteRound: firstVoteRound, doubleRevealRound: doubleRound } 
            },
            voting: null 
        } 
    }, '*');
    addLog("Симуляция запущена.", "success");
};

function checkHostAutomations() {
    if (!window.isHost) return;
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

// ==========================================
// РЕНДЕР ОСНОВНОГО ИНТЕРФЕЙСА ИГРЫ
// ==========================================
function renderGame() {
    const world = globalState.world || {}; 
    const logic = globalState.gameLogic || {}; 
    const alivePlayers = getAlivePlayers();
    
    let activePlayerId = alivePlayers[logic.activePlayerIndex];
    if (!activePlayerId && logic.phase === 'reveal' && window.isHost) {
        window.parent.postMessage({ type: 'update_state', updates: {'gameLogic/activePlayerIndex': 0} }, '*');
    }
    const isMyTurn = (activePlayerId === window.myUserId) && (logic.phase === 'reveal');

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

    // Отрисовка ОБЩЕГО СКЛАДА
    let stashHTML = '';
    if (world.sharedStash && world.sharedStash.length > 0) {
        stashHTML = `
        <div class="aesthetic-player-card mb-15" style="border-color: var(--warning); background: rgba(255, 171, 0, 0.05); padding: 15px;">
            <div class="font-header" style="color: var(--warning); font-size: 1.2rem; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
                ОБЩИЙ СКЛАД БУНКЕРА
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${world.sharedStash.map(item => `<span style="background: rgba(0,0,0,0.5); padding: 5px 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid rgba(255,171,0,0.3);">${item}</span>`).join('')}
            </div>
        </div>`;
    }

    document.getElementById('ingame-players-list').innerHTML = stashHTML + alivePlayers.map(id => {
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
                        <div class="font-header" style="font-size:1.6rem;color:${id === window.myUserId ? 'var(--accent-cyan)' : 'var(--text-main)'}">
                            ${name} ${id === window.myUserId ? '<span class="text-muted" style="font-size:0.8rem; vertical-align: middle;">(ВЫ)</span>' : ''} ${badges}
                        </div>
                    </div>
                </div>
                ${window.getPlayerTraitsHTML(pData)}
            </div>`;
    }).join('');

    const myData = globalState.playersData?.[window.myUserId];
    const hintEl = document.getElementById('ui-my-turn-hint');
    const cardsContainer = document.getElementById('my-cards-container');

    if (myData?.kicked) {
        // ИНТЕРФЕЙС ИЗГНАННОГО ИГРОКА
        hintEl.style.display = 'none'; 
        cardsContainer.innerHTML = `
            <div class="isolation-panel">
                <div class="isolation-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C7.58 2 4 5.58 4 10v4.58c0 1.25.75 2.37 1.89 2.83l1.84.74c1.17.47 1.94 1.62 1.94 2.89V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-.96c0-1.27.77-2.42 1.94-2.89l1.84-.74C21.25 16.95 22 15.83 22 14.58V10c0-4.42-3.58-8-8-8zm-3 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM9 16h6v2H9v-2z"/>
                    </svg>
                </div>
                <h2 class="isolation-title glitch-text">СИСТЕМА ЗАБЛОКИРОВАНА</h2>
                <p class="isolation-desc mb-20">Протокол изгнания завершен. Вы покинули бункер.<br>Доступ к терминалу и личным карточкам навсегда закрыт.</p>
                
                ${logic.settings?.threats ? `
                    <div style="background: rgba(255, 0, 0, 0.1); padding: 15px; border-radius: 12px; border: 1px dashed var(--danger); max-width: 400px; z-index: 5;">
                        <h4 class="text-danger mb-10 font-header" style="font-size: 1.2rem;">ТЕРМИНАЛ САБОТАЖА</h4>
                        <button class="btn-danger full-width glow-hover" onclick="triggerThreat('false_alarm')">⚠ ЛОЖНАЯ ТРЕВОГА</button>
                    </div>
                ` : ''}

                <div class="isolation-scanline"></div>
            </div>
        `;
    } else {
        hintEl.style.display = 'block';
        hintEl.innerHTML = isMyTurn ? `<span class='text-warning'>Вскройте ${getRoundRules(logic.round).revealsRequired} карт(у).</span>` : "Дождитесь очереди.";

        if (myData && myData.cards) {
            const closedCards = CARD_ORDER.filter(key => myData.cards[key] && !myData.cards[key].isOpen);
            let cardsHTML = '';
            
            // ЕСЛИ НЕЧЕГО ОТКРЫВАТЬ - КНОПКА ПРОПУСКА ХОДА
            if (isMyTurn && closedCards.length === 0) {
                cardsHTML += `
                    <div class="full-width aesthetic-player-card text-center mb-15" style="grid-column: 1 / -1; border-color: var(--success); box-shadow: 0 0 20px rgba(0,230,118,0.2);">
                        <h3 class="font-header text-success mb-10" style="font-size: 1.5rem;">ДОСЬЕ ПОЛНОСТЬЮ РАСКРЫТО</h3>
                        <p class="text-muted mb-15">У вас больше нет скрытой информации.</p>
                        <button class="btn-primary" onclick="skipRevealTurn()" style="margin: 0 auto; background: rgba(0,230,118,0.1); border-color: var(--success); color: var(--success);">ПЕРЕДАТЬ ХОД</button>
                    </div>
                `;
            }

            cardsHTML += CARD_ORDER.map(cardKey => {
                const card = myData.cards[cardKey]; 
                if(!card) return '';
                
                const canClick = isMyTurn && !card.isOpen;
                const clickFunc = cardKey === 'action' ? `startActionTargeting()` : `openCardMenu('${cardKey}')`;
                
                return `
                    <div class="bunker-card ${card.isOpen ? 'revealed-card' : 'hidden-card'} ${!canClick ? 'disabled' : ''}" ${canClick ? `onclick="${clickFunc}"` : ''}>
                        <div class="card-content-wrapper">
                            <div class="type">${card.label}</div>
                            <div class="value">${card.value}</div>
                            <div class="status-badge font-header">${card.isOpen ? 'ОТКРЫТО' : 'СКРЫТО'}</div>
                        </div>
                    </div>`;
            }).join('');
            
            cardsContainer.innerHTML = cardsHTML;
        }
    }
}

// ==========================================
// ЛОГИКА ХОДОВ И КАРТОЧЕК
// ==========================================
window.revealCard = function(cardKey) {
    const logic = globalState.gameLogic; 
    const required = getRoundRules(logic.round).revealsRequired;
    const cardName = globalState.playersData[window.myUserId].cards[cardKey].label;
    
    if (typeof addLog === 'function') {
        addLog(`${window.myName} открыл: ${cardName}`, "info");
    }

    let newCount = (logic.revealedThisTurn || 0) + 1;
    const updates = {}; 
    updates[`playersData/${window.myUserId}/cards/${cardKey}/isOpen`] = true;
    
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
};

window.skipRevealTurn = function() {
    const logic = globalState.gameLogic;
    const required = getRoundRules(logic.round).revealsRequired;
    let newCount = (logic.revealedThisTurn || 0) + 1;
    const updates = {}; 
    
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
    
    if (typeof addLog === 'function') {
        addLog(`${window.myName} пропустил вскрытие (нет скрытых данных).`, "info");
    }
    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

window.toggleReady = function() {
    if (globalState.playersData?.[window.myUserId]?.kicked) return; 
    const updates = {};
    updates[`gameLogic/readyPlayers/${window.myUserId}`] = !(globalState.gameLogic?.readyPlayers?.[window.myUserId]);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

// ==========================================
// ЛОГИКА ДЕЙСТВИЙ (ACTION КАРТЫ)
// ==========================================
let currentActionTargeting = null;

window.startActionTargeting = function() {
    const actionCard = globalState.playersData[window.myUserId].cards.action;
    currentActionTargeting = actionCard; 
    
    document.getElementById('target-action-name').innerText = actionCard.value;
    
    if (['shuffle', 'dictator_veto'].includes(actionCard.type)) {
        document.getElementById('target-players-list').innerHTML = `
            <div class="vote-item" onclick="executeAction('${window.myUserId}')" style="text-align: center;">
                <span class="font-header text-warning" style="font-size: 1.4rem;">ПРИМЕНИТЬ КО ВСЕМУ БУНКЕРУ</span>
            </div>`;
        document.getElementById('target-selection-modal').classList.add('active');
        return;
    }

    let availableTargets = getAlivePlayers();
    
    if (actionCard.type === 'scavenge') {
        availableTargets = (globalState.players || []).filter(id => globalState.playersData[id].kicked);
    } else if (actionCard.type === 'shield') {
        availableTargets = getAlivePlayers(); 
    } else {
        availableTargets = availableTargets.filter(id => id !== window.myUserId); 
    }

    availableTargets = availableTargets.filter(id => !(globalState.gameLogic?.gaggedTargets?.[window.myUserId]?.[id]));

    if (availableTargets.length === 0) { 
        alert("Нет доступных целей для этого действия."); 
        return; 
    }

    document.getElementById('target-players-list').innerHTML = availableTargets.map(id => {
        let namePrefix = actionCard.type === 'scavenge' ? "<span class='text-danger' style='margin-right:8px;'>[МЕРТВ]</span>" : "";
        let isMe = id === window.myUserId ? "<span class='text-accent' style='margin-right:8px;'>[ВЫ САМИ]</span>" : "";
        return `
        <div class="vote-item" onclick="executeAction('${id}')">
            <span class="font-header" style="font-size: 1.2rem;">${namePrefix}${isMe}${globalState.playerNames?.[id]}</span>
            <button class="btn-primary" style="width: auto; padding: 10px;">ВЫБРАТЬ</button>
        </div>`
    }).join('');
    
    document.getElementById('target-selection-modal').classList.add('active');
};

window.closeTargetSelection = function() { 
    document.getElementById('target-selection-modal').classList.remove('active'); 
    currentActionTargeting = null; 
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [array[i], array[j]] = [array[j], array[i]]; 
    }
}

window.executeAction = function(targetId) {
    const action = currentActionTargeting; 
    closeTargetSelection();

    const sourceCard = globalState.playersData[window.myUserId].cards[action.targetTrait];
    const targetCard = globalState.playersData[targetId]?.cards[action.targetTrait];

    const activeAction = {
        sourceId: window.myUserId, targetId: targetId,
        cardLabel: action.label, cardText: action.value, 
        type: action.type, trait: action.targetTrait,
        sourceOldVal: sourceCard ? sourceCard.value : "—",
        targetOldVal: targetCard ? targetCard.value : "—"
    };

    const updates = {};
    updates[`playersData/${window.myUserId}/cards/action/isOpen`] = true; 
    
    if (action.type === 'shield') {
        updates[`gameLogic/shieldedPlayers/${targetId}`] = true;
    } else if (action.type === 'heal' && targetCard) { 
        let val = action.targetTrait === 'health' ? "Абсолютно здоров" : "Отсутствуют (Излечен)"; 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = val; 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true; 
        activeAction.targetNewVal = val; 
    } else if (action.type === 'sabotage' && targetCard) { 
        let newIllness = action.targetTrait === 'health' ? getRandom(database.healths) : getRandom(database.phobias); 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal + ` <br><span class='text-danger'>+ [${newIllness}]</span>`; 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true; 
        activeAction.targetNewVal = newIllness; 
    } else if (action.type === 'dictator_veto') {
        updates[`gameLogic/vetoPlayers/${window.myUserId}`] = true;
    } else if (action.type === 'dictator_gag') {
        updates[`gameLogic/gaggedTargets/${targetId}/${window.myUserId}`] = true;
    } else if (action.type === 'shuffle') { 
        const alive = getAlivePlayers(); 
        let traitsPool = alive.map(id => globalState.playersData[id].cards[action.targetTrait].value); 
        shuffleArray(traitsPool); 
        alive.forEach((id, index) => { 
            updates[`playersData/${id}/cards/${action.targetTrait}/value`] = traitsPool[index]; 
            updates[`playersData/${id}/cards/${action.targetTrait}/isOpen`] = true; 
        }); 
    } else if (action.type === 'reroll' && targetCard) { 
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
    } else if (action.type === 'swap' && sourceCard && targetCard && activeAction.sourceOldVal !== "—" && activeAction.targetOldVal !== "—") { 
        updates[`playersData/${window.myUserId}/cards/${action.targetTrait}/value`] = activeAction.targetOldVal; 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/value`] = activeAction.sourceOldVal; 
        updates[`playersData/${window.myUserId}/cards/${action.targetTrait}/isOpen`] = true; 
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true; 
    } else if (action.type === 'reveal' && targetCard) {
        updates[`playersData/${targetId}/cards/${action.targetTrait}/isOpen`] = true;
    } else if (action.type === 'quarantine') {
        updates[`gameLogic/quarantinedPlayers/${targetId}`] = true;
    } else if (action.type === 'raid' || action.type === 'scavenge') { 
        updates[`playersData/${window.myUserId}/cards/baggage/value`] = activeAction.sourceOldVal + " <br><span class='text-accent'>+ [" + activeAction.targetOldVal + "]</span>"; 
        updates[`playersData/${targetId}/cards/baggage/value`] = "ПУСТО (Ограблен)"; 
    }

    updates['gameLogic/phase'] = 'action_animation'; 
    updates['gameLogic/activeAction'] = activeAction;

    let logic = globalState.gameLogic;
    if ((logic.revealedThisTurn || 0) + 1 >= getRoundRules(logic.round).revealsRequired) {
        let nextIdx = logic.activePlayerIndex + 1;
        if (nextIdx >= getAlivePlayers().length) { 
            updates['gameLogic/nextPhase'] = 'discussion'; 
            updates['gameLogic/readyPlayers'] = null; 
        } else { 
            updates['gameLogic/nextPhase'] = 'reveal'; 
            updates['gameLogic/activePlayerIndex'] = nextIdx; 
            updates['gameLogic/revealedThisTurn'] = 0; 
        }
    } else { 
        updates['gameLogic/nextPhase'] = 'reveal'; 
        updates['gameLogic/revealedThisTurn'] = (logic.revealedThisTurn || 0) + 1; 
    }

    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

// ==========================================
// ЛОГИКА ГОЛОСОВАНИЯ
// ==========================================
window.submitVote = function(targetId) {
    if (globalState.playersData?.[window.myUserId]?.kicked) return; 
    if (globalState.gameLogic?.quarantinedPlayers?.[window.myUserId]) return; 
    const updates = {}; 
    updates[`voting/results/${window.myUserId}`] = targetId;
    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

window.executeExile = function() {
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
        if (availableForKick.length === 0) {
            availableForKick = getAlivePlayers(); 
        }
    }
        
    let targetToKick = availableForKick.length > 0 ? getRandom(availableForKick) : getRandom(getAlivePlayers());

    // ЕСЛИ НИЧЬЯ - ЗАПУСКАЕМ РУЛЕТКУ (extensions.js)
    if (tiedPlayers.length > 1) {
        const updates = {};
        updates['gameLogic/phase'] = 'tie_roulette';
        updates['gameLogic/rouletteData'] = { tiedPlayers: availableForKick, loserId: targetToKick };
        updates['voting/active'] = false;
        window.parent.postMessage({ type: 'update_state', updates }, '*');
        return; 
    }

    if (typeof addLog === 'function') {
        addLog(`Игрок ${globalState.playerNames?.[targetToKick]} изгнан большинством голосов.`, "danger");
    }
    
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
    setTimeout(() => { 
        window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*'); 
    }, 5000);
};

window.exitToLobby = function() {
    if (!window.isHost) return;
    if (confirm("Вернуть всех в лобби? Игра будет завершена.")) {
        window.parent.postMessage({ type: 'play_again' }, '*');
    }
};

// ==========================================
// ИИ-ГЕНЕРАТОР СЮЖЕТА И ФИНАЛ
// ==========================================
function getApiKey() {
    // Вставь сюда свой зашифрованный ключ или храни в .env на сервере
    const SECRET_KEY_BASE64 = "c2stb3ItdjEtNjMxNzBjYWNmOTBkZDc0MjA5Mzk3YTBhZWYyMjdhNDM1ZmIyMmVkZmQ2NTQ5OWQxZDYxZTU0NWY5NTcxMWVjMg==";
    try { return atob(SECRET_KEY_BASE64); } catch(e) { return ""; }
}

const StoryGenerator = {
    async generate(aliveIds, playersData, world, onChunk) {
        const apiKey = getApiKey();
        if (!apiKey || apiKey.length < 10) {
            return "СИСТЕМНАЯ ОШИБКА: Ключ API не найден. Проверьте настройки.";
        }

        if (!world.catastrophe || !world.bunker) return "Данные о мире утеряны...";

        let survivorsInfo = aliveIds.map(id => {
            const p = playersData[id].cards;
            return `ИГРОК: ${globalState.playerNames?.[id]}
            - Биография: ${p.bio?.value || 'Неизвестно'}
            - Профессия: ${p.prof?.value || 'Неизвестно'}
            - Здоровье: ${p.health?.value || 'Неизвестно'}
            - Багаж: ${p.baggage?.value || 'Пусто'}
            - Фобия: ${p.phobia?.value || 'Нет'}
            - Хобби: ${p.hobby?.value || 'Нет'}
            - Факт/Особенность: ${p.fact?.value || 'Нет'}`;
        }).join("\n\n");

        const prompt = `Ты — суровый ИИ-рассказчик, пишущий детализированные, мрачные или реалистичные концовки для игры "Бункер".
        САМОЕ ГЛАВНОЕ ПРАВИЛО: ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!

        ДАННЫЕ О МИРЕ:
        Катастрофа на поверхности: ${world.catastrophe.title} (${world.catastrophe.description}).
        Характеристики бункера: ${world.bunker.title} (${world.bunker.description}).
        
        ВЫЖИВШИЕ ВНУТРИ:
        ${survivorsInfo}
        
        ЗАДАЧА:
        Напиши логичную, захватывающую и атмосферную концовку на 3-4 абзаца. Ты должен сплести все эти элементы воедино:
        1. Хватит ли им ресурсов именно этого бункера, чтобы пережить именно эту катастрофу? 
        2. Обязательно опиши, как пригодились (или помешали) их профессии и багаж для выживания.
        3. Учти их здоровье, фобии, факты и хобби. Если в бункере есть тяжелобольные — опиши, смогли ли их вылечить или они стали обузой. 
        4. Не делай концовку всегда счастливой. Если набор выживших ужасен — они должны столкнуться с суровыми проблемами.
        
        Пиши художественным текстом в стиле постапокалипсиса. Не используй списки, жирный шрифт или звездочки.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); 

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Bunker Simulation'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'arcee-ai/trinity-large-preview:free', 
                    messages: [{ role: 'user', content: prompt }], 
                    max_tokens: 1000,
                    temperature: 0.8,
                    stream: true
                })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return `ОШИБКА: Нейросеть недоступна (Код ${response.status}).`;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                fullText += data.choices[0].delta.content;
                                if (onChunk) onChunk(fullText);
                            }
                        } catch(e) {}
                    }
                }
            }
            
            if (!fullText || fullText.trim() === "") {
                return "Связь с поверхностью прервана. ИИ-система не смогла передать отчет. Дальнейшая судьба выживших неизвестна.";
            }
            return fullText;
        } catch (e) {
            clearTimeout(timeoutId);
            return "Связь с ИИ-системой прервана. Проверьте интернет.";
        }
    }
};

let aiStoryGenerated = false;

window.renderEndScreen = async function() {
    const aliveIds = getAlivePlayers();
    
    document.getElementById('winners-list').innerHTML = aliveIds.map(id => `
        <div class="player-item mb-10" style="border-color:rgba(0,230,118,0.5);background:rgba(0, 230, 118, 0.05);padding:12px">
            <div class="player-header-row">
                <img src="${globalState.playerAvatars?.[id]}" onerror="this.src=''" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
                <div class="font-header" style="font-size:1.4rem;color:var(--success)">${globalState.playerNames?.[id]}</div>
            </div>
        </div>`).join('');
        
    if (window.isHost) {
        document.getElementById('btn-exit-lobby').style.display = 'block';
    }

    const storyEl = document.getElementById('ai-story-text');

    if (globalState.gameLogic?.aiStory) {
        if (storyEl.getAttribute('data-loaded') !== 'true') {
            storyEl.setAttribute('data-loaded', 'true');
            if (!window.isHost) {
                storyEl.innerText = "";
                let i = 0;
                const text = globalState.gameLogic.aiStory;
                const typeInterval = setInterval(() => {
                    storyEl.innerText += text.charAt(i); i++;
                    const screen = document.getElementById('end-screen'); 
                    screen.scrollTop = screen.scrollHeight;
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
        if (window.isHost) {
            storyEl.innerText = "Подключение к нейросети... Генерация отчета..."; 
            const finalText = await StoryGenerator.generate(aliveIds, globalState.playersData, globalState.world, (newText) => {
                storyEl.innerText = newText;
                const screen = document.getElementById('end-screen'); 
                screen.scrollTop = screen.scrollHeight;
            });
            window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/aiStory': finalText } }, '*');
        } else {
            storyEl.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin-bottom: 10px;"></div> <br>Ожидание отчета от лидера...`;
        }
    }
};