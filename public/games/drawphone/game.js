function setViewportHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(setViewportHeight, 100));
setViewportHeight();

const urlParams = new URLSearchParams(window.location.search);
const playersCountParam = parseInt(urlParams.get('players')) || 3;
const myName = urlParams.get('name') || 'Аноним';
const myUserId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';

let globalState = {};
let currentLocalRound = 0;
let selectedMode = 'classic'; 
let calculatedTotalRounds = 1; 

document.getElementById('players-count-display').innerText = playersCountParam;
document.getElementById('player-name-display').innerText = myName;

if (isHost) document.getElementById('host-controls').style.display = 'block';
else document.getElementById('guest-waiting').style.display = 'flex';

function leaveGame() { window.parent.postMessage({ type: 'leave_game' }, '*'); }
function requestFullscreen() { window.parent.postMessage({ type: 'request_fullscreen' }, '*'); }

// ==========================================
// ЛОББИ: ВКЛАДКИ, ИГРОКИ И РЕЖИМЫ
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

const modeDescriptions = {
    'classic': 'Обычная игра. Рисуй, отгадывай и веселись без жестких ограничений!',
    'icebreaker': 'Ледокол! Игра начинается не с текста, а с рисунка. Нарисуйте на первом этапе что угодно, а следующий игрок попытается это угадать!',
    'speedrun': 'Экстремальный режим! Время раунда урезается в 2 раза. Придется думать и рисовать очень быстро!',
    'nocolor': 'Секретный режим! Палитра заблокирована. Рисуем только черным цветом, как настоящие графики.',
    'hardcore': 'Без права на ошибку! Ластик, отмена действий и очистка холста отключены. Рисуй с первого раза!'
};

function selectMode(mode) {
  if (!isHost) return;
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('active');
}
function showModeInfo(e, mode) {
    e.stopPropagation(); 
    let title = document.querySelector(`.mode-card[data-mode="${mode}"] h4`).innerText;
    document.getElementById('info-modal-title').innerText = title;
    document.getElementById('info-modal-desc').innerText = modeDescriptions[mode];
    document.getElementById('info-modal').style.display = 'flex';
}
function closeInfoModal() { document.getElementById('info-modal').style.display = 'none'; }

function renderPlayersList(players) {
    const listEl = document.getElementById('lobby-players-list');
    if (!listEl) return;
    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const avatar = globalState.playerAvatars?.[id] || "https://picsum.photos/100";
        const isHostIcon = id === players[0] ? '<div class="host-crown">👑</div>' : ''; 
        return `<div class="player-avatar-wrap">${isHostIcon}<img src="${avatar}" alt="${name}"><span class="player-name-mini" title="${name}">${name}</span></div>`;
    }).join('');
}

// ==========================================
// АУДИО И ТАЙМЕРЫ (СИНХРОНИЗАЦИЯ ЭКРАНА ОЖИДАНИЯ)
// ==========================================
let audioCtx = null;
function initAudio() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playWarningBeep() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 880; 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

let phaseTimerInterval = null;
let currentPhaseSubmitted = false;
let isCurrentPhaseDrawing = false;

function updateTimerUI(remaining, limit) {
    let targetPrefix = currentPhaseSubmitted ? 'waiting' : (isCurrentPhaseDrawing ? 'draw' : 'text');
    let timerText = document.getElementById(`${targetPrefix}-timer-text`);
    let timerPath = document.getElementById(`${targetPrefix}-timer-path`);
    let timerContainer = document.getElementById(`${targetPrefix}-timer-container`);

    if (timerText) timerText.innerText = remaining;
    if (timerPath) {
        let dashoffset = 100 - (remaining / limit) * 100;
        timerPath.style.strokeDashoffset = dashoffset;
        timerPath.style.stroke = '#22c55e'; 
        if (remaining <= 10 && remaining > 0) {
            if (timerContainer) timerContainer.classList.add('timer-warning');
            if (!currentPhaseSubmitted) playWarningBeep(); 
        } else if (remaining <= limit / 2 && remaining > 10) {
            timerPath.style.stroke = '#eab308'; 
            if (timerContainer) timerContainer.classList.remove('timer-warning');
        } else {
            if (timerContainer) timerContainer.classList.remove('timer-warning');
        }
    }
}

function startPhaseTimer(isDrawing) {
    clearInterval(phaseTimerInterval);
    currentPhaseSubmitted = false;
    isCurrentPhaseDrawing = isDrawing;
    
    let timeLimit = globalState.settings?.time || 90;
    let timeRemaining = timeLimit;
    updateTimerUI(timeRemaining, timeLimit);

    phaseTimerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining < 0) {
            clearInterval(phaseTimerInterval);
            if (!currentPhaseSubmitted) {
                if (isDrawing) submitDrawing(false);
                else submitWord(false);
            }
        } else {
            updateTimerUI(timeRemaining, timeLimit);
        }
    }, 1000);
}

function updateWaitingScreen() {
    if (!document.getElementById('waiting-phase').classList.contains('active')) return;
    const players = globalState.players || [];
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    const listEl = document.getElementById('waiting-players-list');
    if (!listEl) return;

    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const isReady = currentSubs[id] !== undefined;
        const statusIcon = isReady ? '✅' : '⏳';
        const statusClass = isReady ? 'ready' : 'not-ready';
        return `<div class="waiting-player-item ${statusClass}"><span>${name}</span><span>${statusIcon}</span></div>`;
    }).join('');
}


// ==========================================
// СТАРТ ИГРЫ И СИНХРОНИЗАЦИЯ
// ==========================================
function startGame() {
  if (!isHost) return;
  initAudio(); 
  requestFullscreen();
  
  let baseTime = parseInt(document.getElementById('setting-time').value);
  let finalTime = selectedMode === 'speedrun' ? Math.max(30, Math.floor(baseTime / 2)) : baseTime;
  let roundsMult = parseInt(document.getElementById('setting-rounds').value);

  window.parent.postMessage({ type: 'start_game', settings: { mode: selectedMode, time: finalTime, roundsMultiplier: roundsMult } }, '*');
}

function playAgain() {
  if (!isHost) return;
  window.parent.postMessage({ type: 'play_again' }, '*');
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'sync_state') {
    globalState = event.data.state || {}; 
    handleStateChange();
  }
});

function handleStateChange() {
  const players = globalState.players || [];
  if (players.length > 0) renderPlayersList(players);

  if (!globalState.status || globalState.status === 'waiting') {
    currentLocalRound = 0; clearInterval(phaseTimerInterval);
    document.getElementById('play-again-btn').style.display = 'none';
    showPhase('lobby-screen'); return;
  }

  calculatedTotalRounds = players.length * (globalState.settings?.roundsMultiplier || 1);

  if (globalState.status === 'finished') {
    currentLocalRound = -1; clearInterval(phaseTimerInterval);
    if (globalState.presentation?.active) {
        showPhase('presentation-phase');
        if (isHost) document.getElementById('next-slide-btn').style.display = 'block';
        else document.getElementById('next-slide-btn').style.display = 'none';
        syncPresentationView(players);
    } else {
        showPhase('ready-to-present-phase');
        if (!isHost) {
            document.getElementById('btn-start-pres').style.display = 'none';
            document.getElementById('presentation-status-text').innerHTML = 'ОЖИДАНИЕ <span>ХОСТА</span>';
        }
    }
    return;
  }

  if (globalState.settings?.mode === 'nocolor') {
      document.getElementById('color-palette').style.visibility = 'hidden'; currentColor = '#000000';
  } else { document.getElementById('color-palette').style.visibility = 'visible'; }

  if (globalState.settings?.mode === 'hardcore') { document.getElementById('action-tools').style.display = 'none'; } 
  else { document.getElementById('action-tools').style.display = 'grid'; }

  if (globalState.round > currentLocalRound) startRound(globalState.round, players);

  updateWaitingScreen();

  if (isHost) {
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    if (Object.keys(currentSubs).length >= players.length) {
      if (globalState.round >= calculatedTotalRounds) window.parent.postMessage({ type: 'update_state', updates: { status: 'finished' } }, '*');
      else window.parent.postMessage({ type: 'update_state', updates: { round: globalState.round + 1 } }, '*');
    }
  }
}

function showPhase(phaseId) {
  document.querySelectorAll('.screen, .phase-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(phaseId);
  if (target.classList.contains('screen')) target.classList.add('active');
  else { document.getElementById('game-screen').classList.add('active'); target.classList.add('active'); }

  const leaveBtn = document.getElementById('leave-btn');
  if (phaseId === 'lobby-screen' || phaseId === 'ready-to-present-phase' || phaseId === 'presentation-phase') { leaveBtn.style.display = 'flex'; } 
  else { leaveBtn.style.display = 'none'; }
}

function getCurrentNotebookId(round, players) {
    const myIndex = players.indexOf(myUserId);
    if (myIndex === -1) return myUserId; 
    return players[(myIndex - round + 1 + players.length * 10) % players.length];
}

function startRound(round, players) {
  currentLocalRound = round;
  const isIcebreaker = globalState.settings?.mode === 'icebreaker';
  const isDrawingPhase = isIcebreaker ? (round % 2 !== 0) : (round % 2 === 0);
  
  const badgeText = `Этап ${round}/${calculatedTotalRounds}`;
  document.getElementById('text-round-badge').innerText = badgeText;
  document.getElementById('draw-round-badge').innerText = badgeText;

  startPhaseTimer(isDrawingPhase);

  if (round === 1) {
    if (isIcebreaker) {
        document.getElementById('word-to-draw').innerText = "Что угодно!"; showPhase('draw-phase');
        resetCanvasTransform(); clearCanvas(); initHistory(); 
    } else {
        document.getElementById('text-instruction').innerText = 'Придумайте фразу';
        document.getElementById('image-to-guess').style.display = 'none';
        document.getElementById('word-input').value = ''; showPhase('text-phase');
    }
  } else {
    const notebookId = getCurrentNotebookId(round, players);
    let previousData = globalState.submissions?.[`round_${round - 1}`]?.[notebookId];
    if (typeof previousData === 'string' && previousData.startsWith('{')) { try { previousData = JSON.parse(previousData).img; } catch(e){} }

    if (isDrawingPhase) {
      document.getElementById('word-to-draw').innerText = previousData || "..."; showPhase('draw-phase');
      resetCanvasTransform(); clearCanvas(); initHistory(); 
    } else {
      document.getElementById('text-instruction').innerText = 'Что здесь нарисовано?';
      const imgEl = document.getElementById('image-to-guess');
      imgEl.src = previousData || ""; imgEl.style.display = 'inline-block';
      document.getElementById('word-input').value = ''; showPhase('text-phase');
    }
  }
}

function submitWord(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true;
  let word = document.getElementById('word-input').value.trim();
  if (!word) word = "Секретик"; 
  
  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = word;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  
  showPhase('waiting-phase'); updateWaitingScreen();
}

function submitDrawing(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true;
  
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const finalData = JSON.stringify({ img: canvas.toDataURL('image/png'), strokes: recordedStrokes });

  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = finalData;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  
  resetCanvasTransform(); showPhase('waiting-phase'); updateWaitingScreen();
}

// ==========================================
// ИДЕАЛЬНЫЙ ХОЛСТ С ЗАПИСЬЮ И ФИКСОМ ЗУМА
// ==========================================
const canvas = document.getElementById('drawing-board');
const zoomContainer = document.getElementById('zoom-container');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentColor = '#000000'; 
let isErasing = false;

let canvasTransform = { x: 0, y: 0, scale: 1 };
let initialDistance = 0;
let lastZoomCenter = { x: 0, y: 0 };
let preZoomState = null; 

let recordedStrokes = [];
let strokesHistory = []; 
let currentStroke = null;

let drawHistory = [];
let historyIndex = -1;

function initHistory() { drawHistory = []; strokesHistory = []; recordedStrokes = []; historyIndex = -1; saveState(); }

function saveState() {
    if (globalState.settings?.mode === 'hardcore') return;
    if (historyIndex < drawHistory.length - 1) { drawHistory.length = historyIndex + 1; strokesHistory.length = historyIndex + 1; }
    drawHistory.push(canvas.toDataURL());
    strokesHistory.push(JSON.parse(JSON.stringify(recordedStrokes)));
    historyIndex++;
}

function restoreState(index) {
    let img = new Image(); img.src = drawHistory[index];
    img.onload = () => { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    recordedStrokes = JSON.parse(JSON.stringify(strokesHistory[index]));
}

function undo() { if (historyIndex > 0) { historyIndex--; restoreState(historyIndex); } }
function redo() { if (historyIndex < drawHistory.length - 1) { historyIndex++; restoreState(historyIndex); } }

ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

function setColor(color, element) {
    isErasing = false; currentColor = color; ctx.globalCompositeOperation = 'source-over';
    document.querySelectorAll('.swatch, .tool-btn').forEach(s => s.classList.remove('active-swatch'));
    if(element) element.classList.add('active-swatch');
}
function setEraser(element) {
    isErasing = true; ctx.globalCompositeOperation = 'destination-out';
    document.querySelectorAll('.swatch, .tool-btn').forEach(s => s.classList.remove('active-swatch'));
    element.classList.add('active-swatch');
}
function clearCanvas() {
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if(isErasing) ctx.globalCompositeOperation = 'destination-out';
  recordedStrokes.push({ type: 'clear' }); saveState();
}

function resetCanvasTransform() { canvasTransform = { x: 0, y: 0, scale: 1 }; updateTransform(); }

function updateTransform() {
    // Теперь мы трансформируем ВЕСЬ мольберт (Дерево + Холст)
    if (!zoomContainer) return;
    
    // Ограничение по отдалению (не меньше 1x)
    if (canvasTransform.scale <= 1) {
        canvasTransform.scale = 1;
        canvasTransform.x = 0;
        canvasTransform.y = 0;
    }

    zoomContainer.style.transformOrigin = `0 0`;
    zoomContainer.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
}

function getCoordinates(e) {
  // getBoundingClientRect идеально работает даже при зуме родительского контейнера!
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: ((clientX - rect.left) / rect.width) * canvas.width, y: ((clientY - rect.top) / rect.height) * canvas.height };
}

function startPosition(e) { 
    if (e.touches && e.touches.length >= 2) return; 
    preZoomState = canvas.toDataURL(); isDrawing = true; 
    let pos = getCoordinates(e);
    currentStroke = { c: currentColor, s: document.getElementById('brush-size').value, e: isErasing?1:0, p: [Math.round(pos.x), Math.round(pos.y)] };
    draw(e); 
}

function draw(e) {
  if (e.touches && e.touches.length >= 2) { e.preventDefault(); return handlePinchZoom(e); }
  if (!isDrawing) return; e.preventDefault(); 
  const pos = getCoordinates(e);
  if(currentStroke) { currentStroke.p.push(Math.round(pos.x), Math.round(pos.y)); }

  ctx.lineWidth = document.getElementById('brush-size').value;
  ctx.lineCap = 'round'; ctx.strokeStyle = currentColor; ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
}

function endPosition() { 
    if (!isDrawing) return; 
    isDrawing = false; ctx.beginPath(); 
    if (currentStroke) { recordedStrokes.push(currentStroke); currentStroke = null; }
    saveState(); 
}

function handlePinchZoom(e) {
    if (isDrawing) {
        isDrawing = false; ctx.beginPath(); currentStroke = null;
        if (preZoomState) {
            let img = new Image(); img.src = preZoomState;
            img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); }
        }
    }
    const t1 = e.touches[0]; const t2 = e.touches[1];
    const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const cx = (t1.clientX + t2.clientX) / 2; const cy = (t1.clientY + t2.clientY) / 2;
    
    if (initialDistance === 0) { initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; }
    
    let newScale = canvasTransform.scale * (currentDist / initialDistance);
    
    // Лимиты масштаба
    if (newScale < 1) newScale = 1;
    if (newScale > 5) newScale = 5;

    const wrapperRect = zoomContainer.parentElement.getBoundingClientRect();
    
    canvasTransform.x -= (cx - wrapperRect.left - canvasTransform.x) * (newScale / canvasTransform.scale - 1);
    canvasTransform.y -= (cy - wrapperRect.top - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
    
    canvasTransform.x += (cx - lastZoomCenter.x); 
    canvasTransform.y += (cy - lastZoomCenter.y);
    
    canvasTransform.scale = newScale; 
    initialDistance = currentDist; 
    lastZoomCenter = { x: cx, y: cy };
    
    updateTransform();
}

canvas.addEventListener('touchend', (e) => { 
    if (e.touches.length < 2) { 
        initialDistance = 0; 
        // Автоматический возврат на место, если слишком отдалили
        if (canvasTransform.scale <= 1) resetCanvasTransform();
    } 
    endPosition(); 
});
canvas.addEventListener('mousedown', startPosition); canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseleave', endPosition);
canvas.addEventListener('touchstart', startPosition, {passive: false}); canvas.addEventListener('touchmove', draw, {passive: false});

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ И УСКОРЕННАЯ АНИМАЦИЯ (X3)
// ==========================================
let voices = [];
window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };
function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ru-RU';
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices.find(v => v.lang.includes('ru'));
    if (bestVoice) utterance.voice = bestVoice; utterance.pitch = 0.9 + Math.random() * 0.4;
    window.speechSynthesis.speak(utterance);
}

function startPresentation() {
    if (!isHost) return;
    initAudio();
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: 0, round: 1 } }}, '*');
}

function playDrawingAnimation(canvasEl, strokes, finalImg) {
    const actx = canvasEl.getContext('2d');
    actx.fillStyle = '#ffffff'; actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    let strokeIdx = 0; let pointIdx = 0;
    
    function drawStep() {
        if (strokeIdx >= strokes.length) {
            let im = new Image(); im.src = finalImg; 
            im.onload = () => { actx.globalCompositeOperation = 'source-over'; actx.drawImage(im, 0, 0); };
            return;
        }
        
        // УСКОРЕНИЕ В 3 РАЗА (Отрисовываем по 100 точек за кадр)
        let pointsDrawn = 0;
        while (pointsDrawn < 100 && strokeIdx < strokes.length) {
            let stroke = strokes[strokeIdx];
            
            if (stroke.type === 'clear') {
                actx.globalCompositeOperation = 'source-over'; actx.fillStyle = '#ffffff';
                actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
                strokeIdx++; pointIdx = 0; pointsDrawn += 10; continue;
            }
            
            let pts = stroke.p;
            if (!pts || pts.length < 2) { strokeIdx++; pointIdx = 0; continue; }

            if (pointIdx === 0) {
                actx.beginPath(); actx.lineWidth = stroke.s; actx.lineCap = 'round'; actx.lineJoin = 'round';
                actx.strokeStyle = stroke.c; actx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
                actx.moveTo(pts[0], pts[1]); pointIdx = 2;
            }
            
            if (pointIdx < pts.length) {
                actx.lineTo(pts[pointIdx], pts[pointIdx+1]); actx.stroke();
                actx.beginPath(); actx.moveTo(pts[pointIdx], pts[pointIdx+1]);
                pointIdx += 2; pointsDrawn++;
            } else {
                strokeIdx++; pointIdx = 0;
            }
        }
        requestAnimationFrame(drawStep);
    }
    requestAnimationFrame(drawStep);
}

let renderedPresentationState = '';
function syncPresentationView(players) {
    const pres = globalState.presentation;
    if (!pres) return;

    const currentStateId = `${pres.bookIndex}-${pres.round}`;
    if (renderedPresentationState === currentStateId) return;

    if (pres.round === 1) document.getElementById('chat-messages').innerHTML = '';

    const bookOwnerId = players[pres.bookIndex];
    document.getElementById('chat-book-title').innerText = `История: ${globalState.playerNames?.[bookOwnerId] || "Аноним"}`;

    let rawData = globalState.submissions?.[`round_${pres.round}`]?.[bookOwnerId];
    let imgUrl = rawData;
    let strokesData = null;

    if (typeof rawData === 'string' && rawData.startsWith('{')) {
        try {
            let parsed = JSON.parse(rawData);
            if (parsed.img) { imgUrl = parsed.img; strokesData = parsed.strokes; }
        } catch(e) {}
    }

    const authorId = players[(players.indexOf(bookOwnerId) + pres.round - 1 + players.length * 10) % players.length];
    const authorName = globalState.playerNames?.[authorId] || "Аноним";
    const authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    
    const isIcebreaker = globalState.settings?.mode === 'icebreaker';
    const isText = isIcebreaker ? (pres.round % 2 === 0) : (pres.round % 2 !== 0);
    const side = isText ? 'left' : 'right';

    const visualContent = isText 
        ? `<div class="msg-text">${rawData}</div>` 
        : `<canvas class="msg-canvas" width="800" height="600" id="anim-canvas-${pres.round}-${bookOwnerId}"></canvas>`;

    const msgHTML = `
        <div class="msg-row ${side}">
            <img src="${authorAvatar}" class="msg-avatar">
            <div class="msg-bubble">
                <div class="msg-author">${authorName}</div>
                ${visualContent}
            </div>
        </div>
    `;

    const chatContainer = document.getElementById('chat-messages');
    chatContainer.insertAdjacentHTML('beforeend', msgHTML);
    setTimeout(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); }, 50);

    if (isText) {
        speakText(rawData);
    } else {
        // Ожидаем 100мс, чтобы DOM обновился и canvas 100% появился на экране
        setTimeout(() => {
            const canvasAnim = document.getElementById(`anim-canvas-${pres.round}-${bookOwnerId}`);
            if (canvasAnim && strokesData && strokesData.length > 0) {
                playDrawingAnimation(canvasAnim, strokesData, imgUrl);
            } else if (canvasAnim) {
                const cctx = canvasAnim.getContext('2d');
                let im = new Image(); im.src = imgUrl; im.onload = () => cctx.drawImage(im, 0, 0);
            }
        }, 100);
    }

    if (isHost) {
        const btn = document.getElementById('next-slide-btn');
        if (pres.round === calculatedTotalRounds) {
            if (pres.bookIndex === players.length - 1) {
                btn.style.display = 'none'; 
                document.getElementById('play-again-btn').style.display = 'block'; 
            } else { btn.innerText = "Следующая история"; }
        } else { btn.innerText = "Показать дальше"; }
    }

    renderedPresentationState = currentStateId;
}

function nextSlide() {
    if (!isHost) return;
    const pres = globalState.presentation;
    const players = globalState.players || [];
    let nextR = pres.round + 1; let nextB = pres.bookIndex;
    if (nextR > calculatedTotalRounds) { nextB++; nextR = 1; }
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: nextB, round: nextR } }}, '*');
}