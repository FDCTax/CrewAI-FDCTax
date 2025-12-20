import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const data = await request.json();
    const pool = getPool();
    
    const {
      client_id,
      wantsAssistance,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      tfn,
      email,
      mobile,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      businessStructure,
      tradingName,
      businessStartDate,
      businessLocation,
      anzsicCode,
      registerForGST,
      estimatedTurnover,
      gstStartDate,
      gstBasis,
      paymentIntentId
    } = data;
    
    // Store ABN assistance request in database
    // First, update the client record with the new information
    await pool.query(
      `UPDATE clients SET
        first_name = COALESCE($1, first_name),
        middle_name = COALESCE($2, middle_name),
        last_name = COALESCE($3, last_name),
        birth_date = COALESCE($4, birth_date),
        tfn = COALESCE($5, tfn),
        email = COALESCE($6, email),
        mobile = COALESCE($7, mobile),
        residential_address_line_1 = COALESCE($8, residential_address_line_1),
        residential_address_line_2 = COALESCE($9, residential_address_line_2),
        residential_address_location = COALESCE($10, residential_address_location),
        residential_address_state = COALESCE($11, residential_address_state),
        residential_address_postcode = COALESCE($12, residential_address_postcode),
        trading_name = COALESCE($13, trading_name),
        fdc_start_date = COALESCE($14, fdc_start_date),
        is_sole_trader = $15,
        industry_code = $16,
        gst_assistance_requested = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE system_id = $18`,
      [
        firstName, middleName, lastName, dateOfBirth, tfn,
        email, mobile, addressLine1, addressLine2, suburb,
        state, postcode, tradingName, businessStartDate,
        businessStructure === 'sole_trader' ? 'true' : 'false',
        anzsicCode,
        registerForGST === 'yes' ? 'true' : 'false',
        client_id
      ]
    );
    
    // Create a task for staff to process the ABN application
    if (wantsAssistance) {
      await pool.query(
        `INSERT INTO tasks (client_id, title, description, status, priority, assigned_to, input_type)
         VALUES ($1, $2, $3, 'pending', 'high', 'Tax Team', 'none')`,
        [
          client_id,
          'ABN Registration - Process Application',
          `<p><strong>ABN Registration Request</strong></p>
           <p>Client: ${firstName} ${lastName}</p>
           <p>Structure: ${businessStructure}</p>
           <p>Trading Name: ${tradingName || 'N/A'}</p>
           <p>Start Date: ${businessStartDate}</p>
           <p>GST Required: ${registerForGST}</p>
           ${registerForGST === 'yes' ? `<p>Est. Turnover: $${estimatedTurnover}</p><p>GST Start: ${gstStartDate}</p><p>Reporting: ${gstBasis}</p>` : ''}
           <p>Payment: ${wantsAssistance ? 'Paid $99' : 'Self-guided'}</p>
           ${paymentIntentId ? `<p>Stripe Payment ID: ${paymentIntentId}</p>` : ''}`
        ]
      );
    }
    
    // Send confirmation email
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@fdctax.com.au';
      const fromName = process.env.RESEND_FROM_NAME || 'Luna at FDC Tax';
      
      let emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #15ADC2, #6366F1); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">ABN Registration ${wantsAssistance ? 'Submitted' : 'Guide'}</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p>Hi ${firstName},</p>
            
            ${wantsAssistance ? `
              <p>Thank you for choosing FDC Tax to handle your ABN registration!</p>
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Our team will review your application within 1-2 business days</li>
                <li>We'll lodge your ABN application with the ATO</li>
                <li>Most ABNs are issued immediately - we'll email you as soon as it's confirmed</li>
                ${registerForGST === 'yes' ? '<li>Your GST registration will be processed at the same time</li>' : ''}
              </ul>
            ` : `
              <p>Here's your step-by-step guide to register your ABN:</p>
              <ol>
                <li>Go to <a href="https://www.abr.gov.au/business-super-funds-702/apply-abn">ABR.gov.au</a></li>
                <li>Click "Apply for an ABN"</li>
                <li>Select "${businessStructure === 'sole_trader' ? 'Individual/Sole Trader' : businessStructure}"</li>
                <li>Enter your personal details as provided</li>
                <li>For industry code, search for "8710 - Family Day Care Services"</li>
                <li>Complete the application and submit</li>
              </ol>
              <p>Most applications are processed instantly!</p>
            `}
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #6366F1;">Your Application Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Name:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Structure:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${businessStructure}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Trading Name:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tradingName || 'Using personal name'}</td></tr>
                <tr><td style="padding: 8px 0;">GST:</td><td style="padding: 8px 0;">${registerForGST === 'yes' ? 'Yes' : 'No'}</td></tr>
              </table>
            </div>
            
            <div style="background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>📄 FDC Tax Fact Sheet</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Download your comprehensive guide to FDC tax deductions: 
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/resources/fdc-tax-fact-sheet.pdf" style="color: #6366F1;">Download PDF</a>
              </p>
            </div>
            
            <p>If you have any questions, just reply to this email or chat with Luna anytime.</p>
            
            <p>Best regards,<br/>The FDC Tax Team</p>
          </div>
        </div>
      `;
      
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: wantsAssistance 
          ? 'Your ABN Registration is Being Processed' 
          : 'Your ABN Registration Guide',
        html: emailBody
      });
      
      // Also notify admin
      const adminEmail = process.env.ADMIN_EMAIL || 'info@fdctax.com.au';
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: adminEmail,
        subject: `New ABN Registration: ${firstName} ${lastName}`,
        html: `
          <h2>New ABN Registration Request</h2>
          <p><strong>Client:</strong> ${firstName} ${lastName} (${email})</p>
          <p><strong>Service:</strong> ${wantsAssistance ? 'Full Assistance ($99 paid)' : 'Self-Guided'}</p>
          <p><strong>Structure:</strong> ${businessStructure}</p>
          <p><strong>GST:</strong> ${registerForGST}</p>
          ${paymentIntentId ? `<p><strong>Payment ID:</strong> ${paymentIntentId}</p>` : ''}
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/clients/${client_id}">View in CRM</a></p>
        `
      });
      
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting ABN assistance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
