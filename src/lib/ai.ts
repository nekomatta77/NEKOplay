// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Снижаем до 12 вопросов, чтобы ИИ не "уставал" и не ломал синтаксис под конец
    const prompt = `Ты автор викторин. Тема: "${theme}". Сид: ${randomSeed}.
    Сгенерируй ровно 12 УНИКАЛЬНЫХ вопросов. ВЕРНИ СТРОГО JSON-МАССИВ ОБЪЕКТОВ.
    
    КРИТИЧЕСКОЕ ПРАВИЛО: Внутри вопросов, ответов и фактов КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать двойные кавычки ("). Если нужно выделить слово, используй ТОЛЬКО одинарные кавычки (').
    НЕ используй переносы строк (\\n).
    
    Формат строго такой:
    [
      {
        "question": "Текст вопроса без двойных кавычек внутри",
        "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
        "correctAnswer": "Правильный вариант",
        "fact": "Интересный факт"
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
        
        // === ПРОДВИНУТЫЙ ВОССТАНОВИТЕЛЬ JSON ===
        
        // 1. Очищаем от случайного маркдауна
        let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        // 2. Ищем границы массива
        const startIdx = cleanedText.indexOf('[');
        if (startIdx === -1) throw new Error("ИИ не вернул массив");
        
        // Отрезаем мусор в начале
        cleanedText = cleanedText.substring(startIdx);

        // 3. Обработка обрывов
        const endIdx = cleanedText.lastIndexOf(']');
        if (endIdx === -1) {
            // Если ИИ не закрыл массив, находим последний закрытый объект
            console.warn("Ответ ИИ оборвался! Пробуем восстановить...");
            const lastBrace = cleanedText.lastIndexOf('}');
            if (lastBrace !== -1) {
                cleanedText = cleanedText.substring(0, lastBrace + 1) + ']';
            } else {
                cleanedText += ']'; // Аварийное закрытие
            }
        } else {
            // Отрезаем мусор в конце
            cleanedText = cleanedText.substring(0, endIdx + 1);
        }

        // 4. Лечим синтаксические ошибки ИИ перед парсингом:
        // Убираем висячую запятую перед закрытием массива (частая причина крашей)
        cleanedText = cleanedText.replace(/,\s*\]/g, ']');
        // Убираем висячую запятую перед закрытием объекта
        cleanedText = cleanedText.replace(/,\s*\}/g, '}');

        // 5. Парсим
        const questions = JSON.parse(cleanedText);
        
        if (!Array.isArray(questions) || questions.length === 0 || !questions[0].options) {
            throw new Error("Неверная структура данных");
        }

        console.log(`Успешно сгенерировано вопросов: ${questions.length}`);
        return questions;

    } catch (error) {
        console.error('Критическая ошибка парсинга ИИ, загрузка резерва:', error);
        
        // Резерв на 12 вопросов
        return Array(12).fill(null).map((_, i) => ({
            question: `[Сбой Сети] Резервный вопрос №${i + 1} по теме: "${theme}"? (Сид: ${randomSeed})`,
            options: ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
            correctAnswer: "Вариант А",
            fact: "Нейросеть запуталась в кавычках, поэтому активированы аварийные боевые протоколы."
        }));
    }
}