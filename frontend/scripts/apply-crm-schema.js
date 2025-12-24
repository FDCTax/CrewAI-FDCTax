import 'dotenv/config';
import { query } from '../lib/db.js';
import fs from 'fs';

async function applySchema() {
  try {
    console.log('📊 Applying CRM Schema...\n');
    
    const sql = fs.readFileSync('./database/crm-schema.sql', 'utf8');
    
    await query(sql);
    
    console.log('\n✅ CRM Schema applied successfully!');
    
    // Verify clients
    const clients = await query(`
      SELECT system_id, first_name, casual_name, email, business_name, fdc_percent, status 
      FROM clients 
      WHERE email LIKE '%test@fdctax.com.au'
      ORDER BY system_id
    `);
    
    console.log('\n📋 Clients:');
    clients.rows.forEach(c => {
      console.log(`  - ${c.first_name} (${c.business_name}): FDC ${c.fdc_percent}%`);
    });
    
    // Verify tasks
    const tasks = await query(`SELECT COUNT(*) as total FROM tasks`);
    console.log(`\n✅ Tasks: ${tasks.rows[0].total}`);
    
    // Verify messages
    const messages = await query(`SELECT COUNT(*) as total FROM messages`);
    console.log(`✅ Messages: ${messages.rows[0].total}`);
    
    // Verify calculations
    const calculations = await query(`SELECT COUNT(*) as total FROM calculations`);
    console.log(`✅ Calculations: ${calculations.rows[0].total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySchema();
