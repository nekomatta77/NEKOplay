// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Промпт теперь содержит жесткий запрет на рассуждения (Chain of Thought)
    const prompt = `Тема: "${theme}". Сид: ${randomSeed}.
    Действуй как главный редактор телевизионной викторины. Сгенерируй 7 уникальных вопросов.
    
    АБСОЛЮТНО КРИТИЧЕСКИЕ ПРАВИЛА (ШТРАФ ЗА НАРУШЕНИЕ):
    1. БЕЗ РАССУЖДЕНИЙ! Категорически запрещено писать свои мысли, "reasoning", "chain of thought", вступления или заключения.
    2. НАЧИНАЙ ОТВЕТ СТРОГО С ТЕГА [Q]. Никаких JSON-структур, только чистый текст по шаблону.
    3. АБСОЛЮТНАЯ ИСТОРИЧЕСКАЯ ТОЧНОСТЬ. 100% достоверные факты и цифры.
    4. Идеальный, грамотный русский язык (проверяй падежи).
    5. Используй ТОЛЬКО одинарные кавычки (''), двойные ("") запрещены.
    
    Шаблон каждого вопроса строго такой:
    [Q] Текст вопроса
    [O] Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    [A] Правильный вариант (точная копия из [O])
    [F] Достоверный факт
    `;

    try {
        console.log("Запрашиваем вопросы у продвинутой нейросети (GPT-4o)...");
        
        // Жестко фиксируем модель gpt-4o, чтобы избежать попадания на экспериментальные модели
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=gpt-4o`;
        
        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        let text = await response.text();
        
        // 1. АНТИ-HTML ЗАЩИТА (если упал сервер Cloudflare)
        if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
            throw new Error("Нейросеть недоступна (вернула HTML-страницу защиты)");
        }

        // 2. АНТИ-JSON ЗАЩИТА (извлекаем текст, если API внезапно обернул его в JSON)
        try {
            if (text.trim().startsWith('{')) {
                const parsed = JSON.parse(text);
                // Ищем контент в стандартных полях ответа
                text = parsed.content || parsed.message || parsed.response || parsed.text || text;
            }
        } catch (e) {
            // Игнорируем ошибку парсинга, значит текст пришел в сыром виде (это нормально)
        }
        
        console.log("Ответ ИИ получен, начинаем жесткую фильтрацию...");
        
        // Очистка от маркдауна и нормализация
        text = text.replace(/\*/g, '');
        text = text.replace(/```/g, '');
        text = text.replace(/\[Q\]:/gi, '[Q]').replace(/\[O\]:/gi, '[O]').replace(/\[A\]:/gi, '[A]').replace(/\[F\]:/gi, '[F]');
        text = text.replace(/\[q\]/gi, '[Q]').replace(/\[o\]/gi, '[O]').replace(/\[a\]/gi, '[A]').replace(/\[f\]/gi, '[F]');

        const blocks = text.split('[Q]');
        const questions: any[] = [];

        // Парсим блоки
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            
            const idxO = block.indexOf('[O]');
            const idxA = block.indexOf('[A]');
            const idxF = block.indexOf('[F]');
            
            if (idxO !== -1 && idxA !== -1 && idxF !== -1) {
                const questionText = block.substring(0, idxO).trim();
                const optionsText = block.substring(idxO + 3, idxA).trim();
                const answerText = block.substring(idxA + 3, idxF).trim();
                const factText = block.substring(idxF + 3).replace(/---/g, '').trim();
                
                const options = optionsText.split('|').map(o => o.trim()).filter(o => o.length > 0);
                
                // Добиваем варианты до 4, если ИИ ошибся
                while(options.length < 4) {
                    options.push(`Резервный вариант ${options.length + 1}`);
                }
                if (options.length > 4) {
                    options.length = 4;
                }
                
                // Пропускаем в игру только непустые вопросы
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
            console.error("Сырой текст от ИИ:", text); 
            throw new Error("Парсер не смог найти ни одного тега [Q], [O], [A], [F]");
        }

        console.log(`Успешно получено и отфильтровано вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка ИИ, загрузка резерва:', error);
        
        return Array(7).fill(null).map((_, i) => ({
            question: `[Сбой нейросети] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Протокол Альфа", "Протокол Бета", "Протокол Гамма", "Протокол Дельта"],
            correctAnswer: "Протокол Альфа",
            fact: "Связь с основным ИИ была нарушена. Активированы резервные алгоритмы."
        }));
    }
}