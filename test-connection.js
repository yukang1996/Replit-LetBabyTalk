import { Pool } from 'pg';

const url = process.env.SUPABASE_DATABASE_URL;
console.log('Testing connection...');

const pool = new Pool({ 
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  const result = await client.query('SELECT current_database(), version()');
  console.log('✓ Connected successfully:', result.rows[0].current_database);
  client.release();
  await pool.end();
} catch (error) {
  console.log('Connection failed:', error.message);
}