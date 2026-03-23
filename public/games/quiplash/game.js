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
let currentTimerId = null; 
let myPhaseStartTime = 0; 
let spokenPhrases = new Set();
let currentTTSAudio = null; 

// --- ВСТРОЕННЫЙ ЗВУКОВОЙ ДВИЖОК (SFX) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (!isHost) return; 
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.log("Audio resume blocked by browser"));
        }
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

// --- СИНТЕЗАТОР РЕЧИ (АВТОНОМНЫЙ МУЖСКОЙ БАС) ---
async function speakText(text) {
    if (!isHost) return;

    if (currentTTSAudio) {
        currentTTSAudio.pause();
        currentTTSAudio.currentTime = 0;
    }

    const cleanText = text.replace(/<[^>]*>?/gm, ' ').replace(/[^\w\sа-яА-ЯёЁ0-9.,!?\-:;]/g, '').trim().substring(0, 150);
    if (!cleanText) return;

    const playLocal = () => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(cleanText);
        u.lang = 'ru-RU';
        u.rate = 1.0;
        const voices = window.speechSynthesis.getVoices();
        let maleVoice = voices.find(v => v.lang.includes('ru') && /(dmitry|pavel|maxim|male|муж)/i.test(v.name));
        let anyRuVoice = voices.find(v => v.lang.includes('ru'));
        if (maleVoice) { u.voice = maleVoice; u.pitch = 0.8; } 
        else if (anyRuVoice) { u.voice = anyRuVoice; u.pitch = 0.5; } 
        else { u.pitch = 0.6; }
        window.speechSynthesis.speak(u);
    };

    const playCloud = (url) => {
        return new Promise((resolve, reject) => {
            const audio = new Audio(); audio.crossOrigin = "anonymous"; audio.src = url; currentTTSAudio = audio;
            audio.oncanplaythrough = () => audio.play().catch(reject);
            audio.onended = resolve; audio.onerror = () => reject(new Error('Ошибка Google TTS')); audio.load();
        });
    };
    
    // Исправлено: если облачный TTS недоступен, фолбэк на локальный синтезатор
    try {
        const googleUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ru&q=${encodeURIComponent(cleanText)}`;
        await playCloud(googleUrl);
    } catch (e) {
        playLocal();
    }
}

// --- SVG ИКОНКИ ---
const SVGS = {
    crown: `<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`,
    target: `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    lightning: `<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
};

function typeWriterEffectHTML(el, htmlString, speed=35) {
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
    const target = document.getElementById(phaseId);
    if (target && target.classList.contains('active')) return; 
    playSound('whoosh');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    if(target) target.classList.add('active');
}

function showLoading(show, message = "Загрузка...") { setText('loading-message', message); setDisplay('global-loading', show ? 'flex' : 'none'); }
function updateDynamicBackground(phase, round) {
    if (!phase || phase === 'waiting') document.body.className = 'bg-lobby';
    else if (round === 1) document.body.className = 'bg-round1';
    else if (round === 2) document.body.className = 'bg-round2';
    else if (round === 3) document.body.className = 'bg-round3';
}

function sendUpdate(updates) {
    try { window.parent.postMessage({ type: 'update_state', updates: JSON.parse(JSON.stringify(updates)) }, '*'); } catch (e) {}
}

function startLocalTimer(deadlineMs, displayId, onExpireCallback, timerKey) {
    if (currentTimerId === timerKey) return; 
    currentTimerId = timerKey;
    clearInterval(currentTimerInterval);
    function update() {
        const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setText(displayId, remaining);
        if (remaining <= 10 && remaining > 0) playSound('tick');
        if (remaining <= 0) { clearInterval(currentTimerInterval); currentTimerId = null; if (isHost && onExpireCallback) onExpireCallback(); }
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

const FALLBACK_PROMPTS = ["Худшее, что можно крикнуть во время застолья?", "Неожиданная находка в кармане старой куртки?", "Секретный ингредиент в бургерах?", "Самая тупая причина для развода:"];

async function generatePrompts(round, count, playerNamesList = [], theme = "") {
    let namesStr = playerNamesList.length > 0 ? playerNamesList.join(', ') : "";
    let themeStr = theme ? `ИГРА ИДЕТ НА ТЕМУ: "${theme}". ВСЕ ВОПРОСЫ СВЯЖИ С ЭТОЙ ТЕМОЙ! ` : "";
    
    let basePrompt = `Твоя роль: Ты — ведущий комедийный сценарист студии Jackbox Games. Твоя задача — придумать вопросы и заходы (промпты) для игры в стиле «Смехлыст» (Quiplash).
Вайб и тональность: Абсурдный, дерзкий, слегка циничный, очень жизненный, иногда на грани фола (но без откровенной жести, запрещенной правилами). Вопросы должны провоцировать игроков на смешные, неожиданные или пошлые ответы.
Правило анти-повторов: Ты строго не должен повторяться ни в темах, ни в структуре вопросов. Чтобы избежать зацикливания, используй разные формулы генерации. Запрещено использовать заезженные клише (инопланетяне, зомби, первое свидание, собеседование).
Форматы вопросов (чередуй их):
- «Худший/Лучший…» (Пример: Худшее, что можно сказать, выходя из чужого туалета в гостях.)
- «Закончи фразу / Заполни пропуск» (Пример: Новый слоган Почты России: «Мы не теряем посылки, мы ___».)
- «Названия и бренды» (Пример: Название самого депрессивного парка аттракционов.)
- «Странные ситуации» (Пример: О чем на самом деле думает голубь, когда смотрит на тебя одним глазом?)
- «Альтернативная история/наука» (Пример: Секретный 11-й пункт в клятве Гиппократа.)
Используй колорит стран СНГ и узнаваемые бытовые ситуации (поликлиники, маршрутки, чаты дома, застолья, дачи).
${themeStr}
Требования к генерации: Сгенерируй ровно ${count} уникальных вопросов. Вопросы должны быть лаконичными (не больше 1-2 предложений) и оставлять игроку огромное пространство для шутки. НЕ задавай вопросы, на которые можно ответить «да» или «нет». `;

    if (namesStr) basePrompt += `Строго максимум в 1 вопросе используй случайное имя игрока (${namesStr}). `;
    if (round === 3) basePrompt += `ВАЖНО: Это ФИНАЛЬНЫЙ раунд. КАЖДЫЙ вопрос должен требовать перечислить ровно ТРИ вещи. `;
    basePrompt += `Выведи СТРОГО JSON массив строк (["вопрос 1", "вопрос 2"]). Больше ничего не пиши. Включи режим максимальной креативности. Поехали!`;

    let res = await fetchFromAI(basePrompt);
    try {
        res = res.replace(/```json/gi, '').replace(/```/g, '').trim(); let parsed = JSON.parse(res);
        if (Array.isArray(parsed) && parsed.length >= count) return parsed.slice(0, count); throw new Error("Format");
    } catch(e) { return Array(count).fill(0).map((_, i) => (theme ? `[${theme}] ` : '') + FALLBACK_PROMPTS[i % FALLBACK_PROMPTS.length]); }
}

async function generateBotAnswer(promptText, isRound3) {
    const sys = isRound3 ? `Вопрос: "${promptText}". Напиши 3 смешных ответа через <br> (1. [ответ]<br>2. [ответ]<br>3. [ответ]). БЕЗ КАВЫЧЕК. НА РУССКОМ.` : `Вопрос: "${promptText}". Напиши смешной ответ из 2-6 слов. БЕЗ КАВЫЧЕК. Без пояснений. НА РУССКОМ.`;
    const aiRes = await fetchFromAI(sys); return aiRes || (isRound3 ? "1. Ничего<br>2. Эм...<br>3. Секрет" : "Секретный ингредиент");
}

async function generateMissions(count) {
    const sys = `Сгенерируй ${count} уникальных, смешных секретных заданий для игроков в пати-игре.
ЗАДАЧА: Игрок должен выполнить это условие при написании своего ответа (например, ограничение на слова, стиль речи, формат).
ПРАВИЛА: Придумывай всё с нуля, прояви фантазию. ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ. СТРОЖАЙШЕ следи за грамматикой, текст должен быть на идеальном русском без ошибок.
Выведи СТРОГО JSON массив строк. Больше ничего не пиши.`;
    const res = await fetchFromAI(sys);
    try {
        let parsed = JSON.parse(res.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed) && parsed.length >= count) return parsed.slice(0, count); throw new Error();
    } catch(e) { return Array(count).fill("Обязательно используй в ответе название животного"); }
}

async function generateRoast(sortedPlayers) {
    const loser = sortedPlayers[sortedPlayers.length - 1]?.name || "Кто-то";
    
    const sys = `Твоя роль: Ты — максимально язвительный, циничный и высокомерный закадровый голос комедийной игры для вечеринок. Твоя задача — коротко и жестоко «прожарить» (зароустить) игрока, который занял абсолютное последнее место по очкам.
Имя этого неудачника: "${loser}".
Вайб и тональность: Пассивная агрессия, черный юмор, сарказм и хлесткие панчлайны. Это дружеская игра, так что избегай запрещенных тем (расизм, сексизм, реальные трагедии), но бей прямо по эго проигравшего. Игрок на последнем месте должен почувствовать себя интеллектуально беспомощным.
Используй один из углов для унижения (выбери случайно):
- «Ложная эмпатия» (Пример: Оу, ${loser} решил играть сердцем, а не мозгом. Очень зря.)
- «Сравнение с предметами» (Пример: Даже комнатный фикус набрал бы больше очков, чем ${loser}, если бы просто упал на клавиатуру.)
- «Техническая ошибка» (Пример: ${loser}, моргни дважды, если тебя держат в заложниках и не дают нормально отвечать.)
- «Прямое оскорбление чувства юмора» (Пример: Шутки от ${loser} настолько плохи, что где-то сейчас заплакал один Петросян.)
Задача: Сгенерируй ровно ОДНУ короткую реплику (максимум 1-2 предложения). Она должна звучать так, будто ведущий вздыхает от разочарования или искренне не понимает, как можно быть таким не смешным. 
Выдай только саму реплику, без кавычек, без лишних вступлений и извинений. Сделай это максимально обидно и смешно. НА РУССКОМ ЯЗЫКЕ.`;
    
    const res = await fetchFromAI(sys); return res || `${loser}, твои шутки вызывают только жалость.`;
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
    updateDynamicBackground(phase, round);
    showLoading(false);

    if (!status || status === 'waiting') {
        showPhase('lobby-screen'); isGeneratingRound = false; clearInterval(currentTimerInterval); currentTimerId = null;
        spokenPhrases.clear();

        const pList = globalState.roomPlayers || []; setText('players-count-display', pList.length > 0 ? pList.length : playersCountParam);
        
        const hostControls = document.getElementById('host-controls');
        if (isHost && !document.getElementById('toggle-theme')) {
            hostControls.innerHTML = `
                <div class="jackbox-settings">
                    <div class="j-setting"><span>Задания (Бета)</span><input type="checkbox" id="toggle-missions" class="j-checkbox"></div>
                    <div class="j-setting"><span>Тематическая игра</span><input type="checkbox" id="toggle-theme" class="j-checkbox"></div>
                </div>
                <button id="btn-start-game" class="j-start-btn" onclick="startGame()">НАЧАТЬ</button>
            `;
        }

        const listContainer = document.getElementById('lobby-players-list');
        const pListStr = JSON.stringify(pList);
        
        if (listContainer.getAttribute('data-plist') !== pListStr) {
            listContainer.setAttribute('data-plist', pListStr);
            if (pList.length > 0) {
                listContainer.innerHTML = pList.map(p => `
                    <div class="j-player-card ${p.id === myUserId ? 'is-me' : ''}">
                        <img src="${p.avatar || 'https://picsum.photos/100'}">
                        <div class="j-player-name">${p.name || "Аноним"}</div>
                        ${p.isHost ? `<div class="j-host-crown">${SVGS.crown}</div>` : ''}
                    </div>
                `).join('');
            }
        }
        
        setDisplay('host-controls', isHost ? 'block' : 'none'); setDisplay('guest-waiting', isHost ? 'none' : 'block');
        return;
    }

    if (status === 'playing' && !phase) {
        showPhase('lobby-screen'); showLoading(true, "Нейросеть генерирует вопросы...");
        if (isHost && !isGeneratingRound) { 
            if(audioCtx.state === 'suspended') audioCtx.resume().catch(e => {}); 
            isGeneratingRound = true; 
            initFirstRound(); 
        }
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
    if (useTheme) {
        themeText = prompt("Включена 'Тематическая игра'!\nВведите тему (Например: Аниме, Офис, 90-е):", "");
        if (themeText === null) return; 
    }
    document.getElementById('btn-start-game').disabled = true;
    window.parent.postMessage({ type: 'start_game', settings: { mode: 'quiplash', theme: themeText, useMissions: useMissions } }, '*');
};

async function initFirstRound() {
    try {
        if (!spokenPhrases.has('start_game')) { speakText("Начинаем игру! Готовьте свои шутки."); spokenPhrases.add('start_game'); }

        const players = getActivePlayers();
        let names = {...(globalState.playerNames || {})}; let avatars = {...(globalState.playerAvatars || {})};
        players.forEach((p, i) => { if (p.includes('ai_bot')) { names[p] = `НейроБот v${i+1}`; avatars[p] = `https://picsum.photos/100`; } });
        
        const theme = globalState.settings?.theme || "";
        const prompts = await generatePrompts(1, players.length, players.map(p => names[p] || "Аноним"), theme);
        
        let assignments = {};
        players.forEach((p, i) => {
            let q1 = i; let q2 = (i + 1) % players.length;
            if (!assignments[q1]) assignments[q1] = []; if (!assignments[q2]) assignments[q2] = [];
            assignments[q1].push(p); assignments[q2].push(p);
        });

        let missions = null;
        if (globalState.settings?.useMissions) {
            const aiMissions = await generateMissions(players.length);
            missions = {}; players.forEach((p, i) => { missions[p] = aiMissions[i]; });
        }

        sendUpdate({ phase: 'answering', round: 1, playerNames: names, playerAvatars: avatars, activePlayersList: players, gameData: { prompts, assignments, missions, deadline: Date.now() + 60000 } });
        setTimeout(() => handleBotAnswers(prompts, assignments, false), 1000);
    } catch (err) { isGeneratingRound = false; }
}

async function handleBotAnswers(prompts, assignments, isRound3) {
    let botAnswers = {}; let promises = [];
    for (let qIdx in assignments) {
        let aiPlayers = assignments[qIdx].filter(p => p.includes('ai_bot'));
        for (let botId of aiPlayers) {
            if (!botAnswers[qIdx]) botAnswers[qIdx] = {};
            promises.push(generateBotAnswer(prompts[qIdx] || "", isRound3).then(ans => botAnswers[qIdx][botId] = ans));
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
    const assignments = gd.assignments || {};
    
    const container = document.getElementById('prompts-scroll-area');

    if (gd.deadline && container.getAttribute('data-rendered-round') !== String(globalState.round)) {
        startLocalTimer(gd.deadline, 'answering-timer', () => { if (isHost && !globalState._transitioningToVoting) forceTransitionToVoting(); }, 'answering_' + globalState.round);
    }

    let myQuestions = [];
    for (let qIdx in assignments) { if (assignments[qIdx] && assignments[qIdx].includes(myUserId)) myQuestions.push({ idx: qIdx, text: (gd.prompts || [])[qIdx] || "" }); }

    if (container.getAttribute('data-rendered-round') !== String(globalState.round)) {
        let missionHtml = '';
        if (globalState.settings?.useMissions && gd.missions && gd.missions[myUserId]) {
            missionHtml = `<div class="secret-mission-banner">${SVGS.target} Секретное задание: ${gd.missions[myUserId]}</div>`;
        }

        container.innerHTML = missionHtml + myQuestions.map((q) => `
            <div class="question-card">
                <div class="q-text">${q.text}</div>
                ${isRound3 ? `
                    <input type="text" id="answer-input-${q.idx}-1" maxlength="150" class="modern-input" placeholder="1..." oninput="checkAnswersFilled()">
                    <input type="text" id="answer-input-${q.idx}-2" maxlength="150" class="modern-input" placeholder="2..." style="margin-top:5px;" oninput="checkAnswersFilled()">
                    <input type="text" id="answer-input-${q.idx}-3" maxlength="150" class="modern-input" placeholder="3..." style="margin-top:5px;" oninput="checkAnswersFilled()">
                ` : `<input type="text" id="answer-input-${q.idx}" maxlength="150" class="modern-input" placeholder="Введите смешной ответ..." oninput="checkAnswersFilled()">`}
            </div>
        `).join('');
        container.setAttribute('data-rendered-round', globalState.round);
    }
    
    let allFilled = myQuestions.length > 0 && myQuestions.every(q => (gd.answers || {})[q.idx]?.[myUserId]);
    
    setDisplay('prompts-scroll-area', myQuestions.length === 0 || allFilled ? 'none' : 'block');
    setDisplay('answering-footer', myQuestions.length === 0 || allFilled ? 'none' : 'block');
    setDisplay('answering-waiting', myQuestions.length === 0 || allFilled ? 'flex' : 'none');
    if (myQuestions.length === 0) document.querySelector('#answering-waiting h3').innerText = "Вы зритель!";

    if (isHost) {
        let totalNeeded = 0; for(let q in assignments) totalNeeded += assignments[q].length;
        let totalGiven = 0; for (let q in (gd.answers || {})) if (gd.answers[q]) totalGiven += Object.keys(gd.answers[q]).length;
        if (totalNeeded > 0 && totalGiven >= totalNeeded && !globalState._transitioningToVoting) forceTransitionToVoting();
    }
}

function forceTransitionToVoting() {
    globalState._transitioningToVoting = true; clearInterval(currentTimerInterval); currentTimerId = null;
    myPhaseStartTime = 0; 
    sendUpdate({ phase: 'voting', 'gameData/currentVoteIndex': 0, 'gameData/deadline': Date.now() + 20000 });
}

window.checkAnswersFilled = function() {
    const inputs = document.querySelectorAll('input[id^="answer-input-"]');
    document.getElementById('btn-submit-answers').disabled = !Array.from(inputs).every(inp => inp.value.trim().length > 0);
};

window.submitAnswers = function() {
    const gd = globalState.gameData || {}; const updates = {};
    const timeTakes = Math.floor((Date.now() - myPhaseStartTime) / 1000); 
    
    for (let qIdx in gd.assignments) {
        if (gd.assignments[qIdx].includes(myUserId)) {
            if (globalState.round === 3) {
                const v1 = document.getElementById(`answer-input-${qIdx}-1`)?.value.trim();
                const v2 = document.getElementById(`answer-input-${qIdx}-2`)?.value.trim();
                const v3 = document.getElementById(`answer-input-${qIdx}-3`)?.value.trim();
                updates[`gameData/answers/${qIdx}/${myUserId}`] = `1. ${v1}<br>2. ${v2}<br>3. ${v3}`;
            } else {
                updates[`gameData/answers/${qIdx}/${myUserId}`] = document.getElementById(`answer-input-${qIdx}`)?.value.trim() || "Без ответа";
            }
        }
    }
    updates[`gameData/answerTimes/${myUserId}`] = timeTakes; 
    sendUpdate(updates);
};

function renderVotingPhase() {
    showPhase('voting-phase');
    globalState._transitioningToResult = false; 
    const gd = globalState.gameData || {}; const vIdx = gd.currentVoteIndex || 0;
    
    setText('voting-prompt', gd.prompts[vIdx] || "...");

    const grid = document.getElementById('voting-answers-grid');

    if (grid.getAttribute('data-vote-idx') !== String(vIdx)) {
        grid.setAttribute('data-vote-idx', String(vIdx));
        
        if (gd.deadline) {
            startLocalTimer(gd.deadline, 'voting-timer', () => {
                if (isHost && !globalState._transitioningToResult) { globalState._transitioningToResult = true; sendUpdate({ phase: 'voting_result' }); }
            }, 'voting_' + vIdx);
        }

        const voteKey = `vote_${globalState.round}_${vIdx}`;
        if (!spokenPhrases.has(voteKey)) { speakText(gd.prompts[vIdx]); spokenPhrases.add(voteKey); }
    }
    
    const authors = gd.assignments[vIdx] || []; const currentAnswers = gd.answers?.[vIdx] || {}; const votes = gd.votes?.[vIdx] || {};
    const isAuthor = authors.includes(myUserId); const hasVoted = votes[myUserId];

    grid.innerHTML = authors.map(authorId => {
        const disabled = isAuthor || hasVoted;
        return `<div class="answer-btn ${disabled ? 'disabled' : ''} ${votes[myUserId] === authorId ? 'voted' : ''}" onclick="!${disabled} && submitVote('${authorId}')">${currentAnswers[authorId] || "(нет ответа)"}</div>`;
    }).join('');

    setText('voting-status', isAuthor ? "Вы не можете голосовать за свой ответ." : (hasVoted ? "Голос принят!" : "Голосуйте за лучший!"));

    if (isHost) {
        if (!gd.botVotesSubmitted?.[vIdx]) {
            const aiPlayers = (globalState.activePlayersList || []).filter(p => p.includes('ai_bot'));
            let botUpdates = {}; let botsVoted = false;
            aiPlayers.forEach(botId => {
                if (!authors.includes(botId) && authors.length > 0) {
                    botUpdates[`gameData/votes/${vIdx}/${botId}`] = authors[Math.floor(Math.random() * authors.length)]; botsVoted = true;
                }
            });
            if (botsVoted) { botUpdates[`gameData/botVotesSubmitted/${vIdx}`] = true; sendUpdate(botUpdates); }
        }

        const expectedVotes = Math.max(0, (globalState.activePlayersList || []).length - authors.length);
        if (expectedVotes > 0 && Object.keys(votes).length >= expectedVotes && !globalState._transitioningToResult) {
            clearInterval(currentTimerInterval); currentTimerId = null;  globalState._transitioningToResult = true;
            setTimeout(() => sendUpdate({ phase: 'voting_result' }), 1000);
        }
    }
}

window.submitVote = function(targetId) { sendUpdate({ [`gameData/votes/${(globalState.gameData || {}).currentVoteIndex || 0}/${myUserId}`]: targetId }); };

function renderVotingResultPhase() {
    showPhase('voting-result-phase');
    setDisplay('btn-next-vote', 'none'); 
    clearInterval(currentTimerInterval); 
    currentTimerId = null;

    const gd = globalState.gameData || {}; const vIdx = gd.currentVoteIndex || 0;
    const authors = gd.assignments[vIdx] || []; const currentVotes = gd.votes?.[vIdx] || {};
    let voteCounts = {}; authors.forEach(a => voteCounts[a] = 0);
    let totalVotes = 0; for (let voter in currentVotes) { if (voteCounts[currentVotes[voter]] !== undefined) { voteCounts[currentVotes[voter]]++; totalVotes++; } }

    if (isHost && !gd.scoresCalculated?.[vIdx]) {
        let newScores = {...(gd.scores || {})}; let mult = globalState.round || 1; 
        authors.forEach(a => {
            if (!newScores[a]) newScores[a] = 0;
            newScores[a] += (voteCounts[a] * 100 * mult);
            if (totalVotes > 0 && voteCounts[a] === totalVotes) newScores[a] += (250 * mult);
            let otherVotes = authors.find(o => o !== a) ? voteCounts[authors.find(o => o !== a)] : 0;
            if (voteCounts[a] > otherVotes) {
                const secs = gd.answerTimes?.[a] || 30; 
                const timeBonus = Math.max(0, 30 - secs) * 10;
                newScores[a] += timeBonus;
                sendUpdate({ [`gameData/timeBonusesAwarded/${vIdx}/${a}`]: timeBonus });
            }
        });
        
        // Исправлено: замена жесткого setTimeout на управляемый таймер, который восстанавливается, даже если хост моргнет
        const targetDeadline = Date.now() + 7000;
        sendUpdate({'gameData/scores': newScores, [`gameData/scoresCalculated/${vIdx}`]: true, 'gameData/resultPhaseDeadline': targetDeadline});
        
        startLocalTimer(targetDeadline, 'some-dummy-id', () => {
            document.getElementById('result-answers-grid').removeAttribute('data-rendered-idx');
            let nextIdx = vIdx + 1;
            if (nextIdx >= gd.prompts.length) {
                const sorted = (globalState.activePlayersList || []).map(id => ({ name: globalState.playerNames?.[id] || "Бот", score: newScores[id] || 0 })).sort((a, b) => b.score - a.score);
                generateRoast(sorted).then(r => sendUpdate({ phase: 'scoreboard', 'gameData/roast': r }));
            }
            else sendUpdate({ phase: 'voting', 'gameData/currentVoteIndex': nextIdx, 'gameData/deadline': Date.now() + 20000 });
        }, 'result_timer');
    } else if (isHost && gd.scoresCalculated?.[vIdx] && gd.resultPhaseDeadline) {
        // Подхватываем таймер, если хост обновил страницу в процессе
        startLocalTimer(gd.resultPhaseDeadline, 'some-dummy-id', () => {
            document.getElementById('result-answers-grid').removeAttribute('data-rendered-idx');
            let nextIdx = vIdx + 1;
            if (nextIdx >= gd.prompts.length) {
                const sorted = (globalState.activePlayersList || []).map(id => ({ name: globalState.playerNames?.[id] || "Бот", score: gd.scores[id] || 0 })).sort((a, b) => b.score - a.score);
                generateRoast(sorted).then(r => sendUpdate({ phase: 'scoreboard', 'gameData/roast': r }));
            }
            else sendUpdate({ phase: 'voting', 'gameData/currentVoteIndex': nextIdx, 'gameData/deadline': Date.now() + 20000 });
        }, 'result_timer');
    }

    const grid = document.getElementById('result-answers-grid');
    
    if (grid.getAttribute('data-rendered-idx') === String(vIdx)) return;
    grid.setAttribute('data-rendered-idx', String(vIdx));

    setText('result-prompt', gd.prompts[vIdx] || "Результаты");
    playSound('badum');

    grid.innerHTML = authors.map(authorId => {
        let pct = totalVotes === 0 ? 0 : Math.round((voteCounts[authorId] / totalVotes) * 100);
        let otherVotes = authors.find(a => a !== authorId) ? voteCounts[authors.find(a => a !== authorId)] : 0;
        let isWinner = voteCounts[authorId] > otherVotes; let isLoser = voteCounts[authorId] < otherVotes;
        if (voteCounts[authorId] === otherVotes) { isWinner = true; isLoser = false; }

        const ansHtml = gd.answers?.[vIdx]?.[authorId] || "(нет ответа)";
        const tBonus = gd.timeBonusesAwarded?.[vIdx]?.[authorId];
        const bonusBadge = tBonus ? `<div class="time-bonus-badge">${SVGS.lightning} +${tBonus} за скорость!</div>` : '';

        return `
            <div class="answer-btn ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}" style="cursor:default; display:flex; flex-direction:column; align-items:center;">
                ${bonusBadge}
                <div class="result-text-container" data-text="${ansHtml.replace(/"/g, '&quot;')}"></div>
                <div class="vote-stats">${pct}%</div>
                <div class="author-info"><img src="${globalState.playerAvatars?.[authorId] || 'https://picsum.photos/100'}"><span>${globalState.playerNames?.[authorId] || "Бот"}</span></div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.result-text-container').forEach(el => typeWriterEffectHTML(el, el.getAttribute('data-text')));
}

function renderScoreboardPhase() {
    showPhase('scoreboard-phase');
    setDisplay('btn-next-round', isHost ? 'block' : 'none');
    document.getElementById('btn-next-round').disabled = false;

    const list = document.getElementById('scoreboard-list');
    
    if (list.getAttribute('data-round') === String(globalState.round)) return;
    list.setAttribute('data-round', String(globalState.round));

    const scores = globalState.gameData?.scores || {};
    let sorted = (globalState.activePlayersList || []).map(id => ({
        name: globalState.playerNames?.[id] || "Бот", avatar: globalState.playerAvatars?.[id] || "https://picsum.photos/100", score: scores[id] || 0
    })).sort((a, b) => b.score - a.score);

    list.innerHTML = sorted.map((p, i) => `
        <div class="score-row ${i === 0 ? 'rank-1' : ''}">
            <div class="score-left"><span class="rank-num">${i+1}</span><img src="${p.avatar}"><span class="score-name">${p.name} ${i === 0 && globalState.round === 3 ? `<div class="joke-man-badge">${SVGS.crown} ЧЕЛОВЕК-АНЕКДОТ</div>` : ''}</span></div>
            <div class="score-val">${p.score}</div>
        </div>
    `).join('');
    
    if (globalState.gameData?.roast) {
        const roastKey = `roast_audio_${globalState.round}`;
        if (!spokenPhrases.has(roastKey)) {
            speakText(globalState.gameData.roast); 
            spokenPhrases.add(roastKey);
        }
    }

    setText('btn-next-round', globalState.round >= 3 ? "ВЕРНУТЬСЯ В ЛОББИ" : (globalState.round === 2 ? "К ФИНАЛУ!" : "СЛЕДУЮЩИЙ РАУНД"));
}

window.nextRound = async function() {
    if (!isHost) return;
    document.getElementById('btn-next-round').disabled = true; 
    
    if (globalState.round >= 3) {
        document.getElementById('prompts-scroll-area').removeAttribute('data-rendered-round');
        document.getElementById('scoreboard-list').removeAttribute('data-round');
        sendUpdate({ status: 'waiting', phase: null }); return;
    }

    try {
        const nextRoundNum = globalState.round + 1;
        
        const roundSpeechKey = `round_speech_${nextRoundNum}`;
        if (!spokenPhrases.has(roundSpeechKey)) {
            speakText(nextRoundNum === 3 ? "Финал! Назовите три вещи." : "Раунд два. Ставки повышаются.");
            spokenPhrases.add(roundSpeechKey);
        }

        showLoading(true, nextRoundNum === 3 ? "Подготовка финала..." : "Генерация раунда х2...");
        
        const players = globalState.activePlayersList || [];
        const theme = globalState.settings?.theme || "";
        
        let activeP = [...players];
        if (nextRoundNum === 3 && activeP.length % 2 !== 0) activeP.push('ai_bot_thriplash');
        
        const pairsCount = nextRoundNum === 3 ? (activeP.length / 2) : players.length;
        const aiPrompts = await generatePrompts(nextRoundNum, pairsCount, players.map(p => globalState.playerNames?.[p] || "Аноним"), theme);
        
        let prompts = []; let assignments = {};
        if (nextRoundNum === 3) {
            for(let i=0; i < activeP.length; i+=2) { 
                let pairIdx = i/2;
                prompts[pairIdx] = aiPrompts[pairIdx] || FALLBACK_PROMPTS[0]; 
                assignments[pairIdx] = [activeP[i], activeP[i+1]]; 
            }
        } else {
            prompts = aiPrompts;
            players.forEach((p, i) => {
                let q1 = i; let q2 = (i + 1) % pairsCount;
                if (!assignments[q1]) assignments[q1] = []; if (!assignments[q2]) assignments[q2] = [];
                assignments[q1].push(p); assignments[q2].push(p);
            });
        }

        let missions = null;
        if (globalState.settings?.useMissions && nextRoundNum !== 3) {
            const aiMissions = await generateMissions(players.length);
            missions = {}; players.forEach((p, i) => { missions[p] = aiMissions[i]; });
        }

        sendUpdate({ 
            phase: 'answering', round: nextRoundNum, 'gameData/prompts': prompts, 'gameData/assignments': assignments, 'gameData/missions': missions,
            'gameData/deadline': Date.now() + (nextRoundNum === 3 ? 90000 : 60000), 'gameData/roast': null,
            'gameData/answers': null, 'gameData/votes': null, 'gameData/botVotesSubmitted': null, 'gameData/scoresCalculated': null, 'gameData/timeBonusesAwarded': null
        });
        myPhaseStartTime = 0;
        setTimeout(() => handleBotAnswers(prompts, assignments, nextRoundNum === 3), 1000);
    } catch (err) { document.getElementById('btn-next-round').disabled = false; showLoading(false); }
};