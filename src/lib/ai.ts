// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // МЫ БОЛЬШЕ НЕ ПРОСИМ JSON! Просим строгий текстовый формат.
    const prompt = `Ты автор викторин. Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй ровно 12 УНИКАЛЬНЫХ вопросов.
    
    КРИТИЧЕСКИЕ ПРАВИЛА:
    1. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать JSON, массивы или скобки.
    2. Внутри текста не используй переносы строк.
    3. Разделяй вопросы строго тремя тире: ---
    
    Каждый вопрос должен быть СТРОГО в таком формате (каждая буква с новой строки):
    
    Q: Текст вопроса
    O: Вариант 1 | Вариант 2 | Вариант 3 | Вариант 4
    A: Правильный вариант
    F: Интересный факт
    ---
    `;

    try {
        console.log("Запрашиваем пачку вопросов (Текстовый протокол)...");
        
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
        
        // === ПУЛЕНЕПРОБИВАЕМЫЙ ТЕКСТОВЫЙ ПАРСЕР ===
        // Разбиваем ответ по разделителю "---"
        const rawBlocks = text.split('---').map(b => b.trim()).filter(b => b.length > 20);
        const questions: any[] = [];

        for (const block of rawBlocks) {
            try {
                // Ищем строки, начинающиеся с Q:, O:, A:, F: (игнорируя регистр)
                const qMatch = block.match(/Q:\s*(.+)/i);
                const oMatch = block.match(/O:\s*(.+)/i);
                const aMatch = block.match(/A:\s*(.+)/i);
                const fMatch = block.match(/F:\s*(.+)/i);

                if (qMatch && oMatch && aMatch && fMatch) {
                    // Разбиваем варианты ответов по символу "|"
                    const options = oMatch[1].split('|').map(o => o.trim()).filter(o => o.length > 0);
                    
                    // Если вариантов ровно 4, добавляем вопрос в массив
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
                // Если нейросеть испортила один конкретный вопрос, мы просто пропускаем его!
                // Никаких вылетов игры.
                console.warn("Один вопрос был поврежден ИИ и пропущен.");
            }
        }

        // Если нейросеть выдала полную чушь и ни один вопрос не подошел
        if (questions.length === 0) {
            throw new Error("ИИ не вернул ни одного валидного текстового блока");
        }

        console.log(`Успешно распарсено вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Критическая ошибка текстового ИИ, загрузка резерва:', error);
        
        // Надежный резерв, который загрузится при отсутствии интернета или сбое ИИ
        return Array(12).fill(null).map((_, i) => ({
            question: `[Аварийная система] Вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
            correctAnswer: "Вариант А",
            fact: "Связь с нейросетью прервалась, но игровые сервера успешно восстановили боеспособность."
        }));
    }
}