// =====================================================================
// ВСТАВЬ СВОЙ API КЛЮЧ ОТ OPENROUTER СЮДА (между кавычками)
const OPENAI_API_KEY = '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'; 
// =====================================================================

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ ---
const urlParams = new URLSearchParams(window.location.search);
const myName = urlParams.get('name') || 'Аноним';
const myUserId = urlParams.get('userId');
const isHost = urlParams.get('isHost') === 'true';

let globalState = {};
let database = {};

const CARD_ORDER = ['bio', 'health', 'prof', 'hobby', 'phobia', 'fact', 'baggage', 'action'];

const SVG_LOCK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4z"/><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/></svg>`;
const SVG_EYE = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const SVG_CHECK = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
const SVG_TARGET = `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5.08 4.06 5.6 7.41h-2.6c-.45-1.57-1.84-2.76-3.56-2.91v2.41c1.8.18 3.2 1.58 3.38 3.38h2.4c-.16 1.4-.76 2.68-1.62 3.65z"/></svg>`;

const CAPACITY_MAP = { 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4, 11: 5, 12: 5, 13: 6, 14: 6, 15: 7, 16: 7 };

const SoundEngine = { init() {}, playTone() {}, hover() {}, click() {}, reveal() {}, alarm() {}, glitch() {}, heal() {}, burn() {} };
function setupInteractions() {}

function getAlivePlayers() { return (globalState.players || []).filter(id => !globalState.playersData?.[id]?.kicked); }
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateBio() { 
    if (!database.bio || database.bio.length === 0) return "Неизвестно";
    const entity = getRandom(database.bio);
    const age = Math.floor(Math.random() * (entity.maxAge - entity.minAge + 1)) + entity.minAge;
    return `${entity.name}, ${age} лет`; 
}

// ИЗМЕНЕНО: теперь учитываем настройку firstVoteRound
function getRoundRules(round) { 
    const rules = globalState.gameLogic?.rules || { firstVoteRound: 2, doubleRevealRound: 3 }; 
    return { 
        revealsRequired: round >= rules.doubleRevealRound ? 2 : 1, 
        hasVoting: round >= rules.firstVoteRound 
    }; 
}

function addLog(text, type='info') { const updates = {}; const logId = Date.now() + "_" + Math.random().toString(36).substr(2, 5); updates[`logs/${logId}`] = { time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'}), text, type }; window.parent.postMessage({ type: 'update_state', updates }, '*'); }

// --- НЕЙРОСЕТЬ ---
const StoryGenerator = {
    async generate(aliveIds, playersData, world, onChunk) {
        if (!world.catastrophe || !world.bunker) return "Данные о мире утеряны...";
        if (!OPENAI_API_KEY || OPENAI_API_KEY === '') return "СИСТЕМНОЕ СООБЩЕНИЕ: API ключ нейросети не найден.";

        // ИЗМЕНЕНО: Теперь мы передаем ИИ БИОГРАФИЮ (Сущность и Возраст)!
        let survivorsInfo = aliveIds.map(id => {
            const p = playersData[id].cards;
            return `Игрок: ${globalState.playerNames?.[id]}
            Биография (Раса и Возраст): ${p.bio?.value || 'Неизвестно'}
            Профессия: ${p.prof?.value || 'Неизвестно'} | Здоровье: ${p.health?.value || 'Неизвестно'} 
            Багаж: ${p.baggage?.value || 'Пусто'} | Фобия: ${p.phobia?.value || 'Нет'} 
            Хобби: ${p.hobby?.value || 'Нет'}`;
        }).join("\n\n");

        const prompt = `Ты — ИИ-рассказчик, пишущий мрачные концовки для игры "Бункер".
        САМОЕ ГЛАВНОЕ ПРАВИЛО: ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ! НИКАКОГО АНГЛИЙСКОГО!

        Мир пережил: ${world.catastrophe.title} (${world.catastrophe.description}).
        Они укрылись в: ${world.bunker.title} (${world.bunker.description}).
        
        Выжившие:
        ${survivorsInfo}
        
        Напиши атмосферную концовку на 2-3 абзаца. Обязательно учти их Биографию (если там есть оборотни, вампиры, андроиды или рептилоиды — опиши, как это повлияло на выживание среди людей!). Помогли ли их профессии и вещи? Пиши обычным текстом, без звездочек и жирного шрифта. ПИШИ ТОЛЬКО НА РУССКОМ.`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:5173', 
                    'X-Title': 'Bunker Game' 
                },
                body: JSON.stringify({
                    model: 'arcee-ai/trinity-large-preview:free', 
                    messages: [{ role: 'user', content: prompt }], 
                    max_tokens: 800,
                    temperature: 0.8,
                    stream: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("OpenRouter API Error:", errorData);
                return `ОШИБКА ИИ: ${errorData.error?.message || response.status}`;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                const text = data.choices[0]?.message?.content || "Ошибка: пустой ответ от ИИ.";
                if (onChunk) onChunk(text); 
                return text;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";

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
            return fullText;
        } catch (e) {
            console.error("Fetch Error:", e);
            return "Нет связи с серверами ИИ. Проверьте интернет-соединение.";
        }
    }
};