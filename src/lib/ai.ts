// src/lib/ai.ts

export const generateQuizBatch = async (payload: { theme?: string, themes?: string[], history?: string[] }) => {
    try {
        const response = await fetch('/api/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
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