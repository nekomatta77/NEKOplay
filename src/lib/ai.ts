// src/lib/ai.ts

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Поиск JSON массивов в сыром тексте ---
// Игнорирует скобки внутри текста и ищет только настоящие структуры массива
function extractArraysFromString(str: string): string[] {
    const results: string[] = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
            if (char === '[') {
                if (depth === 0) start = i;
                depth++;
            } else if (char === ']') {
                if (depth > 0) {
                    depth--;
                    if (depth === 0 && start !== -1) {
                        results.push(str.substring(start, i + 1));
                        start = -1;
                    }
                }
            }
        }
    }
    return results;
}

// --- ГОД-МОД ЭКСТРАКТОР ---
// Рекурсивно погружается в любые данные (объекты, массивы, строки), чтобы найти нужный пул вопросов
function deepExtractQuestions(data: any): any[] | null {
    if (!data) return null;
    
    // 1. Если это массив - проверяем, наш ли он?
    if (Array.isArray(data) && data.length > 0) {
        // Проверяем, есть ли хотя бы один элемент, похожий на вопрос
        const isValid = (item: any) => item && typeof item === 'object' && item.question && item.options;
        if (data.some(isValid)) {
            return data.filter(isValid);
        }
    }
    
    // 2. Если это строка - возможно, внутри спрятан stringified JSON или markdown
    if (typeof data === 'string') {
        let text = data.trim();
        if (text.includes('[') || text.includes('{')) {
            // Сначала чистим маркдаун
            let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            // Пробуем парсить целиком
            try {
                const parsed = JSON.parse(cleanText);
                const res = deepExtractQuestions(parsed);
                if (res) return res;
            } catch(e) {
                // Если целиком не вышло (например, текст до/после JSON), вытаскиваем массивы по скобкам
                let arrays = extractArraysFromString(cleanText);
                // Проверяем их с конца (так как обычно ИИ сначала пишет reasoning, а массив в конце)
                for (let i = arrays.length - 1; i >= 0; i--) {
                    try {
                        // Чистим висячие запятые и переносы строк внутри стрингов
                        let sanitized = arrays[i].replace(/,\s*([\]}])/g, '$1').replace(/\n/g, ' ');
                        const parsed = JSON.parse(sanitized);
                        const res = deepExtractQuestions(parsed);
                        if (res) return res;
                    } catch(err) {}
                }
            }
        }
    }
    
    // 3. Если это объект (например, обертка API: { content: [...] } или { reasoning: "...", result: "{...}" })
    if (typeof data === 'object' && !Array.isArray(data)) {
        for (const key of Object.keys(data)) {
            const res = deepExtractQuestions(data[key]);
            if (res) return res;
        }
    }
    
    return null; // Ничего не нашли в этой ветке
}

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Резервный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ сервера"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    // Максимально жесткий промт для отключения "размышлений" нейросети
    const systemPrompt = `ВЫ — СЕРВЕР ГЕНЕРАЦИИ ДАННЫХ. ВЫ НЕ ИМЕЕТЕ ПРАВА ИСПОЛЬЗОВАТЬ ПОЛЯ REASONING, ТЕКСТОВЫЕ ПРИВЕТСТВИЯ ИЛИ ПОЯСНЕНИЯ.
Ваша единственная цель - выдать чистый JSON-массив из 7 сложных вопросов на тему: "${theme}".

Формат СТРОГО такой:
[
  {
    "question": "Сам вопрос?",
    "options": ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"],
    "correctAnswer": "Ответ 2",
    "fact": "Интересный факт."
  }
]
`;

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер v4.0 - God Mode)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Сгенерируй массив на тему: "${theme}". Только массив, никаких других слов.` }
                ],
                model: 'openai', 
                seed: randomSeed
                // jsonMode убран, так как он заставлял некоторые модели отдавать обертку с reasoning
            })
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        const text = await response.text();
        console.log("Ответ получен. RAW TEXT (первые 150 символов):", text.substring(0, 150).replace(/\n/g, '\\n'));
        
        // Передаем ВЕСЬ ответ в наш God-Mode Extractor
        let questionsRaw = deepExtractQuestions(text);

        if (!questionsRaw || questionsRaw.length === 0) {
            console.error("Извлекатель не смог найти массив вопросов в ответе:", text);
            throw new Error("Массив вопросов не найден в структуре ответа (God-Mode failed)");
        }

        console.log(`Успешно распознано вопросов: ${questionsRaw.length}. Производим нормализацию...`);

        // Нормализация данных и защита от читов
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
                question: q.question || `Вопрос №${index + 1} поврежден при передаче данных?`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Интересный факт утерян."
            };
        });

        // Гарантируем возврат максимум 7 вопросов
        return validQuestions.slice(0, 7);

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback();
    }
}