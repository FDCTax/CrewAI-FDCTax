-- ==========================================
-- TEST CLIENTS SETUP + TECH HELP PERMISSION
-- SANDBOX PRE-BETA SIMULATION
-- ==========================================

-- 1. Add new columns to clients table for client type and tech help permission
ALTER TABLE crm.clients 
ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'DIY/Luna' CHECK (client_type IN ('MyFDC Only', 'DIY/Luna', 'Full Service')),
ADD COLUMN IF NOT EXISTS client_access_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_turnover DECIMAL(12,2);

-- 2. Create Audit Logs table
CREATE TABLE IF NOT EXISTS crm.audit_logs (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('agent', 'educator', 'system', 'admin')),
    user_id VARCHAR(100),
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'edit', 'create', 'delete', 'approve', 'reject', 'submit')),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    client_id INTEGER REFERENCES crm.clients(system_id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_type ON crm.audit_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON crm.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON crm.audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON crm.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON crm.audit_logs(table_name);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Test clients setup schema applied successfully!';
    RAISE NOTICE '✅ Added client_type, client_access_approved, estimated_turnover columns';
    RAISE NOTICE '✅ Created crm.audit_logs table';
END $$;
