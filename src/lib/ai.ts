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

    const systemPrompt = `Ты - генератор викторин. Выдай ТОЛЬКО JSON-массив из 5 вопросов на тему: "${theme}".
Формат:
[{"question":"?","options":["1","2","3","4"],"correctAnswer":"2","fact":"!"}]
Без разметки, без текста.`;

    // ГЛАВНЫЙ ФИКС: Увеличиваем тайм-аут до 25 секунд.
    // Раньше было 7 секунд, и скрипт просто убивал ИИ до того, как тот успевал дописать вопросы!
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); 

    try {
        console.log(`⚡ Запрашиваем ИИ (God-Mode v12.0 - Extended Timeout)... Ожидание до 25 секунд.`);
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". ID: ${Date.now()}. Только JSON массив.` }
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

        if (!questionsRaw || questionsRaw.length === 0) {
            console.error("RAW TEXT (провал извлечения):", text.substring(0, 200));
            throw new Error("Empty Array");
        }

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

        console.log(`✅ ИИ успешно сгенерировал вопросов: ${validQuestions.length}`);
        return validQuestions.slice(0, 5);

    } catch (error) {
        clearTimeout(timeoutId);
        console.warn("🛡️ API недоступно или не успело ответить за 25 секунд. Возвращаем пустой массив.");
        // Возвращаем строго пустой массив без резервных локальных вопросов (как ты и просил)
        return []; 
    }
}