import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request) {
  try {
    const { user_id, query, response, mode } = await request.json();
    
    if (!user_id || !query || !response) {
      return NextResponse.json(
        { error: 'user_id, query, and response are required' },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO myfdc.user_conversations (user_id, query, response, mode, timestamp) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [user_id, query, response, mode || 'educator']
    );
    
    return NextResponse.json({
      success: true,
      conversation: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
