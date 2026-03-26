const urlParams = new URLSearchParams(window.location.search);
const playersCount = parseInt(urlParams.get('players')) || 2;
const myName = urlParams.get('name') || 'Аноним';
const isHost = urlParams.get('isHost') === 'true'; 

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

// Функция-помощник для отправки сообщений 
function broadcast(action) {
    window.parent.postMessage({ type: 'game_action', action }, '*');
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
        startBtn.onclick = () => hostStartCountdownTimer(); // Хост запускает отсчет
    } else {
        startBtn.style.display = 'none';
        waitText.style.display = 'block';
    }
}

// === 2. ТАЙМЕР (СИНХРОНИЗАЦИЯ ЧЕРЕЗ ХОСТА) ===
let countdownInterval;
function hostStartCountdownTimer() {
    let count = 3;
    // Хост шлет "тики" всем участникам (включая себя)
    broadcast({ type: 'tick', count });
    countdownInterval = setInterval(() => {
        count--;
        broadcast({ type: 'tick', count });
        if (count < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

// Применяется, когда приходит сообщение 'tick'
function applyTick(count) {
    gameState = 'countdown';
    document.getElementById('lobbyOverlay').classList.remove('active');
    document.getElementById('winnerOverlay').classList.remove('active');
    
    // Сброс доски на первом тике
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
        gameState = 'playing'; // Игра началась!
    }
}

// === 3. ИГРА И ФИКС РАССИНХРОНИЗАЦИИ ===
function handleCellClick(x, y) {
  // Блокируем клик, если не этап 'playing', идет откат, или клетка занята у нас
  if (gameState !== 'playing' || isOnCooldown || boardState[y][x]) return;

  // ИЗМЕНЕНИЕ: Мы больше не ставим токен сразу! (Убрано placeToken)
  // Мы просто запускаем локальный кулдаун-бар от спама...
  startCooldownBar();

  // ...и отправляем сообщение о ходе всем.
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

// Эта функция сработает ТОЛЬКО когда мы получим действие от родителя
function applyMove(x, y, color, playerName) {
    // ВАЖНО: Если двое нажали почти одновременно, первый ход закрасит клетку. 
    // Когда придет второй запрос, проверка ниже отменит его:
    if (boardState[y][x]) return; 

    boardState[y][x] = color;
    
    const index = y * BOARD_SIZE + x;
    const cell = boardEl.children[index];
    
    const token = document.createElement('div');
    token.className = 'token';
    token.style.color = color;
    token.style.backgroundColor = color + '40'; 
    cell.appendChild(token);

    // Проверяем победу
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

// === 4. МЕНЮ ОКОНЧАНИЯ ===
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
      restartBtn.onclick = () => hostStartCountdownTimer(); // Хост запускает рестарт напрямую

      toLobbyBtn.innerText = "В ЛОББИ";
      toLobbyBtn.disabled = false;
      toLobbyBtn.onclick = () => broadcast({ type: 'to_lobby' }); // Хост отправляет всех в лобби
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

// === 5. ОБРАБОТЧИК СООБЩЕНИЙ ===
window.addEventListener('message', (event) => {
  if (event.data?.type === 'game_action') {
    const action = event.data.action;
    
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
});

let isInitialized = false;
function runInit() {
    if (isInitialized) return;
    isInitialized = true;
    initLobby(); // Начинаем теперь всегда с лобби
}
window.addEventListener('DOMContentLoaded', runInit);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    runInit();
}