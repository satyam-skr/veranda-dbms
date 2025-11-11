import express from "express";
import userRoute from './routes/users.route.js'
import userComplaintsRoute from './routes/complaints.route.js';
import foodItemsRoute from './routes/foodItems.route.js';
import menuRoute from './routes/menu.route.js';
import menuDaysRoute from './routes/menuDays.route.js';
import mealRatingRoute from './routes/mealRating.route.js';
import transportRoute from "./routes/transport.route.js";
import autoRoute from "./routes/auto.route.js";
import pollRoutes from "./routes/poll.route.js";
import cors from 'cors';
import pool from "./db/db.js";
import path from "path";
import { fileURLToPath } from "url";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    exposedHeaders: ["x-user-role"],
    credentials: true,
}));

app.use(express.json("limit:16kb"));
app.use(express.urlencoded({extended:true}));

app.get("/", async (req, res) => {
  res.send('Working');
});

app.use('/api/users',userRoute);
app.use('/api/complaints',userComplaintsRoute);
app.use('/api/foodItems',foodItemsRoute);
app.use('/api/menu',menuRoute);
app.use('/api/menudays',menuDaysRoute);
app.use('/api/rate',mealRatingRoute);

app.use("/api/transport", transportRoute);

// autos route (mounted separately)
app.use("/api/transport/auto", autoRoute);

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

app.use("/api/polls", pollRoutes);

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