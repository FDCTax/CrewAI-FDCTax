-- ==========================================
-- LUNA CONTEXT ENHANCEMENT - SANDBOX ONLY
-- Phase 1: User Context & Checklists
-- ==========================================

-- Step 1: Add new columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS cashbook_start_date DATE,
ADD COLUMN IF NOT EXISTS gst_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bas_quarter VARCHAR(2);

-- Add comment for clarity
COMMENT ON COLUMN clients.cashbook_start_date IS 'Date when educator started using MyFDC cashbook';
COMMENT ON COLUMN clients.gst_registered IS 'Whether educator is registered for GST';
COMMENT ON COLUMN clients.bas_quarter IS 'BAS quarter (Q1, Q2, Q3, Q4) calculated from start date';

-- Step 2: Create user_checklists table
CREATE TABLE IF NOT EXISTS user_checklists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_checklists_user_id ON user_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklists_status ON user_checklists(status);

-- Step 3: Create user_conversations table (for Luna chat history)
CREATE TABLE IF NOT EXISTS user_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES clients(system_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    mode VARCHAR(20) DEFAULT 'educator', -- 'educator' or 'internal'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_timestamp ON user_conversations(timestamp DESC);

-- Step 4: Insert test users
INSERT INTO clients (
    first_name, 
    last_name, 
    casual_name, 
    email, 
    mobile,
    cashbook_start_date,
    gst_registered,
    bas_quarter
) VALUES 
(
    'Sarah',
    'Wilson',
    'Sarah',
    'sarah.test@fdctax.com.au',
    '0412345678',
    '2024-07-01',
    false,
    'Q1'
),
(
    'Emma',
    'Thompson',
    'Em',
    'emma.test@fdctax.com.au',
    '0423456789',
    '2024-01-15',
    true,
    'Q3'
),
(
    'Michael',
    'Chen',
    'Mike',
    'michael.test@fdctax.com.au',
    '0434567890',
    '2024-10-01',
    false,
    'Q2'
)
ON CONFLICT (email) DO NOTHING;

-- Step 5: Insert sample checklist items for test users
INSERT INTO user_checklists (user_id, task_name, status, due_date)
SELECT 
    c.system_id,
    'Set up recurring expenses',
    'pending',
    NULL
FROM clients c WHERE c.email = 'sarah.test@fdctax.com.au';

INSERT INTO user_checklists (user_id, task_name, status, due_date)
SELECT 
    c.system_id,
    'Upload Q1 receipts',
    'pending',
    CURRENT_DATE + INTERVAL '7 days'
FROM clients c WHERE c.email = 'sarah.test@fdctax.com.au';

INSERT INTO user_checklists (user_id, task_name, status, due_date)
SELECT 
    c.system_id,
    'Review BAS lodgement',
    'completed',
    '2024-10-28'
FROM clients c WHERE c.email = 'emma.test@fdctax.com.au';

INSERT INTO user_checklists (user_id, task_name, status, due_date)
SELECT 
    c.system_id,
    'Upload bank statement',
    'pending',
    CURRENT_DATE + INTERVAL '3 days'
FROM clients c WHERE c.email = 'emma.test@fdctax.com.au';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Luna Context Schema applied successfully!';
    RAISE NOTICE '✅ Added columns to clients table';
    RAISE NOTICE '✅ Created user_checklists table';
    RAISE NOTICE '✅ Created user_conversations table';
    RAISE NOTICE '✅ Inserted 3 test users';
    RAISE NOTICE '✅ Inserted sample checklist items';
END $$;
