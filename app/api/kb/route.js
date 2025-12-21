import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const pool = getPool();
    
    let query = 'SELECT * FROM crm.kb_entries';
    let params = [];
    
    if (search) {
      query += " WHERE title ILIKE $1 OR tags ILIKE $1 OR answer ILIKE $1";
      params = [`%${search}%`];
    }
    
    query += ' ORDER BY id';
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      entries: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, tags, variations, answer } = await request.json();
    
    if (!title || !answer) {
      return NextResponse.json(
        { error: 'Title and answer are required' },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO crm.kb_entries (title, tags, variations, answer) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, tags || '', variations || '', answer]
    );
    
    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}