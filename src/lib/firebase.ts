// Импортируем функции инициализации из модульного Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Новая конфигурация веб-приложения для проекта nek0play с резервными значениями
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBGIpVfxxFDgJbLpbWxdMGNQTjTesnA2HY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nek0play.firebaseapp.com",
  // ВНИМАНИЕ: Если ваша БД создана в европейском регионе, укажите правильный адрес в .env или замените строку ниже
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nek0play-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nek0play",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nek0play.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "920298355682",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:920298355682:web:dd1d87c35e43f29232d7bb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DK40023TKE"
};

// Инициализируем основное приложение Firebase в рантайме браузера
const app = initializeApp(firebaseConfig);

// Экспортируем готовый экземпляр Realtime Database для работы игровых комнат
export const db = getDatabase(app);