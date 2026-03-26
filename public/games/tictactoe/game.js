const urlParams = new URLSearchParams(window.location.search);
const playersCount = parseInt(urlParams.get('players')) || 2;
const myName = urlParams.get('name') || 'Аноним';
const isHost = urlParams.get('isHost') === 'true'; 

// Уникальный ID для защиты от двойного выполнения (эха от сервера)
const myId = Math.random().toString(36).substring(2, 9);

let BOARD_SIZE = 4;
let WIN_STREAK = 3;

if (playersCount === 2) { BOARD_SIZE = 4; WIN_STREAK = 3; } 
else if (playersCount >= 3 && playersCount <= 4) { BOARD_SIZE = 6; WIN_STREAK = 4; } 
else if (playersCount >= 5) { BOARD_SIZE = 8; WIN_STREAK = 4; }

document.documentElement.style.setProperty('--board-size', BOARD_SIZE);

let ruleRetries = 0;
function tryApplyRules() {
    if (typeof applyRulesText === 'function') {
        if (document.getElementById('rulesDescription')) {
            applyRulesText(playersCount, BOARD_SIZE, WIN_STREAK);
        } else if (ruleRetries < 50) {
            ruleRetries++;
            setTimeout(tryApplyRules, 50);
        }
    }
}
tryApplyRules();

// Состояния: 'lobby', 'countdown', 'playing', 'ended'
let gameState = 'lobby'; 
let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
let isOnCooldown = false;

const NEON_COLORS = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
const myColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
document.documentElement.style.setProperty('--my-color', myColor);

const boardEl = document.getElementById('board');
const cooldownEl = document.getElementById('cooldown');

// === НОВАЯ СИСТЕМА ОТПРАВКИ СООБЩЕНИЙ ===
function broadcast(action) {
    action.senderId = myId; // Помечаем пакет нашим ID
    window.parent.postMessage({ type: 'game_action', action }, '*');
    
    // Применяем действие у себя моментально, не дожидаясь ответа сервера
    handleGameAction(action); 
}

// Распределитель входящих действий
function handleGameAction(action) {
    if (action.type === 'move') {
      applyMove(action.x, action.y, action.color, action.playerName);
    }
    else if (action.type === 'tick') {
      applyTick(action.count);
    }
    else if (action.type === 'to_lobby') {
      initLobby();
    }
}

function initBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = ''; 
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      cell.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleCellClick(x, y);
      });
      boardEl.appendChild(cell);
    }
  }
}

// === 1. ЛОББИ ===
function initLobby() {
    gameState = 'lobby';
    document.getElementById('lobbyOverlay').classList.add('active');
    document.getElementById('winnerOverlay').classList.remove('active');
    document.getElementById('countdownOverlay').classList.remove('active');
    
    document.getElementById('lobbyMyName').innerText = myName;
    document.getElementById('lobbyCount').innerText = playersCount;

    const startBtn = document.getElementById('startBtn');
    const waitText = document.getElementById('waitHostText');

    if (isHost) {
        startBtn.style.display = 'inline-block';
        waitText.style.display = 'none';
        startBtn.onclick = () => hostStartCountdownTimer();
    } else {
        startBtn.style.display = 'none';
        waitText.style.display = 'block';
    }
}

// === 2. ТАЙМЕР ===
let countdownInterval = null;
function hostStartCountdownTimer() {
    // Защита от спама кнопкой
    if (gameState === 'countdown') return; 
    
    // Очищаем старые интервалы на всякий случай
    if (countdownInterval) clearInterval(countdownInterval);

    let count = 3;
    broadcast({ type: 'tick', count }); // Это теперь запустит таймер и у нас, и у клиентов

    countdownInterval = setInterval(() => {
        count--;
        broadcast({ type: 'tick', count });
        if (count < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function applyTick(count) {
    gameState = 'countdown';
    document.getElementById('lobbyOverlay').classList.remove('active');
    document.getElementById('winnerOverlay').classList.remove('active');
    
    if (count === 3) {
        boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        initBoard();
        isOnCooldown = false;
    }

    const overlay = document.getElementById('countdownOverlay');
    const textEl = document.getElementById('countdownText');
    overlay.classList.add('active');
    
    textEl.classList.remove('pop');
    void textEl.offsetWidth; 
    textEl.classList.add('pop');

    if (count > 0) {
        textEl.innerText = count;
    } else if (count === 0) {
        textEl.innerText = "БОЙ!";
    } else {
        overlay.classList.remove('active');
        gameState = 'playing'; 
    }
}

// === 3. ИГРА ===
function handleCellClick(x, y) {
  if (gameState !== 'playing' || isOnCooldown || boardState[y][x]) return;

  startCooldownBar();
  broadcast({ type: 'move', x, y, color: myColor, playerName: myName });
}

function startCooldownBar() {
  isOnCooldown = true;
  cooldownEl.style.transform = 'scaleX(0)';
  let progress = 0;
  const interval = setInterval(() => {
    progress += 0.1;
    cooldownEl.style.transform = `scaleX(${progress})`;
    if (progress >= 1) {
      clearInterval(interval);
      isOnCooldown = false;
    }
  }, 100);
}

function applyMove(x, y, color, playerName) {
    // Защита от запоздалых пакетов (если кто-то уже победил, ходы не принимаются)
    if (gameState !== 'playing') return; 
    if (boardState[y][x]) return; 

    boardState[y][x] = color;
    
    const index = y * BOARD_SIZE + x;
    const cell = boardEl.children[index];
    
    const token = document.createElement('div');
    token.className = 'token';
    token.style.color = color;
    token.style.backgroundColor = color + '40'; 
    cell.appendChild(token);

    checkWin(x, y, color, playerName);
}

function checkWin(x, y, color, winnerName) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (let [dx, dy] of directions) {
    let count = 1;
    let currX = x + dx, currY = y + dy;
    while (currX >= 0 && currX < BOARD_SIZE && currY >= 0 && currY < BOARD_SIZE && boardState[currY][currX] === color) {
      count++; currX += dx; currY += dy;
    }
    currX = x - dx; currY = y - dy;
    while (currX >= 0 && currX < BOARD_SIZE && currY >= 0 && currY < BOARD_SIZE && boardState[currY][currX] === color) {
      count++; currX -= dx; currY -= dy;
    }

    if (count >= WIN_STREAK) {
      showWinner(color, winnerName);
      return;
    }
  }
}

// === 4. КОНЕЦ ИГРЫ ===
function showWinner(color, winnerName) {
  gameState = 'ended';
  const overlay = document.getElementById('winnerOverlay');
  const text = document.getElementById('winnerText');
  const restartBtn = document.getElementById('restartBtn');
  const toLobbyBtn = document.getElementById('toLobbyBtn');
  
  overlay.classList.add('active');
  text.style.color = color;
  text.innerText = `ПОБЕДИЛ ${winnerName.toUpperCase()}!`;

  if (isHost) {
      restartBtn.innerText = "ЕЩЕ РАЗ";
      restartBtn.disabled = false;
      restartBtn.onclick = () => hostStartCountdownTimer(); 

      toLobbyBtn.innerText = "В ЛОББИ";
      toLobbyBtn.disabled = false;
      toLobbyBtn.onclick = () => broadcast({ type: 'to_lobby' }); 
  } else {
      restartBtn.innerText = "ОЖИДАЕМ ХОСТА...";
      restartBtn.disabled = true;
      restartBtn.onclick = null;

      toLobbyBtn.innerText = "ОЖИДАЕМ ХОСТА...";
      toLobbyBtn.disabled = true;
      toLobbyBtn.onclick = null;
  }
}

function leaveGame() {
  window.parent.postMessage({ type: 'leave_game' }, '*');
}

// === 5. СЕТЕВОЙ СЛУШАТЕЛЬ ===
window.addEventListener('message', (event) => {
  if (event.data?.type === 'game_action') {
    const action = event.data.action;
    
    // Игнорируем свое же сообщение, если сервер вернул нам его обратно (предотвращает дублирование)
    if (action.senderId === myId) return; 

    handleGameAction(action);
  }
});

let isInitialized = false;
function runInit() {
    if (isInitialized) return;
    isInitialized = true;
    initLobby(); 
}
window.addEventListener('DOMContentLoaded', runInit);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runInit();
}