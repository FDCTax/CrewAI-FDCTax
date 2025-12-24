import { Pool } from 'pg'

let pool = null

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL?.replace('?sslmode=require', '') || process.env.DATABASE_URL
    
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? {
        rejectUnauthorized: false,
        ca: undefined
      } : false,
      max: 10, // Reduced from 20 to avoid connection exhaustion
      idleTimeoutMillis: 10000, // Close idle connections faster
      connectionTimeoutMillis: 15000, // Increased timeout
      allowExitOnIdle: true,
    })
    
    // Handle pool errors to prevent crash
    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err.message)
      // Reset pool on error to force new connections
      pool = null
    })
  }
  return pool
}

// Reset pool - useful when connections go stale
export function resetPool() {
  if (pool) {
    pool.end().catch(console.error)
    pool = null
  }
}

export async function query(text, params) {
  const p = getPool()
  try {
    const result = await p.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error.message)
    // Reset pool on connection errors
    if (error.message.includes('Connection terminated') || 
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')) {
      resetPool()
    }
    throw error
  }
}

export async function testConnection() {
  try {
    const p = getPool()
    const result = await p.query('SELECT NOW() as current_time, version() as version')
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
