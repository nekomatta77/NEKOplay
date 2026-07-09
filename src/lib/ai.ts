// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Резервный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ сервера"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    const systemPrompt = `Ты — профессиональный редактор интеллектуальных игр и строгий JSON-генератор.
Твоя задача — составить 7 сложных, интересных вопросов на тему: "${theme}".

КРИТЕРИИ:
1. Безупречный литературный русский язык.
2. Вопросы на эрудицию, логику.
3. Поле 'fact' должно содержать интересный факт, объясняющий правильный ответ.
4. 100% достоверность.
5. РОВНО 7 вопросов.

ФОРМАТ ВЫВОДА:
Верни СТРОГО валидный JSON-массив. НИКАКОГО дополнительного текста до или после массива. Никаких приветствий, markdown-разметки или пояснений. Только квадратные скобки и объекты внутри.
[
  {
    "question": "Текст вопроса?",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswer": "Вариант 2",
    "fact": "Интересный факт."
  }
]`;

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер v2.0)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Жду ТОЛЬКО JSON-массив из 7 вопросов. Без маркдауна.` }
                ],
                model: 'openai', 
                seed: randomSeed,
                jsonMode: true // Форсируем вывод в формате JSON (поддерживается многими LLM)
            })
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        let text = await response.text();
        console.log("Ответ получен. RAW TEXT (первые 150 символов):", text.substring(0, 150).replace(/\n/g, '\\n'));
        console.log("Запуск многоуровневой очистки...");

        let parsedData: any = null;

        // УРОВЕНЬ 1: Очистка от маркдауна (если ИИ все же его добавил)
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        // УРОВЕНЬ 2: Жесткое извлечение массива
        // Ищем первую открывающую и последнюю закрывающую скобки массива
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            let jsonString = text.substring(firstBracket, lastBracket + 1);
            
            // Санитизация 1: Убираем висячие запятые перед закрывающими скобками (частая ошибка LLM)
            jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
            
            // Санитизация 2: Убиваем реальные переносы строк, так как они ломают JSON.parse внутри строковых значений
            jsonString = jsonString.replace(/\n/g, ' '); 
            jsonString = jsonString.replace(/\r/g, '');
            
            try {
                parsedData = JSON.parse(jsonString);
            } catch (e) {
                console.warn("Первичный парсинг массива не удался, пробуем объект...", e);
            }
        } 
        
        // УРОВЕНЬ 3: Резервный поиск объекта (если ИИ завернул массив в { "questions": [...] })
        if (!parsedData) {
             const firstBrace = text.indexOf('{');
             const lastBrace = text.lastIndexOf('}');
             if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                 let jsonString = text.substring(firstBrace, lastBrace + 1);
                 jsonString = jsonString.replace(/,\s*([\]}])/g, '$1').replace(/\n/g, ' ');
                 try {
                     parsedData = JSON.parse(jsonString);
                 } catch(e) {
                     throw new Error("Сбой критического парсинга: структура JSON безнадежно повреждена.");
                 }
             } else {
                 throw new Error("В ответе ИИ отсутствуют структуры массива [] или объекта {}.");
             }
        }

        // УРОВЕНЬ 4: Локализация массива внутри распарсенных данных
        let questionsRaw: any[] = [];
        if (Array.isArray(parsedData)) {
            questionsRaw = parsedData;
        } else if (parsedData && typeof parsedData === 'object') {
            if (Array.isArray(parsedData.questions)) {
                questionsRaw = parsedData.questions;
            } else if (Array.isArray(parsedData.data)) {
                questionsRaw = parsedData.data;
            } else {
                const possibleArray = Object.values(parsedData).find(val => Array.isArray(val));
                if (possibleArray) questionsRaw = possibleArray as any[];
            }
        }

        if (!questionsRaw || questionsRaw.length === 0) {
            console.error("Распарсенные данные (пустые):", parsedData);
            throw new Error("Массив вопросов оказался пуст после парсинга");
        }

        console.log(`Успешно распознано вопросов: ${questionsRaw.length}. Производим нормализацию...`);

        // УРОВЕНЬ 5: Нормализация данных и защита от логических ошибок ИИ
        const validQuestions = questionsRaw.map((q: any, index: number) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            // Защита от пустых ответов
            options = options.filter(opt => opt && String(opt).trim() !== "");
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            
            // Если ИИ забыл добавить правильный ответ в массив вариантов
            if (!options.includes(correct)) {
                options[Math.floor(Math.random() * 4)] = correct; 
            }

            options = options.map(opt => String(opt));

            // Правильная рандомизация вариантов ответов (Алгоритм Фишера-Йетса)
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: q.question || `Вопрос №${index + 1} поврежден при передаче данных?`,
                options: options,
                correctAnswer: String(correct),
                fact: q.fact || "Интересный факт утерян в процессе дешифровки."
            };
        });

        return validQuestions.slice(0, 7); // Гарантируем возврат ровно 7 вопросов

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback(); // Автоматически переходим на локальные вопросы без падения игры
    }
}