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
// АУДИО И ТАЙМЕР
// ==========================================
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playWarningBeep() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880; 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

let phaseTimerInterval = null;
let currentPhaseSubmitted = false;

function startPhaseTimer(isDrawing) {
    clearInterval(phaseTimerInterval);
    currentPhaseSubmitted = false;
    
    let timeLimit = globalState.settings?.time || 90;
    let timeRemaining = timeLimit;
    
    let pathId = isDrawing ? 'draw-timer-path' : 'text-timer-path';
    let textId = isDrawing ? 'draw-timer-text' : 'text-timer-text';
    let containerId = isDrawing ? 'draw-timer-container' : 'text-timer-container';
    
    let timerPath = document.getElementById(pathId);
    let timerText = document.getElementById(textId);
    let timerContainer = document.getElementById(containerId);

    // Сброс стилей
    timerContainer.classList.remove('timer-warning');
    timerPath.style.stroke = '#22c55e'; // Зеленый в начале

    function updateUI() {
        if (currentPhaseSubmitted) return;
        timerText.innerText = timeRemaining;
        let dashoffset = 100 - (timeRemaining / timeLimit) * 100;
        timerPath.style.strokeDashoffset = dashoffset;

        if (timeRemaining <= 10 && timeRemaining > 0) {
            timerContainer.classList.add('timer-warning');
            playWarningBeep();
        } else if (timeRemaining <= timeLimit / 2 && timeRemaining > 10) {
            timerPath.style.stroke = '#eab308'; // Желтый на половине
        }
    }
    updateUI();

    phaseTimerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining < 0) {
            clearInterval(phaseTimerInterval);
            if (!currentPhaseSubmitted) {
                if (isDrawing) submitDrawing(false);
                else submitWord(false);
            }
        } else {
            updateUI();
        }
    }, 1000);
}


// ==========================================
// СТАРТ ИГРЫ
// ==========================================
function startGame() {
  if (!isHost) return;
  initAudio(); // Активируем звук по клику
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
    currentLocalRound = 0;
    clearInterval(phaseTimerInterval);
    document.getElementById('play-again-btn').style.display = 'none';
    showPhase('lobby-screen');
    return;
  }

  calculatedTotalRounds = players.length * (globalState.settings?.roundsMultiplier || 1);

  if (globalState.status === 'finished') {
    currentLocalRound = -1; 
    clearInterval(phaseTimerInterval);
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
      document.getElementById('color-palette').style.visibility = 'hidden';
      currentColor = '#000000';
  } else { document.getElementById('color-palette').style.visibility = 'visible'; }

  if (globalState.settings?.mode === 'hardcore') {
      document.getElementById('action-tools').style.display = 'none'; 
  } else { document.getElementById('action-tools').style.display = 'grid'; }

  if (globalState.round > currentLocalRound) startRound(globalState.round, players);

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
  if (phaseId === 'lobby-screen' || phaseId === 'ready-to-present-phase' || phaseId === 'presentation-phase') {
      leaveBtn.style.display = 'flex';
  } else { leaveBtn.style.display = 'none'; }
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
  
  // Обновление бейджа с раундом
  const badgeText = `Этап ${round}/${calculatedTotalRounds}`;
  document.getElementById('text-round-badge').innerText = badgeText;
  document.getElementById('draw-round-badge').innerText = badgeText;

  startPhaseTimer(isDrawingPhase);

  if (round === 1) {
    if (isIcebreaker) {
        document.getElementById('word-to-draw').innerText = "Что угодно!";
        showPhase('draw-phase');
        resetCanvasTransform(); clearCanvas(); initHistory(); 
    } else {
        document.getElementById('text-instruction').innerText = 'Придумайте фразу';
        document.getElementById('image-to-guess').style.display = 'none';
        document.getElementById('word-input').value = '';
        showPhase('text-phase');
    }
  } else {
    const notebookId = getCurrentNotebookId(round, players);
    let previousData = globalState.submissions?.[`round_${round - 1}`]?.[notebookId];
    
    // Если пред. данные - это объект (рисунок со штрихами), достаем картинку
    if (typeof previousData === 'string' && previousData.startsWith('{')) {
        try { previousData = JSON.parse(previousData).img; } catch(e){}
    }

    if (isDrawingPhase) {
      document.getElementById('word-to-draw').innerText = previousData || "...";
      showPhase('draw-phase');
      resetCanvasTransform(); clearCanvas(); initHistory(); 
    } else {
      document.getElementById('text-instruction').innerText = 'Что здесь нарисовано?';
      const imgEl = document.getElementById('image-to-guess');
      imgEl.src = previousData || "";
      imgEl.style.display = 'inline-block';
      document.getElementById('word-input').value = '';
      showPhase('text-phase');
    }
  }
}

function submitWord(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true;
  clearInterval(phaseTimerInterval);

  let word = document.getElementById('word-input').value.trim();
  if (!word) word = "Секретик"; // Дефолтное слово при автосабмите
  
  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = word;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  showPhase('waiting-phase');
}

function submitDrawing(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true;
  clearInterval(phaseTimerInterval);

  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // УПАКОВКА ИЗОБРАЖЕНИЯ И ИСТОРИИ ШТРИХОВ (Для крутой анимации)
  const finalData = JSON.stringify({
      img: canvas.toDataURL('image/png'),
      strokes: recordedStrokes
  });

  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = finalData;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  resetCanvasTransform();
  showPhase('waiting-phase');
}

// ==========================================
// ИДЕАЛЬНЫЙ ХОЛСТ С ЗАПИСЬЮ ИСТОРИИ (Анимация Рисования)
// ==========================================
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentColor = '#000000'; 
let isErasing = false;

let canvasTransform = { x: 0, y: 0, scale: 1 };
let initialDistance = 0;
let lastZoomCenter = { x: 0, y: 0 };
let preZoomState = null; 

// Запись штрихов
let recordedStrokes = [];
let strokesHistory = []; 
let currentStroke = null;

let drawHistory = [];
let historyIndex = -1;

function initHistory() { 
    drawHistory = []; strokesHistory = []; recordedStrokes = []; historyIndex = -1; saveState(); 
}

function saveState() {
    if (globalState.settings?.mode === 'hardcore') return;
    if (historyIndex < drawHistory.length - 1) {
        drawHistory.length = historyIndex + 1;
        strokesHistory.length = historyIndex + 1;
    }
    drawHistory.push(canvas.toDataURL());
    // Глубокая копия штрихов
    strokesHistory.push(JSON.parse(JSON.stringify(recordedStrokes)));
    historyIndex++;
}

function restoreState(index) {
    let img = new Image();
    img.src = drawHistory[index];
    img.onload = () => { 
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffffff'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); 
    };
    recordedStrokes = JSON.parse(JSON.stringify(strokesHistory[index]));
}

function undo() { if (historyIndex > 0) { historyIndex--; restoreState(historyIndex); } }
function redo() { if (historyIndex < drawHistory.length - 1) { historyIndex++; restoreState(historyIndex); } }

ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

function setColor(color, element) {
    isErasing = false; currentColor = color;
    ctx.globalCompositeOperation = 'source-over';
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
  recordedStrokes.push({ type: 'clear' });
  saveState();
}

function resetCanvasTransform() { canvasTransform = { x: 0, y: 0, scale: 1 }; updateTransform(); }
function updateTransform() { canvas.style.transformOrigin = `0 0`; canvas.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`; }

function getCoordinates(e) {
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
  
  if(currentStroke) {
      currentStroke.p.push(Math.round(pos.x), Math.round(pos.y));
  }

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
    let newScale = Math.min(Math.max(1, canvasTransform.scale * (currentDist / initialDistance)), 5); 
    const wrapperRect = canvas.parentElement.getBoundingClientRect();
    canvasTransform.x -= (cx - wrapperRect.left - canvasTransform.x) * (newScale / canvasTransform.scale - 1);
    canvasTransform.y -= (cy - wrapperRect.top - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
    canvasTransform.x += (cx - lastZoomCenter.x); canvasTransform.y += (cy - lastZoomCenter.y);
    canvasTransform.scale = newScale; initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy };
    updateTransform();
}

canvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) initialDistance = 0; endPosition(); });
canvas.addEventListener('mousedown', startPosition); canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseleave', endPosition);
canvas.addEventListener('touchstart', startPosition, {passive: false}); canvas.addEventListener('touchmove', draw, {passive: false});

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ И АНИМАЦИЯ ХОЛСТА
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

// Движок проигрывания анимации
function playDrawingAnimation(canvasEl, strokes, finalImg) {
    const actx = canvasEl.getContext('2d');
    actx.fillStyle = '#ffffff'; actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    let strokeIdx = 0; let pointIdx = 0;
    
    function drawStep() {
        if (strokeIdx >= strokes.length) {
            // В конце на всякий случай рисуем финальную картинку для идеальной точности
            let im = new Image(); im.src = finalImg; 
            im.onload = () => { actx.globalCompositeOperation = 'source-over'; actx.drawImage(im, 0, 0); };
            return;
        }
        
        // Рисуем по 15 точек за кадр (быстрая анимация)
        for (let i = 0; i < 15; i++) {
            if (strokeIdx >= strokes.length) break;
            let stroke = strokes[strokeIdx];
            
            if (stroke.type === 'clear') {
                actx.globalCompositeOperation = 'source-over'; actx.fillStyle = '#ffffff';
                actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
                strokeIdx++; pointIdx = 0; continue;
            }
            
            let pts = stroke.p;
            if (pts && pts.length >= 2) {
                if (pointIdx === 0) {
                    actx.beginPath(); actx.lineWidth = stroke.s; actx.lineCap = 'round'; actx.lineJoin = 'round';
                    actx.strokeStyle = stroke.c; actx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
                    actx.moveTo(pts[0], pts[1]); pointIdx = 2;
                }
                
                if (pointIdx < pts.length) {
                    actx.lineTo(pts[pointIdx], pts[pointIdx+1]); actx.stroke();
                    actx.beginPath(); actx.moveTo(pts[pointIdx], pts[pointIdx+1]);
                    pointIdx += 2;
                } else {
                    strokeIdx++; pointIdx = 0;
                }
            } else { strokeIdx++; pointIdx = 0; }
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

    // Распаковка данных (Текст или JSON рисунка)
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

    // Для рисунка создаем <canvas> вместо <img>
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
        // Запуск анимации
        const canvasAnim = document.getElementById(`anim-canvas-${pres.round}-${bookOwnerId}`);
        if (strokesData && strokesData.length > 0) {
            playDrawingAnimation(canvasAnim, strokesData, imgUrl);
        } else {
            // Фолбэк (если кто-то играл со старой версией без истории штрихов)
            const cctx = canvasAnim.getContext('2d');
            let im = new Image(); im.src = imgUrl; im.onload = () => cctx.drawImage(im, 0, 0);
        }
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
    
    let nextR = pres.round + 1;
    let nextB = pres.bookIndex;
    
    if (nextR > calculatedTotalRounds) { nextB++; nextR = 1; }
    
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: nextB, round: nextR } }}, '*');
}