import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Get tasks for a specific client (MyFDC Dashboard)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT * FROM crm.tasks 
       WHERE client_id = $1 
       AND status != 'cancelled'
       ORDER BY 
         CASE WHEN status = 'pending' THEN 0 
              WHEN status = 'in_progress' THEN 1 
              WHEN status = 'submitted' THEN 2 
              ELSE 3 END,
         due_date ASC NULLS LAST`,
      [userId]
    );
    
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
