import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use different database URLs based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const databaseUrl = isDevelopment 
  ? (process.env.SUPABASE_DEV_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
  : (process.env.SUPABASE_PROD_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error(
    `Database URL must be set. In ${isDevelopment ? 'development' : 'production'} mode, please set SUPABASE_${isDevelopment ? 'DEV' : 'PROD'}_DATABASE_URL or SUPABASE_DATABASE_URL.`,
  );
}

console.log(`🗄️  Connecting to ${isDevelopment ? 'development' : 'production'} database`);

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10
});
export const db = drizzle(pool, { schema });