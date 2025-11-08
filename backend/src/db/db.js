import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("DB Connection Failed:", err.message);
  } else {
    console.log("Connected to Neon PostgreSQL");
    release();
  }
});

export default pool;
