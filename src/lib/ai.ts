// src/lib/ai.ts

// Используем ключ из .env или вшитый (твой рабочий ключ OpenRouter)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Резервный пул с явным указанием типов (чтобы TypeScript не ругался)
    const getFallback = () => Array(7).fill(null).map((_: any, i: number) => ({
        question: `[Офлайн режим] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
        options: ["Протокол Альфа", "Протокол Бета", "Протокол Гамма", "Протокол Дельта"],
        correctAnswer: "Протокол Альфа",
        fact: "Активированы резервные алгоритмы."
    }));

    if (!OPENROUTER_API_KEY) {
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
        console.log("Молниеносный запрос к OpenRouter (Gemini 2.0 Flash)...");
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                // Эти заголовки просит OpenRouter
                'HTTP-Referer': 'http://localhost:5173', 
                'X-Title': 'NEKOplay',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free', // Сверхбыстрая и бесплатная модель
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй 7 вопросов.` }
                ],
                temperature: 0.7,
                seed: randomSeed
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Ошибка OpenRouter: ${response.status} - ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Структура ответа API пуста");
        }
        
        let text = data.choices[0].message.content;
        
        console.log("Ответ от ИИ получен! Запускаем фильтрацию...");
        
        // Очистка от маркдауна и нормализация тегов
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
                
                // Явно указываем тип (o: string), чтобы не было ошибки 7006 в TypeScript
                const options = optionsText.split('|').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
                
                // Защита от кривого количества вариантов ответа
                while(options.length < 4) {
                    options.push(`Вариант ${options.length + 1}`);
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

        console.log(`Успешно получено вопросов от ИИ: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка ИИ, загрузка резерва:', error);
        return getFallback();
    }
}