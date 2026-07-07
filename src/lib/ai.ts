// src/lib/ai.ts

export async function generateQuizQuestion(theme: string) {
    // Формируем жесткий промпт, чтобы ИИ не болтал лишнего
    const prompt = `Ты профессиональный генератор вопросов для интеллектуальной викторины. Составь ровно 1 интересный вопрос по теме: "${theme}". 
    Ответь СТРОГО в формате JSON. Никаких приветствий, никакого текста до или после. Не используй markdown-разметку (без \`\`\`json). Только сам объект!
    Формат: {"question": "Текст вопроса", "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"], "correctAnswer": "Правильный вариант (должен совпадать с одним из вариантов)", "fact": "Интересный факт"}`;

    try {
        console.log("Запрашиваем бесплатную нейросеть Pollinations (без ключей)...");
        
        // Отправляем прямой GET-запрос к бесплатной нейросети
        const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        let aiRawText = await response.text();
        aiRawText = aiRawText.trim();
        
        // На всякий случай очищаем от случайного markdown, если ИИ его всё же вставил
        if (aiRawText.startsWith('```')) {
            aiRawText = aiRawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        console.log("Вопрос успешно сгенерирован!");
        return JSON.parse(aiRawText);

    } catch (error) {
        console.error('Ошибка генерации викторины:', error);
        
        // Железобетонный резерв, чтобы игра не ломалась, если пропадет интернет
        return {
            question: `[Офлайн режим] Какой город является столицей Франции? (Твоя тема была: ${theme})`,
            options: ["Лондон", "Париж", "Берлин", "Мадрид"],
            correctAnswer: "Париж",
            fact: "Нейросеть не смогла ответить, поэтому мы выдали резервный вопрос, чтобы вы могли продолжить игру!"
        };
    }
}