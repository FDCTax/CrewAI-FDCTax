import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Get single task with full details
export async function GET(request, { params }) {
  try {
    const { taskId } = params;
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT t.*, c.first_name, c.last_name, c.email as client_email, c.business_name
       FROM tasks t 
       JOIN clients c ON t.client_id = c.system_id
       WHERE t.id = $1`,
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Get related messages
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE task_id = $1 ORDER BY timestamp ASC',
      [taskId]
    );
    
    // Get related documents
    const documentsResult = await pool.query(
      'SELECT * FROM documents WHERE task_id = $1 ORDER BY upload_date DESC',
      [taskId]
    );
    
    return NextResponse.json({
      task: result.rows[0],
      messages: messagesResult.rows,
      documents: documentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update task (mark complete, add notes, etc.)
export async function PUT(request, { params }) {
  try {
    const { taskId } = params;
    const data = await request.json();
    const pool = getPool();
    
    const { status, agent_notes, priority, due_date, description, title } = data;
    
    // Build dynamic update query
    let updates = [];
    let values = [];
    let paramIndex = 1;
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (agent_notes !== undefined) {
      updates.push(`agent_notes = $${paramIndex++}`);
      values.push(agent_notes);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(due_date);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(taskId);
    
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete task
export async function DELETE(request, { params }) {
  try {
    const { taskId } = params;
    const pool = getPool();
    
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
