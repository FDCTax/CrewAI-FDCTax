const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND')

const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '')

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined
  }
})

async function initDatabase() {
  try {
    console.log('🔄 Reading schema file...')
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8')
    
    console.log('🔄 Executing schema...')
    await pool.query(schemaSQL)
    
    console.log('✅ Database schema created successfully!')
    
    // Test query
    const result = await pool.query('SELECT COUNT(*) FROM clients')
    console.log(`✅ Clients table exists with ${result.rows[0].count} records`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

initDatabase()
