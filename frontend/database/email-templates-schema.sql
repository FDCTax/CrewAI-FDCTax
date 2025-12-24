-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default template
INSERT INTO email_templates (slug, name, subject, html_body) VALUES
('myfdc-welcome', 'MyFDC Welcome Email', 'Welcome to MyFDC Tax - Your Portal is Ready! 🎉', 
'<h1>Welcome to MyFDC Tax!</h1>
<p>Hi {{client_name}},</p>
<p>Your personalized tax portal is now ready! Here''s what you can do:</p>
<ul>
  <li>Track your deductions</li>
  <li>Upload receipts</li>
  <li>Chat with Luna (your AI tax assistant)</li>
  <li>View your BAS schedule</li>
</ul>
<p><strong>Your Portal:</strong> <a href="{{portal_url}}">{{portal_url}}</a></p>
<p>If you have any questions, just reply to this email or chat with Luna!</p>
<p>Cheers,<br>The FDC Tax Team</p>')
ON CONFLICT (slug) DO NOTHING;
