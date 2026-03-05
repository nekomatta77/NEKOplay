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

function hideAllModals() {
    document.getElementById('voting-modal').classList.remove('active');
    document.getElementById('discussion-modal').classList.remove('active');
    document.getElementById('target-selection-modal').classList.remove('active');
    document.getElementById('world-detail-modal').classList.remove('active');
}

function toggleLogs() { 
    const panel = document.getElementById('logs-panel'); 
    panel.classList.toggle('active'); 
    renderLogs(); 
}

function renderLogs() {
    const container = document.getElementById('logs-container');
    const logs = globalState.logs || {};
    const sortedLogs = Object.values(logs).sort((a,b) => a.time.localeCompare(b.time));
    container.innerHTML = sortedLogs.map(l => `<div class="log-item ${l.type}"><div class="log-time">${l.time}</div><div>${l.text}</div></div>`).join('');
    container.scrollTop = container.scrollHeight;
}

function showWorldDetail(type) {
    const modal = document.getElementById('world-detail-modal');
    const titleEl = document.getElementById('world-detail-title');
    const descEl = document.getElementById('world-detail-desc');

    if (type === 'catastrophe') {
        titleEl.innerText = globalState.world.catastrophe.title;
        titleEl.className = "font-header text-danger mb-15";
        descEl.innerText = globalState.world.catastrophe.description;
    } else {
        titleEl.innerText = globalState.world.bunker.title;
        titleEl.className = "font-header text-accent mb-15";
        descEl.innerText = globalState.world.bunker.description;
    }
    
    modal.classList.add('active');
}

function closeWorldDetail() {
    document.getElementById('world-detail-modal').classList.remove('active');
}

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

let isPlayingAnimation = false;

function playActionCinema(actionData) {
    if (isPlayingAnimation) return;
    isPlayingAnimation = true;
    
    document.getElementById('cinema-card-phase').classList.add('active');
    document.getElementById('cinema-effect-phase').classList.remove('active');
    
    const cardEl = document.getElementById('cinema-card');
    cardEl.classList.remove('card-dissolve');
    
    const cardLabel = actionData.cardLabel || "СПЕЦПРОТОКОЛ";
    document.getElementById('cinema-title').innerText = "ПРОТОКОЛ: " + cardLabel.toUpperCase();
    document.getElementById('cinema-card-text').innerText = actionData.cardText;

    setTimeout(() => {
        cardEl.classList.add('card-dissolve');
    }, 2000);

    setTimeout(() => {
        document.getElementById('cinema-card-phase').classList.remove('active');
        document.getElementById('cinema-effect-phase').classList.add('active');

        const p1 = document.getElementById('effect-p1'); 
        const p2 = document.getElementById('effect-p2');
        const trait1 = document.getElementById('ep1-trait'); 
        const trait2 = document.getElementById('ep2-trait');
        const icon = document.getElementById('effect-center-icon');

        document.getElementById('ep1-avatar').src = globalState.playerAvatars?.[actionData.sourceId];
        document.getElementById('ep1-name').innerText = globalState.playerNames?.[actionData.sourceId];
        trait1.innerText = actionData.sourceOldVal;
        
        trait1.className = 'survivor-trait effect-trait mt-10';
        trait1.style.color = '';
        trait1.style.textShadow = '';

        if (actionData.type === 'swap') {
            p2.style.display = 'block';
            document.getElementById('ep2-avatar').src = globalState.playerAvatars?.[actionData.targetId];
            document.getElementById('ep2-name').innerText = globalState.playerNames?.[actionData.targetId];
            trait2.innerText = actionData.targetOldVal;
            trait2.className = 'survivor-trait effect-trait mt-10';
            icon.innerText = '↔';

            setTimeout(() => {
                trait1.classList.add('anim-swap-left'); 
                trait2.classList.add('anim-swap-right');
            }, 1000);

        } else if (actionData.type === 'heal' || actionData.type === 'destroy') {
            p2.style.display = 'none'; 
            document.getElementById('ep1-avatar').src = globalState.playerAvatars?.[actionData.targetId];
            document.getElementById('ep1-name').innerText = globalState.playerNames?.[actionData.targetId];
            trait1.innerText = actionData.targetOldVal;
            icon.innerText = actionData.type === 'heal' ? '✚' : '☠';

            setTimeout(() => {
                if (actionData.type === 'heal') { 
                    trait1.classList.add('anim-heal'); 
                } else { 
                    trait1.classList.add('anim-destroy'); 
                }
                
                setTimeout(() => { 
                    trait1.innerText = actionData.result; 
                    if (actionData.type === 'destroy') {
                        trait1.classList.remove('anim-destroy');
                        trait1.classList.add('anim-recovered');
                    }
                }, 800);
            }, 1000);
        }

        setTimeout(() => {
            isPlayingAnimation = false;
            if (isHost) window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*');
        }, 3800);
    }, 3500);
}

let votingInterval;
function handleVotingUI() {
    const modal = document.getElementById('voting-modal');
    if (globalState.voting?.active && globalState.gameLogic?.phase === 'voting') {
        modal.classList.add('active');
        renderVotingList();
        
        clearInterval(votingInterval);
        votingInterval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil(((globalState.voting?.endTime || Date.now()) - Date.now()) / 1000));
            document.getElementById('voting-timer').innerText = timeLeft;
            
            if (isHost && (timeLeft <= 0 || Object.keys(globalState.voting?.results || {}).length >= getAlivePlayers().length)) {
                clearInterval(votingInterval); 
                executeExile();
            }
        }, 1000);
    } else { 
        clearInterval(votingInterval); 
        modal.classList.remove('active'); 
    }
}

function renderVotingList() {
    const container = document.getElementById('voting-players');
    const alivePlayers = getAlivePlayers();
    const myVote = globalState.voting?.results?.[myUserId]; 
    
    const votesCount = Object.keys(globalState.voting?.results || {}).length;
    const counterEl = document.getElementById('voting-counter');
    if (counterEl) counterEl.innerText = `${votesCount} / ${alivePlayers.length}`;

    container.innerHTML = alivePlayers.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const isSelected = myVote === id;
        const isDimmed = myVote && !isSelected;
        const btnText = myVote ? (isSelected ? `${SVG_TARGET} ВЫБРАН` : '---') : 'УДАЛИТЬ';
        
        let itemClass = "vote-item";
        if (isSelected) itemClass += " selected";
        if (isDimmed) itemClass += " dimmed";

        const onClick = myVote ? '' : `onclick="submitVote('${id}')"`;

        return `
            <div class="${itemClass}" ${onClick}>
                <span class="font-header" style="font-size: 1.2rem; letter-spacing: 1px;">${name}</span>
                <button class="btn-primary" style="width: auto; padding: 10px 18px;" ${myVote ? 'disabled' : ''}>${btnText}</button>
            </div>`;
    }).join('');
}

// --- ИЗМЕНЕНА ДЛЯ СИНХРОНИЗАЦИИ КОНЦОВКИ У ВСЕХ ---
let aiStoryGenerated = false;

async function renderEndScreen() {
    const aliveIds = getAlivePlayers();
    
    document.getElementById('winners-list').innerHTML = aliveIds.map(id => `
        <div class="player-item mb-10" style="border-color:rgba(0,230,118,0.5);background:rgba(0, 230, 118, 0.05);padding:12px">
            <img src="${globalState.playerAvatars?.[id]}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
            <div class="font-header" style="font-size:1.2rem;color:var(--success)">${globalState.playerNames?.[id]}</div>
        </div>`).join('');
        
    if (isHost) {
        document.getElementById('btn-exit-lobby').style.display = 'block';
    }

    const storyEl = document.getElementById('ai-story-text');

    // 1. Если история уже сгенерирована хостом и лежит в общей базе:
    if (globalState.gameLogic?.aiStory) {
        if (storyEl.getAttribute('data-loaded') !== 'true') {
            storyEl.setAttribute('data-loaded', 'true');
            
            // Если это гость — делаем красивую имитацию печати текста
            if (!isHost) {
                storyEl.innerText = "";
                let i = 0;
                const text = globalState.gameLogic.aiStory;
                const typeInterval = setInterval(() => {
                    storyEl.innerText += text.charAt(i);
                    i++;
                    const screen = document.getElementById('end-screen');
                    screen.scrollTop = screen.scrollHeight;
                    if (i >= text.length) clearInterval(typeInterval);
                }, 15); // Скорость печати для гостей
            } else {
                // Хост уже видел печать во время самой генерации
                storyEl.innerText = globalState.gameLogic.aiStory;
            }
        }
        return;
    }

    // 2. Если история еще НЕ сгенерирована (мы только попали на экран)
    if (!aiStoryGenerated) {
        aiStoryGenerated = true; 
        
        if (isHost) {
            storyEl.innerText = "Подключение к нейросети... Генерация отчета..."; 
            
            // ТОЛЬКО ХОСТ стучится в нейросеть
            const finalText = await StoryGenerator.generate(aliveIds, globalState.playersData, globalState.world, (newText) => {
                storyEl.innerText = newText;
                const screen = document.getElementById('end-screen');
                screen.scrollTop = screen.scrollHeight;
            });
            
            // Когда хост закончил, он сохраняет финал для всех остальных игроков
            window.parent.postMessage({ 
                type: 'update_state', 
                updates: { 'gameLogic/aiStory': finalText } 
            }, '*');
            
        } else {
            // Гости просто сидят и ждут сигнала от хоста
            storyEl.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin-bottom: 10px;"></div> <br>Ожидание отчета от лидера...`;
        }
    }
}
