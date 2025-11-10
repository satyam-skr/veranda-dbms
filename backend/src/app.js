import express from "express";
import userRoute from "./routes/users.route.js";
import transportRoute from "./routes/transport.route.js";
import pool from "./db/db.js";
import cors from "cors";
import path from "path"; 
import { fileURLToPath } from "url";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST","PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type" , "x-user-role"],
  })
);

app.get("/", async (req, res) => {
  res.send("Working");
});

app.use("/api/users", userRoute);
app.use("/api/transport", transportRoute);


app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
export default app;
