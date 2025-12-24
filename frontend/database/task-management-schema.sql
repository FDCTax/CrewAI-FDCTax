-- ==========================================
-- TASK MANAGEMENT ENHANCEMENT - SANDBOX ONLY
-- CRITICAL: Deploy Today
-- ==========================================

-- Add new columns to tasks table for advanced task management
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS input_type VARCHAR(20) DEFAULT 'none' CHECK (input_type IN ('none', 'amount', 'text', 'file', 'dropdown', 'radio')),
ADD COLUMN IF NOT EXISTS custom_options TEXT[],
ADD COLUMN IF NOT EXISTS notify_on_complete BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS client_response TEXT,
ADD COLUMN IF NOT EXISTS client_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS client_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS client_comment TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS agent_notes TEXT;

-- Add submitted status to tasks
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'submitted', 'completed', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_submitted_at ON tasks(submitted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_input_type ON tasks(input_type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Task Management schema applied successfully!';
    RAISE NOTICE '✅ Added input_type, custom_options, notify_on_complete columns';
    RAISE NOTICE '✅ Added client_response, client_amount, client_files, client_comment columns';
    RAISE NOTICE '✅ Added submitted status and agent_notes';
END $$;
