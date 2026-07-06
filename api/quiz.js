// api/quiz.js
export default async function handler(req, res) {
    // Разрешаем только POST-запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { theme } = req.body;

        // Берем ключ из переменных окружения Vercel
        const apiKey = process.env.BUNKER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Ключ API не задан в переменных окружения Vercel!" });
        }

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

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://nekoplay.vercel.app', 
                'X-Title': 'NEKOplay Castle Quiz'
            },
            body: JSON.stringify({
                model: "qwen/qwen-2.5-7b-instruct:free", // Используем бесплатную модель
                messages: [
                    { role: "system", content: "Ты выдаешь ответы только в формате JSON без какого-либо дополнительного текста." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", response.status, errorText);
            return res.status(response.status).json({ error: `OpenRouter Error: ${response.status}` });
        }

        const data = await response.json();
        
        // Отправляем успешный ответ фронтенду
        return res.status(200).json(data);

    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({ error: `Server error: ${error.message}` });
    }
}