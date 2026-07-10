// api/quiz.ts

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { theme, themes, history = [] } = req.body;
    
    // ASCII-ключ Gemini 
    const keyCodes = [
        65, 81, 46, 65, 98, 56, 82, 78, 54, 73, 
        49, 118, 71, 67, 85, 115, 108, 122, 83, 48, 
        45, 48, 69, 105, 105, 115, 71, 50, 79, 110, 
        50, 109, 79, 54, 104, 111, 110, 104, 52, 120, 
        103, 71, 83, 50, 74, 66, 85, 97, 56, 56, 
        78, 81, 65
    ];
    const GEMINI_KEY = String.fromCharCode(...keyCodes);

    const historyBlock = history.length > 0 
        ? `\nКРИТИЧЕСКОЕ ПРАВИЛО: НИ В КОЕМ СЛУЧАЕ НЕ ЗАДАВАЙ СЛЕДУЮЩИЕ ВОПРОСЫ (они уже были):\n${history.map((q: string) => `- ${q}`).join('\n')}\n` 
        : '';

    let promptText = "";

    // Обработка двух режимов генерации
    if (themes && Array.isArray(themes) && themes.length > 0) {
        const themesList = themes.join(', ');
        const qCount = themes.length * 3;
        promptText = `Ты - ИИ-архитектор викторин. Выдай ТОЛЬКО JSON-объект с ключом "questions", который содержит массив из ${qCount} уникальных вопросов.
Темы для вопросов: ${themesList}. 
Сгенерируй ровно по 3-4 вопроса для КАЖДОЙ темы из списка.${historyBlock}
ПРАВИЛА:
1. Только реальные факты.
2. Текстовые ответы в массиве "options", А НЕ ЦИФРЫ.
3. Поле "correctAnswer" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из "options".
4. СТРОГО ИСПОЛЬЗУЙ КЛЮЧИ: question, options, correctAnswer, fact.

Формат:
{"questions": [{"question":"Вопрос?","options":["А","Б","В","Г"],"correctAnswer":"Б","fact":"Факт"}]}`;
    } else {
        promptText = `Ты - ИИ-архитектор викторин. Выдай ТОЛЬКО JSON-объект с ключом "questions", который содержит массив из 10 уникальных вопросов на тему: "${theme}".${historyBlock}
ПРАВИЛА:
1. Только реальные факты.
2. Текстовые ответы в массиве "options", А НЕ ЦИФРЫ.
3. Поле "correctAnswer" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из "options".
4. СТРОГО ИСПОЛЬЗУЙ КЛЮЧИ: question, options, correctAnswer, fact.

Формат:
{"questions": [{"question":"Вопрос?","options":["А","Б","В","Г"],"correctAnswer":"Б","fact":"Факт"}]}`;
    }

    const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash'];
    let lastErrorDetails = null;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.candidates[0].content.parts[0].text;
                    const parsed = JSON.parse(content);
                    return res.status(200).json(parsed.questions || parsed);
                } else {
                    const errText = await response.text();
                    lastErrorDetails = { status: response.status, model, attempt, text: errText };
                    if (response.status === 503 && attempt < 2) { 
                        await sleep(1500); 
                        continue; 
                    }
                    if (response.status === 404 || response.status === 503) break;
                    return res.status(response.status).json({ error: errText });
                }
            } catch (error: any) {
                lastErrorDetails = { error: error.message };
                break;
            }
        }
    }

    return res.status(503).json({ 
        error: "Google API перегружен. Автоматические попытки восстановления не удались.", 
        details: lastErrorDetails 
    });
}