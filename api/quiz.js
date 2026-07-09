// api/quiz.js

export default async function handler(req, res) {
    // Разрешаем только POST-запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { theme } = req.body;
    
    // Твой зашифрованный ключ Cerebras
    const CEREBRAS_KEY_BASE64 = "Y3NrLTk1ZDZodzZrNW53aGVyeXJjZXJwbXYzcmt0bXR5cGZ5Yzg5dHB2OGttMjI1cmtwbg==";
    // Расшифровываем ключ для сервера (в Node.js используется Buffer)
    const CEREBRAS_KEY = Buffer.from(CEREBRAS_KEY_BASE64, 'base64').toString('utf8');

    const systemPrompt = `Ты - профессиональный автор викторин. Выдай ТОЛЬКО JSON-массив из 10 вопросов на тему: "${theme}".
КРИТИЧЕСКИЕ ПРАВИЛА:
1. АНТИ-ГАЛЛЮЦИНАЦИИ: Используй ТОЛЬКО реальные, достоверные факты. Никаких выдуманных механик или предметов.
2. Текстовые ответы в массиве "options", А НЕ ЦИФРЫ.
3. Поле "correctAnswer" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из массива "options". Не пиши туда номер ответа!
4. СТРОГО ИСПОЛЬЗУЙ КЛЮЧИ: question, options, correctAnswer, fact.

Формат (строго без пробелов):
[{"question":"Вопрос?","options":["А","Б","В","Г"],"correctAnswer":"Б","fact":"Короткий факт"}]`;

    try {
        // Серверный запрос к Cerebras (здесь не бывает CORS!)
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CEREBRAS_KEY}`
            },
            body: JSON.stringify({
                model: "llama3.1-70b", 
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Только JSON массив из 10 вопросов.` }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }

        const data = await response.json();
        // Отправляем успешный ответ обратно в твою игру
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}