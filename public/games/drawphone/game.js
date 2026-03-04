let animationFrameId = null; 

// Добавляем динамические стили для эффектов Землетрясения (Тряски) и Лилипута (маленький холст)
const extraStyles = document.createElement('style');
extraStyles.innerHTML = `
@keyframes earthquakeShake {
    0% { transform: translate(2px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
}
.mode-earthquake .canvas-wrapper-outer { 
    animation: earthquakeShake 0.4s infinite; 
}
.mode-tiny .canvas-wrapper-outer { 
    transform: scale(0.25) !important; 
    transform-origin: center center; 
    border: 8px solid #d946ef; 
    border-radius: 12px; 
    box-shadow: 0 0 20px #d946ef; 
}
`;
document.head.appendChild(extraStyles);

function getRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// Вспомогательная функция для отрисовки стрелки
function drawArrow(context, fromx, fromy, tox, toy) {
    let headlen = 15; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

function setDisplay(id, display) { const el = document.getElementById(id); if (el) el.style.display = display; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

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

let finishitBaseImg = new Image(); 

setText('players-count-display', playersCountParam);
setText('player-name-display', myName);

if (isHost) setDisplay('host-controls', 'block');
else setDisplay('guest-waiting', 'flex');

function leaveGame() { window.parent.postMessage({ type: 'leave_game' }, '*'); }
function requestFullscreen() { window.parent.postMessage({ type: 'request_fullscreen' }, '*'); }

function showPhase(phaseId) {
  document.querySelectorAll('.screen, .phase-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(phaseId);
  if (target) {
      if (target.classList.contains('screen')) target.classList.add('active');
      else { const gs = document.getElementById('game-screen'); if(gs) gs.classList.add('active'); target.classList.add('active'); }
  }
  setDisplay('leave-btn', (phaseId === 'lobby-screen' || phaseId === 'ready-to-present-phase' || phaseId === 'presentation-phase' || phaseId.includes('voting')) ? 'flex' : 'none');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const btn = document.getElementById(`tab-btn-${tabId}`);
    const tab = document.getElementById(`tab-${tabId}`);
    if(btn) btn.classList.add('active');
    if(tab) tab.classList.add('active');
}

function selectMode(mode) {
  if (!isHost) return;
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  const el = document.querySelector(`.mode-card[data-mode="${mode}"]`);
  if (el) el.classList.add('active');
}

function showModeInfo(e, mode) {
    e.stopPropagation(); 
    const el = document.querySelector(`.mode-card[data-mode="${mode}"] h4`);
    if(el) setText('info-modal-title', el.innerText);
    let desc = "Описание режима отсутствует.";
    if (typeof modeDescriptions !== 'undefined' && modeDescriptions[mode]) desc = modeDescriptions[mode];
    setText('info-modal-desc', desc);
    setDisplay('info-modal', 'flex');
}

function closeInfoModal() { setDisplay('info-modal', 'none'); }
function hidePlagiarism(e) { if(e) e.preventDefault(); setDisplay('plagiarism-overlay', 'none'); }

function toggleMobileTools(e) {
    if (e) e.stopPropagation();
    document.getElementById('tools-popup').classList.toggle('show');
}
document.addEventListener('pointerdown', (e) => {
    const popup = document.getElementById('tools-popup');
    const trigger = document.querySelector('.mobile-tool-trigger');
    if (popup && popup.classList.contains('show') && !popup.contains(e.target) && trigger && !trigger.contains(e.target)) {
        popup.classList.remove('show');
    }
});

function renderPlayersList(players) {
    const listEl = document.getElementById('lobby-players-list');
    if (!listEl) return;
    const hostSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#fbbf24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 16 4 4 10 9 12 2 14 9 20 4 22 16 2 16"></polygon><line x1="2" y1="20" x2="22" y2="20"></line></svg>`;
    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const avatar = globalState.playerAvatars?.[id] || "https://picsum.photos/100";
        const isHostIcon = id === players[0] ? `<div class="host-crown">${hostSvg}</div>` : ''; 
        return `<div class="player-avatar-wrap">${isHostIcon}<img src="${avatar}"><span class="player-name-mini">${name}</span></div>`;
    }).join('');
}

let audioCtx = null;
function initAudio() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playWarningBeep(pitchMult = 1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 880 * pitchMult; 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

let phaseTimerInterval = null;
let currentPhaseSubmitted = false;
let isCurrentPhaseDrawing = false;
let timeMultiplier = 1;
let maxInk = 5000;
let currentInk = 5000;
let expectedEndTime = 0;

function updateTimerUI(remaining, limit) {
    let targetPrefix = currentPhaseSubmitted ? 'waiting' : (isCurrentPhaseDrawing ? 'draw' : 'text');
    setText(`${targetPrefix}-timer-text`, Math.ceil(remaining));
    let timerPath = document.getElementById(`${targetPrefix}-timer-path`);
    let timerContainer = document.getElementById(`${targetPrefix}-timer-container`);

    if (timerPath) {
        let dashoffset = 100 - (remaining / limit) * 100;
        timerPath.style.strokeDashoffset = Math.max(0, dashoffset);
        timerPath.style.stroke = '#22c55e'; 
        if (remaining <= 10 && remaining > 0) {
            if (timerContainer) timerContainer.classList.add('timer-warning');
            if (!currentPhaseSubmitted) {
                let isWholeSecond = Math.floor(remaining) !== Math.floor(remaining + (0.1 * timeMultiplier));
                if (isWholeSecond) {
                    let sec = Math.floor(remaining);
                    if (sec > 3 && sec % 2 === 0) playWarningBeep(1);
                    else if (sec <= 3) playWarningBeep(sec === 1 ? 1.5 : 1.2);
                }
            } 
        } else {
            if (timerContainer) timerContainer.classList.remove('timer-warning');
            if (remaining <= limit / 2) timerPath.style.stroke = '#eab308';
        }
    }
}

function startPhaseTimer(isDrawing) {
    clearInterval(phaseTimerInterval);
    currentPhaseSubmitted = false; isCurrentPhaseDrawing = isDrawing; timeMultiplier = 1;
    let timeLimit = globalState.settings?.time || 90;
    
    if (globalState.settings?.mode === 'tagteam') timeLimit = 5;
    if (globalState.settings?.mode === 'plagiarism' && currentLocalRound > 1) timeLimit = Math.max(15, timeLimit - (currentLocalRound - 1) * 15);
    if (globalState.settings?.mode === 'finishit' && currentLocalRound === 1) timeLimit = 10;

    // Глобальная синхронизация с защитой от сворачивания вкладки
    expectedEndTime = Date.now() + (timeLimit * 1000);
    updateTimerUI(timeLimit, timeLimit);

    phaseTimerInterval = setInterval(() => {
        let timeRemaining = (expectedEndTime - Date.now()) / 1000;
        if (timeRemaining <= 0) {
            clearInterval(phaseTimerInterval);
            if (!currentPhaseSubmitted) { try { if (isDrawing) submitDrawing(false); else submitWord(false); } catch(e){} }
        } else { updateTimerUI(timeRemaining, timeLimit); }
    }, 100);
}

function updateWaitingScreen() {
    const players = globalState.players || [];
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    
    // Обновляем счетчик готовых игроков на основном интерфейсе (для всех фаз)
    let activeReadyCount = players.filter(pid => typeof currentSubs[pid] === 'string' && currentSubs[pid].length > 0).length;
    setText('draw-ready-count', `${activeReadyCount}/${players.length} Готово`);
    setText('text-ready-count', `${activeReadyCount}/${players.length} Готово`);
    
    if (!document.getElementById('waiting-phase').classList.contains('active')) return;
    
    const listEl = document.getElementById('waiting-players-list');
    if (!listEl) return;
    
    const iconReady = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#22c55e" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const iconWaiting = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#eab308" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

    listEl.innerHTML = players.map(id => {
        const name = globalState.playerNames?.[id] || "Аноним";
        const isReady = typeof currentSubs[id] === 'string' && currentSubs[id].length > 0;
        return `<div class="waiting-player-item ${isReady ? 'ready' : 'not-ready'}"><span>${name}</span><span>${isReady ? iconReady : iconWaiting}</span></div>`;
    }).join('');
}

function startGame() {
  if (!isHost) return;
  initAudio(); requestFullscreen();
  const stElement = document.getElementById('setting-time');
  const srElement = document.getElementById('setting-rounds');
  let baseTime = stElement ? parseInt(stElement.value) : 90;
  let finalTime = baseTime;
  if (selectedMode === 'speedrun') finalTime = Math.max(30, Math.floor(baseTime / 2));
  if (selectedMode === 'masterpiece') finalTime = baseTime * 2;
  let roundsMult = srElement ? parseInt(srElement.value) : 1;
  
  if (selectedMode === 'coop' && (playersCountParam % 2 !== 0)) { alert("Для Коопа нужно четное число игроков!"); return; }
  const seed = Math.floor(Math.random() * 1000000);
  
  window.parent.postMessage({ 
      type: 'update_state', 
      updates: { submissions: null, presentation: { active: false, bookIndex: 0, round: 1 }, voting: null, round: 1 } 
  }, '*');

  window.parent.postMessage({ 
      type: 'start_game', 
      settings: { mode: selectedMode, time: finalTime, roundsMultiplier: roundsMult, seed: seed } 
  }, '*');
}

function playAgain() {
  if (!isHost) return;
  window.parent.postMessage({ 
      type: 'update_state', 
      updates: { submissions: null, presentation: null, voting: null, round: 0, status: 'waiting' } 
  }, '*');
  window.parent.postMessage({ type: 'play_again' }, '*');
}

// ==== ЛОГИКА ГИРОСКОПА ====
let isGyroEnabled = false;
let gyroX = 400, gyroY = 300;

function startGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') enableGyro();
                else alert("Доступ к гироскопу запрещен.");
            })
            .catch(console.error);
    } else {
        enableGyro();
    }
}

function enableGyro() {
    setDisplay('btn-gyro-start', 'none');
    setDisplay('gyro-cursor', 'block');
    isGyroEnabled = true;
    gyroX = canvas.width / 2;
    gyroY = canvas.height / 2;
    lastX = gyroX; lastY = gyroY;
    preZoomState = canvas.toDataURL();
    isDrawing = true;
    window.addEventListener('deviceorientation', handleGyroMove);
}

function handleGyroMove(event) {
    if (!isGyroEnabled || globalState.settings?.mode !== 'nohands') return;
    
    let dx = event.gamma || 0; 
    let dy = (event.beta || 0) - 45; 
    
    gyroX += dx * 0.3; 
    gyroY += dy * 0.3;
    
    gyroX = Math.max(0, Math.min(canvas.width, gyroX));
    gyroY = Math.max(0, Math.min(canvas.height, gyroY));
    
    const cursor = document.getElementById('gyro-cursor');
    if (cursor) {
        cursor.style.left = (gyroX / canvas.width * 100) + '%';
        cursor.style.top = (gyroY / canvas.height * 100) + '%';
    }
    
    let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
    let opacity = 1; const bo = document.getElementById('brush-opacity'); if (bo) opacity = parseFloat(bo.value);
    ctx.lineWidth = bsVal; ctx.globalAlpha = isErasing ? 1 : opacity; ctx.filter = isBlur ? 'blur(5px)' : 'none'; ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    if (isNeon && !isErasing) { ctx.shadowBlur = Math.max(10, bsVal * 2); ctx.shadowColor = currentColor; ctx.strokeStyle = '#ffffff'; } else { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.strokeStyle = currentColor; }
    
    if(!currentStroke) {
         currentStroke = { c: currentColor, s: bsVal, e: isErasing?1:0, o: opacity, b: isBlur?1:0, sym: isSymmetry?1:0, n: isNeon?1:0, p: [Math.round(gyroX), Math.round(gyroY)] };
    }
    currentStroke.p.push(Math.round(gyroX), Math.round(gyroY));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(gyroX, gyroY); ctx.stroke();
    lastX = gyroX; lastY = gyroY;
}
// ==========================

function resetLocalGameData() {
    currentLocalRound = 0;
    clearInterval(phaseTimerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    window.removeEventListener('deviceorientation', handleGyroMove);
    isGyroEnabled = false;
    
    setDisplay('play-again-btn', 'none'); 
    setHTML('chat-messages', ''); 
    const avatarsContainer = document.getElementById('presentation-avatars');
    if (avatarsContainer) avatarsContainer.innerHTML = '';
    
    renderedPresentationState = '';
    dotsArray = [];
    hasDrawnStrokeOneline = false;
    finishitBaseImg = new Image();
    
    currentColor = '#000000';
    isErasing = false; isFilling = false; isEyedropper = false; 
    isBlur = false; isRect = false; isCircle = false; 
    isLine = false; isArrow = false; isSymmetry = false; isNeon = false;
    
    const bs = document.getElementById('brush-size'); if(bs) bs.value = 5;
    const bo = document.getElementById('brush-opacity'); if(bo) bo.value = 1;
    
    document.querySelectorAll('.tool-btn').forEach(el => el.classList.remove('active-swatch'));
    document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active-swatch'));
    
    const brushBtn = document.querySelector('.brush-tool');
    if (brushBtn) brushBtn.classList.add('active-swatch');
    const defaultColor = Array.from(document.querySelectorAll('.swatch')).find(el => el.style.background.includes('000000') || el.style.backgroundColor === 'rgb(0, 0, 0)');
    if (defaultColor) defaultColor.classList.add('active-swatch');
    
    if (ctx && canvas) {
        ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowBlur = 0; 
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    initHistory();
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'sync_state') {
    globalState = event.data.state || {}; 
    handleStateChange();
  }
});

function seededRandom(seed) { var x = Math.sin(seed++) * 10000; return x - Math.floor(x); }

function handleStateChange() {
  const players = globalState.players || [];
  if (players.length > 0) renderPlayersList(players);

  if (!globalState.status || globalState.status === 'waiting') {
    resetLocalGameData();
    showPhase('lobby-screen'); 
    return;
  }

  calculatedTotalRounds = players.length * (globalState.settings?.roundsMultiplier || 1);
  if (globalState.settings?.mode === 'coop') calculatedTotalRounds = 2;

  if (globalState.status === 'finished') {
    currentLocalRound = -1; clearInterval(phaseTimerInterval);
    
    if (globalState.voting?.active) {
        if (globalState.voting?.showResults) {
            showPhase('voting-results-phase');
            renderVotingResults();
            if (isHost) setDisplay('impostor-play-again-btn', 'block');
        } else {
            showPhase('voting-phase');
            renderVotingGrid();
            if (isHost) {
                const votesCount = Object.keys(globalState.voting.results || {}).length;
                if (votesCount >= players.length) window.parent.postMessage({ type: 'update_state', updates: { 'voting/showResults': true } }, '*');
            }
        }
        return;
    }

    if (globalState.presentation?.active) {
        showPhase('presentation-phase');
        setDisplay('next-slide-btn', isHost ? 'block' : 'none');
        syncPresentationView(players);
    } else {
        showPhase('ready-to-present-phase');
        if (!isHost) { setDisplay('btn-start-pres', 'none'); setHTML('presentation-status-text', 'ОЖИДАНИЕ <span>ХОСТА</span>'); }
    }
    return;
  }

  const mode = globalState.settings?.mode;
  const noColorModes = ['onecolor', 'chaos', 'darkmode', 'amnesia'];
  
  if (noColorModes.includes(mode)) {
      setDisplay('color-palette', 'none'); setDisplay('tool-divider-2', 'none');
      currentColor = mode === 'darkmode' ? '#ffffff' : '#000000';
  } else if (mode === 'duotone') {
      setDisplay('color-palette', 'flex'); 
      let colors = document.querySelectorAll('#color-palette .swatch');
      colors.forEach(c => c.style.display = 'none');
      let seed = (globalState.settings.seed || 1) + globalState.round;
      let i1 = Math.floor(seededRandom(seed) * 8); let i2 = Math.floor(seededRandom(seed+1) * 8);
      if (i1===i2) i2 = (i2+1)%8;
      if (colors[i1]) colors[i1].style.display = 'block'; 
      if (colors[i2]) colors[i2].style.display = 'block';
  } else { 
      setDisplay('color-palette', 'flex'); setDisplay('tool-divider-2', 'block');
      document.querySelectorAll('#color-palette .swatch').forEach(c => c.style.display = 'block');
  }

  if (globalState.round > currentLocalRound) startRound(globalState.round, players);
  updateWaitingScreen();

  if (isHost) {
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    let activeReadyCount = players.filter(pid => typeof currentSubs[pid] === 'string' && currentSubs[pid].length > 0).length;
    
    if (activeReadyCount >= players.length) {
      if (globalState.round >= calculatedTotalRounds) window.parent.postMessage({ type: 'update_state', updates: { status: 'finished' } }, '*');
      else window.parent.postMessage({ type: 'update_state', updates: { round: globalState.round + 1 } }, '*');
    }
  }
}

function getCurrentNotebookId(round, players) {
    const myIndex = players.indexOf(myUserId);
    if (globalState.settings?.mode === 'coop') return myUserId;
    if (myIndex === -1) return myUserId; 
    return players[(myIndex - round + 1 + players.length * 10) % players.length];
}

function getReadNotebookId(round, players) {
    const myIndex = players.indexOf(myUserId);
    if (globalState.settings?.mode === 'coop' && round === 2) {
        const primaryIndex = myIndex % 2 === 0 ? myIndex : myIndex - 1;
        return players[primaryIndex];
    }
    return getCurrentNotebookId(round, players);
}

function startRound(round, players) {
  currentLocalRound = round;
  const mode = globalState.settings?.mode;
  hasDrawnStrokeOneline = false; isGyroEnabled = false;
  
  let isDrawingPhase = (round % 2 === 0);
  if (mode === 'icebreaker' || mode === 'tagteam') isDrawingPhase = (round % 2 !== 0);
  if (mode === 'story') isDrawingPhase = false;
  if (mode === 'plagiarism' || mode === 'finishit' || mode === 'tagteam') isDrawingPhase = true;
  if (mode === 'copycat') isDrawingPhase = (round > 1);
  if (mode === 'coop') isDrawingPhase = (round === 2);

  if (mode === 'onecolor' && isDrawingPhase) currentColor = getRandomHex();

  const badgeText = `Этап ${round}/${calculatedTotalRounds}`;
  setText('text-round-badge', badgeText); setText('draw-round-badge', badgeText);

  startPhaseTimer(isDrawingPhase);

  const readNotebookId = getReadNotebookId(round, players);
  let previousData = round > 1 ? globalState.submissions?.[`round_${round - 1}`]?.[readNotebookId] : null;

  const bgRef = document.getElementById('bg-reference-img');
  if (bgRef) { bgRef.style.display = 'none'; bgRef.src = ''; }

  // --- ХАРДКОР ЛОГИКА ИНТЕРФЕЙСА ---
  if (mode === 'hardcore') { 
      setDisplay('action-tools', 'none'); setDisplay('tool-divider-1', 'none'); 
      const eraser = document.querySelector('.eraser-tool'); if(eraser) eraser.style.display = 'none';
      const fill = document.querySelector('.fill-tool'); if(fill) fill.style.display = 'none';
      const clear = document.querySelector('.clear'); if(clear) clear.style.display = 'none';
  } else { 
      setDisplay('action-tools', 'flex'); setDisplay('tool-divider-1', 'block'); 
      const eraser = document.querySelector('.eraser-tool'); if(eraser) eraser.style.display = 'flex';
      const fill = document.querySelector('.fill-tool'); if(fill) fill.style.display = 'flex';
      const clear = document.querySelector('.clear'); if(clear) clear.style.display = 'flex';
  }

  if (isDrawingPhase) {
      const zContainer = document.getElementById('zoom-container');
      if(zContainer) {
          zContainer.className = ''; 
          if (mode === 'earthquake') zContainer.classList.add('mode-earthquake');
          if (mode === 'tiny') zContainer.classList.add('mode-tiny');
      }
      
      setDisplay('brush-settings', 'flex'); setDisplay('plagiarism-overlay', 'none');
      setDisplay('ink-meter-container', 'none'); setDisplay('coop-divider', 'none');
      setDisplay('btn-gyro-start', 'none'); setDisplay('gyro-cursor', 'none');
      setDisplay('sidebar-tools', 'flex');
      
      // --- ЗЕРКАЛО ЛОГИКА ---
      if (mode === 'mirror') {
          isSymmetry = true;
          const symBtn = document.querySelector('.sym-tool');
          if (symBtn) symBtn.classList.add('active-swatch');
      } else {
          isSymmetry = false;
      }

      if (mode === 'giant') { setDisplay('brush-settings', 'none'); const bs = document.getElementById('brush-size'); if(bs) bs.value = 40; }
      if (mode === 'pixelart') { setDisplay('brush-settings', 'none'); const bs = document.getElementById('brush-size'); if(bs) bs.value = 15; }
      if (mode === 'inkmeter') { setDisplay('ink-meter-container', 'block'); currentInk = maxInk; const im = document.getElementById('ink-meter-bar'); if(im) im.style.width = '100%'; }
      if (mode === 'nohands') setDisplay('btn-gyro-start', 'block');

      if (mode === 'coop') {
          setDisplay('coop-divider', 'block');
          const isLeft = players.indexOf(myUserId) % 2 === 0;
          const cw = document.getElementById('canvas-wrapper');
          let overlay = document.getElementById('coop-red-overlay');
          if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = 'coop-red-overlay';
              overlay.style.position = 'absolute'; overlay.style.top = '0'; overlay.style.bottom = '0';
              overlay.style.backgroundColor = 'rgba(239, 68, 68, 0.25)'; overlay.style.pointerEvents = 'none'; overlay.style.zIndex = '10';
              cw.appendChild(overlay);
          }
          overlay.style.display = 'block';
          if (isLeft) { overlay.style.left = '50%'; overlay.style.right = '0'; } 
          else { overlay.style.left = '0'; overlay.style.right = '50%'; }
      } else {
          let overlay = document.getElementById('coop-red-overlay');
          if (overlay) overlay.style.display = 'none';
      }

      resetCanvasTransform(); clearCanvas(); initHistory(); setBrush(document.querySelector('.brush-tool'));
      
      if (mode === 'connectdots') {
          dotsArray = [];
          for(let i=0; i<30; i++) dotsArray.push({x: Math.random()*700+50, y: Math.random()*500+50});
          ctx.fillStyle = (globalState.settings?.mode === 'darkmode') ? '#fff' : '#000';
          dotsArray.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI*2); ctx.fill(); });
      }

      if (round === 1) { 
          if (mode === 'finishit') setHTML('word-to-draw', "Нарисуйте заготовку!");
          else setHTML('word-to-draw', "Что угодно!");
      } else {
          let prevImg = null;
          if (typeof previousData === 'string') {
              if (previousData.startsWith('{')) {
                  try { let pd = JSON.parse(previousData); prevImg = pd.img; } catch(e){}
              } else { prevImg = previousData; }
          }
          
          if (mode === 'plagiarism') {
              setText('word-to-draw', "Перерисуй по памяти!"); setDisplay('plagiarism-overlay', 'flex');
              const pi = document.getElementById('plagiarism-img'); if(pi) pi.src = prevImg;
          } else if (mode === 'finishit' || mode === 'tagteam') {
              setText('word-to-draw', mode === 'finishit' ? "Дорисуй-ка!" : "Продолжи рисунок!");
              finishitBaseImg.src = prevImg;
              if (bgRef) { bgRef.src = prevImg; bgRef.style.display = 'block'; bgRef.style.opacity = '1'; }
          } else if (mode === 'copycat' && prevImg && prevImg.length > 50) {
              setHTML('word-to-draw', `<img src="${prevImg}" style="height:35px; border-radius:5px; margin-left:10px;"> Перерисуй!`);
          } else if (mode === 'coop' && round === 2) {
              const myIndex = players.indexOf(myUserId);
              const p1Index = myIndex % 2 === 0 ? myIndex : myIndex - 1;
              const p2Index = p1Index + 1 < players.length ? p1Index + 1 : p1Index;
              const sub1 = globalState.submissions?.round_1?.[players[p1Index]];
              const sub2 = globalState.submissions?.round_1?.[players[p2Index]];
              const getWord = (s) => { if (!s) return "..."; if (s.startsWith('{')) { try { return JSON.parse(s).original || "..."; } catch(e){} } return s; };
              setText('word-to-draw', `${getWord(sub1)} + ${getWord(sub2)}`);
          } else { 
              let displayWord = previousData || "...";
              if (typeof previousData === 'string' && previousData.startsWith('{')) {
                  try { let p = JSON.parse(previousData); if(p.translated) displayWord = p.translated; } catch(e){}
              }
              setText('word-to-draw', displayWord); 
          }
      }
      showPhase('draw-phase');
  } else {
      const wi = document.getElementById('word-input'); if(wi) wi.value = '';
      if (round === 1) {
          setDisplay('babel-translation', 'none');
          setText('text-instruction', mode==='story'?'Начните историю...':'Придумайте слово');
          setDisplay('image-to-guess', 'none'); setDisplay('text-to-continue', 'none');
          
          if (mode === 'impostor') {
              let p = ["Слово", "Слово"];
              if (typeof getImpostorPair === 'function') p = getImpostorPair();
              let impIndex = Math.floor(seededRandom(globalState.settings?.seed || 1) * players.length);
              let isImpostorMatch = players.indexOf(myUserId) === impIndex;
              if(wi) { wi.value = isImpostorMatch ? p[1] : p[0]; wi.disabled = true; }
              setText('text-instruction', "Ваше слово:");
          } else { if(wi) wi.disabled = false; }

      } else {
          if(wi) wi.disabled = false;
          setDisplay('babel-translation', 'none');

          if (mode === 'story') {
              setText('text-instruction', 'Продолжите историю...');
              setDisplay('image-to-guess', 'none'); setDisplay('text-to-continue', 'block');
              setText('text-to-continue', `"...${previousData}"`);
          } else {
              setText('text-instruction', 'Что здесь нарисовано?');
              const imgEl = document.getElementById('image-to-guess');
              if (typeof previousData === 'string' && previousData.startsWith('{')) { try { previousData = JSON.parse(previousData).img; } catch(e){} }
              if (imgEl) imgEl.src = previousData || ""; 
              setDisplay('image-to-guess', 'inline-block'); setDisplay('text-to-continue', 'none');
          }
      }
      showPhase('text-phase');
  }
}

async function getRealBabelTranslation(text) {
    const chain = ['zh-CN', 'sw', 'haw', 'is', 'ar', 'ru'];
    let currentText = text;
    try {
        for (let i = 0; i < chain.length; i++) {
            const sl = i === 0 ? 'ru' : chain[i-1];
            const tl = chain[i];
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(currentText)}`);
            const data = await res.json();
            currentText = data[0].map(x => x[0]).join('');
        }
        return currentText;
    } catch(e) {
        console.error("Translate API error:", e);
        return `[Сбой авто-перевода] ${text}`;
    }
}

function submitWord(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true; // Специально убрали clearInterval, чтобы таймер шел дальше!
  let word = "Секретик";
  const wi = document.getElementById('word-input');
  if (wi && wi.value.trim()) word = wi.value.trim();

  if (globalState.settings?.mode === 'babel' && !isCurrentPhaseDrawing) {
      setDisplay('babel-translation', 'block'); setText('babel-translation', "Сломанный переводчик работает...");
      getRealBabelTranslation(word).then(trans => {
          let dataToSave = JSON.stringify({ type: 'babel', original: word, translated: trans });
          const updates = {};
          updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = dataToSave;
          window.parent.postMessage({ type: 'update_state', updates }, '*');
          showPhase('waiting-phase'); updateWaitingScreen();
      });
      return;
  }
  
  if (globalState.settings?.mode === 'coop') {
      word = JSON.stringify({ type: 'coop', original: word });
  }

  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = word;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  showPhase('waiting-phase'); updateWaitingScreen();
}

function submitDrawing(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true; // Специально убрали clearInterval, чтобы таймер шел дальше!
  
  if (currentStroke) { recordedStrokes.push(currentStroke); currentStroke = null; saveState(); }
  
  const mode = globalState.settings?.mode; let finalDataUrl = '';

  if (mode === 'amnesia') {
      redrawFromStrokesSync(recordedStrokes, ctx, canvas, false);
      finalDataUrl = canvas.toDataURL('image/png');
  } else if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) {
      const tc = document.createElement('canvas'); tc.width = canvas.width; tc.height = canvas.height;
      const tCtx = tc.getContext('2d'); tCtx.fillStyle = '#ffffff'; tCtx.fillRect(0,0,tc.width,tc.height);
      tCtx.drawImage(finishitBaseImg, 0, 0, tc.width, tc.height);
      tCtx.drawImage(canvas, 0, 0);
      finalDataUrl = tc.toDataURL('image/png');
  } else if (mode === 'coop') {
      const players = globalState.players || [];
      const isLeft = players.indexOf(myUserId) % 2 === 0;
      ctx.globalCompositeOperation = 'destination-out';
      if (isLeft) ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
      else ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      finalDataUrl = canvas.toDataURL('image/png');
  } else {
      const tempCtx = canvas.getContext('2d'); tempCtx.globalCompositeOperation = 'destination-over'; tempCtx.fillStyle = (mode === 'darkmode') ? '#000000' : '#ffffff';
      tempCtx.fillRect(0, 0, canvas.width, canvas.height); finalDataUrl = canvas.toDataURL('image/png');
  }
  
  const finalData = JSON.stringify({ img: finalDataUrl, strokes: recordedStrokes });
  const updates = {};
  
  let targetId = getCurrentNotebookId(currentLocalRound, globalState.players || []);
  if (mode === 'coop') targetId = myUserId; 

  updates[`submissions/round_${currentLocalRound}/${targetId}`] = finalData;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  resetCanvasTransform(); showPhase('waiting-phase'); updateWaitingScreen();
}

function floodFillCore(startX, startY, fillColorHex) {
    startX = Math.round(startX); startY = Math.round(startY);
    const w = canvas.width, h = canvas.height;
    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;
    
    const mode = globalState.settings?.mode;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = new Uint32Array(imgData.data.buffer); 
    
    let readData = data;
    if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1 && finishitBaseImg.complete && finishitBaseImg.src) {
        const tempC = document.createElement('canvas'); tempC.width = w; tempC.height = h;
        const tCtx = tempC.getContext('2d');
        tCtx.drawImage(finishitBaseImg, 0, 0, w, h); tCtx.drawImage(canvas, 0, 0);
        readData = new Uint32Array(tCtx.getImageData(0, 0, w, h).data.buffer);
    }
    
    const startPos = startY * w + startX;
    const startColor = readData[startPos];
    
    const tc = document.createElement('canvas'); tc.width = 1; tc.height = 1;
    const tx = tc.getContext('2d'); tx.fillStyle = fillColorHex; tx.fillRect(0, 0, 1, 1);
    const targetColorData = tx.getImageData(0, 0, 1, 1);
    const fillColor = new Uint32Array(targetColorData.data.buffer)[0];

    if (startColor === fillColor) return; 
    
    const stack = new Int32Array(w * h); let stackPtr = 0; stack[stackPtr++] = startPos;
    
    while (stackPtr > 0) {
        let pos = stack[--stackPtr]; let y = Math.floor(pos / w); let x = pos % w;
        let curPos = pos;
        while (x > 0 && readData[curPos - 1] === startColor) { curPos--; x--; }
        let spanAbove = false, spanBelow = false;
        
        while (x < w && readData[curPos] === startColor) {
            data[curPos] = fillColor; 
            if (readData !== data) readData[curPos] = fillColor; 
            
            if (y > 0) {
                let above = curPos - w;
                if (!spanAbove && readData[above] === startColor) { stack[stackPtr++] = above; spanAbove = true; } 
                else if (spanAbove && readData[above] !== startColor) { spanAbove = false; }
            }
            if (y < h - 1) {
                let below = curPos + w;
                if (!spanBelow && readData[below] === startColor) { stack[stackPtr++] = below; spanBelow = true; } 
                else if (spanBelow && readData[below] !== startColor) { spanBelow = false; }
            }
            curPos++; x++;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// Новая универсальная функция для заливки на любом холсте (нужна для презентаций)
function genericFloodFill(targetCtx, w, h, startX, startY, fillColorHex) {
    startX = Math.round(startX); startY = Math.round(startY);
    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;
    
    const imgData = targetCtx.getImageData(0, 0, w, h);
    const data = new Uint32Array(imgData.data.buffer);
    const startPos = startY * w + startX;
    const startColor = data[startPos];
    
    const tc = document.createElement('canvas'); tc.width = 1; tc.height = 1;
    const tx = tc.getContext('2d'); tx.fillStyle = fillColorHex; tx.fillRect(0, 0, 1, 1);
    const targetColorData = tx.getImageData(0, 0, 1, 1);
    const fillColor = new Uint32Array(targetColorData.data.buffer)[0];

    if (startColor === fillColor) return; 
    
    const stack = new Int32Array(w * h); let stackPtr = 0; stack[stackPtr++] = startPos;
    
    while (stackPtr > 0) {
        let pos = stack[--stackPtr]; let y = Math.floor(pos / w); let x = pos % w;
        let curPos = pos;
        while (x > 0 && data[curPos - 1] === startColor) { curPos--; x--; }
        let spanAbove = false, spanBelow = false;
        
        while (x < w && data[curPos] === startColor) {
            data[curPos] = fillColor; 
            if (y > 0) {
                let above = curPos - w;
                if (!spanAbove && data[above] === startColor) { stack[stackPtr++] = above; spanAbove = true; } 
                else if (spanAbove && data[above] !== startColor) { spanAbove = false; }
            }
            if (y < h - 1) {
                let below = curPos + w;
                if (!spanBelow && data[below] === startColor) { stack[stackPtr++] = below; spanBelow = true; } 
                else if (spanBelow && data[below] !== startColor) { spanBelow = false; }
            }
            curPos++; x++;
        }
    }
    targetCtx.putImageData(imgData, 0, 0);
}

// ОБНОВЛЕНО: теперь Blur, Неон и ЗАЛИВКА правильно перерисовываются
function redrawFromStrokesSync(strokes, targetCtx, targetCanvas, isDark, clearBg = true) {
    if (clearBg) {
        targetCtx.globalAlpha = 1; targetCtx.filter = 'none'; targetCtx.shadowBlur = 0; targetCtx.globalCompositeOperation = 'source-over';
        targetCtx.fillStyle = isDark ? '#000000' : '#ffffff'; targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    }
    
    for (let stroke of strokes) {
        targetCtx.globalAlpha = stroke.o !== undefined ? stroke.o : 1;
        targetCtx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
        targetCtx.filter = stroke.b ? 'blur(5px)' : 'none';
        
        if (stroke.type === 'clear') { 
            targetCtx.globalAlpha = 1; targetCtx.globalCompositeOperation = 'source-over'; 
            targetCtx.filter = 'none'; targetCtx.shadowBlur = 0;
            targetCtx.fillStyle = isDark ? '#000000' : '#ffffff'; targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
            continue;
        }

        // Поддержка Неона (и для кисти, и для фигур)
        if (stroke.n && !stroke.e) { 
            targetCtx.shadowBlur = Math.max(10, stroke.s * 2); 
            targetCtx.shadowColor = stroke.c; 
            targetCtx.strokeStyle = '#ffffff'; 
        } else { 
            targetCtx.shadowBlur = 0; 
            targetCtx.shadowColor = 'transparent'; 
            targetCtx.strokeStyle = stroke.c; 
        }

        if (stroke.type === 'rect') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.strokeRect(stroke.p[0], stroke.p[1], stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); if(stroke.sym) targetCtx.strokeRect(targetCanvas.width - stroke.p[0], stroke.p[1], -(stroke.p[2]-stroke.p[0]), stroke.p[3]-stroke.p[1]); }
        else if (stroke.type === 'circle') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; let r = Math.hypot(stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); targetCtx.arc(stroke.p[0], stroke.p[1], r, 0, Math.PI*2); targetCtx.stroke(); if(stroke.sym) { targetCtx.beginPath(); targetCtx.arc(targetCanvas.width - stroke.p[0], stroke.p[1], r, 0, Math.PI*2); targetCtx.stroke(); } }
        else if (stroke.type === 'line') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.lineCap = 'round'; targetCtx.moveTo(stroke.p[0], stroke.p[1]); targetCtx.lineTo(stroke.p[2], stroke.p[3]); targetCtx.stroke(); if(stroke.sym) { targetCtx.beginPath(); targetCtx.moveTo(targetCanvas.width - stroke.p[0], stroke.p[1]); targetCtx.lineTo(targetCanvas.width - stroke.p[2], stroke.p[3]); targetCtx.stroke(); } }
        else if (stroke.type === 'arrow') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; drawArrow(targetCtx, stroke.p[0], stroke.p[1], stroke.p[2], stroke.p[3]); if(stroke.sym) { targetCtx.beginPath(); drawArrow(targetCtx, targetCanvas.width - stroke.p[0], stroke.p[1], targetCanvas.width - stroke.p[2], stroke.p[3]); } }
        else if (stroke.type === 'fill') { 
            genericFloodFill(targetCtx, targetCanvas.width, targetCanvas.height, stroke.p[0], stroke.p[1], stroke.c); 
        } 
        else { 
            let pts = stroke.p; if (!pts || pts.length < 2) continue; 
            targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round'; 
            targetCtx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i+=2) { targetCtx.lineTo(pts[i], pts[i+1]); } targetCtx.stroke(); 
            if (stroke.sym) { targetCtx.beginPath(); targetCtx.moveTo(targetCanvas.width - pts[0], pts[1]); for (let i = 2; i < pts.length; i+=2) { targetCtx.lineTo(targetCanvas.width - pts[i], pts[i+1]); } targetCtx.stroke(); } 
        }
    }
}

// ОБНОВЛЕНО: теперь анимация презентации учитывает Blur и правильный Неон
function animateStrokes(strokes, canvasEl, isDark) {
    const actx = canvasEl.getContext('2d');
    const mode = globalState.settings?.mode;
    actx.fillStyle = isDark ? '#000000' : '#ffffff';
    actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    
    let strokeIndex = 0;
    let pointIndex = 2; 
    
    function drawNext() {
        if (strokeIndex >= strokes.length) return;
        let stroke = strokes[strokeIndex];
        
        if (stroke.type === 'clear') {
            actx.fillStyle = isDark ? '#000000' : '#ffffff'; actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
            strokeIndex++; pointIndex = 2; requestAnimationFrame(drawNext); return;
        }
        
        if ((!stroke.type || stroke.type === 'line') && stroke.p) {
            actx.globalAlpha = stroke.o !== undefined ? stroke.o : 1;
            actx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
            actx.lineWidth = stroke.s; actx.lineCap = 'round'; actx.lineJoin = 'round';
            actx.filter = stroke.b ? 'blur(5px)' : 'none';
            
            if (stroke.n && !stroke.e) { 
                actx.shadowBlur = Math.max(10, stroke.s * 2); 
                actx.shadowColor = stroke.c; 
                actx.strokeStyle = '#ffffff'; 
            } else { 
                actx.shadowBlur = 0; 
                actx.shadowColor = 'transparent'; 
                actx.strokeStyle = stroke.c; 
            }
            
            let pts = stroke.p;
            if (pointIndex < pts.length) {
                for(let k=0; k<5; k++) { 
                    if (pointIndex < pts.length) {
                        actx.beginPath(); actx.moveTo(pts[pointIndex-2], pts[pointIndex-1]); actx.lineTo(pts[pointIndex], pts[pointIndex+1]); actx.stroke();
                        if (stroke.sym) { actx.beginPath(); actx.moveTo(canvasEl.width - pts[pointIndex-2], pts[pointIndex-1]); actx.lineTo(canvasEl.width - pts[pointIndex], pts[pointIndex+1]); actx.stroke(); }
                        pointIndex += 2;
                    }
                }
                requestAnimationFrame(drawNext);
            } else { strokeIndex++; pointIndex = 2; drawNext(); }
        } else {
            // Для фигур и заливки мы передаем false, чтобы не стирать весь холст!
            redrawFromStrokesSync([stroke], actx, canvasEl, isDark, false);
            strokeIndex++; pointIndex = 2; drawNext();
        }
    }
    drawNext();
}

const canvas = document.getElementById('drawing-board');
const zoomContainer = document.getElementById('zoom-container');
const ctx = canvas.getContext('2d', { desynchronized: true, willReadFrequently: false });
let isDrawing = false; let currentColor = '#000000'; let isErasing = false; let isFilling = false; let isEyedropper = false; let isBlur = false; let isRect = false; let isCircle = false; let isLine = false; let isArrow = false; let isSymmetry = false; let isNeon = false;
let canvasTransform = { x: 0, y: 0, scale: 1 }; let initialDistance = 0; let lastZoomCenter = { x: 0, y: 0 }; let preZoomState = null; 
let shapeStartX = 0, shapeStartY = 0; let shapeImgData = null; let isDrawingShape = false; let lastX = 0, lastY = 0;
let recordedStrokes = []; let strokesHistory = []; let currentStroke = null; let drawHistory = []; let historyIndex = -1;
let activePointers = new Map();
let zoomPanActive = false;

function initHistory() { drawHistory = []; strokesHistory = []; recordedStrokes = []; historyIndex = -1; saveState(); }
function saveState() { if (globalState.settings?.mode === 'hardcore' || globalState.settings?.mode === 'amnesia') return; if (historyIndex < drawHistory.length - 1) { drawHistory.length = historyIndex + 1; strokesHistory.length = historyIndex + 1; } drawHistory.push(canvas.toDataURL()); strokesHistory.push(JSON.parse(JSON.stringify(recordedStrokes))); historyIndex++; }
function restoreState(index) { 
    let img = new Image(); img.src = drawHistory[index]; 
    img.onload = () => { 
        ctx.globalAlpha=1; ctx.filter='none'; ctx.shadowBlur=0; ctx.globalCompositeOperation = 'source-over'; 
        const mode = globalState.settings?.mode;
        if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) { ctx.clearRect(0, 0, canvas.width, canvas.height); } 
        else { ctx.fillStyle = (mode === 'darkmode') ? '#000000' : '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0); 
    }; 
    recordedStrokes = JSON.parse(JSON.stringify(strokesHistory[index])); 
}
function undo() { if (historyIndex > 0) { historyIndex--; restoreState(historyIndex); } }
function redo() { if (historyIndex < drawHistory.length - 1) { historyIndex++; restoreState(historyIndex); } }

function clearTools() { 
    isErasing = false; isFilling = false; isEyedropper = false; isBlur = false; isRect = false; isCircle = false; isLine = false; isArrow = false; isNeon = false; 
    document.querySelectorAll('.tool-btn').forEach(s => { 
        if (!s.classList.contains('sym-tool')) s.classList.remove('active-swatch'); 
    }); 
}
function setColor(color, element) { currentColor = color; ctx.globalCompositeOperation = 'source-over'; document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active-swatch')); if(element) element.classList.add('active-swatch'); if (isErasing) setBrush(document.querySelector('.brush-tool')); }
function setBrush(element) { clearTools(); ctx.globalCompositeOperation = 'source-over'; if(element) element.classList.add('active-swatch'); }
function setEraser(element) { clearTools(); isErasing = true; ctx.globalCompositeOperation = 'destination-out'; element.classList.add('active-swatch'); }
function setFill(element) { clearTools(); isFilling = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function setEyedropper(element) { clearTools(); isEyedropper = true; element.classList.add('active-swatch'); }
function setRect(element) { clearTools(); isRect = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function setCircle(element) { clearTools(); isCircle = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function setLine(element) { clearTools(); isLine = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function setArrow(element) { clearTools(); isArrow = true; ctx.globalCompositeOperation = 'source-over'; element.classList.add('active-swatch'); }
function toggleSymmetry(element) { 
    if (globalState.settings?.mode === 'mirror') return; 
    isSymmetry = !isSymmetry; 
    element.classList.toggle('active-swatch', isSymmetry); 
}
function toggleNeon(element) { isNeon = !isNeon; element.classList.toggle('active-swatch', isNeon); }
function toggleBlur(element) { isBlur = !isBlur; element.classList.toggle('active-swatch', isBlur); }

function clearCanvas() { 
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over'; 
    const mode = globalState.settings?.mode; const isDark = mode === 'darkmode'; 
    if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) { ctx.clearRect(0, 0, canvas.width, canvas.height); } 
    else { ctx.fillStyle = isDark ? '#000000' : '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); const cw = document.getElementById('canvas-wrapper'); if(cw) cw.style.backgroundColor = isDark ? '#000000' : '#ffffff'; }
    if(isErasing) ctx.globalCompositeOperation = 'destination-out'; 
    recordedStrokes.push({ type: 'clear' }); saveState(); 
}

function resetCanvasTransform() { canvasTransform = { x: 0, y: 0, scale: 1 }; updateTransform(); }
function updateTransform() { if (!zoomContainer) return; if (canvasTransform.scale <= 1) { canvasTransform.scale = 1; canvasTransform.x = 0; canvasTransform.y = 0; } zoomContainer.style.transformOrigin = `0 0`; zoomContainer.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`; }
function getCoordinates(clientX, clientY) { const rect = canvas.getBoundingClientRect(); return { x: ((clientX - rect.left) / rect.width) * canvas.width, y: ((clientY - rect.top) / rect.height) * canvas.height }; }

function startPosition(e) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size >= 2) {
        if (isDrawing || isDrawingShape) {
            isDrawing = false; isDrawingShape = false;
            if (currentStroke && recordedStrokes.length > 0 && recordedStrokes[recordedStrokes.length-1] === currentStroke) {
                recordedStrokes.pop();
            }
            currentStroke = null;
            if (preZoomState) { 
                let img = new Image(); img.src = preZoomState;
                img.onload = () => { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0,0); }
            }
        }
        zoomPanActive = true;
        const pts = Array.from(activePointers.values());
        initialDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastZoomCenter = { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y)/2 };
        return;
    }
    
    zoomPanActive = false;

    try { canvas.setPointerCapture(e.pointerId); } catch(err){}
    let pos = getCoordinates(e.clientX, e.clientY); const mode = globalState.settings?.mode;

    if (mode === 'coop') { const players = globalState.players || []; const isLeft = players.indexOf(myUserId) % 2 === 0; if (isLeft && pos.x > 400) return; if (!isLeft && pos.x < 400) return; }
    if (mode === 'nohands' || (mode === 'inkmeter' && currentInk <= 0) || (mode === 'oneline' && hasDrawnStrokeOneline)) return; 
    
    if (isEyedropper) { const p = ctx.getImageData(pos.x, pos.y, 1, 1).data; const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6); setColor(hex); setBrush(document.querySelector('.brush-tool')); return; }
    if (isFilling) { floodFillCore(pos.x, pos.y, currentColor); recordedStrokes.push({ type: 'fill', c: currentColor, p: [Math.round(pos.x), Math.round(pos.y)] }); saveState(); return; }
    
    if (mode === 'chaos') { 
        currentColor = getRandomHex(); 
        const randomSize = Math.floor(Math.random() * 30) + 5;
        const bs = document.getElementById('brush-size'); 
        if(bs) bs.value = randomSize; 
    }

    if (mode === 'pixelart') { pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15; }
    if (mode === 'drunk') { pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40; }
    if (mode === 'connectdots') { let closest = null; let minDist = Infinity; dotsArray.forEach(d => { let dist = Math.hypot(d.x - pos.x, d.y - pos.y); if (dist < 40 && dist < minDist) { minDist = dist; closest = d; } }); if (closest) pos = {x: closest.x, y: closest.y}; else return;  }
    
    let opacity = 1; const bo = document.getElementById('brush-opacity'); if (bo) opacity = parseFloat(bo.value);
    if (isRect || isCircle || isLine || isArrow) { shapeStartX = Math.round(pos.x); shapeStartY = Math.round(pos.y); shapeImgData = ctx.getImageData(0,0,canvas.width, canvas.height); isDrawingShape = true; return; }
    preZoomState = canvas.toDataURL(); isDrawing = true; 
    let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
    currentStroke = { c: currentColor, s: bsVal, e: isErasing?1:0, o: opacity, b: isBlur?1:0, sym: isSymmetry?1:0, n: isNeon?1:0, p: [Math.round(pos.x), Math.round(pos.y)] };
    lastX = pos.x; lastY = pos.y;
    ctx.lineWidth = bsVal; ctx.lineCap = mode === 'pixelart' ? 'square' : 'round'; ctx.lineJoin = mode === 'pixelart' ? 'miter' : 'round'; ctx.globalAlpha = isErasing ? 1 : opacity; ctx.filter = isBlur ? 'blur(5px)' : 'none'; ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    if (isNeon && !isErasing) { ctx.shadowBlur = Math.max(10, bsVal * 2); ctx.shadowColor = currentColor; ctx.strokeStyle = '#ffffff'; } else { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.strokeStyle = currentColor; }
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); if (isSymmetry) { ctx.beginPath(); ctx.moveTo(canvas.width - pos.x, pos.y); ctx.lineTo(canvas.width - pos.x, pos.y); ctx.stroke(); }
}

function draw(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size >= 2 || zoomPanActive) {
      if (e.pointerType === 'touch') e.preventDefault();
      if (activePointers.size < 2) return;
      const pts = Array.from(activePointers.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const cx = (pts[0].x + pts[1].x)/2; const cy = (pts[0].y + pts[1].y)/2;
      
      if (initialDistance === 0) { initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; }
      
      let newScale = canvasTransform.scale * (currentDist / initialDistance);
      if (newScale < 1) newScale = 1; if (newScale > 10) newScale = 10;
      
      const wrapperRect = zoomContainer.parentElement.getBoundingClientRect();
      canvasTransform.x -= (cx - wrapperRect.left - canvasTransform.x) * (newScale / canvasTransform.scale - 1);
      canvasTransform.y -= (cy - wrapperRect.top - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
      canvasTransform.x += (cx - lastZoomCenter.x); canvasTransform.y += (cy - lastZoomCenter.y);
      canvasTransform.scale = newScale; 
      
      initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; 
      updateTransform(); return;
  }
  
  if (!isDrawing && !isDrawingShape) return; 
  if (e.pointerType === 'touch') e.preventDefault(); 
  
  let pos = getCoordinates(e.clientX, e.clientY); const mode = globalState.settings?.mode;
  if (mode === 'coop') { const players = globalState.players || []; const isLeft = players.indexOf(myUserId) % 2 === 0; if (isLeft && pos.x > 400) pos.x = 400; if (!isLeft && pos.x < 400) pos.x = 400; }
  if (mode === 'pixelart') { pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15; }
  if (mode === 'drunk') { pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40; }
  if (mode === 'connectdots') { let closest = null; let minDist = Infinity; dotsArray.forEach(d => { let dist = Math.hypot(d.x - pos.x, d.y - pos.y); if (dist < 40 && dist < minDist) { minDist = dist; closest = d; } }); if (closest) pos = {x: closest.x, y: closest.y}; else return; }
  
  let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
  if (mode === 'inkmeter') { let dist = Math.hypot(pos.x - lastX, pos.y - lastY); currentInk -= dist * (bsVal / 5); if (currentInk < 0) currentInk = 0; const im = document.getElementById('ink-meter-bar'); if(im) im.style.width = `${(currentInk/maxInk)*100}%`; if (currentInk === 0) return; }
  
  let opacity = 1; const bo = document.getElementById('brush-opacity'); if (bo) opacity = parseFloat(bo.value);
  ctx.lineWidth = bsVal; ctx.globalAlpha = isErasing ? 1 : opacity; ctx.filter = isBlur ? 'blur(5px)' : 'none'; ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
  if (isNeon && !isErasing) { ctx.shadowBlur = Math.max(10, bsVal * 2); ctx.shadowColor = currentColor; ctx.strokeStyle = '#ffffff'; } else { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.strokeStyle = currentColor; }

  if (isDrawingShape) {
      ctx.putImageData(shapeImgData, 0, 0); ctx.beginPath();
      if (isRect) { ctx.strokeRect(shapeStartX, shapeStartY, pos.x - shapeStartX, pos.y - shapeStartY); if (isSymmetry) ctx.strokeRect(canvas.width - shapeStartX, shapeStartY, -(pos.x - shapeStartX), pos.y - shapeStartY); } 
      else if (isCircle) { let r = Math.hypot(pos.x - shapeStartX, pos.y - shapeStartY); ctx.arc(shapeStartX, shapeStartY, r, 0, Math.PI*2); ctx.stroke(); if (isSymmetry) { ctx.beginPath(); ctx.arc(canvas.width - shapeStartX, shapeStartY, r, 0, Math.PI*2); ctx.stroke(); } } 
      else if (isLine) { ctx.moveTo(shapeStartX, shapeStartY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); if (isSymmetry) { ctx.beginPath(); ctx.moveTo(canvas.width - shapeStartX, shapeStartY); ctx.lineTo(canvas.width - pos.x, pos.y); ctx.stroke(); } } 
      else if (isArrow) { drawArrow(ctx, shapeStartX, shapeStartY, pos.x, pos.y); if (isSymmetry) { ctx.beginPath(); drawArrow(ctx, canvas.width - shapeStartX, shapeStartY, canvas.width - pos.x, pos.y); } }
      lastX = pos.x; lastY = pos.y; return;
  }
  if(currentStroke) { currentStroke.p.push(Math.round(pos.x), Math.round(pos.y)); }
  ctx.lineCap = mode === 'pixelart' ? 'square' : 'round'; ctx.lineJoin = mode === 'pixelart' ? 'miter' : 'round';
  ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
  if (isSymmetry) { ctx.beginPath(); ctx.moveTo(canvas.width - lastX, lastY); ctx.lineTo(canvas.width - pos.x, pos.y); ctx.stroke(); }
  lastX = pos.x; lastY = pos.y;
}

function endPosition(e) { 
    if (e && e.pointerId) {
        activePointers.delete(e.pointerId);
        try { if(canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
    if (activePointers.size > 0) { if (activePointers.size === 1) initialDistance = 0; return; }
    if (zoomPanActive) { zoomPanActive = false; return; }
    
    ctx.beginPath(); ctx.filter = 'none'; ctx.shadowBlur = 0;
    let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
    let opacity = 1; const bo = document.getElementById('brush-opacity'); if (bo) opacity = parseFloat(bo.value);

    if (isDrawingShape) {
        isDrawingShape = false; let t = isRect ? 'rect' : (isCircle ? 'circle' : (isLine ? 'line' : 'arrow'));
        recordedStrokes.push({ type: t, c: currentColor, s: bsVal, o: opacity, b: isBlur?1:0, sym: isSymmetry?1:0, n: isNeon?1:0, p: [shapeStartX, shapeStartY, lastX, lastY] });
        saveState(); 
        if (globalState.settings?.mode === 'amnesia') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
    if (!isDrawing) return; isDrawing = false; 
    if (globalState.settings?.mode === 'oneline') hasDrawnStrokeOneline = true;
    if (currentStroke) { recordedStrokes.push(currentStroke); currentStroke = null; }
    saveState(); 
    if (globalState.settings?.mode === 'amnesia') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

canvas.addEventListener('pointerdown', startPosition); 
canvas.addEventListener('pointerup', endPosition);
canvas.addEventListener('pointermove', draw, {passive: false}); 
canvas.addEventListener('pointercancel', endPosition);
canvas.addEventListener('pointerout', endPosition);

// ==========================================
// ГОЛОСОВАНИЕ ПРЕДАТЕЛЯ И ЧАТ-ПРЕЗЕНТАЦИЯ
// ==========================================
let voices = []; window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };
function speakText(text) {
    if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ru-RU';
    if (voices.length === 0) voices = window.speechSynthesis.getVoices(); const bestVoice = voices.find(v => v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices.find(v => v.lang.includes('ru'));
    if (bestVoice) utterance.voice = bestVoice; utterance.pitch = 0.9 + Math.random() * 0.4; window.speechSynthesis.speak(utterance);
}

function startPresentation() { if (!isHost) return; initAudio(); window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: 0, round: 1 } }}, '*'); }

function startImpostorVoting() {
    if (!isHost) return;
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: false }, voting: { active: true, results: {} } }}, '*');
}

function renderVotingGrid() {
    const grid = document.getElementById('voting-players-grid');
    const players = globalState.players || [];
    const myVote = globalState.voting?.results?.[myUserId];
    
    if (myVote) {
        setDisplay('voting-players-grid', 'none'); setDisplay('voting-waiting-msg', 'block'); return;
    }
    
    setDisplay('voting-players-grid', 'grid'); setDisplay('voting-waiting-msg', 'none');
    grid.innerHTML = players.map(pid => {
        const name = globalState.playerNames?.[pid] || "Аноним";
        const avatar = globalState.playerAvatars?.[pid] || "https://picsum.photos/100";
        return `<div class="mode-card" style="padding: 15px; display:flex; flex-direction:column; gap:10px; align-items:center;" onclick="submitVote('${pid}')">
                    <img src="${avatar}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                    <span style="font-weight:bold; font-size:1.1rem; color:white;">${name}</span>
                </div>`;
    }).join('');
}

function submitVote(targetId) {
    const updates = {}; updates[`voting/results/${myUserId}`] = targetId;
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function renderVotingResults() {
    const players = globalState.players || [];
    const impIndex = Math.floor(seededRandom(globalState.settings?.seed || 1) * players.length);
    const impostorId = players[impIndex]; 
    const impostorName = globalState.playerNames?.[impostorId] || "Аноним";
    
    const votes = globalState.voting?.results || {};
    const voteCounts = {};
    Object.values(votes).forEach(v => { voteCounts[v] = (voteCounts[v] || 0) + 1; });
    
    let maxVotes = 0; Object.values(voteCounts).forEach(v => { if(v > maxVotes) maxVotes = v; });
    const mostVoted = Object.keys(voteCounts).filter(k => voteCounts[k] === maxVotes);
    
    let verdict = "";
    if (mostVoted.includes(impostorId)) verdict = `<span style="color:#22c55e;">Предатель найден! Это был ${impostorName}</span>`;
    else verdict = `<span style="color:#ef4444;">Предатель победил! Это был ${impostorName}</span>`;
    setHTML('voting-verdict', verdict);
    
    const list = document.getElementById('voting-details-list');
    list.innerHTML = players.map(pid => {
        const name = globalState.playerNames?.[pid] || "Аноним";
        const vCount = voteCounts[pid] || 0;
        return `<div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; border:${pid === impostorId ? '2px solid #ef4444' : 'none'}">
            <span style="font-size:1.2rem;">${name}</span> <span style="font-weight:bold; color:#fbbf24; font-size:1.2rem;">${vCount} голосов</span>
        </div>`;
    }).join('');
}

let renderedPresentationState = '';
function syncPresentationView(players) {
    const pres = globalState.presentation; if (!pres) return;
    const currentStateId = `${pres.bookIndex}-${pres.round}-${globalState.settings?.seed || Math.random()}`; 
    if (renderedPresentationState === currentStateId) return;

    const bookOwnerId = players[pres.bookIndex];
    const mode = globalState.settings?.mode;
    
    let bookTitle = `История: ${globalState.playerNames?.[bookOwnerId] || "Аноним"}`;
    if (mode === 'coop') bookTitle = "Общий Шедевр";
    setText('chat-book-title', bookTitle);
    
    const avatarsContainer = document.getElementById('presentation-avatars');
    if (pres.round === 1) { 
        setHTML('chat-messages', ''); 
        if (avatarsContainer) {
            avatarsContainer.innerHTML = '';
            for (let i = 0; i < calculatedTotalRounds; i++) {
                let stepAuthorId = players[(players.indexOf(bookOwnerId) + i + players.length * 10) % players.length];
                if (mode === 'coop' && i === 1) stepAuthorId = players[(players.indexOf(bookOwnerId) + 1) % players.length]; 
                
                const avatar = globalState.playerAvatars?.[stepAuthorId] || "https://picsum.photos/100";
                const wrap = document.createElement('div'); wrap.className = 'pres-avatar-node';
                const img = document.createElement('img'); img.src = avatar; img.className = `pres-avatar-img`; img.id = `pres-av-${i + 1}`;
                wrap.appendChild(img); avatarsContainer.appendChild(wrap);
                if (i < calculatedTotalRounds - 1) {
                    const conn = document.createElement('div'); conn.className = `pres-connector`; conn.id = `pres-conn-${i + 1}`;
                    avatarsContainer.appendChild(conn);
                }
            }
        }
    }

    if (avatarsContainer) {
        for (let i = 1; i <= calculatedTotalRounds; i++) {
            const av = document.getElementById(`pres-av-${i}`);
            const conn = document.getElementById(`pres-conn-${i}`);
            if (av) {
                if (i === pres.round) { av.classList.add('current'); av.classList.remove('done'); }
                else if (i < pres.round) { av.classList.add('done'); av.classList.remove('current'); }
                else { av.classList.remove('current'); av.classList.remove('done'); }
            }
            if (conn) { if (i < pres.round) conn.classList.add('active'); else conn.classList.remove('active'); }
        }
    }

    function extractData(rawData) {
        let textData = rawData, imgUrl = rawData, strokes = null, isText = true, babelData = null;
        if (typeof rawData === 'string') {
            if (rawData.startsWith('{')) {
                try { 
                    let parsed = JSON.parse(rawData); 
                    if (parsed.img) { imgUrl = parsed.img; strokes = parsed.strokes; isText = false; }
                    else if (parsed.type === 'babel') { isText = true; babelData = parsed; textData = parsed.translated; }
                    else if (parsed.type === 'coop') { isText = true; textData = parsed.original; }
                } catch(e) {}
            } else if (rawData.length > 1000 && rawData.startsWith('data:image')) { isText = false; }
        }
        if (mode === 'story') isText = true;
        if (isText && (!textData || textData.length === 0)) { textData = "(Слово не сохранилось)"; }
        return { isText, textData, imgUrl, strokes, babelData };
    }

    let pData = extractData(globalState.submissions?.[`round_${pres.round}`]?.[bookOwnerId]);
    let authorId = players[(players.indexOf(bookOwnerId) + pres.round - 1 + players.length * 10) % players.length];
    let authorName = globalState.playerNames?.[authorId] || "Аноним";
    let authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    
    const side = pData.isText ? 'left' : 'right'; let visualContent = '';

    if (mode === 'impostor' && pData.isText) {
        if (isHost) setTimeout(nextSlide, 500); 
        renderedPresentationState = currentStateId; return;
    }

    if (mode === 'coop') {
        const p1 = bookOwnerId;
        const p2 = players[(players.indexOf(bookOwnerId) + 1) % players.length];
        const author1 = globalState.playerNames?.[p1] || "Игрок 1";
        const author2 = globalState.playerNames?.[p2] || "Игрок 2";
        authorName = `${author1} & ${author2}`;

        if (pres.round === 1) {
            const w1 = extractData(globalState.submissions?.[`round_1`]?.[p1])?.textData || "...";
            const w2 = extractData(globalState.submissions?.[`round_1`]?.[p2])?.textData || "...";
            visualContent = `<div class="msg-text">Слова: <br><span style="color:#fbbf24">${w1}</span> и <span style="color:#22c55e">${w2}</span></div>`;
            speakText(`Тема: ${w1} и ${w2}`);
        } else if (pres.round === 2) {
            const p1Data = extractData(globalState.submissions?.[`round_2`]?.[p1]);
            const p2Data = extractData(globalState.submissions?.[`round_2`]?.[p2]);
            visualContent = `
            <div style="position:relative; width:100%; max-height: 40vh; aspect-ratio: 4/3; background: white; border-radius:12px; border: 2px solid rgba(255,255,255,0.9); overflow: hidden;">
               <img src="${p1Data.imgUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain;">
               <img src="${p2Data.imgUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain;">
               <div style="position:absolute; left:50%; top:0; bottom:0; width:4px; background:#ef4444; opacity:0.8; box-shadow: 0 0 10px #ef4444;"></div>
            </div>`;
        }
    } else if (pData.isText) { 
        if (pData.babelData) {
            visualContent = `<div class="msg-text"><div style="font-size:0.9rem; opacity:0.7; margin-bottom:5px;">Оригинал: ${pData.babelData.original}</div><div style="color:#fbbf24; font-weight:bold; font-size:1.2rem;">${pData.babelData.translated}</div></div>`;
            speakText(`Оригинал: ${pData.babelData.original}. Итог: ${pData.babelData.translated}`);
        } else {
            visualContent = `<div class="msg-text">${pData.textData}</div>`; 
            speakText(pData.textData);
        }
    } else {
        if (mode === 'finishit' || mode === 'tagteam' || mode === 'plagiarism' || mode === 'impostor') {
            visualContent = `<div style="position:relative; width:100%;"><img src="${pData.imgUrl}" class="msg-img"></div>`;
        } else {
            visualContent = `<div style="position:relative; width:100%;"><canvas class="msg-canvas" width="800" height="600" id="anim-canvas-${pres.round}-${bookOwnerId}" style="width:100%; border-radius:12px; border:2px solid rgba(255,255,255,0.1); background:${mode==='darkmode'?'#000':'#fff'}"></canvas></div>`;
        }
    }

    const msgHTML = `<div class="msg-row ${side}"><img src="${authorAvatar}" class="msg-avatar"><div class="msg-bubble"><div class="msg-author">${authorName}</div>${visualContent}</div></div>`;
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) { 
        chatContainer.insertAdjacentHTML('beforeend', msgHTML); 
        setTimeout(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); }, 50); 
    }

    if (visualContent.includes('anim-canvas')) {
        setTimeout(() => {
            const c = document.getElementById(`anim-canvas-${pres.round}-${bookOwnerId}`);
            if (c && pData.strokes) {
                animateStrokes(pData.strokes, c, mode === 'darkmode');
            }
        }, 100);
    }

    if (isHost) {
        if (pres.round === calculatedTotalRounds) {
            let isLast = pres.bookIndex === players.length - 1;
            if (mode === 'coop') isLast = pres.bookIndex >= players.length - 2;

            if (isLast) {
                if (mode === 'impostor') {
                    setDisplay('next-slide-btn', 'none'); setDisplay('play-again-btn', 'none');
                    const chatFooter = document.querySelector('.chat-footer');
                    if (!document.getElementById('start-voting-btn')) { chatFooter.insertAdjacentHTML('beforeend', `<button class="btn-primary full-width" id="start-voting-btn" style="background:#ef4444;" onclick="startImpostorVoting()">Перейти к голосованию</button>`); }
                } else {
                    setDisplay('next-slide-btn', 'none'); setDisplay('play-again-btn', 'block');
                }
            } else { setText('next-slide-btn', "Следующая история"); }
        } else { setText('next-slide-btn', "Показать дальше"); }
    }
    renderedPresentationState = currentStateId;
}

function nextSlide() {
    if (!isHost) return;
    const pres = globalState.presentation; const players = globalState.players || [];
    let nextR = pres.round + 1; let nextB = pres.bookIndex;
    if (nextR > calculatedTotalRounds) { 
        if (globalState.settings?.mode === 'coop') nextB += 2; 
        else nextB++; 
        nextR = 1; 
    }
    window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: nextB, round: nextR } }}, '*');
}