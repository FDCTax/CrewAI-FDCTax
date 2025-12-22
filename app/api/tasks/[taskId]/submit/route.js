import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to log audit events
async function logAudit(pool, { userType, userId, userEmail, action, tableName, recordId, clientId, oldValues, newValues, notes }) {
  try {
    await pool.query(
      `INSERT INTO crm.audit_logs (user_type, user_id, user_email, action, table_name, record_id, client_id, old_values, new_values, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userType, userId, userEmail, action, tableName, recordId, clientId, 
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null,
       notes]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't fail the main operation if audit logging fails
  }
}

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
      `SELECT t.*, c.first_name, c.last_name, c.email as client_email, c.client_access_approved
       FROM crm.tasks t 
       JOIN crm.clients c ON t.client_id = c.system_id
       WHERE t.id = $1`,
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const task = taskResult.rows[0];
    
    // Update task with client submission
    const updateResult = await pool.query(
      `UPDATE crm.tasks SET
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
    
    // Log the task submission in audit logs
    await logAudit(pool, {
      userType: 'educator',
      userId: task.client_id?.toString(),
      userEmail: task.client_email,
      action: 'submit',
      tableName: 'crm.tasks',
      recordId: taskId,
      clientId: task.client_id,
      oldValues: { status: task.status },
      newValues: { status: 'submitted', client_response, client_amount, client_comment },
      notes: `Task submitted: ${task.title}`
    });
    
    // SPECIAL HANDLING: Tech Help Access Permission Task
    // If client approved access, set client_access_approved flag
    if (task.title === 'Approve Tech Help Access') {
      const isApproved = client_response && client_response.toLowerCase().includes('yes');
      
      await pool.query(
        `UPDATE crm.clients SET 
          client_access_approved = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE system_id = $2`,
        [isApproved, task.client_id]
      );
      
      // Log the permission change in audit logs
      await logAudit(pool, {
        userType: 'educator',
        userId: task.client_id?.toString(),
        userEmail: task.client_email,
        action: isApproved ? 'approve' : 'reject',
        tableName: 'crm.clients',
        recordId: task.client_id?.toString(),
        clientId: task.client_id,
        oldValues: { client_access_approved: task.client_access_approved },
        newValues: { client_access_approved: isApproved },
        notes: `Tech help access ${isApproved ? 'approved' : 'denied'} by educator`
      });
      
      console.log(`Tech help access ${isApproved ? 'APPROVED' : 'DENIED'} for client ${task.client_id}`);
    }
    
    // Add a message to track the submission
    await pool.query(
      `INSERT INTO crm.messages (client_id, task_id, sender, message_text)
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
