import pg from 'pg';
import config from './config.js';

const { Pool } = pg;

let pool;

const ensurePool = () => {
  if (!pool) {
    const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    console.log('✅ PostgreSQL connection pool initialized');
  }
  return pool;
};

const bootstrap = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_expires BIGINT,
      role TEXT DEFAULT 'operator',
      timezone TEXT DEFAULT 'UTC',
      language TEXT DEFAULT 'en',
      country TEXT DEFAULT 'US',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )`);

    // Ensure password reset columns exist for existing deployments
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires BIGINT`);

    await client.query(`CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      sensor_type TEXT DEFAULT 'RS-LDO-N01',
      location TEXT DEFAULT 'Unknown',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      last_seen BIGINT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      captured_at BIGINT NOT NULL,
      do_concentration DECIMAL(10, 3),
      corrected_do DECIMAL(10, 3),
      temperature DECIMAL(10, 2),
      pressure DECIMAL(10, 2),
      do_saturation DECIMAL(10, 2),
      metadata TEXT,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS calibration_events (
      id SERIAL PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      value DECIMAL(10, 3),
      timestamp BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS dac_settings (
      id SERIAL PRIMARY KEY,
      sensor_id TEXT NOT NULL UNIQUE,
      corrected_do DECIMAL(10, 3),
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS export_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      format TEXT NOT NULL,
      start_date BIGINT NOT NULL,
      end_date BIGINT NOT NULL,
      metrics TEXT NOT NULL,
      include_analytics BOOLEAN DEFAULT FALSE,
      include_charts BOOLEAN DEFAULT FALSE,
      include_raw BOOLEAN DEFAULT TRUE,
      compression BOOLEAN DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON readings(sensor_id, captured_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sensors_user ON sensors(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email))`);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database error:', error);
    throw error;
  } finally {
    client.release();
  }
};

const init = async () => {
  ensurePool();
  await bootstrap();
  console.log('✅ PostgreSQL ready');
};

const db = {
  get pool() {
    return ensurePool();
  },

  async get(query, params = []) {
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  async all(query, params = []) {
    const result = await pool.query(query, params);
    return result.rows;
  },

  async run(query, params = []) {
    return await pool.query(query, params);
  },

  async init() {
    await init();
  },

  async close() {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
};

export { db };
