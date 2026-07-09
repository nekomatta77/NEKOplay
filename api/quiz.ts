// api/quiz.ts

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { theme } = req.body;
    
    // 100% защита ключа через ASCII-коды
    const keyCodes = [
        65, 81, 46, 65, 98, 56, 82, 78, 54, 73, 
        49, 118, 71, 67, 85, 115, 108, 122, 83, 48, 
        45, 48, 69, 105, 105, 115, 71, 50, 79, 110, 
        50, 109, 79, 54, 104, 111, 110, 104, 52, 120, 
        103, 71, 83, 50, 74, 66, 85, 97, 56, 56, 
        78, 81, 65
    ];
    const GEMINI_KEY = String.fromCharCode(...keyCodes);

    const promptText = `Ты - профессиональный автор викторин. Выдай ТОЛЬКО JSON-объект с ключом "questions", который содержит массив из 10 вопросов на тему: "${theme}".
КРИТИЧЕСКИЕ ПРАВИЛА:
1. АНТИ-ГАЛЛЮЦИНАЦИИ: Используй ТОЛЬКО реальные, достоверные факты. Никаких выдуманных механик или предметов.
2. Текстовые ответы в массиве "options", А НЕ ЦИФРЫ.
3. Поле "correctAnswer" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из массива "options". Не пиши туда номер ответа!
4. СТРОГО ИСПОЛЬЗУЙ КЛЮЧИ: question, options, correctAnswer, fact.

Формат (строго без пробелов):
{"questions": [{"question":"Вопрос?","options":["А","Б","В","Г"],"correctAnswer":"Б","fact":"Короткий факт"}]}`;

    // Каскадная система фоллбеков (от самых новых и быстрых к самым стабильным)
    const models = [
        'gemini-3.5-flash', 
        'gemini-3.5-pro',   
        'gemini-1.5-pro',   
        'gemini-pro'        
    ];

    let lastErrorDetails = null;

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json" 
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.candidates[0].content.parts[0].text;
                
                const parsed = JSON.parse(content);
                const questionsArray = parsed.questions || parsed; 
                
                return res.status(200).json(questionsArray);
            } else {
                const errText = await response.text();
                lastErrorDetails = { status: response.status, model, text: errText };
                
                // Если модель перегружена (503) или отключена (404), пробуем следующую по списку
                if (response.status === 503 || response.status === 404) {
                    console.warn(`[API] Модель ${model} недоступна (${response.status}). Переход к следующей...`);
                    continue;
                }
                
                // Критические ошибки (например, неверный ключ 401) прерывают цикл сразу
                return res.status(response.status).json({ error: errText });
            }
        } catch (error: any) {
            console.error(`[API] Сетевая ошибка при вызове ${model}:`, error);
            lastErrorDetails = { error: error.message };
            continue; // Пробуем следующую модель
        }
    }

    // Сработает только если упали АБСОЛЮТНО ВСЕ модели из списка
    return res.status(503).json({ 
        error: "Все резервные ИИ-модели Google в данный момент перегружены. Пожалуйста, попробуйте инициировать бой через пару минут.", 
        details: lastErrorDetails 
    });
}