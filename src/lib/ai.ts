// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Промпт теперь требует использовать строгие теги, как в коде. 
    // Нейросети понимают такие конструкции гораздо лучше обычного текста.
    const prompt = `Ты — строгий алгоритм генерации викторин. Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй 7 вопросов. 
    Отвечай СТРОГО по шаблону ниже. Не пиши "Конечно", "Вот ваши вопросы" или любой другой текст.
    Используй ТОЛЬКО теги [Q], [O], [A], [F].
    
    Шаблон для каждого вопроса (строго соблюдай теги!):
    [Q] Текст вопроса
    [O] Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    [A] Правильный вариант
    [F] Интересный факт
    `;

    try {
        console.log("Запрашиваем боезапас вопросов у нейросети...");
        
        const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        let text = await response.text();
        
        // Защита на случай, если бесплатный API упал и вернул страницу с ошибкой Cloudflare
        if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
            throw new Error("Нейросеть недоступна (вернула HTML-страницу защиты)");
        }
        
        // === УЛЬТРА-СИСТЕМА ПАРСИНГА (DOM-подобная) ===
        console.log("Ответ ИИ получен, начинаем жесткую фильтрацию...");
        
        // 1. Убираем любой markdown (звездочки, жирный шрифт), если ИИ решил их добавить
        text = text.replace(/\*/g, '');
        
        // 2. Нейросеть может случайно добавить двоеточие после тега, исправляем это
        text = text.replace(/\[Q\]:/gi, '[Q]').replace(/\[O\]:/gi, '[O]').replace(/\[A\]:/gi, '[A]').replace(/\[F\]:/gi, '[F]');
        
        // 3. Нормализуем регистр тегов (на случай если ИИ напишет [q] вместо [Q])
        text = text.replace(/\[q\]/gi, '[Q]').replace(/\[o\]/gi, '[O]').replace(/\[a\]/gi, '[A]').replace(/\[f\]/gi, '[F]');

        // 4. Разбиваем весь текст по главному тегу вопроса [Q]
        const blocks = text.split('[Q]');
        const questions: any[] = [];

        // Начинаем с 1, так как 0-й элемент массива — это любой мусорный текст ДО первого вопроса
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            
            // Ищем точные позиции остальных тегов в блоке
            const idxO = block.indexOf('[O]');
            const idxA = block.indexOf('[A]');
            const idxF = block.indexOf('[F]');
            
            // Если все три тега присутствуют
            if (idxO !== -1 && idxA !== -1 && idxF !== -1) {
                // Вырезаем текст строго между тегами (игнорируя любые переносы строк и пробелы)
                const questionText = block.substring(0, idxO).trim();
                const optionsText = block.substring(idxO + 3, idxA).trim();
                const answerText = block.substring(idxA + 3, idxF).trim();
                
                // Факт идет от тега [F] и до конца блока (убираем "---" если ИИ их добавил по привычке)
                const factText = block.substring(idxF + 3).replace(/---/g, '').trim();
                
                // Разделяем варианты по символу "|"
                const options = optionsText.split('|').map(o => o.trim()).filter(o => o.length > 0);
                
                // ЖЕСТКАЯ ЗАЩИТА UI: 
                // Если нейросеть затупила и выдала 3 варианта ответа вместо 4, добиваем их заглушками, чтобы не было краша
                while(options.length < 4) {
                    options.push(`Случайный вариант ${options.length + 1}`);
                }
                // Если ИИ выдал 5 вариантов, отрезаем лишний
                if (options.length > 4) {
                    options.length = 4;
                }
                
                // Финальная проверка на то, что вырезанный текст не пустой
                if (questionText.length > 5 && answerText.length > 1) {
                    questions.push({
                        question: questionText,
                        options: options,
                        correctAnswer: answerText,
                        fact: factText || 'Интересный факт утерян в архивах.'
                    });
                }
            }
        }

        if (questions.length === 0) {
            console.error("Сырой текст от ИИ, который сломал всё:", text); // Поможет нам в консоли увидеть, если ИИ выдал что-то совсем безумное
            throw new Error("Парсер не смог найти ни одного тега [Q], [O], [A], [F]");
        }

        console.log(`Успешно получено и отфильтровано вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка ИИ, загрузка резерва:', error);
        
        // Встроенный резерв теперь тоже использует 7 вопросов для синхронизации с механикой
        return Array(7).fill(null).map((_, i) => ({
            question: `[Сбой нейросети] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Протокол Альфа", "Протокол Бета", "Протокол Гамма", "Протокол Дельта"],
            correctAnswer: "Протокол Альфа",
            fact: "Связь с основным ИИ была нарушена из-за помех в сети. Активированы резервные алгоритмы."
        }));
    }
}