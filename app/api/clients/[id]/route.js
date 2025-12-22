import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Helper function to log audit events
async function logAudit(pool, { userType, userId, userEmail, action, tableName, recordId, clientId, oldValues, newValues, notes }) {
  try {
    await pool.query(
      `INSERT INTO crm.audit_logs (user_type, user_id, user_email, action, table_name, record_id, client_id, old_values, new_values, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userType, userId, userEmail, action, tableName, recordId, clientId, 
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null,
       notes]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const pool = getPool();
    
    // Get client details
    const clientResult = await pool.query(
      'SELECT * FROM crm.clients WHERE system_id = $1',
      [id]
    );
    
    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const client = clientResult.rows[0];
    
    // Log the view action in audit logs
    await logAudit(pool, {
      userType: 'agent',
      action: 'view',
      tableName: 'crm.clients',
      recordId: id,
      clientId: parseInt(id),
      notes: `Viewed client: ${client.first_name} ${client.last_name}`
    });
    
    // Get tasks
    const tasksResult = await pool.query(
      `SELECT * FROM crm.tasks WHERE client_id = $1 ORDER BY 
       CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
       due_date ASC NULLS LAST`,
      [id]
    );
    
    // Get messages
    const messagesResult = await pool.query(
      'SELECT * FROM crm.messages WHERE client_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [id]
    );
    
    // Get documents
    const documentsResult = await pool.query(
      'SELECT * FROM crm.documents WHERE client_id = $1 ORDER BY upload_date DESC',
      [id]
    );
    
    // Get calculations
    const calculationsResult = await pool.query(
      'SELECT * FROM myfdc.calculations WHERE client_id = $1 ORDER BY timestamp DESC',
      [id]
    );
    
    // Get Luna conversations
    const lunaLogsResult = await pool.query(
      'SELECT * FROM myfdc.user_conversations WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [id]
    );
    
    return NextResponse.json({
      client,
      tasks: tasksResult.rows,
      messages: messagesResult.rows,
      documents: documentsResult.rows,
      calculations: calculationsResult.rows,
      luna_logs: lunaLogsResult.rows
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const pool = getPool();
    
    // Get old values for audit log
    const oldResult = await pool.query(
      'SELECT * FROM crm.clients WHERE system_id = $1',
      [id]
    );
    const oldValues = oldResult.rows[0];
    
    const result = await pool.query(
      `UPDATE crm.clients SET
        first_name = $1, last_name = $2, casual_name = $3, email = $4, mobile = $5,
        abn = $6, business_name = $7, address = $8, phone = $9, fdc_percent = $10,
        gst_registered = $11, bas_quarter = $12, start_date = $13, notes = $14, status = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE system_id = $16
      RETURNING *`,
      [
        data.first_name, data.last_name, data.casual_name, data.email, data.mobile,
        data.abn, data.business_name, data.address, data.phone, data.fdc_percent,
        data.gst_registered, data.bas_quarter, data.start_date, data.notes, data.status,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Log the edit action in audit logs
    await logAudit(pool, {
      userType: 'agent',
      action: 'edit',
      tableName: 'crm.clients',
      recordId: id,
      clientId: parseInt(id),
      oldValues: oldValues,
      newValues: data,
      notes: `Updated client: ${data.first_name} ${data.last_name}`
    });
    
    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}