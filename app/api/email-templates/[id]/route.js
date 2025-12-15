import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { subject, html_body } = await request.json();
    
    const result = await pool.query(
      'UPDATE email_templates SET subject = $1, html_body = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [subject, html_body, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
