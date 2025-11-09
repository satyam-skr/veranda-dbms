import express from "express";
import userRoute from './routes/users.route.js'
import transportRoute from "./routes/transport.route.js";
import pool from "./db/db.js";

const app = express();

app.use(express.json("limit:16kb"));
app.use(express.urlencoded({extended:true}));

app.get("/", async (req, res) => {
  res.send('Working');
});
//1
app.use((req, res, next) => {
  console.log("➡️", req.method, req.path);
  next();
})
//

//2
app.post("/test", (req, res) => {
  res.json({ ok: true, msg: "test route working" });
});
//

app.use('/api/users',userRoute);
app.use("/uploads", express.static("src/uploads"));
app.use('/api/transport', transportRoute);


export default app;