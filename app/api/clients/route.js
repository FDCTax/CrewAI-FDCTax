import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const pool = getPool();
    
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'pending') as pending_tasks
      FROM crm.clients c
      LEFT JOIN tasks t ON c.system_id = t.client_id
    `;
    
    let params = [];
    
    if (search) {
      query += ` WHERE c.first_name ILIKE $1 OR c.last_name ILIKE $1 OR c.email ILIKE $1 OR c.business_name ILIKE $1`;
      params = [`%${search}%`];
    }
    
    query += ` GROUP BY c.system_id ORDER BY c.system_id DESC`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      clients: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const pool = getPool();
    
    const result = await pool.query(
      `INSERT INTO crm.clients (
        first_name, last_name, casual_name, email, mobile, abn, business_name,
        address, phone, fdc_percent, gst_registered, bas_quarter, start_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.first_name, data.last_name, data.casual_name, data.email, data.mobile,
        data.abn, data.business_name, data.address, data.phone, data.fdc_percent,
        data.gst_registered, data.bas_quarter, data.start_date, data.notes, data.status || 'active'
      ]
    );
    
    return NextResponse.json({
      success: true,
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}