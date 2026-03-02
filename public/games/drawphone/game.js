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

setText('players-count-display', playersCountParam);
setText('player-name-display', myName);

if (isHost) setDisplay('host-controls', 'block');
else setDisplay('guest-waiting', 'flex');

function leaveGame() { window.parent.postMessage({ type: 'leave_game' }, '*'); }
function requestFullscreen() { window.parent.postMessage({ type: 'request_fullscreen' }, '*'); }

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

// Безопасное закрытие полноэкранного плагиата
function hidePlagiarism(e) { 
    if(e) e.preventDefault();
    setDisplay('plagiarism-overlay', 'none'); 
}

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

function playWarningBeep() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 880; 
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
            if (!currentPhaseSubmitted && Math.floor(remaining) !== Math.floor(remaining + timeMultiplier)) playWarningBeep(); 
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
    currentPhaseSubmitted = false; isCurrentPhaseDrawing = isDrawing; timeMultiplier = 1;
    let timeLimit = globalState.settings?.time || 90;
    
    if (globalState.settings?.mode === 'tagteam') timeLimit = 5;
    if (globalState.settings?.mode === 'plagiarism' && currentLocalRound > 1) timeLimit = Math.max(15, timeLimit - (currentLocalRound - 1) * 15);
    if (globalState.settings?.mode === 'finishit' && currentLocalRound === 1) timeLimit = 10;

    let timeRemaining = timeLimit; updateTimerUI(timeRemaining, timeLimit);

    phaseTimerInterval = setInterval(() => {
        timeRemaining -= (0.1 * timeMultiplier);
        if (timeRemaining <= 0) {
            clearInterval(phaseTimerInterval);
            if (!currentPhaseSubmitted) { if (isDrawing) submitDrawing(false); else submitWord(false); }
        } else { updateTimerUI(timeRemaining, timeLimit); }
    }, 100);
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
  
  // ГАРАНТИРОВАННАЯ ОЧИСТКА БАЗЫ ДАННЫХ ПЕРЕД НОВОЙ ИГРОЙ
  let resetSubs = {};
  for(let i=1; i<=30; i++) resetSubs[`round_${i}`] = {};

  window.parent.postMessage({ 
      type: 'update_state', 
      updates: { submissions: resetSubs, presentation: { active: false, bookIndex: 0, round: 1 } } 
  }, '*');

  window.parent.postMessage({ 
      type: 'start_game', 
      settings: { mode: selectedMode, time: finalTime, roundsMultiplier: roundsMult, seed: seed } 
  }, '*');
}

function playAgain() {
  if (!isHost) return;
  // ГАРАНТИРОВАННАЯ ОЧИСТКА ПРИ ВЫХОДЕ В ЛОББИ
  let resetSubs = {};
  for(let i=1; i<=30; i++) resetSubs[`round_${i}`] = {};
  window.parent.postMessage({ type: 'update_state', updates: { submissions: resetSubs, presentation: null, round: 0 } }, '*');
  window.parent.postMessage({ type: 'play_again' }, '*');
}

// -----------------------------------------------------
// ГЛОБАЛЬНЫЙ СБРОС ЛОКАЛЬНЫХ ДАННЫХ БРАУЗЕРА ПРИ НОВОЙ ИГРЕ
// -----------------------------------------------------
function resetLocalGameData() {
    currentLocalRound = 0;
    clearInterval(phaseTimerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    setDisplay('play-again-btn', 'none'); 
    setHTML('chat-messages', ''); 
    const avatarsContainer = document.getElementById('presentation-avatars');
    if (avatarsContainer) avatarsContainer.innerHTML = '';
    
    renderedPresentationState = '';
    lassoStampsCache = {};
    activeLassoStampRef = null;
    dotsArray = [];
    hasDrawnStrokeOneline = false;
    isGyroEnabled = false;
    finishitBaseImg = new Image();
    
    // Сбрасываем инструменты в дефолт
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

let lassoStampsCache = {};
let activeLassoStampRef = null;

function preloadLassoStamps() {
    lassoStampsCache = {};
    const r1 = globalState.submissions?.round_1;
    if (!r1) return;
    Object.keys(r1).forEach(k => {
        let data = r1[k];
        if (typeof data === 'string' && data.startsWith('{')) { try { data = JSON.parse(data).img; } catch(e){} }
        if (data) { let img = new Image(); img.src = data; lassoStampsCache[k] = img; }
    });
}

function seededRandom(seed) { var x = Math.sin(seed++) * 10000; return x - Math.floor(x); }

function handleStateChange() {
  const players = globalState.players || [];
  if (players.length > 0) renderPlayersList(players);

  // ТОТАЛЬНЫЙ СБРОС ЕСЛИ МЫ В ЛОББИ (Решает баг со старой игрой)
  if (!globalState.status || globalState.status === 'waiting') {
    resetLocalGameData();
    showPhase('lobby-screen'); 
    return;
  }

  calculatedTotalRounds = players.length * (globalState.settings?.roundsMultiplier || 1);

  if (globalState.status === 'finished') {
    currentLocalRound = -1; clearInterval(phaseTimerInterval);
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
  const noColorModes = ['nocolor', 'onecolor', 'chaos', 'darkmode', 'amnesia'];
  
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

  if (mode === 'hardcore') { setDisplay('action-tools', 'none'); setDisplay('tool-divider-1', 'none'); } 
  else { setDisplay('action-tools', 'flex'); setDisplay('tool-divider-1', 'block'); }

  if (mode === 'lasso' && globalState.round > 2) preloadLassoStamps();

  if (globalState.round > currentLocalRound) startRound(globalState.round, players);
  updateWaitingScreen();

  if (isHost) {
    const currentSubs = globalState.submissions?.[`round_${globalState.round}`] || {};
    
    // БРОНЕБОЙНАЯ ПРОВЕРКА ГОТОВНОСТИ (игнорирует старые пустые файлы)
    let activeReadyCount = players.filter(pid => typeof currentSubs[pid] === 'string' && currentSubs[pid].length > 0).length;
    
    if (activeReadyCount >= players.length) {
      if (globalState.round >= calculatedTotalRounds) window.parent.postMessage({ type: 'update_state', updates: { status: 'finished' } }, '*');
      else window.parent.postMessage({ type: 'update_state', updates: { round: globalState.round + 1 } }, '*');
    }
  }
}

function showPhase(phaseId) {
  document.querySelectorAll('.screen, .phase-container').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(phaseId);
  if (target) {
      if (target.classList.contains('screen')) target.classList.add('active');
      else { const gs = document.getElementById('game-screen'); if(gs) gs.classList.add('active'); target.classList.add('active'); }
  }
  setDisplay('leave-btn', (phaseId === 'lobby-screen' || phaseId === 'ready-to-present-phase' || phaseId === 'presentation-phase') ? 'flex' : 'none');
}

function getCurrentNotebookId(round, players) {
    if (globalState.settings?.mode === 'tagteam') return players[0]; 
    const myIndex = players.indexOf(myUserId);
    if (myIndex === -1) return myUserId; 
    return players[(myIndex - round + 1 + players.length * 10) % players.length];
}

function startRound(round, players) {
  currentLocalRound = round;
  const mode = globalState.settings?.mode;
  hasDrawnStrokeOneline = false; isGyroEnabled = false;
  
  let isDrawingPhase = (round % 2 === 0);
  if (mode === 'icebreaker' || mode === 'tagteam') isDrawingPhase = (round % 2 !== 0);
  if (mode === 'story') isDrawingPhase = false;
  if (mode === 'plagiarism' || mode === 'finishit') isDrawingPhase = true;
  if (mode === 'copycat') isDrawingPhase = (round > 1);
  if (mode === 'tagteam') isDrawingPhase = true;
  
  if (mode === 'onecolor' && isDrawingPhase) currentColor = getRandomHex();

  const badgeText = `Этап ${round}/${calculatedTotalRounds}`;
  setText('text-round-badge', badgeText); setText('draw-round-badge', badgeText);

  startPhaseTimer(isDrawingPhase);

  const notebookId = getCurrentNotebookId(round, players);
  let previousData = round > 1 ? globalState.submissions?.[`round_${round - 1}`]?.[notebookId] : null;

  const bgRef = document.getElementById('bg-reference-img');
  if (bgRef) { bgRef.style.display = 'none'; bgRef.src = ''; }

  if (isDrawingPhase) {
      const zContainer = document.getElementById('zoom-container');
      if(zContainer) zContainer.className = ''; 
      
      setDisplay('brush-settings', 'flex'); setDisplay('plagiarism-overlay', 'none');
      setDisplay('ink-meter-container', 'none'); setDisplay('coop-divider', 'none');
      setDisplay('btn-gyro-start', 'none'); setDisplay('gyro-cursor', 'none');
      setDisplay('lasso-stamps-container', 'none'); setDisplay('sidebar-tools', 'flex');
      
      if (mode === 'mirror' && zContainer) zContainer.classList.add('mode-mirror');
      if (mode === 'earthquake' && zContainer) zContainer.classList.add('mode-earthquake');
      if (mode === 'tiny' && zContainer) zContainer.classList.add('mode-tiny');
      if (mode === 'giant') { setDisplay('brush-settings', 'none'); const bs = document.getElementById('brush-size'); if(bs) bs.value = 40; }
      if (mode === 'fading') { setDisplay('brush-settings', 'none'); const bo = document.getElementById('brush-opacity'); if(bo) bo.value = 0.05; }
      if (mode === 'pixelart') { setDisplay('brush-settings', 'none'); const bs = document.getElementById('brush-size'); if(bs) bs.value = 15; }
      
      if (mode === 'inkmeter') { setDisplay('ink-meter-container', 'block'); currentInk = maxInk; const im = document.getElementById('ink-meter-bar'); if(im) im.style.width = '100%'; }
      if (mode === 'coop') setDisplay('coop-divider', 'block');
      if (mode === 'nohands') setDisplay('btn-gyro-start', 'block');

      resetCanvasTransform(); clearCanvas(); initHistory(); setBrush(document.querySelector('.brush-tool'));
      
      if (mode === 'connectdots' || mode === 'constellation') {
          dotsArray = [];
          for(let i=0; i<30; i++) dotsArray.push({x: Math.random()*700+50, y: Math.random()*500+50});
          ctx.fillStyle = (globalState.settings?.mode === 'darkmode' || mode === 'constellation') ? '#fff' : '#000';
          dotsArray.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI*2); ctx.fill(); });
      }

      if (round === 1) { 
          if (mode === 'finishit') setHTML('word-to-draw', "Нарисуйте заготовку!");
          else if (mode === 'lasso') {
              let p = "Фрагмент";
              if (typeof getRandomLassoPart === 'function') p = getRandomLassoPart();
              setHTML('word-to-draw', "Нарисуй: " + p);
          }
          else if (mode === 'triplethreat') {
              let w = "Три случайных слова";
              if (typeof getRandomTriple === 'function') w = getRandomTriple();
              setHTML('word-to-draw', w);
          }
          else setHTML('word-to-draw', "Что угодно!");
      } else {
          let prevImg = null;
          if (typeof previousData === 'string' && previousData.startsWith('{')) { try { prevImg = JSON.parse(previousData).img; } catch(e){} } 
          else { prevImg = previousData; } 

          if (mode === 'plagiarism') {
              setText('word-to-draw', "Перерисуй по памяти!"); setDisplay('plagiarism-overlay', 'flex');
              const pi = document.getElementById('plagiarism-img'); if(pi) pi.src = prevImg;
          } else if (mode === 'finishit' || mode === 'tagteam') {
              setText('word-to-draw', mode === 'finishit' ? "Дорисуй-ка!" : "Продолжи рисунок!");
              finishitBaseImg.src = prevImg;
              if (bgRef) { bgRef.src = prevImg; bgRef.style.display = 'block'; bgRef.style.opacity = '1'; }
          } else if (mode === 'copycat' && prevImg && prevImg.length > 50) {
              setHTML('word-to-draw', `<img src="${prevImg}" style="height:35px; border-radius:5px; margin-left:10px;"> Перерисуй!`);
          } else if (mode === 'lasso' && round > 2) {
              setText('word-to-draw', "Собери: " + previousData);
              setDisplay('sidebar-tools', 'none'); setDisplay('lasso-stamps-container', 'flex');
              const sc = document.getElementById('lasso-stamps-container'); if(sc) sc.innerHTML = '';
              Object.keys(lassoStampsCache).forEach(k => {
                  let im = new Image(); im.src = lassoStampsCache[k].src; im.className = 'lasso-stamp-img';
                  im.onclick = () => { document.querySelectorAll('.lasso-stamp-img').forEach(i=>i.classList.remove('active')); im.classList.add('active'); activeLassoStampRef = k; };
                  if(sc) sc.appendChild(im);
              });
          } else { setText('word-to-draw', previousData || "..."); }
      }
      showPhase('draw-phase');
  } else {
      const wi = document.getElementById('word-input'); if(wi) wi.value = '';
      if (round === 1) {
          setDisplay('babel-translation', 'none');
          setText('text-instruction', mode==='story'?'Начните историю...':'Придумайте фразу');
          setDisplay('image-to-guess', 'none'); setDisplay('text-to-continue', 'none');
          
          if (mode === 'impostor') {
              let p = ["Слово", "Слово"];
              if (typeof getImpostorPair === 'function') p = getImpostorPair();
              let isImpostor = players.indexOf(myUserId) === 0;
              if(wi) { wi.value = isImpostor ? p[1] : p[0]; wi.disabled = true; }
              setText('text-instruction', "Ваше слово:");
          } else { if(wi) wi.disabled = false; }

      } else {
          if(wi) wi.disabled = false;
          setDisplay('babel-translation', 'none');

          if (mode === 'story') {
              setText('text-instruction', 'Продолжите историю...');
              setDisplay('image-to-guess', 'none'); setDisplay('text-to-continue', 'block');
              setText('text-to-continue', `"...${previousData}"`);
          } else if (mode === 'lasso') {
              setText('text-instruction', 'Придумайте безумную тему (что соберем?):');
              setDisplay('image-to-guess', 'none'); setDisplay('text-to-continue', 'none');
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

function submitWord(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true; clearInterval(phaseTimerInterval);
  let word = "Секретик";
  const wi = document.getElementById('word-input');
  if (wi && wi.value.trim()) word = wi.value.trim();

  if (globalState.settings?.mode === 'babel' && currentLocalRound > 1) {
      setDisplay('babel-translation', 'block'); setText('babel-translation', "Переводим...");
      setTimeout(() => {
          let trans = word;
          if (typeof getBabelTranslation === 'function') trans = getBabelTranslation(word);
          const updates = {};
          updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = trans;
          window.parent.postMessage({ type: 'update_state', updates }, '*');
          showPhase('waiting-phase'); updateWaitingScreen();
      }, 1500); return;
  }
  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = word;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  showPhase('waiting-phase'); updateWaitingScreen();
}

function submitDrawing(isManual = false) {
  if (currentPhaseSubmitted) return;
  if (isManual) { initAudio(); requestFullscreen(); }
  currentPhaseSubmitted = true; clearInterval(phaseTimerInterval);
  const mode = globalState.settings?.mode; let finalDataUrl = '';

  if (mode === 'amnesia') {
      redrawFromStrokesSync(recordedStrokes, ctx, canvas, mode === 'darkmode');
      finalDataUrl = canvas.toDataURL('image/png');
  } else if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) {
      const tc = document.createElement('canvas'); tc.width = canvas.width; tc.height = canvas.height;
      const tCtx = tc.getContext('2d'); tCtx.fillStyle = '#ffffff'; tCtx.fillRect(0,0,tc.width,tc.height);
      tCtx.drawImage(finishitBaseImg, 0, 0, tc.width, tc.height);
      tCtx.drawImage(canvas, 0, 0);
      finalDataUrl = tc.toDataURL('image/png');
  } else {
      const tempCtx = canvas.getContext('2d'); tempCtx.globalCompositeOperation = 'destination-over'; tempCtx.fillStyle = (mode === 'darkmode') ? '#000000' : '#ffffff';
      tempCtx.fillRect(0, 0, canvas.width, canvas.height); finalDataUrl = canvas.toDataURL('image/png');
  }
  
  const finalData = JSON.stringify({ img: finalDataUrl, strokes: recordedStrokes });
  const updates = {};
  updates[`submissions/round_${currentLocalRound}/${getCurrentNotebookId(currentLocalRound, globalState.players || [])}`] = finalData;
  window.parent.postMessage({ type: 'update_state', updates }, '*');
  resetCanvasTransform(); showPhase('waiting-phase'); updateWaitingScreen();
}

function startGyro() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(res => { if (res === 'granted') enableGyro(); });
    } else enableGyro();
}
function enableGyro() {
    isGyroEnabled = true; setDisplay('btn-gyro-start', 'none'); setDisplay('gyro-cursor', 'block');
    gyroX = 400; gyroY = 300; ctx.beginPath(); ctx.moveTo(gyroX, gyroY);
    preZoomState = canvas.toDataURL(); isDrawing = true;
    currentStroke = { c: currentColor, s: document.getElementById('brush-size').value, e: 0, p: [gyroX, gyroY] };
    window.addEventListener('deviceorientation', (e) => {
        if (!isDrawing || !isGyroEnabled) return;
        gyroX += e.gamma * 0.5; gyroY += e.beta * 0.5;
        gyroX = Math.max(0, Math.min(800, gyroX)); gyroY = Math.max(0, Math.min(600, gyroY));
        const gc = document.getElementById('gyro-cursor');
        if(gc) { gc.style.left = `${(gyroX/800)*100}%`; gc.style.top = `${(gyroY/600)*100}%`; }
        currentStroke.p.push(Math.round(gyroX), Math.round(gyroY));
        ctx.lineTo(gyroX, gyroY); ctx.stroke();
    });
}

function drawArrow(actx, fromx, fromy, tox, toy) {
    let headlen = actx.lineWidth * 3; let angle = Math.atan2(toy - fromy, tox - fromx);
    actx.moveTo(fromx, fromy); actx.lineTo(tox, toy); actx.stroke(); actx.beginPath();
    actx.moveTo(tox, toy); actx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    actx.moveTo(tox, toy); actx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6)); actx.stroke();
}

// ОПТИМИЗИРОВАННЫЙ АЛГОРИТМ SCANLINE ЗАЛИВКИ
function floodFillCore(startX, startY, fillColorHex) {
    startX = Math.round(startX); startY = Math.round(startY);
    const w = canvas.width, h = canvas.height;
    if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;
    
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = new Uint32Array(imgData.data.buffer); 
    const startPos = startY * w + startX;
    const startColor = data[startPos];
    
    const r = parseInt(fillColorHex.slice(1,3), 16);
    const g = parseInt(fillColorHex.slice(3,5), 16);
    const b = parseInt(fillColorHex.slice(5,7), 16);
    const fillColor = (255 << 24) | (b << 16) | (g << 8) | r;
    
    if (startColor === fillColor) return;
    
    const stack = new Int32Array(w * h);
    let stackPtr = 0;
    stack[stackPtr++] = startPos;
    
    while (stackPtr > 0) {
        let pos = stack[--stackPtr];
        let y = Math.floor(pos / w);
        let x = pos % w;
        
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
    ctx.putImageData(imgData, 0, 0);
}

function redrawFromStrokesSync(strokes, targetCtx, targetCanvas, isDark) {
    targetCtx.globalAlpha = 1; targetCtx.filter = 'none'; targetCtx.shadowBlur = 0; targetCtx.globalCompositeOperation = 'source-over';
    targetCtx.fillStyle = isDark ? '#000000' : '#ffffff'; targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    for (let stroke of strokes) {
        targetCtx.globalAlpha = stroke.o !== undefined ? stroke.o : 1;
        targetCtx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
        
        if (stroke.type === 'stamp' && lassoStampsCache[stroke.ref]) { targetCtx.drawImage(lassoStampsCache[stroke.ref], stroke.p[0] - stroke.s/2, stroke.p[1] - stroke.s/2, stroke.s, stroke.s); continue; }
        if (stroke.type === 'clear') { targetCtx.globalAlpha = 1; targetCtx.globalCompositeOperation = 'source-over'; targetCtx.fillStyle = isDark ? '#000000' : '#ffffff'; targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height); }
        else if (stroke.type === 'rect') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.strokeRect(stroke.p[0], stroke.p[1], stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); if(stroke.sym) targetCtx.strokeRect(targetCanvas.width - stroke.p[0], stroke.p[1], -(stroke.p[2]-stroke.p[0]), stroke.p[3]-stroke.p[1]); }
        else if (stroke.type === 'circle') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; let r = Math.hypot(stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); targetCtx.arc(stroke.p[0], stroke.p[1], r, 0, Math.PI*2); targetCtx.stroke(); if(stroke.sym) { targetCtx.beginPath(); targetCtx.arc(targetCanvas.width - stroke.p[0], stroke.p[1], r, 0, Math.PI*2); targetCtx.stroke(); } }
        else if (stroke.type === 'line') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.moveTo(stroke.p[0], stroke.p[1]); targetCtx.lineTo(stroke.p[2], stroke.p[3]); targetCtx.stroke(); if(stroke.sym) { targetCtx.beginPath(); targetCtx.moveTo(targetCanvas.width - stroke.p[0], stroke.p[1]); targetCtx.lineTo(targetCanvas.width - stroke.p[2], stroke.p[3]); targetCtx.stroke(); } }
        else if (stroke.type === 'arrow') { targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; drawArrow(targetCtx, stroke.p[0], stroke.p[1], stroke.p[2], stroke.p[3]); if(stroke.sym) { targetCtx.beginPath(); drawArrow(targetCtx, targetCanvas.width - stroke.p[0], stroke.p[1], targetCanvas.width - stroke.p[2], stroke.p[3]); } }
        else { let pts = stroke.p; if (!pts || pts.length < 2) continue; targetCtx.beginPath(); targetCtx.lineWidth = stroke.s; targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round'; targetCtx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i+=2) { targetCtx.lineTo(pts[i], pts[i+1]); } targetCtx.stroke(); if (stroke.sym) { targetCtx.beginPath(); targetCtx.moveTo(targetCanvas.width - pts[0], pts[1]); for (let i = 2; i < pts.length; i+=2) { targetCtx.lineTo(targetCanvas.width - pts[i], pts[i+1]); } targetCtx.stroke(); } }
    }
}

// 90 FPS + Аппаратное Ускорение Холста
const canvas = document.getElementById('drawing-board');
const zoomContainer = document.getElementById('zoom-container');
const ctx = canvas.getContext('2d', { desynchronized: true, willReadFrequently: false });
let isDrawing = false; let currentColor = '#000000'; let isErasing = false; let isFilling = false; let isEyedropper = false; let isBlur = false; let isRect = false; let isCircle = false; let isLine = false; let isArrow = false; let isSymmetry = false; let isNeon = false;
let canvasTransform = { x: 0, y: 0, scale: 1 }; let initialDistance = 0; let lastZoomCenter = { x: 0, y: 0 }; let preZoomState = null; 
let shapeStartX = 0, shapeStartY = 0; let shapeImgData = null; let isDrawingShape = false; let lastX = 0, lastY = 0;
let recordedStrokes = []; let strokesHistory = []; let currentStroke = null; let drawHistory = []; let historyIndex = -1;

function initHistory() { drawHistory = []; strokesHistory = []; recordedStrokes = []; historyIndex = -1; saveState(); }
function saveState() { if (globalState.settings?.mode === 'hardcore' || globalState.settings?.mode === 'amnesia') return; if (historyIndex < drawHistory.length - 1) { drawHistory.length = historyIndex + 1; strokesHistory.length = historyIndex + 1; } drawHistory.push(canvas.toDataURL()); strokesHistory.push(JSON.parse(JSON.stringify(recordedStrokes))); historyIndex++; }
function restoreState(index) { 
    let img = new Image(); img.src = drawHistory[index]; 
    img.onload = () => { 
        ctx.globalAlpha=1; ctx.filter='none'; ctx.shadowBlur=0; ctx.globalCompositeOperation = 'source-over'; 
        const mode = globalState.settings?.mode;
        if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
        } else {
            ctx.fillStyle = (mode === 'darkmode') ? '#000000' : '#ffffff'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height); 
        }
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
function toggleSymmetry(element) { isSymmetry = !isSymmetry; element.classList.toggle('active-swatch', isSymmetry); }
function toggleNeon(element) { isNeon = !isNeon; element.classList.toggle('active-swatch', isNeon); }
function toggleBlur(element) { isBlur = !isBlur; element.classList.toggle('active-swatch', isBlur); }

function clearCanvas() { 
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over'; 
    const mode = globalState.settings?.mode;
    const isDark = mode === 'darkmode'; 
    
    if ((mode === 'finishit' || mode === 'tagteam') && currentLocalRound > 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = isDark ? '#000000' : '#ffffff'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const cw = document.getElementById('canvas-wrapper'); 
        if(cw) cw.style.backgroundColor = isDark ? '#000000' : '#ffffff'; 
    }
    
    if(isErasing) ctx.globalCompositeOperation = 'destination-out'; 
    recordedStrokes.push({ type: 'clear' }); saveState(); 
}

function resetCanvasTransform() { canvasTransform = { x: 0, y: 0, scale: 1 }; updateTransform(); }
function updateTransform() { if (!zoomContainer) return; if (canvasTransform.scale <= 1) { canvasTransform.scale = 1; canvasTransform.x = 0; canvasTransform.y = 0; } zoomContainer.style.transformOrigin = `0 0`; zoomContainer.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`; }
function getCoordinates(e) { const rect = canvas.getBoundingClientRect(); return { x: ((e.clientX - rect.left) / rect.width) * canvas.width, y: ((e.clientY - rect.top) / rect.height) * canvas.height }; }

function startPosition(e) { 
    if (e.pointerType === 'touch' && !e.isPrimary) return; 
    let pos = getCoordinates(e); const mode = globalState.settings?.mode;
    
    if(e.pointerId) canvas.setPointerCapture(e.pointerId);

    if (mode === 'lasso' && currentLocalRound > 2) {
        if (!activeLassoStampRef) return alert("Выберите фрагмент сверху!");
        let size = document.getElementById('brush-size').value * 10;
        let opacity = parseFloat(document.getElementById('brush-opacity').value);
        let img = lassoStampsCache[activeLassoStampRef];
        if (img) {
            ctx.globalAlpha = opacity; ctx.drawImage(img, pos.x - size/2, pos.y - size/2, size, size);
            recordedStrokes.push({ type: 'stamp', ref: activeLassoStampRef, s: size, o: opacity, p: [pos.x, pos.y] }); saveState();
        }
        isDrawing = false; return;
    }

    if (mode === 'coop') { const players = globalState.players || []; const isLeft = players.indexOf(myUserId) % 2 === 0; if (isLeft && pos.x > 400) return; if (!isLeft && pos.x < 400) return; }
    if (mode === 'nohands') return; 
    if (mode === 'timebomb') timeMultiplier *= 1.2;
    if (mode === 'inkmeter' && currentInk <= 0) return;
    if (mode === 'oneline' && hasDrawnStrokeOneline) return;
    
    if (isEyedropper) { const p = ctx.getImageData(pos.x, pos.y, 1, 1).data; const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6); setColor(hex); setBrush(document.querySelector('.brush-tool')); return; }
    if (isFilling) { floodFillCore(pos.x, pos.y, currentColor); recordedStrokes.push({ type: 'fill', c: currentColor, p: [Math.round(pos.x), Math.round(pos.y)] }); saveState(); return; }
    if (mode === 'chaos') { currentColor = getRandomHex(); const bs = document.getElementById('brush-size'); if(bs) bs.value = Math.floor(Math.random() * 35) + 5; }
    if (mode === 'pixelart') { pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15; }
    if (mode === 'drunk') { pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40; }
    if (mode === 'connectdots' || mode === 'constellation') { let closest = null; let minDist = Infinity; dotsArray.forEach(d => { let dist = Math.hypot(d.x - pos.x, d.y - pos.y); if (dist < 40 && dist < minDist) { minDist = dist; closest = d; } }); if (closest) pos = {x: closest.x, y: closest.y}; else return;  }
    
    let opacity = 1;
    const bo = document.getElementById('brush-opacity');
    if (bo) opacity = parseFloat(bo.value);
    
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
  if (!isDrawing && !isDrawingShape) return; 
  if (e.pointerType === 'touch') e.preventDefault(); 
  let pos = getCoordinates(e); const mode = globalState.settings?.mode;
  if (mode === 'coop') { const players = globalState.players || []; const isLeft = players.indexOf(myUserId) % 2 === 0; if (isLeft && pos.x > 400) pos.x = 400; if (!isLeft && pos.x < 400) pos.x = 400; }
  if (mode === 'pixelart') { pos.x = Math.floor(pos.x / 15) * 15; pos.y = Math.floor(pos.y / 15) * 15; }
  if (mode === 'drunk') { pos.x += (Math.random() - 0.5) * 40; pos.y += (Math.random() - 0.5) * 40; }
  if (mode === 'connectdots' || mode === 'constellation') { let closest = null; let minDist = Infinity; dotsArray.forEach(d => { let dist = Math.hypot(d.x - pos.x, d.y - pos.y); if (dist < 40 && dist < minDist) { minDist = dist; closest = d; } }); if (closest) pos = {x: closest.x, y: closest.y}; else return; }
  
  let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
  if (mode === 'inkmeter') { let dist = Math.hypot(pos.x - lastX, pos.y - lastY); currentInk -= dist * (bsVal / 5); if (currentInk < 0) currentInk = 0; const im = document.getElementById('ink-meter-bar'); if(im) im.style.width = `${(currentInk/maxInk)*100}%`; if (currentInk === 0) return; }
  
  let opacity = 1;
  const bo = document.getElementById('brush-opacity');
  if (bo) opacity = parseFloat(bo.value);

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

// Защита от красной ошибки PointerCapture
function endPosition(e) { 
    if(e && e.pointerId) {
        try { if(canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
    ctx.beginPath(); ctx.filter = 'none'; ctx.shadowBlur = 0;
    let bsVal = document.getElementById('brush-size') ? document.getElementById('brush-size').value : 5;
    let opacity = 1; const bo = document.getElementById('brush-opacity'); if (bo) opacity = parseFloat(bo.value);

    if (isDrawingShape) {
        isDrawingShape = false; let t = isRect ? 'rect' : (isCircle ? 'circle' : (isLine ? 'line' : 'arrow'));
        recordedStrokes.push({ type: t, c: currentColor, s: bsVal, o: opacity, b: isBlur?1:0, sym: isSymmetry?1:0, n: isNeon?1:0, p: [shapeStartX, shapeStartY, lastX, lastY] });
        saveState(); return;
    }
    if (!isDrawing) return; isDrawing = false; 
    if (globalState.settings?.mode === 'oneline') hasDrawnStrokeOneline = true;
    if (currentStroke) { recordedStrokes.push(currentStroke); currentStroke = null; }
    saveState(); 
}

function handlePinchZoom(e) {
    if (isDrawing || isDrawingShape) {
        isDrawing = false; isDrawingShape = false; ctx.beginPath(); ctx.filter = 'none'; ctx.shadowBlur = 0; currentStroke = null;
        if (preZoomState) { let img = new Image(); img.src = preZoomState; img.onload = () => { ctx.globalAlpha=1; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); } }
    }
    const t1 = e.touches[0]; const t2 = e.touches[1]; const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); const cx = (t1.clientX + t2.clientX) / 2; const cy = (t1.clientY + t2.clientY) / 2;
    if (initialDistance === 0) { initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; }
    let newScale = canvasTransform.scale * (currentDist / initialDistance); if (newScale < 1) newScale = 1; if (newScale > 5) newScale = 5;
    const wrapperRect = zoomContainer.parentElement.getBoundingClientRect();
    canvasTransform.x -= (cx - wrapperRect.left - canvasTransform.x) * (newScale / canvasTransform.scale - 1); canvasTransform.y -= (cy - wrapperRect.top - canvasTransform.y) * (newScale / canvasTransform.scale - 1);
    canvasTransform.x += (cx - lastZoomCenter.x); canvasTransform.y += (cy - lastZoomCenter.y);
    canvasTransform.scale = newScale; initialDistance = currentDist; lastZoomCenter = { x: cx, y: cy }; updateTransform();
}
canvas.addEventListener('touchend', (e) => { if (e.touches && e.touches.length < 2) { initialDistance = 0; if (canvasTransform.scale <= 1) resetCanvasTransform(); } endPosition(); });
canvas.addEventListener('pointerdown', startPosition); 
canvas.addEventListener('pointerup', endPosition);
canvas.addEventListener('pointermove', draw, {passive: false}); 
canvas.addEventListener('pointercancel', endPosition);
canvas.addEventListener('pointerout', endPosition);

// ==========================================
// ЧАТ-ПРЕЗЕНТАЦИЯ (Аватарки и Хронология)
// ==========================================
let voices = []; window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };
function speakText(text) {
    if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ru-RU';
    if (voices.length === 0) voices = window.speechSynthesis.getVoices(); const bestVoice = voices.find(v => v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || voices.find(v => v.lang.includes('ru'));
    if (bestVoice) utterance.voice = bestVoice; utterance.pitch = 0.9 + Math.random() * 0.4; window.speechSynthesis.speak(utterance);
}

function startPresentation() { if (!isHost) return; initAudio(); window.parent.postMessage({ type: 'update_state', updates: { presentation: { active: true, bookIndex: 0, round: 1 } }}, '*'); }

let animationFrameId = null;
function playDrawingAnimation(canvasEl, strokes, finalImg, isDarkMode) {
    const actx = canvasEl.getContext('2d');
    actx.globalAlpha = 1; actx.filter = 'none'; actx.shadowBlur = 0; actx.globalCompositeOperation = 'source-over';
    actx.fillStyle = isDarkMode ? '#000000' : '#ffffff'; actx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    let strokeIdx = 0; let pointIdx = 0; let totalPoints = 0;
    for (let s of strokes) { if (s.p) totalPoints += Math.max(1, Math.floor(s.p.length / 2)); else totalPoints += 1; }
    let pointsPerFrame = Math.max(2, Math.ceil(totalPoints / 120)); 
    
    function drawStep() {
        if (strokeIdx >= strokes.length) {
            let im = new Image(); im.src = finalImg; im.onload = () => { actx.globalAlpha=1; actx.filter='none'; actx.shadowBlur=0; actx.globalCompositeOperation = 'source-over'; actx.drawImage(im, 0, 0); }; return; 
        }
        let pointsDrawn = 0;
        while (pointsDrawn < pointsPerFrame && strokeIdx < strokes.length) {
            let stroke = strokes[strokeIdx];
            actx.globalAlpha = stroke.o !== undefined ? stroke.o : 1; actx.globalCompositeOperation = stroke.e ? 'destination-out' : 'source-over';
            
            if (stroke.type === 'stamp' && lassoStampsCache[stroke.ref]) { actx.drawImage(lassoStampsCache[stroke.ref], stroke.p[0] - stroke.s/2, stroke.p[1] - stroke.s/2, stroke.s, stroke.s); strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'clear') { actx.globalAlpha = 1; actx.globalCompositeOperation = 'source-over'; actx.fillStyle = isDarkMode ? '#000000' : '#ffffff'; actx.fillRect(0, 0, canvasEl.width, canvasEl.height); strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'fill') { strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'rect') { actx.beginPath(); actx.lineWidth = stroke.s; actx.strokeRect(stroke.p[0], stroke.p[1], stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); if(stroke.sym) actx.strokeRect(canvasEl.width - stroke.p[0], stroke.p[1], -(stroke.p[2]-stroke.p[0]), stroke.p[3]-stroke.p[1]); strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'circle') { actx.beginPath(); actx.lineWidth = stroke.s; let r = Math.hypot(stroke.p[2]-stroke.p[0], stroke.p[3]-stroke.p[1]); actx.arc(stroke.p[0], stroke.p[1], r, 0, Math.PI*2); actx.stroke(); if(stroke.sym) { actx.beginPath(); actx.arc(canvasEl.width - stroke.p[0], stroke.p[1], r, 0, Math.PI*2); actx.stroke(); } strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'line') { actx.beginPath(); actx.lineWidth = stroke.s; actx.moveTo(stroke.p[0], stroke.p[1]); actx.lineTo(stroke.p[2], stroke.p[3]); actx.stroke(); if(stroke.sym) { actx.beginPath(); actx.moveTo(canvasEl.width - stroke.p[0], stroke.p[1]); actx.lineTo(canvasEl.width - stroke.p[2], stroke.p[3]); actx.stroke(); } strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            if (stroke.type === 'arrow') { actx.beginPath(); actx.lineWidth = stroke.s; drawArrow(actx, stroke.p[0], stroke.p[1], stroke.p[2], stroke.p[3]); if(stroke.sym) { actx.beginPath(); drawArrow(actx, canvasEl.width - stroke.p[0], stroke.p[1], canvasEl.width - stroke.p[2], stroke.p[3]); } strokeIdx++; pointIdx = 0; pointsDrawn += 5; continue; }
            
            let pts = stroke.p; if (!pts || pts.length < 2) { strokeIdx++; pointIdx = 0; continue; }
            if (pointIdx === 0) { actx.beginPath(); actx.lineWidth = stroke.s; actx.lineCap = 'round'; actx.lineJoin = 'round'; actx.moveTo(pts[0], pts[1]); pointIdx = 2; }
            if (pointIdx < pts.length) { actx.beginPath(); actx.moveTo(pts[pointIdx-2], pts[pointIdx-1]); actx.lineTo(pts[pointIdx], pts[pointIdx+1]); actx.stroke(); if (stroke.sym) { actx.beginPath(); actx.moveTo(canvasEl.width - pts[pointIdx-2], pts[pointIdx-1]); actx.lineTo(canvasEl.width - pts[pointIdx], pts[pointIdx+1]); actx.stroke(); } pointIdx += 2; pointsDrawn++;
            } else { strokeIdx++; pointIdx = 0; }
        }
        animationFrameId = requestAnimationFrame(drawStep);
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = requestAnimationFrame(drawStep);
}

let renderedPresentationState = '';
function syncPresentationView(players) {
    const pres = globalState.presentation; if (!pres) return;
    const currentStateId = `${pres.bookIndex}-${pres.round}-${globalState.settings?.seed || Math.random()}`; 
    if (renderedPresentationState === currentStateId) return;

    const bookOwnerId = players[pres.bookIndex];
    setText('chat-book-title', `История: ${globalState.playerNames?.[bookOwnerId] || "Аноним"}`);
    
    const avatarsContainer = document.getElementById('presentation-avatars');
    
    if (pres.round === 1) { 
        setHTML('chat-messages', ''); 
        if (avatarsContainer) {
            avatarsContainer.innerHTML = '';
            for (let i = 0; i < calculatedTotalRounds; i++) {
                const stepAuthorId = players[(players.indexOf(bookOwnerId) + i + players.length * 10) % players.length];
                const avatar = globalState.playerAvatars?.[stepAuthorId] || "https://picsum.photos/100";
                
                const wrap = document.createElement('div');
                wrap.className = 'pres-avatar-node';
                
                const img = document.createElement('img');
                img.src = avatar;
                img.className = `pres-avatar-img`;
                img.id = `pres-av-${i + 1}`;
                wrap.appendChild(img);
                avatarsContainer.appendChild(wrap);
                
                if (i < calculatedTotalRounds - 1) {
                    const conn = document.createElement('div');
                    conn.className = `pres-connector`;
                    conn.id = `pres-conn-${i + 1}`;
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
            if (conn) {
                if (i < pres.round) conn.classList.add('active');
                else conn.classList.remove('active');
            }
        }
    }

    let rawData = globalState.submissions?.[`round_${pres.round}`]?.[bookOwnerId];
    let imgUrl = rawData; let strokesData = null;

    let isText = true;
    if (typeof rawData === 'string') {
        if (rawData.startsWith('{')) {
            try { let parsed = JSON.parse(rawData); if (parsed.img) { imgUrl = parsed.img; strokesData = parsed.strokes; isText = false; } } catch(e) {}
        } else if (rawData.length > 1000 && rawData.startsWith('data:image')) {
            isText = false;
        }
    }
    const mode = globalState.settings?.mode;
    if (mode === 'story') isText = true;
    if (isText && (!rawData || rawData.length === 0)) { rawData = "(Слово не сохранилось)"; }

    const authorId = players[(players.indexOf(bookOwnerId) + pres.round - 1 + players.length * 10) % players.length];
    const authorName = globalState.playerNames?.[authorId] || "Аноним";
    const authorAvatar = globalState.playerAvatars?.[authorId] || "https://picsum.photos/100";
    
    const side = isText ? 'left' : 'right';
    let visualContent = '';
    const heartSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#ef4444" fill="#ef4444" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

    if (isText) { 
        visualContent = `<div class="msg-text">${rawData}</div>`; 
    } else {
        let auctionHtml = mode === 'auction' ? `<button class="btn-like" onclick="let v=parseInt(this.innerText); this.innerHTML='${heartSvg} '+(isNaN(v)?1:v+1)">${heartSvg} 0</button>` : '';
        if (mode === 'finishit' || mode === 'tagteam' || mode === 'plagiarism') {
            visualContent = `<div style="position:relative; width:100%;"><img src="${imgUrl}" class="msg-img"><div style="position:absolute; bottom:10px; right:10px;">${auctionHtml}</div></div>`;
        } else {
            visualContent = `<div style="position:relative; width:100%;"><canvas class="msg-canvas" width="800" height="600" id="anim-canvas-${pres.round}-${bookOwnerId}"></canvas><div style="position:absolute; bottom:10px; right:10px;">${auctionHtml}</div></div>`;
        }
    }

    const msgHTML = `<div class="msg-row ${side}"><img src="${authorAvatar}" class="msg-avatar"><div class="msg-bubble"><div class="msg-author">${authorName}</div>${visualContent}</div></div>`;
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) { chatContainer.insertAdjacentHTML('beforeend', msgHTML); setTimeout(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); }, 50); }

    if (isText) { speakText(rawData); } 
    else {
        setTimeout(() => {
            const canvasAnim = document.getElementById(`anim-canvas-${pres.round}-${bookOwnerId}`);
            const isDark = globalState.settings?.mode === 'darkmode';
            if (canvasAnim) {
                if (strokesData && strokesData.length > 0) { 
                    playDrawingAnimation(canvasAnim, strokesData, imgUrl, isDark); 
                } else { 
                    const cctx = canvasAnim.getContext('2d'); 
                    let im = new Image(); im.src = imgUrl; im.onload = () => cctx.drawImage(im, 0, 0); 
                }
            }
        }, 100);
    }

    if (isHost) {
        if (pres.round === calculatedTotalRounds) {
            if (pres.bookIndex === players.length - 1) { setDisplay('next-slide-btn', 'none'); setDisplay('play-again-btn', 'block'); } 
            else { setText('next-slide-btn', "Следующая история"); }
        } else { setText('next-slide-btn', "Показать дальше"); }
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