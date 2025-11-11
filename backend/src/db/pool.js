import 'dotenv/config';
import { Pool } from 'pg';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL missing in .env');

/**
 * node-postgres doesn't officially parse sslmode,
 * so we also force SSL at the driver level for safety.
 * Neon uses valid certs; rejectUnauthorized can be true (default)
 * but many teams set it false to bypass system CA issues.
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // or simply: ssl: true
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
  process.exit(1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
