// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Запрашиваем 15 вопросов - это оптимально, чтобы снизить шанс сильного обрыва токенов
    const prompt = `Ты профессиональный автор викторин. Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй ровно 15 СЛУЧАЙНЫХ, сложных и уникальных вопросов.
    ВЕРНИ СТРОГО JSON-МАССИВ ОБЪЕКТОВ. НИКАКОГО ТЕКСТА ДО ИЛИ ПОСЛЕ. БЕЗ MARKDOWN.
    Формат строго такой:
    [
      {
        "question": "Текст вопроса",
        "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
        "correctAnswer": "Правильный вариант (строго из массива options)",
        "fact": "Короткий факт"
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
        
        // === ПУЛЕНЕПРОБИВАЕМЫЙ ПАРСЕР JSON ===
        let cleanedText = text.trim();
        
        // 1. Очищаем от случайного маркдауна (частая проблема бесплатных ИИ)
        cleanedText = cleanedText.replace(/```json/gi, '').replace(/```/g, '').trim();

        // 2. Ищем начало массива
        const startIdx = cleanedText.indexOf('[');
        if (startIdx === -1) {
            throw new Error("Нейросеть не вернула начало массива '['");
        }
        
        // Отрезаем весь мусорный текст до начала массива
        cleanedText = cleanedText.substring(startIdx);

        // 3. Ищем конец массива
        let endIdx = cleanedText.lastIndexOf(']');
        
        if (endIdx === -1) {
            // Если ИИ не дописал ответ (исчерпан лимит слов), обрезаем до последнего ЦЕЛОГО объекта
            console.warn("Ответ ИИ оборвался! Восстанавливаем структуру JSON...");
            const lastBrace = cleanedText.lastIndexOf('}');
            if (lastBrace !== -1) {
                // Закрываем массив принудительно после последнего целого объекта
                cleanedText = cleanedText.substring(0, lastBrace + 1) + ']';
            } else {
                cleanedText += ']';
            }
        } else {
            // Отрезаем весь мусорный текст после конца массива
            cleanedText = cleanedText.substring(0, endIdx + 1);
        }

        // 4. Парсим очищенный и восстановленный JSON
        const questions = JSON.parse(cleanedText);
        
        // 5. Проверяем валидность структуры
        if (!Array.isArray(questions) || questions.length === 0 || !questions[0].options) {
            throw new Error("Структура сгенерированных данных повреждена");
        }

        console.log(`Успешно сгенерировано и восстановлено вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Критическая ошибка парсинга ИИ, загрузка резерва:', error);
        
        // Если даже восстановление не помогло, выдаем резервные вопросы, чтобы игра не зависла
        return Array(15).fill(null).map((_, i) => ({
            question: `[Сбой Сети ИИ] Резервный вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
            correctAnswer: "Вариант А",
            fact: "Нейросеть не смогла выдать корректный ответ, поэтому активированы аварийные протоколы игры."
        }));
    }
}