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
        console.log("Отправляем прямой запрос в Google Gemini API...");
        
        // Достаем ключ напрямую (используя твой проброс из vite.config.ts или классический VITE_)
        const apiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
            ? process.env.GEMINI_API_KEY 
            : (import.meta.env as any).VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === "undefined") {
            throw new Error("API ключ Gemini не найден!");
        }

        // Прямой запрос к Google API (CORS разрешен Google по умолчанию!)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка Gemini API: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        // Достаем текст ответа и парсим JSON
        const aiRawText = data.candidates[0].content.parts[0].text.trim();
        console.log("Вопрос успешно сгенерирован!");
        return JSON.parse(aiRawText);

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // Железобетонный предохранитель на случай отсутствия ключа
        return {
            question: `[Нет доступа к ИИ] Какой город является столицей Франции? (Тема: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Запрос к Gemini API не прошел. Убедитесь, что бесплатный ключ VITE_GEMINI_API_KEY добавлен в настройки Vercel!"
        };
    }
}