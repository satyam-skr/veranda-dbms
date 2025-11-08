import express from "express";
import userRoute from './routes/users.route.js'
import userComplaints from './routes/complaints.route.js';
import pool from "./db/db.js";
const app = express();

app.use(express.json("limit:16kb"));
app.use(express.urlencoded({extended:true}));

app.get("/", async (req, res) => {
  res.send('Working');
});

app.use('/api/users',userRoute);
app.use('/api/complaints',userComplaints);

export default app;