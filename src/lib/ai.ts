// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Внедряем строгую роль лингвиста и жесткие правила грамматики.
    // Запрещаем машинный перевод и требуем проверять окончания.
    const prompt = `Тема: "${theme}". Сид: ${randomSeed}.
    Действуй как профессиональный русский редактор, дипломированный лингвист и автор интеллектуальных игр (ЧГК). 
    Твоя задача — сгенерировать 7 уникальных вопросов.
    
    КРИТИЧЕСКИЕ ПРАВИЛА ЯЗЫКА (ЧИТАТЬ ВНИМАТЕЛЬНО!):
    1. Пиши на ИДЕАЛЬНОМ, естественном и литературном русском языке.
    2. Тщательно проверяй падежи, склонения, родовые окончания и согласование слов! Никакого "корявого" машинного перевода.
    3. Варианты ответов (в теге [O]) должны быть в едином стиле, формате и падеже (желательно в Именительном).
    4. Факт (в теге [F]) должен звучать как энциклопедическая, но легко читаемая справка.
    
    ПРАВИЛА ФОРМАТА (НЕ НАРУШАТЬ!):
    1. Не пиши НИКАКОГО текста до или после вопросов (никаких "Привет", "Вот вопросы").
    2. Используй ТОЛЬКО теги [Q], [O], [A], [F].
    
    Шаблон каждого вопроса:
    [Q] Грамотно сформулированный вопрос?
    [O] Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    [A] Правильный вариант (точная копия из [O])
    [F] Интересный и безупречно написанный факт
    `;

    try {
        console.log("Запрашиваем боезапас вопросов у нейросети (Режим Лингвиста)...");
        
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
        
        if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
            throw new Error("Нейросеть недоступна (вернула HTML-страницу защиты)");
        }
        
        console.log("Ответ ИИ получен, начинаем жесткую фильтрацию...");
        
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
            console.error("Сырой текст от ИИ, который сломал всё:", text); 
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
            fact: "Связь с основным ИИ была нарушена из-за помех в сети. Активированы резервные алгоритмы."
        }));
    }
}