// src/lib/ai.ts

export async function generateQuizQuestion(theme: string) {
    try {
        console.log("Отправляем запрос на наш бесплатный Vercel API...");
        
        // Запрос идет на твой собственный бекенд (api/quiz.js)
        const response = await fetch("/api/quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ theme })
        });

        if (!response.ok) {
            throw new Error(`Ошибка Vercel сервера: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Извлекаем ответ нейросети
        let aiRawText = data.choices[0].message.content.trim();

        // Очищаем от случайного markdown (```json ... ```)
        if (aiRawText.startsWith('```')) {
            aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        console.log("Вопрос успешно сгенерирован!");
        return JSON.parse(aiRawText);

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // Надежная заглушка: если API отвалится, игра не зависнет на вечной загрузке
        return {
            question: `[Временные неполадки сети] Какой город является столицей Франции? (Твоя тема была: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Возникла проблема с доступом к бесплатному серверу ИИ. Убедитесь, что ключ API добавлен в настройки Vercel."
        };
    }
}