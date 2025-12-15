import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM email_templates ORDER BY name ASC'
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
