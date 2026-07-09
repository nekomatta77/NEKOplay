// src/lib/ai.ts

// --- АБСОЛЮТНАЯ ЗАЩИТА v8.0: Рекурсия + Стековый сканер ---
function extractValidQuestionsFromText(text: string): any[] {
    const results: any[] = [];
    
    // УРОВЕНЬ 1: Умный поиск по валидному дереву (Если ИИ обернул массив в { "questions": [...] })
    try {
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        function deepSearch(obj: any) {
            if (!obj) return;
            if (Array.isArray(obj)) {
                obj.forEach(deepSearch);
            } else if (typeof obj === 'object') {
                // Если мы наткнулись на сам объект вопроса
                if (obj.question && Array.isArray(obj.options)) {
                    results.push(obj);
                } else {
                    // Иначе идем глубже по всем ключам
                    Object.values(obj).forEach(deepSearch);
                }
            }
        }
        deepSearch(parsed);
        
        if (results.length > 0) return results;
    } catch (e) {
        // Если штатный парсинг упал (ответ оборван), идем к запасному сканеру
    }

    // УРОВЕНЬ 2: Стековый сканер (Вырезает целые объекты из оборванного мусора на любой глубине)
    let stack: number[] = [];
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') {
                stack.push(i); // Запоминаем старт любого объекта
            } else if (char === '}') {
                if (stack.length > 0) {
                    const startIndex = stack.pop()!;
                    const objStr = text.substring(startIndex, i + 1);
                    try {
                        const cleanStr = objStr.replace(/\n/g, ' ').replace(/\r/g, '').replace(/,\s*}/g, '}');
                        const parsed = JSON.parse(cleanStr);
                        
                        // Проверяем, что достали именно вопрос
                        if (parsed && parsed.question && Array.isArray(parsed.options)) {
                            // Исключаем дубликаты
                            if (!results.some(q => q.question === parsed.question)) {
                                results.push(parsed);
                            }
                        }
                    } catch (e) {
                        // Игнорируем сломанный блок
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
        question: `[Автономный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ сервера"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    const systemPrompt = `Ты - API-сервер. Выдаешь ТОЛЬКО JSON-массив из 5 вопросов на тему: "${theme}".
ЗАПРЕЩЕНО использовать рассуждения, reasoning, thinking или писать любой текст кроме JSON.
Поле fact должно содержать ровно 1 короткое предложение.

СТРОГИЙ ФОРМАТ:
[
  {
    "question": "Вопрос?",
    "options": ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"],
    "correctAnswer": "Ответ 2",
    "fact": "Факт."
  }
]`;

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер v8.0 - Deep Extract)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй массив без лишних слов.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true
            })
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        let text = await response.text();
        console.log("Ответ получен. RAW TEXT (первые 150 символов):", text.substring(0, 150).replace(/\n/g, '\\n'));
        
        // Снятие обертки API (Если есть)
        try {
            const apiResponse = JSON.parse(text);
            if (apiResponse && typeof apiResponse === 'object') {
                if (typeof apiResponse.content === 'string') {
                    text = apiResponse.content;
                } else if (apiResponse.choices?.[0]?.message?.content) {
                    text = apiResponse.choices[0].message.content;
                }
            }
        } catch (e) {
            // Оставляем текст как есть
        }

        // Вытаскиваем объекты через наш пуленепробиваемый парсер
        let questionsRaw = extractValidQuestionsFromText(text);

        if (questionsRaw.length === 0) {
            console.error("Экстрактор не смог найти ни одного вопроса в ответе:", text);
            throw new Error("Не удалось извлечь ни одного вопроса из ответа ИИ");
        }

        console.log(`Успешно спасено целых вопросов: ${questionsRaw.length}.`);

        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            
            if (!options.includes(correct)) {
                options[Math.floor(Math.random() * 4)] = correct; 
            }

            options = options.map(opt => String(opt));

            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Сбой расшифровки вопроса №${index + 1}`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Интересный факт недоступен."
            };
        });

        return validQuestions;

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback();
    }
}