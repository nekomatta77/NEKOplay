// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Фолбэк на случай критических сбоев
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Сбой связи] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ протокола"],
        correctAnswer: "Перегрузка API",
        fact: "Нейросеть временно недоступна или выдала нестандартный ответ. Попробуйте еще раз."
    }));

    // Обновленный промпт: теперь мы явно просим ОБЪЕКТ с массивом внутри
    const systemPrompt = `Ты — профессиональный редактор интеллектуальных игр уровня "Что? Где? Когда?" и "Своя Игра".
Твоя задача — составить 7 потрясающих, сложных и глубоких вопросов на тему: "${theme}".

КРИТЕРИИ КАЧЕСТВА:
1. Безупречный литературный русский язык, правильные падежи, богатая лексика.
2. Вопросы на эрудицию, дедукцию и логику, а не просто "в каком году...".
3. Поле 'fact' должно содержать развернутый, удивительный факт.
4. 100% историческая и научная достоверность.

ТЕХНИЧЕСКИЙ ФОРМАТ:
Верни строго валидный JSON-ОБЪЕКТ, в котором есть один ключ "questions". Значение этого ключа — массив из 7 вопросов.
Пример структуры:
{
  "questions": [
    {
      "question": "Текст увлекательного вопроса?",
      "options": ["Правдоподобный вариант", "Правильный вариант", "Хитрый вариант", "Абсурдный вариант"],
      "correctAnswer": "Правильный вариант",
      "fact": "Развернутый интересный факт, раскрывающий суть ответа."
    }
  ]
}`;

    try {
        console.log("Отправка запроса к AI (в режиме JSON Object/Expert)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй JSON-объект с 7 качественными вопросами.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true 
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка открытого API: ${response.status}`);
        }

        let text = await response.text();
        console.log("Получен ответ от нейросети, запускаем парсер...");

        // Жесткая очистка от маркдауна и словесного мусора
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Ищем начало и конец JSON-объекта
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            text = text.substring(startIdx, endIdx + 1);
        }

        const parsedData = JSON.parse(text);

        // --- БРОНЕБОЙНЫЙ ПОИСК МАССИВА ---
        let questionsRaw: any[] = [];
        
        if (Array.isArray(parsedData)) {
            // Если ИИ проигнорировал объект и все-таки вернул массив
            questionsRaw = parsedData;
        } else if (parsedData && Array.isArray(parsedData.questions)) {
            // Идеальный сценарий (ключ questions)
            questionsRaw = parsedData.questions;
        } else if (parsedData && typeof parsedData === 'object') {
            // Если ИИ назвал ключ по-другому (например, "data" или "quiz"), просто ищем первый попавшийся массив
            const possibleArray = Object.values(parsedData).find(val => Array.isArray(val));
            if (possibleArray) {
                questionsRaw = possibleArray as any[];
            }
        }

        if (!questionsRaw || questionsRaw.length === 0) {
            throw new Error("Парсер отработал, но массив вопросов пуст или не найден в структуре JSON.");
        }

        console.log(`Успешно извлечено вопросов: ${questionsRaw.length}. Применяем рандомизацию...`);

        // Нормализация и перемешивание
        const validQuestions = questionsRaw.map((q: any) => {
            // Защита от отсутствующих options
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

            // Рандомизация ответов
            options = options.sort(() => Math.random() - 0.5);

            return {
                question: q.question || "Ошибка генерации текста вопроса?",
                options: options,
                correctAnswer: correct,
                fact: q.fact || "Интересный факт утерян в архивах данных."
            };
        });

        // Нам нужно ровно 7 вопросов (обрезаем, если ИИ выдал больше)
        return validQuestions.slice(0, 7);

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback();
    }
}