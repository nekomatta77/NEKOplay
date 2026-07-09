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
    try {
        console.log(`⚡ Запрашиваем ИИ через внутренний Vercel API...`);
        
        // Обращаемся к НАШЕМУ серверу (папка api, файл quiz.js). CORS физически невозможен.
        const response = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme })
        });

        if (!response.ok) throw new Error(`Internal Server Error: ${response.status}`);

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content?.trim() || "";
        
        let questionsRaw = extractValidQuestionsFromText(text);

        if (!questionsRaw || questionsRaw.length === 0) {
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
        return validQuestions.slice(0, 10); 

    } catch (error) {
        console.warn("🛡️ Ошибка парсинга или сети. Возвращаем пустой массив.", error);
        return []; 
    }
}