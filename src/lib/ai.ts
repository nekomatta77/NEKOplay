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
        // 1. Попытка №1: Используем Gemini (ключ уже настроен в твоем vite.config.ts)
        const geminiKey = (process.env as any).GEMINI_API_KEY || (import.meta.env as any).VITE_GEMINI_API_KEY;

        if (geminiKey && geminiKey !== "undefined" && geminiKey !== "") {
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
                let aiRawText = data.candidates[0].content.parts[0].text.trim();
                return JSON.parse(aiRawText);
            }
        }

        // 2. Попытка №2 (Фоллбэк): Идем напрямую в OpenRouter с фронтенда
        const openRouterKey = (import.meta.env as any).VITE_OPENROUTER_API_KEY;
        
        if (openRouterKey) {
            const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterKey}`,
                    // Отдаем origin фронтенда, чтобы пройти проверки OpenRouter
                    'HTTP-Referer': window.location.origin || 'https://nekoplay.vercel.app', 
                    'X-Title': 'NEKOplay Castle Quiz'
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
                return JSON.parse(aiRawText);
            }
        }

        // Вызываем ошибку, если ключей нет или обе попытки провалились
        throw new Error("API ключи не найдены или серверы нейросетей недоступны.");

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // 3. ПРЕДОХРАНИТЕЛЬ: Возвращаем "заглушку", чтобы игра не зависла намертво на экране загрузки
        return {
            question: `[Системный сбой API] Какой город является столицей Франции? (Твоя тема была: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Это резервный вопрос. Возникли проблемы с доступом к нейросети или ключами API, поэтому игра подставила экстренный вопрос, чтобы вы могли продолжить."
        };
    }
}