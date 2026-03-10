// --- ГЛОБАЛЬНЫЙ ПЕРЕХВАТ ОШИБОК ---
window.onerror = function(message, source, lineno, colno, error) {
    console.error(`[CRITICAL ERROR] Строка: ${lineno}:${colno} | Ошибка: ${message}`);
    console.error(error);
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('[PROMISE ERROR] Необработанная ошибка в Promise:', event.reason);
});

let globalState = {};
const urlParams = new URLSearchParams(window.location.search);
const myUserId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';
const playersCountParam = parseInt(urlParams.get('players')) || 1;
const myName = urlParams.get('name') || 'Аноним';

console.log(`[DEBUG] Инициализация игры. Мой ID: ${myUserId}, Хост: ${isHost}, Игроков из URL: ${playersCountParam}`);

let isGeneratingRound = false;

// Утилиты интерфейса
function setDisplay(id, display) { const el = document.getElementById(id); if (el) el.style.display = display; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
window.leaveGame = function() { window.parent.postMessage({ type: 'leave_game' }, '*'); }

function showPhase(phaseId) {
    console.log(`[DEBUG] Переключение на экран: ${phaseId}`);
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(phaseId);
    if(target) target.classList.add('active');
    else console.warn(`[DEBUG] Экран ${phaseId} не найден!`);
}

function showLoading(show, message = "Загрузка...") {
    setText('loading-message', message);
    setDisplay('global-loading', show ? 'flex' : 'none');
}

// --- ИИ ФУНКЦИИ ---
async function fetchFromAI(systemPrompt) {
    try {
        console.log("[DEBUG] Отправка запроса к AI...");
        const SECRET_KEY_BASE64 = "c2stb3ItdjEtNjMxNzBjYWNmOTBkZDc0MjA5Mzk3YTBhZWYyMjdhNDM1ZmIyMmVkZmQ2NTQ5OWQxZDYxZTU0NWY5NTcxMWVjMg==";
        const apiKey = atob(SECRET_KEY_BASE64);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn("[DEBUG] AI запрос превысил лимит времени (10 сек) и был отменен!");
            controller.abort();
        }, 10000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free", 
                messages: [{ role: "system", content: systemPrompt }]
            })
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log("[DEBUG] Ответ AI успешно получен:", data);
        return data.choices[0].message.content.trim();
    } catch(e) { 
        console.error("[DEBUG] Ошибка при работе с AI:", e); 
        return null; 
    }
}

const FALLBACK_PROMPTS = [
    "Самая странная причина для опоздания на работу?",
    "Что не стоит говорить на первом свидании?",
    "Худшее имя для домашнего попугая?",
    "Если бы коты умели говорить, их первая фраза была бы...",
    "Новая услуга в такси, которой никто не воспользуется:"
];

async function generatePrompts(round, count) {
    console.log(`[DEBUG] Генерация вопросов. Раунд: ${round}, Количество: ${count}`);
    let promptText = round === 1 
        ? `Сгенерируй ${count} ПРОСТЫХ, коротких и смешных незаконченных фраз или вопросов для пати-игры. Выведи СТРОГО JSON массив строк и больше ничего.`
        : `Сгенерируй ${count} СЛОЖНЫХ, абсурдных вопросов-ситуаций. Выведи СТРОГО JSON массив строк.`;
    
    let res = await fetchFromAI(promptText);
    try {
        if (!res) throw new Error("Пустой ответ от AI");
        res = res.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsed = JSON.parse(res);
        if (Array.isArray(parsed) && parsed.length >= count) {
            console.log("[DEBUG] Вопросы успешно распарсены:", parsed);
            return parsed.slice(0, count);
        }
        throw new Error("Неверный формат массива от AI");
    } catch(e) {
        console.error("[DEBUG] AI не справился с вопросами, используем запасные (Fallback). Ошибка:", e);
        return Array(count).fill(0).map((_, i) => FALLBACK_PROMPTS[i % FALLBACK_PROMPTS.length]);
    }
}

async function generateBotAnswer(promptText) {
    const aiRes = await fetchFromAI(`Ты играешь в комедийную игру. Вопрос: "${promptText}". Напиши максимально смешной, абсурдный ответ из 2-5 слов. БЕЗ КАВЫЧЕК. Без пояснений.`);
    return aiRes || "Секретный ингредиент";
}

// --- ЛОГИКА ИГРОКОВ ---
function getActivePlayers() {
    let players = [...(globalState.players || [])];
    console.log("[DEBUG] Изначальный список игроков из globalState:", players);
    
    let botIndex = 1;
    while (players.length < 3) {
        players.push(`ai_bot_${botIndex}`);
        botIndex++;
    }

    if (players.length % 2 === 0) {
        players.push(`ai_bot_odd`);
    }

    console.log("[DEBUG] Итоговый список игроков (с ботами):", players);
    return players;
}

// --- СИНХРОНИЗАЦИЯ СОСТОЯНИЯ ---
window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        console.log("[DEBUG] --- Входящий SYNC_STATE от React ---", event.data.state);
        globalState = event.data.state || {}; 
        handleStateChange();
    }
});

function handleStateChange() {
    const status = globalState.status;
    const phase = globalState.phase;
    console.log(`[DEBUG] Обработка состояния: status = ${status}, phase = ${phase}`);
    
    showLoading(false);

    // 1. ЛОББИ ДО СТАРТА
    if (!status || status === 'waiting') {
        showPhase('lobby-screen');
        isGeneratingRound = false; 
        
        const pList = globalState.players || [];
        console.log(`[DEBUG] Отрисовка лобби. Игроков в массиве: ${pList.length}`);
        
        // Берем количество из URL, если база еще пустая
        setText('players-count-display', pList.length > 0 ? pList.length : playersCountParam);
        
        const listContainer = document.getElementById('lobby-players-list');
        
        if (pList.length > 0) {
            // Если данные пришли из базы
            listContainer.innerHTML = pList.map(id => {
                const name = globalState.playerNames?.[id] || "Аноним";
                const avatar = globalState.playerAvatars?.[id] || "https://picsum.photos/100";
                return `<div class="player-avatar-wrap"><img src="${avatar}"><div class="player-name-mini">${name}</div></div>`;
            }).join('');
        } else {
            // ЗАГЛУШКА ДО СТАРТА: показываем себя и текст
            listContainer.innerHTML = `
                <div class="player-avatar-wrap">
                    <img src="https://api.dicebear.com/7.x/bottts/png?seed=${myUserId}&backgroundColor=b6e3f4" style="border-color: #facc15;">
                    <div class="player-name-mini">${myName} (Вы)</div>
                </div>
                <div style="width: 100%; text-align: center; color: #64748b; font-size: 0.85rem; margin-top: 15px;">
                    Остальные игроки появятся здесь<br>сразу после старта игры
                </div>
            `;
        }
        
        if (isHost) {
            setDisplay('host-controls', 'block');
            document.getElementById('btn-start-game').disabled = false;
        } else {
            setDisplay('guest-waiting', 'block');
        }
        return;
    }

    // 2. ИГРА ЗАПУЩЕНА REACT-ОМ, НО ФАЗА НЕ УСТАНОВЛЕНА
    if (status === 'playing' && !phase) {
        console.log("[DEBUG] Статус 'playing', но фазы нет. Хост начинает генерацию раунда.");
        showPhase('lobby-screen');
        showLoading(true, "Нейросеть генерирует вопросы...");
        
        if (isHost && !isGeneratingRound) {
            isGeneratingRound = true;
            initFirstRound(); 
        }
        return;
    }

    // 3. ИГРОВЫЕ ФАЗЫ
    if (phase === 'answering') renderAnsweringPhase();
    if (phase === 'voting') renderVotingPhase();
    if (phase === 'voting_result') renderVotingResultPhase();
    if (phase === 'scoreboard') renderScoreboardPhase();
}

// --- ЛОГИКА ХОСТА (СТАРТ ИГРЫ) ---
window.startGame = function() {
    console.log("[DEBUG] Нажата кнопка СТАРТ. Являюсь ли я хостом?", isHost);
    if (!isHost) return;
    document.getElementById('btn-start-game').disabled = true;
    
    console.log("[DEBUG] Отправка POST MESSAGE: start_game в React");
    window.parent.postMessage({ 
        type: 'start_game', 
        settings: { mode: 'quiplash' } 
    }, '*');
};

async function initFirstRound() {
    console.log("[DEBUG] Инициализация первого раунда (initFirstRound)...");
    const players = getActivePlayers();
    
    let names = {...(globalState.playerNames || {})};
    let avatars = {...(globalState.playerAvatars || {})};
    players.forEach((p, i) => {
        if (p.includes('ai_bot')) {
            names[p] = `НейроБот v${i+1}`;
            avatars[p] = `https://api.dicebear.com/7.x/bottts/png?seed=${p}&backgroundColor=b6e3f4`;
        }
    });

    const promptCount = players.length; 
    const prompts = await generatePrompts(1, promptCount);
    
    let assignments = {};
    players.forEach((p, i) => {
        let q1 = i;
        let q2 = (i + 1) % promptCount;
        if (!assignments[q1]) assignments[q1] = [];
        if (!assignments[q2]) assignments[q2] = [];
        assignments[q1].push(p);
        assignments[q2].push(p);
    });

    console.log("[DEBUG] Вопросы распределены:", assignments);
    console.log("[DEBUG] Отправка обновления в базу (первый раунд начался).");

    window.parent.postMessage({ 
        type: 'update_state', 
        updates: { 
            phase: 'answering', round: 1, 
            playerNames: names, playerAvatars: avatars,
            activePlayersList: players, 
            gameData: { prompts, assignments, answers: {}, votes: {}, scores: {} }
        } 
    }, '*');
    
    setTimeout(() => handleBotAnswers(prompts, assignments), 1000);
}

async function handleBotAnswers(prompts, assignments) {
    console.log("[DEBUG] Запуск ответов для ботов...");
    let botAnswers = {};
    for (let qIdx in assignments) {
        let aiPlayers = assignments[qIdx].filter(p => p.includes('ai_bot'));
        for (let botId of aiPlayers) {
            if (!botAnswers[qIdx]) botAnswers[qIdx] = {};
            botAnswers[qIdx][botId] = await generateBotAnswer(prompts[qIdx]);
        }
    }
    console.log("[DEBUG] Боты ответили:", botAnswers);
    
    const currentAnswers = globalState.gameData?.answers || {};
    for (let qIdx in botAnswers) {
        if (!currentAnswers[qIdx]) currentAnswers[qIdx] = {};
        for (let botId in botAnswers[qIdx]) {
            currentAnswers[qIdx][botId] = botAnswers[qIdx][botId];
        }
    }
    window.parent.postMessage({ type: 'update_state', updates: { 'gameData/answers': currentAnswers }}, '*');
}

// --- ФАЗА: ВВОД ОТВЕТОВ ---
function renderAnsweringPhase() {
    showPhase('answering-phase');
    setText('answering-round-badge', `РАУНД ${globalState.round}`);
    
    const gd = globalState.gameData;
    let myQuestions = [];
    for (let qIdx in gd.assignments) {
        if (gd.assignments[qIdx].includes(myUserId)) {
            myQuestions.push({ idx: qIdx, text: gd.prompts[qIdx] });
        }
    }
    console.log("[DEBUG] Мои вопросы для ответов:", myQuestions);

    const container = document.getElementById('prompts-scroll-area');
    container.innerHTML = myQuestions.map((q, i) => `
        <div class="question-card">
            <div class="q-text">${q.text}</div>
            <input type="text" id="answer-input-${q.idx}" class="modern-input" placeholder="Введите смешной ответ..." oninput="checkAnswersFilled()">
        </div>
    `).join('');
    
    const myAns = gd.answers || {};
    let allFilled = myQuestions.length > 0 && myQuestions.every(q => myAns[q.idx] && myAns[q.idx][myUserId]);
    
    if (myQuestions.length === 0) {
        setDisplay('prompts-scroll-area', 'none');
        setDisplay('answering-footer', 'none');
        setDisplay('answering-waiting', 'flex');
        document.querySelector('#answering-waiting h3').innerText = "Вы зритель!";
    } else if (allFilled) {
        setDisplay('prompts-scroll-area', 'none');
        setDisplay('answering-footer', 'none');
        setDisplay('answering-waiting', 'flex');
    } else {
        setDisplay('prompts-scroll-area', 'flex');
        setDisplay('answering-footer', 'block');
        setDisplay('answering-waiting', 'none');
    }

    if (isHost) {
        let totalNeeded = Object.keys(gd.assignments).length * 2;
        let totalGiven = 0;
        for (let q in gd.answers) totalGiven += Object.keys(gd.answers[q]).length;
        
        if (totalGiven >= totalNeeded) {
            console.log("[DEBUG] Все ответы получены. Переход к голосованию.");
            window.parent.postMessage({ 
                type: 'update_state', 
                updates: { phase: 'voting', 'gameData/currentVoteIndex': 0, 'gameData/votes': {} }
            }, '*');
        }
    }
}

window.checkAnswersFilled = function() {
    const inputs = document.querySelectorAll('input[id^="answer-input-"]');
    let allFilled = Array.from(inputs).every(inp => inp.value.trim().length > 0);
    document.getElementById('btn-submit-answers').disabled = !allFilled;
};

window.submitAnswers = function() {
    const inputs = document.querySelectorAll('input[id^="answer-input-"]');
    const updates = {};
    inputs.forEach(inp => {
        const qIdx = inp.id.split('-')[2];
        updates[`gameData/answers/${qIdx}/${myUserId}`] = inp.value.trim();
    });
    console.log("[DEBUG] Отправка моих ответов:", updates);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

// --- ФАЗА: ГОЛОСОВАНИЕ ---
function renderVotingPhase() {
    showPhase('voting-phase');
    const gd = globalState.gameData;
    const vIdx = gd.currentVoteIndex || 0;
    
    setText('voting-prompt', gd.prompts[vIdx]);
    
    const authors = gd.assignments[vIdx];
    const answers = gd.answers[vIdx] || {};
    
    const isAuthor = authors.includes(myUserId);
    const hasVoted = gd.votes[vIdx] && gd.votes[vIdx][myUserId];

    const grid = document.getElementById('voting-answers-grid');
    grid.innerHTML = authors.map(authorId => {
        const ansText = answers[authorId] || "(нет ответа)";
        const disabled = isAuthor || hasVoted;
        const votedClass = gd.votes[vIdx]?.[myUserId] === authorId ? 'voted' : '';
        
        return `
            <div class="answer-btn ${disabled ? 'disabled' : ''} ${votedClass}" 
                 onclick="!${disabled} && submitVote('${authorId}')">
                ${ansText}
            </div>
        `;
    }).join('');

    if (isAuthor) setText('voting-status', "Вы не можете голосовать за свой ответ.");
    else if (hasVoted) setText('voting-status', "Голос принят!");
    else setText('voting-status', "Голосуйте за лучший!");

    if (isHost) {
        const totalPlayers = globalState.activePlayersList.length;
        const expectedVotes = totalPlayers - 2; 
        const currentVotes = gd.votes[vIdx] ? Object.keys(gd.votes[vIdx]).length : 0;
        
        if (currentVotes >= expectedVotes) {
            console.log(`[DEBUG] Голосование завершено для вопроса ${vIdx}. Переход к результатам.`);
            setTimeout(() => {
                window.parent.postMessage({ type: 'update_state', updates: { phase: 'voting_result' } }, '*');
            }, 1500);
        }
    }
}

window.submitVote = function(targetId) {
    const vIdx = globalState.gameData.currentVoteIndex;
    const updates = {};
    updates[`gameData/votes/${vIdx}/${myUserId}`] = targetId;
    console.log(`[DEBUG] Отправка голоса за ${targetId}`);
    window.parent.postMessage({ type: 'update_state', updates }, '*');
};

// --- ФАЗА: РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ ---
function renderVotingResultPhase() {
    showPhase('voting-result-phase');
    setDisplay('btn-next-vote', isHost ? 'block' : 'none');

    const gd = globalState.gameData;
    const vIdx = gd.currentVoteIndex;
    setText('result-prompt', gd.prompts[vIdx]);

    const authors = gd.assignments[vIdx];
    const answers = gd.answers[vIdx];
    const votes = gd.votes[vIdx] || {};
    
    let voteCounts = { [authors[0]]: 0, [authors[1]]: 0 };
    let totalVotes = 0;
    for (let voter in votes) { voteCounts[votes[voter]]++; totalVotes++; }

    if (isHost && !gd.scoresCalculated?.[vIdx]) {
        let newScores = {...gd.scores};
        let mult = globalState.round === 2 ? 2 : 1;
        authors.forEach(a => {
            if (!newScores[a]) newScores[a] = 0;
            newScores[a] += (voteCounts[a] * 100 * mult);
            if (totalVotes > 0 && voteCounts[a] === totalVotes) newScores[a] += (250 * mult); 
        });
        const updates = { 'gameData/scores': newScores };
        updates[`gameData/scoresCalculated/${vIdx}`] = true;
        window.parent.postMessage({ type: 'update_state', updates }, '*');
    }

    const grid = document.getElementById('result-answers-grid');
    grid.innerHTML = authors.map(authorId => {
        let pct = totalVotes === 0 ? 0 : Math.round((voteCounts[authorId] / totalVotes) * 100);
        let isWinner = voteCounts[authorId] > voteCounts[authors.find(a => a !== authorId)];
        let isLoser = voteCounts[authorId] < voteCounts[authors.find(a => a !== authorId)];
        if (voteCounts[authors[0]] === voteCounts[authors[1]]) { isWinner = true; isLoser = false; }
        
        let authorName = globalState.playerNames?.[authorId] || "Бот";
        let authorAva = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";

        return `
            <div class="answer-btn ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}" style="cursor:default;">
                <div>${answers[authorId]}</div>
                <div class="vote-stats">${pct}%</div>
                <div class="author-info">
                    <img src="${authorAva}">
                    <span>${authorName}</span>
                </div>
            </div>
        `;
    }).join('');
}

window.nextVote = function() {
    if (!isHost) return;
    const gd = globalState.gameData;
    let nextIdx = gd.currentVoteIndex + 1;
    if (nextIdx >= Object.keys(gd.prompts).length) {
        window.parent.postMessage({ type: 'update_state', updates: { phase: 'scoreboard' } }, '*');
    } else {
        window.parent.postMessage({ type: 'update_state', updates: { phase: 'voting', 'gameData/currentVoteIndex': nextIdx } }, '*');
    }
};

// --- ФАЗА: ТАБЛИЦА ЛИДЕРОВ ---
function renderScoreboardPhase() {
    showPhase('scoreboard-phase');
    setDisplay('btn-next-round', isHost ? 'block' : 'none');

    const scores = globalState.gameData?.scores || {};
    const players = globalState.activePlayersList || [];
    
    let sorted = players.map(id => ({
        name: globalState.playerNames?.[id] || "Бот",
        avatar: globalState.playerAvatars?.[id] || "https://picsum.photos/100",
        score: scores[id] || 0
    })).sort((a, b) => b.score - a.score);

    const list = document.getElementById('scoreboard-list');
    list.innerHTML = sorted.map((p, i) => `
        <div class="score-row ${i === 0 ? 'rank-1' : ''}">
            <div class="score-left">
                <span class="rank-num">${i+1}</span>
                <img src="${p.avatar}">
                <span class="score-name">${p.name}</span>
            </div>
            <div class="score-val">${p.score}</div>
        </div>
    `).join('');
    
    if (globalState.round >= 2) {
        setText('btn-next-round', "ВЕРНУТЬСЯ В ЛОББИ");
    }
}

window.nextRound = async function() {
    if (!isHost) return;
    if (globalState.round >= 2) {
        window.parent.postMessage({ type: 'update_state', updates: { status: 'waiting', phase: null } }, '*');
        return;
    }

    showLoading(true, "Генерация раунда х2...");
    
    const players = globalState.activePlayersList;
    const promptCount = players.length;
    const prompts = await generatePrompts(2, promptCount);
    
    let assignments = {};
    players.forEach((p, i) => {
        let q1 = i; let q2 = (i + 1) % promptCount;
        if (!assignments[q1]) assignments[q1] = []; if (!assignments[q2]) assignments[q2] = [];
        assignments[q1].push(p); assignments[q2].push(p);
    });

    window.parent.postMessage({ 
        type: 'update_state', 
        updates: { 
            phase: 'answering', round: 2, 
            'gameData/prompts': prompts, 'gameData/assignments': assignments, 
            'gameData/answers': {}, 'gameData/votes': {}, 'gameData/scoresCalculated': {}
        } 
    }, '*');
    
    setTimeout(() => handleBotAnswers(prompts, assignments), 1000);
    handleStateChange();
};