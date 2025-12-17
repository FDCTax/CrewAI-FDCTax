import 'dotenv/config';
import { query } from '../lib/db.js';
import fs from 'fs';

async function applySchema() {
  try {
    console.log('📚 Applying KB Management Schema...\n');
    
    const sql = fs.readFileSync('./database/kb-management-schema.sql', 'utf8');
    await query(sql);
    
    console.log('\n✅ KB Management Schema applied!');
    
    const result = await query('SELECT id, title, tags FROM kb_entries ORDER BY id');
    console.log(`\n📋 KB Entries Created: ${result.rows.length}`);
    result.rows.forEach(r => {
      console.log(`  ${r.id}. ${r.title}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySchema();
