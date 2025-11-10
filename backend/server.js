// server.js
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
// server.js
import "./src/ioInstance.js";

// Create HTTP server instance
const server = http.createServer(app);

// ✅ Create Socket.IO instance and export it
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ Socket connection event
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ✅ Start the backend server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚍 Server running on http://localhost:${PORT}`);
});
