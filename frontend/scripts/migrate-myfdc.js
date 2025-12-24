// MyFDC Database Migration Script
// Migrates MyFDC tables from original DB to Sandbox DB (myfdc schema)

const { Pool } = require('pg');
require('dotenv').config();

// Original MyFDC DB
const originalPool = new Pool({ 
  connectionString: 'postgresql://doadmin:AVNS_9tVAi-Fs4DzU0OnH6k_@myfdc-db-do-user-29847186-0.e.db.ondigitalocean.com:25060/defaultdb?sslmode=require',
  ssl: { rejectUnauthorized: false } 
});

// Sandbox DB
const sandboxPool = new Pool({ 
  connectionString: 'postgresql://doadmin:AVNS_aZkWfpEZYB26xj9hdG6@fdctax-onboarding-sandbox-do-user-29847186-0.k.db.ondigitalocean.com:25060/defaultdb?sslmode=require',
  ssl: { rejectUnauthorized: false } 
});

// Tables to migrate (MyFDC specific - NO sensitive CRM data)
const tablesToMigrate = [
  'users',           // Must be first (foreign keys)
  'app_users',
  'business_years', 
  'daily_counters',
  'home_areas',
  'inactive_suppliers',
  'income',
  'expenses',
  'internet_diary',
  'laundry_diary',
  'logbook_period',
  'logbook_entry',
  'logbook_trips',
  'luna_chat_history',
  'luna_kb_articles',
  'luna_knowledge_base',
  'luna_user_settings',
  'magic_links',
  'mobile_diary',
  'mobile_phone_plans',
  'motor_vehicles',
  'my_home',
  'other_suppliers',
  'recurring_expenses',
  'schedule_periods',
  'shared_leads',
  'streaming_diary',
  'streaming_services',
  'supplier_learning',
  'user_fdc_percentages',
  'user_settings',
  'user_supplier_customizations',
  'user_tasks',
  'task_messages',
  'vehicle',
  'water_meter_readings',
  'water_quick_diary',
  'weekly_diaries'
];

async function getTableDDL(table) {
  // Get columns
  const columns = await originalPool.query(`
    SELECT column_name, data_type, character_maximum_length, 
           column_default, is_nullable, udt_name
    FROM information_schema.columns 
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [table]);
  
  // Get primary key
  const pk = await originalPool.query(`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary
  `, [table]);
  
  let ddl = `CREATE TABLE IF NOT EXISTS myfdc.${table} (\n`;
  
  const colDefs = columns.rows.map(col => {
    let def = `  "${col.column_name}" `;
    
    // Map data types
    if (col.udt_name === 'uuid') {
      def += 'UUID';
    } else if (col.data_type === 'character varying') {
      def += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'TEXT';
    } else if (col.data_type === 'integer') {
      def += 'INTEGER';
    } else if (col.data_type === 'bigint') {
      def += 'BIGINT';
    } else if (col.data_type === 'numeric') {
      def += 'NUMERIC';
    } else if (col.data_type === 'boolean') {
      def += 'BOOLEAN';
    } else if (col.data_type === 'timestamp without time zone' || col.data_type === 'timestamp with time zone') {
      def += 'TIMESTAMP';
    } else if (col.data_type === 'date') {
      def += 'DATE';
    } else if (col.data_type === 'text') {
      def += 'TEXT';
    } else if (col.data_type === 'jsonb') {
      def += 'JSONB';
    } else if (col.data_type === 'json') {
      def += 'JSON';
    } else if (col.data_type === 'ARRAY') {
      def += 'TEXT[]';
    } else if (col.udt_name === 'int4') {
      def += 'INTEGER';
    } else if (col.udt_name === 'float8') {
      def += 'DOUBLE PRECISION';
    } else {
      def += col.data_type.toUpperCase();
    }
    
    // Add default
    if (col.column_default) {
      // Handle serial/sequence defaults
      if (col.column_default.includes('nextval')) {
        // Skip - will handle with SERIAL
        if (col.data_type === 'integer' || col.data_type === 'bigint') {
          def = `  "${col.column_name}" SERIAL`;
        }
      } else if (col.column_default === 'gen_random_uuid()') {
        def += ' DEFAULT gen_random_uuid()';
      } else if (col.column_default.startsWith("'") || col.column_default === 'true' || col.column_default === 'false' || !isNaN(col.column_default)) {
        def += ` DEFAULT ${col.column_default}`;
      }
    }
    
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    return def;
  });
  
  ddl += colDefs.join(',\n');
  
  // Add primary key if exists
  if (pk.rows.length > 0) {
    ddl += `,\n  PRIMARY KEY (${pk.rows.map(r => `"${r.attname}"`).join(', ')})`;
  }
  
  ddl += '\n);';
  
  return ddl;
}

async function migrate() {
  console.log('=== MYFDC DATABASE MIGRATION ===\n');
  
  try {
    // Step 1: Ensure myfdc schema exists
    console.log('Step 1: Ensuring myfdc schema exists...');
    await sandboxPool.query('CREATE SCHEMA IF NOT EXISTS myfdc');
    console.log('✅ Schema ready\n');
    
    // Step 2: Clean existing test data in myfdc schema
    console.log('Step 2: Cleaning existing myfdc tables...');
    for (const table of [...tablesToMigrate].reverse()) {
      try {
        await sandboxPool.query(`DROP TABLE IF EXISTS myfdc.${table} CASCADE`);
        console.log(`  Dropped myfdc.${table}`);
      } catch(e) {
        // Table might not exist
      }
    }
    console.log('✅ Clean complete\n');
    
    // Step 3: Create tables and migrate data
    console.log('Step 3: Creating tables and migrating data...\n');
    
    for (const table of tablesToMigrate) {
      try {
        // Get DDL
        const ddl = await getTableDDL(table);
        
        // Create table
        await sandboxPool.query(ddl);
        console.log(`✓ Created myfdc.${table}`);
        
        // Get data from original
        const data = await originalPool.query(`SELECT * FROM "${table}"`);
        
        if (data.rows.length > 0) {
          // Get column names
          const columns = Object.keys(data.rows[0]);
          const colList = columns.map(c => `"${c}"`).join(', ');
          
          // Insert data in batches
          let inserted = 0;
          for (const row of data.rows) {
            const values = columns.map(c => row[c]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            try {
              await sandboxPool.query(
                `INSERT INTO myfdc.${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
              );
              inserted++;
            } catch(e) {
              // Skip problematic rows
              if (!e.message.includes('duplicate') && !e.message.includes('violates')) {
                console.log(`    Warning: ${e.message.substring(0, 50)}`);
              }
            }
          }
          console.log(`  → Migrated ${inserted}/${data.rows.length} rows`);
        } else {
          console.log(`  → 0 rows (empty table)`);
        }
        
      } catch(e) {
        console.log(`✗ Error with ${table}: ${e.message}`);
      }
    }
    
    // Step 4: Grant permissions to myfdc_user
    console.log('\nStep 4: Granting permissions...');
    await sandboxPool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA myfdc TO myfdc_user');
    await sandboxPool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA myfdc TO myfdc_user');
    await sandboxPool.query('GRANT USAGE ON SCHEMA myfdc TO myfdc_user');
    console.log('✅ Permissions granted\n');
    
    // Step 5: Verify migration
    console.log('Step 5: Verifying migration...');
    const verify = await sandboxPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'myfdc'
      ORDER BY table_name
    `);
    console.log(`✅ ${verify.rows.length} tables in myfdc schema\n`);
    
    console.log('=== MIGRATION COMPLETE ===');
    
  } catch(e) {
    console.error('MIGRATION ERROR:', e.message);
  } finally {
    originalPool.end();
    sandboxPool.end();
  }
}

migrate();
