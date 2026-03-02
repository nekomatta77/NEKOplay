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
    'classic': 'Обычная игра. Рисуй, отгадывай и веселись!',
    'icebreaker': 'Ледокол! Игра начинается не с текста, а с рисунка. Нарисуйте на первом этапе что угодно.',
    'speedrun': 'Экстремальный режим! Время раунда урезается в 2 раза.',
    'nocolor': 'Секретный режим! Палитра заблокирована. Рисуем только черным.',
    'hardcore': 'Без права на ошибку! Ластик, отмена и очистка отключены.',
    'story': 'История! Рисования нет вообще. Только текст. Вы пишете продолжение предыдущей фразы, создавая смешной рассказ.',
    'copycat': 'Подделка! Первый пишет фразу, второй рисует, а все остальные пытаются скопировать (перерисовать) предыдущий рисунок.',
    'blind': 'Вслепую! Во время рисования ваши штрихи невидимы на холсте. Рисуйте по памяти!',
    'onecolor': 'Один цвет! На раунд выдается один случайный цвет на всех. Палитра спрятана.',
    'chaos': 'Хаос! При каждом касании экрана цвет и размер кисти меняются случайным образом.',
    'masterpiece': 'Шедевр! Времени на рисование дается в 2 раза больше.',
    'mirror': 'Зазеркалье! Холст аппаратно отзеркален. Попробуйте нарисовать хоть что-то ровно!',
    'earthquake': 'Землетрясение! Во время рисования мольберт постоянно трясется.',
    'drunk': 'Пьяный мастер! Ваши координаты немного смещаются. Кисть живет своей жизнью!',
    'pixelart': 'Пиксель-арт! Кисть становится квадратной, а настройки размера заблокированы.',
    'oneline': 'Один штрих! Как только вы отрываете палец от экрана, ваше рисование окончено.',
    'tiny': 'Лилипут! Холст отдалился в 2 раза. Придется щуриться.',
    'giant': 'Великан! Размер кисти заблокирован на абсолютном максимуме.',
    'fading': 'Призрак! Прозрачность заблокирована на 5%. Придется сильно постараться, чтобы линии было видно.',
    'darkmode': 'Ночь! Темная тема. Холст становится черным, а рисуем мы белым.'
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
    document.getElementById('info-modal-desc').innerText = modeDescriptions[mode] || "Описание отсутствует";
    document.getElementById('info-modal').style.display = 'flex';
}
function closeInfoModal() { document.getElementById('info-modal').style.display = 'none'; }

function renderPlayersList(players) {
    const listEl = document.getElementById('lobby-players-list');
    if (!listEl) return;
    const hostSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#fbbf24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 16 4 4 10 9 12 2 14 9 20 4 22 16 2 16"></polygon><line x1="2" y1="20" x2="22" y2="20"></line></svg>`;
    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const avatar = globalState.playerAvatars?.[id] || "https://picsum.photos/100";
        const isHostIcon = id === players[0] ? `<div class="host-crown">${hostSvg}</div>` : ''; 
        return `<div class="player-avatar-wrap">${isHostIcon}<img src="${avatar}" alt="${name}"><span class="player-name-mini" title="${name}">${name}</span></div>`;
    }).join('');
}

// ==========================================
// АУДИО И ТАЙМЕРЫ
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
        } else { updateTimerUI(timeRemaining, timeLimit); }
    }, 1000);
}

function updateWaitingScreen() {
    if (!document.getElementById('waiting-phase').classList.contains('active')) return;
    const players = globalState.players || [];
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    const listEl = document.getElementById('waiting-players-list');
    if (!listEl) return;
    const iconReady = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#22c55e" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const iconWaiting = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#eab308" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const isReady = currentSubs[id] !== undefined;
        return `<div class="waiting-player-item ${isReady ? 'ready' : 'not-ready'}"><span>${name}</span><span>${isReady ? iconReady : iconWaiting}</span></div>`;
    }).join('');
}

// ==========================================
// СТАРТ ИГРЫ
// ==========================================
function startGame() {
  if (!isHost) return;
  initAudio(); requestFullscreen();
  let baseTime = parseInt(document.getElementById('setting-time').value);
  
  let finalTime = baseTime;
  if (selectedMode === 'speedrun') finalTime = Math.max(30, Math.floor(baseTime / 2));
  if (selectedMode === 'masterpiece') finalTime = baseTime * 2;

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

let hasDrawnStrokeOneline = false;

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

  // Адаптивный UI: Поднятие инструментов, если нет цвета
  const mode = globalState.settings?.mode;
  const noColorModes = ['nocolor', 'onecolor', 'chaos', 'darkmode'];
  
  if (noColorModes.includes(mode)) {
      document.getElementById('color-palette').style.display = 'none'; 
      document.getElementById('tool-divider').style.display = 'none';
      currentColor = mode === 'darkmode' ? '#ffffff' : '#000000';
  } else { 
      document.getElementById('color-palette').style.display = 'grid'; 
      document.getElementById('tool-divider').style.display = 'block';
  }

  if (mode === 'hardcore') { document.getElementById('action-tools').style.display = 'none'; } 
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

function getRandomHex() {
    return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

function startRound(round, players) {
  currentLocalRound = round;
  const mode = globalState.settings?.mode;
  hasDrawnStrokeOneline = false;
  
  let isDrawingPhase = (round % 2 === 0);
  if (mode === 'icebreaker') isDrawingPhase = (round % 2 !== 0);
  if (mode === 'story') isDrawingPhase = false;
  if (mode === 'copycat') isDrawingPhase = (round > 1);
  
  if (mode === 'onecolor' && isDrawingPhase) currentColor = getRandomHex();

  const badgeText = `Этап ${round}/${calculatedTotalRounds}`;
  document.getElementById('text-round-badge').innerText = badgeText;
  document.getElementById('draw-round-badge').innerText = badgeText;

  startPhaseTimer(isDrawingPhase);

  const notebookId = getCurrentNotebookId(round, players);
  let previousData = round > 1 ? globalState.submissions?.[`round_${round - 1}`]?.[notebookId] : null;

  if (isDrawingPhase) {
      // Сброс классов эффектов
      const zContainer = document.getElementById('zoom-container');
      zContainer.className = ''; 
      document.getElementById('blindfold').style.display = 'none';
      document.getElementById('brush-settings').style.display = 'flex';
      
      // Инициализация визуальных режимов
      if (mode === 'mirror') zContainer.classList.add('mode-mirror');
      if (mode === 'earthquake') zContainer.classList.add('mode-earthquake');
      if (mode === 'tiny') zContainer.classList.add('mode-tiny');
      if (mode === 'blind') document.getElementById('blindfold').style.display = 'block';
      if (mode === 'giant') { document.getElementById('brush-settings').style.display = 'none'; document.getElementById('brush-size').value = 40; }
      if (mode === 'fading') { document.getElementById('brush-settings').style.display = 'none'; document.getElementById('brush-opacity').value = 0.05; }
      if (mode === 'pixelart') { document.getElementById('brush-settings').style.display = 'none'; document.getElementById('brush-size').value = 15; }
      
      resetCanvasTransform(); clearCanvas(); initHistory();
      
      if (round === 1) { 
          document.getElementById('word-to-draw').innerHTML = "Что угодно!";
      } else {
          if (mode === 'copycat' && typeof previousData === 'string' && previousData.startsWith('{')) {
             try { 
                 const pdImg = JSON.parse(previousData).img;
                 document.getElementById('word-to-draw').innerHTML = `<img src="${pdImg}" style="height:35px; border-radius:5px; margin-left:10px;"> Перерисуй!`;
             } catch(e) {}
          } else {
             document.getElementById('word-to-draw').innerText = previousData || "...";
          }
      }
      showPhase('draw-phase');
  } else {
      document.getElementById('word-input').value = '';
      if (round === 1) {
          document.getElementById('text-instruction').innerText = mode==='story'?'Начните историю...':'Придумайте фразу';
          document.getElementById('image-to-guess').style.display = 'none';
          document.getElementById('text-to-continue').style.display = 'none';
      } else {
          if (mode === 'story') {
              document.getElementById('text-instruction').innerText = 'Продолжите историю...';
              document.getElementById('image-to-guess').style.display = 'none';
              document.getElementById('text-to-continue').style.display = 'block';
              document.getElementById('text-to-continue').innerText = `"...${previousData}"`;
          } else {
              document.getElementById('text-instruction').innerText = 'Что здесь нарисовано?';
              const imgEl = document.getElementById('image-to-guess');
              if (typeof previousData === 'string' && previousData.startsWith('{')) {
                  try { previousData = JSON.parse(previousData).img; } catch(e){}
              }
              imgEl.src = previousData || ""; 
              imgEl.style.display = 'inline-block';
              document.getElementById('text-to-continue').style.display = 'none';
          }
      }
      showPhase('text-phase');
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
  
  const tempCtx = canvas.getContext('2d');
  tempCtx.globalCompositeOperation = 'destination-over';
  tempCtx.fillStyle = (globalState.settings?.mode === 'darkmode') ? '#000000' : '#ffffff';
  tempCtx.fillRect(0, 0, canvas.width, canvas.height);
  
  const finalData = JSON.stringify({ img: canvas.toDataURL('image/png'), strokes: recordedStrokes });

  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = finalData;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  
  resetCanvasTransform(); showPhase('waiting-phase'); updateWaitingScreen();
}

// ==========================================
// ХОЛСТ: ИНСТРУМЕНТЫ И ЛОГИКА
// ==========================================
const canvas = document.getElementById('drawing-board');
const zoomContainer = document.getElementById('zoom-container');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentColor = '#000000'; 
let isErasing = false;
let isFilling = false;
let isEyedropper = false;
let isBlur = false;

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
    drawHistory.push(canvas.toDataURL()); strokesHistory.push(JSON.parse(JSON.stringify(recordedStrokes))); historyIndex++;
}

function restoreState(index) {
    let img = new Image(); img.src = drawHistory[index];
    img.onload = () => { 
        ctx.globalAlpha=1; ctx.filter='none'; ctx.globalCompositeOperation = 'source-over'; 
        ctx.fillStyle = (globalState.settings?.mode === 'darkmode') ? '#000000' : '#ffffff'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); 
    };
    recordedStrokes = JSON.parse(JSON.stringify(strokesHistory[index]));
}

function undo() { if (historyIndex > 0) { historyIndex--; restoreState(historyIndex); } }
function redo() { if (historyIndex < drawHistory.length - 1) { historyIndex++; restoreState(historyIndex); } }

function clearTools() { 
    isErasing = false; isFilling = false; isEyedropper = false; isBlur = false; 
    document.querySelectorAll('.tool-btn').forEach(s => s.classList.remove('active-swatch')); 
}
function setColor(color, element) {
    clearTools(); currentColor = color; ctx.globalCompositeOperation = 'source-over';
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active-swatch'));
    if(element) element.classList.add('active-swatch');
}
function setEraser(element) { clearTools(); isErasing = true; ctx.globalCompositeOperation = 'destination-out'; element.classList.add('active-swatch'); }
function setFill(element) { clearTools(); isFilling = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function setEyedropper(element) { clearTools(); isEyedropper = true; element.classList.add('active-swatch'); }
function setBlur(element) { clearTools(); isBlur = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }

function clearCanvas() {
  ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over'; 
  const isDark = globalState.settings?.mode === 'darkmode';
  ctx.fillStyle = isDark ? '#000000' : '#ffffff'; 
  document.getElementById('canvas-wrapper').style.backgroundColor = isDark ? '#000000' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if(isErasing) ctx.globalCompositeOperation = 'destination-out';
  recordedStrokes.push({ type: 'clear' }); saveState();
}

function resetCanvasTransform() { canvasTransform = { x: 0, y: 0, scale: 1 }; updateTransform(); }
function updateTransform() { 
    if (!zoomContainer) return;
    if (canvasTransform.scale <= 1) { canvasTransform.scale = 1; canvasTransform.x = 0; canvasTransform.y = 0; }
    zoomContainer.style.transformOrigin = `0 0`; zoomContainer.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`; 
}

function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: ((clientX - rect.left) / rect.width) * canvas.width, y: ((clientY - rect.top) / rect.height) * canvas.height };
}

function hexToRgba(hex) {
    let r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return [r, g, b, 255];
}
function matchColor(data, pos, color) { return data[pos]==color[0] && data[pos+1]==color[1] && data[pos+2]==color[2]; }
function floodFillCore(startX, startY, fillHex) {
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const startPos = (startY * w + startX) * 4;
    const startColor = [data[startPos], data[startPos+1], data[startPos+2]];
    const fillColor = hexToRgba(fillHex);
    if (matchColor(data, startPos, fillColor)) return;
    
    const stack = [[startX, startY]];
    while(stack.length > 0) {
        let [x, y] = stack.pop();
        let pos = (y * w + x) * 4;
        while (y >= 0 && matchColor(data, pos, startColor)) { y--; pos -= w * 4; }
        y++; pos += w * 4;
        let reachLeft = false, reachRight = false;
        while (y < h && matchColor(data, pos, startColor)) {
            data[pos] = fillColor[0]; data[pos+1] = fillColor[1]; data[pos+2] = fillColor[2]; data[pos+3] = 255;
            if (x > 0) {
                if (matchColor(data, pos - 4, startColor)) { if (!reachLeft) { stack.push([x - 1, y]); reachLeft = true; } }
                else if (reachLeft) { reachLeft = false; }
            }
            if (x < w - 1) {
                if (matchColor(data, pos + 4, startColor)) { if (!reachRight) { stack.push([x + 1, y]); reachRight = true; } }
                else if (reachRight) { reachRight = false; }
            }
            y++; pos += w * 4;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function startPosition(e) { 
    if (e.touches && e.touches.length >= 2) return; 
    let pos = getCoordinates(e);
    const mode = globalState.settings?.mode;

    if (mode === 'oneline' && hasDrawnStrokeOneline) return;

    if (isEyedropper) {
        const p = ctx.getImageData(pos.x, pos.y, 1, 1).data;
        const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
        setColor(hex); return;
    }

    if (isFilling) {
        floodFillCore(Math.round(pos.x), Math.round(pos.y), currentColor);
        recordedStrokes.push({ type: 'fill', c: currentColor, p: [Math.round(pos.x), Math.round(pos.y)] });
        saveState(); return;
    }

    if (mode === 'chaos') {
        currentColor = getRandomHex();
        document.getElementById('brush-size').value = Math.floor(Math.random() * 35) + 5;
    }

    if (mode === 'pixelart') {
        pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15;
    }
    if (mode === 'drunk') {
        pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40;
    }

    preZoomState = canvas.toDataURL(); isDrawing = true; 
    let opacity = parseFloat(document.getElementById('brush-opacity').value);
    
    currentStroke = { 
        c: currentColor, s: document.getElementById('brush-size').value, 
        e: isErasing?1:0, o: opacity, b: isBlur?1:0, 
        p: [Math.round(pos.x), Math.round(pos.y)] 
    };
    draw(e); 
}

function draw(e) {
  if (e.touches && e.touches.length >= 2) { e.preventDefault(); return handlePinchZoom(e); }
  if (!isDrawing) return; e.preventDefault(); 
  let pos = getCoordinates(e);
  const mode = globalState.settings?.mode;

  if (mode === 'pixelart') { pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15; }
  if (mode === 'drunk') { pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40; }

  if(currentStroke) { currentStroke.p.push(Math.round(pos.x), Math.round(pos.y)); }

  ctx.lineWidth = document.getElementById('brush-size').value;
  ctx.lineCap = mode === 'pixelart' ? 'square' : 'round';
  ctx.lineJoin = mode === 'pixelart' ? 'miter' : 'round';
  ctx.strokeStyle = currentColor;
  
  let opacity = parseFloat(document.getElementById('brush-opacity').value);
  ctx.globalAlpha = isErasing ? 1 : opacity;
  ctx.filter = isBlur ? 'blur(5px)' : 'none';
  ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';

  ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
}

function endPosition() { 
    if (!isDrawing) return; 
    isDrawing = false; ctx.beginPath(); ctx.filter = 'none';
    if (globalState.settings?.mode === 'oneline') hasDrawnStrokeOneline = true;
    if (currentStroke) { recordedStrokes.push(currentStroke); currentStroke = null; }
    saveState(); 
}

function handlePinchZoom(e) {
    if (isDrawing) {
        isDrawing = false; ctx.beginPath(); ctx.filter = 'none'; currentStroke = null;
        if (preZoomState) {
            let img = new Image(); img.src = preZoomState;
            img.onload = () => { ctx.globalAlpha=1; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); }
        }
    }
    const t1 = e.touches[0]; const t2 = e.touches[1];
    const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const cx = (t1.clientX + t2.clientX) / 2; const cy = (t1.clientY + t2.clientY) / 2;
    if (initialDistance === 0) { initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; }
    let newScale = canvasTransform.scale * (currentDist / initialDistance);
    if (newScale < 1) newScale = 1; if (newScale > 5) newScale = 5;

    const wrapperRect = zoomContainer.parentElement.getBoundingClientRect();
    canvasTransform.x -= (cx - wrapperRect.left - canvasTransform.x) * (newScale / canvasTransform.scale - 1);
    canvasTransform.y -= (cy - wrapperRect.top - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
    canvasTransform.x += (cx - lastZoomCenter.x); canvasTransform.y += (cy - lastZoomCenter.y);
    canvasTransform.scale = newScale; initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy };
    updateTransform();
}

canvas.addEventListener('touchend', (e) => { 
    if (e.touches.length < 2) { initialDistance = 0; if (canvasTransform.scale <= 1) resetCanvasTransform(); } 
    endPosition(); 
});
canvas.addEventListener('mousedown', startPosition); canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseleave', endPosition);
canvas.addEventListener('touchstart', startPosition, {passive: false}); canvas.addEventListener('touchmove', draw, {passive: false});

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ (УМНАЯ АНИМАЦИЯ Х1.5 И ФИКС ОТРИСОВКИ)
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
    initAudio(); window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: 0, round: 1 } }}, '*');
}

let animationFrameId = null;

function playDrawingAnimation(canvasEl, strokes, finalImg, isDarkMode) {
    const actx = canvasEl.getContext('2d');
    actx.globalAlpha = 1; actx.filter = 'none'; actx.globalCompositeOperation = 'source-over';
    actx.fillStyle = isDarkMode ? '#000000' : '#ffffff'; 
    actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    let strokeIdx = 0; let pointIdx = 0;
    
    let totalPoints = 0;
    for (let s of strokes) {
        if (s.p) totalPoints += Math.max(1, Math.floor(s.p.length / 2));
        else totalPoints += 1;
    }
    
    // Калькулятор кадров (Анимация всегда плавная и идет ~2 секунды)
    let pointsPerFrame = Math.max(2, Math.ceil(totalPoints / 120)); 
    
    function drawStep() {
        if (strokeIdx >= strokes.length) {
            let im = new Image(); 
            im.src = finalImg; 
            im.onload = () => { 
                actx.globalAlpha=1; actx.filter='none'; actx.globalCompositeOperation = 'source-over'; 
                actx.drawImage(im, 0, 0); 
            };
            return; // Конец
        }
        
        let pointsDrawn = 0;
        while (pointsDrawn < pointsPerFrame && strokeIdx < strokes.length) {
            let stroke = strokes[strokeIdx];
            
            if (stroke.type === 'clear') {
                actx.globalAlpha = 1; actx.filter = 'none'; actx.globalCompositeOperation = 'source-over'; 
                actx.fillStyle = isDarkMode ? '#000000' : '#ffffff';
                actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
                strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue;
            }
            if (stroke.type === 'fill') {
                strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue;
            }
            
            let pts = stroke.p;
            if (!pts || pts.length < 2) { strokeIdx++; pointIdx = 0; continue; }

            if (pointIdx === 0) {
                actx.beginPath(); actx.lineWidth = stroke.s; actx.lineCap = 'round'; actx.lineJoin = 'round';
                actx.strokeStyle = stroke.c; actx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
                actx.globalAlpha = stroke.o !== undefined ? stroke.o : 1;
                actx.filter = stroke.b ? 'blur(5px)' : 'none';
                actx.moveTo(pts[0], pts[1]); pointIdx = 2;
            }
            
            if (pointIdx < pts.length) {
                actx.lineTo(pts[pointIdx], pts[pointIdx+1]); actx.stroke();
                actx.beginPath(); actx.moveTo(pts[pointIdx], pts[pointIdx+1]);
                pointIdx += 2; pointsDrawn++;
            } else { strokeIdx++; pointIdx = 0; }
        }
        animationFrameId = requestAnimationFrame(drawStep);
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(drawStep);
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
    let imgUrl = rawData; let strokesData = null;

    if (typeof rawData === 'string' && rawData.startsWith('{')) {
        try { let parsed = JSON.parse(rawData); if (parsed.img) { imgUrl = parsed.img; strokesData = parsed.strokes; } } catch(e) {}
    }

    const authorId = players[(players.indexOf(bookOwnerId) + pres.round - 1 + players.length * 10) % players.length];
    const authorName = globalState.playerNames?.[authorId] || "Аноним";
    const authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    
    const mode = globalState.settings?.mode;
    let isText = (pres.round % 2 !== 0);
    if (mode === 'icebreaker') isText = (pres.round % 2 === 0);
    if (mode === 'story') isText = true;
    if (mode === 'copycat') isText = (pres.round === 1);

    const side = isText ? 'left' : 'right';

    const visualContent = isText 
        ? `<div class="msg-text">${rawData}</div>` 
        : `<canvas class="msg-canvas" width="800" height="600" id="anim-canvas-${pres.round}-${bookOwnerId}"></canvas>`;

    const msgHTML = `<div class="msg-row ${side}"><img src="${authorAvatar}" class="msg-avatar"><div class="msg-bubble"><div class="msg-author">${authorName}</div>${visualContent}</div></div>`;

    const chatContainer = document.getElementById('chat-messages');
    chatContainer.insertAdjacentHTML('beforeend', msgHTML);
    setTimeout(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); }, 50);

    if (isText) { speakText(rawData); } 
    else {
        setTimeout(() => {
            const canvasAnim = document.getElementById(`anim-canvas-${pres.round}-${bookOwnerId}`);
            const isDark = globalState.settings?.mode === 'darkmode';
            
            if (canvasAnim && strokesData && strokesData.length > 0) { 
                playDrawingAnimation(canvasAnim, strokesData, imgUrl, isDark); 
            } else if (canvasAnim) { 
                const cctx = canvasAnim.getContext('2d'); 
                let im = new Image(); im.src = imgUrl; 
                im.onload = () => cctx.drawImage(im, 0, 0); 
            }
        }, 100);
    }

    if (isHost) {
        const btn = document.getElementById('next-slide-btn');
        if (pres.round === calculatedTotalRounds) {
            if (pres.bookIndex === players.length - 1) { btn.style.display = 'none'; document.getElementById('play-again-btn').style.display = 'block'; } 
            else { btn.innerText = "Следующая история"; }
        } else { btn.innerText = "Показать дальше"; }
    }
    renderedPresentationState = currentStateId;
}

function nextSlide() {
    if (!isHost) return;
    const pres = globalState.presentation; const players = globalState.players || [];
    let nextR = pres.round + 1; let nextB = pres.bookIndex;
    if (nextR > calculatedTotalRounds) { nextB++; nextR = 1; }
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: nextB, round: nextR } }}, '*');
}