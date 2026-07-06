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
        
        const apiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
            ? process.env.GEMINI_API_KEY 
            : (import.meta.env as any).VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === "undefined") {
            throw new Error("API ключ Gemini не найден!");
        }

        // ИСПОЛЬЗУЕМ gemini-pro — она доступна всем аккаунтам без ограничений
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ошибка Gemini API: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        let aiRawText = data.candidates[0].content.parts[0].text.trim();
        
        // Очищаем от случайного markdown (```json ... ```), который любит вставлять ИИ
        if (aiRawText.startsWith('```')) {
            aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        console.log("Вопрос успешно сгенерирован!");
        return JSON.parse(aiRawText);

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        return {
            question: `[Резервный вопрос] Какой город является столицей Франции? (Тема: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Запрос к Gemini API не прошел из-за ограничений сети, мы выдали экстренный вопрос!"
        };
    }
}