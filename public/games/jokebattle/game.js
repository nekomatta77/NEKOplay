const ALL_PROMPTS = [
  "Худшее, что можно сказать на первом свидании: ...",
  "Причина, по которой тебя выгнали из библиотеки: ...",
  "Секретный ингредиент крабсбургера — это ...",
  "Что инопланетяне подумают о людях в первую очередь?",
  "Название худшего фильма: ...",
  "Ты открываешь холодильник, а там...",
  "Самый бесполезный супергерой — это Человек-..."
];

// Получаем данные от GameView.tsx из URL
const urlParams = new URLSearchParams(window.location.search);
const USER_ID = urlParams.get('userId');
const IS_HOST = urlParams.get('isHost') === 'true';
const PLAYERS_COUNT = parseInt(urlParams.get('players')) || 3;

let gameState = { phase: 'lobby' };
let localTimer = null;

// Функция-мост для записи данных в Firebase через GameView
function sendUpdate(updates) {
  window.parent.postMessage({ type: 'update_state', updates }, '*');
}

// Слушаем приходящие данные из Firebase
window.addEventListener('message', (event) => {
  if (event.data?.type === 'sync_state') {
    gameState = event.data.state;
    render();
  }
});

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// Рендер экранов
function render() {
  if (!gameState.phase || gameState.phase === 'lobby') {
    showScreen('screen-lobby');
    
    // Показываем количество игроков в лобби
    document.getElementById('players-list').innerHTML = `<h3 style="color: #8d99ae;">Игроков в комнате: <span style="color: #ef233c;">${PLAYERS_COUNT}</span></h3>`;

    if (IS_HOST) {
      document.getElementById('btn-start').classList.remove('hidden');
    } else {
      document.getElementById('host-wait-msg').classList.remove('hidden');
    }
  } 
  else if (gameState.phase === 'answering') {
    showScreen('screen-answering');
    renderAnsweringPhase();
  }
  else if (gameState.phase === 'voting') {
    showScreen('screen-voting');
    renderVotingPhase();
  }
  else if (gameState.phase === 'results') {
    showScreen('screen-results');
    renderResultsPhase();
  }
  else if (gameState.phase === 'end') {
    showScreen('screen-end');
    renderEndPhase();
  }
}

// === ЛОГИКА ===

// 1. ХОСТ: Старт
document.getElementById('btn-start').addEventListener('click', () => {
  const shuffled = [...ALL_PROMPTS].sort(() => 0.5 - Math.random());
  const promptsCount = Math.max(PLAYERS_COUNT, 3); 
  const selectedPrompts = shuffled.slice(0, promptsCount);
  
  window.parent.postMessage({ type: 'start_game', settings: { mode: 'jokebattle' } }, '*');

  setTimeout(() => {
    sendUpdate({
      phase: 'answering',
      prompts: selectedPrompts,
      answers: {}, 
      votes: {},
      scores: {},
      currentPromptIndex: 0,
      phaseEndTime: Date.now() + 60000 // 60 секунд на ответы
    });
  }, 500);
});

// 2. ВСЕ: Ввод ответов
function renderAnsweringPhase() {
  startLocalTimer('answering-time', 60);

  const container = document.getElementById('prompts-container');
  
  // Если мы уже ответили
  if (gameState.answers && gameState.answers[USER_ID]) {
    container.innerHTML = '';
    document.getElementById('btn-submit-answers').classList.add('hidden');
    document.getElementById('waiting-others-msg').classList.remove('hidden');
    
    // Хост проверяет: если все ответили досрочно — переключаем фазу
    if (IS_HOST) {
        const answersCount = Object.keys(gameState.answers).length;
        // Защита от ошибок: берем длину массива игроков из базы или из URL
        const totalPlayers = gameState.players ? gameState.players.length : PLAYERS_COUNT;
        
        if (answersCount >= totalPlayers) {
            sendUpdate({ phase: 'voting', currentPromptIndex: 0, votes: {}, phaseEndTime: Date.now() + 15000 });
        }
    }
    return;
  }

  // Отрисовка карточек с вопросами
  if (container.innerHTML === '') {
    document.getElementById('btn-submit-answers').classList.remove('hidden');
    document.getElementById('waiting-others-msg').classList.add('hidden');
    gameState.prompts.forEach((prompt, index) => {
      container.innerHTML += `
        <div class="prompt-card">
          <p>${prompt}</p>
          <input type="text" id="answer-${index}" placeholder="Твой ответ..." autocomplete="off">
        </div>
      `;
    });
  }

  // Хост следит за таймером
  if (IS_HOST && Date.now() > gameState.phaseEndTime) {
     sendUpdate({ phase: 'voting', currentPromptIndex: 0, votes: {}, phaseEndTime: Date.now() + 15000 });
  }
}

document.getElementById('btn-submit-answers').addEventListener('click', () => {
  const myAnswers = {};
  gameState.prompts.forEach((prompt, index) => {
    const val = document.getElementById(`answer-${index}`).value || "Нет ответа";
    myAnswers[prompt] = val;
  });

  const updates = {};
  updates[`answers/${USER_ID}`] = myAnswers;
  sendUpdate(updates); 
});

// 3. ВСЕ: Голосование
function renderVotingPhase() {
  startLocalTimer('voting-time', 15);
  
  const currentPrompt = gameState.prompts[gameState.currentPromptIndex];
  document.getElementById('vote-prompt-text').innerText = currentPrompt;

  const answersForPrompt = [];
  for (const [playerId, playerAnswers] of Object.entries(gameState.answers || {})) {
    if (playerAnswers[currentPrompt]) {
      answersForPrompt.push({ id: playerId, text: playerAnswers[currentPrompt] });
    }
  }

  const p1 = answersForPrompt[0];
  const p2 = answersForPrompt[1];

  const btn1 = document.getElementById('btn-vote-1');
  const btn2 = document.getElementById('btn-vote-2');

  if (p1) { btn1.innerText = p1.text; btn1.onclick = () => castVote(currentPrompt, p1.id); }
  if (p2) { btn2.innerText = p2.text; btn2.onclick = () => castVote(currentPrompt, p2.id); }

  // Авторы ответов не голосуют
  if (USER_ID === p1?.id || USER_ID === p2?.id) {
    btn1.disabled = true;
    btn2.disabled = true;
  } else {
    btn1.disabled = false;
    btn2.disabled = false;
  }

  // Хост переключает на результаты по таймеру
  if (IS_HOST && Date.now() > gameState.phaseEndTime) {
    sendUpdate({ phase: 'results', phaseEndTime: Date.now() + 5000 });
  }
}

function castVote(promptText, targetPlayerId) {
  document.getElementById('btn-vote-1').disabled = true;
  document.getElementById('btn-vote-2').disabled = true;
  const updates = {};
  updates[`votes/${promptText}/${USER_ID}`] = targetPlayerId;
  sendUpdate(updates);
}

// 4. ВСЕ: Результаты раунда
function renderResultsPhase() {
  clearInterval(localTimer);
  const currentPrompt = gameState.prompts[gameState.currentPromptIndex];
  const promptVotes = gameState.votes ? gameState.votes[currentPrompt] || {} : {};
  
  let resultHTML = `<h3>${currentPrompt}</h3>`;
  const voteCounts = {};
  Object.values(promptVotes).forEach(votedForId => {
    voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
  });

  if (Object.keys(voteCounts).length === 0) resultHTML += `<p>Никто не проголосовал!</p>`;

  for (const [playerId, count] of Object.entries(voteCounts)) {
    const playerName = gameState.playerNames ? gameState.playerNames[playerId] : "Игрок";
    resultHTML += `<p>${playerName}: <b>${count} голосов</b></p>`;
    
    // Хост начисляет очки один раз за раунд
    if (IS_HOST && !window.scoresCalculated) {
        const currentScore = gameState.scores[playerId] || 0;
        sendUpdate({ [`scores/${playerId}`]: currentScore + (count * 100) });
    }
  }
  
  if (IS_HOST) window.scoresCalculated = true; // Защита от двойного начисления
  document.getElementById('results-container').innerHTML = resultHTML;

  // Хост переключает на следующий раунд
  if (IS_HOST && Date.now() > gameState.phaseEndTime) {
    window.scoresCalculated = false; // Сброс для следующего раунда
    const nextIndex = gameState.currentPromptIndex + 1;
    if (nextIndex < gameState.prompts.length) {
      sendUpdate({ phase: 'voting', currentPromptIndex: nextIndex, phaseEndTime: Date.now() + 15000 });
    } else {
      sendUpdate({ phase: 'end' });
    }
  }
}

// 5. ВСЕ: Конец игры
function renderEndPhase() {
  clearInterval(localTimer);
  if (IS_HOST) document.getElementById('btn-play-again').classList.remove('hidden');
  
  let podiumHTML = "";
  const sortedScores = Object.entries(gameState.scores || {}).sort((a, b) => b[1] - a[1]);
  
  if (sortedScores.length > 0) {
    sortedScores.forEach(([id, score], index) => {
      const name = gameState.playerNames ? gameState.playerNames[id] : "Игрок";
      podiumHTML += `<h2>${index + 1} место: ${name} (${score} очков)</h2>`;
    });
  } else {
    podiumHTML = "<p>Никто не заработал очков.</p>";
  }

  document.getElementById('final-podium').innerHTML = podiumHTML;
}

// Утилита для визуального таймера
function startLocalTimer(elementId, maxSeconds) {
  clearInterval(localTimer);
  const el = document.getElementById(elementId);
  localTimer = setInterval(() => {
    if (!gameState.phaseEndTime) return;
    const diff = Math.max(0, Math.ceil((gameState.phaseEndTime - Date.now()) / 1000));
    el.innerText = diff;
    if (diff <= 0) clearInterval(localTimer);
  }, 100);
}

// Перезапуск игры
document.getElementById('btn-play-again').addEventListener('click', () => {
  window.parent.postMessage({ type: 'play_again' }, '*');
});

// === ВАЖНОЕ ИСПРАВЛЕНИЕ ===
// Первичный вызов отрисовки интерфейса при загрузке скрипта
render();