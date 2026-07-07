// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Запрашиваем 20 вопросов. Это оптимальное число, чтобы нейросеть не оборвала текст из-за лимита бесплатных токенов.
    const prompt = `Ты профессиональный автор викторин. Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй ровно 20 СЛУЧАЙНЫХ, сложных и уникальных вопросов.
    ВЕРНИ СТРОГО JSON-МАССИВ ОБЪЕКТОВ. НИКАКОГО ТЕКСТА ДО ИЛИ ПОСЛЕ. БЕЗ MARKDOWN.
    Формат строго такой:
    [
      {
        "question": "Текст вопроса",
        "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
        "correctAnswer": "Правильный вариант (из массива options)",
        "fact": "Короткий интересный факт"
      }
    ]`;

    try {
        console.log("Запрашиваем пачку вопросов у нейросети...");
        
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
        
        // Регулярное выражение для вытаскивания строго JSON-массива (игнорирует любой мусорный текст вокруг)
        const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        
        if (!match) {
            throw new Error("Нейросеть не вернула JSON-массив");
        }

        const questions = JSON.parse(match[0]);
        
        // Проверяем структуру хотя бы первого элемента, чтобы убедиться, что options на месте
        if (!Array.isArray(questions) || questions.length === 0 || !questions[0].options) {
            throw new Error("Неверная структура сгенерированных данных");
        }

        console.log(`Успешно сгенерировано вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // Резервный пул вопросов, чтобы игра никогда не крашилась (даже без интернета)
        return Array(20).fill(null).map((_, i) => ({
            question: `[Офлайн режим] Резервный вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
            correctAnswer: "Вариант А",
            fact: "Нейросеть не смогла выдать корректные данные, поэтому мы загрузили резервные боевые протоколы."
        }));
    }
}