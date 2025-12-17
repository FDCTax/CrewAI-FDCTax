import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getPool } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const clientId = formData.get('client_id');
    const taskId = formData.get('task_id');
    const uploadedBy = formData.get('uploaded_by') || 'client';
    const description = formData.get('description') || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${baseName}-${timestamp}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file
    await writeFile(filePath, buffer);
    
    const fileUrl = `/uploads/${fileName}`;
    
    // Save to database if clientId provided
    if (clientId) {
      const pool = getPool();
      await pool.query(
        `INSERT INTO documents (client_id, task_id, file_name, file_url, description, uploaded_by, file_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          clientId,
          taskId || null,
          originalName,
          fileUrl,
          description,
          uploadedBy,
          file.type,
          buffer.length
        ]
      );
    }
    
    return NextResponse.json({
      success: true,
      file: {
        name: originalName,
        url: fileUrl,
        size: buffer.length,
        type: file.type
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
