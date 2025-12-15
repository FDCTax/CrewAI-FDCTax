import 'dotenv/config';
import { query } from '../lib/db.js';
import fs from 'fs';

async function createEmailTemplatesTable() {
  try {
    console.log('Creating email_templates table...');
    
    const sql = fs.readFileSync('./database/email-templates-schema.sql', 'utf8');
    
    await query(sql);
    
    console.log('✅ Email templates table created successfully!');
    
    const result = await query('SELECT * FROM email_templates');
    console.log(`✅ Found ${result.rows.length} template(s)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createEmailTemplatesTable();
