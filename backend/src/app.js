console.log("🟢 app.js starting...");
console.log("🔍 userRoute type:", typeof userRoute);
console.log("🔍 transportRoute type:", typeof transportRoute);
console.log("🔍 autoRoute type:", typeof autoRoute);

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/db.js";
console.log("✅ core modules loaded");
// ✅ Route Imports
import userRoute from "./routes/users.route.js";
console.log("✅ users.route.js loaded");
import transportRoute from "./routes/transport.route.js";
console.log("✅ transport.route.js loaded"); // ✅ ensure this matches the real filename!
import autoRoute from "./routes/auto.route.js";
console.log("✅ auto.route.js loaded");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-role",
      "X-User-Role",
    ],
    exposedHeaders: ["x-user-role"],
    credentials: true,
  })
);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

// ✅ Route mounts
app.use("/api/users", userRoute);
app.use("/api/transport/auto", autoRoute);
app.use("/api/transport", transportRoute); // mount last so /bus/... gets caught

// ✅ Static uploads
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// ✅ DEBUG: recursive route printer
function listRoutes(app) {
  const out = [];
  function traverse(layer, prefix = "") {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
      out.push(`${methods.padEnd(10)} ${prefix}${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach((l) => traverse(l, prefix + (layer.regexp?.source?.replace(/\\\//g, "/") || "")));
    }
  }
  (app._router?.stack || []).forEach((l) => traverse(l));
  console.log("=== All mounted routes ===");
  out.forEach((r) => console.log(r));
  console.log("=== end routes ===");
}
setTimeout(() => listRoutes(app), 500);

export default app;
