// src/lib/ai.ts

// --- АБСОЛЮТНАЯ ЗАЩИТА: Посимвольный извлекатель целых объектов ---
function extractValidQuestionsFromText(text: string): any[] {
    const results: any[] = [];
    
    try {
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        function deepSearch(obj: any) {
            if (!obj) return;
            if (Array.isArray(obj)) {
                obj.forEach(deepSearch);
            } else if (typeof obj === 'object') {
                if ((obj.question || obj.q) && Array.isArray(obj.options || obj.o)) {
                    results.push(obj);
                } else {
                    Object.values(obj).forEach(deepSearch);
                }
            }
        }
        deepSearch(parsed);
        
        if (results.length > 0) return results;
    } catch (e) {}

    let stack: number[] = [];
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') stack.push(i);
            else if (char === '}') {
                if (stack.length > 0) {
                    const startIndex = stack.pop()!;
                    const objStr = text.substring(startIndex, i + 1);
                    try {
                        const cleanStr = objStr.replace(/\n/g, ' ').replace(/\r/g, '').replace(/,\s*([\]}])/g, '$1');
                        const parsed = JSON.parse(cleanStr);
                        
                        if (parsed && (parsed.question || parsed.q) && Array.isArray(parsed.options || parsed.o)) {
                            if (!results.some(q => (q.question || q.q) === (parsed.question || parsed.q))) {
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

    // Запрашиваем ровно 7 вопросов. Это гарантирует, что ИИ не оборвет текст на половине, 
    // и нам не придется спамить сервер двойными запросами.
    const systemPrompt = `Ты - генератор викторин. Выдай ТОЛЬКО JSON-массив из 7 вопросов на тему: "${theme}".
КРИТИЧЕСКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО достоверные факты. Никаких выдуманных механик или предметов.
2. Текстовые ответы в массиве "o", А НЕ ЦИФРЫ.
3. Поле "c" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из "o".
4. СТРОГО ИСПОЛЬЗУЙ КЛЮЧИ: q, o, c, f.

Формат:
[{"q":"Вопрос?","o":["А","Б","В","Г"],"c":"Б","f":"Короткий факт"}]`;

    try {
        console.log(`⚡ Запрашиваем ИИ (God-Mode v19.1 - Safe GET Fetch)... Ждем партию вопросов.`);
        
        // Одинарный GET-запрос: не вызывает 429 Too Many Requests, не вызывает CORS, не требует ключей.
        const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(systemPrompt)}?model=openai&json=true&seed=${randomSeed}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        let text = await response.text();
        
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

        if (!questionsRaw || questionsRaw.length === 0) {
            console.error("RAW TEXT:", text.substring(0, 200));
            throw new Error("Empty Array");
        }

        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options || q.o) ? [...(q.options || q.o)] : ["Вариант А", "Вариант Б", "В", "Г"];
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;
            options = options.map(opt => String(opt));

            let correct = String(q.correctAnswer || q.c || options[0]);

            if (/^[0-9]+$/.test(correct)) {
                const idx = parseInt(correct, 10) - 1;
                if (idx >= 0 && idx < options.length) correct = options[idx];
            }

            if (!options.includes(correct)) correct = options[0];

            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: String(q.question || q.q || `Сбой дешифровки #${index + 1}`),
                options: options,
                correctAnswer: correct,
                fact: String(q.fact || q.f || "Факт утерян.")
            };
        });

        console.log(`✅ ИИ успешно сгенерировал вопросов: ${validQuestions.length}`);
        return validQuestions;
        
    } catch (e) {
        console.warn("🛡️ Сервер ИИ недоступен или перегружен. Возвращаем пустой массив.", e);
        return []; 
    }
}