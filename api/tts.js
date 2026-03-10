export default async function handler(req, res) {
    const { text } = req.query;
    if (!text) return res.status(400).json({ error: "Нет текста" });

    try {
        // Используем Google TTS (он звучит мягче и имеет хорошие интонации)
        const ttsUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ru&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(ttsUrl);
        if (!response.ok) throw new Error(`Ошибка сервиса: ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (error) {
        console.error("[TTS API Error]:", error);
        res.status(500).json({ error: "Ошибка генерации голоса" });
    }
}