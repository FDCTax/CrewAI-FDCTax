import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Client submits task response
export async function POST(request, { params }) {
  try {
    const { taskId } = params;
    const data = await request.json();
    const pool = getPool();
    
    const { 
      client_response,
      client_amount,
      client_files = [],
      client_comment
    } = data;
    
    // Get the task first
    const taskResult = await pool.query(
      `SELECT t.*, c.first_name, c.last_name, c.email as client_email
       FROM tasks t 
       JOIN clients c ON t.client_id = c.system_id
       WHERE t.id = $1`,
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const task = taskResult.rows[0];
    
    // Update task with client submission
    const updateResult = await pool.query(
      `UPDATE tasks SET
        status = 'submitted',
        client_response = $1,
        client_amount = $2,
        client_files = $3,
        client_comment = $4,
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        client_response,
        client_amount,
        JSON.stringify(client_files),
        client_comment,
        taskId
      ]
    );
    
    // Add a message to track the submission
    await pool.query(
      `INSERT INTO messages (client_id, task_id, sender, message_text)
       VALUES ($1, $2, 'client', $3)`,
      [
        task.client_id,
        taskId,
        `Task submitted: ${task.title}${client_comment ? ' - Comment: ' + client_comment : ''}`
      ]
    );
    
    // Send email notification if enabled
    if (task.notify_on_complete) {
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'info@fdctax.com.au';
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@fdctax.com.au';
        const fromName = process.env.RESEND_FROM_NAME || 'Luna at FDC Tax';
        
        let emailBody = `
          <h2>Task Submitted by ${task.first_name} ${task.last_name}</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Client:</strong> ${task.first_name} ${task.last_name} (${task.client_email})</p>
        `;
        
        if (client_response) {
          emailBody += `<p><strong>Response:</strong> ${client_response}</p>`;
        }
        if (client_amount) {
          emailBody += `<p><strong>Amount:</strong> $${client_amount}</p>`;
        }
        if (client_comment) {
          emailBody += `<p><strong>Comment:</strong> ${client_comment}</p>`;
        }
        if (client_files && client_files.length > 0) {
          emailBody += `<p><strong>Files uploaded:</strong> ${client_files.length} file(s)</p>`;
        }
        
        emailBody += `
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/clients/${task.client_id}" 
               style="background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View in CRM
            </a>
          </p>
        `;
        
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: adminEmail,
          subject: `Task Submitted: ${task.title} - ${task.first_name} ${task.last_name}`,
          html: emailBody
        });
        
        console.log('Email notification sent for task submission:', taskId);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({
      success: true,
      task: updateResult.rows[0],
      message: 'Task submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
