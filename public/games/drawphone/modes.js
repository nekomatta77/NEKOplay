// Словари и логика для уникальных режимов

const IMPOSTOR_PAIRS = [
    ["Яблоко", "Груша"], ["Кот", "Собака"], ["Машина", "Трактор"], ["Солнце", "Луна"],
    ["Пицца", "Бургер"], ["Король", "Принц"], ["Самолет", "Вертолет"], ["Вампир", "Зомби"],
    ["Ноутбук", "Телевизор"], ["Гитара", "Скрипка"], ["Океан", "Озеро"], ["Гора", "Вулкан"],
    ["Снеговик", "Пингвин"], ["Кофе", "Чай"], ["Часы", "Компас"], ["Змея", "Червь"]
];

const TRIPLE_THREAT_WORDS = [
    ["Кот", "Пылесос", "Самурай"], ["Банан", "Ниндзя", "Космос"], ["Динозавр", "Скейтборд", "Офис"],
    ["Клоун", "Бензопила", "Луна"], ["Утка", "Робот", "Кактус"], ["Рыцарь", "Пицца", "Бассейн"]
];

const LASSO_PARTS = [
    "Глаз", "Колесо", "Палка", "Ухо", "Треугольник", "Звезда", "Улыбка", "Квадрат", "Крючок", "Волна"
];

const BABEL_TRANSLATIONS = {
    "Кошка": ["Neko (Яп.) -> Кошка", "Gato (Исп.) -> Пушистый зверь", "Chat (Порт.) -> Мяукалка"],
    "Собака": ["Inu (Яп.) -> Пес", "Hund (Нем.) -> Гавкающий", "Chien (Фр.) -> Собакен"],
    "Машина": ["Kuruma (Яп.) -> Повозка", "Auto (Нем.) -> Железный конь", "Voiture (Фр.) -> Автомобиль"],
    "Дом": ["Ie (Яп.) -> Хижина", "Haus (Нем.) -> Здание", "Casa (Исп.) -> Убежище"]
};

// Функция для генерации "Испорченного перевода" (генерация псевдо-перевода)
function getBabelTranslation(word) {
    const languages = ["Японский", "Китайский", "Хинди", "Арабский", "Французский", "Немецкий", "Суахили"];
    const adjectives = ["Странный", "Большой", "Красный", "Смешной", "Святой", "Железный"];
    const nouns = ["Предмет", "Человек", "Зверь", "Концепт", "Агрегат", "Штука"];
    
    let randomLang = languages[Math.floor(Math.random() * languages.length)];
    let randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    let randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `[Через ${randomLang}] -> ${randomAdj} ${word.toLowerCase()}`;
}

function getRandomLassoPart() {
    return LASSO_PARTS[Math.floor(Math.random() * LASSO_PARTS.length)];
}
function getRandomTriple() {
    return TRIPLE_THREAT_WORDS[Math.floor(Math.random() * TRIPLE_THREAT_WORDS.length)].join(" + ");
}
function getImpostorPair() {
    return IMPOSTOR_PAIRS[Math.floor(Math.random() * IMPOSTOR_PAIRS.length)];
}