// Этот код выполняется на серверах Vercel, никто из игроков его не увидит
export const config = {
    runtime: 'edge', // Используем Edge для быстрой потоковой передачи текста (стриминга)
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const body = await req.json();

        // Защита: проверяем, установлен ли ключ в настройках Vercel
        if (!process.env.BUNKER_API_KEY) {
            return new Response(JSON.stringify({ error: "Ключ BUNKER_API_KEY не задан в переменных окружения Vercel!" }), { status: 500 });
        }

        // Сервер берет твой скрытый ключ и сам стучится в OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BUNKER_API_KEY}`,
                'HTTP-Referer': 'https://cool-c4t.vercel.app', // Опционально: домен вашего проекта
                'X-Title': 'Bunker Game Simulation'
            },
            body: JSON.stringify(body)
        });

        // Если OpenRouter упал или вернул ошибку модели, мы логируем это
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", response.status, errorText);
            return new Response(`OpenRouter Error: ${response.status} - ${errorText}`, { status: response.status });
        }

        // Отдаем потоковый ответ обратно в игру
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        return new Response(`Server error: ${error.message}`, { status: 500 });
    }
}