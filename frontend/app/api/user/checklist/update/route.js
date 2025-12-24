import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request) {
  try {
    const { task_id, status } = await request.json();
    
    if (!task_id || !status) {
      return NextResponse.json(
        { error: 'task_id and status are required' },
        { status: 400 }
      );
    }
    
    if (!['pending', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, completed, or dismissed' },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const result = await pool.query(
      `UPDATE user_checklists 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, task_id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}