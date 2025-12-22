/**
 * Setup Test Clients Script
 * Creates 5 test clients with varying types, tasks, and tech help permissions
 * Run: node scripts/setup-test-clients.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://doadmin:AVNS_aZkWfpEZYB26xj9hdG6@fdctax-onboarding-sandbox-do-user-29847186-0.k.db.ondigitalocean.com:25060/defaultdb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test client data
// bas_quarter: Q1 = Jul-Sep, Q2 = Oct-Dec, Q3 = Jan-Mar, Q4 = Apr-Jun
// For annual BAS, we use 'A' and track frequency separately
const testClients = [
  {
    first_name: 'Sarah',
    last_name: 'Test',
    casual_name: 'Sarah',
    email: 'sarah.testclient@fdctax.com.au',
    mobile: '0400111001',
    type: 'Individual',
    client_type: 'MyFDC Only',
    gst_registered: true,
    bas_quarter: 'Q1', // Quarterly - Jul-Sep
    bas_frequency: 'quarterly',
    fdc_percent: 75.00,
    estimated_turnover: 50000.00,
    business_name: 'Sarah Test FDC',
    abn: '11111111111'
  },
  {
    first_name: 'Mike',
    last_name: 'Test',
    casual_name: 'Mike',
    email: 'mike.testclient@fdctax.com.au',
    mobile: '0400111002',
    type: 'Individual',
    client_type: 'DIY/Luna',
    gst_registered: false,
    bas_quarter: 'A', // Annual
    bas_frequency: 'annual',
    fdc_percent: 100.00,
    estimated_turnover: 80000.00,
    business_name: 'Mike Test Family Day Care',
    abn: '22222222222'
  },
  {
    first_name: 'Emma',
    last_name: 'Test',
    casual_name: 'Emma',
    email: 'emma.testclient@fdctax.com.au',
    mobile: '0400111003',
    type: 'Individual',
    client_type: 'DIY/Luna',
    gst_registered: true,
    bas_quarter: 'Q2', // Quarterly - Oct-Dec
    bas_frequency: 'quarterly',
    fdc_percent: 75.00,
    estimated_turnover: 100000.00,
    business_name: 'Emma Test Early Learning',
    abn: '33333333333'
  },
  {
    first_name: 'James',
    last_name: 'Test',
    casual_name: 'James',
    email: 'james.testclient@fdctax.com.au',
    mobile: '0400111004',
    type: 'Individual',
    client_type: 'Full Service',
    gst_registered: true,
    bas_quarter: 'Q3', // Quarterly - Jan-Mar
    bas_frequency: 'quarterly',
    fdc_percent: 100.00,
    estimated_turnover: 120000.00,
    business_name: 'James Test Child Care',
    abn: '44444444444'
  },
  {
    first_name: 'Lisa',
    last_name: 'Test',
    casual_name: 'Lisa',
    email: 'lisa.testclient@fdctax.com.au',
    mobile: '0400111005',
    type: 'Individual',
    client_type: 'Full Service',
    gst_registered: false,
    bas_quarter: 'A', // Annual
    bas_frequency: 'annual',
    fdc_percent: 75.00,
    estimated_turnover: 150000.00,
    business_name: 'Lisa Test Educators Hub',
    abn: '55555555555'
  }
];

async function setupTestClients() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting test clients setup...\n');
    
    // Step 1: Apply schema changes
    console.log('📋 Step 1: Applying schema changes...');
    
    await client.query(`
      ALTER TABLE crm.clients 
      ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'DIY/Luna',
      ADD COLUMN IF NOT EXISTS client_access_approved BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS estimated_turnover DECIMAL(12,2)
    `);
    
    // Remove old constraint if exists and add new one
    await client.query(`
      ALTER TABLE crm.clients DROP CONSTRAINT IF EXISTS clients_client_type_check
    `);
    await client.query(`
      ALTER TABLE crm.clients ADD CONSTRAINT clients_client_type_check 
        CHECK (client_type IN ('MyFDC Only', 'DIY/Luna', 'Full Service'))
    `);
    
    console.log('   ✅ Added client_type, client_access_approved, estimated_turnover columns\n');
    
    // Step 2: Create audit logs table
    console.log('📋 Step 2: Creating audit logs table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm.audit_logs (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('agent', 'educator', 'system', 'admin')),
        user_id VARCHAR(100),
        user_email VARCHAR(255),
        action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'edit', 'create', 'delete', 'approve', 'reject', 'submit')),
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(100),
        client_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_type ON crm.audit_logs(user_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON crm.audit_logs(action)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON crm.audit_logs(client_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON crm.audit_logs(created_at DESC)`);
    
    console.log('   ✅ Created crm.audit_logs table\n');
    
    // Step 3: Insert test clients
    console.log('📋 Step 3: Creating 5 test clients...');
    
    const createdClients = [];
    
    for (const tc of testClients) {
      // Check if client already exists
      const existing = await client.query(
        'SELECT system_id FROM crm.clients WHERE email = $1',
        [tc.email]
      );
      
      let clientId;
      
      if (existing.rows.length > 0) {
        // Update existing client
        clientId = existing.rows[0].system_id;
        await client.query(`
          UPDATE crm.clients SET
            first_name = $1,
            last_name = $2,
            casual_name = $3,
            mobile = $4,
            type = $5,
            client_type = $6,
            gst_registered = $7,
            bas_quarter = $8,
            fdc_percent = $9,
            estimated_turnover = $10,
            business_name = $11,
            abn = $12,
            client_access_approved = false,
            status = 'active',
            updated_at = NOW()
          WHERE system_id = $13
        `, [tc.first_name, tc.last_name, tc.casual_name, tc.mobile, tc.type, 
            tc.client_type, tc.gst_registered, tc.bas_quarter, tc.fdc_percent,
            tc.estimated_turnover, tc.business_name, tc.abn, clientId]);
        console.log(`   ⟳ Updated: ${tc.first_name} ${tc.last_name} (${tc.client_type}) - ID: ${clientId}`);
      } else {
        // Insert new client
        const result = await client.query(`
          INSERT INTO crm.clients (
            first_name, last_name, casual_name, email, mobile, type,
            client_type, gst_registered, bas_quarter, fdc_percent,
            estimated_turnover, business_name, abn, client_access_approved,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, 'active', NOW(), NOW())
          RETURNING system_id
        `, [tc.first_name, tc.last_name, tc.casual_name, tc.email, tc.mobile, tc.type,
            tc.client_type, tc.gst_registered, tc.bas_quarter, tc.fdc_percent,
            tc.estimated_turnover, tc.business_name, tc.abn]);
        clientId = result.rows[0].system_id;
        console.log(`   ✅ Created: ${tc.first_name} ${tc.last_name} (${tc.client_type}) - ID: ${clientId}`);
      }
      
      createdClients.push({ ...tc, system_id: clientId });
    }
    
    console.log('');
    
    // Step 4: Create tasks for each client
    console.log('📋 Step 4: Creating tasks for each client...');
    
    for (const tc of createdClients) {
      // Delete existing test tasks for this client (to avoid duplicates)
      await client.query(
        `DELETE FROM crm.tasks WHERE client_id = $1 AND title IN ('Upload Q3 receipts', 'Approve Tech Help Access')`,
        [tc.system_id]
      );
      
      // Task 1: Upload Q3 receipts
      await client.query(`
        INSERT INTO crm.tasks (
          client_id, title, description, status, due_date, priority,
          assigned_to, input_type, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        tc.system_id,
        'Upload Q3 receipts',
        'Please upload all your receipts for July-September 2025. This includes:\n• Food and consumables\n• Educational supplies\n• Activity costs\n• Any other business expenses',
        'pending',
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        'high',
        'Tax Team',
        'file'
      ]);
      
      // Task 2: Tech Help Permission Request
      await client.query(`
        INSERT INTO crm.tasks (
          client_id, title, description, status, due_date, priority,
          assigned_to, input_type, custom_options, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        tc.system_id,
        'Approve Tech Help Access',
        'Your tax agent has requested access to view and help manage your MyFDC data (income, expenses, records) to provide better support.\n\nBy approving this request, you allow FDC Tax staff to:\n• View your income and expense records\n• Make corrections or adjustments with your consent\n• Provide hands-on assistance with your bookkeeping\n\nThis access helps us serve you better. You can revoke access at any time.',
        'pending',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        'medium',
        'System',
        'radio',
        ['Yes, I approve access', 'No, I do not approve']
      ]);
      
      console.log(`   ✅ Created tasks for: ${tc.first_name} ${tc.last_name}`);
    }
    
    console.log('');
    
    // Step 5: Log this setup action in audit logs
    console.log('📋 Step 5: Recording setup in audit logs...');
    
    await client.query(`
      INSERT INTO crm.audit_logs (
        user_type, user_id, action, table_name, notes, created_at
      ) VALUES ('system', 'setup-script', 'create', 'crm.clients', 
        'Created 5 test clients with tasks for pre-beta simulation', NOW())
    `);
    
    console.log('   ✅ Setup recorded in audit logs\n');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEST CLIENTS SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Created 5 clients:');
    console.log('┌─────────────────┬──────────────┬─────┬───────────┬─────────┬──────────────┐');
    console.log('│ Name            │ Type         │ GST │ BAS       │ FDC %   │ Turnover     │');
    console.log('├─────────────────┼──────────────┼─────┼───────────┼─────────┼──────────────┤');
    for (const tc of createdClients) {
      const name = `${tc.first_name} ${tc.last_name}`.padEnd(15);
      const type = tc.client_type.padEnd(12);
      const gst = tc.gst_registered ? '✓' : '✗';
      const bas = tc.bas_frequency === 'annual' ? 'Annual' : 'Quarterly';
      const fdc = `${tc.fdc_percent}%`.padEnd(7);
      const turnover = `$${(tc.estimated_turnover/1000).toFixed(0)}k`.padEnd(12);
      console.log(`│ ${name} │ ${type} │  ${gst}  │ ${bas.padEnd(9)} │ ${fdc} │ ${turnover} │`);
    }
    console.log('└─────────────────┴──────────────┴─────┴───────────┴─────────┴──────────────┘');
    console.log('');
    console.log('Each client has:');
    console.log('  • 1x "Upload Q3 receipts" task (file upload)');
    console.log('  • 1x "Approve Tech Help Access" task (radio selection)');
    console.log('');
    console.log('Next steps:');
    console.log('  1. View clients in CRM at /clients');
    console.log('  2. Tasks will appear in MyFDC dashboard');
    console.log('  3. When educator approves tech help, client_access_approved flag will be set');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupTestClients().catch(console.error);
