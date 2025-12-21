import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM crm.email_templates ORDER BY name ASC'
    );
    
    return NextResponse.json({
      templates: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
