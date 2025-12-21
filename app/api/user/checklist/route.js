import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, task_name, status, due_date, created_at, updated_at 
       FROM myfdc.user_checklists 
       WHERE user_id = $1 
       ORDER BY 
         CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
         due_date ASC NULLS LAST,
         created_at DESC`,
      [userId]
    );
    
    return NextResponse.json({
      tasks: result.rows,
      total: result.rows.length,
      pending: result.rows.filter(t => t.status === 'pending').length,
      completed: result.rows.filter(t => t.status === 'completed').length
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}