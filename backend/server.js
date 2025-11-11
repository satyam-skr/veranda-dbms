import app from './src/app.js';
import http from "http";
import { Server } from "socket.io";
import pool from './src/db/db.js'
import dotenv from 'dotenv';

const port = process.env.PORT;
const server = http.createServer(app);

const startServer = async()=>{
  try{
    await pool.query("SELECT NOW()");
    console.log("Database Connected");

    app.listen(port,()=>{
      console.log(`${port} is litening`);
    })
  }
  catch(err){
    console.log('Server error',err);
  }
}

export const io = new Server(server, {
  cors: {
    origin: "*", // frontend URL
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

startServer();