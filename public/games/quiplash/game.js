// --- ГЛОБАЛЬНЫЙ ПЕРЕХВАТ ОШИБОК ---
window.onerror = function(message, source, lineno, colno, error) {
    console.error(`[CRITICAL ERROR] Строка: ${lineno}:${colno} | Ошибка: ${message}`);
    return false;
};

let globalState = {};
const urlParams = new URLSearchParams(window.location.search);
const myUserId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';
const playersCountParam = parseInt(urlParams.get('players')) || 1;
const myName = urlParams.get('name') || 'Аноним';

let isGeneratingRound = false;
let currentTimerInterval = null;
let myPhaseStartTime = 0; 
let spokenPhrases = new Set();
let currentTTSAudio = null;

const SVGS = {
    crown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`,
    target: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    lightning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
};

// --- ВСТРОЕННЫЙ ЗВУКОВОЙ ДВИЖОК (SFX) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (!isHost) return; 
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        if (type === 'tick') {
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(800, t); gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05); osc.start(t); osc.stop(t + 0.05);
        } else if (type === 'whoosh') {
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
            gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
            gain.gain.linearRampToValueAtTime(0, t + 0.3); osc.start(t); osc.stop(t + 0.3);
        } else if (type === 'badum') {
            const kick = audioCtx.createOscillator(); const kg = audioCtx.createGain();
            kick.connect(kg); kg.connect(audioCtx.destination);
            kick.frequency.setValueAtTime(150, t); kick.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
            kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.01, t + 0.1); kick.start(t); kick.stop(t + 0.1);
            const snare = audioCtx.createOscillator(); const sg = audioCtx.createGain();
            snare.type = 'triangle'; snare.connect(sg); sg.connect(audioCtx.destination);
            snare.frequency.setValueAtTime(250, t + 0.15); sg.gain.setValueAtTime(0.5, t + 0.15);
            sg.gain.exponentialRampToValueAtTime(0.01, t + 0.25); snare.start(t + 0.15); snare.stop(t + 0.25);
            const tss = audioCtx.createOscillator(); const tg = audioCtx.createGain();
            tss.type = 'square'; tss.connect(tg); tg.connect(audioCtx.destination);
            tss.frequency.setValueAtTime(6000, t + 0.3); tg.gain.setValueAtTime(0.1, t + 0.3);
            tg.gain.exponentialRampToValueAtTime(0.01, t + 0.5); tss.start(t + 0.3); tss.stop(t + 0.5);
        }
    } catch(e) {}
}

// --- СИНТЕЗАТОР РЕЧИ (БРОНЕБОЙНЫЙ АЛГОРИТМ) ---
async function speakText(text) {
    if (!isHost) return;
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').trim();
    if (!cleanText) return;

    if (currentTTSAudio) { currentTTSAudio.pause(); currentTTSAudio.src = ""; }

    try {
        // УРОВЕНЬ 1: VoiceRSS (Качественный мужской голос Peter, возвращает чистый MP3)
        const url1 = `https://api.voicerss.org/?key=25b682390a0b411d9554d33939665f88&hl=ru-ru&c=MP3&v=Peter&src=${encodeURIComponent(cleanText)}`;
        currentTTSAudio = new Audio(url1);
        await new Promise((resolve, reject) => {
            currentTTSAudio.onended = resolve;
            currentTTSAudio.onerror = reject;
            currentTTSAudio.play().catch(reject);
        });
        return;
    } catch (e1) {
        console.warn("[TTS] VoiceRSS недоступен, пробую Youdao:", e1);
        try {
            // УРОВЕНЬ 2: Youdao Dict (Резервный MP3 API, работает всегда)
            const url2 = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&le=ru`;
            currentTTSAudio = new Audio(url2);
            await new Promise((resolve, reject) => {
                currentTTSAudio.onended = resolve;
                currentTTSAudio.onerror = reject;
                currentTTSAudio.play().catch(reject);
            });
            return;
        } catch (e2) {
            console.warn("[TTS] Сетевые API недоступны. Включаю системный голос.");
            // УРОВЕНЬ 3: Системный голос (Если пропал интернет)
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(cleanText);
                u.lang = 'ru-RU';
                window.speechSynthesis.speak(u);
            }
        }
    }
}

// --- УТИЛИТЫ ---
function typeWriterEffectHTML(el, htmlString, speed=35) {
    if (!el) return;
    el.innerHTML = ''; el.classList.add('typewriter-cursor');
    let i = 0; let text = ''; let isTag = false;
    function type() {
        if (i < htmlString.length) {
            text += htmlString.charAt(i); el.innerHTML = text;
            if (htmlString.charAt(i) === '<') isTag = true; if (htmlString.charAt(i) === '>') isTag = false;
            i++; if (isTag) type(); else setTimeout(type, speed);
        } else { el.classList.remove('typewriter-cursor'); }
    }
    type();
}

function setDisplay(id, display) { const el = document.getElementById(id); if (el) el.style.display = display; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
window.leaveGame = function() { window.parent.postMessage({ type: 'leave_game' }, '*'); }

function showPhase(phaseId) {
    playSound('whoosh');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(phaseId); if(target) target.classList.add('active');
}
function showLoading(show, message = "Загрузка...") { setText('loading-message', message); setDisplay('global-loading', show ? 'flex' : 'none'); }
function updateDynamicBackground(phase, round) {
    document.body.className = ''; 
    if (!phase || phase === 'waiting') document.body.classList.add('bg-lobby');
    else if (round === 1) document.body.classList.add('bg-round1');
    else if (round === 2) document.body.classList.add('bg-round2');
    else if (round === 3) document.body.classList.add('bg-round3');
}

function sendUpdate(updates) {
    try { window.parent.postMessage({ type: 'update_state', updates: JSON.parse(JSON.stringify(updates)) }, '*'); } catch (e) {}
}

function startLocalTimer(deadlineMs, displayId, onExpireCallback) {
    clearInterval(currentTimerInterval);
    function update() {
        const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setText(displayId, remaining);
        if (remaining <= 10 && remaining > 0) playSound('tick');
        if (remaining <= 0) { clearInterval(currentTimerInterval); if (isHost && onExpireCallback) onExpireCallback(); }
    }
    update(); currentTimerInterval = setInterval(update, 1000);
}

// --- ИИ ФУНКЦИИ ---
async function fetchFromAI(systemPrompt) {
    try {
        const SECRET_KEY_BASE64 = "c2stb3ItdjEtNjMxNzBjYWNmOTBkZDc0MjA5Mzk3YTBhZWYyMjdhNDM1ZmIyMmVkZmQ2NTQ5OWQxZDYxZTU0NWY5NTcxMWVjMg==";
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 8000); 
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST', signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${atob(SECRET_KEY_BASE64)}` },
            body: JSON.stringify({ model: "arcee-ai/trinity-large-preview:free", messages: [{ role: "system", content: systemPrompt }] })
        });
        clearTimeout(timeoutId); const data = await response.json(); return data.choices[0].message.content.trim();
    } catch(e) { return null; } 
}

const FALLBACK_PROMPTS = [
    "Худшее, что можно крикнуть во время секса?", "Неожиданная находка в кармане старой куртки?", "Секретный ингредиент в школьных сосисках?", "Самая тупая причина для развода:"
];

async function generatePrompts(round, count, playerNamesList = [], theme = "") {
    let namesStr = playerNamesList.length > 0 ? playerNamesList.join(', ') : "";
    let themeStr = theme ? `ТЕМАТИКА ИГРЫ: "${theme}". ` : "";
    const strictRule = `ПИШИ ТОЛЬКО ВОПРОСЫ ИЛИ НАЧАЛА ФРАЗ. ЗАПРЕЩЕНО ПИСАТЬ ОТВЕТЫ!`;
    const langRule = `ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ!`;

    let promptText = "";
    if (round === 1) promptText = `${themeStr}${langRule} ${strictRule} Сгенерируй ${count} забавных фраз для игры. ${namesStr ? `В 1 вопросе используй имя (${namesStr}).` : ''} СТРОГО JSON массив строк.`;
    else if (round === 2) promptText = `${themeStr}${langRule} ${strictRule} Сгенерируй ${count} ситуационных вопросов. ${namesStr ? `В 1 вопросе используй имя (${namesStr}).` : ''} СТРОГО JSON массив строк.`;
    else if (round === 3) promptText = `${themeStr}${langRule} Сгенерируй ${count} разных финальных вопросов, где надо назвать ТРИ вещи. СТРОГО JSON массив из ${count} строк.`;
    
    let res = await fetchFromAI(promptText);
    try {
        if(!res) throw new Error();
        res = res.replace(/```json/gi, '').replace(/```/g, '').trim(); let parsed = JSON.parse(res);
        if (Array.isArray(parsed) && parsed.length >= count) return parsed.slice(0, count); throw new Error();
    } catch(e) { return Array(count).fill(0).map((_, i) => (theme ? `[${theme}] ` : '') + FALLBACK_PROMPTS[i % FALLBACK_PROMPTS.length]); }
}

async function generateBotAnswer(promptText, isRound3) {
    const sys = isRound3 ? `Вопрос: "${promptText}". Напиши 3 смешных ответа через <br>. БЕЗ КАВЫЧЕК. НА РУССКОМ.` : `Вопрос: "${promptText}". Напиши смешной ответ из 2-6 слов. НА РУССКОМ.`;
    const aiRes = await fetchFromAI(sys); return aiRes || "Секретный ингредиент";
}

async function generateMissions(count) {
    const sys = `Сгенерируй ${count} смешных секретных заданий для игроков (напр. "напиши ответ капсом"). СТРОГО НА РУССКОМ. БЕЗ ОШИБОК. JSON массив строк.`;
    const res = await fetchFromAI(sys);
    try {
        if(!res) throw new Error();
        let parsed = JSON.parse(res.replace(/```json/gi, '').replace(/```/g, '').trim());
        return Array.isArray(parsed) ? parsed.slice(0, count) : Array(count).fill("Используй слово 'банан'");
    } catch(e) { return Array(count).fill("Сделай ответ очень длинным"); }
}

async function generateRoast(sortedPlayers) {
    const loser = sortedPlayers[sortedPlayers.length - 1]?.name || "Кто-то";
    const sys = `Игрок на последнем месте: "${loser}". Напиши жесткое, но короткое (5-10 слов) унижение его чувства юмора. НА РУССКОМ. Без кавычек.`;
    const res = await fetchFromAI(sys); return res || `${loser}, это было не смешно.`;
}

function getActivePlayers() {
    let players = [...(globalState.players || [])]; let botIndex = 1;
    while (players.length < 3) { players.push(`ai_bot_${botIndex}`); botIndex++; }
    if (players.length % 2 === 0) players.push(`ai_bot_odd`);
    return players;
}

// --- СИНХРОНИЗАЦИЯ СОСТОЯНИЯ ---
window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        globalState = event.data.state || {}; globalState.roomPlayers = event.data.roomPlayers || []; 
        handleStateChange();
    }
});

function handleStateChange() {
    const status = globalState.status; const phase = globalState.phase; const round = globalState.round || 1;
    updateDynamicBackground(status === 'waiting' ? 'waiting' : phase, round);
    showLoading(false);

    if (!status || status === 'waiting') {
        showPhase('lobby-screen'); isGeneratingRound = false; clearInterval(currentTimerInterval); spokenPhrases.clear();
        
        const lobbyScreen = document.getElementById('lobby-screen');
        const pList = globalState.roomPlayers || [];
        
        lobbyScreen.innerHTML = `
            <div class="j-header">
                <h1 class="j-title">СМЕХЛЫСТ <span class="title-badge">3</span></h1>
                <div class="j-subtitle">ИГРОКОВ: ${pList.length > 0 ? pList.length : playersCountParam}</div>
            </div>
            <div class="j-players-container">
                ${pList.length > 0 ? pList.map(p => `
                    <div class="j-player-card ${p.id === myUserId ? 'is-me' : ''}">
                        <img src="${p.avatar || 'https://picsum.photos/100'}">
                        <div class="j-player-name">${p.name || "Аноним"}</div>
                        ${p.isHost ? `<div class="j-host-crown">${SVGS.crown}</div>` : ''}
                    </div>
                `).join('') : '<div style="color:#fff;text-align:center;font-weight:bold;">Ожидание игроков...</div>'}
            </div>
            ${isHost ? `
                <div class="j-host-panel">
                    <div class="jackbox-settings">
                        <div class="j-setting"><span>ЗАДАНИЯ</span><input type="checkbox" id="toggle-missions" class="j-checkbox"></div>
                        <div class="j-setting"><span>ТЕМА (ИИ)</span><input type="checkbox" id="toggle-theme" class="j-checkbox"></div>
                    </div>
                    <button id="btn-start-game" class="j-start-btn" onclick="startGame()">СВЕДИТЕ СЧЕТЫ!</button>
                </div>
            ` : `<div class="j-guest-panel"><h3>ВЫ В ЛОББИ</h3><p>Ждем, пока VIP запустит игру...</p></div>`}
        `;
        return;
    }

    if (status === 'playing' && !phase) {
        showPhase('lobby-screen'); showLoading(true, "Нейросеть генерирует вопросы...");
        if (isHost && !isGeneratingRound) { if(audioCtx.state === 'suspended') audioCtx.resume(); isGeneratingRound = true; initFirstRound(); }
        return;
    }

    if (phase === 'answering') renderAnsweringPhase();
    if (phase === 'voting') renderVotingPhase();
    if (phase === 'voting_result') renderVotingResultPhase();
    if (phase === 'scoreboard') renderScoreboardPhase();
}

window.startGame = function() {
    if (!isHost) return;
    const useTheme = document.getElementById('toggle-theme')?.checked || false;
    const useMissions = document.getElementById('toggle-missions')?.checked || false;
    let themeText = "";
    if (useTheme) { themeText = prompt("Включена 'Тематическая игра'!\nВведите тему (Например: Аниме, Офис):", ""); if (themeText === null) return; }
    document.getElementById('btn-start-game').disabled = true;
    window.parent.postMessage({ type: 'start_game', settings: { mode: 'quiplash', theme: themeText, useMissions: useMissions } }, '*');
};

async function initFirstRound() {
    try {
        if (!spokenPhrases.has('start_game')) { speakText("Начинаем игру! Жду ваши шутки."); spokenPhrases.add('start_game'); }
        const players = getActivePlayers();
        let names = {...(globalState.playerNames || {})};
        players.forEach((p, i) => { if (p.includes('ai_bot')) names[p] = `НейроБот v${i+1}`; });
        
        const prompts = await generatePrompts(1, players.length, players.map(p => names[p] || "Аноним"), globalState.settings?.theme || "");
        let assignments = {};
        players.forEach((p, i) => {
            let q1 = i; let q2 = (i + 1) % players.length;
            if (!assignments[q1]) assignments[q1] = []; if (!assignments[q2]) assignments[q2] = [];
            assignments[q1].push(p); assignments[q2].push(p);
        });

        let missions = globalState.settings?.useMissions ? await generateMissions(players.length) : null;
        let missionsObj = missions ? players.reduce((acc, p, i) => ({...acc, [p]: missions[i]}), {}) : null;

        sendUpdate({ phase: 'answering', round: 1, playerNames: names, playerAvatars: globalState.playerAvatars || {}, activePlayersList: players, gameData: { prompts: prompts, assignments: assignments, missions: missionsObj, deadline: Date.now() + 60000 } });
        setTimeout(() => handleBotAnswers(prompts, assignments, false), 1000);
    } catch (err) { isGeneratingRound = false; showLoading(false); }
}

async function handleBotAnswers(prompts, assignments, isRound3) {
    let botAnswers = {}; let promises = [];
    for (let qIdx in assignments) {
        let aiPlayers = assignments[qIdx].filter(p => p.includes('ai_bot'));
        for (let botId of aiPlayers) {
            if (!botAnswers[qIdx]) botAnswers[qIdx] = {};
            const p = Promise.race([
                generateBotAnswer(prompts[qIdx] || "", isRound3),
                new Promise(r => setTimeout(() => r("Запасной ответ"), 5000))
            ]).then(ans => botAnswers[qIdx][botId] = ans);
            promises.push(p);
        }
    }
    await Promise.all(promises);
    const currentAnswers = globalState.gameData?.answers || {};
    for (let qIdx in botAnswers) {
        if (!currentAnswers[qIdx]) currentAnswers[qIdx] = {};
        for (let botId in botAnswers[qIdx]) currentAnswers[qIdx][botId] = botAnswers[qIdx][botId];
    }
    sendUpdate({ 'gameData/answers': currentAnswers });
}

function renderAnsweringPhase() {
    showPhase('answering-phase');
    globalState._transitioningToVoting = false; 
    if (!myPhaseStartTime) myPhaseStartTime = Date.now(); 
    const isRound3 = globalState.round === 3;
    setText('answering-round-badge', isRound3 ? "ФИНАЛ: 3 ОТВЕТА" : `РАУНД ${globalState.round || 1}`);
    const gd = globalState.gameData || {};
    if (gd.deadline) startLocalTimer(gd.deadline, 'answering-timer', () => { if (isHost && !globalState._transitioningToVoting) forceTransitionToVoting(); });

    let myQuestions = [];
    const assignments = gd.assignments || {};
    for (let qIdx in assignments) { if (assignments[qIdx] && assignments[qIdx].includes(myUserId)) myQuestions.push({ idx: qIdx, text: (gd.prompts || [])[qIdx] || "Вопрос?" }); }

    const container = document.getElementById('prompts-scroll-area');
    if (container && (!container.hasAttribute('data-rendered-round') || container.getAttribute('data-rendered-round') !== String(globalState.round))) {
        let missionHtml = (globalState.settings?.useMissions && gd.missions?.[myUserId]) ? `<div class="secret-mission-banner">${SVGS.target} Задание: ${gd.missions[myUserId]}</div>` : '';
        container.innerHTML = missionHtml + myQuestions.map((q) => `<div class="question-card"><div class="q-text">${q.text}</div>${isRound3 ? `<input type="text" id="answer-input-${q.idx}-1" maxlength="150" class="modern-input" placeholder="1..."><input type="text" id="answer-input-${q.idx}-2" maxlength="150" class="modern-input" placeholder="2..." style="margin-top:10px;"><input type="text" id="answer-input-${q.idx}-3" maxlength="150" class="modern-input" placeholder="3..." style="margin-top:10px;">` : `<input type="text" id="answer-input-${q.idx}" maxlength="150" class="modern-input" placeholder="Ваш ответ..." oninput="checkAnswersFilled()">`}</div>`).join('');
        container.setAttribute('data-rendered-round', globalState.round);
    }
    
    let allFilled = myQuestions.length > 0 && myQuestions.every(q => gd.answers?.[q.idx]?.[myUserId]);
    setDisplay('prompts-scroll-area', myQuestions.length === 0 || allFilled ? 'none' : 'block');
    setDisplay('answering-footer', myQuestions.length === 0 || allFilled ? 'none' : 'block');
    setDisplay('answering-waiting', myQuestions.length === 0 || allFilled ? 'flex' : 'none');

    if (isHost) {
        let totalNeeded = 0; for(let q in assignments) totalNeeded += assignments[q].length;
        let totalGiven = 0; for (let q in (gd.answers || {})) if (gd.answers[q]) totalGiven += Object.keys(gd.answers[q]).length;
        if (totalNeeded > 0 && totalGiven >= totalNeeded && !globalState._transitioningToVoting) forceTransitionToVoting();
    }
}

function forceTransitionToVoting() {
    globalState._transitioningToVoting = true; clearInterval(currentTimerInterval);
    myPhaseStartTime = 0; sendUpdate({ phase: 'voting', 'gameData/currentVoteIndex': 0, 'gameData/deadline': Date.now() + 20000 });
}

window.checkAnswersFilled = function() {
    const inputs = document.querySelectorAll('input[id^="answer-input-"]');
    document.getElementById('btn-submit-answers').disabled = !Array.from(inputs).every(inp => inp.value.trim().length > 0);
};

window.submitAnswers = function() {
    const gd = globalState.gameData || {}; const updates = {};
    const timeTakes = Math.floor((Date.now() - (myPhaseStartTime || Date.now())) / 1000); 
    for (let qIdx in gd.assignments) {
        if (gd.assignments[qIdx].includes(myUserId)) {
            if (globalState.round === 3) {
                updates[`gameData/answers/${qIdx}/${myUserId}`] = `1. ${document.getElementById(`answer-input-${qIdx}-1`)?.value.trim()}<br>2. ${document.getElementById(`answer-input-${qIdx}-2`)?.value.trim()}<br>3. ${document.getElementById(`answer-input-${qIdx}-3`)?.value.trim()}`;
            } else {
                updates[`gameData/answers/${qIdx}/${myUserId}`] = document.getElementById(`answer-input-${qIdx}`)?.value.trim() || "Без ответа";
            }
        }
    }
    updates[`gameData/answerTimes/${myUserId}`] = timeTakes; sendUpdate(updates);
};

function renderVotingPhase() {
    showPhase('voting-phase');
    globalState._transitioningToResult = false; 
    const gd = globalState.gameData || {}; const vIdx = gd.currentVoteIndex || 0;
    const promptText = gd.prompts?.[vIdx] || "..."; setText('voting-prompt', promptText);
    
    const voteKey = `vote_${globalState.round}_${vIdx}`;
    if (!spokenPhrases.has(voteKey)) { speakText(promptText); spokenPhrases.add(voteKey); }
    
    if (gd.deadline) startLocalTimer(gd.deadline, 'voting-timer', () => { if (isHost && !globalState._transitioningToResult) { globalState._transitioningToResult = true; sendUpdate({ phase: 'voting_result' }); } });
    
    const authors = gd.assignments?.[vIdx] || []; const answers = gd.answers?.[vIdx] || {}; const votes = gd.votes?.[vIdx] || {};
    document.getElementById('voting-answers-grid').innerHTML = authors.map(authorId => `<div class="answer-btn ${ (authors.includes(myUserId) || votes[myUserId]) ? 'disabled' : ''} ${votes[myUserId] === authorId ? 'voted' : ''}" onclick="submitVote('${authorId}')">${answers[authorId] || "(нет ответа)"}</div>`).join('');
    setText('voting-status', authors.includes(myUserId) ? "Своё не судим." : (votes[myUserId] ? "Принято!" : "Выбирай лучшее!"));
    
    if (isHost) {
        if (!gd.botVotesSubmitted?.[vIdx]) {
            let botUpdates = {}; let botsVoted = false;
            (globalState.activePlayersList || []).filter(p => p.includes('ai_bot')).forEach(botId => {
                if (!authors.includes(botId) && authors.length > 0) { botUpdates[`gameData/votes/${vIdx}/${botId}`] = authors[Math.floor(Math.random() * authors.length)]; botsVoted = true; }
            });
            if (botsVoted) { botUpdates[`gameData/botVotesSubmitted/${vIdx}`] = true; sendUpdate(botUpdates); }
        }
        const expected = Math.max(0, (globalState.activePlayersList || []).length - authors.length);
        if (expected > 0 && Object.keys(votes).length >= expected && !globalState._transitioningToResult) {
            clearInterval(currentTimerInterval); globalState._transitioningToResult = true;
            setTimeout(() => sendUpdate({ phase: 'voting_result' }), 1000);
        }
    }
}

window.submitVote = function(targetId) { 
    if(globalState.gameData?.assignments[globalState.gameData.currentVoteIndex].includes(myUserId)) return;
    sendUpdate({ [`gameData/votes/${globalState.gameData.currentVoteIndex || 0}/${myUserId}`]: targetId }); 
};

function renderVotingResultPhase() {
    showPhase('voting-result-phase');
    const gd = globalState.gameData || {}; const vIdx = gd.currentVoteIndex || 0;
    if (!document.getElementById('result-answers-grid').hasAttribute('data-played')) { playSound('badum'); document.getElementById('result-answers-grid').setAttribute('data-played', 'true'); }
    const authors = gd.assignments?.[vIdx] || []; const currentVotes = gd.votes?.[vIdx] || {};
    let voteCounts = {}; authors.forEach(a => voteCounts[a] = 0);
    let totalVotes = 0; for (let voter in currentVotes) { if (voteCounts[currentVotes[voter]] !== undefined) { voteCounts[currentVotes[voter]]++; totalVotes++; } }
    if (isHost && !gd.scoresCalculated?.[vIdx]) {
        let newScores = {...(gd.scores || {})}; let mult = globalState.round || 1; 
        authors.forEach(a => {
            if (!newScores[a]) newScores[a] = 0; newScores[a] += (voteCounts[a] * 100 * mult);
            if (totalVotes > 0 && voteCounts[a] === totalVotes) newScores[a] += (250 * mult);
            let other = authors.find(o => o !== a);
            if (voteCounts[a] > (voteCounts[other] || 0)) {
                const timeBonus = Math.max(0, 30 - (gd.answerTimes?.[a] || 30)) * 10;
                newScores[a] += timeBonus; sendUpdate({ [`gameData/timeBonusesAwarded/${vIdx}/${a}`]: timeBonus });
            }
        });
        sendUpdate({'gameData/scores': newScores, [`gameData/scoresCalculated/${vIdx}`]: true});
        setTimeout(() => {
            document.getElementById('result-answers-grid').removeAttribute('data-played');
            let nextIdx = vIdx + 1;
            if (nextIdx >= (gd.prompts || []).length) {
                const sorted = (globalState.activePlayersList || []).map(id => ({ name: globalState.playerNames?.[id] || "Бот", score: newScores[id] || 0 })).sort((a, b) => b.score - a.score);
                generateRoast(sorted).then(r => sendUpdate({ phase: 'scoreboard', 'gameData/roast': r }));
            } else sendUpdate({ phase: 'voting', 'gameData/currentVoteIndex': nextIdx, 'gameData/deadline': Date.now() + 20000 });
        }, 7000);
    }
    const grid = document.getElementById('result-answers-grid');
    grid.innerHTML = authors.map(authorId => {
        let other = authors.find(a => a !== authorId);
        let isWinner = voteCounts[authorId] >= (voteCounts[other] || 0);
        let tBonus = gd.timeBonusesAwarded?.[vIdx]?.[authorId];
        return `<div class="answer-btn ${isWinner ? 'winner' : 'loser'}" style="display:flex; flex-direction:column; align-items:center;">${tBonus ? `<div class="time-bonus-badge">${SVGS.lightning} +${tBonus} скорость!</div>` : ''}<div class="result-text-container" data-text="${(gd.answers?.[vIdx]?.[authorId] || "").replace(/"/g, '&quot;')}"></div><div class="vote-stats">${totalVotes === 0 ? 0 : Math.round((voteCounts[authorId] / totalVotes) * 100)}%</div><div class="author-info"><img src="${globalState.playerAvatars?.[authorId] || 'https://picsum.photos/100'}"><span>${globalState.playerNames?.[authorId] || "Бот"}</span></div></div>`;
    }).join('');
    document.querySelectorAll('.result-text-container').forEach(el => typeWriterEffectHTML(el, el.getAttribute('data-text')));
}

function renderScoreboardPhase() {
    showPhase('scoreboard-phase');
    const scores = globalState.gameData?.scores || {};
    let sorted = (globalState.activePlayersList || []).map(id => ({ name: globalState.playerNames?.[id] || "Бот", avatar: globalState.playerAvatars?.[id] || "https://picsum.photos/100", score: scores[id] || 0 })).sort((a, b) => b.score - a.score);
    document.getElementById('scoreboard-list').innerHTML = sorted.map((p, i) => `<div class="score-row ${i === 0 ? 'rank-1' : ''}"><div class="score-left"><span class="rank-num">${i+1}</span><img src="${p.avatar}"><span class="score-name">${p.name} ${i === 0 && globalState.round === 3 ? `<div class="joke-man-badge">${SVGS.crown} ЧЕЛОВЕК-АНЕКДОТ</div>` : ''}</span></div><div class="score-val">${p.score}</div></div>`).join('');
    if (globalState.gameData?.roast && !spokenPhrases.has(`roast_${globalState.round}`)) { speakText(globalState.gameData.roast); spokenPhrases.add(`roast_${globalState.round}`); }
    setDisplay('btn-next-round', isHost ? 'block' : 'none');
    document.getElementById('btn-next-round').disabled = false;
    setText('btn-next-round', globalState.round >= 3 ? "В ЛОББИ" : "ДАЛЬШЕ");
}

window.nextRound = async function() {
    if (!isHost) return;
    document.getElementById('btn-next-round').disabled = true; 
    if (globalState.round >= 3) { sendUpdate({ status: 'waiting', phase: null }); return; }
    const nextRoundNum = globalState.round + 1;
    
    const roundSpeechKey = `round_speech_${nextRoundNum}`;
    if (!spokenPhrases.has(roundSpeechKey)) { speakText(nextRoundNum === 3 ? "Финал! Покажите максимум." : "Раунд два. Удваиваем ставки."); spokenPhrases.add(roundSpeechKey); }

    showLoading(true, "Генерирую...");
    try {
        const players = globalState.activePlayersList || [];
        let activeP = [...players]; if (nextRoundNum === 3 && activeP.length % 2 !== 0) activeP.push('ai_bot_thriplash');
        const pairs = nextRoundNum === 3 ? (activeP.length / 2) : players.length;
        const aiPrompts = await generatePrompts(nextRoundNum, pairs, players.map(p => globalState.playerNames?.[p] || "Аноним"), globalState.settings?.theme || "");
        let prompts = []; let assignments = {};
        if (nextRoundNum === 3) {
            for(let i=0; i < activeP.length; i+=2) { prompts[i/2] = aiPrompts[i/2]; assignments[i/2] = [activeP[i], activeP[i+1]]; }
        } else {
            prompts = aiPrompts; players.forEach((p, i) => { assignments[i] = [p, activeP[(i+1) % players.length]]; });
        }
        let missions = globalState.settings?.useMissions && nextRoundNum !== 3 ? await generateMissions(players.length) : null;
        let missionMap = missions ? players.reduce((acc, p, i) => ({...acc, [p]: missions[i]}), {}) : null;
        sendUpdate({ phase: 'answering', round: nextRoundNum, 'gameData/prompts': prompts, 'gameData/assignments': assignments, 'gameData/missions': missionMap, 'gameData/deadline': Date.now() + (nextRoundNum === 3 ? 90000 : 60000), 'gameData/roast': null, 'gameData/answers': null, 'gameData/votes': null, 'gameData/botVotesSubmitted': null, 'gameData/scoresCalculated': null, 'gameData/timeBonusesAwarded': null });
        myPhaseStartTime = 0; setTimeout(() => handleBotAnswers(prompts, assignments, nextRoundNum === 3), 1000);
    } catch (err) { document.getElementById('btn-next-round').disabled = false; showLoading(false); }
};