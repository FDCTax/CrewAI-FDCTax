const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
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
