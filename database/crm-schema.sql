-- ==========================================
-- CRM BACKEND SKELETON - SANDBOX ONLY
-- CRITICAL: Deploy Today
-- ==========================================

-- Note: clients table already exists, we'll add new columns to it
-- Add CRM-specific columns to existing clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS abn VARCHAR(11),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS fdc_percent DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- Update existing test users with additional data
UPDATE clients 
SET 
  abn = '12345678901',
  business_name = 'Sarah Wilson FDC',
  address = '123 Educator Street, Brisbane QLD 4000',
  phone = '0412345678',
  fdc_percent = 85.00,
  start_date = '2024-07-01',
  status = 'active'
WHERE email = 'sarah.test@fdctax.com.au';

UPDATE clients 
SET 
  abn = '98765432109',
  business_name = 'Emma Thompson Family Day Care',
  address = '456 Learning Lane, Melbourne VIC 3000',
  phone = '0423456789',
  fdc_percent = 90.00,
  start_date = '2024-01-15',
  status = 'active'
WHERE email = 'emma.test@fdctax.com.au';

-- ==========================================
-- TASKS TABLE (CRM Task Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ==========================================
-- MESSAGES TABLE (Client-Agent Communication)
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('client', 'agent', 'system', 'luna')),
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attachment_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- ==========================================
-- DOCUMENTS TABLE (File Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    uploaded_by VARCHAR(100),
    file_type VARCHAR(50),
    file_size INTEGER
);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON documents(task_id);

-- ==========================================
-- CALCULATIONS TABLE (Tax Calculations & Tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS calculations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fdc_expense', 'mileage', 'depreciation', 'gst', 'bas', 'income_tax', 'other')),
    input_data JSONB NOT NULL,
    output JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    tax_year VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_calculations_client_id ON calculations(client_id);
CREATE INDEX IF NOT EXISTS idx_calculations_type ON calculations(type);
CREATE INDEX IF NOT EXISTS idx_calculations_tax_year ON calculations(tax_year);

-- ==========================================
-- SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample tasks for Sarah
INSERT INTO tasks (client_id, title, description, status, due_date, priority, assigned_to)
SELECT system_id, 'Upload Q1 2024 receipts', 'Please upload all receipts from July-September 2024', 'pending', CURRENT_DATE + INTERVAL '7 days', 'high', 'Tax Team'
FROM clients WHERE email = 'sarah.test@fdctax.com.au'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (client_id, title, description, status, due_date, priority, assigned_to)
SELECT system_id, 'Set up recurring FDC expenses', 'Configure monthly recurring expenses (rent, utilities, etc)', 'pending', CURRENT_DATE + INTERVAL '14 days', 'medium', 'Tax Team'
FROM clients WHERE email = 'sarah.test@fdctax.com.au'
ON CONFLICT DO NOTHING;

-- Insert sample tasks for Emma
INSERT INTO tasks (client_id, title, description, status, due_date, priority, assigned_to)
SELECT system_id, 'BAS Lodgement Review', 'Review Q3 BAS before lodgement', 'in_progress', '2024-10-28', 'urgent', 'Senior Accountant'
FROM clients WHERE email = 'emma.test@fdctax.com.au'
ON CONFLICT DO NOTHING;

-- Insert sample messages
INSERT INTO messages (client_id, sender, message_text)
SELECT system_id, 'agent', 'Welcome to FDC Tax! We are here to help with all your tax needs.'
FROM clients WHERE email = 'sarah.test@fdctax.com.au';

INSERT INTO messages (client_id, sender, message_text)
SELECT system_id, 'client', 'Hi! I have a question about claiming vehicle expenses.'
FROM clients WHERE email = 'sarah.test@fdctax.com.au';

INSERT INTO messages (client_id, sender, message_text)
SELECT system_id, 'luna', 'Hello Sarah! I can help you with vehicle expense claims. For FDC educators, you can claim mileage for trips like transporting children, educational excursions, and business errands.'
FROM clients WHERE email = 'sarah.test@fdctax.com.au';

-- Insert sample calculation
INSERT INTO calculations (client_id, type, input_data, output, notes, tax_year)
SELECT 
  system_id, 
  'fdc_expense',
  '{"total_expenses": 5000, "fdc_percent": 85, "period": "Q1 2024"}'::jsonb,
  '{"claimable_amount": 4250, "breakdown": {"rent": 1700, "utilities": 425, "supplies": 850, "other": 1275}}'::jsonb,
  'Q1 FDC expense calculation',
  '2024'
FROM clients WHERE email = 'sarah.test@fdctax.com.au';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CRM Schema applied successfully!';
    RAISE NOTICE '✅ Enhanced clients table with CRM fields';
    RAISE NOTICE '✅ Created tasks table';
    RAISE NOTICE '✅ Created messages table';
    RAISE NOTICE '✅ Created documents table';
    RAISE NOTICE '✅ Created calculations table';
    RAISE NOTICE '✅ Inserted sample data for testing';
END $$;
