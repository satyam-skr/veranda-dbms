// backend/server.js
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js"; // ✅ only one import, correct path
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Attach io to app for controller access
app.set("io", io);

// Socket connection
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚍 Server running on http://localhost:${PORT}`);
});
