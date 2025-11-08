// src/app.js
import express from "express";
import userRoute from "./routes/users.route.js";
import pollRoutes from "./routes/pollRoutes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("Working");
});

app.use("/api/users", userRoute);
app.use("/api/polls", pollRoutes);

export default app;
