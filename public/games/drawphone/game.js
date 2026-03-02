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

document.getElementById('players-count-display').innerText = playersCountParam;
document.getElementById('player-name-display').innerText = myName;

if (isHost) document.getElementById('host-controls').style.display = 'block';
else document.getElementById('guest-waiting').style.display = 'flex';

function leaveGame() { window.parent.postMessage({ type: 'leave_game' }, '*'); }
function requestFullscreen() { window.parent.postMessage({ type: 'request_fullscreen' }, '*'); }

// ==========================================
// ЛОББИ: РЕЖИМЫ И ОПИСАНИЯ
// ==========================================
const modeDescriptions = {
    'classic': 'Обычная игра. Рисуй, отгадывай и веселись без жестких ограничений!',
    'speedrun': 'Экстремальный режим! Базовое время раунда автоматически урезается ровно в 2 раза. Придется думать и рисовать очень быстро!',
    'nocolor': 'Секретный режим! Палитра красок заблокирована. Всем игрокам придется рисовать только черным цветом, как настоящим художникам-графикам.'
};

function selectMode(mode) {
  if (!isHost) return;
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('active');
}

function showModeInfo(e, mode) {
    e.stopPropagation(); // Чтобы карточка не выделялась при клике на "?"
    document.getElementById('info-modal-title').innerText = 
        mode === 'classic' ? 'Классика' : mode === 'speedrun' ? 'Спидран' : 'Секрет';
    document.getElementById('info-modal-desc').innerText = modeDescriptions[mode];
    document.getElementById('info-modal').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// ==========================================
// СТАРТ ИГРЫ (ОБРАБОТКА ВРЕМЕНИ ДЛЯ СПИДРАНА)
// ==========================================
function startGame() {
  if (!isHost) return;
  requestFullscreen();
  
  let baseTime = parseInt(document.getElementById('setting-time').value);
  
  // Логика режима Спидран - режем время пополам, но не меньше 30 сек
  let finalTime = selectedMode === 'speedrun' ? Math.max(30, Math.floor(baseTime / 2)) : baseTime;

  window.parent.postMessage({ 
      type: 'start_game', 
      settings: { mode: selectedMode, time: finalTime } 
  }, '*');
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
  if (!globalState.status || globalState.status === 'waiting') {
    currentLocalRound = 0;
    document.getElementById('play-again-btn').style.display = 'none';
    showPhase('lobby-screen');
    return;
  }

  if (globalState.status === 'finished') {
    currentLocalRound = -1; 
    
    if (globalState.presentation?.active) {
        showPhase('presentation-phase');
        if (isHost) document.getElementById('next-slide-btn').style.display = 'block';
        else document.getElementById('next-slide-btn').style.display = 'none';
        syncPresentationView();
    } else {
        showPhase('ready-to-present-phase');
        if (!isHost) {
            document.getElementById('btn-start-pres').style.display = 'none';
            document.getElementById('presentation-status-text').innerHTML = 'ОЖИДАНИЕ <span>ХОСТА</span>';
        }
    }
    return;
  }

  const players = globalState.players || [];
  if (players.length === 0) return;
  const totalRounds = globalState.totalRounds || players.length;

  if (globalState.settings?.mode === 'nocolor') {
      document.getElementById('color-palette').style.visibility = 'hidden';
      currentColor = '#000000';
  } else {
      document.getElementById('color-palette').style.visibility = 'visible';
  }

  if (globalState.round > currentLocalRound) startRound(globalState.round, players, totalRounds);

  if (isHost) {
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    if (Object.keys(currentSubs).length >= players.length) {
      if (globalState.round >= totalRounds) window.parent.postMessage({ type: 'update_state', updates: { status: 'finished' } }, '*');
      else window.parent.postMessage({ type: 'update_state', updates: { round: globalState.round + 1 } }, '*');
    }
  }
}

// ==========================================
// УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ И КНОПКОЙ ВЫХОДА
// ==========================================
function showPhase(phaseId) {
  document.querySelectorAll('.screen, .phase-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(phaseId);
  if (target.classList.contains('screen')) target.classList.add('active');
  else { document.getElementById('game-screen').classList.add('active'); target.classList.add('active'); }

  // Скрытие кнопки выхода во время игры
  const leaveBtn = document.getElementById('leave-btn');
  if (phaseId === 'lobby-screen' || phaseId === 'ready-to-present-phase' || phaseId === 'presentation-phase') {
      leaveBtn.style.display = 'flex';
  } else {
      leaveBtn.style.display = 'none';
  }
}

function getCurrentNotebookId(round, players) {
    const myIndex = players.indexOf(myUserId);
    if (myIndex === -1) return myUserId; 
    return players[(myIndex - round + 1 + players.length * 10) % players.length];
}

function startRound(round, players, totalRounds) {
  currentLocalRound = round;
  const isDrawingPhase = (round % 2 === 0);
  
  if (round === 1) {
    document.getElementById('text-instruction').innerText = 'Придумайте фразу';
    document.getElementById('image-to-guess').style.display = 'none';
    document.getElementById('word-input').value = '';
    showPhase('text-phase');
  } else {
    const notebookId = getCurrentNotebookId(round, players);
    const previousData = globalState.submissions?.[`round_${round - 1}`]?.[notebookId];

    if (isDrawingPhase) {
      document.getElementById('word-to-draw').innerText = previousData || "...";
      showPhase('draw-phase');
      resetCanvasTransform();
      clearCanvas(); 
      initHistory(); 
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

function submitWord() {
  requestFullscreen();
  const word = document.getElementById('word-input').value.trim();
  if (!word) return alert("Не оставляйте поле пустым!");
  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = word;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  showPhase('waiting-phase');
}

function submitDrawing() {
  requestFullscreen();
  const updates = {};
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = canvas.toDataURL('image/png');
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  resetCanvasTransform();
  showPhase('waiting-phase');
}

// ==========================================
// ИДЕАЛЬНЫЙ ХОЛСТ: КООРДИНАТЫ И ЗУМ
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

let drawHistory = [];
let historyIndex = -1;

function initHistory() {
    drawHistory = [];
    historyIndex = -1;
    saveState(); 
}

function saveState() {
    if (historyIndex < drawHistory.length - 1) drawHistory.length = historyIndex + 1;
    drawHistory.push(canvas.toDataURL());
    historyIndex++;
}

function restoreState(index) {
    let img = new Image();
    img.src = drawHistory[index];
    img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function undo() { if (historyIndex > 0) { historyIndex--; restoreState(historyIndex); } }
function redo() { if (historyIndex < drawHistory.length - 1) { historyIndex++; restoreState(historyIndex); } }

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function setColor(color, element) {
    isErasing = false; currentColor = color;
    ctx.globalCompositeOperation = 'source-over';
    document.querySelectorAll('.swatch, .tool-btn').forEach(s => s.classList.remove('active-swatch'));
    if(element) element.classList.add('active-swatch');
}

function setEraser(element) {
    isErasing = true;
    ctx.globalCompositeOperation = 'destination-out';
    document.querySelectorAll('.swatch, .tool-btn').forEach(s => s.classList.remove('active-swatch'));
    element.classList.add('active-swatch');
}

function clearCanvas() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if(isErasing) ctx.globalCompositeOperation = 'destination-out';
  saveState();
}

function resetCanvasTransform() {
    canvasTransform = { x: 0, y: 0, scale: 1 };
    updateTransform();
}

function updateTransform() {
    canvas.style.transformOrigin = `0 0`; 
    canvas.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
}

// ТОЧНЫЕ КООРДИНАТЫ (Теперь без смещения!)
function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  // Поскольку мы жестко зафиксировали пропорции обертки холста (aspect-ratio),
  // rect всегда в точности соответствует размеру внутреннего разрешения 800x600.
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  
  return { 
      x: relX * canvas.width, 
      y: relY * canvas.height 
  };
}

function startPosition(e) { 
    if (e.touches && e.touches.length >= 2) return; 
    preZoomState = canvas.toDataURL();
    isDrawing = true; 
    draw(e); 
}

function draw(e) {
  if (e.touches && e.touches.length >= 2) { 
      e.preventDefault(); 
      return handlePinchZoom(e); 
  }
  if (!isDrawing) return;
  e.preventDefault(); 
  const pos = getCoordinates(e);
  ctx.lineWidth = document.getElementById('brush-size').value;
  ctx.lineCap = 'round';
  ctx.strokeStyle = currentColor;
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function endPosition() { 
    if (!isDrawing) return;
    isDrawing = false; 
    ctx.beginPath(); 
    saveState();
}

function handlePinchZoom(e) {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
        if (preZoomState) {
            let img = new Image();
            img.src = preZoomState;
            img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); }
        }
    }

    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const cx = (t1.clientX + t2.clientX) / 2;
    const cy = (t1.clientY + t2.clientY) / 2;

    if (initialDistance === 0) {
        initialDistance = currentDist;
        lastZoomCenter = { x: cx, y: cy };
    }

    const scaleMultiplier = currentDist / initialDistance;
    let newScale = Math.min(Math.max(1, canvasTransform.scale * scaleMultiplier), 5); 

    const wrapperRect = canvas.parentElement.getBoundingClientRect();
    const mouseX = cx - wrapperRect.left;
    const mouseY = cy - wrapperRect.top;

    canvasTransform.x -= (mouseX - canvasTransform.x) * (newScale / canvasTransform.scale - 1);
    canvasTransform.y -= (mouseY - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
    canvasTransform.x += (cx - lastZoomCenter.x);
    canvasTransform.y += (cy - lastZoomCenter.y);

    canvasTransform.scale = newScale;
    initialDistance = currentDist;
    lastZoomCenter = { x: cx, y: cy };

    updateTransform();
}

canvas.addEventListener('touchend', (e) => { 
    if (e.touches.length < 2) initialDistance = 0; 
    endPosition(); 
});
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', endPosition);
canvas.addEventListener('touchstart', startPosition, {passive: false});
canvas.addEventListener('touchmove', draw, {passive: false});

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ
// ==========================================
let voices = [];
window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices.find(v => v.lang.includes('ru'));
    if (bestVoice) utterance.voice = bestVoice;
    utterance.pitch = 0.9 + Math.random() * 0.4;
    window.speechSynthesis.speak(utterance);
}

function startPresentation() {
    if (!isHost) return;
    window.parent.postMessage({ type: 'update_state', updates: {
        presentation: { active: true, bookIndex: 0, round: 1 }
    }}, '*');
}

let renderedPresentationState = '';
function syncPresentationView() {
    const pres = globalState.presentation;
    if (!pres) return;

    const currentStateId = `${pres.bookIndex}-${pres.round}`;
    if (renderedPresentationState === currentStateId) return;

    const players = globalState.players || [];
    if (pres.round === 1) document.getElementById('chat-messages').innerHTML = '';

    const bookOwnerId = players[pres.bookIndex];
    document.getElementById('chat-book-title').innerText = `История: ${globalState.playerNames?.[bookOwnerId] || "Аноним"}`;

    const data = globalState.submissions?.[`round_${pres.round}`]?.[bookOwnerId];
    const authorId = players[(players.indexOf(bookOwnerId) + pres.round - 1) % players.length];
    
    const authorName = globalState.playerNames?.[authorId] || "Аноним";
    const authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    const isText = (pres.round % 2 !== 0);
    const side = isText ? 'left' : 'right';

    const msgHTML = `
        <div class="msg-row ${side}">
            <img src="${authorAvatar}" class="msg-avatar">
            <div class="msg-bubble">
                <div class="msg-author">${authorName}</div>
                ${isText ? `<div class="msg-text">${data}</div>` : `<img src="${data}" class="msg-img">`}
            </div>
        </div>
    `;

    const chatContainer = document.getElementById('chat-messages');
    chatContainer.insertAdjacentHTML('beforeend', msgHTML);
    setTimeout(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); }, 50);

    if (isText) speakText(data);

    if (isHost) {
        const btn = document.getElementById('next-slide-btn');
        if (pres.round === globalState.totalRounds) {
            if (pres.bookIndex === players.length - 1) {
                btn.style.display = 'none'; 
                document.getElementById('play-again-btn').style.display = 'block'; 
            } else {
                btn.innerText = "Следующая история";
            }
        } else {
            btn.innerText = "Показать дальше";
        }
    }

    renderedPresentationState = currentStateId;
}

function nextSlide() {
    if (!isHost) return;
    const pres = globalState.presentation;
    const players = globalState.players || [];
    
    let nextR = pres.round + 1;
    let nextB = pres.bookIndex;
    
    if (nextR > globalState.totalRounds) {
        nextB++; 
        nextR = 1;
    }
    
    window.parent.postMessage({ type: 'update_state', updates: {
        presentation: { active: true, bookIndex: nextB, round: nextR }
    }}, '*');
}