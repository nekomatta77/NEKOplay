// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Просим 7 вопросов, чтобы гарантированно не упереться в лимит слов нейросети.
    // Назначаем ИИ роль "Академика", чтобы исключить ошибки в именах и орфографии.
    const prompt = `Ты — выдающийся академик-энциклопедист, историк и строгий редактор интеллектуальных игр. 
    Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй ровно 7 УНИКАЛЬНЫХ и сложных вопросов.
    
    КРИТИЧЕСКИЕ ПРАВИЛА:
    1. ИДЕАЛЬНАЯ ГРАМОТНОСТЬ. Тщательно проверяй имена, названия, даты и факты. Никаких орфографических ошибок!
    2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать JSON, массивы или скобки.
    3. Разделяй вопросы строго тремя тире: ---
    
    Каждый вопрос должен быть СТРОГО в таком формате (каждая буква с новой строки):
    
    Q: Текст вопроса
    O: Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    A: Правильный вариант
    F: Исторический или научный факт (строго достоверный)
    ---
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

        const text = await response.text();
        
        // Разрезаем ответ по разделителю "---"
        const rawBlocks = text.split('---').map(b => b.trim()).filter(b => b.length > 20);
        const questions: any[] = [];

        for (const block of rawBlocks) {
            try {
                const qMatch = block.match(/Q:\s*(.+)/i);
                const oMatch = block.match(/O:\s*(.+)/i);
                const aMatch = block.match(/A:\s*(.+)/i);
                const fMatch = block.match(/F:\s*(.+)/i);

                if (qMatch && oMatch && aMatch && fMatch) {
                    const options = oMatch[1].split('|').map(o => o.trim()).filter(o => o.length > 0);
                    
                    if (options.length === 4) {
                        questions.push({
                            question: qMatch[1].trim(),
                            options: options,
                            correctAnswer: aMatch[1].trim(),
                            fact: fMatch[1].trim()
                        });
                    }
                }
            } catch (e) {
                console.warn("Один вопрос был поврежден и пропущен.");
            }
        }

        if (questions.length === 0) {
            throw new Error("ИИ не вернул ни одного валидного вопроса");
        }

        console.log(`Успешно получено вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка ИИ, загрузка резерва:', error);
        
        // Резерв на случай полного отказа серверов нейросети
        return Array(7).fill(null).map((_, i) => ({
            question: `[Аварийная система] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
            correctAnswer: "Вариант А",
            fact: "Сервер нейросети перегружен, активированы резервные офлайн-протоколы."
        }));
    }
}