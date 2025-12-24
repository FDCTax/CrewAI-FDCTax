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
      `SELECT first_name, casual_name, gst_registered, bas_quarter, cashbook_start_date 
       FROM crm.clients 
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
    
    if (!user.gst_registered) {
      return NextResponse.json({
        gst_registered: false,
        message: 'User is not registered for GST'
      });
    }
    
    // Calculate next BAS due date based on quarter
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // BAS due dates (28th of the month following quarter end)
    const basDueDates = {
      'Q1': new Date(currentYear, 9, 28),   // Oct 28 (Jul-Sep quarter)
      'Q2': new Date(currentYear + 1, 0, 28), // Jan 28 (Oct-Dec quarter)
      'Q3': new Date(currentYear, 3, 28),   // Apr 28 (Jan-Mar quarter)
      'Q4': new Date(currentYear, 6, 28)    // Jul 28 (Apr-Jun quarter)
    };
    
    let nextDueDate = basDueDates[user.bas_quarter];
    
    // If due date has passed, move to next year
    if (nextDueDate < currentDate) {
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    }
    
    // Get pending BAS-related tasks
    const tasksResult = await pool.query(
      `SELECT id, task_name, due_date 
       FROM myfdc.user_checklists 
       WHERE user_id = $1 AND status = 'pending' AND task_name ILIKE '%BAS%'
       ORDER BY due_date ASC NULLS LAST`,
      [userId]
    );
    
    return NextResponse.json({
      gst_registered: true,
      bas_quarter: user.bas_quarter,
      next_due_date: nextDueDate.toISOString().split('T')[0],
      days_until_due: Math.ceil((nextDueDate - currentDate) / (1000 * 60 * 60 * 24)),
      pending_tasks: tasksResult.rows
    });
  } catch (error) {
    console.error('Error fetching BAS status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}