import 'dotenv/config';
import { query } from '../lib/db.js';
import fs from 'fs';

async function applySchema() {
  try {
    console.log('📊 Applying Luna Context Schema...\n');
    
    const sql = fs.readFileSync('./database/luna-context-schema.sql', 'utf8');
    
    await query(sql);
    
    console.log('\n✅ Luna Context Schema applied successfully!');
    
    // Verify test users
    const result = await query(`
      SELECT system_id, first_name, casual_name, email, gst_registered, bas_quarter 
      FROM clients 
      WHERE email LIKE '%test@fdctax.com.au'
      ORDER BY system_id
    `);
    
    console.log('\n📋 Test Users Created:');
    result.rows.forEach(user => {
      console.log(`  - ${user.first_name} (${user.casual_name}): ${user.email}`);
      console.log(`    GST: ${user.gst_registered}, BAS: ${user.bas_quarter}`);
    });
    
    // Verify checklists
    const checklists = await query(`
      SELECT COUNT(*) as total FROM user_checklists
    `);
    console.log(`\n✅ Created ${checklists.rows[0].total} checklist items`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySchema();
