// ==========================================
// ФИКС РАЗМЕРА ЭКРАНА ДЛЯ МОБИЛОК (PWA)
// ==========================================
function setViewportHeight() {
  // Вычисляем 1% от реальной высоты видимого окна (без учета браузерных панелей)
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(setViewportHeight, 100));
setViewportHeight();

// ==========================================
// ИНИЦИАЛИЗАЦИЯ И ПАРАМЕТРЫ
// ==========================================
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

function requestFullscreen() {
    window.parent.postMessage({ type: 'request_fullscreen' }, '*');
}

// ==========================================
// ЛОББИ И УПРАВЛЕНИЕ ИГРОЙ
// ==========================================
function selectMode(mode) {
  if (!isHost) return;
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('active');
}

function startGame() {
  if (!isHost) return;
  requestFullscreen();
  const time = document.getElementById('setting-time').value;
  window.parent.postMessage({ type: 'start_game', settings: { mode: selectedMode, time: parseInt(time) } }, '*');
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

  if (globalState.status === 'finished' && currentLocalRound !== -1) {
    currentLocalRound = -1; 
    showPhase('ready-to-present-phase');
    return;
  }

  const players = globalState.players || [];
  if (players.length === 0) return;
  const totalRounds = globalState.totalRounds || players.length;

  // Настройки режима "Секрет"
  if (globalState.settings?.mode === 'nocolor') {
      document.getElementById('color-palette').style.visibility = 'hidden';
      currentColor = '#000000';
  } else {
      document.getElementById('color-palette').style.visibility = 'visible';
  }

  if (globalState.round > currentLocalRound) startRound(globalState.round, players, totalRounds);

  // Хост проверяет, все ли сдали
  if (isHost) {
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    if (Object.keys(currentSubs).length >= players.length) {
      if (globalState.round >= totalRounds) window.parent.postMessage({ type: 'update_state', updates: { status: 'finished' } }, '*');
      else window.parent.postMessage({ type: 'update_state', updates: { round: globalState.round + 1 } }, '*');
    }
  }
}

function showPhase(phaseId) {
  document.querySelectorAll('.screen, .phase-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(phaseId);
  if (target.classList.contains('screen')) target.classList.add('active');
  else { document.getElementById('game-screen').classList.add('active'); target.classList.add('active'); }
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
      clearCanvas(); 
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
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = canvas.toDataURL('image/png');
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  zoomScale = 1; updateTransform();
  showPhase('waiting-phase');
}

// ==========================================
// ИДЕАЛЬНЫЙ CANVAS 800x600 НА МОЛЬБЕРТЕ
// ==========================================
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let zoomScale = 1;
let initialDistance = 0;
let currentColor = '#000000'; 
let isErasing = false;

// Заливаем фон белым при старте
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
}

function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
  };
}

function startPosition(e) { 
    if (e.touches && e.touches.length === 2) return; 
    isDrawing = true; draw(e); 
}
function endPosition() { isDrawing = false; ctx.beginPath(); }

function draw(e) {
  if (e.touches && e.touches.length === 2) { e.preventDefault(); return handlePinchZoom(e); }
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

function updateTransform() { canvas.style.transform = `scale(${zoomScale})`; }

function handlePinchZoom(e) {
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (initialDistance === 0) initialDistance = dist / zoomScale;
    zoomScale = Math.min(Math.max(1, dist / initialDistance), 4);
    updateTransform();
}

canvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) initialDistance = 0; endPosition(); });
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', endPosition);
canvas.addEventListener('touchstart', startPosition, {passive: false});
canvas.addEventListener('touchmove', draw, {passive: false});

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ И ОЗВУЧКА
// ==========================================
let presNotebooks = [];
let presCurrentBookIndex = 0;
let presCurrentRound = 1;

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
    requestFullscreen();
    showPhase('presentation-phase');
    presNotebooks = globalState.players || [];
    presCurrentBookIndex = 0;
    presCurrentRound = 1;
    document.getElementById('chat-messages').innerHTML = ''; 
    document.getElementById('play-again-btn').style.display = 'none';
    document.getElementById('next-slide-btn').style.display = 'block';
    updateChatHeader();
    showCurrentSlide();
}

function updateChatHeader() {
    const bookOwnerId = presNotebooks[presCurrentBookIndex];
    const ownerName = globalState.playerNames?.[bookOwnerId] || "Аноним";
    document.getElementById('chat-book-title').innerText = `История: ${ownerName}`;
}

function showCurrentSlide() {
    const bookId = presNotebooks[presCurrentBookIndex];
    const data = globalState.submissions?.[`round_${presCurrentRound}`]?.[bookId];
    const authorId = presNotebooks[(presNotebooks.indexOf(bookId) + presCurrentRound - 1) % presNotebooks.length];
    
    const authorName = globalState.playerNames?.[authorId] || "Аноним";
    const authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    const isText = (presCurrentRound % 2 !== 0);
    const side = (presCurrentRound % 2 !== 0) ? 'left' : 'right';

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

    const btn = document.getElementById('next-slide-btn');
    if (presCurrentRound === globalState.totalRounds) {
        if (presCurrentBookIndex === presNotebooks.length - 1) {
            btn.style.display = 'none'; 
            if (isHost) document.getElementById('play-again-btn').style.display = 'block'; 
        } else {
            btn.innerText = "Следующая история";
        }
    } else {
        btn.innerText = "Показать дальше";
    }
}

function nextSlide() {
    presCurrentRound++;
    if (presCurrentRound > globalState.totalRounds) {
        presCurrentBookIndex++; 
        presCurrentRound = 1;
        document.getElementById('chat-messages').innerHTML = '';
        updateChatHeader();
    }
    showCurrentSlide();
}