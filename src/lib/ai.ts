// src/lib/ai.ts

/**
 * Отправляет запрос на наш внутренний API (api/quiz) для генерации вопросов.
 * Ключи и запросы к нейросети происходят на сервере, клиент получает только готовый JSON.
 */
export const generateQuizBatch = async (theme: string) => {
    try {
        const response = await fetch('/api/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme })
        });

        if (!response.ok) {
            console.error("Ошибка при получении вопросов от API:", await response.text());
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка сети или сервера во время генерации:", error);
        return null;
    }
};