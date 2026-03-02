import fs from 'fs';

// Читаем текстовый файл (теперь он в правильной кодировке UTF-8)
const text = fs.readFileSync('russian.txt', 'utf8');

// Магия: разбиваем по строкам, убираем пробелы и слова короче 3 букв
const wordsArray = text.split(/\r?\n/)
    .map(word => word.trim())
    .filter(word => word.length > 2)
    // Делаем так, чтобы все слова начинались с большой буквы
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

// Сохраняем в готовый words.json
fs.writeFileSync('words.json', JSON.stringify(wordsArray, null, 2), 'utf8');

console.log(`✅ Готово! Успешно сохранено слов: ${wordsArray.length}`);