// src/lib/ai.ts

// --- Встроенный "золотой фонд" вопросов (на случай полного падения ИИ) ---
const BACKUP_QUESTIONS = [
  { question: "Какая река является главной артерией Древнего Египта?", options: ["Нил", "Амазонка", "Ганг", "Волга"], correctAnswer: "Нил", fact: "Нил был основой жизни для египтян и их сельского хозяйства." },
  { question: "Кто был первым человеком в космосе?", options: ["Юрий Гагарин", "Нил Армстронг", "Илон Маск", "Сергей Королев"], correctAnswer: "Юрий Гагарин", fact: "Гагарин полетел в космос 12 апреля 1961 года." },
  { question: "Какая планета самая большая в Солнечной системе?", options: ["Юпитер", "Сатурн", "Марс", "Земля"], correctAnswer: "Юпитер", fact: "Юпитер — газовый гигант, масса которого в 318 раз больше земной." },
  { question: "Какой химический элемент обозначается символом 'O'?", options: ["Кислород", "Осмий", "Олово", "Одон"], correctAnswer: "Кислород", fact: "Кислород жизненно необходим для дыхания большинства живых организмов." },
  { question: "Кто написал роман 'Война и мир'?", options: ["Лев Толстой", "Федор Достоевский", "Антон Чехов", "Иван Тургенев"], correctAnswer: "Лев Толстой", fact: "Роман-эпопея 'Война и мир' описывает русское общество в эпоху войн против Наполеона." },
  { question: "Столицей какого государства является Токио?", options: ["Япония", "Китай", "Южная Корея", "Вьетнам"], correctAnswer: "Япония", fact: "Токио — один из самых густонаселенных мегаполисов мира." },
  { question: "Какое животное считается самым быстрым на суше?", options: ["Гепард", "Лев", "Антилопа", "Страус"], correctAnswer: "Гепард", fact: "Гепард может развивать скорость до 120 км/ч." }
];

// --- АБСОЛЮТНАЯ ЗАЩИТА: Посимвольный извлекатель целых объектов ---
function extractValidQuestionsFromText(text: string): any[] {
    const results: any[] = [];
    
    // 1. Попытка рекурсивного парсинга целого объекта (если ИИ обернул ответ)
    try {
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        function deepSearch(obj: any) {
            if (!obj) return;
            if (Array.isArray(obj)) {
                obj.forEach(deepSearch);
            } else if (typeof obj === 'object') {
                if (obj.question && Array.isArray(obj.options)) {
                    results.push(obj);
                } else {
                    Object.values(obj).forEach(deepSearch);
                }
            }
        }
        deepSearch(parsed);
        
        if (results.length > 0) return results;
    } catch (e) {
        // Переход к стековому сканеру при обрыве текста
    }

    // 2. Стековый сканер (вырезает уцелевшие объекты из сломанного JSON)
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
                stack.push(i); 
            } else if (char === '}') {
                if (stack.length > 0) {
                    const startIndex = stack.pop()!;
                    const objStr = text.substring(startIndex, i + 1);
                    try {
                        const cleanStr = objStr.replace(/\n/g, ' ').replace(/\r/g, '').replace(/,\s*([\]}])/g, '$1');
                        const parsed = JSON.parse(cleanStr);
                        
                        if (parsed && parsed.question && Array.isArray(parsed.options)) {
                            if (!results.some(q => q.question === parsed.question)) {
                                results.push(parsed);
                            }
                        }
                    } catch (e) {}
                }
            }
        }
    }
    
    return results;
}

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // БЕЗОПАСНЫЙ ГЕНЕРАТОР: Перемешивает резервные вопросы и их варианты ответов
    const getSafeBackup = () => {
        const selected = [...BACKUP_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
        return selected.map(q => {
            const options = [...q.options];
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            return { ...q, options };
        });
    };

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

    // Защита от бесконечного ожидания (Таймаут 12 секунд)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); 

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер v10.1 - Full + Fallback)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Уникальный ID запроса: ${Date.now()}. Сгенерируй массив.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId); 

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        let text = await response.text();
        console.log("Ответ получен. RAW TEXT (первые 150 символов):", text.substring(0, 150).replace(/\n/g, '\\n'));
        
        // Попытка снять обертку API
        try {
            const apiResponse = JSON.parse(text);
            if (apiResponse && typeof apiResponse === 'object') {
                if (typeof apiResponse.content === 'string') {
                    text = apiResponse.content;
                } else if (apiResponse.choices?.[0]?.message?.content) {
                    text = apiResponse.choices[0].message.content;
                }
            }
        } catch (e) {}

        // Запуск глубокого парсинга
        let questionsRaw = extractValidQuestionsFromText(text);

        // Если глубокий парсер не справился, пробуем грубую регулярку
        if (questionsRaw.length === 0) {
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    const parsed = JSON.parse(match[0].replace(/,\s*([\]}])/g, '$1'));
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        questionsRaw = parsed;
                    }
                } catch(e) {}
            }
        }

        if (!questionsRaw || questionsRaw.length === 0) {
            throw new Error("Не удалось извлечь ни одного вопроса из ответа ИИ");
        }

        // Нормализация и защита от сломанных вариантов
        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            if (!options.includes(correct)) options[Math.floor(Math.random() * 4)] = correct; 

            options = options.map(opt => String(opt));

            // Алгоритм Фишера-Йетса для рандомизации ответов
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Сбой расшифровки вопроса №${index + 1}`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Интересный факт утерян в процессе дешифровки."
            };
        });

        console.log(`Успешно подготовлено вопросов: ${validQuestions.length}`);
        return validQuestions.slice(0, 5);

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Сработала защита ИИ (переход на автономный пул):', error);
        return getSafeBackup();
    }
}