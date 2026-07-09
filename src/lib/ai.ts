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
                // Поддержка и старых (question), и новых сжатых (q) ключей
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
            if (char === '{') {
                stack.push(i); 
            } else if (char === '}') {
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

    // ВЕРСИЯ 15.0: Жесткая компрессия JSON и запрет галлюцинаций
    const systemPrompt = `Ты - строгий генератор викторин. Тема: "${theme}".
ВЫДАЙ РОВНО 5 ВОПРОСОВ. Ни больше, ни меньше.
КРИТИЧЕСКИЕ ПРАВИЛА:
1. АНТИ-ГАЛЛЮЦИНАЦИИ: 100% достоверность! ЗАПРЕЩЕНО выдумывать несуществующие предметы (например "шар землетрясения" в Minecraft - это бред). Используй ТОЛЬКО реальные факты (в играх - только ванильные механики).
2. Текстовые ответы в массиве "o", А НЕ ЦИФРЫ.
3. "c" - точный правильный текстовый ответ.
4. Для обхода лимита символов сервера используй ТОЛЬКО ключи: q, o, c, f.

Формат (строго без пробелов):
[{"q":"Вопрос?","o":["А","Б","В","Г"],"c":"Б","f":"Короткий факт"}]`;

    try {
        console.log(`⚡ Запрашиваем ИИ (God-Mode v15.0 - Compression & Anti-Hallucination)...`);
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". ID: ${Date.now()}. Жду сжатый JSON массив из 5 вопросов.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true
            })
        });

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
            console.error("RAW TEXT (провал извлечения):", text.substring(0, 200));
            throw new Error("Empty Array");
        }

        // РАСПАКОВКА: Превращаем сжатые ключи обратно в нормальные, понятные игре
        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options || q.o) ? [...(q.options || q.o)] : ["Вариант А", "Вариант Б", "В", "Г"];
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;
            
            options = options.map(opt => String(opt));

            let correct = String(q.correctAnswer || q.c || options[0]);

            if (/^[0-9]+$/.test(correct)) {
                const idx = parseInt(correct, 10) - 1;
                if (idx >= 0 && idx < options.length) {
                    correct = options[idx];
                }
            }

            if (!options.includes(correct)) {
                correct = options[0];
            }

            // Рандомизация позиций (Фишер-Йетс)
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
        return validQuestions.slice(0, 5); 

    } catch (error) {
        console.warn("🛡️ Ошибка парсинга или сети. Возвращаем пустой массив.", error);
        return []; 
    }
}