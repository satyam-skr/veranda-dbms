import app from './src/app.js';
import pool from './src/db/db.js'
import dotenv from 'dotenv';

const port = process.env.PORT;

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