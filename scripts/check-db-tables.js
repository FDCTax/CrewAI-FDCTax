import { query } from '../lib/db.js';

async function checkTables() {
  try {
    console.log('Checking database tables...\n');
    
    // List all tables
    const tablesResult = await query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('=== ALL TABLES ===');
    console.log(tablesResult.rows);
    console.log('\n');
    
    // Check for KB-related tables
    const kbTablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (
          table_name LIKE '%knowledge%' OR
          table_name LIKE '%kb%' OR
          table_name LIKE '%article%' OR
          table_name LIKE '%faq%' OR
          table_name LIKE '%template%'
        )
      ORDER BY table_name;
    `);
    
    console.log('=== KB-RELATED TABLES ===');
    console.log(kbTablesResult.rows);
    
    if (kbTablesResult.rows.length === 0) {
      console.log('\nNo KB tables found. Will need to create them.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
