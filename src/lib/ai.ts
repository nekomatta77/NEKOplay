// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Резервный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ протокола"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    // Максимально прямолинейный промпт. Просим только чистый массив.
    const systemPrompt = `Ты — профессиональный редактор интеллектуальных игр уровня "Что? Где? Когда?".
Твоя задача — составить 7 сложных, интересных и неочевидных вопросов на тему: "${theme}".

КРИТЕРИИ КАЧЕСТВА:
1. Безупречный литературный русский язык, правильные падежи, богатая лексика.
2. Вопросы на эрудицию, дедукцию и логику.
3. Поле 'fact' должно содержать развернутый, удивительный факт, раскрывающий суть ответа.
4. 100% историческая и научная достоверность.

ТЕХНИЧЕСКИЙ ФОРМАТ (КРИТИЧЕСКИ ВАЖНО):
Верни СТРОГО валидный JSON-массив. Никаких объектов, никаких слов "Вот ваши вопросы", никакой markdown разметки. Структура должна начинаться с [ и заканчиваться ].
Пример:
[
  {
    "question": "Текст вопроса?",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswer": "Вариант 2",
    "fact": "Интересный факт."
  }
]`;

    try {
        console.log("Запрашиваем нейросеть (надежный Array-режим)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй JSON-массив из 7 вопросов.` }
                ],
                model: 'openai', 
                seed: randomSeed
                // Убрали jsonMode: true, так как он ломал выдачу на стороне прокси
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }

        let text = await response.text();
        console.log("Ответ получен. Вырезаем массив из текста...");

        // Жесткая очистка от маркдауна
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        // БРОНЕБОЙНЫЙ ЗАХВАТ: Ищем границы именно массива [ ]
        const startIdx = text.indexOf('[');
        const endIdx = text.lastIndexOf(']');
        
        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            // Вырезаем ровно от первой [ до последней ]
            // Если нейросеть завернула массив в объект, это вытащит массив ИЗ объекта!
            text = text.substring(startIdx, endIdx + 1);
        } else {
            throw new Error("Нейросеть не вернула структуру массива (не найдены символы [ и ]).");
        }

        const questionsRaw = JSON.parse(text);

        if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
            throw new Error("Парсер отработал, но извлеченная структура не является массивом.");
        }

        console.log(`Успешно распознано вопросов: ${questionsRaw.length}. Применяем анти-чит рандомизацию...`);

        // Нормализация и перемешивание вариантов ответов
        const validQuestions = questionsRaw.map((q: any) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            while(options.length < 4) {
                options.push(`Доп. вариант ${options.length + 1}`);
            }
            if (options.length > 4) {
                options.length = 4;
            }

            const correct = q.correctAnswer || options[0];
            if (!options.includes(correct)) {
                options[Math.floor(Math.random() * 4)] = correct; 
            }

            // Перемешиваем ответы, чтобы верный не всегда был первым
            options = options.sort(() => Math.random() - 0.5);

            return {
                question: q.question || "Ошибка генерации текста вопроса?",
                options: options,
                correctAnswer: correct,
                fact: q.fact || "Интересный факт утерян в архивах данных."
            };
        });

        return validQuestions.slice(0, 7);

    } catch (error) {
        console.error('Критическая ошибка ИИ. Загружен оффлайн-резерв:', error);
        return getFallback();
    }
}