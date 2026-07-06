// src/lib/ai.ts

// Получаем ключ из переменных окружения Vite
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function generateQuizQuestion(theme: string) {
    if (!API_KEY) {
        throw new Error("Не найден ключ OpenRouter API. Проверь файл .env");
    }

    // Тот самый жесткий промпт для генерации чистого JSON
    const prompt = `
    Ты — профессиональный генератор вопросов для интеллектуальной викторины.
    Составь ровно 1 интересный и исторически/фактически точный вопрос по теме: "${theme}".
    
    Ты должен вернуть ответ СТРОГО в формате JSON объекта. Не добавляй никаких приветствий, markdown-разметки (не используй \`\`\`json) или пояснений. Только чистый JSON.
    
    Структура ответа должна быть строго следующей:
    {
      "question": "Текст твоего сгенерированного вопроса?",
      "options": ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
      "correctAnswer": "Точный текст правильного ответа, который совпадает с одним из вариантов в массиве options",
      "fact": "Короткий, удивительный или познавательный факт, объясняющий правильный ответ"
    }
    `;

    try {
        // Делаем прямой запрос к API OpenRouter из браузера
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                // OpenRouter просит передавать эти заголовки
                "HTTP-Referer": window.location.href, 
                "X-Title": "NEKOplay Castle Quiz"
            },
            body: JSON.stringify({
                model: "qwen/qwen-2.5-7b-instruct", // Выбранная нами мощная и бесплатная модель
                messages: [
                    { role: "system", content: "Ты выдаешь ответы только в формате JSON без какого-либо дополнительного текста." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        const data = await response.json();
        let aiRawText = data.choices[0].message.content.trim();

        // Очищаем от случайного markdown, если ИИ все же его добавил
        if (aiRawText.startsWith('```')) {
            aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        // Превращаем текст в готовый объект
        const quizData = JSON.parse(aiRawText);
        return quizData;

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        return null;
    }
}