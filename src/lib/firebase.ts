// Импортируем функции инициализации из модульного Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Конфигурация нового проекта nek0play с поддержкой переменных окружения и резервными значениями
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBGIpVfxxFDgJbLpbWxdMGNQTjTesnA2HY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nek0play.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nek0play-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nek0play",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nek0play.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "920298355682",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:920298355682:web:dd1d87c35e43f29232d7bb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DK40023TKE"
};

// Инициализируем приложение Firebase в контексте браузера
const app = initializeApp(firebaseConfig);

// Экспортируем ссылку на базу данных реального времени (Realtime Database) для синхронизации комнат
export const db = getDatabase(app);