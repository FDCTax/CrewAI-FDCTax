import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT * FROM kb_entries WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    return NextResponse.json({ entry: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, tags, variations, answer } = await request.json();
    
    const pool = getPool();
    const result = await pool.query(
      `UPDATE kb_entries 
       SET title = $1, tags = $2, variations = $3, answer = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [title, tags || '', variations || '', answer, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const pool = getPool();
    
    const result = await pool.query(
      'DELETE FROM kb_entries WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}