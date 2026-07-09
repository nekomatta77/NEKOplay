// src/lib/ai.ts

// --- АБСОЛЮТНАЯ ЗАЩИТА: Посимвольный извлекатель целых объектов ---
// Игнорирует сломанные массивы, обрезанные концы и лишний текст.
// Вытаскивает только те {} блоки, которые успели полностью сгенерироваться.
function extractValidQuestionsFromText(text: string): any[] {
    const results: any[] = [];
    let startIndex = -1;
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') {
                if (depth === 0) startIndex = i;
                depth++;
            } else if (char === '}') {
                if (depth > 0) {
                    depth--;
                    // Мы нашли закрывающую скобку для главного объекта
                    if (depth === 0 && startIndex !== -1) {
                        const objStr = text.substring(startIndex, i + 1);
                        try {
                            // Очищаем переносы строк внутри значений, которые ломают JSON
                            const cleanStr = objStr.replace(/\n/g, ' ').replace(/\r/g, '').replace(/,\s*}/g, '}');
                            const parsed = JSON.parse(cleanStr);
                            
                            // Если объект распарсился и похож на вопрос - забираем его
                            if (parsed && parsed.question && Array.isArray(parsed.options)) {
                                results.push(parsed);
                            }
                        } catch (e) {
                            // Если конкретно этот блок битый, просто игнорируем его и ищем дальше
                        }
                        startIndex = -1;
                    }
                }
            }
        }
    }
    
    return results;
}

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    const getFallback = () => Array(5).fill(null).map((_, i) => ({
        question: `[Резервный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ сервера"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    // Промпт изменен: просим 5 вопросов и очень короткие факты, чтобы не упираться в лимит токенов сервера
    const systemPrompt = `Ты — генератор викторин. Сгенерируй ровно 5 сложных вопросов на тему: "${theme}".
КРИТЕРИИ:
1. Вопросы на эрудицию.
2. Поле 'fact' должно содержать ОДНО КОРОТКОЕ предложение (максимум 10 слов).
3. Пиши строго в формате JSON. Никаких приветствий и маркдауна.

Пример:
[
  {
    "question": "Вопрос?",
    "options": ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"],
    "correctAnswer": "Ответ 2",
    "fact": "Короткий интересный факт."
  }
]`;

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер v5.0 - Token Limit Bypass)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Выдай массив из 5 вопросов.` }
                ],
                model: 'openai', 
                seed: randomSeed
            })
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        const text = await response.text();
        console.log("Ответ получен. RAW TEXT (первые 150 символов):", text.substring(0, 150).replace(/\n/g, '\\n'));
        
        // Передаем весь текст (даже если он оборван) в наш пуленепробиваемый экстрактор
        let questionsRaw = extractValidQuestionsFromText(text);

        if (questionsRaw.length === 0) {
            console.error("Экстрактор не смог найти ни одного целого вопроса в ответе:", text);
            throw new Error("Не удалось извлечь ни одного вопроса из ответа ИИ");
        }

        console.log(`Успешно спасено целых вопросов из ответа: ${questionsRaw.length}.`);

        // Нормализация данных
        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            // Защита от пустых ответов
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            
            if (!options.includes(correct)) {
                options[Math.floor(Math.random() * 4)] = correct; 
            }

            options = options.map(opt => String(opt));

            // Алгоритм Фишера-Йетса для честной рандомизации
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Сбой расшифровки вопроса №${index + 1}`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Факт утерян."
            };
        });

        return validQuestions; // Возвращаем сколько спасли (даже если их 3 или 4, игра сама дозакажет новые)

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback();
    }
}