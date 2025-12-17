import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Create a new task
export async function POST(request) {
  try {
    const data = await request.json();
    const pool = getPool();
    
    const { 
      client_id, 
      title, 
      description, 
      due_date, 
      priority = 'medium',
      input_type = 'none',
      custom_options = [],
      notify_on_complete = true,
      assigned_to = 'Tax Team'
    } = data;
    
    if (!client_id || !title) {
      return NextResponse.json({ error: 'client_id and title are required' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (
        client_id, title, description, due_date, priority, 
        input_type, custom_options, notify_on_complete, assigned_to, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [
        client_id, title, description, due_date || null, priority,
        input_type, custom_options, notify_on_complete, assigned_to
      ]
    );
    
    return NextResponse.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all tasks (optionally filtered by client_id)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const pool = getPool();
    
    let query = `SELECT t.*, c.first_name, c.last_name, c.email as client_email
                 FROM tasks t 
                 JOIN clients c ON t.client_id = c.system_id`;
    let params = [];
    
    if (clientId) {
      query += ' WHERE t.client_id = $1';
      params.push(clientId);
    }
    
    query += ` ORDER BY 
      CASE WHEN t.status = 'pending' THEN 0 
           WHEN t.status = 'submitted' THEN 1 
           ELSE 2 END,
      t.due_date ASC NULLS LAST`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
