// src/lib/ai.ts

export async function generateQuizQuestion(theme: string) {
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

    try {
        // 1. ПОПЫТКА №1: Gemini (Самый стабильный вариант для CORS)
        const geminiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
            ? process.env.GEMINI_API_KEY 
            : (import.meta.env as any).VITE_GEMINI_API_KEY;

        if (geminiKey && geminiKey !== "undefined" && geminiKey !== "") {
            console.log("Пробуем сгенерировать вопрос через Gemini...");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiRawText = data.candidates[0].content.parts[0].text.trim();
                console.log("Gemini успешно ответил!");
                return JSON.parse(aiRawText);
            } else {
                console.warn("Gemini API недоступен или вернул ошибку:", response.status);
            }
        }

        // 2. ПОПЫТКА №2: OpenRouter (Резерв)
        const openRouterKey = (import.meta.env as any).VITE_OPENROUTER_API_KEY;
        
        if (openRouterKey && openRouterKey !== "undefined" && openRouterKey !== "") {
            console.log("Пробуем сгенерировать вопрос через OpenRouter...");
            const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterKey}`
                    // ВАЖНО: Мы убрали заголовки HTTP-Referer и X-Title.
                    // Именно из-за них браузер блокировал CORS preflight запрос.
                },
                body: JSON.stringify({
                    model: "qwen/qwen-2.5-7b-instruct:free",
                    messages: [
                        { role: "system", content: "Ты выдаешь ответы только в формате JSON без какого-либо дополнительного текста." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (orResponse.ok) {
                const data = await orResponse.json();
                let aiRawText = data.choices[0].message.content.trim();
                
                // Очистка от маркдауна, если ИИ его вставил
                if (aiRawText.startsWith('```')) {
                    aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
                }
                
                console.log("OpenRouter успешно ответил!");
                return JSON.parse(aiRawText);
            } else {
                console.warn("OpenRouter API недоступен или вернул ошибку:", orResponse.status);
            }
        }

        // Вызываем ошибку, если ключей нет или обе попытки провалились
        throw new Error("Все API недоступны или ключи не настроены.");

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // 3. ПРЕДОХРАНИТЕЛЬ: Железобетонная заглушка
        return {
            question: `[Системный резерв] Какой город является столицей Франции? (Твоя тема была: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Это резервный вопрос. Браузер заблокировал доступ к нейросети (CORS) или не найдены API-ключи, поэтому мы выдали этот вопрос, чтобы игра не зависла!"
        };
    }
}