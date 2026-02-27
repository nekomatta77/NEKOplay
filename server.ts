import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.IO Logic
  const rooms = new Map<string, { id: string, name: string, players: any[], gameType: string, status: string }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("get_servers", () => {
      const activeServers = Array.from(rooms.values());
      socket.emit("servers_list", activeServers);
    });

    socket.on("create_room", (data) => {
      const { roomName, gameType, maxPlayers, user } = data;
      const roomId = Math.random().toString(36).substring(2, 9);
      
      const newRoom = {
        id: roomId,
        name: roomName,
        gameType,
        maxPlayers: maxPlayers || 2,
        players: [{ ...user, socketId: socket.id, isHost: true, isReady: false }],
        status: "waiting"
      };
      
      rooms.set(roomId, newRoom);
      socket.join(roomId);
      
      socket.emit("room_created", newRoom);
      io.emit("servers_list", Array.from(rooms.values()));
    });

    socket.on("join_room", (data) => {
      const { roomId, user } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        if (room.players.length >= (room.maxPlayers || 2)) {
          socket.emit("error", { message: "Room is full" });
          return;
        }
        
        room.players.push({ ...user, socketId: socket.id, isHost: false, isReady: false });
        socket.join(roomId);
        
        io.to(roomId).emit("room_updated", room);
        io.emit("servers_list", Array.from(rooms.values()));
      } else {
        socket.emit("error", { message: "Room not found" });
      }
    });

    socket.on("leave_room", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.socketId !== socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // If host left, assign new host
          if (!room.players.find(p => p.isHost)) {
            room.players[0].isHost = true;
          }
          io.to(roomId).emit("room_updated", room);
        }
        io.emit("servers_list", Array.from(rooms.values()));
      }
    });

    socket.on("toggle_ready", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.isReady = !player.isReady;
          io.to(roomId).emit("room_updated", room);
        }
      }
    });

    socket.on("start_game", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player && player.isHost) {
          const allReady = room.players.every(p => p.isReady || p.isHost);
          if (allReady && room.players.length > 1) {
            room.status = "playing";
            io.to(roomId).emit("game_started", room);
            io.emit("servers_list", Array.from(rooms.values()));
          }
        }
      }
    });

    socket.on("chat_message", (data) => {
      const { roomId, message, user } = data;
      io.to(roomId).emit("chat_message", { user, message, timestamp: Date.now() });
    });

    socket.on("global_chat_message", (data) => {
      const { message, user } = data;
      io.emit("global_chat_message", { user, message, timestamp: Date.now() });
    });

    socket.on("game_action", (data) => {
      const { roomId, action } = data;
      // Broadcast game action to other players in the room
      socket.to(roomId).emit("game_action", action);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Find and remove user from any rooms
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            if (!room.players.find(p => p.isHost)) {
              room.players[0].isHost = true;
            }
            io.to(roomId).emit("room_updated", room);
          }
          io.emit("servers_list", Array.from(rooms.values()));
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
