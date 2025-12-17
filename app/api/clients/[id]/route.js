import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const pool = getPool();
    
    // Get client details
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE system_id = $1',
      [id]
    );
    
    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const client = clientResult.rows[0];
    
    // Get tasks
    const tasksResult = await pool.query(
      `SELECT * FROM tasks WHERE client_id = $1 ORDER BY 
       CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
       due_date ASC NULLS LAST`,
      [id]
    );
    
    // Get messages
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE client_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [id]
    );
    
    // Get documents
    const documentsResult = await pool.query(
      'SELECT * FROM documents WHERE client_id = $1 ORDER BY upload_date DESC',
      [id]
    );
    
    // Get calculations
    const calculationsResult = await pool.query(
      'SELECT * FROM calculations WHERE client_id = $1 ORDER BY timestamp DESC',
      [id]
    );
    
    // Get Luna conversations
    const lunaLogsResult = await pool.query(
      'SELECT * FROM user_conversations WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
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
    
    const result = await pool.query(
      `UPDATE clients SET
        first_name = $1, last_name = $2, casual_name = $3, email = $4, mobile = $5,
        abn = $6, business_name = $7, address = $8, phone = $9, fdc_percent = $10,
        gst_registered = $11, bas_quarter = $12, start_date = $13, notes = $14, status = $15
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
    
    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}