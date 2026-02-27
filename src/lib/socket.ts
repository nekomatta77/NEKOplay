import { io } from "socket.io-client";

// The APP_URL is provided by the environment, but in dev we can use window.location.origin
const URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const socket = io(URL, {
  autoConnect: false,
});
