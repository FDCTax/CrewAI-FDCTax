import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(clientData) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: [clientData.email],
      subject: '🎉 Welcome to FDC Tax!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #15ADC2 0%, #6366F1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; padding: 12px 24px; background: #15ADC2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .checklist { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .checklist-item { padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to FDC Tax!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Let's get your tax sorted</p>
            </div>
            <div class="content">
              <p>Hi ${clientData.casual_name || clientData.first_name},</p>
              
              <p>Thank you for choosing FDC Tax! I'm Luna, and I'll be guiding you through your onboarding journey.</p>
              
              <p><strong>What happens next:</strong></p>
              
              <ol>
                <li><strong>Document Signing</strong> - You'll receive an Annature link within 24 hours to sign your engagement letter</li>
                <li><strong>ID Verification</strong> - Complete your identity verification (required by TPB & AML regulations)</li>
                <li><strong>Document Collection</strong> - We'll send you a checklist of documents we need</li>
                <li><strong>Tax Return Preparation</strong> - Our team will prepare your return</li>
              </ol>
              
              <div class="checklist">
                <h3 style="margin-top: 0;">📋 Your Document Checklist</h3>
                <div class="checklist-item">✓ Payment summaries / PAYG summaries</div>
                <div class="checklist-item">✓ FDC income statements</div>
                <div class="checklist-item">✓ Receipts for deductions (car, home office, mobile, internet)</div>
                <div class="checklist-item">✓ Bank statements showing business income</div>
                <div class="checklist-item">✓ Previous year's tax return (if available)</div>
              </div>
              
              <p><strong>Your Reference ID:</strong> ${clientData.uuid?.slice(0, 8)}</p>
              
              <p>You can access your application anytime here:</p>
              <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/luna/client/${clientData.uuid}" class="button">View My Application</a></p>
              
              <p>If you have any questions, just reply to this email or call us.</p>
              
              <p>Warm regards,<br>
              <strong>Luna & the FDC Tax Team</strong></p>
            </div>
            <div class="footer">
              <p>FDC Tax Pty Ltd | hello@fdctax.com.au<br>
              ABN: [Your ABN] | www.fdctax.com.au</p>
              <p style="font-size: 12px; color: #9ca3af;">This is a sandbox environment. In production, you'll receive the real engagement letter.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    console.log('✅ Welcome email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendAdminNotification(clientData) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: [process.env.ADMIN_EMAIL || 'admin@fdctax.com.au'],
      subject: `🆕 New Luna Onboarding: ${clientData.casual_name || clientData.first_name} ${clientData.last_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #15ADC2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; }
            .button { display: inline-block; padding: 10px 20px; background: #15ADC2; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .badge { display: inline-block; padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Client Onboarding Complete</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Luna Onboarding System</p>
            </div>
            <div class="content">
              <p><strong>A new client has completed Luna onboarding!</strong></p>
              
              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Personal Details</th>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>${clientData.title || ''} ${clientData.first_name} ${clientData.middle_name || ''} ${clientData.last_name}</td>
                </tr>
                <tr>
                  <td><strong>Preferred Name:</strong></td>
                  <td>${clientData.casual_name}</td>
                </tr>
                <tr>
                  <td><strong>Date of Birth:</strong></td>
                  <td>${clientData.birth_date}</td>
                </tr>
                <tr>
                  <td><strong>Gender:</strong></td>
                  <td>${clientData.gender}</td>
                </tr>
                <tr>
                  <td><strong>Email:</strong></td>
                  <td><a href="mailto:${clientData.email}">${clientData.email}</a></td>
                </tr>
                <tr>
                  <td><strong>Mobile:</strong></td>
                  <td>${clientData.mobile}</td>
                </tr>
                ${clientData.phone ? `<tr><td><strong>Phone:</strong></td><td>${clientData.phone}</td></tr>` : ''}
              </table>

              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Business Details</th>
                </tr>
                ${clientData.abn ? `<tr><td><strong>ABN:</strong></td><td>${clientData.abn}</td></tr>` : ''}
                ${clientData.trading_name ? `<tr><td><strong>Trading Name:</strong></td><td>${clientData.trading_name}</td></tr>` : ''}
                <tr>
                  <td><strong>FDC Start Date:</strong></td>
                  <td>${clientData.fdc_start_date || 'Not provided'}</td>
                </tr>
                <tr>
                  <td><strong>Sole Trader:</strong></td>
                  <td>${clientData.is_sole_trader === 'Y' ? 'Yes' : 'No'}</td>
                </tr>
                ${clientData.entity_name ? `<tr><td><strong>Entity Name:</strong></td><td>${clientData.entity_name}</td></tr>` : ''}
                ${clientData.acn ? `<tr><td><strong>ACN:</strong></td><td>${clientData.acn}</td></tr>` : ''}
              </table>

              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Address</th>
                </tr>
                <tr>
                  <td><strong>Residential:</strong></td>
                  <td>${clientData.residential_address_line_1}${clientData.residential_address_line_2 ? ', ' + clientData.residential_address_line_2 : ''}, ${clientData.residential_address_location} ${clientData.residential_address_state} ${clientData.residential_address_postcode}</td>
                </tr>
                ${clientData.business_address_line_1 ? `
                <tr>
                  <td><strong>Business:</strong></td>
                  <td>${clientData.business_address_line_1}, ${clientData.business_address_location} ${clientData.business_address_state} ${clientData.business_address_postcode}</td>
                </tr>
                ` : ''}
              </table>

              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Banking</th>
                </tr>
                <tr>
                  <td><strong>Account Name:</strong></td>
                  <td>${clientData.eft_account_name}</td>
                </tr>
                <tr>
                  <td><strong>BSB:</strong></td>
                  <td>${clientData.eft_bsb_number}</td>
                </tr>
                <tr>
                  <td><strong>Account Number:</strong></td>
                  <td>${clientData.eft_account_number}</td>
                </tr>
              </table>

              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Deductions Profile</th>
                </tr>
                <tr>
                  <td><strong>Car Use:</strong></td>
                  <td>${clientData.deduction_profile?.car_use ? `Yes (${clientData.deduction_profile?.car_method || 'N/A'})` : 'No'}</td>
                </tr>
                <tr>
                  <td><strong>Home Office:</strong></td>
                  <td>${clientData.deduction_profile?.home_office ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td><strong>Mobile:</strong></td>
                  <td>${clientData.deduction_profile?.mobile_expense ? `Yes (${clientData.deduction_profile?.mobile_business_percent || 0}% business use)` : 'No'}</td>
                </tr>
                <tr>
                  <td><strong>Internet:</strong></td>
                  <td>${clientData.deduction_profile?.internet_expense ? 'Yes' : 'No'}</td>
                </tr>
              </table>

              ${clientData.used_accountant_previously === 'Y' ? `
              <table>
                <tr>
                  <th colspan="2" style="background: #15ADC2; color: white;">Previous Accountant</th>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>${clientData.prev_accountant_name}</td>
                </tr>
                <tr>
                  <td><strong>Firm:</strong></td>
                  <td>${clientData.prev_accountant_firm}</td>
                </tr>
                <tr>
                  <td><strong>Email:</strong></td>
                  <td><a href="mailto:${clientData.prev_accountant_email}">${clientData.prev_accountant_email}</a></td>
                </tr>
                <tr>
                  <td colspan="2"><span class="badge">⚠️ CLEARANCE LETTER REQUIRED</span></td>
                </tr>
              </table>
              ` : ''}

              <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #15ADC2; border-radius: 4px;">
                <p style="margin: 0;"><strong>📋 Next Actions:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Send Annature engagement letter</li>
                  ${clientData.used_accountant_previously === 'Y' ? '<li>Send professional clearance letter to previous accountant</li>' : ''}
                  <li>Complete ID verification</li>
                  <li>Create Dropbox folder for client documents</li>
                  <li>Assign to tax agent</li>
                </ul>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" class="button">View in Admin Console</a>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/luna/client/${clientData.uuid}" class="button" style="background: #6366F1;">View Client Application</a>
              </p>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                Client UUID: <code>${clientData.uuid}</code>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    console.log('✅ Admin notification sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return { success: false, error: error.message }
  }
}
