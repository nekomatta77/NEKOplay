// Этот код выполняется на серверах Vercel, никто из игроков его не увидит
export const config = {
    runtime: 'edge', // Используем Edge для быстрой потоковой передачи текста (стриминга)
};

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const body = await req.json();

    // Сервер берет твой скрытый ключ и сам стучится в OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.BUNKER_API_KEY}`, // <-- Ключ берется из настроек Vercel!
            'HTTP-Referer': 'https://твой-сайт.vercel.app', 
            'X-Title': 'Bunker Game'
        },
        body: JSON.stringify(body)
    });

    // Отдаем потоковый ответ обратно в игру
    return new Response(response.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}