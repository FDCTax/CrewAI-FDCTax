import { Pool } from 'pg'

let pool

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

export async function query(text, params) {
  const pool = getPool()
  try {
    const result = await pool.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function testConnection() {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT NOW() as current_time, version() as version')
    return {
      success: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
