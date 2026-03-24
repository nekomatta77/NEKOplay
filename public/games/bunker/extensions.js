// --- ЛОЖНАЯ ТРЕВОГА ---
let lastThreatId = null;

function checkThreats() {
    const threat = globalState.gameLogic?.activeThreat;
    if (!threat) return;

    if (threat.id !== lastThreatId && threat.type === 'false_alarm') {
        lastThreatId = threat.id;
        
        const fxDiv = document.createElement('div');
        fxDiv.className = 'false-alarm-fx';
        fxDiv.innerHTML = `<div class="false-alarm-text">СИСТЕМНЫЙ СБОЙ</div>`;
        document.body.appendChild(fxDiv);
        document.body.classList.add('shake-screen');

        // Звук сирены (через Web Audio API)
        try {
            const actx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, actx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, actx.currentTime + 0.4);
            osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 0.8);
            
            gain.gain.setValueAtTime(0.3, actx.currentTime);
            osc.connect(gain); gain.connect(actx.destination);
            osc.start();
            
            setTimeout(() => { osc.stop(); actx.close(); }, 3000);
        } catch(e) {}

        // Выключаем через 3 секунды
        setTimeout(() => {
            if (document.body.contains(fxDiv)) document.body.removeChild(fxDiv);
            document.body.classList.remove('shake-screen');
        }, 3000);
    }
}

window.triggerThreat = function(type) {
    if (type === 'false_alarm') {
        const updates = {};
        updates['gameLogic/activeThreat'] = { type: 'false_alarm', id: Date.now() };
        window.parent.postMessage({ type: 'update_state', updates }, '*');
        addLog(`СИСТЕМА: Зафиксировано вмешательство извне.`, "warning");
    }
};

// --- РУЛЕТКА ПРИ НИЧЬЕ ---
let isRoulettePlaying = false;

function playRoulette(rouletteData) {
    if (isRoulettePlaying) return;
    isRoulettePlaying = true;
    
    document.getElementById('roulette-overlay').classList.add('active');
    const track = document.getElementById('roulette-track');
    track.style.transition = 'none';
    track.style.transform = `translateX(0px)`;
    
    const tiedPlayers = rouletteData.tiedPlayers;
    const loserId = rouletteData.loserId;
    
    // Генерируем фейковую ленту из 30 элементов
    const TOTAL_ITEMS = 30;
    const WINNING_INDEX = 25; // Индекс, на котором остановится рулетка
    
    let itemsHTML = '';
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        // На выигрышную позицию ставим проигравшего
        let pid = (i === WINNING_INDEX) ? loserId : tiedPlayers[i % tiedPlayers.length];
        
        let name = globalState.playerNames?.[pid] || "ИГРОК";
        let avatar = globalState.playerAvatars?.[pid] || "";
        
        itemsHTML += `
        <div class="roulette-item">
            <img src="${avatar}" onerror="this.src=''">
            <span>${name}</span>
        </div>`;
    }
    
    track.innerHTML = itemsHTML;
    
    // Даем DOM обновиться
    requestAnimationFrame(() => {
        setTimeout(() => {
            const itemWidth = 120; // Ширина одного элемента из CSS
            // Вычисляем сдвиг: нужно отмотать до 25 элемента и отцентрировать его
            // Ширина окна ~600px, половина = 300px. Центр 25-го элемента: (25 * 120) + 60
            const windowHalf = document.querySelector('.roulette-window').offsetWidth / 2;
            const targetX = (WINNING_INDEX * itemWidth) + (itemWidth / 2) - windowHalf;
            
            // Добавляем легкий рандом для смещения внутри карточки
            const randomOffset = Math.floor(Math.random() * 80) - 40; 
            
            track.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.1, 1)';
            track.style.transform = `translateX(-${targetX + randomOffset}px)`;
            
            // Звук трещотки
            try {
                const actx = new (window.AudioContext || window.webkitAudioContext)();
                let ticks = 0;
                let tickInterval = setInterval(() => {
                    ticks++;
                    if (ticks > 40) clearInterval(tickInterval);
                    const osc = actx.createOscillator();
                    osc.frequency.value = 800;
                    osc.connect(actx.destination);
                    osc.start(); osc.stop(actx.currentTime + 0.02);
                }, 100 + (ticks * 5)); // Замедление трещотки
            } catch(e) {}

            // По завершении анимации (5 сек)
            setTimeout(() => {
                isRoulettePlaying = false;
                document.getElementById('roulette-overlay').classList.remove('active');
                
                // Только хост продвигает игру дальше, чтобы не было дублей
                if (window.isHost) {
                    const updates = {};
                    updates[`playersData/${loserId}/kicked`] = true; 
                    updates['gameLogic/phase'] = 'exile_animation'; 
                    updates['gameLogic/exiledPlayer'] = loserId;
                    
                    updates['gameLogic/quarantinedPlayers'] = {}; 
                    updates['gameLogic/shieldedPlayers'] = {};
                    updates['gameLogic/vetoPlayers'] = {};
                    
                    const capacity = globalState.world.capacity;
                    updates['gameLogic/nextPhase'] = (getAlivePlayers().length - 1 <= capacity) ? 'ended' : 'reveal';
                    
                    if(updates['gameLogic/nextPhase'] === 'reveal') { 
                        updates['gameLogic/round'] = globalState.gameLogic.round + 1; 
                        updates['gameLogic/activePlayerIndex'] = 0; 
                        updates['gameLogic/revealedThisTurn'] = 0; 
                        updates['gameLogic/readyPlayers'] = null; 
                    }
                    window.parent.postMessage({ type: 'update_state', updates }, '*');
                    
                    setTimeout(() => { window.parent.postMessage({ type: 'update_state', updates: { 'gameLogic/phase': globalState.gameLogic.nextPhase } }, '*'); }, 5000);
                }
            }, 6000); // 5 сек анимация + 1 сек пауза
            
        }, 100);
    });
}
window.playRoulette = playRoulette;