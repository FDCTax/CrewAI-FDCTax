import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT system_id, first_name, casual_name, email, gst_registered, bas_quarter 
       FROM crm.clients 
       WHERE email LIKE '%test@fdctax.com.au'
       ORDER BY system_id`
    );
    
    return NextResponse.json({
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
