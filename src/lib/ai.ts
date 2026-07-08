// src/lib/ai.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Явно указываем типы для параметров callback-функции в map (_: any, i: number), чтобы TS не ругался
    const getFallback = () => Array(7).fill(null).map((_: any, i: number) => ({
        question: `[Офлайн режим] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
        options: ["Протокол Альфа", "Протокол Бета", "Протокол Гамма", "Протокол Дельта"],
        correctAnswer: "Протокол Альфа",
        fact: "Активированы резервные алгоритмы. Проверьте подключение или валидность API ключа."
    }));

    if (!GEMINI_API_KEY) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: API ключ отсутствует!");
        return getFallback();
    }

    const systemPrompt = `Ты — главный редактор телевизионной викторины. Твоя задача выдать 7 уникальных вопросов.
    
    АБСОЛЮТНО КРИТИЧЕСКИЕ ПРАВИЛА:
    1. БЕЗ РАССУЖДЕНИЙ! Категорически запрещено писать свои мысли, "reasoning", вступления или заключения. 
    2. НАЧИНАЙ ОТВЕТ СТРОГО С ТЕГА [Q]. Никаких JSON или приветствий, только чистый текст.
    3. АБСОЛЮТНАЯ ИСТОРИЧЕСКАЯ ТОЧНОСТЬ. 100% достоверные факты.
    4. Идеальный русский язык, правильные падежи.
    5. Используй ТОЛЬКО одинарные кавычки (''), двойные запрещены.
    
    Шаблон каждого вопроса строго такой:
    [Q] Текст вопроса
    [O] Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    [A] Правильный вариант (точная копия из [O])
    [F] Достоверный факт`;

    try {
        console.log("Запрашиваем данные у нейросети...");
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nТема: "${theme}". Сгенерируй 7 вопросов.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7 
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Ошибка API: ${response.status} - ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error("Структура ответа API изменилась или пуста");
        }
        let text = data.candidates[0].content.parts[0].text;
        
        console.log("Ответ от ИИ получен! Запускаем жесткую фильтрацию...");
        
        text = text.replace(/\*/g, '').replace(/```/g, '');
        text = text.replace(/\[Q\]:/gi, '[Q]').replace(/\[O\]:/gi, '[O]').replace(/\[A\]:/gi, '[A]').replace(/\[F\]:/gi, '[F]');
        text = text.replace(/\[q\]/gi, '[Q]').replace(/\[o\]/gi, '[O]').replace(/\[a\]/gi, '[A]').replace(/\[f\]/gi, '[F]');

        const blocks = text.split('[Q]');
        const questions: any[] = [];

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
                
                // ИСПРАВЛЕНИЕ ОШИБКИ: Явно указываем (o: string)
                const options = optionsText.split('|').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
                
                while(options.length < 4) {
                    options.push(`Резервный вариант ${options.length + 1}`);
                }
                if (options.length > 4) {
                    options.length = 4;
                }
                
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
            throw new Error("Парсер не смог найти ни одного тега");
        }

        console.log(`Успешно получено вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка ИИ, загрузка резерва:', error);
        return getFallback();
    }
}