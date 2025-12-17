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
    
    // Get user details
    const userResult = await pool.query(
      `SELECT 
         system_id,
         first_name,
         casual_name,
         email,
         gst_registered,
         bas_quarter,
         cashbook_start_date
       FROM clients 
       WHERE system_id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0];
    const preferredName = user.casual_name || user.first_name;
    
    // Get pending tasks
    const tasksResult = await pool.query(
      `SELECT id, task_name, status, due_date 
       FROM user_checklists 
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY due_date ASC NULLS LAST, created_at DESC
       LIMIT 5`,
      [userId]
    );
    
    // Get recent conversations (last 10)
    const conversationsResult = await pool.query(
      `SELECT id, query, response, mode, timestamp 
       FROM user_conversations 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 10`,
      [userId]
    );
    
    // Calculate days since cashbook start
    let daysSinceStart = null;
    if (user.cashbook_start_date) {
      const startDate = new Date(user.cashbook_start_date);
      const today = new Date();
      daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    }
    
    return NextResponse.json({
      user: {
        id: user.system_id,
        name: preferredName,
        email: user.email,
        gst_registered: user.gst_registered,
        bas_quarter: user.bas_quarter,
        cashbook_start_date: user.cashbook_start_date,
        days_since_start: daysSinceStart
      },
      tasks: {
        pending: tasksResult.rows,
        count: tasksResult.rows.length
      },
      recent_conversations: conversationsResult.rows.reverse(), // Oldest first
      context_summary: {
        is_new: daysSinceStart !== null && daysSinceStart < 30,
        has_pending_tasks: tasksResult.rows.length > 0,
        gst_status: user.gst_registered ? 'Registered' : 'Not registered'
      }
    });
  } catch (error) {
    console.error('Error fetching user context:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}