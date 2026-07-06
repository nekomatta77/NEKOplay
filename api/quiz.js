// api/quiz.js
export const config = {
    runtime: 'edge', // Возвращаем Edge, так как этот рантайм 100% работает в твоем проекте
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
            status: 405, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        const body = await req.json();
        const { theme } = body;

        const apiKey = process.env.BUNKER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Ключ API не задан в Vercel!" }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const prompt = `
        Ты — профессиональный генератор вопросов для интеллектуальной викторины.
        Составь ровно 1 интересный и исторически/фактически точный вопрос по теме: "${theme}".
        
        Ты должен вернуть ответ СТРОГО в формате JSON объекта. Не добавляй никаких приветствий, markdown-разметки или пояснений. Только чистый JSON.
        
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
                model: "qwen/qwen-2.5-7b-instruct:free", // Используем строго бесплатную модель
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
            return new Response(JSON.stringify({ error: `OpenRouter Error: ${response.status}` }), { 
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Internal Server Error:", error);
        return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}