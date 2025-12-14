import { readFileSync } from 'fs';
import { query } from '../lib/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initKBTables() {
  try {
    console.log('Initializing Knowledge Base tables...');

    const schemaSQL = readFileSync(
      join(__dirname, '../database/knowledge-base-schema.sql'),
      'utf8'
    );

    await query(schemaSQL);

    console.log('✅ Knowledge Base tables created successfully!');
    console.log('✅ Sample KB data inserted!');
    
    // Verify table creation
    const result = await query('SELECT COUNT(*) as count FROM knowledge_base');
    console.log(`📚 Knowledge Base has ${result.rows[0].count} articles`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing KB tables:', error);
    process.exit(1);
  }
}

initKBTables();
