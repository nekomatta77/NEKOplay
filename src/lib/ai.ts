// src/lib/ai.ts

export async function generateQuizBatch(theme: string) {
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    const getFallback = () => Array(7).fill(null).map((_, i) => ({
        question: `[Резервный протокол] Вопрос №${i + 1} по теме: "${theme}"?`,
        options: ["Сбой сети", "Отсутствие сигнала", "Перегрузка API", "Отказ сервера"],
        correctAnswer: "Перегрузка API",
        fact: "Связь с нейросетью нестабильна. Используется автономный пул вопросов."
    }));

    const systemPrompt = `Ты — профессиональный редактор интеллектуальных игр.
Твоя задача — составить 7 сложных, интересных вопросов на тему: "${theme}".

КРИТЕРИИ:
1. Безупречный литературный русский язык.
2. Вопросы на эрудицию, логику.
3. Поле 'fact' должно содержать интересный факт.
4. 100% достоверность.

ФОРМАТ:
Верни СТРОГО валидный JSON-массив. Без markdown. Без приветствий.
Пример:
[
  {
    "question": "Текст вопроса?",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswer": "Вариант 2",
    "fact": "Интересный факт."
  }
]`;

    try {
        console.log("Запрашиваем нейросеть (Ультимативный парсер)...");
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Тема: "${theme}". Верни только JSON-массив из 7 вопросов.` }
                ],
                model: 'openai', 
                seed: randomSeed
            })
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        let text = await response.text();
        console.log("Ответ получен. Запуск многоуровневой очистки...");

        let parsedData: any = null;

        // УРОВЕНЬ 1: Очистка от маркдауна
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        // УРОВЕНЬ 2: Снятие "стрингификации" (Исправление той самой ошибки с '\')
        // Если ИИ обернул весь массив в строку и заэкранировал кавычки ("[{...}]")
        if (text.startsWith('"') && text.endsWith('"')) {
            try {
                // Парсим один раз, чтобы превратить строку в нормальный текст и убрать слэши
                text = JSON.parse(text); 
            } catch (e) {
                // Игнорируем, если это не помогло
            }
        }

        // УРОВЕНЬ 3: Умный захват и парсинг
        try {
            // Пробуем идеальный сценарий
            parsedData = JSON.parse(text);
        } catch (e) {
            // Если ИИ добавил текст до/после JSON или оставил висячую запятую
            const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            
            if (arrMatch) {
                // Удаляем висячие запятые перед закрывающими скобками (пример: [{"a":1},] -> [{"a":1}])
                const cleanArr = arrMatch[0].replace(/,\s*([\]}])/g, '$1');
                parsedData = JSON.parse(cleanArr);
            } else {
                // Последняя надежда: грубый индексный поиск
                const start = text.indexOf('[');
                const end = text.lastIndexOf(']');
                if (start !== -1 && end !== -1 && start < end) {
                    const extracted = text.substring(start, end + 1).replace(/,\s*([\]}])/g, '$1');
                    parsedData = JSON.parse(extracted);
                } else {
                    throw new Error("Не удалось найти структуру массива в ответе");
                }
            }
        }

        // УРОВЕНЬ 4: Поиск массива внутри структуры
        let questionsRaw: any[] = [];
        if (Array.isArray(parsedData)) {
            questionsRaw = parsedData;
        } else if (parsedData && typeof parsedData === 'object') {
            // Если ИИ всё-таки решил обернуть массив в объект
            if (Array.isArray(parsedData.questions)) {
                questionsRaw = parsedData.questions;
            } else {
                // Ищем любой массив внутри объекта
                const possibleArray = Object.values(parsedData).find(val => Array.isArray(val));
                if (possibleArray) questionsRaw = possibleArray as any[];
            }
        }

        if (!questionsRaw || questionsRaw.length === 0) {
            throw new Error("Массив вопросов оказался пуст после парсинга");
        }

        console.log(`Успешно распознано вопросов: ${questionsRaw.length}.`);

        // УРОВЕНЬ 5: Нормализация и защита от читов
        const validQuestions = questionsRaw.map((q: any) => {
            let options = Array.isArray(q.options) ? [...q.options] : ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"];
            
            while(options.length < 4) options.push(`Доп. вариант ${options.length + 1}`);
            if (options.length > 4) options.length = 4;

            const correct = q.correctAnswer || options[0];
            if (!options.includes(correct)) options[Math.floor(Math.random() * 4)] = correct; 

            // Рандомизируем варианты ответов
            options = options.sort(() => Math.random() - 0.5);

            return {
                question: q.question || "Вопрос поврежден при передаче данных?",
                options: options,
                correctAnswer: correct,
                fact: q.fact || "Интересный факт утерян в процессе дешифровки."
            };
        });

        return validQuestions.slice(0, 7);

    } catch (error) {
        console.error('Критическая ошибка ИИ:', error);
        return getFallback();
    }
}