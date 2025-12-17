// Apply task management schema to database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function applySchema() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'task-management-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Applying task management schema...');
    await pool.query(schema);
    console.log('✅ Task management schema applied successfully!');
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
  } finally {
    await pool.end();
  }
}

applySchema();
