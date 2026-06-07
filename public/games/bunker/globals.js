// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ ---
window.urlParams = new URLSearchParams(window.location.search);
var myName = window.urlParams.get('name') || 'Аноним';
var myUserId = window.urlParams.get('userId');
var isHost = window.urlParams.get('isHost') === 'true';

var globalState = {};
var database = {};

// Обновленный порядок карточек с добавленной характеристикой 'secret'
var CARD_ORDER = ['bio', 'health', 'prof', 'hobby', 'phobia', 'fact', 'baggage', 'secret', 'action'];

var SVG_LOCK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4z"/><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/></svg>`;
var SVG_EYE = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
var SVG_CHECK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
var SVG_TARGET = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5.08 4.06 5.6 7.41h-2.6c-.45-1.57-1.84-2.76-3.56-2.91v2.41c1.8.18 3.2 1.58 3.38 3.38h2.4c-.16 1.4-.76 2.68-1.62 3.65z"/></svg>`;

var CAPACITY_MAP = { 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4, 11: 5, 12: 5, 13: 6, 14: 6, 15: 7, 16: 7 };

function getAlivePlayers() { 
    const connectedIds = (globalState.roomPlayers || []).map(p => p.id);
    return (globalState.players || []).filter(id => {
        const isKicked = globalState.playersData?.[id]?.kicked;
        const isConnected = connectedIds.length === 0 || connectedIds.includes(id);
        return !isKicked && isConnected;
    }); 
}

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateBio() { 
    if (!database.bio || database.bio.length === 0) return "Неизвестно";
    const entity = getRandom(database.bio);
    const age = Math.floor(Math.random() * (entity.maxAge - entity.minAge + 1)) + entity.minAge;
    return `${entity.name}, ${age} лет`; 
}

function getRoundRules(round) { 
    const rules = globalState.gameLogic?.rules || { firstVoteRound: 2, doubleRevealRound: 3 }; 
    return { 
        revealsRequired: round >= rules.doubleRevealRound ? 2 : 1, 
        hasVoting: round >= rules.firstVoteRound 
    }; 
}

function addLog(text, type='info') { 
    const updates = {}; 
    const logId = Date.now() + "_" + Math.random().toString(36).substr(2, 5); 
    updates[`logs/${logId}`] = { time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'}), text, type }; 
    window.parent.postMessage({ type: 'update_state', updates }, '*'); 
}

window.isHost = isHost;
window.myUserId = myUserId;
window.myName = myName;
window.globalState = globalState;
window.database = database;

// --- НЕЙРОСЕТЬ С АВТОМАТИЧЕСКИМ ПЕРЕКЛЮЧЕНИЕМ БЕСПЛАТНЫХ МОДЕЛЕЙ ---
const StoryGenerator = {
    async generate(aliveIds, playersData, world, onChunk) {
        if (!world.catastrophe || !world.bunker) return "Данные о мире утеряны...";

        let survivorsInfo = aliveIds.map(id => {
            const p = playersData[id].cards;
            return `ИГРОК: ${globalState.playerNames?.[id]}
            - Биография: ${p.bio?.value || 'Неизвестно'}
            - Профессия: ${p.prof?.value || 'Неизвестно'}
            - Здоровье: ${p.health?.value || 'Неизвестно'}
            - Багаж: ${p.baggage?.value || 'Пусто'}
            - Фобия: ${p.phobia?.value || 'Нет'}
            - Хобби: ${p.hobby?.value || 'Нет'}
            - Секрет: ${p.secret?.value || 'Нет'}
            - Факт: ${p.fact?.value || 'Нет'}`;
        }).join("\n\n");

        const prompt = `Ты — суровый ИИ-рассказчик, пишущий детализированные, мрачные концовки для игры "Бункер".
        САМОЕ ГЛАВНОЕ ПРАВИЛО: ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!

        ДАННЫЕ О МИРЕ:
        Катастрофа: ${world.catastrophe.title} (${world.catastrophe.description}).
        Бункер: ${world.bunker.title} (${world.bunker.description}).
        
        ВЫЖИВШИЕ:
        ${survivorsInfo}
        
        ЗАДАЧА: Напиши логичную, атмосферную концовку на 3-4 абзаца. Хватит ли им ресурсов? Помогут ли профессии? Что будет с тяжелобольными? Раскрой секреты. Пиши в стиле постапокалипсиса.`;

        // СПИСОК БЕСПЛАТНЫХ МОДЕЛЕЙ (от лучших и самых надежных к запасным)
        const freeModels = [
            'google/gemma-2-9b-it:free',
            'mistralai/mistral-7b-instruct:free',
            'qwen/qwen-2-7b-instruct:free',
            'meta-llama/llama-3.2-3b-instruct:free',
            'microsoft/phi-3-mini-128k-instruct:free'
        ];

        let fullText = "";
        let success = false;
        let lastError = "";

        for (const modelSlug of freeModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 секунд на каждую модель

            try {
                console.log(`Пробуем сгенерировать концовку через модель: ${modelSlug}`);
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: modelSlug,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 1500,
                        temperature: 0.8,
                        stream: true
                    })
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    lastError = await response.text();
                    console.warn(`Модель ${modelSlug} недоступна. Ошибка: ${lastError}. Переключаемся на следующую...`);
                    continue; // Модель не сработала, идем к следующей в списке
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(trimmedLine.slice(6));
                                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                    fullText += data.choices[0].delta.content;
                                    if (onChunk) onChunk(fullText);
                                }
                            } catch(e) {}
                        }
                    }
                }
                
                if (fullText && fullText.trim() !== "") {
                    success = true;
                    break; // Успешно сгенерировали, прерываем цикл перебора!
                }

            } catch (e) {
                clearTimeout(timeoutId);
                console.error(`Сбой соединения с ${modelSlug}:`, e);
                lastError = e.message;
            }
        }

        if (!success) {
            return `КРИТИЧЕСКАЯ ОШИБКА: Все 5 бесплатных нейросетей отклонили запрос или недоступны. \nПоследний ответ серверов: ${lastError}\n\nГермодвери заблокированы. Дальнейшая судьба выживших неизвестна...`;
        }
        
        return fullText;
    }
};