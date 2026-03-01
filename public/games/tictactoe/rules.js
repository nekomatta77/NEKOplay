// Описание игры
const GAME_DESCRIPTION = `Добро пожаловать в неоновую битву! Твоя цель — собрать свои цвета в один ряд (по горизонтали, вертикали или диагонали). 
Здесь нет ходов по очереди! Все ходят одновременно, но после каждого клика маркер перезаряжается 1 секунду.`;

// Функция генерации списка правил под конкретную комнату
function applyRulesText(playersCount, boardSize, winStreak) {
    document.getElementById('rulesDescription').innerText = GAME_DESCRIPTION;
    document.getElementById('dynamicRules').innerHTML = `
      <li>Игроков в матче: <b>${playersCount}</b></li>
      <li>Размер поля: <b>${boardSize}x${boardSize}</b></li>
      <li>Для победы нужно фигур в ряд: <b style="color: var(--my-color)">${winStreak}</b></li>
    `;
}

// Управление окном
function toggleHelp() {
    const overlay = document.getElementById('helpOverlay');
    overlay.classList.toggle('active');
}