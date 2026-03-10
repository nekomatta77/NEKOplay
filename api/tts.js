// Файл: api/tts.js

export default async function handler(req, res) {
    // 1. Получаем текст из запроса игры
    const { text } = req.query;
    
    if (!text) {
        return res.status(400).json({ error: "Нет текста для озвучки" });
    }

    try {
        // 2. Обращаемся к качественному движку (StreamElements, голос Maxim)
        // В будущем ты сможешь поменять эту ссылку на ElevenLabs, если захочешь
        const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Maxim&text=${encodeURIComponent(text)}`;
        
        const response = await fetch(ttsUrl);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервиса: ${response.statusText}`);
        }
        
        // 3. Скачиваем аудиофайл как "буфер" (набор байтов)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Отправляем звук обратно в браузер игры, разрешая все CORS-политики
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Кэшируем на сутки, чтобы не грузить сервер
        
        res.send(buffer);
    } catch (error) {
        console.error("[TTS API Error]:", error);
        res.status(500).json({ error: "Не удалось сгенерировать голос" });
    }
}