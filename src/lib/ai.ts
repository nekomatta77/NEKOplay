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

    // ИСПРАВЛЕННЫЙ ПРОМПТ: Убраны цифры, добавлены жесткие правила совпадения строк
    const systemPrompt = `Ты - генератор викторин. Выдай ТОЛЬКО JSON-массив из 10 вопросов на тему: "${theme}".
КРИТИЧЕСКИ ВАЖНО:
1. В массиве "options" должны быть полноценные текстовые ответы, а НЕ ЦИФРЫ (1, 2, 3, 4).
2. Поле "correctAnswer" должно ПОЛНОСТЬЮ совпадать с текстом правильного ответа из массива "options". Не пиши туда номер ответа!

Идеальный пример формата:
[{"question":"Столица Франции?","options":["Париж","Лондон","Рим","Берлин"],"correctAnswer":"Париж","fact":"Париж знаменит Эйфелевой башней."}]

Никакого текста до или после JSON. Без markdown.`;

    // УВЕЛИЧЕННЫЙ ТАЙМ-АУТ: 45 секунд для генерации 10 вопросов
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); 

    try {
        console.log(`⚡ Запрашиваем ИИ (God-Mode v13.0 - Text Fix)... Ожидание до 45 секунд.`);
        
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
            throw new Error("Empty Array");
        }

        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "В", "Г"];
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;
            
            options = options.map(opt => String(opt));

            let correct = String(q.correctAnswer || options[0]);

            // ЗАЩИТА 1: Если ИИ всё-таки вернул цифру вместо текста (например, "2" или "3")
            if (/^[0-9]+$/.test(correct)) {
                const idx = parseInt(correct, 10) - 1;
                // Заменяем цифру на реальный текст из массива options
                if (idx >= 0 && idx < options.length) {
                    correct = options[idx];
                }
            }

            // ЗАЩИТА 2: Если текст ответа математически не совпадает ни с одним вариантом
            if (!options.includes(correct)) {
                correct = options[0]; // Принудительно назначаем первый попавшийся ответ правильным, чтобы игра не ломалась
            }

            // Перемешивание (Фишер-Йетс)
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Сбой дешифровки #${index + 1}`,
                options: options,
                correctAnswer: correct,
                fact: q.fact || "Факт утерян."
            };
        });

        console.log(`✅ ИИ успешно сгенерировал вопросов: ${validQuestions.length}`);
        return validQuestions.slice(0, 10); // Выдаем максимум 10 вопросов

    } catch (error) {
        clearTimeout(timeoutId);
        console.warn("🛡️ API недоступно или не успело ответить. Возвращаем пустой массив.");
        return []; 
    }
}