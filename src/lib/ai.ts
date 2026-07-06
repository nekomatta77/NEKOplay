// src/lib/ai.ts

export async function generateQuizQuestion(theme: string) {
    try {
        // Делаем безопасный запрос к нашему собственному серверу на Vercel
        // Это решает проблему CORS и скрывает API-ключи от игроков
        const response = await fetch("/api/quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ theme })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();

        // Проверяем, вернул ли наш сервер внутреннюю ошибку OpenRouter
        if (data.error) {
            throw new Error(data.error);
        }

        // Извлекаем текст ответа из структуры OpenRouter
        let aiRawText = data.choices[0].message.content.trim();

        // Очищаем от случайного markdown (```json ... ```), если ИИ все же его добавил
        if (aiRawText.startsWith('```')) {
            aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        // Парсим строку в полноценный JavaScript объект
        const quizData = JSON.parse(aiRawText);
        return quizData;

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        return null;
    }
}