const urlParams = new URLSearchParams(window.location.search);
const playersCount = parseInt(urlParams.get('players')) || 2;
const myName = urlParams.get('name') || 'Аноним';

let BOARD_SIZE = 4;
let WIN_STREAK = 3;

if (playersCount === 2) { BOARD_SIZE = 4; WIN_STREAK = 3; } 
else if (playersCount >= 3 && playersCount <= 4) { BOARD_SIZE = 6; WIN_STREAK = 4; } 
else if (playersCount >= 5) { BOARD_SIZE = 8; WIN_STREAK = 4; }

document.documentElement.style.setProperty('--board-size', BOARD_SIZE);

if (typeof applyRulesText === 'function') {
  applyRulesText(playersCount, BOARD_SIZE, WIN_STREAK);
}

// СОСТОЯНИЯ ИГРЫ
let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
let isOnCooldown = false;
let isGameOver = false;
let isStarting = true; // Флаг: игра еще не началась!

const NEON_COLORS = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
const myColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
document.documentElement.style.setProperty('--my-color', myColor);

const boardEl = document.getElementById('board');
const cooldownEl = document.getElementById('cooldown');

function initBoard() {
  boardEl.innerHTML = ''; // Очищаем перед созданием (полезно для рестарта)
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

// ОТСЧЕТ ПЕРЕД БОЕМ (Фикс рассинхрона)
function startCountdown() {
  isStarting = true;
  isGameOver = false;
  isOnCooldown = false;
  
  const overlay = document.getElementById('countdownOverlay');
  const textEl = document.getElementById('countdownText');
  overlay.classList.add('active');
  
  let count = 3;
  textEl.innerText = count;
  textEl.classList.add('pop');

  const timer = setInterval(() => {
    count--;
    // Перезапускаем анимацию
    textEl.classList.remove('pop');
    void textEl.offsetWidth; 
    textEl.classList.add('pop');

    if (count > 0) {
      textEl.innerText = count;
    } else if (count === 0) {
      textEl.innerText = "БОЙ!";
    } else {
      clearInterval(timer);
      overlay.classList.remove('active');
      isStarting = false; // Разрешаем кликать!
    }
  }, 1000);
}

function handleCellClick(x, y) {
  // Блокируем клики, если идет отсчет, игра окончена или клетка занята
  if (isStarting || isGameOver || isOnCooldown || boardState[y][x]) return;

  startCooldownBar();

  window.parent.postMessage({
    type: 'game_action',
    action: { type: 'move', x, y, color: myColor, playerName: myName }
  }, '*');

  placeToken(x, y, myColor);
  checkWin(x, y, myColor, myName);
}

function leaveGame() {
  window.parent.postMessage({ type: 'leave_game' }, '*');
}

// РЕСТАРТ: Игрок нажал "Играть еще раз"
function requestRestart() {
  // 1. Отправляем сигнал всем остальным
  window.parent.postMessage({
    type: 'game_action',
    action: { type: 'restart' }
  }, '*');
  // 2. Перезапускаем у себя
  doRestart();
}

// РЕСТАРТ: Выполняем очистку поля
function doRestart() {
  boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  document.getElementById('winnerOverlay').classList.remove('active');
  initBoard(); // Перерисовываем чистое поле
  startCountdown(); // Запускаем эпичный отсчет заново!
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

function placeToken(x, y, color) {
  if (boardState[y][x]) return; 
  boardState[y][x] = color;
  
  const index = y * BOARD_SIZE + x;
  const cell = boardEl.children[index];
  
  const token = document.createElement('div');
  token.className = 'token';
  token.style.color = color;
  token.style.backgroundColor = color + '40'; 
  cell.appendChild(token);
}

// Слушаем Firebase (Мост React)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'game_action') {
    const action = event.data.action;
    
    // Если прилетел ход
    if (action.type === 'move') {
      placeToken(action.x, action.y, action.color);
      checkWin(action.x, action.y, action.color, action.playerName);
    }
    // Если кто-то нажал РЕСТАРТ
    else if (action.type === 'restart') {
      doRestart();
    }
  }
});

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

function showWinner(color, winnerName) {
  isGameOver = true;
  const overlay = document.getElementById('winnerOverlay');
  const text = document.getElementById('winnerText');
  
  overlay.classList.add('active');
  text.style.color = color;
  text.innerText = `ПОБЕДИЛ ${winnerName.toUpperCase()}!`;
}

// ЗАПУСК ИГРЫ
initBoard();
startCountdown(); // Запускаем отсчет при входе!