import { io } from "socket.io-client";

// window.location.origin автоматически подставит правильный URL.
// Локально это будет "http://localhost:3000", 
// а на Render это будет "https://nekoplay-server.onrender.com"
const URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const socket = io(URL, {
  autoConnect: false,
});