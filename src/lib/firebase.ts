// Импортируем функции инициализации из модульного Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Конфигурация, которую мы перенесли из neko-board/js/main.js
const firebaseConfig = {
  apiKey: "AIzaSyC5E-bN2LNWElo7I4kcCGqcgMvoy8WX4wY",
  authDomain: "neko-board.firebaseapp.com",
  databaseURL: "https://neko-board-default-rtdb.firebaseio.com",
  projectId: "neko-board",
  storageBucket: "neko-board.firebasestorage.app",
  messagingSenderId: "758590553576",
  appId: "1:758590553576:web:b3d006e91390d1d4f3385d",
  measurementId: "G-G9X92RCNM4"
};

// Инициализируем приложение
const app = initializeApp(firebaseConfig);

// Экспортируем ссылку на базу данных реального времени, 
// чтобы использовать её в других компонентах (например, при авторизации)
export const db = getDatabase(app);