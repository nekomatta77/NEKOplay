// src/lib/ai.ts

// API-ключи больше не требуются! 
// Мы используем публичный прокси-эндпоинт Pollinations AI, который под капотом использует 
// мощные модели (GPT/Mistral/Llama) абсолютно бесплатно и без ключей.

export async function generateQuizBatch(theme: string) {
    // Генерируем уникальный сид, чтобы каждый раз получать разные вопросы даже на одну тему
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Фолбэк на случай, если у пользователя пропадет интернет
    const getFallback = () => Array(7).fill(null).map((_: any, i: number) => ({
        question: `[Офлайн режим] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
        options: ["Протокол Альфа", "Протокол Бета", "Протокол Гамма", "Протокол Дельта"],
        correctAnswer: "Протокол Альфа",
        fact: "Активированы резервные алгоритмы из-за отсутствия связи с нейросетью."
    }));

    // Оставляем ваш жесткий системный промпт, он отлично написан
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
        console.log("Молниеносный запрос к бесплатной нейросети (Pollinations AI)...");
        
        // Делаем POST запрос к открытому API. Он не требует заголовков авторизации.
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй 7 вопросов.` }
                ],
                seed: randomSeed, // Передаем сид для уникальности
                model: 'openai' // Просим использовать модель уровня GPT для максимального качества
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка открытого API: ${response.status}`);
        }

        // ВАЖНО: Pollinations возвращает сразу текстовую строку, а не сложный JSON объект
        let text = await response.text();
        
        console.log("Ответ от нейросети получен! Запускаем фильтрацию...");
        
        // Очистка от маркдауна и нормализация регистра тегов
        text = text.replace(/\*/g, '').replace(/```/g, '');
        text = text.replace(/\[Q\]:/gi, '[Q]').replace(/\[O\]:/gi, '[O]').replace(/\[A\]:/gi, '[A]').replace(/\[F\]:/gi, '[F]');
        text = text.replace(/\[q\]/gi, '[Q]').replace(/\[o\]/gi, '[O]').replace(/\[a\]/gi, '[A]').replace(/\[f\]/gi, '[F]');

        // Парсинг текста по блокам [Q]
        const blocks = text.split('[Q]');
        const questions: any[] = [];

        // Начинаем с 1, так как элемент 0 - это пустота перед первым тегом [Q]
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
                
                // Разбиваем варианты ответов по разделителю '|'
                const options = optionsText.split('|').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
                
                // Защита от кривой генерации: если вариантов меньше 4, добиваем заглушками
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
            throw new Error("Парсер не смог найти ни одного тега. Вероятно, сбой формата.");
        }

        console.log(`Успешно получено вопросов от ИИ: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Критическая ошибка ИИ, активирован оффлайн-резерв:', error);
        return getFallback();
    }
}