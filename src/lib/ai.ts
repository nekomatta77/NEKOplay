// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    // Генерируем уникальный сид для вариативности
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Фолбэк на случай критических сбоев API
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Сбой связи] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ протокола"],
        correctAnswer: "Перегрузка API",
        fact: "Нейросеть временно недоступна или выдала нечитаемый ответ. Попробуйте еще раз."
    }));

    // Обновленный промпт с внедрением персоны и строгим требованием JSON
    const systemPrompt = `Ты — профессиональный редактор интеллектуальных игр уровня "Что? Где? Когда?" и "Своя Игра".
Твоя задача — составить 7 потрясающих, сложных и глубоких вопросов на тему: "${theme}".

КРИТЕРИИ КАЧЕСТВА (КРИТИЧЕСКИ ВАЖНО):
1. Безупречный литературный русский язык, правильные падежи, богатая лексика. Никакого машинного перевода или кривых формулировок!
2. Логика: вопросы должны быть на эрудицию, дедукцию и логику, а не просто на сухие цифры "в каком году...".
3. Интерес: поле 'fact' должно содержать развернутый, удивительный факт, который расширяет кругозор и заставит игрока сказать "Ого, я этого не знал!".
4. Точность: 100% историческая и научная достоверность.

ТЕХНИЧЕСКИЙ ФОРМАТ:
Верни ТОЛЬКО валидный JSON-массив. Никакого текста до или после. Никакой разметки Markdown.
Пример идеальной структуры:
[
  {
    "question": "Текст увлекательного вопроса?",
    "options": ["Правдоподобный вариант", "Правильный вариант", "Хитрый вариант", "Абсурдный вариант"],
    "correctAnswer": "Правильный вариант",
    "fact": "Развернутый интересный факт, раскрывающий суть ответа."
  }
]`;

    try {
        console.log("Отправка запроса к AI (в режиме JSON/Expert)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Сгенерируй JSON-массив из 7 качественных вопросов.` }
                ],
                model: 'openai', // Используем наиболее умную модель из доступных в шлюзе
                seed: randomSeed,
                jsonMode: true // Даем подсказку шлюзу, что ждем JSON
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка открытого API: ${response.status}`);
        }

        let text = await response.text();
        console.log("Получен ответ от нейросети, запускаем парсер...");

        // Ищем в тексте только то, что похоже на массив, отсекая любые галлюцинации нейросети (например ```json)
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
            text = jsonMatch[0];
        } else {
            // Если регулярка не сработала, пробуем просто очистить края
            text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        const questions = JSON.parse(text);

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Нейросеть вернула корректный текст, но это не массив.");
        }

        console.log("Вопросы успешно распарсены. Применяем фильтры и рандомизацию...");

        // Нормализуем данные и перемешиваем ответы
        const validQuestions = questions.map(q => {
            // Убеждаемся, что options это массив
            let options = Array.isArray(q.options) ? q.options : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            // Если вариантов меньше 4, добиваем заглушками
            while(options.length < 4) {
                options.push(`Доп. вариант ${options.length + 1}`);
            }
            if (options.length > 4) {
                options.length = 4;
            }

            // Убеждаемся, что правильный ответ точно присутствует в массиве
            const correct = q.correctAnswer || options[0];
            if (!options.includes(correct)) {
                options[Math.floor(Math.random() * 4)] = correct; 
            }

            // РАНДОМИЗАЦИЯ ОТВЕТОВ: перемешиваем массив, чтобы правильный ответ не всегда был на одном месте
            options = options.sort(() => Math.random() - 0.5);

            return {
                question: q.question || "Ошибка генерации текста вопроса?",
                options: options,
                correctAnswer: correct,
                fact: q.fact || "Интересный факт утерян в архивах данных."
            };
        });

        return validQuestions;

    } catch (error) {
        console.error('Критическая ошибка ИИ (скорее всего сбой формата), загружаем резерв:', error);
        return getFallback();
    }
}