const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';

let gameState = null;
let roomPlayers = []; 
const contentDiv = document.getElementById('app-content');
const tickerDiv = document.getElementById('ticker-text');

// 1. СЛУШАЕМ ОБНОВЛЕНИЯ ОТ FIREBASE
window.addEventListener('message', (event) => {
    if (event.data?.type === 'sync_state') {
        gameState = event.data.state || {}; 
        roomPlayers = event.data.roomPlayers || []; 
        render();
    }
    
    if (event.data?.type === 'game_action' && isHost && gameState) {
        handleHostAction(event.data.action);
    }
});

function updateGameState(updates) {
    window.parent.postMessage({ type: 'update_state', updates }, '*');
}

function sendAction(action) {
    window.parent.postMessage({ type: 'game_action', action }, '*');
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// ---------------- ЛОГИКА ХОСТА (ТОЛЬКО НЕЙРОСЕТЬ) ----------------

async function startGame() {
    if (roomPlayers.length === 0) return; 
    
    updateGameState({ status: 'playing', phase: 'loading' });

    const shuffledPlayers = shuffle([...roomPlayers]);
    const groups = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        if (i + 1 >= shuffledPlayers.length && groups.length > 0) {
            groups[groups.length - 1].push(shuffledPlayers[i].id);
        } else {
            groups.push([shuffledPlayers[i].id, shuffledPlayers[i+1]?.id].filter(Boolean));
        }
    }

    // Усиленный промпт, чтобы ИИ не ломал JSON
    const promptText = `Сгенерируй ${groups.length} реальных, но абсолютно безумных и смешных новостных фактов/заголовков. 
    Ты ДОЛЖЕН вернуть ТОЛЬКО сырой массив JSON, без markdown, без кавычек \`\`\`, строго в таком формате:
    [{"realNews": "настоящий заголовок", "imagePrompt": "описание для картинки на английском (максимум 5 слов)"}]`;

    try {
        // ЕСЛИ ИСПОЛЬЗУЕШЬ "ПУТЬ Б", ЗАМЕНИ '/api/generate' НА СВОЙ ПОЛНЫЙ ДОМЕН (например, 'https://tvoy-sayt.vercel.app/api/generate')
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                model: 'google/gemini-pro', 
                messages: [{ role: 'user', content: promptText }] 
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const text = await response.text();
        // Ищем JSON в ответе
        const jsonMatch = text.match(/\[.*\]/s); 
        
        if (!jsonMatch) {
            throw new Error("Нейросеть вернула неверный формат (не JSON)");
        }

        const newsData = JSON.parse(jsonMatch[0]);

        // Формируем раунды
        const rounds = groups.map((group, index) => {
            const item = newsData[index];
            if (!item) throw new Error("Нейросеть сгенерировала недостаточно новостей");

            // Кодируем промпт для URL, чтобы картинка точно загрузилась
            const safePrompt = encodeURIComponent(item.imagePrompt);
            return {
                players: group,
                realNews: item.realNews,
                // Добавляем width/height чтобы картинка генерировалась быстрее и стабильнее
                imageUrl: `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=600&nologo=true`,
                submissions: {}, 
                votes: {},
                options: []
            };
        });

        updateGameState({
            phase: 'writing',
            rounds: rounds,
            currentRoundIndex: 0,
            scores: roomPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
        });

    } catch (e) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА АПИ:", e);
        // Выводим ошибку прямо на экран, чтобы ты видел, если API упало
        updateGameState({ 
            phase: 'error', 
            errorMessage: e.message 
        });
    }
}

function handleHostAction(action) {
    if (gameState.phase === 'writing' && action.type === 'SUBMIT_NEWS') {
        const updatedRounds = [...gameState.rounds];
        const rIndex = updatedRounds.findIndex(r => r.players.includes(action.userId));
        updatedRounds[rIndex].submissions[action.userId] = action.text;
        updateGameState({ rounds: updatedRounds });

        const totalSubmissions = updatedRounds.reduce((sum, r) => sum + Object.keys(r.submissions || {}).length, 0);
        if (totalSubmissions === roomPlayers.length) {
            prepareVotingPhase(0, updatedRounds);
        }
    }

    if (gameState.phase === 'voting' && action.type === 'VOTE') {
        const updatedRounds = [...gameState.rounds];
        const round = updatedRounds[gameState.currentRoundIndex];
        round.votes[action.userId] = action.targetId;
        updateGameState({ rounds: updatedRounds });

        const expectedVotes = roomPlayers.length - round.players.length;
        if (Object.keys(round.votes).length >= expectedVotes) {
            calculateScores(gameState.currentRoundIndex, updatedRounds);
        }
    }

    if (gameState.phase === 'round_results' && action.type === 'NEXT_ROUND') {
        const nextIndex = gameState.currentRoundIndex + 1;
        if (nextIndex < gameState.rounds.length) {
            prepareVotingPhase(nextIndex, gameState.rounds);
        } else {
            updateGameState({ phase: 'final_results' });
        }
    }
}

function prepareVotingPhase(roundIndex, rounds) {
    const round = rounds[roundIndex];
    let options = [{ id: 'real', text: round.realNews }];
    Object.entries(round.submissions).forEach(([pId, text]) => {
        options.push({ id: pId, text: text });
    });
    
    rounds[roundIndex].options = shuffle(options);
    updateGameState({ phase: 'voting', currentRoundIndex: roundIndex, rounds: rounds });
}

function calculateScores(roundIndex, rounds) {
    const round = rounds[roundIndex];
    const scores = { ...gameState.scores };

    Object.entries(round.votes).forEach(([voterId, targetId]) => {
        if (targetId === 'real') {
            scores[voterId] += 1000; 
        } else {
            scores[targetId] += 500; 
        }
    });

    updateGameState({ phase: 'round_results', scores: scores, rounds: rounds });
}

// ---------------- UI И ИНТЕРФЕЙС ИГРОКОВ ----------------

function submitNews() {
    const text = document.getElementById('news-input').value;
    if (text.trim().length < 2) return;
    sendAction({ type: 'SUBMIT_NEWS', userId, text });
}

function castVote(targetId) {
    sendAction({ type: 'VOTE', userId, targetId });
}

function render() {
    if (!gameState || !gameState.status || gameState.status === 'waiting') {
        contentDiv.innerHTML = `
            <div class="news-card">
                <h2>Добро пожаловать в студию!</h2>
                <p>Игроков в лобби: ${roomPlayers.length || 0}</p>
                ${isHost ? '<button onclick="startGame()">НАЧАТЬ ЭФИР</button>' : '<p class="info-text">Ждем, пока ведущий начнет игру...</p>'}
            </div>
        `;
        return;
    }

    if (gameState.phase === 'error') {
        contentDiv.innerHTML = `
            <div class="news-card" style="border-color: #e60000;">
                <h2 style="color: #e60000;">СБОЙ В ЭФИРЕ</h2>
                <p>Нейросеть недоступна или вернула ошибку.</p>
                <p style="font-size: 14px; color: #a0aec0; background: #0b0f19; padding: 10px; border-radius: 6px;">${gameState.errorMessage}</p>
                ${isHost ? '<button style="margin-top: 15px;" onclick="window.parent.postMessage({ type: \'play_again\' }, \'*\')">ВЕРНУТЬСЯ В ЛОББИ</button>' : ''}
            </div>
        `;
        return;
    }

    if (gameState.phase === 'loading') {
        contentDiv.innerHTML = `
            <div class="news-card">
                <h2>СВЯЗЬ СО СПУТНИКОМ...</h2>
                <p class="info-text">Ищем правдивую информацию в сети.</p>
            </div>
        `;
        return;
    }

    if (gameState.phase === 'writing') {
        const myRound = gameState.rounds.find(r => r.players.includes(userId));
        const hasSubmitted = myRound && myRound.submissions && myRound.submissions[userId];

        if (!myRound) {
            contentDiv.innerHTML = `<div class="news-card"><h3>Ожидайте</h3><p class="info-text">Вы не участвуете в написании этой новости.</p></div>`;
        } else if (hasSubmitted) {
            contentDiv.innerHTML = `<div class="news-card"><h3>Материал принят!</h3><p class="info-text">Ждем остальных журналистов...</p></div>`;
        } else {
            contentDiv.innerHTML = `
                <div class="news-card">
                    <img src="${myRound.imageUrl}" class="news-image" alt="Генерация картинки...">
                    <div class="news-prompt">Что произошло на этом фото? Придумай правдоподобный заголовок!</div>
                    <input type="text" id="news-input" placeholder="Ваш коварный фейк..." autocomplete="off">
                    <button onclick="submitNews()">ОТПРАВИТЬ В РЕДАКЦИЮ</button>
                </div>
            `;
        }
        return;
    }

    if (gameState.phase === 'voting') {
        const round = gameState.rounds[gameState.currentRoundIndex];
        const isAuthor = round.players.includes(userId);
        const hasVoted = round.votes && round.votes[userId];

        let html = `<div class="news-card"><img src="${round.imageUrl}" class="news-image" alt="Картинка новости">`;
        
        if (isAuthor) {
            html += `<h3>Это ваша новость!</h3><p class="info-text">Смотрим, кто попадется на вашу ложь...</p>`;
        } else if (hasVoted) {
            html += `<h3>Голос принят!</h3><p class="info-text">Ждем остальных...</p>`;
        } else {
            html += `<div class="news-prompt">Где здесь НАСТОЯЩАЯ новость?</div>`;
            round.options.forEach(opt => {
                html += `<button class="btn-vote" onclick="castVote('${opt.id}')">${opt.text}</button>`;
            });
        }
        contentDiv.innerHTML = html + `</div>`;
        return;
    }

    if (gameState.phase === 'round_results') {
        const round = gameState.rounds[gameState.currentRoundIndex];
        let html = `<div class="news-card">
            <h3>Итоги новости</h3>
            <p class="info-text" style="color: #4ade80;">Правда: ${round.realNews}</p>
        `;
        
        Object.entries(round.submissions).forEach(([pId, text]) => {
            const authorName = roomPlayers.find(p => p.id === pId)?.name || 'Игрок';
            html += `<div style="margin-bottom: 10px; background: #2a3553; padding: 10px; border-radius: 8px;">
                <div style="font-size: 14px; color: #a0aec0;">Фейк от: ${authorName}</div>
                <div>"${text}"</div>
            </div>`;
        });

        if (isHost) {
            html += `<button style="margin-top: 15px;" onclick="sendAction({type: 'NEXT_ROUND'})">СЛЕДУЮЩАЯ НОВОСТЬ</button>`;
        } else {
            html += `<p class="info-text">Ждем ведущего...</p>`;
        }
        contentDiv.innerHTML = html + `</div>`;
        return;
    }

    if (gameState.phase === 'final_results') {
        const sortedPlayers = [...roomPlayers].sort((a, b) => gameState.scores[b.id] - gameState.scores[a.id]);
        
        const trophySvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`;
        
        let html = `<div class="news-card"><h2 style="display:flex; align-items:center; justify-content:center;">${trophySvg} ФИНАЛЬНЫЙ РЕЙТИНГ</h2><div style="margin-top: 20px;">`;
        sortedPlayers.forEach((p, i) => {
            const score = gameState.scores[p.id] || 0;
            html += `<div class="score-item ${i === 0 ? 'winner' : ''}">
                <span>${i + 1}. ${p.name}</span>
                <span>${score} очков</span>
            </div>`;
        });
        html += `</div>`;

        if (isHost) {
            html += `<button style="margin-top: 20px;" onclick="window.parent.postMessage({ type: 'play_again' }, '*')">ИГРАТЬ ЕЩЕ РАЗ</button>`;
        }
        contentDiv.innerHTML = html + `</div>`;
    }
}