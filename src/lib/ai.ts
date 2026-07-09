// src/lib/ai.ts

// --- АБСОЛЮТНАЯ ЗАЩИТА: Посимвольный извлекатель целых объектов ---
function extractValidQuestionsFromText(text: string): any[] {
    const results: any[] = [];
    
    // 1. Попытка рекурсивного парсинга целого объекта
    try {
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        function deepSearch(obj: any) {
            if (!obj) return;
            if (Array.isArray(obj)) {
                obj.forEach(deepSearch);
            } else if (typeof obj === 'object') {
                if (obj.question && Array.isArray(obj.options)) {
                    results.push(obj);
                } else {
                    Object.values(obj).forEach(deepSearch);
                }
            }
        }
        deepSearch(parsed);
        
        if (results.length > 0) return results;
    } catch (e) {
        // Переход к стековому сканеру при обрыве текста
    }

    // 2. Стековый сканер (вырезает уцелевшие объекты из сломанного JSON)
    let stack: number[] = [];
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') {
                stack.push(i); 
            } else if (char === '}') {
                if (stack.length > 0) {
                    const startIndex = stack.pop()!;
                    const objStr = text.substring(startIndex, i + 1);
                    try {
                        const cleanStr = objStr.replace(/\n/g, ' ').replace(/\r/g, '').replace(/,\s*([\]}])/g, '$1');
                        const parsed = JSON.parse(cleanStr);
                        
                        if (parsed && parsed.question && Array.isArray(parsed.options)) {
                            if (!results.some(q => q.question === parsed.question)) {
                                results.push(parsed);
                            }
                        }
                    } catch (e) {}
                }
            }
        }
    }
    
    return results;
}

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);

    const systemPrompt = `Ты - API-сервер. Выдаешь ТОЛЬКО JSON-массив из 5 вопросов на тему: "${theme}".
ЗАПРЕЩЕНО использовать рассуждения, reasoning, thinking или писать любой текст кроме JSON.
Поле fact должно содержать ровно 1 короткое предложение.

СТРОГИЙ ФОРМАТ:
[
  {
    "question": "Вопрос?",
    "options": ["Ответ 1", "Ответ 2", "Ответ 3", "Ответ 4"],
    "correctAnswer": "Ответ 2",
    "fact": "Факт."
  }
]`;

    // ЖЕСТКИЙ ТАЙМ-АУТ: 7 секунд (Чтобы игра никогда не висла на live-сервере)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); 

    try {
        console.log("⚡ Запрашиваем ИИ (God-Mode v11.1 - No Local Backup)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Уникальный запрос: ${Date.now()}. Только JSON.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId); 

        if (!response.ok) throw new Error("API Limit");

        let text = await response.text();
        
        // Попытка снять обертку API
        try {
            const apiResponse = JSON.parse(text);
            if (apiResponse && typeof apiResponse === 'object') {
                if (typeof apiResponse.content === 'string') text = apiResponse.content;
                else if (apiResponse.choices?.[0]?.message?.content) text = apiResponse.choices[0].message.content;
            }
        } catch (e) {}

        let questionsRaw = extractValidQuestionsFromText(text);

        if (questionsRaw.length === 0) {
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    const parsed = JSON.parse(match[0].replace(/,\s*([\]}])/g, '$1'));
                    if (Array.isArray(parsed) && parsed.length > 0) questionsRaw = parsed;
                } catch(e) {}
            }
        }

        if (!questionsRaw || questionsRaw.length === 0) throw new Error("Empty Array");

        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "В", "Г"];
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            if (!options.includes(correct)) options[Math.floor(Math.random() * 4)] = correct; 

            options = options.map(opt => String(opt));

            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Сбой дешифровки #${index + 1}`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Факт утерян."
            };
        });

        return validQuestions.slice(0, 5);

    } catch (error) {
        clearTimeout(timeoutId);
        console.warn("🛡️ API недоступно или долго отвечает. Возвращаем пустой массив.");
        return []; // Возвращаем пустой массив, а фронтенд сам разберется и подставит 1 системный вопрос
    }
}