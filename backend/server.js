import app from './src/app.js';
import pool from './src/db/db.js'
import dotenv from 'dotenv';
dotenv.config();  
const port = process.env.PORT || 3000;

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

startServer();