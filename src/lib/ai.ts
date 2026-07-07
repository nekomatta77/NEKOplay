// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Промпт усилен для GPT-4o. Добавлены жесткие угрозы за фактические ошибки.
    const prompt = `Тема: "${theme}". Сид: ${randomSeed}.
    Действуй как главный редактор и строгий фактчекер телевизионной викторины "Своя Игра". 
    Сгенерируй 7 уникальных вопросов.
    
    КРИТИЧЕСКИЕ ПРАВИЛА ФАКТЧЕКИНГА:
    1. АБСОЛЮТНАЯ ИСТОРИЧЕСКАЯ ТОЧНОСТЬ. Если вопрос касается количества серий в сериале/аниме, дат выхода, точных имен или цифр — перепроверяй свои знания!
    2. Если ты сомневаешься в цифре или факте хотя бы на 1% — НЕ пиши этот вопрос. Замени его на тот, в котором уверен на 100%.
    3. Используй идеальный, грамотный русский язык (без машинного перевода).
    4. Не используй двойные кавычки (только одинарные).
    
    ПРАВИЛА ФОРМАТА (НЕ НАРУШАТЬ!):
    1. Не пиши НИКАКОГО текста до или после вопросов.
    2. Используй ТОЛЬКО теги [Q], [O], [A], [F].
    
    Шаблон:
    [Q] Грамотный вопрос
    [O] Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    [A] Правильный вариант (точная копия из [O])
    [F] Достоверный факт, подтверждающий ответ
    `;

    try {
        // Мы добавляем ?model=openai, чтобы Pollinations перенаправил запрос на GPT-4o / GPT-4o-mini
        // Это самая умная модель, доступная там бесплатно.
        console.log("Запрашиваем вопросы у продвинутой нейросети (OpenAI)...");
        
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
        
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
        
        if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
            throw new Error("Нейросеть недоступна (вернула HTML-страницу защиты)");
        }
        
        text = text.replace(/\*/g, '');
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
                
                const options = optionsText.split('|').map(o => o.trim()).filter(o => o.length > 0);
                
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