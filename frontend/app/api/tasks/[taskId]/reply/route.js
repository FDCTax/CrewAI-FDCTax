import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Agent adds a reply/note to a task
export async function POST(request, { params }) {
  try {
    const { taskId } = params;
    const data = await request.json();
    const pool = getPool();
    
    const { message, sender = 'agent' } = data;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Get task to get client_id
    const taskResult = await pool.query(
      'SELECT client_id FROM crm.tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Add message
    const messageResult = await pool.query(
      `INSERT INTO crm.messages (client_id, task_id, sender, message_text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskResult.rows[0].client_id, taskId, sender, message]
    );
    
    return NextResponse.json({
      success: true,
      message: messageResult.rows[0]
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
