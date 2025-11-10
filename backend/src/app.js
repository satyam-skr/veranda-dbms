import express from "express";
import userRoute from "./routes/users.route.js";
import transportRoute from "./routes/transport.route.js";
import autoRoute from "./routes/auto.route.js";
import pool from "./db/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-role", "X-User-Role"],
    exposedHeaders: ["x-user-role"],
    credentials: true,
  })
);

app.get("/", async (req, res) => {
  res.send("Working");
});

app.use("/api/users", userRoute);
app.use("/api/transport", transportRoute);

// autos route (mounted separately)
app.use("/api/transport/auto", autoRoute);

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

export default app;
